import { b as browser, B as Buffer, y as yauzl, w as wav, s as speedometer, p as pinyinUtil, V as Vue, f as formatBytes_1, c as createApp, E as EventEmitter, a as stream } from './vendor.2198ad67.js';

const style = '';

class FromNodeSource {
  #readable
  constructor(readable) {
    this.#readable = readable;
  }
  get readable() { return this.#readable }
  async start(controller) {
    const readable = this.#readable = await this.#readable;
    readable.on('data', chunk => {
      controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      readable.pause();
    });
    readable.on('end', () => controller.close());
    readable.on('error', err => controller.error(err));
    readable.pause();
  }
  pull(controller) {
    this.#readable.resume();
  }
  cancel(reason) {
    this.#readable.destroy(reason);
  }
}
const readableFromNode = (readable) => new ReadableStream(new FromNodeSource(readable));

const readableToNode = (readable) => {
  let reader;
  return new browser.exports.Readable({
    async construct(cb) {
      let err = null; try {
        reader = (await readable).getReader();
      } catch (e) { err = e; }
      cb(err);
    },
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read();
        if (done) { this.push(null); return }
        this.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } catch (e) { this.destroy(e); }
    },
    async destroy(err, cb) {
      try {
        if (reader != null) { await reader.cancel(err); }
      } catch (e) { err = e; }
      cb(err);
    }
  })
};

