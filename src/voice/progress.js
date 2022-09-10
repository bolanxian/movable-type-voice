
import speedometer from 'speedometer'

export class Progress {
  constructor(onProgress, emitDelay = 200) {
    this.total = 0
    this.loaded = 0
    this.speed = 0
    this.streamSpeed = speedometer()
    this.emitDelay = emitDelay
    this.eventStart = 0
    this.percent = '0'
    this.onProgress = onProgress
  }
  flow(chunk) {
    const chunkLength = chunk.length
    const loaded = this.loaded += chunkLength
    this.speed = this.streamSpeed(chunkLength)
    this.percent = (loaded / this.total * 100).toFixed(2)
    const now = Date.now()
    if (this.eventStart === 0) { this.eventStart = now }
    if (now - this.eventStart > this.emitDelay || this.loaded >= this.total) {
      this.eventStart = now
      this.onProgress(this)
    }
  }
}
const noop = () => null
export class ProgressSource {
  constructor(response, {
    emitDelay = 200,
    onProgress = noop,
    onComplete = noop,
    onError = noop,
  } = {}) {
    const { body, headers } = response
    this.$progress = new Progress(onProgress, emitDelay)
    this.$progress.total = +headers.get('content-length')
    this.$progress.onProgress(this.$progress)
    this.$body = body
    //this.$onProgress = onProgress
    this.$onComplete = onComplete
    this.$onError = onError
  }
  start() {
    this.$reader = this.$body.getReader()
  }
  async pull(controller) {
    const { done, value } = await this.$reader.read()
    done ? controller.close() : controller.enqueue(value)
    try {
      if (done) { this.$onComplete(); return }
      this.$progress.flow(value)
    } catch (error) {
      this.$onError(error)
    }
  }
  static create(response, init) {
    const stream = new ReadableStream(new ProgressSource(response, init))
    return new Response(stream, response)
  }
}