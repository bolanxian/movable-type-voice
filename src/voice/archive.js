
import formatBytes from 'format-bytes'
import pinyinUtil from 'ipinyinjs/pinyinUtil'
import { UnzipEntry } from '../unzip/unzip-entry'
import dictionary from './dictionary.json'
import { Library } from './library'
import { ProgressSource } from './progress'

const baseParserList = [
  [new RegExp(Object.keys(dictionary).join('|')), str => dictionary[str]],
  [/[\s、，。：；——]+/, () => 'pau'],
  [/[\u4E00-\u9FEF]/, str => pinyinUtil.getPinyin(str, ' ', !1, !1)]
]
const { get } = Reflect, regProto = RegExp.prototype, { matchAll } = String.prototype
const formatProgress = ({ loaded, total, percent, speed }) => {
  return `[${percent}%][${formatBytes(Math.trunc(speed))}/s][${formatBytes(loaded)}/${formatBytes(total)}]`
}
export class Archive {
  static createParser(list) {
    const map = new Map(list)
    const reg = new RegExp(Array.from(map.keys(), key => `(${get(regProto, 'source', key)})`).join('|'), 'g')
    const values = Array.from(map.values())
    const gen = function* (str) {
      for (const matchs of matchAll.call(str, reg)) {
        let i, str; for (i = 1; i < matchs.length; i++) {
          if ((str = matchs[i]) != null) { yield values[i - 1](str); break }
        }
      }
    }
    return gen
  }
  constructor(name) {
    this.name = name
    this.url = `${name}.zip`
    this.blobPromise = null
  }
  async createBlob(init = {}) {
    let response = await fetch(this.url)
    if (init.onProgress != null) {
      response = ProgressSource.create(response, init)
    }
    return await response.blob()
  }
  getBlob(init) {
    if (this.blobPromise == null) {
      this.blobPromise = this.createBlob(init)
    }
    return this.blobPromise
  }
  async createEntriesOld(init) {
    const blob = await this.getBlob(init)
    const buffer = Buffer.from(await blob.arrayBuffer())
    const entries = await UnzipEntry.fromBuffer(buffer)
    return entries
  }
  async createEntries(init) {
    const blob = await this.getBlob(init)
    const entries = await UnzipEntry.fromBlob(blob)
    return entries
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init)
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate), { name } = this
    lib.injectUnzipEntries(await this.getEntries(init.onTip != null ? {
      onProgress(progress) { init.onTip(`${name}${formatProgress(progress)}`) }
    } : null))
    this.parse = Archive.createParser(baseParserList)
    return lib
  }
  async getVoiceLibrary(sampleRate, init) {
    if (this.libraryPromise != null) try {
      const lib = await this.libraryPromise
      if (lib != null && lib.audioContext.sampleRate === sampleRate) {
        return lib
      }
    } catch (e) { }
    this.libraryPromise = this.createVoiceLibrary(sampleRate, init)
    return this.libraryPromise
  }
}
export class ArchiveWithEx extends Archive {
  constructor(name) {
    super(`${name}.ex`)
    this.name = name
    this.main = new Archive(name)
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate)
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init.onTip != null ? {
        onProgress(progress) { init.onTip(`${arch.name}${formatProgress(progress)}`) }
      } : null))
    }
    const table = JSON.parse(await lib.entryMap.get('table').text())
    lib.entryMap.delete('table')
    this.parse = Archive.createParser([
      [new RegExp(Object.keys(table).join('|')), str => table[str]],
      ...baseParserList
    ])
    return lib
  }
}