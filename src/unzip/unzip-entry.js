
import yauzl from 'yauzl'
import { readableFromNode, readableToNode } from './utils'

export class UnzipEntry {
  constructor(yauzlEntry, yauzlZipFile) {
    this.yauzlEntry = yauzlEntry
    this.yauzlZipFile = yauzlZipFile
    this.name = yauzlEntry.fileName
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
  static readEntries(zipfile) {
    return new Promise((ok, rej) => {
      const entries = []
      const done = () => {
        zipfile.removeListener('entry', onentry)
        zipfile.removeListener('end', onend)
        zipfile.removeListener('error', onerr)
      }
      const onentry = (entry) => {
        entries.push(new UnzipEntry(entry, zipfile))
        zipfile.readEntry()
      }
      const onend = () => { ok(entries); done() }
      const onerr = (err) => { rej(err); done() }
      zipfile.on('entry', onentry)
      zipfile.on('end', onend)
      zipfile.on('error', onerr)
      zipfile.readEntry()
    })
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
    return await this.readEntries(zipfile)
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
