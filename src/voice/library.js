
import wav from 'wav-encoder'

export class Library {
  constructor(sampleRate = 48000) {
    this.entryMap = new Map()
    this.audioMap = new Map()
    const ctx = this.audioContext = new OfflineAudioContext({ sampleRate, length: 1 })
    this.decodeAudioData = buffer => ctx.decodeAudioData(buffer)
    const pau = this.pau = new AudioBuffer({ sampleRate, length: Math.trunc(0.2 * sampleRate) })
    this.audioMap.set('pau', Promise.resolve(pau))
  }
  injectUnzipEntries(entries) {
    for (const entry of entries) {
      if (entry == null) { continue }
      let name = String(entry.name), i
      name = name.slice(name.lastIndexOf('/') + 1)
      if ((i = name.indexOf('.')) > 0) { name = name.slice(0, i) }
      this.entryMap.set(name, entry)
    }
  }
  has(name) {
    return this.audioMap.has(name) || this.entryMap.has(name)
  }
  get(name) {
    let audio = this.audioMap.get(name)
    if (audio != null) { return audio }
    const entry = this.entryMap.get(name)
    if (entry == null) { return null }
    audio = Promise.resolve(entry.arrayBuffer()).then(this.decodeAudioData)
    this.audioMap.set(name, audio)
    return audio
  }
  async encodeAudioData(list) {
    const { sampleRate } = this.audioContext
    const data = new Float32Array(await new Blob(list).arrayBuffer())
    const wave = await wav.encode({ sampleRate, channelData: [data] })
    return new Blob([wave])
  }
  async concat(list) {
    const result = [this.pau]
    for (const name of list) {
      const audio = await this.get(name)
      if (audio == null) { continue }
      result.push(audio.getChannelData(0))
    }
    result.push(this.pau)
    return this.encodeAudioData(result)
  }
}