
import yauzl from 'yauzl'
import { readableFromNode, readableToNode } from './utils'

export class UnzipEntry {
  constructor(yauzlEntry, yauzlZipFile) {
    this.yauzlEntry = yauzlEntry
    this.yauzlZipFile = yauzlZipFile
    this.name = yauzlEntry.fileName
    this.size = yauzlEntry.uncompressedSize
  }
  stream() {
    const { yauzlZipFile: zipfile, yauzlEntry: entry } = this
    return readableFromNode(new Promise((ok, reject) => {
      zipfile.openReadStream(entry, (err, readable) => {
        err == null ? ok(readable) : reject(err)
      })
    }))
  }
  blob() {
    return new Response(this.stream()).blob()
  }
  arrayBuffer() {
    return new Response(this.stream()).arrayBuffer()
  }
  text() {
    return new Response(this.stream()).text()
  }
  static async*readEntries(zipfile) {
    let resolve, reject, done = false
    const onentry = entry => { resolve(entry) }
    const onend = () => { done = true; resolve() }
    const onerr = err => { reject(err) }
    const next = (_, __) => { resolve = _; reject = __; zipfile.readEntry() }
    try {
      zipfile.on('entry', onentry)
      zipfile.on('end', onend)
      zipfile.on('error', onerr)
      while (true) {
        const entry = await new Promise(next)
        if (done) { return }
        yield new UnzipEntry(entry, zipfile)
      }
    } catch (error) {
      throw error
    } finally {
      zipfile.removeListener('entry', onentry)
      zipfile.removeListener('end', onend)
      zipfile.removeListener('error', onerr)
    }
  }
  static async fromRandomAccessReader(createReadable, size) {
    const zipfile = await new Promise((ok, reject) => {
      const reader = new yauzl.RandomAccessReader()
      reader._readStreamForRange = createReadable
      yauzl.fromRandomAccessReader(reader, size, {
        autoClose: false, lazyEntries: true
      }, (err, zipfile) => {
        err == null ? ok(zipfile) : reject(err)
      })
    })
    return [zipfile.entryCount, this.readEntries(zipfile)]
  }
  static fromBlob(blob) {
    return this.fromRandomAccessReader((start, end) => {
      return readableToNode(blob.slice(start, end).stream())
    }, blob.size)
  }
  static async fromUrl(url) {
    const head = await fetch(url, { method: 'HEAD' })
    const blob = await head.blob()
    if (blob.size > 0) { return this.fromBlob(blob) }
    if (head.headers.get('accept-ranges') !== 'bytes') { return null }
    const createReadable = async (start, end) => {
      const response = await fetch(url, {
        headers: { range: `bytes=${start ?? 0}-${end != null ? end - 1 : ''}` }
      })
      if (response.status !== 206) {
        throw new TypeError('Range not satisfiable')
      }
      return response.body
    }
    return this.fromRandomAccessReader((start, end) => {
      return readableToNode(createReadable(start, end))
    }, +head.headers.get('content-length'))
  }
}
