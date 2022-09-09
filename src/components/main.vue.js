
import * as Vue from 'vue'
const { createVNode: h, defineComponent } = Vue
import { Archive, ArchiveWithEx } from '../voice/archive'
const name = '活字印刷语音'
export default defineComponent({
  name,
  data() {
    return {
      audioSrc: null,
      tip: ''
    }
  },
  created() {
    const vm = this
    const otto = new ArchiveWithEx('./otto')
    vm.voices = new Map([
      ['电棍', otto.main],
      ['电棍(原声大碟)', otto],
      ['塔菲', new Archive('./taffy')]
    ])
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
      const vm = this, el = e.target, { elements: els } = el
      const src = els.namedItem('src'), dest = els.namedItem('dest')
      try {
        URL.revokeObjectURL(vm.audioSrc)
        e.submitter.disabled = true
        vm.tip = ''
        vm.audioSrc = null
        dest.value = ''
        const archive = vm.voices.get(els.namedItem('voice').value)
        const lib = await archive.getVoiceLibrary(48000)
        const list = Array.from(archive.parse(src.value)).join(' ')
        vm.audioSrc = URL.createObjectURL(await lib.concat(list.split(' ')))
        dest.value = list
      } catch (err) {
        vm.tip = e.submitter.value + '失败'
        throw err
      } finally {
        e.submitter.disabled = false
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
        h('span', null, vm.tip)
      ])
    ])
  }
})