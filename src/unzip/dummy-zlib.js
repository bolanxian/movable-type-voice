
import { Buffer } from 'buffer'
import { Transform } from 'stream'
import { Inflate } from 'fflate'

const createTransform = (FflateStream) => {
  let finalCallback
  const final = new Promise(ok => { finalCallback = ok })
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      let err = null; try {
        stream.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), false)
      } catch (e) { err = e }
      callback(err)
    },
    async flush(callback) {
      let err = null; try {
        stream.push(new Uint8Array(0), true)
        await final
      } catch (e) { err = e }
      callback(err)
    }
  })
  const stream = new FflateStream((chunk, final) => {
    transform.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
    if (final) { finalCallback() }
  })
  return transform
}

export const createInflateRaw = () => createTransform(Inflate)
