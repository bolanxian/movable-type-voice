
import pinyinUtil from 'ipinyinjs/pinyinUtil'
import { UnzipEntry } from '../unzip/unzip-entry'
import dictionary from './dictionary.json'
import { Library } from './library'
const baseParserList = [
  [new RegExp(Object.keys(dictionary).join('|')), str => dictionary[str]],
  [/[\s、，。：；——]+/, () => 'pau'],
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
  async createBlob() {
    const response = await fetch(this.url)
    return await response.blob()
  }
  getBlob() {
    if (this.blobPromise == null) {
      this.blobPromise = this.createBlob()
    }
    return this.blobPromise
  }
  async createEntriesOld() {
    const blob = await this.getBlob()
    const buffer = Buffer.from(await blob.arrayBuffer())
    const entries = await UnzipEntry.fromBuffer(buffer)
    return entries
  }
  async createEntries() {
    const blob = await this.getBlob()
    const entries = await UnzipEntry.fromBlob(blob)
    return entries
  }
  getEntries() {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries()
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate) {
    const entries = await this.getEntries()
    const lib = new Library(sampleRate)
    lib.injectUnzipEntries(entries)
    this.parse = Archive.createParser(baseParserList)
    return lib
  }
  async getVoiceLibrary(sampleRate) {
    if (this.libraryPromise != null) try {
      const lib = await this.libraryPromise
      if (lib != null && lib.audioContext.sampleRate === sampleRate) {
        return lib
      }
    } catch (e) { }
    this.libraryPromise = this.createVoiceLibrary(sampleRate)
    return this.libraryPromise
  }
}
export class ArchiveWithEx extends Archive {
  constructor(name) {
    super(`${name}.ex`)
    this.main = new Archive(name)
  }
  async createVoiceLibrary(sampleRate) {
    const lib = new Library(sampleRate)
    lib.injectUnzipEntries(await this.main.getEntries())
    lib.injectUnzipEntries(await this.getEntries())
    const table = JSON.parse(await lib.entryMap.get('table').text())
    lib.entryMap.delete('table')
    this.parse = Archive.createParser([
      [new RegExp(Object.keys(table).join('|')), str => table[str]],
      ...baseParserList
    ])
    return lib
  }
}