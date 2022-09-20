
import { Buffer } from 'buffer'
import EventEmitter from 'events'
import stream from 'stream'
import wav from 'wav-encoder'
import yauzl from 'yauzl'
import pinyinUtil from 'ipinyinjs/pinyinUtil'
import * as Vue from 'vue'

import Main from './components/main.vue'
const vm = Vue.createApp(Main).mount('#app')

Object.assign(window, {
  modules: { Buffer, EventEmitter, stream, wav, yauzl, pinyinUtil, Vue },
  vm
})