
import { Buffer } from 'buffer'
import { Readable } from 'stream'

export const streamToBlob = (readable) => new Promise((ok, reject) => {
  const chunks = []
  readable.on('data', data => { chunks.push(data) })
  readable.on('end', () => ok(new Blob(chunks)))
  readable.on('error', err => reject(err));
})
class FromNodeSource {
  #readable
  constructor(readable) {
    this.#readable = readable
  }
  get readable() { return this.#readable }
  async start(controller) {
    const readable = this.#readable = await this.#readable
    readable.on('data', chunk => {
      controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      readable.pause()
    })
    readable.on('end', () => controller.close())
    readable.on('error', err => controller.error(err))
    readable.pause()
  }
  pull(controller) {
    this.#readable.resume()
  }
  cancel(reason) {
    this.#readable.destroy(reason)
  }
}
export const readableFromNode = (readable) => new ReadableStream(new FromNodeSource(readable))

export const readableToNode = (readable) => {
  let reader
  return new Readable({
    async construct(cb) {
      let err = null; try {
        reader = (await readable).getReader()
      } catch (e) { err = e }
      cb(err)
    },
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read()
        if (done) { this.push(null); return }
        this.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
      } catch (e) { this.destroy(e) }
    },
    async destroy(err, cb) {
      try {
        if (reader != null) { await reader.cancel(err) }
      } catch (e) { err = e }
      cb(err)
    }
  })
}