class UnzipEntry {
  constructor(yauzlEntry, yauzlZipFile) {
    this.yauzlEntry = yauzlEntry;
    this.yauzlZipFile = yauzlZipFile;
    this.name = yauzlEntry.fileName;
    this.size = yauzlEntry.uncompressedSize;
  }
  stream() {
    const { yauzlZipFile: zipfile, yauzlEntry: entry } = this;
    return readableFromNode(new Promise((ok, reject) => {
      zipfile.openReadStream(entry, (err, readable) => {
        err == null ? ok(readable) : reject(err);
      });
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
    let resolve, reject, done = false;
    const onentry = entry => { resolve(entry); };
    const onend = () => { done = true; resolve(); };
    const onerr = err => { reject(err); };
    const next = (_, __) => { resolve = _; reject = __; zipfile.readEntry(); };
    try {
      zipfile.on('entry', onentry);
      zipfile.on('end', onend);
      zipfile.on('error', onerr);
      while (true) {
        const entry = await new Promise(next);
        if (done) { return }
        yield new UnzipEntry(entry, zipfile);
      }
    } catch (error) {
      throw error
    } finally {
      zipfile.removeListener('entry', onentry);
      zipfile.removeListener('end', onend);
      zipfile.removeListener('error', onerr);
    }
  }
  static async fromRandomAccessReader(createReadable, size) {
    const zipfile = await new Promise((ok, reject) => {
      const reader = new yauzl.RandomAccessReader();
      reader._readStreamForRange = createReadable;
      yauzl.fromRandomAccessReader(reader, size, {
        autoClose: false, lazyEntries: true
      }, (err, zipfile) => {
        err == null ? ok(zipfile) : reject(err);
      });
    });
    return this.readEntries(zipfile)
  }
  static fromBlob(blob) {
    return this.fromRandomAccessReader((start, end) => {
      return readableToNode(blob.slice(start, end).stream())
    }, blob.size)
  }
  static async fromUrl(url) {
    const head = await fetch(url, { method: 'HEAD' });
    const blob = await head.blob();
    if (blob.size > 0) { return this.fromBlob(blob) }
    if (head.headers.get('accept-ranges') !== 'bytes') { return null }
    const createReadable = async (start, end) => {
      const response = await fetch(url, {
        headers: { range: `bytes=${start ?? 0}-${end != null ? end - 1 : ''}` }
      });
      if (response.status !== 206) {
        throw new TypeError('Range not satisfiable')
      }
      return response.body
    };
    return this.fromRandomAccessReader((start, end) => {
      return readableToNode(createReadable(start, end))
    }, +head.headers.get('content-length'))
  }
}

const a = "ei";
const b = "bi";
const c = "xi";
const d = "di";
const e = "yi";
const f = "ai fu";
const g = "ji";
const h$1 = "ai chi";
const i = "ai";
const j = "zhei";
const k = "kei";
const l = "ai lu";
const m = "ai mu";
const n = "en";
const o = "ou";
const p = "pi";
const q = "kiu";
const r = "a";
const s = "ai si";
const t = "ti";
const u = "you";
const v = "wei";
const w = "da bu liu";
const x = "ai ke si";
const y = "wai";
const z = "zei";
const dictionary = {
	"0": "ling",
	"1": "yi",
	"2": "er",
	"3": "san",
	"4": "si",
	"5": "wu",
	"6": "liu",
	"7": "qi",
	"8": "ba",
	"9": "jiu",
	a: a,
	b: b,
	c: c,
	d: d,
	e: e,
	f: f,
	g: g,
	h: h$1,
	i: i,
	j: j,
	k: k,
	l: l,
	m: m,
	n: n,
	o: o,
	p: p,
	q: q,
	r: r,
	s: s,
	t: t,
	u: u,
	v: v,
	w: w,
	x: x,
	y: y,
	z: z,
	"\\.": "dian"
};

class Library {
  constructor(sampleRate = 48000) {
    this.entryMap = new Map();
    this.audioMap = new Map();
    const ctx = this.audioContext = new OfflineAudioContext({ sampleRate, length: 1 });
    this.decodeAudioData = buffer => ctx.decodeAudioData(buffer);
    const pau = this.pau = new AudioBuffer({ sampleRate, length: Math.trunc(0.2 * sampleRate) });
    this.audioMap.set('pau', Promise.resolve(pau));
  }
  injectUnzipEntries(entries) {
    for (const entry of entries) {
      if (entry == null) { continue }
      const name = String(entry.name), i = name.indexOf('.');
      this.entryMap.set(name.slice(0, i), entry);
    }
  }
  has(name) {
    return this.audioMap.has(name) || this.entryMap.has(name)
  }
  get(name) {
    let audio = this.audioMap.get(name);
    if (audio != null) { return audio }
    const entry = this.entryMap.get(name);
    if (entry == null) { return null }
    audio = Promise.resolve(entry.arrayBuffer()).then(this.decodeAudioData);
    this.audioMap.set(name, audio);
    return audio
  }
  async encodeAudioData(list) {
    const { sampleRate } = this.audioContext;
    const data = new Float32Array(await new Blob(list).arrayBuffer());
    const wave = await wav.encode({ sampleRate, channelData: [data] });
    return new Blob([wave])
  }
  async concat(list) {
    const result = [this.pau];
    for (const name of list) {
      const audio = await this.get(name);
      if (audio == null) { continue }
      result.push(audio.getChannelData(0));
    }
    result.push(this.pau);
    return this.encodeAudioData(result)
  }
}

const { min } = Math, noop = () => { };

class Progress {
  #loaded
  #total
  #streamSpeed
  #speed
  #onProgress
  constructor(total, onProgress = noop) {
    this.#loaded = 0;
    this.#total = total;
    this.#streamSpeed = speedometer();
    this.#onProgress = onProgress;
  }
  get loaded() { return this.#loaded }
  get total() { return this.#total }
  get percent() {
    return min(99.9, 100 * this.#loaded / this.#total).toFixed(1)
  }
  get speed() {
    const speed = this.#speed;
    if (speed != null) { return speed }
    return this.#streamSpeed(0)
  }
  push(chunkLength) {
    this.#loaded += chunkLength;
    this.#speed = this.#streamSpeed(chunkLength);
    this.#onProgress(this);
    this.#speed = null;
  }
}
class ProgressSource {
  constructor(response, onProgress, onChunk = noop) {
    const { body, headers } = response;
    this.$reader = body.getReader();
    const progress = this.$progress = new Progress(+headers.get('content-length'), onChunk);
    onProgress(progress);
  }
  async pull(controller) {
    const { done, value } = await this.$reader.read();
    if (done) { controller.close(); return }
    controller.enqueue(value);
    this.$progress.push(value.byteLength);
  }
  async cancel(reason) {
    await this.$reader.cancel(reason);
  }
  static create(response, onProgress, onChunk) {
    const source = new ProgressSource(response, onProgress, onChunk);
    const stream = new ReadableStream(source);
    return new Response(stream, response)
  }
}

const baseParserList = [
  [new RegExp(Object.keys(dictionary).join('|')), str => dictionary[str]],
  [/[\s,、，。：；——]+/, () => 'pau'],
  [/[\u4E00-\u9FEF]/, str => pinyinUtil.getPinyin(str, ' ', !1, !1)]
];
const { get } = Reflect, regProto = RegExp.prototype, { matchAll } = String.prototype;
class Archive {
  static createParser(list) {
    const map = new Map(list);
    const reg = new RegExp(Array.from(map.keys(), key => `(${get(regProto, 'source', key)})`).join('|'), 'g');
    const values = Array.from(map.values());
    const gen = function* (str) {
      for (const matchs of matchAll.call(str, reg)) {
        let i, str; for (i = 1; i < matchs.length; i++) {
          if ((str = matchs[i]) != null) { yield values[i - 1](str); break }
        }
      }
    };
    return gen
  }
  static cachePromise = caches.open('movable-type-voice')
  constructor(url, name) {
    this.blobPromise = null;
    this.entriesPromise = null;
    this.libraryPromise = null;
    this.parse = null;
    if (url instanceof Blob) {
      this.url = null;
      this.name = name ?? (url instanceof File ? url.name : '');
      this.blobPromise = Promise.resolve(url);
    } else {
      this.url = `${url}.zip`;
      this.name = name ?? url;
    }
  }
  async createBlob(init = {}) {
    const { url, name } = this, cache = await Archive.cachePromise;
    let response = await cache.match(url), put, onFetchProgress;
    if (response != null) {
      const { headers } = response;
      const date = headers.get('date');
      if (!((Date.now() - Date.parse(date)) < (1000 * 60 * 60 * 24 * 7))) {
        const hasModifiedHeaders = {};
        const etag = headers.get('etag'), lastModified = headers.get('last-modified');
        if (etag != null) {
          hasModifiedHeaders['if-none-match'] = etag;
        }
        if (lastModified != null) {
          hasModifiedHeaders['if-modified-since'] = lastModified;
        }
        const hasModified = await fetch(url, { headers: hasModifiedHeaders });
        if (hasModified.status === 304) {
          for (const [key, value] of hasModified.headers) {
            headers.set(key, value);
          }
          put = cache.put(url, response.clone());
        } else if (hasModified.status === 200) {
          response.body?.cancel();
          response = hasModified;
          put = cache.put(url, response.clone());
          onFetchProgress = init.onFetchProgress;
        } else {
          response.body?.cancel();
          hasModified.body?.cancel();
          throw new TypeError(`Request failed with status code ${hasModified.status}`)
        }
      }
    } else {
      response = await fetch(url);
      if (response.status !== 200) {
        response.body?.cancel();
        throw new TypeError(`Request failed with status code ${response.status}`)
      }
      put = cache.put(url, response.clone());
      onFetchProgress = init.onFetchProgress;
    }
    if (onFetchProgress != null) {
      response = ProgressSource.create(response, (progress) => { onFetchProgress(name, progress); });
    }
    const blob = await response.blob();
    if (put != null) { await put; }
    init.onFetchEnd?.(name);
    return blob
  }
  getBlob(init) {
    if (this.blobPromise == null) {
      this.blobPromise = this.createBlob(init);
    }
    return this.blobPromise
  }
  async createEntries(init) {
    let array = [], entries;// = await UnzipEntry.fromUrl(this.url)
    if (entries == null) {
      entries = await UnzipEntry.fromBlob(await this.getBlob(init));
    }
    for await (const entry of entries) { array.push(entry); }
    return array
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init);
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate);
    lib.injectUnzipEntries(await this.getEntries(init));
    this.parse = Archive.createParser(baseParserList);
    return lib
  }
  async getVoiceLibrary(sampleRate, init) {
    if (this.libraryPromise != null) try {
      const lib = await this.libraryPromise;
      if (lib != null && lib.audioContext.sampleRate === sampleRate) {
        return lib
      }
    } catch (e) { }
    this.libraryPromise = this.createVoiceLibrary(sampleRate, init);
    return this.libraryPromise
  }
}
class ArchiveWithEx extends Archive {
  constructor(url, name) {
    if (Array.isArray(url)) {
      super(url[1], `${name}(原声大碟)`);
      this.main = new Archive(url[0], name);
    } else {
      super(`${url}.ex`, `${name}(原声大碟)`);
      this.main = new Archive(url, name);
    }
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate);
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init));
    }
    const table = JSON.parse(await lib.entryMap.get('table').text());
    lib.entryMap.delete('table');
    this.parse = Archive.createParser([
      [new RegExp(Object.keys(table).join('|')), str => table[str]],
      ...baseParserList
    ]);
    return lib
  }
}

