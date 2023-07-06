
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import * as rollupPluginutils from 'rollup-pluginutils'
import { nodeBuiltins } from './src/node-builtins'
// https://vitejs.dev/config/
const ipinyinjs = () => {
  const filter = rollupPluginutils.createFilter(['node_modules/ipinyinjs/**'])
  return {
    transform(code, id) {
      if (!filter(id)) { return null }
      if (id.endsWith('node_modules/ipinyinjs/dict/pinyin_dict_withtone.js')) {
        return `export ${code}`
      }
      if (id.endsWith('node_modules/ipinyinjs/pinyinUtil.js')) {
        return `
import { pinyin_dict_withtone } from 'ipinyinjs/dict/pinyin_dict_withtone'
var window = { pinyin_dict_withtone }, module
${code}
export default window.pinyinUtil`
      }
    }
  }
}
export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
    minify: false
  },
  plugins: [
    ...nodeBuiltins(),
    ipinyinjs(),
    splitVendorChunkPlugin()
  ]
})
