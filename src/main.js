
import { createApp } from 'vue'
import { Archive, ArchiveWithEx } from './voice/archive'
import Main from './components/main.vue'

const otto = new ArchiveWithEx('./otto', '电棍')
//const taffy = new Archive('./taffy', '塔菲')
const voices = new Map()
for (const arch of [otto.main, otto/*, taffy*/]) {
  voices.set(arch.name, arch)
}

const vm = createApp(Main, { voices }).mount('#app')
window.vm = vm