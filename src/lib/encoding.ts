import pako from 'pako'

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes)
    bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++)
    bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function encodeDiagram(source: string): string {
  const data = new TextEncoder().encode(source)
  return bytesToBase64Url(pako.deflate(data, { level: 9 }))
}

export function decodeDiagram(encoded: string): string {
  const data = pako.inflate(base64UrlToBytes(encoded))
  return new TextDecoder().decode(data)
}
