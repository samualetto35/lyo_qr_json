import { NextRequest, NextResponse } from 'next/server'

const targetBase =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const hopByHopHeaders = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 })
    }

    const path = params.path?.join('/') ?? ''
    const url = new URL(request.url)
    const search = url.search ? url.search : ''
    const base = targetBase.replace(/\/$/, '')
    const targetUrl = `${base}/${path}${search}`

    const headers = new Headers(request.headers)
    hopByHopHeaders.forEach((header) => headers.delete(header))
    headers.delete('content-length')
    headers.delete('host')

    const fetchInit: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text()
      if (body) {
        fetchInit.body = body
      }
    }

    const response = await fetch(targetUrl, fetchInit)

    const responseHeaders = new Headers(response.headers)
    hopByHopHeaders.forEach((header) => responseHeaders.delete(header))
    responseHeaders.delete('content-encoding')
    responseHeaders.set('access-control-allow-origin', '*')
    responseHeaders.set('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    responseHeaders.set('access-control-allow-headers', 'Content-Type, Authorization')

    const responseBody = await response.text()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('Proxy error:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Proxy error', error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

type RouteParams = {
  params: { path: string[] }
}

const handler = async (request: NextRequest, { params }: RouteParams) => {
  return proxyRequest(request, params)
}

export { handler as GET }
export { handler as POST }
export { handler as PUT }
export { handler as PATCH }
export { handler as DELETE }
export { handler as OPTIONS }

