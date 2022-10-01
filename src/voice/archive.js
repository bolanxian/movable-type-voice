
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
  static cachePromise = caches.open('movable-type-voice')
  constructor(url, name) {
    this.blobPromise = null
    this.entriesPromise = null
    this.libraryPromise = null
    this.parse = null
    if (url instanceof Blob) {
      this.url = null
      this.name = name ?? (url instanceof File ? url.name : '')
      this.blobPromise = Promise.resolve(url)
    } else {
      this.url = `${url}.zip`
      this.name = name ?? url
    }
  }
  async createBlob(init = {}) {
    const { url, name } = this, cache = await Archive.cachePromise
    let response = await cache.match(url), put, onFetchProgress
    if (response != null) {
      const { headers } = response
      const date = headers.get('date')
      if (!((Date.now() - Date.parse(date)) < (1000 * 60 * 60 * 24 * 7))) {
        const hasModifiedHeaders = {}
        const etag = headers.get('etag'), lastModified = headers.get('last-modified')
        if (etag != null) {
          hasModifiedHeaders['if-none-match'] = etag
        }
        if (lastModified != null) {
          hasModifiedHeaders['if-modified-since'] = lastModified
        }
        const hasModified = await fetch(url, { headers: hasModifiedHeaders })
        if (hasModified.status === 304) {
          for (const [key, value] of hasModified.headers) {
            headers.set(key, value)
          }
          put = cache.put(url, response.clone())
        } else if (hasModified.status === 200) {
          response.body?.cancel()
          response = hasModified
          put = cache.put(url, response.clone())
          onFetchProgress = init.onFetchProgress
        } else {
          response.body?.cancel()
          hasModified.body?.cancel()
          throw new TypeError(`Request failed with status code ${hasModified.status}`)
        }
      }
    } else {
      response = await fetch(url)
      if (response.status !== 200) {
        response.body?.cancel()
        throw new TypeError(`Request failed with status code ${response.status}`)
      }
      put = cache.put(url, response.clone())
      onFetchProgress = init.onFetchProgress
    }
    if (onFetchProgress != null) {
      response = ProgressSource.create(response, (progress) => { onFetchProgress(name, progress) })
    }
    const blob = await response.blob()
    if (put != null) { await put }
    init.onFetchEnd?.(name)
    return blob
  }
  getBlob(init) {
    if (this.blobPromise == null) {
      this.blobPromise = this.createBlob(init)
    }
    return this.blobPromise
  }
  async createEntries(init) {
    let array = [], entries// = await UnzipEntry.fromUrl(this.url)
    if (entries == null) {
      entries = await UnzipEntry.fromBlob(await this.getBlob(init))
    }
    for await (const entry of entries) { array.push(entry) }
    return array
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init)
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate), { name } = this
    lib.injectUnzipEntries(await this.getEntries(init))
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
  constructor(url, name) {
    if (Array.isArray(url)) {
      super(url[1], `${name}(原声大碟)`)
      this.main = new Archive(url[0], name)
    } else {
      super(`${url}.ex`, `${name}(原声大碟)`)
      this.main = new Archive(url, name)
    }
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate)
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init))
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