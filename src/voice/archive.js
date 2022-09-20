
import pinyinUtil from 'ipinyinjs/pinyinUtil'
import { UnzipEntry } from '../unzip/unzip-entry'
import dictionary from './dictionary.json'
import { Library } from './library'
import { ProgressSource } from './progress'

const baseParserList = [
  [new RegExp(Object.keys(dictionary).join('|')), str => dictionary[str]],
  [/[\s,、，。：；——]+/, () => 'pau'],
  [/[\u4E00-\u9FEF]/, str => pinyinUtil.getPinyin(str, ' ', !1, !1)]
]
const { get } = Reflect, regProto = RegExp.prototype, { matchAll } = String.prototype
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
    const { status } = response
    if (status !== 200) {
      response.body?.cancel()
      throw new TypeError(`Request failed with status code ${status}`)
    }
    if (init.onFetchProgress != null) {
      response = ProgressSource.create(response, init.onFetchProgress)
    }
    const blob = await response.blob()
    init.onFetchEnd?.()
    return blob
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
    return await UnzipEntry.fromBuffer(buffer)
  }
  async createEntries(init) {
    let result// = await UnzipEntry.fromUrl(this.url)
    if (result != null) { return result }
    const blob = await this.getBlob(init)
    return await UnzipEntry.fromBlob(blob)
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init)
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate), { name } = this
    lib.injectUnzipEntries(await this.getEntries(init.onFetchProgress != null ? {
      onFetchProgress(progress) { init.onFetchProgress(name, progress) },
      onFetchEnd() { init.onFetchEnd?.(name) }
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
    this.main = new Archive(name)
  }
  set name(name) { }
  get name() {
    return `${this.main.name}(原声大碟)`
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate)
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init.onFetchProgress != null ? {
        onFetchProgress(progress) { init.onFetchProgress(arch.name, progress) },
        onFetchEnd() { init.onFetchEnd?.(arch.name) }
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