

export const { apply } = Reflect
const { bind: _bind, call: _call } = Function.prototype
const _bindCall = apply(_bind, _bind, [_call])

const bindMap = new WeakMap()
const { get: _get, set: _set } = WeakMap.prototype
const get = _bindCall(_get)
const set = _bindCall(_set)
set(bindMap, _get, get)
set(bindMap, _set, set)
export const bindCall = ((fn) => {
  let bound = get(bindMap, fn)
  if (bound == null) {
    bound = _bindCall(fn)
    set(bindMap, fn, bound)
  }
  return bound
})
export const bind = bindCall(_bind)

const handler = {
  get(target, key, receiver) {
    const value = target[key]
    if (typeof value === 'function') {
      return bindCall(value)
    }
  }
}
const createBinder = (o) => new Proxy(o, handler)
export const $number = createBinder(Number.prototype)
export const $string = createBinder(String.prototype)
export const $array = createBinder(Array.prototype)

export const now = bind(Performance.prototype.now, performance)

export const { toFixed } = $number
export const { padStart, repeat, slice } = $string
const int = BigInt, { pow, min, trunc } = Math

const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
const exps = Array.from(units, (_, i) => pow(0x400, i))
export const formatBytes = bytes => {
  let i = 1, len = exps.length
  while (i < len && bytes > exps[i]) { i++ } i--
  return `${toFixed(bytes / exps[i], min(2, i >> 1))}${units[i]}`
}

function* _formatRelativeTime(t) {
  t = trunc(t)
  if (!(t >= 0)) { return yield '未知' }
  if (!(t < 8640000)) { return yield '\u221E' }
  t = int(t)
  switch (true) {
    case t >= 86400n: yield `${padStart(t / 86400n, 2, '0')} 天`; t %= 86400n
    case t >= 3600n: yield `${padStart(t / 3600n, 2, '0')} 时`; t %= 3600n
    case t >= 60n: yield `${padStart(t / 60n, 2, '0')} 分`; t %= 60n
    default: yield `${padStart(t, 2, '0')} 秒`
  }
}
export const formatRelativeTime = (t) => {
  const [a, b] = _formatRelativeTime(t)
  return `${a}${b != null ? ` ${b}` : ''}`
}

const template = `${repeat('\u{1F7E9}', 49)}\u{1F7E8}${repeat('\u{1F7E6}', 49)}`
export const formatProgress = (loaded, total) => {
  const i = 50 - trunc(50 * loaded / total)
  return i >= 0 ? slice(template, 2 * i, 2 * (i + 49)) : ''
}

export const renderProgress = (progress, start) => {
  const loadedTime = formatRelativeTime((now() - start) / 1000)
  const { loaded, speed } = progress
  const $loaded = formatBytes(loaded)
  const $speed = formatBytes(speed)
  if (!progress.lengthComputable) {
    return `[ ${$speed}/s ][ ${loadedTime} ] ${$loaded}`
  }
  const { total, percent } = progress
  const notLoaded = total - loaded
  const $total = formatBytes(total)
  const remaining = formatRelativeTime(notLoaded > 0 ? notLoaded / speed : 0)
  return `${formatProgress(loaded, total)}
[ ${percent} ][ ${$speed}/s ][ ${loadedTime} ][ 剩余 ${remaining} ] ${$loaded}/${$total}
`
}
