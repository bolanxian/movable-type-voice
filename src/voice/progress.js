
import speedometer from 'speedometer'
const { min } = Math

export class Progress {
  constructor(onProgress) {
    this.loaded = this.total = 0
    this.streamSpeed = speedometer()
    this.onProgress = onProgress
  }
  get percent() {
    return min(99.9, this.loaded / this.total * 100).toFixed(1)
  }
  get speed() {
    return this.streamSpeed(0)
  }
  push(chunkLength) {
    this.loaded += chunkLength
    this.streamSpeed(chunkLength)
    this.onProgress(this)
  }
}
export class ProgressSource {
  constructor(response, onProgress) {
    const { body, headers } = response
    this.$body = body
    this.$progress = new Progress(onProgress)
    this.$progress.total = +headers.get('content-length')
    this.$progress.push(0)
  }
  start() {
    this.$reader = this.$body.getReader()
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
  static create(response, onProgress) {
    const source = new ProgressSource(response, onProgress)
    const stream = new ReadableStream(source)
    return new Response(stream, response)
  }
}