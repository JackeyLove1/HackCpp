import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5';
const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

const normalizePath = (url: string) => url.replace(/\/$/, '');

export async function POST(req: Request) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    messages = [],
    chapterContent = '',
    selectedText = '',
    aiSettings,
  } = payload ?? {};

  const apiKey = (aiSettings?.apiKey || process.env.OPENAI_API_KEY || '').trim();
  const baseUrl = normalizePath(
    (aiSettings?.baseUrl || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL
  );
  const model =
    (aiSettings?.model || DEFAULT_MODEL).trim() ||
    DEFAULT_MODEL;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  const sanitizedChapter =
    typeof chapterContent === 'string'
      ? chapterContent.slice(0, 12000)
      : '';
  const sanitizedSelection =
    typeof selectedText === 'string'
      ? selectedText.slice(0, 2000)
      : '';

  const normalizedMessages: ChatMessage[] = Array.isArray(messages)
    ? messages
        .filter(
          (message): message is ChatMessage =>
            message &&
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string'
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        }))
    : [];

  const contextParts = [
    'You are a concise study assistant. Use the provided chapter content as primary context when replying.',
    sanitizedSelection && `The user highlighted: """${sanitizedSelection}"""`,
    sanitizedChapter && `Chapter content:\n${sanitizedChapter}`,
    'Respond in the same language the user uses and keep answers brief but clear.',
  ].filter(Boolean);

  const upstreamBody = {
    model,
    temperature: 0.7,
    // Enable streaming from upstream so we can relay chunks to the client.
    stream: true,
    messages: [
      {
        role: 'system',
        content: contextParts.join('\n\n'),
      },
      ...normalizedMessages,
    ],
  };

  try {
    const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        { error: errorText || 'Upstream chat provider returned an error' },
        { status: upstreamResponse.status }
      );
    }

    const upstreamBodyStream = upstreamResponse.body;

    if (!upstreamBodyStream) {
      return NextResponse.json(
        { error: 'Upstream provider did not return a body stream' },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Transform the SSE stream from OpenAI into a plain text stream
    // that the client can append to the assistant message.
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamBodyStream.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE messages are separated by double newlines
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';

            for (const part of parts) {
              const trimmed = part.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;

              const data = trimmed.slice('data:'.length).trim();
              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const json = JSON.parse(data);
                const delta: string =
                  json?.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Ignore malformed JSON chunks from upstream
              }
            }
          }

          // Flush any remaining buffered data (unlikely to form a full message)
          if (buffer) {
            try {
              const maybe = buffer.trim();
              if (maybe.startsWith('data:')) {
                const data = maybe.slice('data:'.length).trim();
                if (data && data !== '[DONE]') {
                  const json = JSON.parse(data);
                  const delta: string =
                    json?.choices?.[0]?.delta?.content ?? '';
                  if (delta) {
                    controller.enqueue(encoder.encode(delta));
                  }
                }
              }
            } catch {
              // ignore
            }
          }

          controller.close();
        } catch (err) {
          console.error('Error while streaming from upstream', err);
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Chat API failed', error);
    return NextResponse.json(
      { error: 'Failed to generate a response. Please try again.' },
      { status: 500 }
    );
  }
}

