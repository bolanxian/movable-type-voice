import yauzl from 'yauzl'
import { streamToBlob, readableToNode } from './utils'

export class UnzipEntry {
  constructor(yauzlEntry, yauzlZipFile) {
    this.yauzlEntry = yauzlEntry
    this.yauzlZipFile = yauzlZipFile
    this.name = yauzlEntry.fileName
  }
  openReadStream() {
    const { yauzlZipFile: zipfile, yauzlEntry: entry } = this
    return new Promise((ok, reject) => {
      zipfile.openReadStream(entry, (err, readable) => {
        err == null ? ok(readable) : reject(err)
      })
    })
  }
  async blob() {
    const readable = await this.openReadStream()
    return await streamToBlob(readable)
  }
  async arrayBuffer() {
    const blob = await this.blob()
    return await blob.arrayBuffer()
  }
  async text() {
    const blob = await this.blob()
    return await blob.text()
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
  static async fromBlob(blob) {
    const zipfile = await new Promise((ok, reject) => {
      const reader = new yauzl.RandomAccessReader()
      reader._readStreamForRange = (start, end) => {
        return readableToNode(blob.slice(start, end).stream())
      }
      yauzl.fromRandomAccessReader(reader, blob.size, {
        autoClose: false, lazyEntries: true
      }, (err, zipfile) => {
        err == null ? ok(zipfile) : reject(err)
      })
    })
    const entries = await UnzipEntry.readEntries(zipfile)
    return entries
  }
}
