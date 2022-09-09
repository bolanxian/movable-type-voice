import { createApp } from 'vue'

import process from 'process-es6'
import { Buffer } from 'buffer-es6'
import EventEmitter from 'events'
import stream from 'stream'
import wav from 'wav-encoder'
import yauzl from 'yauzl'
import pinyinUtil from 'ipinyinjs/pinyinUtil'
import Main from './components/main.vue'

const vm = createApp(Main).mount('#app')

Object.assign(window, {
  main: { process: process, Buffer: Buffer, EventEmitter, stream, wav, yauzl, pinyinUtil },
  vm
})