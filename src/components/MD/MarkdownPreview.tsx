"use client";

import React from 'react';
import type { JSX } from 'react';
import katex from 'katex';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { unified } from 'unified';

import { stripFrontMatter } from '@/lib/markdown/strip-front-matter';

type Props = {
  children?: string;
  paragraphClass?: string;
};

type MdNode = {
  type: string;
  [key: string]: any;
};

type MdRoot = {
  type: string;
  children?: MdNode[];
};

const FALLBACK_TEXT = 'Nothing to preview yet.';

const renderMath = (value: string, inline: boolean, key: React.Key) => {
  try {
    const html = katex.renderToString(value, {
      displayMode: !inline,
      throwOnError: false,
      errorColor: '#cc0000',
    });

    if (inline) {
      return (
        <span
          key={key}
          className="katex-inline align-baseline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return (
      <div
        key={key}
        className="katex-display my-4 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    console.error('Math rendering failed', error);
    return (
      <code key={key} className="rounded bg-destructive/10 px-1 py-0.5 text-destructive">
        {value}
      </code>
    );
  }
};

export default function ReactMarkdown({ children, paragraphClass }: Props) {
  const rendered = React.useMemo(() => {
    const source = stripFrontMatter(children ?? '');
    if (!source.trim()) {
      return FALLBACK_TEXT;
    }
    try {
      const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
      const parsed = processor.parse(source);
      const root = processor.runSync(parsed) as MdRoot;
      const output = renderNodes(root.children, paragraphClass);
      return output.length ? output : FALLBACK_TEXT;
    } catch (error) {
      console.error('Markdown preview failed to render', error);
      return <pre className="text-destructive whitespace-pre-wrap text-xs">{source}</pre>;
    }
  }, [children, paragraphClass]);

  return <>{rendered ?? FALLBACK_TEXT}</>;
}

function renderNodes(nodes: MdNode[] = [], paragraphClass?: string) {
  return nodes.map((node, index) => renderNode(node, index, paragraphClass));
}

function renderNode(node: MdNode, key: React.Key, paragraphClass?: string): React.ReactNode {
  switch (node.type) {
    case 'text':
      return <React.Fragment key={key}>{node.value}</React.Fragment>;
    case 'paragraph':
      return <p key={key} className={paragraphClass}>{renderChildren(node.children, paragraphClass)}</p>;
    case 'heading': {
      const depth = Math.min(Math.max(node.depth ?? 1, 1), 6);
      const HeadingTag = `h${depth}` as keyof JSX.IntrinsicElements;
      return <HeadingTag key={key}>{renderChildren(node.children, paragraphClass)}</HeadingTag>;
    }
    case 'strong':
      return <strong key={key}>{renderChildren(node.children, paragraphClass)}</strong>;
    case 'emphasis':
      return <em key={key}>{renderChildren(node.children, paragraphClass)}</em>;
    case 'delete':
      return <del key={key}>{renderChildren(node.children, paragraphClass)}</del>;
    case 'inlineCode':
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5">
          {node.value}
        </code>
      );
    case 'code':
      return (
        <pre key={key} className="overflow-auto rounded bg-muted p-3 text-xs">
          <code>{node.value}</code>
        </pre>
      );
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 pl-3 italic text-muted-foreground">
          {renderChildren(node.children, paragraphClass)}
        </blockquote>
      );
    case 'list': {
      const ListTag = node.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={key} className="ml-4 list-disc space-y-1 pl-2 marker:text-muted-foreground">
          {renderChildren(node.children, paragraphClass)}
        </ListTag>
      );
    }
    case 'listItem':
      return <li key={key}>{renderChildren(node.children, paragraphClass)}</li>;
    case 'link':
      return (
        <a
          key={key}
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {renderChildren(node.children, paragraphClass)}
        </a>
      );
    case 'image':
      return (
        <img
          key={key}
          src={node.url || ''}
          alt={node.alt || ''}
          title={node.title || undefined}
          className="my-2 max-w-full rounded"
        />
      );
    case 'break':
      return <br key={key} />;
    case 'thematicBreak':
      return <hr key={key} className="my-4" />;
    case 'table':
      return renderTable(node, key, paragraphClass);
    case 'inlineMath':
      return renderMath(node.value || '', true, key);
    case 'math':
      return renderMath(node.value || '', false, key);
    default:
      if ('children' in node && node.children) {
        return <React.Fragment key={key}>{renderChildren(node.children, paragraphClass)}</React.Fragment>;
      }
      return null;
  }
}

function renderTable(table: MdNode, key: React.Key, paragraphClass?: string) {
  if (!table.children.length) {
    return null;
  }

  const [headRow, ...bodyRows] = table.children;
  return (
    <table key={key} className="my-3 w-full table-auto border-collapse text-sm">
      <thead>
        {renderTableRow(headRow, 'th', undefined, paragraphClass)}
      </thead>
      <tbody>{bodyRows.map((row: MdNode, index: number) => renderTableRow(row, 'td', index, paragraphClass))}</tbody>
    </table>
  );
}

function renderTableRow(row: MdNode, cellTag: 'td' | 'th', key?: React.Key, paragraphClass?: string) {
  return (
    <tr key={key}>
      {row.children.map((cell: MdNode, index: number) =>
        React.createElement(
          cellTag,
          {
            key: index,
            className: 'border px-3 py-2 text-left align-top',
          },
          renderChildren((cell as MdNode).children, paragraphClass)
        )
      )}
    </tr>
  );
}

function renderChildren(children?: MdNode[], paragraphClass?: string) {
  if (!children) return null;
  return children.map((child, index) => renderNode(child, index, paragraphClass));
}
