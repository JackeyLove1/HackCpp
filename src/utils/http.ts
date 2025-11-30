/**
 * React HTTP 请求封装
 * 功能:
 *   1. 自动拼接 baseURL
 *   2. 请求超时处理
 *   3. 自动添加请求头标识
 *   4. 自动添加 token
 *   5. 统一错误处理
 *   6. TypeScript 类型支持
 */

// ============= 类型定义 =============
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, any> // URL 参数
  data?: any // 请求体数据
  timeout?: number
  headers?: Record<string, string>
}

export interface Response<T = any> {
  code: number
  message: string
  data: T
}

export enum ErrorCode {
  SUCCESS = 0,
  UNAUTHORIZED = 401,
}

// ============= 配置 =============
const DEV_BASE_URL = 'http://localhost:8101'
const PROD_BASE_URL = 'https://kaogong.asyncook.com'

export const baseURL = process.env.NODE_ENV === 'development' 
  ? DEV_BASE_URL 
  : PROD_BASE_URL

const DEFAULT_TIMEOUT = 60000

// ============= Token 管理 =============
// 你可以根据实际情况调整 token 的获取方式
// 例如从 Redux/Zustand/Context 中获取，或从 localStorage 获取
export const getToken = (): string => {
  return localStorage.getItem('token') || ''
}

export const getTokenName = (): string => {
  return localStorage.getItem('tokenName') || 'Authorization'
}

export const clearToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenName')
}

// ============= 请求拦截器 =============
const requestInterceptor = (options: RequestOptions): RequestOptions => {
  // 1. 拼接完整 URL
  if (!options.url.startsWith('http')) {
    options.url = baseURL + options.url
  }

  // 2. 设置默认超时时间
  if (!options.timeout) {
    options.timeout = DEFAULT_TIMEOUT
  }

  // 3. 设置请求头（避免重复设置 Content-Type）
  const headers: Record<string, string> = {
    'source-client': 'web',
    ...options.headers,
  }

  // 如果调用方没有显式指定 Content-Type，则设置默认值
  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === 'content-type'
  )
  if (!hasContentType) {
    headers['Content-Type'] = 'application/json'
  }

  // 4. 添加 token
  const token = getToken()
  const tokenName = getTokenName()
  if (token) {
    headers[tokenName] = token
  }

  if (process.env.NODE_ENV === 'development') {
    headers['shangan-wx'] = '00f569b2-8408-4b45-b8d7-ae10844177b7'
  }

  options.headers = headers

  return options
}

// ============= 响应拦截器 =============
const responseInterceptor = async <T>(
  response: globalThis.Response
): Promise<Response<T>> => {
  const data: Response<T> = await response.json()

  // 2xx 状态码
  if (response.ok) {
    if (data.code === ErrorCode.SUCCESS) {
      return data
    } else {
      // 业务错误
      throw new Error(data.message || '请求失败')
    }
  }

  // 401 未授权
  if (response.status === 401) {
    clearToken()
    // 跳转到登录页 - 根据你的路由方式调整
    window.location.href = '/login'
    throw new Error('未授权，请重新登录')
  }

  // 其他 HTTP 错误
  throw new Error(data.message || `请求错误: ${response.status}`)
}

// ============= 核心请求函数 =============
export const http = async <T = any>(
  options: RequestOptions
): Promise<Response<T>> => {
  // 请求拦截
  const config = requestInterceptor(options)

  // 处理 URL 参数
  let url = config.url
  if (config.params) {
    const queryString = new URLSearchParams(config.params).toString()
    url += (url.includes('?') ? '&' : '?') + queryString
  }

  // 处理请求体
  const body = config.data ? JSON.stringify(config.data) : undefined

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout!)

  try {
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: config.headers,
      body,
      signal: controller.signal,
      ...config,
    })

    clearTimeout(timeoutId)

    // 响应拦截
    return await responseInterceptor<T>(response)
  } catch (error) {
    clearTimeout(timeoutId)

    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }

    // 处理网络错误
    if (error instanceof TypeError) {
      throw new Error('网络错误，请检查网络连接')
    }

    throw error
  }
}

// ============= 便捷方法 =============
export const request = {
  get: <T = any>(url: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'url' | 'method' | 'params'>) => {
    return http<T>({ url, method: 'GET', params, ...options })
  },

  post: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
    return http<T>({ url, method: 'POST', data, ...options })
  },

  put: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
    return http<T>({ url, method: 'PUT', data, ...options })
  },

  delete: <T = any>(url: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'url' | 'method' | 'params'>) => {
    return http<T>({ url, method: 'DELETE', params, ...options })
  },

  patch: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) => {
    return http<T>({ url, method: 'PATCH', data, ...options })
  },
}

// ============= 文件上传 =============
export const uploadFile = async <T = any>(
  url: string,
  file: File,
  options?: Omit<RequestOptions, 'url' | 'data'>
): Promise<Response<T>> => {
  const formData = new FormData()
  formData.append('file', file)

  const config = requestInterceptor({
    url,
    method: 'POST',
    ...options,
  })

  // 移除 Content-Type，让浏览器自动设置（包含 boundary）
  delete config.headers!['Content-Type']

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout!)

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return await responseInterceptor<T>(response)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('上传超时，请稍后重试')
    }

    if (error instanceof TypeError) {
      throw new Error('网络错误，请检查网络连接')
    }

    throw error
  }
}

export default request