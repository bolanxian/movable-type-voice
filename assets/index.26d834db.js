import { b as browser, B as Buffer$1, y as yauzl, w as wav, s as speedometer, p as pinyinUtil, V as Vue, f as formatBytes_1, c as createApp, E as EventEmitter, a as stream } from './vendor.2f6f7ed0.js';

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
        this.push(Buffer$1.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
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
  static readEntries(zipfile) {
    return new Promise((ok, rej) => {
      const entries = [];
      const done = () => {
        zipfile.removeListener('entry', onentry);
        zipfile.removeListener('end', onend);
        zipfile.removeListener('error', onerr);
      };
      const onentry = (entry) => {
        entries.push(new UnzipEntry(entry, zipfile));
        zipfile.readEntry();
      };
      const onend = () => { ok(entries); done(); };
      const onerr = (err) => { rej(err); done(); };
      zipfile.on('entry', onentry);
      zipfile.on('end', onend);
      zipfile.on('error', onerr);
      zipfile.readEntry();
    })
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
    return await this.readEntries(zipfile)
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

const { min } = Math;

class Progress {
  constructor(onProgress) {
    this.loaded = this.total = 0;
    this.streamSpeed = speedometer();
    this.onProgress = onProgress;
  }
  get percent() {
    return min(99.9, this.loaded / this.total * 100).toFixed(1)
  }
  get speed() {
    return this.streamSpeed(0)
  }
  push(chunkLength) {
    this.loaded += chunkLength;
    this.streamSpeed(chunkLength);
    this.onProgress(this);
  }
}
class ProgressSource {
  constructor(response, onProgress) {
    const { body, headers } = response;
    this.$body = body;
    this.$progress = new Progress(onProgress);
    this.$progress.total = +headers.get('content-length');
    this.$progress.push(0);
  }
  start() {
    this.$reader = this.$body.getReader();
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
  static create(response, onProgress) {
    const source = new ProgressSource(response, onProgress);
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
  constructor(name) {
    this.name = name;
    this.url = `${name}.zip`;
    this.blobPromise = null;
  }
  async createBlob(init = {}) {
    let response = await fetch(this.url);
    const { status } = response;
    if (status !== 200) {
      response.body?.cancel();
      throw new TypeError(`Request failed with status code ${status}`)
    }
    if (init.onFetchProgress != null) {
      response = ProgressSource.create(response, init.onFetchProgress);
    }
    const blob = await response.blob();
    init.onFetchEnd?.();
    return blob
  }
  getBlob(init) {
    if (this.blobPromise == null) {
      this.blobPromise = this.createBlob(init);
    }
    return this.blobPromise
  }
  async createEntriesOld(init) {
    const blob = await this.getBlob(init);
    const buffer = Buffer.from(await blob.arrayBuffer());
    return await UnzipEntry.fromBuffer(buffer)
  }
  async createEntries(init) {
    const blob = await this.getBlob(init);
    return await UnzipEntry.fromBlob(blob)
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init);
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate), { name } = this;
    lib.injectUnzipEntries(await this.getEntries(init.onFetchProgress != null ? {
      onFetchProgress(progress) { init.onFetchProgress(name, progress); },
      onFetchEnd() { init.onFetchEnd?.(name); }
    } : null));
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
  constructor(name) {
    super(`${name}.ex`);
    this.main = new Archive(name);
  }
  set name(name) { }
  get name() {
    return `${this.main.name}(原声大碟)`
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate);
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init.onFetchProgress != null ? {
        onFetchProgress(progress) { init.onFetchProgress(arch.name, progress); },
        onFetchEnd() { init.onFetchEnd?.(arch.name); }
      } : null));
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
  created() {
    const vm = this;
    const otto = new ArchiveWithEx('./otto');
    otto.main.name = '电棍';
    const taffy = new Archive('./taffy');
    taffy.name = '塔菲';
    const archs = vm.voices = new Map();
    for (const arch of [
      otto.main,
      otto,
      taffy
    ]) {
      archs.set(arch.name, arch);
    }
  },
  mounted() {
    const el = this.$el;
    el.ownerDocument.title = name;
    el.querySelector('[name="voice"]').click();
  },
  methods: {
    async handleSubmit(e) {
      e.preventDefault();
      e.stopPropagation();
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
        tip.innerText = submitter.value + '失败';
        throw err
      } finally {
        clearInterval(timer);
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
  modules: { Buffer: Buffer$1, EventEmitter, stream, wav, yauzl, pinyinUtil, Vue },
  vm
});
