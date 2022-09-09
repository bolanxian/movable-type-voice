import { defineConfig, splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import * as rollupPluginutils from 'rollup-pluginutils'
// https://vitejs.dev/config/

const requireBuffer = ['node_modules/fd-slicer/**', 'node_modules/yauzl/**']
const filter = rollupPluginutils.createFilter(requireBuffer, []);
export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    polyfillModulePreload: false,
    cssCodeSplit: false,
    minify: false
  },
  plugins: [
    { ...builtins(), enforce: 'pre' },
    //vue(),
    globals({ exclude: requireBuffer }),
    {
      transform(code, id) {
        if (!filter(id)) {
          if (id.endsWith('node_modules/ipinyinjs/dict/pinyin_dict_withtone.js')) {
            return `${code};module.exports=pinyin_dict_withtone`
          }
          if (id.endsWith('node_modules/ipinyinjs/pinyinUtil.js')) {
            return `
const pinyin_dict_withtone=require("ipinyinjs/dict/pinyin_dict_withtone")
const window={pinyin_dict_withtone}
${code}
module.exports=window.pinyinUtil`
          }
          return null
        }
        if (id.slice(-3) !== '.js') return null
        const prefix = 'const {Buffer}=require("buffer-es6")\nconst setImmediate=require("process-es6").nextTick\n'
        if (id.endsWith('/node_modules/yauzl/index.js')) {
          return `${prefix}${code.replace(/require\("zlib"\)/, 'require("../../src/unzip/dummy-zlib.js")')
            }`
        }
        return `${prefix}${code}`
      }
    },
    splitVendorChunkPlugin()
  ]
})
