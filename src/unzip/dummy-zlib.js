
import { Buffer } from 'buffer'
import { Duplex, Transform } from 'stream'
import { Inflate } from 'fflate'

const duplexToNode = (pair) => {
  let reader, writer
  return new Duplex({
    async construct(callback) {
      let err = null; try {
        reader = pair.readable.getReader()
        writer = pair.writable.getWriter()
        await writer.ready
      } catch (e) { err = e }
      callback(err)
    },
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read()
        if (done) { this.push(null); return }
        this.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      } catch (e) { this.destroy(e) }
    },
    async write(chunk, encoding, callback) {
      let err = null; try {
        await writer.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      } catch (e) { err = e }
      callback(err)
    },
    async final(callback) {
      let err = null; try {
        await writer.close()
      } catch (e) { err = e }
      callback(err)
    },
    async destroy(err, cb) {
      try {
        if (writer != null) { await writer.abort(err) }
        else if (reader != null) { await reader.cancel(err) }
      } catch (e) { err = e }
      cb(err)
    }
  })
}

const createTransform = (FflateStream) => {
  let final, finalCallback
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      let err = null; try {
        stream.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), false)
      } catch (e) { err = e }
      callback(err)
    },
    flush(callback) {
      let err = null; try {
        stream.push(new Uint8Array(0), true)
        if (!final) { finalCallback = callback; return }
      } catch (e) { err = e }
      callback(err)
    }
  })
  const stream = new FflateStream((chunk, _) => {
    transform.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
    final = _
    if (final && finalCallback != null) { finalCallback() }
  })
  return transform
}

const createInflateRawNativeNative = () => new DecompressionStream('deflate-raw')
const hasInflateRawNative = (() => {
  try {
    createInflateRawNativeNative()
    return true
  } catch (e) {
    return false
  }
})()

export const createInflateRawNative = hasInflateRawNative ? () => duplexToNode(createInflateRawNativeNative()) : null
export const createInflateRawFflate = () => createTransform(Inflate)
export const createInflateRaw = createInflateRawNative ?? createInflateRawFflate
