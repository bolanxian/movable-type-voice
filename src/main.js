
import { createApp } from 'vue'
import { Archive, ArchiveWithEx } from './voice/archive'
import Main from './components/main.vue'

const otto = new ArchiveWithEx('./otto', '电棍')
const map = new Map()
for (const arch of [otto.main, otto]) {
  map.set(arch.name, arch)
}

const vm = createApp(Main, { map }).mount('#app')
window.vm = vm