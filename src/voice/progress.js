
import throughput from 'throughput'
import { slice } from '../utils'
const { MAX_SAFE_INTEGER } = Number, { min } = Math

export let update, final
export class Progress {
  static {
    update = (that, chunkLength) => {
      that.#loaded += chunkLength
      that.#speedometer(chunkLength)
    }
    final = (that) => {
      that.#isFinalized = true
    }
  }
  #loaded = 0
  #total = 0
  #lengthComputable = false
  #speedometer = throughput()
  #isFinalized = false
  constructor(total) {
    total = +total
    if (total > 0 && total <= MAX_SAFE_INTEGER) {
      this.#total = total
      this.#lengthComputable = true
    }
  }
  get loaded() { return this.#loaded }
  get total() { return this.#total }
  get lengthComputable() { return this.#lengthComputable }
  get speed() { return this.#speedometer(0) }
  get percent() {
    if (this.#isFinalized) { return '100%' }
    if (!this.#lengthComputable) { return 'NaN%' }
    let percent = min(99.9, 100 * this.#loaded / this.#total)
    if (!(percent >= 0)) { return 'NaN%' }
    return `${slice(percent, 0, 4)}%`
  }
}
class ProgressTransformer {
  #progress
  constructor(progress) {
    this.#progress = progress
  }
  transform(chunk, controller) {
    update(this.#progress, chunk.byteLength)
    controller.enqueue(chunk)
  }
  flush(controller) {
    final(this.#progress)
  }
}
export class ProgressStream extends TransformStream {
  static fromResponse(response) {
    const { body, headers } = response
    const that = new this(headers.get('content-length'))
    const readable = body.locked ? that.readable : body.pipeThrough(that)
    return [that, new Response(readable, response)]
  }
  #progress
  constructor(total) {
    const progress = new Progress(total)
    super(new ProgressTransformer(progress))
    this.#progress = progress
  }
  get progress() { return this.#progress }
}