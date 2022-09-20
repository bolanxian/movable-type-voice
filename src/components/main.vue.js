
import * as Vue from 'vue'
const { createVNode: h, defineComponent } = Vue
import formatBytes from 'format-bytes'
import { Archive, ArchiveWithEx } from '../voice/archive'

const formatProgress = ({ loaded, total, percent, speed }) => {
  return `[${percent}%][${formatBytes(Math.trunc(speed))}/s][${formatBytes(loaded)}/${formatBytes(total)}]`
}
const name = '活字印刷语音'
export default defineComponent({
  name,
  data() {
    return {
      audioSrc: null
    }
  },
  created() {
    const vm = this
    const otto = new ArchiveWithEx('./otto')
    otto.main.name = '电棍'
    const taffy = new Archive('./taffy')
    taffy.name = '塔菲'
    const archs = vm.voices = new Map()
    for (const arch of [
      otto.main,
      otto,
      taffy
    ]) {
      archs.set(arch.name, arch)
    }
  },
  mounted() {
    const el = this.$el
    el.ownerDocument.title = name
    el.querySelector('[name="voice"]').click()
  },
  methods: {
    async handleSubmit(e) {
      e.preventDefault()
      e.stopPropagation()
      const vm = this, { target: el, submitter } = e, { elements: els } = el
      const dest = els.namedItem('dest'), tip = el.querySelector('[name=tip]')
      URL.revokeObjectURL(vm.audioSrc)
      vm.audioSrc = null
      submitter.disabled = true
      tip.innerText = ''
      dest.value = ''
      let timer = null
      try {
        const archive = vm.voices.get(els.namedItem('voice').value)
        let name, progress, onFetchProgress = () => {
          tip.innerText = `加载 ${name}${formatProgress(progress)}`
        }
        const lib = await archive.getVoiceLibrary(48000, {
          onFetchProgress(_name, _progress) {
            name = _name; progress = _progress
            if (timer != null) { return }
            timer = setInterval(onFetchProgress, 200)
            onFetchProgress()
          },
          onFetchEnd(name) {
            clearInterval(timer); timer = null
            tip.innerText = `加载完成 ${name}`
          }
        })
        tip.innerText = submitter.value + '中'
        const list = Array.from(archive.parse(els.namedItem('src').value)).join(' ')
        vm.audioSrc = URL.createObjectURL(await lib.concat(list.split(' ')))
        tip.innerText = ''
        dest.value = list
      } catch (err) {
        tip.innerText = submitter.value + '失败'
        throw err
      } finally {
        clearInterval(timer)
        submitter.disabled = false
      }
    }
  },
  render() {
    const vm = this
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
})