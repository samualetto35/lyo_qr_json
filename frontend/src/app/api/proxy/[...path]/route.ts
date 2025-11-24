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

  const fetchInit: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchInit.body = request.body
  }

  const response = await fetch(targetUrl, fetchInit)

  const responseHeaders = new Headers(response.headers)
  hopByHopHeaders.forEach((header) => responseHeaders.delete(header))
  responseHeaders.delete('content-encoding')

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

type RouteParams = {
  params: { path: string[] }
}

const handler = (request: NextRequest, { params }: RouteParams) =>
  proxyRequest(request, params)

export { handler as GET }
export { handler as POST }
export { handler as PUT }
export { handler as PATCH }
export { handler as DELETE }
export { handler as OPTIONS }

