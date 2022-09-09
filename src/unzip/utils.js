
import { Readable } from 'stream'

export const streamToBlob = (readable) => new Promise((ok, reject) => {
  const chunks = []
  readable.on('data', (data) => { chunks.push(data) })
  readable.on('end', () => ok(new Blob(chunks)))
  readable.on('error', err => reject(err));
})
export const readableToNode = (readable) => {
  const reader = readable.getReader()
  return new Readable({
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read()
        if (done) { this.push(null); return }
        this.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      } catch (e) { this.destroy(e) }
    },
    async destroy(err, cb) {
      try {
        await reader.cancel(err)
      } catch (e) { err = e }
      cb(err)
    }
  })
}