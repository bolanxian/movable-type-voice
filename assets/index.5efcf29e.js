import { R as Readable, B as Buffer, y as yauzl, w as wav, s as speedometer, p as pinyinUtil, f as formatBytes_1, V as Vue, c as createApp, a as process, E as EventEmitter, S as Stream } from './vendor.66318e02.js';

const style = '';

const streamToBlob = (readable) => new Promise((ok, reject) => {
  const chunks = [];
  readable.on('data', (data) => { chunks.push(data); });
  readable.on('end', () => ok(new Blob(chunks)));
  readable.on('error', err => reject(err));
});
const readableToNode = (readable) => {
  const reader = readable.getReader();
  return new Readable({
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read();
        if (done) { this.push(null); return }
        this.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } catch (e) { this.destroy(e); }
    },
    async destroy(err, cb) {
      try {
        await reader.cancel(err);
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
  openReadStream() {
    const { yauzlZipFile: zipfile, yauzlEntry: entry } = this;
    return new Promise((ok, reject) => {
      zipfile.openReadStream(entry, (err, readable) => {
        err == null ? ok(readable) : reject(err);
      });
    })
  }
  async blob() {
    const readable = await this.openReadStream();
    return await streamToBlob(readable)
  }
  async arrayBuffer() {
    const blob = await this.blob();
    return await blob.arrayBuffer()
  }
  async text() {
    const blob = await this.blob();
    return await blob.text()
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
  static async fromBlob(blob) {
    const zipfile = await new Promise((ok, reject) => {
      const reader = new yauzl.RandomAccessReader();
      reader._readStreamForRange = (start, end) => {
        return readableToNode(blob.slice(start, end).stream())
      };
      yauzl.fromRandomAccessReader(reader, blob.size, {
        autoClose: false, lazyEntries: true
      }, (err, zipfile) => {
        err == null ? ok(zipfile) : reject(err);
      });
    });
    const entries = await UnzipEntry.readEntries(zipfile);
    return entries
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

class Progress {
  constructor(onProgress, emitDelay = 200) {
    this.total = 0;
    this.loaded = 0;
    this.speed = 0;
    this.streamSpeed = speedometer();
    this.emitDelay = emitDelay;
    this.eventStart = 0;
    this.percent = '0';
    this.onProgress = onProgress;
  }
  flow(chunk) {
    const chunkLength = chunk.length;
    const loaded = this.loaded += chunkLength;
    this.speed = this.streamSpeed(chunkLength);
    this.percent = (loaded / this.total * 100).toFixed(2);
    const now = Date.now();
    if (this.eventStart === 0) { this.eventStart = now; }
    if (now - this.eventStart > this.emitDelay || this.loaded >= this.total) {
      this.eventStart = now;
      this.onProgress(this);
    }
  }
}
const noop = () => null;
class ProgressSource {
  constructor(response, {
    emitDelay = 200,
    onProgress = noop,
    onComplete = noop,
    onError = noop,
  } = {}) {
    const { body, headers } = response;
    this.$progress = new Progress(onProgress, emitDelay);
    this.$progress.total = +headers.get('content-length');
    this.$progress.onProgress(this.$progress);
    this.$body = body;
    //this.$onProgress = onProgress
    this.$onComplete = onComplete;
    this.$onError = onError;
  }
  start() {
    this.$reader = this.$body.getReader();
  }
  async pull(controller) {
    const { done, value } = await this.$reader.read();
    done ? controller.close() : controller.enqueue(value);
    try {
      if (done) { this.$onComplete(); return }
      this.$progress.flow(value);
    } catch (error) {
      this.$onError(error);
    }
  }
  static create(response, init) {
    const stream = new ReadableStream(new ProgressSource(response, init));
    return new Response(stream, response)
  }
}

const baseParserList = [
  [new RegExp(Object.keys(dictionary).join('|')), str => dictionary[str]],
  [/[\s、，。：；——]+/, () => 'pau'],
  [/[\u4E00-\u9FEF]/, str => pinyinUtil.getPinyin(str, ' ', !1, !1)]
];
const { get } = Reflect, regProto = RegExp.prototype, { matchAll } = String.prototype;
const formatProgress = ({ loaded, total, percent, speed }) => {
  return `[${percent}%][${formatBytes_1(Math.trunc(speed))}/s][${formatBytes_1(loaded)}/${formatBytes_1(total)}]`
};
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
    if (init.onProgress != null) {
      response = ProgressSource.create(response, init);
    }
    return await response.blob()
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
    const entries = await UnzipEntry.fromBuffer(buffer);
    return entries
  }
  async createEntries(init) {
    const blob = await this.getBlob(init);
    const entries = await UnzipEntry.fromBlob(blob);
    return entries
  }
  getEntries(init) {
    if (this.entriesPromise == null) {
      this.entriesPromise = this.createEntries(init);
    }
    return this.entriesPromise
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate), { name } = this;
    lib.injectUnzipEntries(await this.getEntries(init.onTip != null ? {
      onProgress(progress) { init.onTip(`${name}${formatProgress(progress)}`); }
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
    this.name = name;
    this.main = new Archive(name);
  }
  async createVoiceLibrary(sampleRate, init = {}) {
    const lib = new Library(sampleRate);
    for (const arch of [this.main, this]) {
      lib.injectUnzipEntries(await arch.getEntries(init.onTip != null ? {
        onProgress(progress) { init.onTip(`${arch.name}${formatProgress(progress)}`); }
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
const name = '活字印刷语音';
const Main = defineComponent({
  name,
  data() {
    return {
      audioSrc: null,
      tip: ''
    }
  },
  created() {
    const vm = this;
    const otto = new ArchiveWithEx('./otto');
    otto.name = '电棍(原声大碟)';
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
      const dest = els.namedItem('dest');
      try {
        URL.revokeObjectURL(vm.audioSrc);
        submitter.disabled = true;
        vm.tip = '';
        vm.audioSrc = null;
        dest.value = '';
        const archive = vm.voices.get(els.namedItem('voice').value);
        const lib = await archive.getVoiceLibrary(48000, {
          onTip(msg) { vm.tip = `加载 ${msg}`; }
        });
        vm.tip = '';
        const list = Array.from(archive.parse(els.namedItem('src').value)).join(' ');
        vm.audioSrc = URL.createObjectURL(await lib.concat(list.split(' ')));
        dest.value = list;
      } catch (err) {
        vm.tip = submitter.value + '失败';
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
        h('span', null, vm.tip)
      ])
    ])
  }
});

const vm = createApp(Main).mount('#app');

Object.assign(window, {
  main: { process: process, Buffer: Buffer, EventEmitter, stream: Stream, wav, yauzl, pinyinUtil },
  vm
});
