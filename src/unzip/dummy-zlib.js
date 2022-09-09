
import { Inflate } from 'fflate'
import { Transform } from 'stream'
export const createInflateRaw = () => {
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      let err = null; try {
        inflate.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), false)
      } catch (e) { err = e }
      callback(err)
    },
    async flush(callback) {
      let err = null; try {
        inflate.push(new Uint8Array(0), true)
        await final
      } catch (e) { err = e }
      callback(err)
    }
  })
  let finalCallback
  const final = new Promise(ok => { finalCallback = ok })
  const inflate = new Inflate((chunk, final) => {
    transform.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
    if (final) { finalCallback() }
  })
  return transform
}