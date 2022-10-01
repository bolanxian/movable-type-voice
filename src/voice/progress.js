
import speedometer from 'speedometer'
const { min } = Math, noop = () => { }

export class Progress {
  #loaded
  #total
  #streamSpeed
  #speed
  #onProgress
  constructor(total, onProgress = noop) {
    this.#loaded = 0
    this.#total = total
    this.#streamSpeed = speedometer()
    this.#onProgress = onProgress
  }
  get loaded() { return this.#loaded }
  get total() { return this.#total }
  get percent() {
    return min(99.9, 100 * this.#loaded / this.#total).toFixed(1)
  }
  get speed() {
    const speed = this.#speed
    if (speed != null) { return speed }
    return this.#streamSpeed(0)
  }
  push(chunkLength) {
    this.#loaded += chunkLength
    this.#speed = this.#streamSpeed(chunkLength)
    this.#onProgress(this)
    this.#speed = null
  }
}
export class ProgressSource {
  constructor(response, onProgress, onChunk = noop) {
    const { body, headers } = response
    this.$reader = body.getReader()
    const progress = this.$progress = new Progress(+headers.get('content-length'), onChunk)
    onProgress(progress)
  }
  async pull(controller) {
    const { done, value } = await this.$reader.read()
    if (done) { controller.close(); return }
    controller.enqueue(value)
    this.$progress.push(value.byteLength)
  }
  async cancel(reason) {
    await this.$reader.cancel(reason)
  }
  static create(response, onProgress, onChunk) {
    const source = new ProgressSource(response, onProgress, onChunk)
    const stream = new ReadableStream(source)
    return new Response(stream, response)
  }
}