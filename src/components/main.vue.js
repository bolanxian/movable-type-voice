
import { defineComponent, createVNode as h } from 'vue'
import { UnzipEntry } from '../unzip/unzip-entry'
import { Archive, ArchiveWithEx } from '../voice/archive'
import { update, final, Progress } from '../voice/progress'
import { now, renderProgress } from '../utils'

const name = '活字印刷语音'
export default defineComponent({
  name,
  props: {
    map: { type: Map, require: true }
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
      {
        const { target } = e
        const tag = target.tagName
        if ('INPUT' === tag || 'TEXTAREA' === tag || target.isContentEditable) return
      }
      e.preventDefault(); e.stopPropagation()
      const dT = e.dataTransfer ?? e.clipboardData
      if (dT == null) return
      const suffix = '.zip', suffixEx = '.ex.zip'
      let main, ex
      for (const file of dT.files) {
        if (file.name.endsWith(suffixEx)) { ex = file }
        else if (file.name.endsWith(suffix)) { main = file }
      }
      const archs = this.map
      if (main != null) {
        let name = main.name.slice(0, -suffix.length)
        if (ex != null) {
          if (ex.name.slice(0, -suffixEx.length) != name) { return }
          const arch = new ArchiveWithEx([main, ex], name)
          archs.set(arch.main.name, arch.main)
          archs.set(name = arch.name, arch)
        } else {
          archs.set(name, new Archive(main, name))
        }
        this.$forceUpdate()
        setTimeout(() => { this.$refs.form.elements.namedItem('voice').value = name }, 0)
      }
    },
    async testZip(file) {
      const { name } = file, array = []
      const entries = await UnzipEntry.fromBlob(file)
      for await (const entry of entries) {
        array.push(entry)
        console.log(name, entry.name, entry)
        await entry.stream().pipeTo(new WritableStream())
      }
      console.log(file, array)
    },
    testProgress(speed = 1, total = 128) {
      const tip = this.$el.querySelector('[name=tip]')
      const progress = new Progress(total * 1024 * 1024), start = now()
      const onProgress = () => {
        update(progress, speed * 1024 * 1024 / 10)
        if (progress.loaded >= progress.total) {
          update(progress, progress.total - progress.loaded)
          final(progress)
          clearInterval(timer)
        }
        tip.innerText = renderProgress(progress, start)
      }
      const timer = setInterval(onProgress, 100)
      tip.innerText = renderProgress(progress, start)
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
      let timer = null, step
      let name, progress, start
      const onProgress = () => {
        tip.innerText = `正在下载：${name}\n${renderProgress(progress, start)}`
      }
      try {
        tip.innerText = (step = '加载') + '中'
        const archive = vm.map.get(els.namedItem('voice').value)
        const lib = await archive.getVoiceLibrary(48000, {
          onFetchStart(name) {
            tip.innerText = `开始下载：${name}`
          },
          onFetch(_name, _progress) {
            name = _name; progress = _progress
            start = now()
            if (timer != null) { return }
            timer = setInterval(onProgress, 100)
            onProgress()
          },
          onFetchEnd(name) {
            clearInterval(timer); timer = null
            tip.innerText = `下载完成：${name}`
          },
          onUnzipStart(name) {
            tip.innerText = `开始加载：${name}`
          },
          onUnzipEnd(name) {
            tip.innerText = `加载完成：${name}`
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
        if (timer != null) { clearInterval(timer) }
        submitter.disabled = false
      }
    }
  },
  render() {
    const vm = this
    return h('form', { ref: 'form', class: 'main', action: 'javascript:void+0', onSubmit: vm.handleSubmit }, [
      h('div', { class: 'title' }, [
        h('h1', null, name)
      ]),
      h('textarea', { name: 'src' }),
      h('div', { style: 'margin:10px 0px;' }, [
        h('input', { type: 'submit', value: '生成', name: 'gen' }),
        h('span', { style: 'display:inline-block;' }, Array.from(vm.map.keys(), key => {
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