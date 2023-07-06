
import { defineComponent, createVNode as h } from 'vue'
import { UnzipEntry } from '../unzip/unzip-entry'
import { Archive, ArchiveWithEx } from '../voice/archive'

const { MAX_SAFE_INTEGER } = Number, { pow, min, trunc } = Math
const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
const exps = Array.from(units, (_, i) => pow(0x400, i))
const formatBytes = bytes => {
  let i = 1, len = exps.length
  while (i < len && bytes > exps[i]) { i++ } i--
  return (bytes / exps[i]).toFixed(min(2, i >> 1)) + ' ' + units[i]
}
const formatRemaining = function* (time) {
  let i = 0; time = +time
  if (!(time >= 0 && time <= MAX_SAFE_INTEGER)) { return yield '未知' }
  if (time >= 86400) { yield trunc(time / 86400) + '天'; time %= 86400; i++ }
  if (time >= 3600 || i > 0) { yield trunc(time / 3600) + '时'; time %= 3600; i++ }
  if (time >= 60 || i > 0) { yield trunc(time / 60) + '分'; time %= 60 }
  yield trunc(time) + '秒'
}

const name = '活字印刷语音'
export default defineComponent({
  name,
  props: {
    voices: { type: Map, require: true }
  },
  data() {
    return {
      audioSrc: null
    }
  },
  mounted() {
    const el = this.$el, doc = el.ownerDocument
    doc.title = name
    el.querySelector('[name=voice]').click()
    doc.addEventListener('dragover', this.handleDragover)
    doc.addEventListener('drop', this.handleDrop)
  },
  beforeUnmount() {
    const el = this.$el, doc = el.ownerDocument
    doc.removeEventListener('dragover', this.handleDragover)
    doc.removeEventListener('drop', this.handleDrop)
  },
  methods: {
    handleDragover(e) {
      e.preventDefault(); e.stopPropagation()
    },
    handleDrop(e) {
      const { target } = e
      if (this.global && !this.$el.contains(target) && e.type !== 'paste') {
        const tag = target.tagName.toUpperCase()
        const able = target.getAttribute('contenteditable')
        if ('INPUT' === tag || 'TEXTAREA' === tag || '' === able || 'true' === able) return
      }
      e.preventDefault(); e.stopPropagation()
      const dT = e.dataTransfer ?? e.clipboardData
      if (dT == null) return
      const suffix = '.zip', suffixEx = '.ex.zip'
      let main, ex
      for (const file of dT.files) {
        if (file.name.endsWith(suffixEx)) { ex = file }
        else if (file.name.endsWith(suffix)) { main = file }
        //if (file.name.endsWith('.zip')) { this.handleZip(file); return }
      }
      const archs = this.voices
      if (main != null) {
        const name = main.name.slice(0, -suffix.length)
        if (ex != null) {
          if (ex.name.slice(0, -suffixEx.length) != name) { return }
          const arch = new ArchiveWithEx([main, ex], name)
          archs.set(arch.main.name, arch.main)
          archs.set(arch.name, arch)
        } else {
          archs.set(name, new Archive(main, name))
        }
        this.$forceUpdate()
      }
    },
    async handleZip(file) {
      const { name } = file, array = []
      const entries = await UnzipEntry.fromBlob(file)
      for await (const entry of entries) {
        array.push(entry)
        console.log(name, entry.name, entry)
        await entry.stream().pipeTo(new WritableStream())
      }
      console.log(file, array)
    },
    async handleSubmit(e) {
      e.preventDefault(); e.stopPropagation()
      const vm = this, { target: el, submitter } = e, { elements: els } = el
      const dest = els.namedItem('dest'), tip = el.querySelector('[name=tip]')
      URL.revokeObjectURL(vm.audioSrc)
      vm.audioSrc = null
      submitter.disabled = true
      tip.innerText = ''
      dest.value = ''
      let timer = null, name, progress, step, onProgress = () => {
        const { loaded, total, percent, speed } = progress
        const notLoaded = total - loaded
        const [a, b = ''] = formatRemaining(notLoaded > 0 ? notLoaded / speed : 0)
        tip.innerText = `加载 ${name}[${percent}][${formatBytes(loaded)}/${formatBytes(total)}][${formatBytes(speed)}/s][剩余 ${a}${b} ]`
      }
      try {
        tip.innerText = (step = '加载') + '中'
        const archive = vm.voices.get(els.namedItem('voice').value)
        const lib = await archive.getVoiceLibrary(48000, {
          onFetchStart(name) {
            tip.innerText = `开始下载 ${name}`
          },
          onFetch(_name, _progress) {
            name = _name; progress = _progress
            if (timer != null) { return }
            timer = setInterval(onProgress, 200)
            onProgress()
          },
          onFetchEnd(name) {
            clearInterval(timer); timer = null
            tip.innerText = `下载完成 ${name}`
          },
          onUnzipStart(name) {
            tip.innerText = `开始加载 ${name}`
          },
          onUnzipEnd(name) {
            tip.innerText = `加载完成 ${name}`
          }
        })
        tip.innerText = (step = submitter.value) + '中'
        const list = Array.from(archive.parse(els.namedItem('src').value)).join(' ')
        vm.audioSrc = URL.createObjectURL(await lib.concat(list.split(' ')))
        tip.innerText = ''
        dest.value = list
      } catch (err) {
        clearInterval(timer); timer = null
        tip.innerText = step + '失败'
        throw err
      } finally {
        submitter.disabled = false
      }
    }
  },
  render() {
    const vm = this
    return h('form', { class: 'main', action: 'javascript:void+0', onSubmit: vm.handleSubmit }, [
      h('div', { class: 'title' }, [
        h('h1', null, name)
      ]),
      h('textarea', { name: 'src' }),
      h('div', { style: 'margin:10px 0px;' }, [
        h('input', { type: 'submit', value: '生成', name: 'gen' }),
        h('span', { style: 'display:inline-block;' }, Array.from(vm.voices.keys(), key => {
          return h('label', null, [
            h('input', { type: 'radio', name: 'voice', value: key }), key
          ])
        }))
      ]),
      h('textarea', { name: 'dest', readonly: '' }),
      h('div', { style: 'margin:10px 0px;' }, [
        vm.audioSrc != null ? h('audio', { src: vm.audioSrc, controls: '', style: 'display: inline-block;' }) : null,
        h('span', { name: 'tip' })
      ])
    ])
  }
})