const { createVNode: h, defineComponent } = Vue;

const formatProgress = ({ loaded, total, percent, speed }) => {
  return `[${percent}%][${formatBytes_1(Math.trunc(speed))}/s][${formatBytes_1(loaded)}/${formatBytes_1(total)}]`
};
const name = '活字印刷语音';
const Main = defineComponent({
  name,
  data() {
    return {
      audioSrc: null
    }
  },
  beforeMount() {
    const vm = this;
    const otto = new ArchiveWithEx('./otto', '电棍');
    const taffy = new Archive('./taffy', '塔菲');
    const archs = vm.voices = new Map();
    for (const arch of [otto.main, otto, taffy]) {
      archs.set(arch.name, arch);
    }
  },
  mounted() {
    const el = this.$el, doc = el.ownerDocument;
    doc.title = name;
    el.querySelector('[name=voice]').click();
    doc.addEventListener('dragover', this.handleDragover);
    doc.addEventListener('drop', this.handleDrop);
  },
  beforeUnmount() {
    const el = this.$el, doc = el.ownerDocument;
    doc.removeEventListener('dragover', this.handleDragover);
    doc.removeEventListener('drop', this.handleDrop);
  },
  methods: {
    handleDragover(e) {
      e.preventDefault(); e.stopPropagation();
    },
    handleDrop(e) {
      const { target } = e;
      if (this.global && !this.$el.contains(target) && e.type !== 'paste') {
        const tag = target.tagName.toUpperCase();
        const able = target.getAttribute('contenteditable');
        if ('INPUT' === tag || 'TEXTAREA' === tag || '' === able || 'true' === able) return
      }
      e.preventDefault(); e.stopPropagation();
      const dT = e.dataTransfer ?? e.clipboardData;
      if (dT == null) return
      const suffix = '.zip', suffixEx = '.ex.zip';
      let main, ex;
      for (const file of dT.files) {
        if (file.name.endsWith(suffixEx)) { ex = file; }
        else if (file.name.endsWith(suffix)) { main = file; }
        //if (file.name.endsWith('.zip')) { this.handleZip(file); return }
      }
      const archs = this.voices;
      if (main != null) {
        const name = main.name.slice(0, -suffix.length);
        if (ex != null) {
          if (ex.name.slice(0, -suffixEx.length) != name) { return }
          const arch = new ArchiveWithEx([main, ex], name);
          archs.set(arch.main.name, arch.main);
          archs.set(arch.name, arch);
        } else {
          archs.set(name, new Archive(main, name));
        }
        this.$forceUpdate();
      }
    },
    async handleZip(file) {
      const { name } = file, array = [];
      const entries = await UnzipEntry.fromBlob(file);
      for await (const entry of entries) {
        array.push(entry);
        console.log(name, entry.name, entry);
        await entry.stream().pipeTo(new WritableStream());
      }
      console.log(file, array);
    },
    async handleSubmit(e) {
      e.preventDefault(); e.stopPropagation();
      const vm = this, { target: el, submitter } = e, { elements: els } = el;
      const dest = els.namedItem('dest'), tip = el.querySelector('[name=tip]');
      URL.revokeObjectURL(vm.audioSrc);
      vm.audioSrc = null;
      submitter.disabled = true;
      tip.innerText = '';
      dest.value = '';
      let timer = null;
      try {
        const archive = vm.voices.get(els.namedItem('voice').value);
        let name, progress, onFetchProgress = () => {
          tip.innerText = `加载 ${name}${formatProgress(progress)}`;
        };
        const lib = await archive.getVoiceLibrary(48000, {
          onFetchProgress(_name, _progress) {
            name = _name; progress = _progress;
            if (timer != null) { return }
            timer = setInterval(onFetchProgress, 200);
            onFetchProgress();
          },
          onFetchEnd(name) {
            clearInterval(timer); timer = null;
            tip.innerText = `加载完成 ${name}`;
          }
        });
        tip.innerText = submitter.value + '中';
        const list = Array.from(archive.parse(els.namedItem('src').value)).join(' ');
        vm.audioSrc = URL.createObjectURL(await lib.concat(list.split(' ')));
        tip.innerText = '';
        dest.value = list;
      } catch (err) {
        clearInterval(timer); timer = null;
        tip.innerText = submitter.value + '失败';
        throw err
      } finally {
        submitter.disabled = false;
      }
    }
  },
  render() {
    const vm = this;
    return h('form', { class: "main", action: "about:blank", onSubmit: vm.handleSubmit }, [
      h('div', { class: "title" }, [
        h('h1', null, name)
      ]),
      h('textarea', { name: "src" }),
      h('div', { style: "margin:10px 0px;" }, [
        h('input', { type: "submit", value: "生成", name: "gen" }),
        h('span', { style: "display:inline-block;" }, Array.from(vm.voices.keys(), key => {
          return h('label', null, [
            h('input', { type: "radio", name: "voice", value: key }), key
          ])
        }))
      ]),
      h('textarea', { name: "dest", readonly: "" }),
      h('div', { style: "margin:10px 0px;" }, [
        vm.audioSrc != null ? h('audio', { src: vm.audioSrc, controls: '', style: "display: inline-block;" }) : null,
        h('span', { name: "tip" })
      ])
    ])
  }
});

const vm = createApp(Main).mount('#app');

Object.assign(window, {
  modules: { Buffer, EventEmitter, stream, wav, yauzl, pinyinUtil, Vue },
  vm
});
