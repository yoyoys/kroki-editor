#!/usr/bin/env node
// Encode/decode a diagram source the same way Kroki (and this app) does:
// zlib deflate (level 9) -> base64url. Mirrors src/lib/encoding.ts.
//
//   pnpm encode < diagram.puml      # source        -> encoded
//   pnpm decode <<< 'eNpl...'       # encoded string -> source
import { Buffer } from 'node:buffer'
import process from 'node:process'
import pako from 'pako'

function encode(source) {
  const bytes = pako.deflate(new TextEncoder().encode(source), { level: 9 })
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode(encoded) {
  const b64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/')
  const bytes = pako.inflate(Buffer.from(b64, 'base64'))
  return new TextDecoder().decode(bytes)
}

const mode = process.argv[2]
if (mode !== 'encode' && mode !== 'decode') {
  process.stderr.write('Usage: node scripts/codec.mjs <encode|decode>  (reads stdin, writes stdout)\n')
  process.exit(1)
}

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => (input += chunk))
process.stdin.on('end', () => {
  const out = mode === 'encode' ? encode(input) : decode(input)
  process.stdout.write(`${out}\n`)
})
