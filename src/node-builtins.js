
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { resolve } = require
import inject from 'rollup-plugin-inject'
import builtins from 'rollup-plugin-node-polyfills'

export const nodeBuiltins = (opts = {}) => {
  const { resolveId: nodePolyfillsPluginResolveId, ...nodePolyfillsPlugin } = builtins(opts)
  const injectPlugin = inject({
    include: opts.include == null ? 'node_modules/**/*.js' : void 0,
    exclude: opts.exclude,
    sourceMap: opts.sourceMap,
    modules: {
      'setImmediate': ['timers', 'setImmediate'],
      'clearImmediate': ['timers', 'clearImmediate']
    }
  })
  const libs = new Map()
  libs.set('stream', resolve('readable-stream/lib/ours/browser'))
  libs.set('zlib', resolve('./unzip/dummy-zlib'))
  for (const mod of [
    '_stream_duplex', '_stream_passthrough',
    '_stream_readable', '_stream_writable', '_stream_transform'
  ]) {
    libs.set(mod, resolve('readable-stream/lib/' + mod))
  }
  return [
    {
      name: 'node-builtins-resolve-id',
      resolveId(importee, importer) {
        if (libs.has(importee)) {
          return { id: libs.get(importee), moduleSideEffects: false }
        }
        return nodePolyfillsPluginResolveId.call(this, importee, importer)
      },
      enforce: 'pre'
    },
    {
      ...nodePolyfillsPlugin,
      enforce: 'post'
    },
    {
      name: 'node-builtins-transform',
      transform(code, id) {
        return injectPlugin.transform.call(this, code, id)
      },
      enforce: 'post'
    }
  ]
}
export default nodeBuiltins