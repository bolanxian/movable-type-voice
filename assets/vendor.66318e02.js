const global$1 = (typeof global !== "undefined" ? global :
            typeof self !== "undefined" ? self :
            typeof window !== "undefined" ? window : {});

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout$1() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout$1 () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout$1 = defaultSetTimout$1;
var cachedClearTimeout$1 = defaultClearTimeout$1;
if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout$1 = setTimeout;
}
if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout$1 = clearTimeout;
}

function runTimeout$1(fun) {
    if (cachedSetTimeout$1 === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout$1 === defaultSetTimout$1 || !cachedSetTimeout$1) && setTimeout) {
        cachedSetTimeout$1 = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout$1(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout$1.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout$1.call(this, fun, 0);
        }
    }


}
function runClearTimeout$1(marker) {
    if (cachedClearTimeout$1 === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout$1 === defaultClearTimeout$1 || !cachedClearTimeout$1) && clearTimeout) {
        cachedClearTimeout$1 = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout$1(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout$1.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout$1.call(this, marker);
        }
    }



}
var queue$2 = [];
var draining$1 = false;
var currentQueue$1;
var queueIndex$1 = -1;

function cleanUpNextTick$1() {
    if (!draining$1 || !currentQueue$1) {
        return;
    }
    draining$1 = false;
    if (currentQueue$1.length) {
        queue$2 = currentQueue$1.concat(queue$2);
    } else {
        queueIndex$1 = -1;
    }
    if (queue$2.length) {
        drainQueue$1();
    }
}

function drainQueue$1() {
    if (draining$1) {
        return;
    }
    var timeout = runTimeout$1(cleanUpNextTick$1);
    draining$1 = true;

    var len = queue$2.length;
    while(len) {
        currentQueue$1 = queue$2;
        queue$2 = [];
        while (++queueIndex$1 < len) {
            if (currentQueue$1) {
                currentQueue$1[queueIndex$1].run();
            }
        }
        queueIndex$1 = -1;
        len = queue$2.length;
    }
    currentQueue$1 = null;
    draining$1 = false;
    runClearTimeout$1(timeout);
}
function nextTick$2(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue$2.push(new Item$1(fun, args));
    if (queue$2.length === 1 && !draining$1) {
        runTimeout$1(drainQueue$1);
    }
}
// v8 likes predictible objects
function Item$1(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item$1.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title$1 = 'browser';
var platform$1 = 'browser';
var browser$1 = true;
var env$1 = {};
var argv$1 = [];
var version$2 = ''; // empty string to avoid regexp issues
var versions$1 = {};
var release$1 = {};
var config$1 = {};

function noop$1() {}

var on$1 = noop$1;
var addListener$1 = noop$1;
var once$1 = noop$1;
var off$1 = noop$1;
var removeListener$1 = noop$1;
var removeAllListeners$1 = noop$1;
var emit$2 = noop$1;

function binding$1(name) {
    throw new Error('process.binding is not supported');
}

function cwd$1 () { return '/' }
function chdir$1 (dir) {
    throw new Error('process.chdir is not supported');
}function umask$1() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance$2 = global$1.performance || {};
var performanceNow$1 =
  performance$2.now        ||
  performance$2.mozNow     ||
  performance$2.msNow      ||
  performance$2.oNow       ||
  performance$2.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime$1(previousTimestamp){
  var clocktime = performanceNow$1.call(performance$2)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime$1 = new Date();
function uptime$1() {
  var currentTime = new Date();
  var dif = currentTime - startTime$1;
  return dif / 1000;
}

const process$1 = {
  nextTick: nextTick$2,
  title: title$1,
  browser: browser$1,
  env: env$1,
  argv: argv$1,
  version: version$2,
  versions: versions$1,
  on: on$1,
  addListener: addListener$1,
  once: once$1,
  off: off$1,
  removeListener: removeListener$1,
  removeAllListeners: removeAllListeners$1,
  emit: emit$2,
  binding: binding$1,
  cwd: cwd$1,
  chdir: chdir$1,
  umask: umask$1,
  hrtime: hrtime$1,
  platform: platform$1,
  release: release$1,
  config: config$1,
  uptime: uptime$1
};

const browser$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            nextTick: nextTick$2,
            title: title$1,
            platform: platform$1,
            browser: browser$1,
            env: env$1,
            argv: argv$1,
            version: version$2,
            versions: versions$1,
            release: release$1,
            config: config$1,
            on: on$1,
            addListener: addListener$1,
            once: once$1,
            off: off$1,
            removeListener: removeListener$1,
            removeAllListeners: removeAllListeners$1,
            emit: emit$2,
            binding: binding$1,
            cwd: cwd$1,
            chdir: chdir$1,
            umask: umask$1,
            hrtime: hrtime$1,
            uptime: uptime$1,
            default: process$1
}, Symbol.toStringTag, { value: 'Module' }));

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * IMPORTANT: all calls of this function must be prefixed with
 * \/\*#\_\_PURE\_\_\*\/
 * So that rollup can tree-shake them if necessary.
 */
function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(',');
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }
    return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
}

const GLOBALS_WHITE_LISTED = 'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
    'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
    'Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt';
const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED);

/**
 * On the client we only need to offer special cases for boolean attributes that
 * have different names from their corresponding dom properties:
 * - itemscope -> N/A
 * - allowfullscreen -> allowFullscreen
 * - formnovalidate -> formNoValidate
 * - ismap -> isMap
 * - nomodule -> noModule
 * - novalidate -> noValidate
 * - readonly -> readOnly
 */
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs);
/**
 * Boolean attributes should be included if the value is truthy or ''.
 * e.g. `<select multiple>` compiles to `{ multiple: '' }`
 */
function includeBooleanAttr(value) {
    return !!value || value === '';
}

function normalizeStyle(value) {
    if (isArray$2(value)) {
        const res = {};
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            const normalized = isString$1(item)
                ? parseStringStyle(item)
                : normalizeStyle(item);
            if (normalized) {
                for (const key in normalized) {
                    res[key] = normalized[key];
                }
            }
        }
        return res;
    }
    else if (isString$1(value)) {
        return value;
    }
    else if (isObject$1(value)) {
        return value;
    }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
    const ret = {};
    cssText.split(listDelimiterRE).forEach(item => {
        if (item) {
            const tmp = item.split(propertyDelimiterRE);
            tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
        }
    });
    return ret;
}
function normalizeClass(value) {
    let res = '';
    if (isString$1(value)) {
        res = value;
    }
    else if (isArray$2(value)) {
        for (let i = 0; i < value.length; i++) {
            const normalized = normalizeClass(value[i]);
            if (normalized) {
                res += normalized + ' ';
            }
        }
    }
    else if (isObject$1(value)) {
        for (const name in value) {
            if (value[name]) {
                res += name + ' ';
            }
        }
    }
    return res.trim();
}
function normalizeProps(props) {
    if (!props)
        return null;
    let { class: klass, style } = props;
    if (klass && !isString$1(klass)) {
        props.class = normalizeClass(klass);
    }
    if (style) {
        props.style = normalizeStyle(style);
    }
    return props;
}

function looseCompareArrays(a, b) {
    if (a.length !== b.length)
        return false;
    let equal = true;
    for (let i = 0; equal && i < a.length; i++) {
        equal = looseEqual(a[i], b[i]);
    }
    return equal;
}
function looseEqual(a, b) {
    if (a === b)
        return true;
    let aValidType = isDate$1(a);
    let bValidType = isDate$1(b);
    if (aValidType || bValidType) {
        return aValidType && bValidType ? a.getTime() === b.getTime() : false;
    }
    aValidType = isSymbol$1(a);
    bValidType = isSymbol$1(b);
    if (aValidType || bValidType) {
        return a === b;
    }
    aValidType = isArray$2(a);
    bValidType = isArray$2(b);
    if (aValidType || bValidType) {
        return aValidType && bValidType ? looseCompareArrays(a, b) : false;
    }
    aValidType = isObject$1(a);
    bValidType = isObject$1(b);
    if (aValidType || bValidType) {
        /* istanbul ignore if: this if will probably never be called */
        if (!aValidType || !bValidType) {
            return false;
        }
        const aKeysCount = Object.keys(a).length;
        const bKeysCount = Object.keys(b).length;
        if (aKeysCount !== bKeysCount) {
            return false;
        }
        for (const key in a) {
            const aHasKey = a.hasOwnProperty(key);
            const bHasKey = b.hasOwnProperty(key);
            if ((aHasKey && !bHasKey) ||
                (!aHasKey && bHasKey) ||
                !looseEqual(a[key], b[key])) {
                return false;
            }
        }
    }
    return String(a) === String(b);
}
function looseIndexOf(arr, val) {
    return arr.findIndex(item => looseEqual(item, val));
}

/**
 * For converting {{ interpolation }} values to displayed strings.
 * @private
 */
const toDisplayString = (val) => {
    return isString$1(val)
        ? val
        : val == null
            ? ''
            : isArray$2(val) ||
                (isObject$1(val) &&
                    (val.toString === objectToString$1 || !isFunction$1(val.toString)))
                ? JSON.stringify(val, replacer, 2)
                : String(val);
};
const replacer = (_key, val) => {
    // can't use isRef here since @vue/shared has no deps
    if (val && val.__v_isRef) {
        return replacer(_key, val.value);
    }
    else if (isMap(val)) {
        return {
            [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
                entries[`${key} =>`] = val;
                return entries;
            }, {})
        };
    }
    else if (isSet(val)) {
        return {
            [`Set(${val.size})`]: [...val.values()]
        };
    }
    else if (isObject$1(val) && !isArray$2(val) && !isPlainObject(val)) {
        return String(val);
    }
    return val;
};

const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => { };
/**
 * Always return false.
 */
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith('onUpdate:');
const extend = Object.assign;
const remove = (arr, el) => {
    const i = arr.indexOf(el);
    if (i > -1) {
        arr.splice(i, 1);
    }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray$2 = Array.isArray;
const isMap = (val) => toTypeString(val) === '[object Map]';
const isSet = (val) => toTypeString(val) === '[object Set]';
const isDate$1 = (val) => toTypeString(val) === '[object Date]';
const isFunction$1 = (val) => typeof val === 'function';
const isString$1 = (val) => typeof val === 'string';
const isSymbol$1 = (val) => typeof val === 'symbol';
const isObject$1 = (val) => val !== null && typeof val === 'object';
const isPromise = (val) => {
    return isObject$1(val) && isFunction$1(val.then) && isFunction$1(val.catch);
};
const objectToString$1 = Object.prototype.toString;
const toTypeString = (value) => objectToString$1.call(value);
const toRawType = (value) => {
    // extract "RawType" from strings like "[object RawType]"
    return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === '[object Object]';
const isIntegerKey = (key) => isString$1(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key;
const isReservedProp = /*#__PURE__*/ makeMap(
// the leading comma is intentional so empty string "" is also included
',key,ref,ref_for,ref_key,' +
    'onVnodeBeforeMount,onVnodeMounted,' +
    'onVnodeBeforeUpdate,onVnodeUpdated,' +
    'onVnodeBeforeUnmount,onVnodeUnmounted');
const cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return ((str) => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    });
};
const camelizeRE = /-(\w)/g;
/**
 * @private
 */
const camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
});
const hyphenateRE = /\B([A-Z])/g;
/**
 * @private
 */
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase());
/**
 * @private
 */
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
/**
 * @private
 */
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
// compare whether a value has changed, accounting for NaN.
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
    for (let i = 0; i < fns.length; i++) {
        fns[i](arg);
    }
};
const def = (obj, key, value) => {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        value
    });
};
const toNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
    return (_globalThis ||
        (_globalThis =
            typeof globalThis !== 'undefined'
                ? globalThis
                : typeof self !== 'undefined'
                    ? self
                    : typeof window !== 'undefined'
                        ? window
                        : typeof global$1 !== 'undefined'
                            ? global$1
                            : {}));
};

let activeEffectScope;
class EffectScope {
    constructor(detached = false) {
        /**
         * @internal
         */
        this.active = true;
        /**
         * @internal
         */
        this.effects = [];
        /**
         * @internal
         */
        this.cleanups = [];
        if (!detached && activeEffectScope) {
            this.parent = activeEffectScope;
            this.index =
                (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
        }
    }
    run(fn) {
        if (this.active) {
            const currentEffectScope = activeEffectScope;
            try {
                activeEffectScope = this;
                return fn();
            }
            finally {
                activeEffectScope = currentEffectScope;
            }
        }
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    on() {
        activeEffectScope = this;
    }
    /**
     * This should only be called on non-detached scopes
     * @internal
     */
    off() {
        activeEffectScope = this.parent;
    }
    stop(fromParent) {
        if (this.active) {
            let i, l;
            for (i = 0, l = this.effects.length; i < l; i++) {
                this.effects[i].stop();
            }
            for (i = 0, l = this.cleanups.length; i < l; i++) {
                this.cleanups[i]();
            }
            if (this.scopes) {
                for (i = 0, l = this.scopes.length; i < l; i++) {
                    this.scopes[i].stop(true);
                }
            }
            // nested scope, dereference from parent to avoid memory leaks
            if (this.parent && !fromParent) {
                // optimized O(1) removal
                const last = this.parent.scopes.pop();
                if (last && last !== this) {
                    this.parent.scopes[this.index] = last;
                    last.index = this.index;
                }
            }
            this.active = false;
        }
    }
}
function effectScope(detached) {
    return new EffectScope(detached);
}
function recordEffectScope(effect, scope = activeEffectScope) {
    if (scope && scope.active) {
        scope.effects.push(effect);
    }
}
function getCurrentScope() {
    return activeEffectScope;
}
function onScopeDispose(fn) {
    if (activeEffectScope) {
        activeEffectScope.cleanups.push(fn);
    }
}

const createDep = (effects) => {
    const dep = new Set(effects);
    dep.w = 0;
    dep.n = 0;
    return dep;
};
const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
const newTracked = (dep) => (dep.n & trackOpBit) > 0;
const initDepMarkers = ({ deps }) => {
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].w |= trackOpBit; // set was tracked
        }
    }
};
const finalizeDepMarkers = (effect) => {
    const { deps } = effect;
    if (deps.length) {
        let ptr = 0;
        for (let i = 0; i < deps.length; i++) {
            const dep = deps[i];
            if (wasTracked(dep) && !newTracked(dep)) {
                dep.delete(effect);
            }
            else {
                deps[ptr++] = dep;
            }
            // clear bits
            dep.w &= ~trackOpBit;
            dep.n &= ~trackOpBit;
        }
        deps.length = ptr;
    }
};

const targetMap = new WeakMap();
// The number of effects currently being tracked recursively.
let effectTrackDepth = 0;
let trackOpBit = 1;
/**
 * The bitwise track markers support at most 30 levels of recursion.
 * This value is chosen to enable modern JS engines to use a SMI on all platforms.
 * When recursion depth is greater, fall back to using a full cleanup.
 */
const maxMarkerBits = 30;
let activeEffect;
const ITERATE_KEY = Symbol('');
const MAP_KEY_ITERATE_KEY = Symbol('');
class ReactiveEffect {
    constructor(fn, scheduler = null, scope) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
        this.parent = undefined;
        recordEffectScope(this, scope);
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        let parent = activeEffect;
        let lastShouldTrack = shouldTrack;
        while (parent) {
            if (parent === this) {
                return;
            }
            parent = parent.parent;
        }
        try {
            this.parent = activeEffect;
            activeEffect = this;
            shouldTrack = true;
            trackOpBit = 1 << ++effectTrackDepth;
            if (effectTrackDepth <= maxMarkerBits) {
                initDepMarkers(this);
            }
            else {
                cleanupEffect(this);
            }
            return this.fn();
        }
        finally {
            if (effectTrackDepth <= maxMarkerBits) {
                finalizeDepMarkers(this);
            }
            trackOpBit = 1 << --effectTrackDepth;
            activeEffect = this.parent;
            shouldTrack = lastShouldTrack;
            this.parent = undefined;
            if (this.deferStop) {
                this.stop();
            }
        }
    }
    stop() {
        // stopped while running itself - defer the cleanup
        if (activeEffect === this) {
            this.deferStop = true;
        }
        else if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
function effect(fn, options) {
    if (fn.effect) {
        fn = fn.effect.fn;
    }
    const _effect = new ReactiveEffect(fn);
    if (options) {
        extend(_effect, options);
        if (options.scope)
            recordEffectScope(_effect, options.scope);
    }
    if (!options || !options.lazy) {
        _effect.run();
    }
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
}
function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === undefined ? true : last;
}
function track(target, type, key) {
    if (shouldTrack && activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
}
function trackEffects(dep, debuggerEventExtraInfo) {
    let shouldTrack = false;
    if (effectTrackDepth <= maxMarkerBits) {
        if (!newTracked(dep)) {
            dep.n |= trackOpBit; // set newly tracked
            shouldTrack = !wasTracked(dep);
        }
    }
    else {
        // Full cleanup mode.
        shouldTrack = !dep.has(activeEffect);
    }
    if (shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        // never been tracked
        return;
    }
    let deps = [];
    if (type === "clear" /* TriggerOpTypes.CLEAR */) {
        // collection being cleared
        // trigger all effects for target
        deps = [...depsMap.values()];
    }
    else if (key === 'length' && isArray$2(target)) {
        depsMap.forEach((dep, key) => {
            if (key === 'length' || key >= newValue) {
                deps.push(dep);
            }
        });
    }
    else {
        // schedule runs for SET | ADD | DELETE
        if (key !== void 0) {
            deps.push(depsMap.get(key));
        }
        // also run for iteration key on ADD | DELETE | Map.SET
        switch (type) {
            case "add" /* TriggerOpTypes.ADD */:
                if (!isArray$2(target)) {
                    deps.push(depsMap.get(ITERATE_KEY));
                    if (isMap(target)) {
                        deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                    }
                }
                else if (isIntegerKey(key)) {
                    // new index added to array -> length changes
                    deps.push(depsMap.get('length'));
                }
                break;
            case "delete" /* TriggerOpTypes.DELETE */:
                if (!isArray$2(target)) {
                    deps.push(depsMap.get(ITERATE_KEY));
                    if (isMap(target)) {
                        deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                    }
                }
                break;
            case "set" /* TriggerOpTypes.SET */:
                if (isMap(target)) {
                    deps.push(depsMap.get(ITERATE_KEY));
                }
                break;
        }
    }
    if (deps.length === 1) {
        if (deps[0]) {
            {
                triggerEffects(deps[0]);
            }
        }
    }
    else {
        const effects = [];
        for (const dep of deps) {
            if (dep) {
                effects.push(...dep);
            }
        }
        {
            triggerEffects(createDep(effects));
        }
    }
}
function triggerEffects(dep, debuggerEventExtraInfo) {
    // spread into array for stabilization
    const effects = isArray$2(dep) ? dep : [...dep];
    for (const effect of effects) {
        if (effect.computed) {
            triggerEffect(effect);
        }
    }
    for (const effect of effects) {
        if (!effect.computed) {
            triggerEffect(effect);
        }
    }
}
function triggerEffect(effect, debuggerEventExtraInfo) {
    if (effect !== activeEffect || effect.allowRecurse) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
/*#__PURE__*/
Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => Symbol[key])
    .filter(isSymbol$1));
const get = /*#__PURE__*/ createGetter();
const shallowGet = /*#__PURE__*/ createGetter(false, true);
const readonlyGet = /*#__PURE__*/ createGetter(true);
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations();
function createArrayInstrumentations() {
    const instrumentations = {};
    ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
        instrumentations[key] = function (...args) {
            const arr = toRaw(this);
            for (let i = 0, l = this.length; i < l; i++) {
                track(arr, "get" /* TrackOpTypes.GET */, i + '');
            }
            // we run the method using the original args first (which may be reactive)
            const res = arr[key](...args);
            if (res === -1 || res === false) {
                // if that didn't work, run it again using raw values.
                return arr[key](...args.map(toRaw));
            }
            else {
                return res;
            }
        };
    });
    ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
        instrumentations[key] = function (...args) {
            pauseTracking();
            const res = toRaw(this)[key].apply(this, args);
            resetTracking();
            return res;
        };
    });
    return instrumentations;
}
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_isShallow" /* ReactiveFlags.IS_SHALLOW */) {
            return shallow;
        }
        else if (key === "__v_raw" /* ReactiveFlags.RAW */ &&
            receiver ===
                (isReadonly
                    ? shallow
                        ? shallowReadonlyMap
                        : readonlyMap
                    : shallow
                        ? shallowReactiveMap
                        : reactiveMap).get(target)) {
            return target;
        }
        const targetIsArray = isArray$2(target);
        if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver);
        }
        const res = Reflect.get(target, key, receiver);
        if (isSymbol$1(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
            return res;
        }
        if (!isReadonly) {
            track(target, "get" /* TrackOpTypes.GET */, key);
        }
        if (shallow) {
            return res;
        }
        if (isRef(res)) {
            // ref unwrapping - skip unwrap for Array + integer key.
            return targetIsArray && isIntegerKey(key) ? res : res.value;
        }
        if (isObject$1(res)) {
            // Convert returned value into a proxy as well. we do the isObject check
            // here to avoid invalid value warning. Also need to lazy access readonly
            // and reactive here to avoid circular dependency.
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
const set = /*#__PURE__*/ createSetter();
const shallowSet = /*#__PURE__*/ createSetter(true);
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        let oldValue = target[key];
        if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
            return false;
        }
        if (!shallow) {
            if (!isShallow(value) && !isReadonly(value)) {
                oldValue = toRaw(oldValue);
                value = toRaw(value);
            }
            if (!isArray$2(target) && isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            }
        }
        const hadKey = isArray$2(target) && isIntegerKey(key)
            ? Number(key) < target.length
            : hasOwn(target, key);
        const result = Reflect.set(target, key, value, receiver);
        // don't trigger if target is something up in the prototype chain of original
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, "add" /* TriggerOpTypes.ADD */, key, value);
            }
            else if (hasChanged(value, oldValue)) {
                trigger(target, "set" /* TriggerOpTypes.SET */, key, value);
            }
        }
        return result;
    };
}
function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
        trigger(target, "delete" /* TriggerOpTypes.DELETE */, key, undefined);
    }
    return result;
}
function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol$1(key) || !builtInSymbols.has(key)) {
        track(target, "has" /* TrackOpTypes.HAS */, key);
    }
    return result;
}
function ownKeys(target) {
    track(target, "iterate" /* TrackOpTypes.ITERATE */, isArray$2(target) ? 'length' : ITERATE_KEY);
    return Reflect.ownKeys(target);
}
const mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        return true;
    },
    deleteProperty(target, key) {
        return true;
    }
};
const shallowReactiveHandlers = /*#__PURE__*/ extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
});
// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
const shallowReadonlyHandlers = /*#__PURE__*/ extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function get$1(target, key, isReadonly = false, isShallow = false) {
    // #1772: readonly(reactive(Map)) should return readonly + reactive version
    // of the value
    target = target["__v_raw" /* ReactiveFlags.RAW */];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly) {
        if (key !== rawKey) {
            track(rawTarget, "get" /* TrackOpTypes.GET */, key);
        }
        track(rawTarget, "get" /* TrackOpTypes.GET */, rawKey);
    }
    const { has } = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
    }
    else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
    }
    else if (target !== rawTarget) {
        // #3602 readonly(reactive(Map))
        // ensure that the nested reactive `Map` can do tracking for itself
        target.get(key);
    }
}
function has$1(key, isReadonly = false) {
    const target = this["__v_raw" /* ReactiveFlags.RAW */];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (!isReadonly) {
        if (key !== rawKey) {
            track(rawTarget, "has" /* TrackOpTypes.HAS */, key);
        }
        track(rawTarget, "has" /* TrackOpTypes.HAS */, rawKey);
    }
    return key === rawKey
        ? target.has(key)
        : target.has(key) || target.has(rawKey);
}
function size(target, isReadonly = false) {
    target = target["__v_raw" /* ReactiveFlags.RAW */];
    !isReadonly && track(toRaw(target), "iterate" /* TrackOpTypes.ITERATE */, ITERATE_KEY);
    return Reflect.get(target, 'size', target);
}
function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
        target.add(value);
        trigger(target, "add" /* TriggerOpTypes.ADD */, value, value);
    }
    return this;
}
function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has, get } = getProto(target);
    let hadKey = has.call(target, key);
    if (!hadKey) {
        key = toRaw(key);
        hadKey = has.call(target, key);
    }
    const oldValue = get.call(target, key);
    target.set(key, value);
    if (!hadKey) {
        trigger(target, "add" /* TriggerOpTypes.ADD */, key, value);
    }
    else if (hasChanged(value, oldValue)) {
        trigger(target, "set" /* TriggerOpTypes.SET */, key, value);
    }
    return this;
}
function deleteEntry(key) {
    const target = toRaw(this);
    const { has, get } = getProto(target);
    let hadKey = has.call(target, key);
    if (!hadKey) {
        key = toRaw(key);
        hadKey = has.call(target, key);
    }
    get ? get.call(target, key) : undefined;
    // forward the operation before queueing reactions
    const result = target.delete(key);
    if (hadKey) {
        trigger(target, "delete" /* TriggerOpTypes.DELETE */, key, undefined);
    }
    return result;
}
function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    // forward the operation before queueing reactions
    const result = target.clear();
    if (hadItems) {
        trigger(target, "clear" /* TriggerOpTypes.CLEAR */, undefined, undefined);
    }
    return result;
}
function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
        const observed = this;
        const target = observed["__v_raw" /* ReactiveFlags.RAW */];
        const rawTarget = toRaw(target);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        !isReadonly && track(rawTarget, "iterate" /* TrackOpTypes.ITERATE */, ITERATE_KEY);
        return target.forEach((value, key) => {
            // important: make sure the callback is
            // 1. invoked with the reactive map as `this` and 3rd arg
            // 2. the value received should be a corresponding reactive/readonly.
            return callback.call(thisArg, wrap(value), wrap(key), observed);
        });
    };
}
function createIterableMethod(method, isReadonly, isShallow) {
    return function (...args) {
        const target = this["__v_raw" /* ReactiveFlags.RAW */];
        const rawTarget = toRaw(target);
        const targetIsMap = isMap(rawTarget);
        const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
        const isKeyOnly = method === 'keys' && targetIsMap;
        const innerIterator = target[method](...args);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        !isReadonly &&
            track(rawTarget, "iterate" /* TrackOpTypes.ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
        // return a wrapped iterator which returns observed versions of the
        // values emitted from the real iterator
        return {
            // iterator protocol
            next() {
                const { value, done } = innerIterator.next();
                return done
                    ? { value, done }
                    : {
                        value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                        done
                    };
            },
            // iterable protocol
            [Symbol.iterator]() {
                return this;
            }
        };
    };
}
function createReadonlyMethod(type) {
    return function (...args) {
        return type === "delete" /* TriggerOpTypes.DELETE */ ? false : this;
    };
}
function createInstrumentations() {
    const mutableInstrumentations = {
        get(key) {
            return get$1(this, key);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, false)
    };
    const shallowInstrumentations = {
        get(key) {
            return get$1(this, key, false, true);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, true)
    };
    const readonlyInstrumentations = {
        get(key) {
            return get$1(this, key, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has$1.call(this, key, true);
        },
        add: createReadonlyMethod("add" /* TriggerOpTypes.ADD */),
        set: createReadonlyMethod("set" /* TriggerOpTypes.SET */),
        delete: createReadonlyMethod("delete" /* TriggerOpTypes.DELETE */),
        clear: createReadonlyMethod("clear" /* TriggerOpTypes.CLEAR */),
        forEach: createForEach(true, false)
    };
    const shallowReadonlyInstrumentations = {
        get(key) {
            return get$1(this, key, true, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has$1.call(this, key, true);
        },
        add: createReadonlyMethod("add" /* TriggerOpTypes.ADD */),
        set: createReadonlyMethod("set" /* TriggerOpTypes.SET */),
        delete: createReadonlyMethod("delete" /* TriggerOpTypes.DELETE */),
        clear: createReadonlyMethod("clear" /* TriggerOpTypes.CLEAR */),
        forEach: createForEach(true, true)
    };
    const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
    iteratorMethods.forEach(method => {
        mutableInstrumentations[method] = createIterableMethod(method, false, false);
        readonlyInstrumentations[method] = createIterableMethod(method, true, false);
        shallowInstrumentations[method] = createIterableMethod(method, false, true);
        shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
    });
    return [
        mutableInstrumentations,
        readonlyInstrumentations,
        shallowInstrumentations,
        shallowReadonlyInstrumentations
    ];
}
const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* #__PURE__*/ createInstrumentations();
function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow
        ? isReadonly
            ? shallowReadonlyInstrumentations
            : shallowInstrumentations
        : isReadonly
            ? readonlyInstrumentations
            : mutableInstrumentations;
    return (target, key, receiver) => {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_raw" /* ReactiveFlags.RAW */) {
            return target;
        }
        return Reflect.get(hasOwn(instrumentations, key) && key in target
            ? instrumentations
            : target, key, receiver);
    };
}
const mutableCollectionHandlers = {
    get: /*#__PURE__*/ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
    get: /*#__PURE__*/ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
    get: /*#__PURE__*/ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
    get: /*#__PURE__*/ createInstrumentationGetter(true, true)
};

const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function targetTypeMap(rawType) {
    switch (rawType) {
        case 'Object':
        case 'Array':
            return 1 /* TargetType.COMMON */;
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return 2 /* TargetType.COLLECTION */;
        default:
            return 0 /* TargetType.INVALID */;
    }
}
function getTargetType(value) {
    return value["__v_skip" /* ReactiveFlags.SKIP */] || !Object.isExtensible(value)
        ? 0 /* TargetType.INVALID */
        : targetTypeMap(toRawType(value));
}
function reactive(target) {
    // if trying to observe a readonly proxy, return the readonly version.
    if (isReadonly(target)) {
        return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
/**
 * Return a shallowly-reactive copy of the original object, where only the root
 * level properties are reactive. It also does not auto-unwrap refs (even at the
 * root level).
 */
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
/**
 * Creates a readonly copy of the original object. Note the returned copy is not
 * made reactive, but `readonly` can be called on an already reactive object.
 */
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
/**
 * Returns a reactive-copy of the original object, where only the root level
 * properties are readonly, and does NOT unwrap refs nor recursively convert
 * returned properties.
 * This is used for creating the props proxy object for stateful components.
 */
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers, shallowReadonlyCollectionHandlers, shallowReadonlyMap);
}
function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject$1(target)) {
        return target;
    }
    // target is already a Proxy, return it.
    // exception: calling readonly() on a reactive object
    if (target["__v_raw" /* ReactiveFlags.RAW */] &&
        !(isReadonly && target["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */])) {
        return target;
    }
    // target already has corresponding Proxy
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    // only specific value types can be observed.
    const targetType = getTargetType(target);
    if (targetType === 0 /* TargetType.INVALID */) {
        return target;
    }
    const proxy = new Proxy(target, targetType === 2 /* TargetType.COLLECTION */ ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}
function isReactive(value) {
    if (isReadonly(value)) {
        return isReactive(value["__v_raw" /* ReactiveFlags.RAW */]);
    }
    return !!(value && value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]);
}
function isReadonly(value) {
    return !!(value && value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */]);
}
function isShallow(value) {
    return !!(value && value["__v_isShallow" /* ReactiveFlags.IS_SHALLOW */]);
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
    const raw = observed && observed["__v_raw" /* ReactiveFlags.RAW */];
    return raw ? toRaw(raw) : observed;
}
function markRaw(value) {
    def(value, "__v_skip" /* ReactiveFlags.SKIP */, true);
    return value;
}
const toReactive = (value) => isObject$1(value) ? reactive(value) : value;
const toReadonly = (value) => isObject$1(value) ? readonly(value) : value;

function trackRefValue(ref) {
    if (shouldTrack && activeEffect) {
        ref = toRaw(ref);
        {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
}
function triggerRefValue(ref, newVal) {
    ref = toRaw(ref);
    if (ref.dep) {
        {
            triggerEffects(ref.dep);
        }
    }
}
function isRef(r) {
    return !!(r && r.__v_isRef === true);
}
function ref(value) {
    return createRef(value, false);
}
function shallowRef(value) {
    return createRef(value, true);
}
function createRef(rawValue, shallow) {
    if (isRef(rawValue)) {
        return rawValue;
    }
    return new RefImpl(rawValue, shallow);
}
class RefImpl {
    constructor(value, __v_isShallow) {
        this.__v_isShallow = __v_isShallow;
        this.dep = undefined;
        this.__v_isRef = true;
        this._rawValue = __v_isShallow ? value : toRaw(value);
        this._value = __v_isShallow ? value : toReactive(value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
        newVal = useDirectValue ? newVal : toRaw(newVal);
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal;
            this._value = useDirectValue ? newVal : toReactive(newVal);
            triggerRefValue(this);
        }
    }
}
function triggerRef(ref) {
    triggerRefValue(ref);
}
function unref(ref) {
    return isRef(ref) ? ref.value : ref;
}
const shallowUnwrapHandlers = {
    get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
        }
        else {
            return Reflect.set(target, key, value, receiver);
        }
    }
};
function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class CustomRefImpl {
    constructor(factory) {
        this.dep = undefined;
        this.__v_isRef = true;
        const { get, set } = factory(() => trackRefValue(this), () => triggerRefValue(this));
        this._get = get;
        this._set = set;
    }
    get value() {
        return this._get();
    }
    set value(newVal) {
        this._set(newVal);
    }
}
function customRef(factory) {
    return new CustomRefImpl(factory);
}
function toRefs(object) {
    const ret = isArray$2(object) ? new Array(object.length) : {};
    for (const key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}
class ObjectRefImpl {
    constructor(_object, _key, _defaultValue) {
        this._object = _object;
        this._key = _key;
        this._defaultValue = _defaultValue;
        this.__v_isRef = true;
    }
    get value() {
        const val = this._object[this._key];
        return val === undefined ? this._defaultValue : val;
    }
    set value(newVal) {
        this._object[this._key] = newVal;
    }
}
function toRef(object, key, defaultValue) {
    const val = object[key];
    return isRef(val)
        ? val
        : new ObjectRefImpl(object, key, defaultValue);
}

var _a$1;
class ComputedRefImpl {
    constructor(getter, _setter, isReadonly, isSSR) {
        this._setter = _setter;
        this.dep = undefined;
        this.__v_isRef = true;
        this[_a$1] = false;
        this._dirty = true;
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
                triggerRefValue(this);
            }
        });
        this.effect.computed = this;
        this.effect.active = this._cacheable = !isSSR;
        this["__v_isReadonly" /* ReactiveFlags.IS_READONLY */] = isReadonly;
    }
    get value() {
        // the computed ref may get wrapped by other proxies e.g. readonly() #3376
        const self = toRaw(this);
        trackRefValue(self);
        if (self._dirty || !self._cacheable) {
            self._dirty = false;
            self._value = self.effect.run();
        }
        return self._value;
    }
    set value(newValue) {
        this._setter(newValue);
    }
}
_a$1 = "__v_isReadonly" /* ReactiveFlags.IS_READONLY */;
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
    let getter;
    let setter;
    const onlyGetter = isFunction$1(getterOrOptions);
    if (onlyGetter) {
        getter = getterOrOptions;
        setter = NOOP;
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter, isSSR);
    return cRef;
}

const stack = [];
function warn(msg, ...args) {
    // avoid props formatting or warn handler tracking deps that might be mutated
    // during patch, leading to infinite recursion.
    pauseTracking();
    const instance = stack.length ? stack[stack.length - 1].component : null;
    const appWarnHandler = instance && instance.appContext.config.warnHandler;
    const trace = getComponentTrace();
    if (appWarnHandler) {
        callWithErrorHandling(appWarnHandler, instance, 11 /* ErrorCodes.APP_WARN_HANDLER */, [
            msg + args.join(''),
            instance && instance.proxy,
            trace
                .map(({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`)
                .join('\n'),
            trace
        ]);
    }
    else {
        const warnArgs = [`[Vue warn]: ${msg}`, ...args];
        /* istanbul ignore if */
        if (trace.length &&
            // avoid spamming console during tests
            !false) {
            warnArgs.push(`\n`, ...formatTrace(trace));
        }
        console.warn(...warnArgs);
    }
    resetTracking();
}
function getComponentTrace() {
    let currentVNode = stack[stack.length - 1];
    if (!currentVNode) {
        return [];
    }
    // we can't just use the stack because it will be incomplete during updates
    // that did not start from the root. Re-construct the parent chain using
    // instance parent pointers.
    const normalizedStack = [];
    while (currentVNode) {
        const last = normalizedStack[0];
        if (last && last.vnode === currentVNode) {
            last.recurseCount++;
        }
        else {
            normalizedStack.push({
                vnode: currentVNode,
                recurseCount: 0
            });
        }
        const parentInstance = currentVNode.component && currentVNode.component.parent;
        currentVNode = parentInstance && parentInstance.vnode;
    }
    return normalizedStack;
}
/* istanbul ignore next */
function formatTrace(trace) {
    const logs = [];
    trace.forEach((entry, i) => {
        logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry));
    });
    return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
    const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
    const isRoot = vnode.component ? vnode.component.parent == null : false;
    const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
    const close = `>` + postfix;
    return vnode.props
        ? [open, ...formatProps(vnode.props), close]
        : [open + close];
}
/* istanbul ignore next */
function formatProps(props) {
    const res = [];
    const keys = Object.keys(props);
    keys.slice(0, 3).forEach(key => {
        res.push(...formatProp(key, props[key]));
    });
    if (keys.length > 3) {
        res.push(` ...`);
    }
    return res;
}
/* istanbul ignore next */
function formatProp(key, value, raw) {
    if (isString$1(value)) {
        value = JSON.stringify(value);
        return raw ? value : [`${key}=${value}`];
    }
    else if (typeof value === 'number' ||
        typeof value === 'boolean' ||
        value == null) {
        return raw ? value : [`${key}=${value}`];
    }
    else if (isRef(value)) {
        value = formatProp(key, toRaw(value.value), true);
        return raw ? value : [`${key}=Ref<`, value, `>`];
    }
    else if (isFunction$1(value)) {
        return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
    }
    else {
        value = toRaw(value);
        return raw ? value : [`${key}=`, value];
    }
}
function callWithErrorHandling(fn, instance, type, args) {
    let res;
    try {
        res = args ? fn(...args) : fn();
    }
    catch (err) {
        handleError(err, instance, type);
    }
    return res;
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
    if (isFunction$1(fn)) {
        const res = callWithErrorHandling(fn, instance, type, args);
        if (res && isPromise(res)) {
            res.catch(err => {
                handleError(err, instance, type);
            });
        }
        return res;
    }
    const values = [];
    for (let i = 0; i < fn.length; i++) {
        values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
}
function handleError(err, instance, type, throwInDev = true) {
    const contextVNode = instance ? instance.vnode : null;
    if (instance) {
        let cur = instance.parent;
        // the exposed instance is the render proxy to keep it consistent with 2.x
        const exposedInstance = instance.proxy;
        // in production the hook receives only the error code
        const errorInfo = type;
        while (cur) {
            const errorCapturedHooks = cur.ec;
            if (errorCapturedHooks) {
                for (let i = 0; i < errorCapturedHooks.length; i++) {
                    if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
                        return;
                    }
                }
            }
            cur = cur.parent;
        }
        // app-level handling
        const appErrorHandler = instance.appContext.config.errorHandler;
        if (appErrorHandler) {
            callWithErrorHandling(appErrorHandler, null, 10 /* ErrorCodes.APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
            return;
        }
    }
    logError(err, type, contextVNode, throwInDev);
}
function logError(err, type, contextVNode, throwInDev = true) {
    {
        // recover in prod to reduce the impact on end-user
        console.error(err);
    }
}

let isFlushing = false;
let isFlushPending = false;
const queue$1 = [];
let flushIndex = 0;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /*#__PURE__*/ Promise.resolve();
let currentFlushPromise = null;
function nextTick$1(fn) {
    const p = currentFlushPromise || resolvedPromise;
    return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
// #2768
// Use binary-search to find a suitable position in the queue,
// so that the queue maintains the increasing order of job's id,
// which can prevent the job from being skipped and also can avoid repeated patching.
function findInsertionIndex(id) {
    // the start index should be `flushIndex + 1`
    let start = flushIndex + 1;
    let end = queue$1.length;
    while (start < end) {
        const middle = (start + end) >>> 1;
        const middleJobId = getId(queue$1[middle]);
        middleJobId < id ? (start = middle + 1) : (end = middle);
    }
    return start;
}
function queueJob(job) {
    // the dedupe search uses the startIndex argument of Array.includes()
    // by default the search index includes the current job that is being run
    // so it cannot recursively trigger itself again.
    // if the job is a watch() callback, the search will start with a +1 index to
    // allow it recursively trigger itself - it is the user's responsibility to
    // ensure it doesn't end up in an infinite loop.
    if (!queue$1.length ||
        !queue$1.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) {
        if (job.id == null) {
            queue$1.push(job);
        }
        else {
            queue$1.splice(findInsertionIndex(job.id), 0, job);
        }
        queueFlush();
    }
}
function queueFlush() {
    if (!isFlushing && !isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvedPromise.then(flushJobs);
    }
}
function invalidateJob(job) {
    const i = queue$1.indexOf(job);
    if (i > flushIndex) {
        queue$1.splice(i, 1);
    }
}
function queuePostFlushCb(cb) {
    if (!isArray$2(cb)) {
        if (!activePostFlushCbs ||
            !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)) {
            pendingPostFlushCbs.push(cb);
        }
    }
    else {
        // if cb is an array, it is a component lifecycle hook which can only be
        // triggered by a job, which is already deduped in the main queue, so
        // we can skip duplicate check here to improve perf
        pendingPostFlushCbs.push(...cb);
    }
    queueFlush();
}
function flushPreFlushCbs(seen, i = flushIndex) {
    for (; i < queue$1.length; i++) {
        const cb = queue$1[i];
        if (cb && cb.pre) {
            queue$1.splice(i, 1);
            i--;
            cb();
        }
    }
}
function flushPostFlushCbs(seen) {
    if (pendingPostFlushCbs.length) {
        const deduped = [...new Set(pendingPostFlushCbs)];
        pendingPostFlushCbs.length = 0;
        // #1947 already has active queue, nested flushPostFlushCbs call
        if (activePostFlushCbs) {
            activePostFlushCbs.push(...deduped);
            return;
        }
        activePostFlushCbs = deduped;
        activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
        for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
            activePostFlushCbs[postFlushIndex]();
        }
        activePostFlushCbs = null;
        postFlushIndex = 0;
    }
}
const getId = (job) => job.id == null ? Infinity : job.id;
const comparator = (a, b) => {
    const diff = getId(a) - getId(b);
    if (diff === 0) {
        if (a.pre && !b.pre)
            return -1;
        if (b.pre && !a.pre)
            return 1;
    }
    return diff;
};
function flushJobs(seen) {
    isFlushPending = false;
    isFlushing = true;
    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child so its render effect will have smaller
    //    priority number)
    // 2. If a component is unmounted during a parent component's update,
    //    its update can be skipped.
    queue$1.sort(comparator);
    // conditional usage of checkRecursiveUpdate must be determined out of
    // try ... catch block since Rollup by default de-optimizes treeshaking
    // inside try-catch. This can leave all warning code unshaked. Although
    // they would get eventually shaken by a minifier like terser, some minifiers
    // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
    const check = NOOP;
    try {
        for (flushIndex = 0; flushIndex < queue$1.length; flushIndex++) {
            const job = queue$1[flushIndex];
            if (job && job.active !== false) {
                if (("production" !== 'production') && check(job)) ;
                // console.log(`running:`, job.id)
                callWithErrorHandling(job, null, 14 /* ErrorCodes.SCHEDULER */);
            }
        }
    }
    finally {
        flushIndex = 0;
        queue$1.length = 0;
        flushPostFlushCbs();
        isFlushing = false;
        currentFlushPromise = null;
        // some postFlushCb queued jobs!
        // keep flushing until it drains.
        if (queue$1.length || pendingPostFlushCbs.length) {
            flushJobs();
        }
    }
}

let devtools;
let buffer = [];
let devtoolsNotInstalled = false;
function emit$1(event, ...args) {
    if (devtools) {
        devtools.emit(event, ...args);
    }
    else if (!devtoolsNotInstalled) {
        buffer.push({ event, args });
    }
}
function setDevtoolsHook(hook, target) {
    var _a, _b;
    devtools = hook;
    if (devtools) {
        devtools.enabled = true;
        buffer.forEach(({ event, args }) => devtools.emit(event, ...args));
        buffer = [];
    }
    else if (
    // handle late devtools injection - only do this if we are in an actual
    // browser environment to avoid the timer handle stalling test runner exit
    // (#4815)
    typeof window !== 'undefined' &&
        // some envs mock window but not fully
        window.HTMLElement &&
        // also exclude jsdom
        !((_b = (_a = window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) === null || _b === void 0 ? void 0 : _b.includes('jsdom'))) {
        const replay = (target.__VUE_DEVTOOLS_HOOK_REPLAY__ =
            target.__VUE_DEVTOOLS_HOOK_REPLAY__ || []);
        replay.push((newHook) => {
            setDevtoolsHook(newHook, target);
        });
        // clear buffer after 3s - the user probably doesn't have devtools installed
        // at all, and keeping the buffer will cause memory leaks (#4738)
        setTimeout(() => {
            if (!devtools) {
                target.__VUE_DEVTOOLS_HOOK_REPLAY__ = null;
                devtoolsNotInstalled = true;
                buffer = [];
            }
        }, 3000);
    }
    else {
        // non-browser env, assume not installed
        devtoolsNotInstalled = true;
        buffer = [];
    }
}
function devtoolsInitApp(app, version) {
    emit$1("app:init" /* DevtoolsHooks.APP_INIT */, app, version, {
        Fragment,
        Text,
        Comment,
        Static
    });
}
function devtoolsUnmountApp(app) {
    emit$1("app:unmount" /* DevtoolsHooks.APP_UNMOUNT */, app);
}
const devtoolsComponentAdded = /*#__PURE__*/ createDevtoolsComponentHook("component:added" /* DevtoolsHooks.COMPONENT_ADDED */);
const devtoolsComponentUpdated = 
/*#__PURE__*/ createDevtoolsComponentHook("component:updated" /* DevtoolsHooks.COMPONENT_UPDATED */);
const devtoolsComponentRemoved = 
/*#__PURE__*/ createDevtoolsComponentHook("component:removed" /* DevtoolsHooks.COMPONENT_REMOVED */);
function createDevtoolsComponentHook(hook) {
    return (component) => {
        emit$1(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined, component);
    };
}
function devtoolsComponentEmit(component, event, params) {
    emit$1("component:emit" /* DevtoolsHooks.COMPONENT_EMIT */, component.appContext.app, component, event, params);
}

function emit$1$1(instance, event, ...rawArgs) {
    if (instance.isUnmounted)
        return;
    const props = instance.vnode.props || EMPTY_OBJ;
    let args = rawArgs;
    const isModelListener = event.startsWith('update:');
    // for v-model update:xxx events, apply modifiers on args
    const modelArg = isModelListener && event.slice(7);
    if (modelArg && modelArg in props) {
        const modifiersKey = `${modelArg === 'modelValue' ? 'model' : modelArg}Modifiers`;
        const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
        if (trim) {
            args = rawArgs.map(a => a.trim());
        }
        if (number) {
            args = rawArgs.map(toNumber);
        }
    }
    if (__VUE_PROD_DEVTOOLS__) {
        devtoolsComponentEmit(instance, event, args);
    }
    let handlerName;
    let handler = props[(handlerName = toHandlerKey(event))] ||
        // also try camelCase event handler (#2249)
        props[(handlerName = toHandlerKey(camelize(event)))];
    // for v-model update:xxx events, also trigger kebab-case equivalent
    // for props passed via kebab-case
    if (!handler && isModelListener) {
        handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
    }
    if (handler) {
        callWithAsyncErrorHandling(handler, instance, 6 /* ErrorCodes.COMPONENT_EVENT_HANDLER */, args);
    }
    const onceHandler = props[handlerName + `Once`];
    if (onceHandler) {
        if (!instance.emitted) {
            instance.emitted = {};
        }
        else if (instance.emitted[handlerName]) {
            return;
        }
        instance.emitted[handlerName] = true;
        callWithAsyncErrorHandling(onceHandler, instance, 6 /* ErrorCodes.COMPONENT_EVENT_HANDLER */, args);
    }
}
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
    const cache = appContext.emitsCache;
    const cached = cache.get(comp);
    if (cached !== undefined) {
        return cached;
    }
    const raw = comp.emits;
    let normalized = {};
    // apply mixin/extends props
    let hasExtends = false;
    if (__VUE_OPTIONS_API__ && !isFunction$1(comp)) {
        const extendEmits = (raw) => {
            const normalizedFromExtend = normalizeEmitsOptions(raw, appContext, true);
            if (normalizedFromExtend) {
                hasExtends = true;
                extend(normalized, normalizedFromExtend);
            }
        };
        if (!asMixin && appContext.mixins.length) {
            appContext.mixins.forEach(extendEmits);
        }
        if (comp.extends) {
            extendEmits(comp.extends);
        }
        if (comp.mixins) {
            comp.mixins.forEach(extendEmits);
        }
    }
    if (!raw && !hasExtends) {
        if (isObject$1(comp)) {
            cache.set(comp, null);
        }
        return null;
    }
    if (isArray$2(raw)) {
        raw.forEach(key => (normalized[key] = null));
    }
    else {
        extend(normalized, raw);
    }
    if (isObject$1(comp)) {
        cache.set(comp, normalized);
    }
    return normalized;
}
// Check if an incoming prop key is a declared emit event listener.
// e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
// both considered matched listeners.
function isEmitListener(options, key) {
    if (!options || !isOn(key)) {
        return false;
    }
    key = key.slice(2).replace(/Once$/, '');
    return (hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
        hasOwn(options, hyphenate(key)) ||
        hasOwn(options, key));
}

/**
 * mark the current rendering instance for asset resolution (e.g.
 * resolveComponent, resolveDirective) during render
 */
let currentRenderingInstance = null;
let currentScopeId = null;
/**
 * Note: rendering calls maybe nested. The function returns the parent rendering
 * instance if present, which should be restored after the render is done:
 *
 * ```js
 * const prev = setCurrentRenderingInstance(i)
 * // ...render
 * setCurrentRenderingInstance(prev)
 * ```
 */
function setCurrentRenderingInstance(instance) {
    const prev = currentRenderingInstance;
    currentRenderingInstance = instance;
    currentScopeId = (instance && instance.type.__scopeId) || null;
    return prev;
}
/**
 * Set scope id when creating hoisted vnodes.
 * @private compiler helper
 */
function pushScopeId(id) {
    currentScopeId = id;
}
/**
 * Technically we no longer need this after 3.0.8 but we need to keep the same
 * API for backwards compat w/ code generated by compilers.
 * @private
 */
function popScopeId() {
    currentScopeId = null;
}
/**
 * Only for backwards compat
 * @private
 */
const withScopeId = (_id) => withCtx;
/**
 * Wrap a slot function to memoize current rendering instance
 * @private compiler helper
 */
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot // false only
) {
    if (!ctx)
        return fn;
    // already normalized
    if (fn._n) {
        return fn;
    }
    const renderFnWithContext = (...args) => {
        // If a user calls a compiled slot inside a template expression (#1745), it
        // can mess up block tracking, so by default we disable block tracking and
        // force bail out when invoking a compiled slot (indicated by the ._d flag).
        // This isn't necessary if rendering a compiled `<slot>`, so we flip the
        // ._d flag off when invoking the wrapped fn inside `renderSlot`.
        if (renderFnWithContext._d) {
            setBlockTracking(-1);
        }
        const prevInstance = setCurrentRenderingInstance(ctx);
        const res = fn(...args);
        setCurrentRenderingInstance(prevInstance);
        if (renderFnWithContext._d) {
            setBlockTracking(1);
        }
        if (__VUE_PROD_DEVTOOLS__) {
            devtoolsComponentUpdated(ctx);
        }
        return res;
    };
    // mark normalized to avoid duplicated wrapping
    renderFnWithContext._n = true;
    // mark this as compiled by default
    // this is used in vnode.ts -> normalizeChildren() to set the slot
    // rendering flag.
    renderFnWithContext._c = true;
    // disable block tracking by default
    renderFnWithContext._d = true;
    return renderFnWithContext;
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance) {
    const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx, inheritAttrs } = instance;
    let result;
    let fallthroughAttrs;
    const prev = setCurrentRenderingInstance(instance);
    try {
        if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
            // withProxy is a proxy with a different `has` trap only for
            // runtime-compiled render functions using `with` block.
            const proxyToUse = withProxy || proxy;
            result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
            fallthroughAttrs = attrs;
        }
        else {
            // functional
            const render = Component;
            // in dev, mark attrs accessed if optional props (attrs === props)
            if (("production" !== 'production') && attrs === props) ;
            result = normalizeVNode(render.length > 1
                ? render(props, ("production" !== 'production')
                    ? {
                        get attrs() {
                            markAttrsAccessed();
                            return attrs;
                        },
                        slots,
                        emit
                    }
                    : { attrs, slots, emit })
                : render(props, null /* we know it doesn't need it */));
            fallthroughAttrs = Component.props
                ? attrs
                : getFunctionalFallthrough(attrs);
        }
    }
    catch (err) {
        blockStack.length = 0;
        handleError(err, instance, 1 /* ErrorCodes.RENDER_FUNCTION */);
        result = createVNode(Comment);
    }
    // attr merging
    // in dev mode, comments are preserved, and it's possible for a template
    // to have comments along side the root element which makes it a fragment
    let root = result;
    if (fallthroughAttrs && inheritAttrs !== false) {
        const keys = Object.keys(fallthroughAttrs);
        const { shapeFlag } = root;
        if (keys.length) {
            if (shapeFlag & (1 /* ShapeFlags.ELEMENT */ | 6 /* ShapeFlags.COMPONENT */)) {
                if (propsOptions && keys.some(isModelListener)) {
                    // If a v-model listener (onUpdate:xxx) has a corresponding declared
                    // prop, it indicates this component expects to handle v-model and
                    // it should not fallthrough.
                    // related: #1543, #1643, #1989
                    fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                }
                root = cloneVNode(root, fallthroughAttrs);
            }
        }
    }
    // inherit directives
    if (vnode.dirs) {
        // clone before mutating since the root may be a hoisted vnode
        root = cloneVNode(root);
        root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
    }
    // inherit transition data
    if (vnode.transition) {
        root.transition = vnode.transition;
    }
    {
        result = root;
    }
    setCurrentRenderingInstance(prev);
    return result;
}
function filterSingleRoot(children) {
    let singleRoot;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isVNode(child)) {
            // ignore user comment
            if (child.type !== Comment || child.children === 'v-if') {
                if (singleRoot) {
                    // has more than 1 non-comment child, return now
                    return;
                }
                else {
                    singleRoot = child;
                }
            }
        }
        else {
            return;
        }
    }
    return singleRoot;
}
const getFunctionalFallthrough = (attrs) => {
    let res;
    for (const key in attrs) {
        if (key === 'class' || key === 'style' || isOn(key)) {
            (res || (res = {}))[key] = attrs[key];
        }
    }
    return res;
};
const filterModelListeners = (attrs, props) => {
    const res = {};
    for (const key in attrs) {
        if (!isModelListener(key) || !(key.slice(9) in props)) {
            res[key] = attrs[key];
        }
    }
    return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
    const { props: prevProps, children: prevChildren, component } = prevVNode;
    const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
    const emits = component.emitsOptions;
    // force child update for runtime directive or transition on component vnode.
    if (nextVNode.dirs || nextVNode.transition) {
        return true;
    }
    if (optimized && patchFlag >= 0) {
        if (patchFlag & 1024 /* PatchFlags.DYNAMIC_SLOTS */) {
            // slot content that references values that might have changed,
            // e.g. in a v-for
            return true;
        }
        if (patchFlag & 16 /* PatchFlags.FULL_PROPS */) {
            if (!prevProps) {
                return !!nextProps;
            }
            // presence of this flag indicates props are always non-null
            return hasPropsChanged(prevProps, nextProps, emits);
        }
        else if (patchFlag & 8 /* PatchFlags.PROPS */) {
            const dynamicProps = nextVNode.dynamicProps;
            for (let i = 0; i < dynamicProps.length; i++) {
                const key = dynamicProps[i];
                if (nextProps[key] !== prevProps[key] &&
                    !isEmitListener(emits, key)) {
                    return true;
                }
            }
        }
    }
    else {
        // this path is only taken by manually written render functions
        // so presence of any children leads to a forced update
        if (prevChildren || nextChildren) {
            if (!nextChildren || !nextChildren.$stable) {
                return true;
            }
        }
        if (prevProps === nextProps) {
            return false;
        }
        if (!prevProps) {
            return !!nextProps;
        }
        if (!nextProps) {
            return true;
        }
        return hasPropsChanged(prevProps, nextProps, emits);
    }
    return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key] &&
            !isEmitListener(emitsOptions, key)) {
            return true;
        }
    }
    return false;
}
function updateHOCHostEl({ vnode, parent }, el // HostNode
) {
    while (parent && parent.subTree === vnode) {
        (vnode = parent.vnode).el = el;
        parent = parent.parent;
    }
}

const isSuspense = (type) => type.__isSuspense;
// Suspense exposes a component-like API, and is treated like a component
// in the compiler, but internally it's a special built-in type that hooks
// directly into the renderer.
const SuspenseImpl = {
    name: 'Suspense',
    // In order to make Suspense tree-shakable, we need to avoid importing it
    // directly in the renderer. The renderer checks for the __isSuspense flag
    // on a vnode's type and calls the `process` method, passing in renderer
    // internals.
    __isSuspense: true,
    process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, 
    // platform-specific impl passed from renderer
    rendererInternals) {
        if (n1 == null) {
            mountSuspense(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals);
        }
        else {
            patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, slotScopeIds, optimized, rendererInternals);
        }
    },
    hydrate: hydrateSuspense,
    create: createSuspenseBoundary,
    normalize: normalizeSuspenseChildren
};
// Force-casted public typing for h and TSX props inference
const Suspense = (SuspenseImpl );
function triggerEvent(vnode, name) {
    const eventListener = vnode.props && vnode.props[name];
    if (isFunction$1(eventListener)) {
        eventListener();
    }
}
function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals) {
    const { p: patch, o: { createElement } } = rendererInternals;
    const hiddenContainer = createElement('div');
    const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, isSVG, slotScopeIds, optimized, rendererInternals));
    // start mounting the content subtree in an off-dom container
    patch(null, (suspense.pendingBranch = vnode.ssContent), hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds);
    // now check if we have encountered any async deps
    if (suspense.deps > 0) {
        // has async
        // invoke @fallback event
        triggerEvent(vnode, 'onPending');
        triggerEvent(vnode, 'onFallback');
        // mount the fallback tree
        patch(null, vnode.ssFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
        isSVG, slotScopeIds);
        setActiveBranch(suspense, vnode.ssFallback);
    }
    else {
        // Suspense has no async deps. Just resolve.
        suspense.resolve();
    }
}
function patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, slotScopeIds, optimized, { p: patch, um: unmount, o: { createElement } }) {
    const suspense = (n2.suspense = n1.suspense);
    suspense.vnode = n2;
    n2.el = n1.el;
    const newBranch = n2.ssContent;
    const newFallback = n2.ssFallback;
    const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
    if (pendingBranch) {
        suspense.pendingBranch = newBranch;
        if (isSameVNodeType(newBranch, pendingBranch)) {
            // same root type but content may have changed.
            patch(pendingBranch, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
            if (suspense.deps <= 0) {
                suspense.resolve();
            }
            else if (isInFallback) {
                patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                isSVG, slotScopeIds, optimized);
                setActiveBranch(suspense, newFallback);
            }
        }
        else {
            // toggled before pending tree is resolved
            suspense.pendingId++;
            if (isHydrating) {
                // if toggled before hydration is finished, the current DOM tree is
                // no longer valid. set it as the active branch so it will be unmounted
                // when resolved
                suspense.isHydrating = false;
                suspense.activeBranch = pendingBranch;
            }
            else {
                unmount(pendingBranch, parentComponent, suspense);
            }
            // increment pending ID. this is used to invalidate async callbacks
            // reset suspense state
            suspense.deps = 0;
            // discard effects from pending branch
            suspense.effects.length = 0;
            // discard previous container
            suspense.hiddenContainer = createElement('div');
            if (isInFallback) {
                // already in fallback state
                patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
                if (suspense.deps <= 0) {
                    suspense.resolve();
                }
                else {
                    patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                    isSVG, slotScopeIds, optimized);
                    setActiveBranch(suspense, newFallback);
                }
            }
            else if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
                // toggled "back" to current active branch
                patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, slotScopeIds, optimized);
                // force resolve
                suspense.resolve(true);
            }
            else {
                // switched to a 3rd branch
                patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
                if (suspense.deps <= 0) {
                    suspense.resolve();
                }
            }
        }
    }
    else {
        if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
            // root did not change, just normal patch
            patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, slotScopeIds, optimized);
            setActiveBranch(suspense, newBranch);
        }
        else {
            // root node toggled
            // invoke @pending event
            triggerEvent(n2, 'onPending');
            // mount pending branch in off-dom container
            suspense.pendingBranch = newBranch;
            suspense.pendingId++;
            patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
            if (suspense.deps <= 0) {
                // incoming branch has no async deps, resolve now.
                suspense.resolve();
            }
            else {
                const { timeout, pendingId } = suspense;
                if (timeout > 0) {
                    setTimeout(() => {
                        if (suspense.pendingId === pendingId) {
                            suspense.fallback(newFallback);
                        }
                    }, timeout);
                }
                else if (timeout === 0) {
                    suspense.fallback(newFallback);
                }
            }
        }
    }
}
function createSuspenseBoundary(vnode, parent, parentComponent, container, hiddenContainer, anchor, isSVG, slotScopeIds, optimized, rendererInternals, isHydrating = false) {
    const { p: patch, m: move, um: unmount, n: next, o: { parentNode, remove } } = rendererInternals;
    const timeout = toNumber(vnode.props && vnode.props.timeout);
    const suspense = {
        vnode,
        parent,
        parentComponent,
        isSVG,
        container,
        hiddenContainer,
        anchor,
        deps: 0,
        pendingId: 0,
        timeout: typeof timeout === 'number' ? timeout : -1,
        activeBranch: null,
        pendingBranch: null,
        isInFallback: true,
        isHydrating,
        isUnmounted: false,
        effects: [],
        resolve(resume = false) {
            const { vnode, activeBranch, pendingBranch, pendingId, effects, parentComponent, container } = suspense;
            if (suspense.isHydrating) {
                suspense.isHydrating = false;
            }
            else if (!resume) {
                const delayEnter = activeBranch &&
                    pendingBranch.transition &&
                    pendingBranch.transition.mode === 'out-in';
                if (delayEnter) {
                    activeBranch.transition.afterLeave = () => {
                        if (pendingId === suspense.pendingId) {
                            move(pendingBranch, container, anchor, 0 /* MoveType.ENTER */);
                        }
                    };
                }
                // this is initial anchor on mount
                let { anchor } = suspense;
                // unmount current active tree
                if (activeBranch) {
                    // if the fallback tree was mounted, it may have been moved
                    // as part of a parent suspense. get the latest anchor for insertion
                    anchor = next(activeBranch);
                    unmount(activeBranch, parentComponent, suspense, true);
                }
                if (!delayEnter) {
                    // move content from off-dom container to actual container
                    move(pendingBranch, container, anchor, 0 /* MoveType.ENTER */);
                }
            }
            setActiveBranch(suspense, pendingBranch);
            suspense.pendingBranch = null;
            suspense.isInFallback = false;
            // flush buffered effects
            // check if there is a pending parent suspense
            let parent = suspense.parent;
            let hasUnresolvedAncestor = false;
            while (parent) {
                if (parent.pendingBranch) {
                    // found a pending parent suspense, merge buffered post jobs
                    // into that parent
                    parent.effects.push(...effects);
                    hasUnresolvedAncestor = true;
                    break;
                }
                parent = parent.parent;
            }
            // no pending parent suspense, flush all jobs
            if (!hasUnresolvedAncestor) {
                queuePostFlushCb(effects);
            }
            suspense.effects = [];
            // invoke @resolve event
            triggerEvent(vnode, 'onResolve');
        },
        fallback(fallbackVNode) {
            if (!suspense.pendingBranch) {
                return;
            }
            const { vnode, activeBranch, parentComponent, container, isSVG } = suspense;
            // invoke @fallback event
            triggerEvent(vnode, 'onFallback');
            const anchor = next(activeBranch);
            const mountFallback = () => {
                if (!suspense.isInFallback) {
                    return;
                }
                // mount the fallback tree
                patch(null, fallbackVNode, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                isSVG, slotScopeIds, optimized);
                setActiveBranch(suspense, fallbackVNode);
            };
            const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === 'out-in';
            if (delayEnter) {
                activeBranch.transition.afterLeave = mountFallback;
            }
            suspense.isInFallback = true;
            // unmount current active branch
            unmount(activeBranch, parentComponent, null, // no suspense so unmount hooks fire now
            true // shouldRemove
            );
            if (!delayEnter) {
                mountFallback();
            }
        },
        move(container, anchor, type) {
            suspense.activeBranch &&
                move(suspense.activeBranch, container, anchor, type);
            suspense.container = container;
        },
        next() {
            return suspense.activeBranch && next(suspense.activeBranch);
        },
        registerDep(instance, setupRenderEffect) {
            const isInPendingSuspense = !!suspense.pendingBranch;
            if (isInPendingSuspense) {
                suspense.deps++;
            }
            const hydratedEl = instance.vnode.el;
            instance
                .asyncDep.catch(err => {
                handleError(err, instance, 0 /* ErrorCodes.SETUP_FUNCTION */);
            })
                .then(asyncSetupResult => {
                // retry when the setup() promise resolves.
                // component may have been unmounted before resolve.
                if (instance.isUnmounted ||
                    suspense.isUnmounted ||
                    suspense.pendingId !== instance.suspenseId) {
                    return;
                }
                // retry from this component
                instance.asyncResolved = true;
                const { vnode } = instance;
                handleSetupResult(instance, asyncSetupResult, false);
                if (hydratedEl) {
                    // vnode may have been replaced if an update happened before the
                    // async dep is resolved.
                    vnode.el = hydratedEl;
                }
                const placeholder = !hydratedEl && instance.subTree.el;
                setupRenderEffect(instance, vnode, 
                // component may have been moved before resolve.
                // if this is not a hydration, instance.subTree will be the comment
                // placeholder.
                parentNode(hydratedEl || instance.subTree.el), 
                // anchor will not be used if this is hydration, so only need to
                // consider the comment placeholder case.
                hydratedEl ? null : next(instance.subTree), suspense, isSVG, optimized);
                if (placeholder) {
                    remove(placeholder);
                }
                updateHOCHostEl(instance, vnode.el);
                // only decrease deps count if suspense is not already resolved
                if (isInPendingSuspense && --suspense.deps === 0) {
                    suspense.resolve();
                }
            });
        },
        unmount(parentSuspense, doRemove) {
            suspense.isUnmounted = true;
            if (suspense.activeBranch) {
                unmount(suspense.activeBranch, parentComponent, parentSuspense, doRemove);
            }
            if (suspense.pendingBranch) {
                unmount(suspense.pendingBranch, parentComponent, parentSuspense, doRemove);
            }
        }
    };
    return suspense;
}
function hydrateSuspense(node, vnode, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals, hydrateNode) {
    /* eslint-disable no-restricted-globals */
    const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, node.parentNode, document.createElement('div'), null, isSVG, slotScopeIds, optimized, rendererInternals, true /* hydrating */));
    // there are two possible scenarios for server-rendered suspense:
    // - success: ssr content should be fully resolved
    // - failure: ssr content should be the fallback branch.
    // however, on the client we don't really know if it has failed or not
    // attempt to hydrate the DOM assuming it has succeeded, but we still
    // need to construct a suspense boundary first
    const result = hydrateNode(node, (suspense.pendingBranch = vnode.ssContent), parentComponent, suspense, slotScopeIds, optimized);
    if (suspense.deps === 0) {
        suspense.resolve();
    }
    return result;
    /* eslint-enable no-restricted-globals */
}
function normalizeSuspenseChildren(vnode) {
    const { shapeFlag, children } = vnode;
    const isSlotChildren = shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */;
    vnode.ssContent = normalizeSuspenseSlot(isSlotChildren ? children.default : children);
    vnode.ssFallback = isSlotChildren
        ? normalizeSuspenseSlot(children.fallback)
        : createVNode(Comment);
}
function normalizeSuspenseSlot(s) {
    let block;
    if (isFunction$1(s)) {
        const trackBlock = isBlockTreeEnabled && s._c;
        if (trackBlock) {
            // disableTracking: false
            // allow block tracking for compiled slots
            // (see ./componentRenderContext.ts)
            s._d = false;
            openBlock();
        }
        s = s();
        if (trackBlock) {
            s._d = true;
            block = currentBlock;
            closeBlock();
        }
    }
    if (isArray$2(s)) {
        const singleChild = filterSingleRoot(s);
        s = singleChild;
    }
    s = normalizeVNode(s);
    if (block && !s.dynamicChildren) {
        s.dynamicChildren = block.filter(c => c !== s);
    }
    return s;
}
function queueEffectWithSuspense(fn, suspense) {
    if (suspense && suspense.pendingBranch) {
        if (isArray$2(fn)) {
            suspense.effects.push(...fn);
        }
        else {
            suspense.effects.push(fn);
        }
    }
    else {
        queuePostFlushCb(fn);
    }
}
function setActiveBranch(suspense, branch) {
    suspense.activeBranch = branch;
    const { vnode, parentComponent } = suspense;
    const el = (vnode.el = branch.el);
    // in case suspense is the root node of a component,
    // recursively update the HOC el
    if (parentComponent && parentComponent.subTree === vnode) {
        parentComponent.vnode.el = el;
        updateHOCHostEl(parentComponent, el);
    }
}

function provide(key, value) {
    if (!currentInstance) ;
    else {
        let provides = currentInstance.provides;
        // by default an instance inherits its parent's provides object
        // but when it needs to provide values of its own, it creates its
        // own provides object using parent provides object as prototype.
        // this way in `inject` we can simply look up injections from direct
        // parent and let the prototype chain do the work.
        const parentProvides = currentInstance.parent && currentInstance.parent.provides;
        if (parentProvides === provides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // TS doesn't allow symbol as index type
        provides[key] = value;
    }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
    // fallback to `currentRenderingInstance` so that this can be called in
    // a functional component
    const instance = currentInstance || currentRenderingInstance;
    if (instance) {
        // #2400
        // to support `app.use` plugins,
        // fallback to appContext's `provides` if the instance is at root
        const provides = instance.parent == null
            ? instance.vnode.appContext && instance.vnode.appContext.provides
            : instance.parent.provides;
        if (provides && key in provides) {
            // TS doesn't allow symbol as index type
            return provides[key];
        }
        else if (arguments.length > 1) {
            return treatDefaultAsFactory && isFunction$1(defaultValue)
                ? defaultValue.call(instance.proxy)
                : defaultValue;
        }
        else ;
    }
}

// Simple effect.
function watchEffect(effect, options) {
    return doWatch(effect, null, options);
}
function watchPostEffect(effect, options) {
    return doWatch(effect, null, ({ flush: 'post' }));
}
function watchSyncEffect(effect, options) {
    return doWatch(effect, null, ({ flush: 'sync' }));
}
// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {};
// implementation
function watch(source, cb, options) {
    return doWatch(source, cb, options);
}
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
    const instance = currentInstance;
    let getter;
    let forceTrigger = false;
    let isMultiSource = false;
    if (isRef(source)) {
        getter = () => source.value;
        forceTrigger = isShallow(source);
    }
    else if (isReactive(source)) {
        getter = () => source;
        deep = true;
    }
    else if (isArray$2(source)) {
        isMultiSource = true;
        forceTrigger = source.some(s => isReactive(s) || isShallow(s));
        getter = () => source.map(s => {
            if (isRef(s)) {
                return s.value;
            }
            else if (isReactive(s)) {
                return traverse(s);
            }
            else if (isFunction$1(s)) {
                return callWithErrorHandling(s, instance, 2 /* ErrorCodes.WATCH_GETTER */);
            }
            else ;
        });
    }
    else if (isFunction$1(source)) {
        if (cb) {
            // getter with cb
            getter = () => callWithErrorHandling(source, instance, 2 /* ErrorCodes.WATCH_GETTER */);
        }
        else {
            // no cb -> simple effect
            getter = () => {
                if (instance && instance.isUnmounted) {
                    return;
                }
                if (cleanup) {
                    cleanup();
                }
                return callWithAsyncErrorHandling(source, instance, 3 /* ErrorCodes.WATCH_CALLBACK */, [onCleanup]);
            };
        }
    }
    else {
        getter = NOOP;
    }
    if (cb && deep) {
        const baseGetter = getter;
        getter = () => traverse(baseGetter());
    }
    let cleanup;
    let onCleanup = (fn) => {
        cleanup = effect.onStop = () => {
            callWithErrorHandling(fn, instance, 4 /* ErrorCodes.WATCH_CLEANUP */);
        };
    };
    // in SSR there is no need to setup an actual effect, and it should be noop
    // unless it's eager
    if (isInSSRComponentSetup) {
        // we will also not call the invalidate callback (+ runner is not set up)
        onCleanup = NOOP;
        if (!cb) {
            getter();
        }
        else if (immediate) {
            callWithAsyncErrorHandling(cb, instance, 3 /* ErrorCodes.WATCH_CALLBACK */, [
                getter(),
                isMultiSource ? [] : undefined,
                onCleanup
            ]);
        }
        return NOOP;
    }
    let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
    const job = () => {
        if (!effect.active) {
            return;
        }
        if (cb) {
            // watch(source, cb)
            const newValue = effect.run();
            if (deep ||
                forceTrigger ||
                (isMultiSource
                    ? newValue.some((v, i) => hasChanged(v, oldValue[i]))
                    : hasChanged(newValue, oldValue)) ||
                (false  )) {
                // cleanup before running cb again
                if (cleanup) {
                    cleanup();
                }
                callWithAsyncErrorHandling(cb, instance, 3 /* ErrorCodes.WATCH_CALLBACK */, [
                    newValue,
                    // pass undefined as the old value when it's changed for the first time
                    oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                    onCleanup
                ]);
                oldValue = newValue;
            }
        }
        else {
            // watchEffect
            effect.run();
        }
    };
    // important: mark the job as a watcher callback so that scheduler knows
    // it is allowed to self-trigger (#1727)
    job.allowRecurse = !!cb;
    let scheduler;
    if (flush === 'sync') {
        scheduler = job; // the scheduler function gets called directly
    }
    else if (flush === 'post') {
        scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
    }
    else {
        // default: 'pre'
        job.pre = true;
        if (instance)
            job.id = instance.uid;
        scheduler = () => queueJob(job);
    }
    const effect = new ReactiveEffect(getter, scheduler);
    // initial run
    if (cb) {
        if (immediate) {
            job();
        }
        else {
            oldValue = effect.run();
        }
    }
    else if (flush === 'post') {
        queuePostRenderEffect(effect.run.bind(effect), instance && instance.suspense);
    }
    else {
        effect.run();
    }
    return () => {
        effect.stop();
        if (instance && instance.scope) {
            remove(instance.scope.effects, effect);
        }
    };
}
// this.$watch
function instanceWatch(source, value, options) {
    const publicThis = this.proxy;
    const getter = isString$1(source)
        ? source.includes('.')
            ? createPathGetter(publicThis, source)
            : () => publicThis[source]
        : source.bind(publicThis, publicThis);
    let cb;
    if (isFunction$1(value)) {
        cb = value;
    }
    else {
        cb = value.handler;
        options = value;
    }
    const cur = currentInstance;
    setCurrentInstance(this);
    const res = doWatch(getter, cb.bind(publicThis), options);
    if (cur) {
        setCurrentInstance(cur);
    }
    else {
        unsetCurrentInstance();
    }
    return res;
}
function createPathGetter(ctx, path) {
    const segments = path.split('.');
    return () => {
        let cur = ctx;
        for (let i = 0; i < segments.length && cur; i++) {
            cur = cur[segments[i]];
        }
        return cur;
    };
}
function traverse(value, seen) {
    if (!isObject$1(value) || value["__v_skip" /* ReactiveFlags.SKIP */]) {
        return value;
    }
    seen = seen || new Set();
    if (seen.has(value)) {
        return value;
    }
    seen.add(value);
    if (isRef(value)) {
        traverse(value.value, seen);
    }
    else if (isArray$2(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], seen);
        }
    }
    else if (isSet(value) || isMap(value)) {
        value.forEach((v) => {
            traverse(v, seen);
        });
    }
    else if (isPlainObject(value)) {
        for (const key in value) {
            traverse(value[key], seen);
        }
    }
    return value;
}

function useTransitionState() {
    const state = {
        isMounted: false,
        isLeaving: false,
        isUnmounting: false,
        leavingVNodes: new Map()
    };
    onMounted(() => {
        state.isMounted = true;
    });
    onBeforeUnmount(() => {
        state.isUnmounting = true;
    });
    return state;
}
const TransitionHookValidator = [Function, Array];
const BaseTransitionImpl = {
    name: `BaseTransition`,
    props: {
        mode: String,
        appear: Boolean,
        persisted: Boolean,
        // enter
        onBeforeEnter: TransitionHookValidator,
        onEnter: TransitionHookValidator,
        onAfterEnter: TransitionHookValidator,
        onEnterCancelled: TransitionHookValidator,
        // leave
        onBeforeLeave: TransitionHookValidator,
        onLeave: TransitionHookValidator,
        onAfterLeave: TransitionHookValidator,
        onLeaveCancelled: TransitionHookValidator,
        // appear
        onBeforeAppear: TransitionHookValidator,
        onAppear: TransitionHookValidator,
        onAfterAppear: TransitionHookValidator,
        onAppearCancelled: TransitionHookValidator
    },
    setup(props, { slots }) {
        const instance = getCurrentInstance();
        const state = useTransitionState();
        let prevTransitionKey;
        return () => {
            const children = slots.default && getTransitionRawChildren(slots.default(), true);
            if (!children || !children.length) {
                return;
            }
            let child = children[0];
            if (children.length > 1) {
                // locate first non-comment child
                for (const c of children) {
                    if (c.type !== Comment) {
                        child = c;
                        break;
                    }
                }
            }
            // there's no need to track reactivity for these props so use the raw
            // props for a bit better perf
            const rawProps = toRaw(props);
            const { mode } = rawProps;
            if (state.isLeaving) {
                return emptyPlaceholder(child);
            }
            // in the case of <transition><keep-alive/></transition>, we need to
            // compare the type of the kept-alive children.
            const innerChild = getKeepAliveChild(child);
            if (!innerChild) {
                return emptyPlaceholder(child);
            }
            const enterHooks = resolveTransitionHooks(innerChild, rawProps, state, instance);
            setTransitionHooks(innerChild, enterHooks);
            const oldChild = instance.subTree;
            const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
            let transitionKeyChanged = false;
            const { getTransitionKey } = innerChild.type;
            if (getTransitionKey) {
                const key = getTransitionKey();
                if (prevTransitionKey === undefined) {
                    prevTransitionKey = key;
                }
                else if (key !== prevTransitionKey) {
                    prevTransitionKey = key;
                    transitionKeyChanged = true;
                }
            }
            // handle mode
            if (oldInnerChild &&
                oldInnerChild.type !== Comment &&
                (!isSameVNodeType(innerChild, oldInnerChild) || transitionKeyChanged)) {
                const leavingHooks = resolveTransitionHooks(oldInnerChild, rawProps, state, instance);
                // update old tree's hooks in case of dynamic transition
                setTransitionHooks(oldInnerChild, leavingHooks);
                // switching between different views
                if (mode === 'out-in') {
                    state.isLeaving = true;
                    // return placeholder node and queue update when leave finishes
                    leavingHooks.afterLeave = () => {
                        state.isLeaving = false;
                        instance.update();
                    };
                    return emptyPlaceholder(child);
                }
                else if (mode === 'in-out' && innerChild.type !== Comment) {
                    leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
                        const leavingVNodesCache = getLeavingNodesForType(state, oldInnerChild);
                        leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
                        // early removal callback
                        el._leaveCb = () => {
                            earlyRemove();
                            el._leaveCb = undefined;
                            delete enterHooks.delayedLeave;
                        };
                        enterHooks.delayedLeave = delayedLeave;
                    };
                }
            }
            return child;
        };
    }
};
// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
const BaseTransition = BaseTransitionImpl;
function getLeavingNodesForType(state, vnode) {
    const { leavingVNodes } = state;
    let leavingVNodesCache = leavingVNodes.get(vnode.type);
    if (!leavingVNodesCache) {
        leavingVNodesCache = Object.create(null);
        leavingVNodes.set(vnode.type, leavingVNodesCache);
    }
    return leavingVNodesCache;
}
// The transition hooks are attached to the vnode as vnode.transition
// and will be called at appropriate timing in the renderer.
function resolveTransitionHooks(vnode, props, state, instance) {
    const { appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled } = props;
    const key = String(vnode.key);
    const leavingVNodesCache = getLeavingNodesForType(state, vnode);
    const callHook = (hook, args) => {
        hook &&
            callWithAsyncErrorHandling(hook, instance, 9 /* ErrorCodes.TRANSITION_HOOK */, args);
    };
    const callAsyncHook = (hook, args) => {
        const done = args[1];
        callHook(hook, args);
        if (isArray$2(hook)) {
            if (hook.every(hook => hook.length <= 1))
                done();
        }
        else if (hook.length <= 1) {
            done();
        }
    };
    const hooks = {
        mode,
        persisted,
        beforeEnter(el) {
            let hook = onBeforeEnter;
            if (!state.isMounted) {
                if (appear) {
                    hook = onBeforeAppear || onBeforeEnter;
                }
                else {
                    return;
                }
            }
            // for same element (v-show)
            if (el._leaveCb) {
                el._leaveCb(true /* cancelled */);
            }
            // for toggled element with same key (v-if)
            const leavingVNode = leavingVNodesCache[key];
            if (leavingVNode &&
                isSameVNodeType(vnode, leavingVNode) &&
                leavingVNode.el._leaveCb) {
                // force early removal (not cancelled)
                leavingVNode.el._leaveCb();
            }
            callHook(hook, [el]);
        },
        enter(el) {
            let hook = onEnter;
            let afterHook = onAfterEnter;
            let cancelHook = onEnterCancelled;
            if (!state.isMounted) {
                if (appear) {
                    hook = onAppear || onEnter;
                    afterHook = onAfterAppear || onAfterEnter;
                    cancelHook = onAppearCancelled || onEnterCancelled;
                }
                else {
                    return;
                }
            }
            let called = false;
            const done = (el._enterCb = (cancelled) => {
                if (called)
                    return;
                called = true;
                if (cancelled) {
                    callHook(cancelHook, [el]);
                }
                else {
                    callHook(afterHook, [el]);
                }
                if (hooks.delayedLeave) {
                    hooks.delayedLeave();
                }
                el._enterCb = undefined;
            });
            if (hook) {
                callAsyncHook(hook, [el, done]);
            }
            else {
                done();
            }
        },
        leave(el, remove) {
            const key = String(vnode.key);
            if (el._enterCb) {
                el._enterCb(true /* cancelled */);
            }
            if (state.isUnmounting) {
                return remove();
            }
            callHook(onBeforeLeave, [el]);
            let called = false;
            const done = (el._leaveCb = (cancelled) => {
                if (called)
                    return;
                called = true;
                remove();
                if (cancelled) {
                    callHook(onLeaveCancelled, [el]);
                }
                else {
                    callHook(onAfterLeave, [el]);
                }
                el._leaveCb = undefined;
                if (leavingVNodesCache[key] === vnode) {
                    delete leavingVNodesCache[key];
                }
            });
            leavingVNodesCache[key] = vnode;
            if (onLeave) {
                callAsyncHook(onLeave, [el, done]);
            }
            else {
                done();
            }
        },
        clone(vnode) {
            return resolveTransitionHooks(vnode, props, state, instance);
        }
    };
    return hooks;
}
// the placeholder really only handles one special case: KeepAlive
// in the case of a KeepAlive in a leave phase we need to return a KeepAlive
// placeholder with empty content to avoid the KeepAlive instance from being
// unmounted.
function emptyPlaceholder(vnode) {
    if (isKeepAlive(vnode)) {
        vnode = cloneVNode(vnode);
        vnode.children = null;
        return vnode;
    }
}
function getKeepAliveChild(vnode) {
    return isKeepAlive(vnode)
        ? vnode.children
            ? vnode.children[0]
            : undefined
        : vnode;
}
function setTransitionHooks(vnode, hooks) {
    if (vnode.shapeFlag & 6 /* ShapeFlags.COMPONENT */ && vnode.component) {
        setTransitionHooks(vnode.component.subTree, hooks);
    }
    else if (vnode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
        vnode.ssContent.transition = hooks.clone(vnode.ssContent);
        vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
    }
    else {
        vnode.transition = hooks;
    }
}
function getTransitionRawChildren(children, keepComment = false, parentKey) {
    let ret = [];
    let keyedFragmentCount = 0;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        // #5360 inherit parent key in case of <template v-for>
        const key = parentKey == null
            ? child.key
            : String(parentKey) + String(child.key != null ? child.key : i);
        // handle fragment children case, e.g. v-for
        if (child.type === Fragment) {
            if (child.patchFlag & 128 /* PatchFlags.KEYED_FRAGMENT */)
                keyedFragmentCount++;
            ret = ret.concat(getTransitionRawChildren(child.children, keepComment, key));
        }
        // comment placeholders should be skipped, e.g. v-if
        else if (keepComment || child.type !== Comment) {
            ret.push(key != null ? cloneVNode(child, { key }) : child);
        }
    }
    // #1126 if a transition children list contains multiple sub fragments, these
    // fragments will be merged into a flat children array. Since each v-for
    // fragment may contain different static bindings inside, we need to de-op
    // these children to force full diffs to ensure correct behavior.
    if (keyedFragmentCount > 1) {
        for (let i = 0; i < ret.length; i++) {
            ret[i].patchFlag = -2 /* PatchFlags.BAIL */;
        }
    }
    return ret;
}

// implementation, close to no-op
function defineComponent(options) {
    return isFunction$1(options) ? { setup: options, name: options.name } : options;
}

const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
function defineAsyncComponent(source) {
    if (isFunction$1(source)) {
        source = { loader: source };
    }
    const { loader, loadingComponent, errorComponent, delay = 200, timeout, // undefined = never times out
    suspensible = true, onError: userOnError } = source;
    let pendingRequest = null;
    let resolvedComp;
    let retries = 0;
    const retry = () => {
        retries++;
        pendingRequest = null;
        return load();
    };
    const load = () => {
        let thisRequest;
        return (pendingRequest ||
            (thisRequest = pendingRequest =
                loader()
                    .catch(err => {
                    err = err instanceof Error ? err : new Error(String(err));
                    if (userOnError) {
                        return new Promise((resolve, reject) => {
                            const userRetry = () => resolve(retry());
                            const userFail = () => reject(err);
                            userOnError(err, userRetry, userFail, retries + 1);
                        });
                    }
                    else {
                        throw err;
                    }
                })
                    .then((comp) => {
                    if (thisRequest !== pendingRequest && pendingRequest) {
                        return pendingRequest;
                    }
                    // interop module default
                    if (comp &&
                        (comp.__esModule || comp[Symbol.toStringTag] === 'Module')) {
                        comp = comp.default;
                    }
                    resolvedComp = comp;
                    return comp;
                })));
    };
    return defineComponent({
        name: 'AsyncComponentWrapper',
        __asyncLoader: load,
        get __asyncResolved() {
            return resolvedComp;
        },
        setup() {
            const instance = currentInstance;
            // already resolved
            if (resolvedComp) {
                return () => createInnerComp(resolvedComp, instance);
            }
            const onError = (err) => {
                pendingRequest = null;
                handleError(err, instance, 13 /* ErrorCodes.ASYNC_COMPONENT_LOADER */, !errorComponent /* do not throw in dev if user provided error component */);
            };
            // suspense-controlled or SSR.
            if ((suspensible && instance.suspense) ||
                (isInSSRComponentSetup)) {
                return load()
                    .then(comp => {
                    return () => createInnerComp(comp, instance);
                })
                    .catch(err => {
                    onError(err);
                    return () => errorComponent
                        ? createVNode(errorComponent, {
                            error: err
                        })
                        : null;
                });
            }
            const loaded = ref(false);
            const error = ref();
            const delayed = ref(!!delay);
            if (delay) {
                setTimeout(() => {
                    delayed.value = false;
                }, delay);
            }
            if (timeout != null) {
                setTimeout(() => {
                    if (!loaded.value && !error.value) {
                        const err = new Error(`Async component timed out after ${timeout}ms.`);
                        onError(err);
                        error.value = err;
                    }
                }, timeout);
            }
            load()
                .then(() => {
                loaded.value = true;
                if (instance.parent && isKeepAlive(instance.parent.vnode)) {
                    // parent is keep-alive, force update so the loaded component's
                    // name is taken into account
                    queueJob(instance.parent.update);
                }
            })
                .catch(err => {
                onError(err);
                error.value = err;
            });
            return () => {
                if (loaded.value && resolvedComp) {
                    return createInnerComp(resolvedComp, instance);
                }
                else if (error.value && errorComponent) {
                    return createVNode(errorComponent, {
                        error: error.value
                    });
                }
                else if (loadingComponent && !delayed.value) {
                    return createVNode(loadingComponent);
                }
            };
        }
    });
}
function createInnerComp(comp, { vnode: { ref, props, children, shapeFlag }, parent }) {
    const vnode = createVNode(comp, props, children);
    // ensure inner component inherits the async wrapper's ref owner
    vnode.ref = ref;
    return vnode;
}

const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
const KeepAliveImpl = {
    name: `KeepAlive`,
    // Marker for special handling inside the renderer. We are not using a ===
    // check directly on KeepAlive in the renderer, because importing it directly
    // would prevent it from being tree-shaken.
    __isKeepAlive: true,
    props: {
        include: [String, RegExp, Array],
        exclude: [String, RegExp, Array],
        max: [String, Number]
    },
    setup(props, { slots }) {
        const instance = getCurrentInstance();
        // KeepAlive communicates with the instantiated renderer via the
        // ctx where the renderer passes in its internals,
        // and the KeepAlive instance exposes activate/deactivate implementations.
        // The whole point of this is to avoid importing KeepAlive directly in the
        // renderer to facilitate tree-shaking.
        const sharedContext = instance.ctx;
        // if the internal renderer is not registered, it indicates that this is server-side rendering,
        // for KeepAlive, we just need to render its children
        if (!sharedContext.renderer) {
            return () => {
                const children = slots.default && slots.default();
                return children && children.length === 1 ? children[0] : children;
            };
        }
        const cache = new Map();
        const keys = new Set();
        let current = null;
        if (__VUE_PROD_DEVTOOLS__) {
            instance.__v_cache = cache;
        }
        const parentSuspense = instance.suspense;
        const { renderer: { p: patch, m: move, um: _unmount, o: { createElement } } } = sharedContext;
        const storageContainer = createElement('div');
        sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
            const instance = vnode.component;
            move(vnode, container, anchor, 0 /* MoveType.ENTER */, parentSuspense);
            // in case props have changed
            patch(instance.vnode, vnode, container, anchor, instance, parentSuspense, isSVG, vnode.slotScopeIds, optimized);
            queuePostRenderEffect(() => {
                instance.isDeactivated = false;
                if (instance.a) {
                    invokeArrayFns(instance.a);
                }
                const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
                if (vnodeHook) {
                    invokeVNodeHook(vnodeHook, instance.parent, vnode);
                }
            }, parentSuspense);
            if (__VUE_PROD_DEVTOOLS__) {
                // Update components tree
                devtoolsComponentAdded(instance);
            }
        };
        sharedContext.deactivate = (vnode) => {
            const instance = vnode.component;
            move(vnode, storageContainer, null, 1 /* MoveType.LEAVE */, parentSuspense);
            queuePostRenderEffect(() => {
                if (instance.da) {
                    invokeArrayFns(instance.da);
                }
                const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
                if (vnodeHook) {
                    invokeVNodeHook(vnodeHook, instance.parent, vnode);
                }
                instance.isDeactivated = true;
            }, parentSuspense);
            if (__VUE_PROD_DEVTOOLS__) {
                // Update components tree
                devtoolsComponentAdded(instance);
            }
        };
        function unmount(vnode) {
            // reset the shapeFlag so it can be properly unmounted
            resetShapeFlag(vnode);
            _unmount(vnode, instance, parentSuspense, true);
        }
        function pruneCache(filter) {
            cache.forEach((vnode, key) => {
                const name = getComponentName(vnode.type);
                if (name && (!filter || !filter(name))) {
                    pruneCacheEntry(key);
                }
            });
        }
        function pruneCacheEntry(key) {
            const cached = cache.get(key);
            if (!current || cached.type !== current.type) {
                unmount(cached);
            }
            else if (current) {
                // current active instance should no longer be kept-alive.
                // we can't unmount it now but it might be later, so reset its flag now.
                resetShapeFlag(current);
            }
            cache.delete(key);
            keys.delete(key);
        }
        // prune cache on include/exclude prop change
        watch(() => [props.include, props.exclude], ([include, exclude]) => {
            include && pruneCache(name => matches(include, name));
            exclude && pruneCache(name => !matches(exclude, name));
        }, 
        // prune post-render after `current` has been updated
        { flush: 'post', deep: true });
        // cache sub tree after render
        let pendingCacheKey = null;
        const cacheSubtree = () => {
            // fix #1621, the pendingCacheKey could be 0
            if (pendingCacheKey != null) {
                cache.set(pendingCacheKey, getInnerChild(instance.subTree));
            }
        };
        onMounted(cacheSubtree);
        onUpdated(cacheSubtree);
        onBeforeUnmount(() => {
            cache.forEach(cached => {
                const { subTree, suspense } = instance;
                const vnode = getInnerChild(subTree);
                if (cached.type === vnode.type) {
                    // current instance will be unmounted as part of keep-alive's unmount
                    resetShapeFlag(vnode);
                    // but invoke its deactivated hook here
                    const da = vnode.component.da;
                    da && queuePostRenderEffect(da, suspense);
                    return;
                }
                unmount(cached);
            });
        });
        return () => {
            pendingCacheKey = null;
            if (!slots.default) {
                return null;
            }
            const children = slots.default();
            const rawVNode = children[0];
            if (children.length > 1) {
                current = null;
                return children;
            }
            else if (!isVNode(rawVNode) ||
                (!(rawVNode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) &&
                    !(rawVNode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */))) {
                current = null;
                return rawVNode;
            }
            let vnode = getInnerChild(rawVNode);
            const comp = vnode.type;
            // for async components, name check should be based in its loaded
            // inner component if available
            const name = getComponentName(isAsyncWrapper(vnode)
                ? vnode.type.__asyncResolved || {}
                : comp);
            const { include, exclude, max } = props;
            if ((include && (!name || !matches(include, name))) ||
                (exclude && name && matches(exclude, name))) {
                current = vnode;
                return rawVNode;
            }
            const key = vnode.key == null ? comp : vnode.key;
            const cachedVNode = cache.get(key);
            // clone vnode if it's reused because we are going to mutate it
            if (vnode.el) {
                vnode = cloneVNode(vnode);
                if (rawVNode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
                    rawVNode.ssContent = vnode;
                }
            }
            // #1513 it's possible for the returned vnode to be cloned due to attr
            // fallthrough or scopeId, so the vnode here may not be the final vnode
            // that is mounted. Instead of caching it directly, we store the pending
            // key and cache `instance.subTree` (the normalized vnode) in
            // beforeMount/beforeUpdate hooks.
            pendingCacheKey = key;
            if (cachedVNode) {
                // copy over mounted state
                vnode.el = cachedVNode.el;
                vnode.component = cachedVNode.component;
                if (vnode.transition) {
                    // recursively update transition hooks on subTree
                    setTransitionHooks(vnode, vnode.transition);
                }
                // avoid vnode being mounted as fresh
                vnode.shapeFlag |= 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */;
                // make this key the freshest
                keys.delete(key);
                keys.add(key);
            }
            else {
                keys.add(key);
                // prune oldest entry
                if (max && keys.size > parseInt(max, 10)) {
                    pruneCacheEntry(keys.values().next().value);
                }
            }
            // avoid vnode being unmounted
            vnode.shapeFlag |= 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */;
            current = vnode;
            return isSuspense(rawVNode.type) ? rawVNode : vnode;
        };
    }
};
// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
const KeepAlive = KeepAliveImpl;
function matches(pattern, name) {
    if (isArray$2(pattern)) {
        return pattern.some((p) => matches(p, name));
    }
    else if (isString$1(pattern)) {
        return pattern.split(',').includes(name);
    }
    else if (pattern.test) {
        return pattern.test(name);
    }
    /* istanbul ignore next */
    return false;
}
function onActivated(hook, target) {
    registerKeepAliveHook(hook, "a" /* LifecycleHooks.ACTIVATED */, target);
}
function onDeactivated(hook, target) {
    registerKeepAliveHook(hook, "da" /* LifecycleHooks.DEACTIVATED */, target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
    // cache the deactivate branch check wrapper for injected hooks so the same
    // hook can be properly deduped by the scheduler. "__wdc" stands for "with
    // deactivation check".
    const wrappedHook = hook.__wdc ||
        (hook.__wdc = () => {
            // only fire the hook if the target instance is NOT in a deactivated branch.
            let current = target;
            while (current) {
                if (current.isDeactivated) {
                    return;
                }
                current = current.parent;
            }
            return hook();
        });
    injectHook(type, wrappedHook, target);
    // In addition to registering it on the target instance, we walk up the parent
    // chain and register it on all ancestor instances that are keep-alive roots.
    // This avoids the need to walk the entire component tree when invoking these
    // hooks, and more importantly, avoids the need to track child components in
    // arrays.
    if (target) {
        let current = target.parent;
        while (current && current.parent) {
            if (isKeepAlive(current.parent.vnode)) {
                injectToKeepAliveRoot(wrappedHook, type, target, current);
            }
            current = current.parent;
        }
    }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
    // injectHook wraps the original for error handling, so make sure to remove
    // the wrapped version.
    const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */);
    onUnmounted(() => {
        remove(keepAliveRoot[type], injected);
    }, target);
}
function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */) {
        shapeFlag -= 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    if (shapeFlag & 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */) {
        shapeFlag -= 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */;
    }
    vnode.shapeFlag = shapeFlag;
}
function getInnerChild(vnode) {
    return vnode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */ ? vnode.ssContent : vnode;
}

function injectHook(type, hook, target = currentInstance, prepend = false) {
    if (target) {
        const hooks = target[type] || (target[type] = []);
        // cache the error handling wrapper for injected hooks so the same hook
        // can be properly deduped by the scheduler. "__weh" stands for "with error
        // handling".
        const wrappedHook = hook.__weh ||
            (hook.__weh = (...args) => {
                if (target.isUnmounted) {
                    return;
                }
                // disable tracking inside all lifecycle hooks
                // since they can potentially be called inside effects.
                pauseTracking();
                // Set currentInstance during hook invocation.
                // This assumes the hook does not synchronously trigger other hooks, which
                // can only be false when the user does something really funky.
                setCurrentInstance(target);
                const res = callWithAsyncErrorHandling(hook, target, type, args);
                unsetCurrentInstance();
                resetTracking();
                return res;
            });
        if (prepend) {
            hooks.unshift(wrappedHook);
        }
        else {
            hooks.push(wrappedHook);
        }
        return wrappedHook;
    }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => 
// post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
(!isInSSRComponentSetup || lifecycle === "sp" /* LifecycleHooks.SERVER_PREFETCH */) &&
    injectHook(lifecycle, hook, target);
const onBeforeMount = createHook("bm" /* LifecycleHooks.BEFORE_MOUNT */);
const onMounted = createHook("m" /* LifecycleHooks.MOUNTED */);
const onBeforeUpdate = createHook("bu" /* LifecycleHooks.BEFORE_UPDATE */);
const onUpdated = createHook("u" /* LifecycleHooks.UPDATED */);
const onBeforeUnmount = createHook("bum" /* LifecycleHooks.BEFORE_UNMOUNT */);
const onUnmounted = createHook("um" /* LifecycleHooks.UNMOUNTED */);
const onServerPrefetch = createHook("sp" /* LifecycleHooks.SERVER_PREFETCH */);
const onRenderTriggered = createHook("rtg" /* LifecycleHooks.RENDER_TRIGGERED */);
const onRenderTracked = createHook("rtc" /* LifecycleHooks.RENDER_TRACKED */);
function onErrorCaptured(hook, target = currentInstance) {
    injectHook("ec" /* LifecycleHooks.ERROR_CAPTURED */, hook, target);
}
/**
 * Adds directives to a VNode.
 */
function withDirectives(vnode, directives) {
    const internalInstance = currentRenderingInstance;
    if (internalInstance === null) {
        return vnode;
    }
    const instance = getExposeProxy(internalInstance) ||
        internalInstance.proxy;
    const bindings = vnode.dirs || (vnode.dirs = []);
    for (let i = 0; i < directives.length; i++) {
        let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
        if (isFunction$1(dir)) {
            dir = {
                mounted: dir,
                updated: dir
            };
        }
        if (dir.deep) {
            traverse(value);
        }
        bindings.push({
            dir,
            instance,
            value,
            oldValue: void 0,
            arg,
            modifiers
        });
    }
    return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
    const bindings = vnode.dirs;
    const oldBindings = prevVNode && prevVNode.dirs;
    for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        if (oldBindings) {
            binding.oldValue = oldBindings[i].value;
        }
        let hook = binding.dir[name];
        if (hook) {
            // disable tracking inside all lifecycle hooks
            // since they can potentially be called inside effects.
            pauseTracking();
            callWithAsyncErrorHandling(hook, instance, 8 /* ErrorCodes.DIRECTIVE_HOOK */, [
                vnode.el,
                binding,
                vnode,
                prevVNode
            ]);
            resetTracking();
        }
    }
}

const COMPONENTS = 'components';
const DIRECTIVES = 'directives';
/**
 * @private
 */
function resolveComponent(name, maybeSelfReference) {
    return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
const NULL_DYNAMIC_COMPONENT = Symbol();
/**
 * @private
 */
function resolveDynamicComponent(component) {
    if (isString$1(component)) {
        return resolveAsset(COMPONENTS, component, false) || component;
    }
    else {
        // invalid types will fallthrough to createVNode and raise warning
        return (component || NULL_DYNAMIC_COMPONENT);
    }
}
/**
 * @private
 */
function resolveDirective(name) {
    return resolveAsset(DIRECTIVES, name);
}
// implementation
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
    const instance = currentRenderingInstance || currentInstance;
    if (instance) {
        const Component = instance.type;
        // explicit self name has highest priority
        if (type === COMPONENTS) {
            const selfName = getComponentName(Component, false /* do not include inferred name to avoid breaking existing code */);
            if (selfName &&
                (selfName === name ||
                    selfName === camelize(name) ||
                    selfName === capitalize(camelize(name)))) {
                return Component;
            }
        }
        const res = 
        // local registration
        // check instance[type] first which is resolved for options API
        resolve(instance[type] || Component[type], name) ||
            // global registration
            resolve(instance.appContext[type], name);
        if (!res && maybeSelfReference) {
            // fallback to implicit self-reference
            return Component;
        }
        return res;
    }
}
function resolve(registry, name) {
    return (registry &&
        (registry[name] ||
            registry[camelize(name)] ||
            registry[capitalize(camelize(name))]));
}

/**
 * Actual implementation
 */
function renderList(source, renderItem, cache, index) {
    let ret;
    const cached = (cache && cache[index]);
    if (isArray$2(source) || isString$1(source)) {
        ret = new Array(source.length);
        for (let i = 0, l = source.length; i < l; i++) {
            ret[i] = renderItem(source[i], i, undefined, cached && cached[i]);
        }
    }
    else if (typeof source === 'number') {
        ret = new Array(source);
        for (let i = 0; i < source; i++) {
            ret[i] = renderItem(i + 1, i, undefined, cached && cached[i]);
        }
    }
    else if (isObject$1(source)) {
        if (source[Symbol.iterator]) {
            ret = Array.from(source, (item, i) => renderItem(item, i, undefined, cached && cached[i]));
        }
        else {
            const keys = Object.keys(source);
            ret = new Array(keys.length);
            for (let i = 0, l = keys.length; i < l; i++) {
                const key = keys[i];
                ret[i] = renderItem(source[key], key, i, cached && cached[i]);
            }
        }
    }
    else {
        ret = [];
    }
    if (cache) {
        cache[index] = ret;
    }
    return ret;
}

/**
 * Compiler runtime helper for creating dynamic slots object
 * @private
 */
function createSlots(slots, dynamicSlots) {
    for (let i = 0; i < dynamicSlots.length; i++) {
        const slot = dynamicSlots[i];
        // array of dynamic slot generated by <template v-for="..." #[...]>
        if (isArray$2(slot)) {
            for (let j = 0; j < slot.length; j++) {
                slots[slot[j].name] = slot[j].fn;
            }
        }
        else if (slot) {
            // conditional single slot generated by <template v-if="..." #foo>
            slots[slot.name] = slot.key
                ? (...args) => {
                    const res = slot.fn(...args);
                    res.key = slot.key;
                    return res;
                }
                : slot.fn;
        }
    }
    return slots;
}

/**
 * Compiler runtime helper for rendering `<slot/>`
 * @private
 */
function renderSlot(slots, name, props = {}, 
// this is not a user-facing function, so the fallback is always generated by
// the compiler and guaranteed to be a function returning an array
fallback, noSlotted) {
    if (currentRenderingInstance.isCE ||
        (currentRenderingInstance.parent &&
            isAsyncWrapper(currentRenderingInstance.parent) &&
            currentRenderingInstance.parent.isCE)) {
        return createVNode('slot', name === 'default' ? null : { name }, fallback && fallback());
    }
    let slot = slots[name];
    // a compiled slot disables block tracking by default to avoid manual
    // invocation interfering with template-based block tracking, but in
    // `renderSlot` we can be sure that it's template-based so we can force
    // enable it.
    if (slot && slot._c) {
        slot._d = false;
    }
    openBlock();
    const validSlotContent = slot && ensureValidVNode(slot(props));
    const rendered = createBlock(Fragment, {
        key: props.key ||
            // slot content array of a dynamic conditional slot may have a branch
            // key attached in the `createSlots` helper, respect that
            (validSlotContent && validSlotContent.key) ||
            `_${name}`
    }, validSlotContent || (fallback ? fallback() : []), validSlotContent && slots._ === 1 /* SlotFlags.STABLE */
        ? 64 /* PatchFlags.STABLE_FRAGMENT */
        : -2 /* PatchFlags.BAIL */);
    if (!noSlotted && rendered.scopeId) {
        rendered.slotScopeIds = [rendered.scopeId + '-s'];
    }
    if (slot && slot._c) {
        slot._d = true;
    }
    return rendered;
}
function ensureValidVNode(vnodes) {
    return vnodes.some(child => {
        if (!isVNode(child))
            return true;
        if (child.type === Comment)
            return false;
        if (child.type === Fragment &&
            !ensureValidVNode(child.children))
            return false;
        return true;
    })
        ? vnodes
        : null;
}

/**
 * For prefixing keys in v-on="obj" with "on"
 * @private
 */
function toHandlers(obj, preserveCaseIfNecessary) {
    const ret = {};
    for (const key in obj) {
        ret[preserveCaseIfNecessary && /[A-Z]/.test(key)
            ? `on:${key}`
            : toHandlerKey(key)] = obj[key];
    }
    return ret;
}

/**
 * #2437 In Vue 3, functional components do not have a public instance proxy but
 * they exist in the internal parent chain. For code that relies on traversing
 * public $parent chains, skip functional ones and go to the parent instead.
 */
const getPublicInstance = (i) => {
    if (!i)
        return null;
    if (isStatefulComponent(i))
        return getExposeProxy(i) || i.proxy;
    return getPublicInstance(i.parent);
};
const publicPropertiesMap = 
// Move PURE marker to new line to workaround compiler discarding it
// due to type annotation
/*#__PURE__*/ extend(Object.create(null), {
    $: i => i,
    $el: i => i.vnode.el,
    $data: i => i.data,
    $props: i => (i.props),
    $attrs: i => (i.attrs),
    $slots: i => (i.slots),
    $refs: i => (i.refs),
    $parent: i => getPublicInstance(i.parent),
    $root: i => getPublicInstance(i.root),
    $emit: i => i.emit,
    $options: i => (__VUE_OPTIONS_API__ ? resolveMergedOptions(i) : i.type),
    $forceUpdate: i => i.f || (i.f = () => queueJob(i.update)),
    $nextTick: i => i.n || (i.n = nextTick$1.bind(i.proxy)),
    $watch: i => (__VUE_OPTIONS_API__ ? instanceWatch.bind(i) : NOOP)
});
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
        // data / props / ctx
        // This getter gets called for every property access on the render context
        // during render and is a major hotspot. The most expensive part of this
        // is the multiple hasOwn() calls. It's much faster to do a simple property
        // access on a plain object, so we use an accessCache object (with null
        // prototype) to memoize what access type a key corresponds to.
        let normalizedProps;
        if (key[0] !== '$') {
            const n = accessCache[key];
            if (n !== undefined) {
                switch (n) {
                    case 1 /* AccessTypes.SETUP */:
                        return setupState[key];
                    case 2 /* AccessTypes.DATA */:
                        return data[key];
                    case 4 /* AccessTypes.CONTEXT */:
                        return ctx[key];
                    case 3 /* AccessTypes.PROPS */:
                        return props[key];
                    // default: just fallthrough
                }
            }
            else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                accessCache[key] = 1 /* AccessTypes.SETUP */;
                return setupState[key];
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                accessCache[key] = 2 /* AccessTypes.DATA */;
                return data[key];
            }
            else if (
            // only cache other properties when instance has declared (thus stable)
            // props
            (normalizedProps = instance.propsOptions[0]) &&
                hasOwn(normalizedProps, key)) {
                accessCache[key] = 3 /* AccessTypes.PROPS */;
                return props[key];
            }
            else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                accessCache[key] = 4 /* AccessTypes.CONTEXT */;
                return ctx[key];
            }
            else if (!__VUE_OPTIONS_API__ || shouldCacheAccess) {
                accessCache[key] = 0 /* AccessTypes.OTHER */;
            }
        }
        const publicGetter = publicPropertiesMap[key];
        let cssModule, globalProperties;
        // public $xxx properties
        if (publicGetter) {
            if (key === '$attrs') {
                track(instance, "get" /* TrackOpTypes.GET */, key);
            }
            return publicGetter(instance);
        }
        else if (
        // css module (injected by vue-loader)
        (cssModule = type.__cssModules) &&
            (cssModule = cssModule[key])) {
            return cssModule;
        }
        else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
            // user may set custom properties to `this` that start with `$`
            accessCache[key] = 4 /* AccessTypes.CONTEXT */;
            return ctx[key];
        }
        else if (
        // global properties
        ((globalProperties = appContext.config.globalProperties),
            hasOwn(globalProperties, key))) {
            {
                return globalProperties[key];
            }
        }
        else ;
    },
    set({ _: instance }, key, value) {
        const { data, setupState, ctx } = instance;
        if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
            setupState[key] = value;
            return true;
        }
        else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
            data[key] = value;
            return true;
        }
        else if (hasOwn(instance.props, key)) {
            return false;
        }
        if (key[0] === '$' && key.slice(1) in instance) {
            return false;
        }
        else {
            {
                ctx[key] = value;
            }
        }
        return true;
    },
    has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
        let normalizedProps;
        return (!!accessCache[key] ||
            (data !== EMPTY_OBJ && hasOwn(data, key)) ||
            (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
            ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
            hasOwn(ctx, key) ||
            hasOwn(publicPropertiesMap, key) ||
            hasOwn(appContext.config.globalProperties, key));
    },
    defineProperty(target, key, descriptor) {
        if (descriptor.get != null) {
            // invalidate key cache of a getter based property #5417
            target._.accessCache[key] = 0;
        }
        else if (hasOwn(descriptor, 'value')) {
            this.set(target, key, descriptor.value, null);
        }
        return Reflect.defineProperty(target, key, descriptor);
    }
};
const RuntimeCompiledPublicInstanceProxyHandlers = /*#__PURE__*/ extend({}, PublicInstanceProxyHandlers, {
    get(target, key) {
        // fast path for unscopables when using `with` block
        if (key === Symbol.unscopables) {
            return;
        }
        return PublicInstanceProxyHandlers.get(target, key, target);
    },
    has(_, key) {
        const has = key[0] !== '_' && !isGloballyWhitelisted(key);
        return has;
    }
});
let shouldCacheAccess = true;
function applyOptions(instance) {
    const options = resolveMergedOptions(instance);
    const publicThis = instance.proxy;
    const ctx = instance.ctx;
    // do not cache property access on public proxy during state initialization
    shouldCacheAccess = false;
    // call beforeCreate first before accessing other options since
    // the hook may mutate resolved options (#2791)
    if (options.beforeCreate) {
        callHook$1(options.beforeCreate, instance, "bc" /* LifecycleHooks.BEFORE_CREATE */);
    }
    const { 
    // state
    data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, 
    // lifecycle
    created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, 
    // public API
    expose, inheritAttrs, 
    // assets
    components, directives, filters } = options;
    const checkDuplicateProperties = null;
    // options initialization order (to be consistent with Vue 2):
    // - props (already done outside of this function)
    // - inject
    // - methods
    // - data (deferred since it relies on `this` access)
    // - computed
    // - watch (deferred since it relies on `this` access)
    if (injectOptions) {
        resolveInjections(injectOptions, ctx, checkDuplicateProperties, instance.appContext.config.unwrapInjectedRef);
    }
    if (methods) {
        for (const key in methods) {
            const methodHandler = methods[key];
            if (isFunction$1(methodHandler)) {
                // In dev mode, we use the `createRenderContext` function to define
                // methods to the proxy target, and those are read-only but
                // reconfigurable, so it needs to be redefined here
                {
                    ctx[key] = methodHandler.bind(publicThis);
                }
            }
        }
    }
    if (dataOptions) {
        const data = dataOptions.call(publicThis, publicThis);
        if (!isObject$1(data)) ;
        else {
            instance.data = reactive(data);
        }
    }
    // state initialization complete at this point - start caching access
    shouldCacheAccess = true;
    if (computedOptions) {
        for (const key in computedOptions) {
            const opt = computedOptions[key];
            const get = isFunction$1(opt)
                ? opt.bind(publicThis, publicThis)
                : isFunction$1(opt.get)
                    ? opt.get.bind(publicThis, publicThis)
                    : NOOP;
            const set = !isFunction$1(opt) && isFunction$1(opt.set)
                ? opt.set.bind(publicThis)
                : NOOP;
            const c = computed({
                get,
                set
            });
            Object.defineProperty(ctx, key, {
                enumerable: true,
                configurable: true,
                get: () => c.value,
                set: v => (c.value = v)
            });
        }
    }
    if (watchOptions) {
        for (const key in watchOptions) {
            createWatcher(watchOptions[key], ctx, publicThis, key);
        }
    }
    if (provideOptions) {
        const provides = isFunction$1(provideOptions)
            ? provideOptions.call(publicThis)
            : provideOptions;
        Reflect.ownKeys(provides).forEach(key => {
            provide(key, provides[key]);
        });
    }
    if (created) {
        callHook$1(created, instance, "c" /* LifecycleHooks.CREATED */);
    }
    function registerLifecycleHook(register, hook) {
        if (isArray$2(hook)) {
            hook.forEach(_hook => register(_hook.bind(publicThis)));
        }
        else if (hook) {
            register(hook.bind(publicThis));
        }
    }
    registerLifecycleHook(onBeforeMount, beforeMount);
    registerLifecycleHook(onMounted, mounted);
    registerLifecycleHook(onBeforeUpdate, beforeUpdate);
    registerLifecycleHook(onUpdated, updated);
    registerLifecycleHook(onActivated, activated);
    registerLifecycleHook(onDeactivated, deactivated);
    registerLifecycleHook(onErrorCaptured, errorCaptured);
    registerLifecycleHook(onRenderTracked, renderTracked);
    registerLifecycleHook(onRenderTriggered, renderTriggered);
    registerLifecycleHook(onBeforeUnmount, beforeUnmount);
    registerLifecycleHook(onUnmounted, unmounted);
    registerLifecycleHook(onServerPrefetch, serverPrefetch);
    if (isArray$2(expose)) {
        if (expose.length) {
            const exposed = instance.exposed || (instance.exposed = {});
            expose.forEach(key => {
                Object.defineProperty(exposed, key, {
                    get: () => publicThis[key],
                    set: val => (publicThis[key] = val)
                });
            });
        }
        else if (!instance.exposed) {
            instance.exposed = {};
        }
    }
    // options that are handled when creating the instance but also need to be
    // applied from mixins
    if (render && instance.render === NOOP) {
        instance.render = render;
    }
    if (inheritAttrs != null) {
        instance.inheritAttrs = inheritAttrs;
    }
    // asset options.
    if (components)
        instance.components = components;
    if (directives)
        instance.directives = directives;
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP, unwrapRef = false) {
    if (isArray$2(injectOptions)) {
        injectOptions = normalizeInject(injectOptions);
    }
    for (const key in injectOptions) {
        const opt = injectOptions[key];
        let injected;
        if (isObject$1(opt)) {
            if ('default' in opt) {
                injected = inject(opt.from || key, opt.default, true /* treat default function as factory */);
            }
            else {
                injected = inject(opt.from || key);
            }
        }
        else {
            injected = inject(opt);
        }
        if (isRef(injected)) {
            // TODO remove the check in 3.3
            if (unwrapRef) {
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => injected.value,
                    set: v => (injected.value = v)
                });
            }
            else {
                ctx[key] = injected;
            }
        }
        else {
            ctx[key] = injected;
        }
    }
}
function callHook$1(hook, instance, type) {
    callWithAsyncErrorHandling(isArray$2(hook)
        ? hook.map(h => h.bind(instance.proxy))
        : hook.bind(instance.proxy), instance, type);
}
function createWatcher(raw, ctx, publicThis, key) {
    const getter = key.includes('.')
        ? createPathGetter(publicThis, key)
        : () => publicThis[key];
    if (isString$1(raw)) {
        const handler = ctx[raw];
        if (isFunction$1(handler)) {
            watch(getter, handler);
        }
    }
    else if (isFunction$1(raw)) {
        watch(getter, raw.bind(publicThis));
    }
    else if (isObject$1(raw)) {
        if (isArray$2(raw)) {
            raw.forEach(r => createWatcher(r, ctx, publicThis, key));
        }
        else {
            const handler = isFunction$1(raw.handler)
                ? raw.handler.bind(publicThis)
                : ctx[raw.handler];
            if (isFunction$1(handler)) {
                watch(getter, handler, raw);
            }
        }
    }
    else ;
}
/**
 * Resolve merged options and cache it on the component.
 * This is done only once per-component since the merging does not involve
 * instances.
 */
function resolveMergedOptions(instance) {
    const base = instance.type;
    const { mixins, extends: extendsOptions } = base;
    const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
    const cached = cache.get(base);
    let resolved;
    if (cached) {
        resolved = cached;
    }
    else if (!globalMixins.length && !mixins && !extendsOptions) {
        {
            resolved = base;
        }
    }
    else {
        resolved = {};
        if (globalMixins.length) {
            globalMixins.forEach(m => mergeOptions(resolved, m, optionMergeStrategies, true));
        }
        mergeOptions(resolved, base, optionMergeStrategies);
    }
    if (isObject$1(base)) {
        cache.set(base, resolved);
    }
    return resolved;
}
function mergeOptions(to, from, strats, asMixin = false) {
    const { mixins, extends: extendsOptions } = from;
    if (extendsOptions) {
        mergeOptions(to, extendsOptions, strats, true);
    }
    if (mixins) {
        mixins.forEach((m) => mergeOptions(to, m, strats, true));
    }
    for (const key in from) {
        if (asMixin && key === 'expose') ;
        else {
            const strat = internalOptionMergeStrats[key] || (strats && strats[key]);
            to[key] = strat ? strat(to[key], from[key]) : from[key];
        }
    }
    return to;
}
const internalOptionMergeStrats = {
    data: mergeDataFn,
    props: mergeObjectOptions,
    emits: mergeObjectOptions,
    // objects
    methods: mergeObjectOptions,
    computed: mergeObjectOptions,
    // lifecycle
    beforeCreate: mergeAsArray,
    created: mergeAsArray,
    beforeMount: mergeAsArray,
    mounted: mergeAsArray,
    beforeUpdate: mergeAsArray,
    updated: mergeAsArray,
    beforeDestroy: mergeAsArray,
    beforeUnmount: mergeAsArray,
    destroyed: mergeAsArray,
    unmounted: mergeAsArray,
    activated: mergeAsArray,
    deactivated: mergeAsArray,
    errorCaptured: mergeAsArray,
    serverPrefetch: mergeAsArray,
    // assets
    components: mergeObjectOptions,
    directives: mergeObjectOptions,
    // watch
    watch: mergeWatchOptions,
    // provide / inject
    provide: mergeDataFn,
    inject: mergeInject
};
function mergeDataFn(to, from) {
    if (!from) {
        return to;
    }
    if (!to) {
        return from;
    }
    return function mergedDataFn() {
        return (extend)(isFunction$1(to) ? to.call(this, this) : to, isFunction$1(from) ? from.call(this, this) : from);
    };
}
function mergeInject(to, from) {
    return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
    if (isArray$2(raw)) {
        const res = {};
        for (let i = 0; i < raw.length; i++) {
            res[raw[i]] = raw[i];
        }
        return res;
    }
    return raw;
}
function mergeAsArray(to, from) {
    return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
    return to ? extend(extend(Object.create(null), to), from) : from;
}
function mergeWatchOptions(to, from) {
    if (!to)
        return from;
    if (!from)
        return to;
    const merged = extend(Object.create(null), to);
    for (const key in from) {
        merged[key] = mergeAsArray(to[key], from[key]);
    }
    return merged;
}

function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
isSSR = false) {
    const props = {};
    const attrs = {};
    def(attrs, InternalObjectKey, 1);
    instance.propsDefaults = Object.create(null);
    setFullProps(instance, rawProps, props, attrs);
    // ensure all declared prop keys are present
    for (const key in instance.propsOptions[0]) {
        if (!(key in props)) {
            props[key] = undefined;
        }
    }
    if (isStateful) {
        // stateful
        instance.props = isSSR ? props : shallowReactive(props);
    }
    else {
        if (!instance.type.props) {
            // functional w/ optional props, props === attrs
            instance.props = attrs;
        }
        else {
            // functional w/ declared props
            instance.props = props;
        }
    }
    instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
    const { props, attrs, vnode: { patchFlag } } = instance;
    const rawCurrentProps = toRaw(props);
    const [options] = instance.propsOptions;
    let hasAttrsChanged = false;
    if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) &&
        !(patchFlag & 16 /* PatchFlags.FULL_PROPS */)) {
        if (patchFlag & 8 /* PatchFlags.PROPS */) {
            // Compiler-generated props & no keys change, just set the updated
            // the props.
            const propsToUpdate = instance.vnode.dynamicProps;
            for (let i = 0; i < propsToUpdate.length; i++) {
                let key = propsToUpdate[i];
                // skip if the prop key is a declared emit event listener
                if (isEmitListener(instance.emitsOptions, key)) {
                    continue;
                }
                // PROPS flag guarantees rawProps to be non-null
                const value = rawProps[key];
                if (options) {
                    // attr / props separation was done on init and will be consistent
                    // in this code path, so just check if attrs have it.
                    if (hasOwn(attrs, key)) {
                        if (value !== attrs[key]) {
                            attrs[key] = value;
                            hasAttrsChanged = true;
                        }
                    }
                    else {
                        const camelizedKey = camelize(key);
                        props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false /* isAbsent */);
                    }
                }
                else {
                    if (value !== attrs[key]) {
                        attrs[key] = value;
                        hasAttrsChanged = true;
                    }
                }
            }
        }
    }
    else {
        // full props update.
        if (setFullProps(instance, rawProps, props, attrs)) {
            hasAttrsChanged = true;
        }
        // in case of dynamic props, check if we need to delete keys from
        // the props object
        let kebabKey;
        for (const key in rawCurrentProps) {
            if (!rawProps ||
                // for camelCase
                (!hasOwn(rawProps, key) &&
                    // it's possible the original props was passed in as kebab-case
                    // and converted to camelCase (#955)
                    ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))) {
                if (options) {
                    if (rawPrevProps &&
                        // for camelCase
                        (rawPrevProps[key] !== undefined ||
                            // for kebab-case
                            rawPrevProps[kebabKey] !== undefined)) {
                        props[key] = resolvePropValue(options, rawCurrentProps, key, undefined, instance, true /* isAbsent */);
                    }
                }
                else {
                    delete props[key];
                }
            }
        }
        // in the case of functional component w/o props declaration, props and
        // attrs point to the same object so it should already have been updated.
        if (attrs !== rawCurrentProps) {
            for (const key in attrs) {
                if (!rawProps ||
                    (!hasOwn(rawProps, key) &&
                        (!false ))) {
                    delete attrs[key];
                    hasAttrsChanged = true;
                }
            }
        }
    }
    // trigger updates for $attrs in case it's used in component slots
    if (hasAttrsChanged) {
        trigger(instance, "set" /* TriggerOpTypes.SET */, '$attrs');
    }
}
function setFullProps(instance, rawProps, props, attrs) {
    const [options, needCastKeys] = instance.propsOptions;
    let hasAttrsChanged = false;
    let rawCastValues;
    if (rawProps) {
        for (let key in rawProps) {
            // key, ref are reserved and never passed down
            if (isReservedProp(key)) {
                continue;
            }
            const value = rawProps[key];
            // prop option names are camelized during normalization, so to support
            // kebab -> camel conversion here we need to camelize the key.
            let camelKey;
            if (options && hasOwn(options, (camelKey = camelize(key)))) {
                if (!needCastKeys || !needCastKeys.includes(camelKey)) {
                    props[camelKey] = value;
                }
                else {
                    (rawCastValues || (rawCastValues = {}))[camelKey] = value;
                }
            }
            else if (!isEmitListener(instance.emitsOptions, key)) {
                if (!(key in attrs) || value !== attrs[key]) {
                    attrs[key] = value;
                    hasAttrsChanged = true;
                }
            }
        }
    }
    if (needCastKeys) {
        const rawCurrentProps = toRaw(props);
        const castValues = rawCastValues || EMPTY_OBJ;
        for (let i = 0; i < needCastKeys.length; i++) {
            const key = needCastKeys[i];
            props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
        }
    }
    return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
    const opt = options[key];
    if (opt != null) {
        const hasDefault = hasOwn(opt, 'default');
        // default values
        if (hasDefault && value === undefined) {
            const defaultValue = opt.default;
            if (opt.type !== Function && isFunction$1(defaultValue)) {
                const { propsDefaults } = instance;
                if (key in propsDefaults) {
                    value = propsDefaults[key];
                }
                else {
                    setCurrentInstance(instance);
                    value = propsDefaults[key] = defaultValue.call(null, props);
                    unsetCurrentInstance();
                }
            }
            else {
                value = defaultValue;
            }
        }
        // boolean casting
        if (opt[0 /* BooleanFlags.shouldCast */]) {
            if (isAbsent && !hasDefault) {
                value = false;
            }
            else if (opt[1 /* BooleanFlags.shouldCastTrue */] &&
                (value === '' || value === hyphenate(key))) {
                value = true;
            }
        }
    }
    return value;
}
function normalizePropsOptions(comp, appContext, asMixin = false) {
    const cache = appContext.propsCache;
    const cached = cache.get(comp);
    if (cached) {
        return cached;
    }
    const raw = comp.props;
    const normalized = {};
    const needCastKeys = [];
    // apply mixin/extends props
    let hasExtends = false;
    if (__VUE_OPTIONS_API__ && !isFunction$1(comp)) {
        const extendProps = (raw) => {
            hasExtends = true;
            const [props, keys] = normalizePropsOptions(raw, appContext, true);
            extend(normalized, props);
            if (keys)
                needCastKeys.push(...keys);
        };
        if (!asMixin && appContext.mixins.length) {
            appContext.mixins.forEach(extendProps);
        }
        if (comp.extends) {
            extendProps(comp.extends);
        }
        if (comp.mixins) {
            comp.mixins.forEach(extendProps);
        }
    }
    if (!raw && !hasExtends) {
        if (isObject$1(comp)) {
            cache.set(comp, EMPTY_ARR);
        }
        return EMPTY_ARR;
    }
    if (isArray$2(raw)) {
        for (let i = 0; i < raw.length; i++) {
            const normalizedKey = camelize(raw[i]);
            if (validatePropName(normalizedKey)) {
                normalized[normalizedKey] = EMPTY_OBJ;
            }
        }
    }
    else if (raw) {
        for (const key in raw) {
            const normalizedKey = camelize(key);
            if (validatePropName(normalizedKey)) {
                const opt = raw[key];
                const prop = (normalized[normalizedKey] =
                    isArray$2(opt) || isFunction$1(opt) ? { type: opt } : opt);
                if (prop) {
                    const booleanIndex = getTypeIndex(Boolean, prop.type);
                    const stringIndex = getTypeIndex(String, prop.type);
                    prop[0 /* BooleanFlags.shouldCast */] = booleanIndex > -1;
                    prop[1 /* BooleanFlags.shouldCastTrue */] =
                        stringIndex < 0 || booleanIndex < stringIndex;
                    // if the prop needs boolean casting or default value
                    if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                        needCastKeys.push(normalizedKey);
                    }
                }
            }
        }
    }
    const res = [normalized, needCastKeys];
    if (isObject$1(comp)) {
        cache.set(comp, res);
    }
    return res;
}
function validatePropName(key) {
    if (key[0] !== '$') {
        return true;
    }
    return false;
}
// use function string name to check type constructors
// so that it works across vms / iframes.
function getType(ctor) {
    const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
    return match ? match[1] : ctor === null ? 'null' : '';
}
function isSameType(a, b) {
    return getType(a) === getType(b);
}
function getTypeIndex(type, expectedTypes) {
    if (isArray$2(expectedTypes)) {
        return expectedTypes.findIndex(t => isSameType(t, type));
    }
    else if (isFunction$1(expectedTypes)) {
        return isSameType(expectedTypes, type) ? 0 : -1;
    }
    return -1;
}

const isInternalKey = (key) => key[0] === '_' || key === '$stable';
const normalizeSlotValue = (value) => isArray$2(value)
    ? value.map(normalizeVNode)
    : [normalizeVNode(value)];
const normalizeSlot = (key, rawSlot, ctx) => {
    if (rawSlot._n) {
        // already normalized - #5353
        return rawSlot;
    }
    const normalized = withCtx((...args) => {
        return normalizeSlotValue(rawSlot(...args));
    }, ctx);
    normalized._c = false;
    return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance) => {
    const ctx = rawSlots._ctx;
    for (const key in rawSlots) {
        if (isInternalKey(key))
            continue;
        const value = rawSlots[key];
        if (isFunction$1(value)) {
            slots[key] = normalizeSlot(key, value, ctx);
        }
        else if (value != null) {
            const normalized = normalizeSlotValue(value);
            slots[key] = () => normalized;
        }
    }
};
const normalizeVNodeSlots = (instance, children) => {
    const normalized = normalizeSlotValue(children);
    instance.slots.default = () => normalized;
};
const initSlots = (instance, children) => {
    if (instance.vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
        const type = children._;
        if (type) {
            // users can get the shallow readonly version of the slots object through `this.$slots`,
            // we should avoid the proxy object polluting the slots of the internal instance
            instance.slots = toRaw(children);
            // make compiler marker non-enumerable
            def(children, '_', type);
        }
        else {
            normalizeObjectSlots(children, (instance.slots = {}));
        }
    }
    else {
        instance.slots = {};
        if (children) {
            normalizeVNodeSlots(instance, children);
        }
    }
    def(instance.slots, InternalObjectKey, 1);
};
const updateSlots = (instance, children, optimized) => {
    const { vnode, slots } = instance;
    let needDeletionCheck = true;
    let deletionComparisonTarget = EMPTY_OBJ;
    if (vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
        const type = children._;
        if (type) {
            // compiled slots.
            if (optimized && type === 1 /* SlotFlags.STABLE */) {
                // compiled AND stable.
                // no need to update, and skip stale slots removal.
                needDeletionCheck = false;
            }
            else {
                // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                // normalization.
                extend(slots, children);
                // #2893
                // when rendering the optimized slots by manually written render function,
                // we need to delete the `slots._` flag if necessary to make subsequent updates reliable,
                // i.e. let the `renderSlot` create the bailed Fragment
                if (!optimized && type === 1 /* SlotFlags.STABLE */) {
                    delete slots._;
                }
            }
        }
        else {
            needDeletionCheck = !children.$stable;
            normalizeObjectSlots(children, slots);
        }
        deletionComparisonTarget = children;
    }
    else if (children) {
        // non slot object children (direct value) passed to a component
        normalizeVNodeSlots(instance, children);
        deletionComparisonTarget = { default: 1 };
    }
    // delete stale slots
    if (needDeletionCheck) {
        for (const key in slots) {
            if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
                delete slots[key];
            }
        }
    }
};

function createAppContext() {
    return {
        app: null,
        config: {
            isNativeTag: NO,
            performance: false,
            globalProperties: {},
            optionMergeStrategies: {},
            errorHandler: undefined,
            warnHandler: undefined,
            compilerOptions: {}
        },
        mixins: [],
        components: {},
        directives: {},
        provides: Object.create(null),
        optionsCache: new WeakMap(),
        propsCache: new WeakMap(),
        emitsCache: new WeakMap()
    };
}
let uid = 0;
function createAppAPI(render, hydrate) {
    return function createApp(rootComponent, rootProps = null) {
        if (!isFunction$1(rootComponent)) {
            rootComponent = Object.assign({}, rootComponent);
        }
        if (rootProps != null && !isObject$1(rootProps)) {
            rootProps = null;
        }
        const context = createAppContext();
        const installedPlugins = new Set();
        let isMounted = false;
        const app = (context.app = {
            _uid: uid++,
            _component: rootComponent,
            _props: rootProps,
            _container: null,
            _context: context,
            _instance: null,
            version: version$1,
            get config() {
                return context.config;
            },
            set config(v) {
            },
            use(plugin, ...options) {
                if (installedPlugins.has(plugin)) ;
                else if (plugin && isFunction$1(plugin.install)) {
                    installedPlugins.add(plugin);
                    plugin.install(app, ...options);
                }
                else if (isFunction$1(plugin)) {
                    installedPlugins.add(plugin);
                    plugin(app, ...options);
                }
                else ;
                return app;
            },
            mixin(mixin) {
                if (__VUE_OPTIONS_API__) {
                    if (!context.mixins.includes(mixin)) {
                        context.mixins.push(mixin);
                    }
                }
                return app;
            },
            component(name, component) {
                if (!component) {
                    return context.components[name];
                }
                context.components[name] = component;
                return app;
            },
            directive(name, directive) {
                if (!directive) {
                    return context.directives[name];
                }
                context.directives[name] = directive;
                return app;
            },
            mount(rootContainer, isHydrate, isSVG) {
                if (!isMounted) {
                    const vnode = createVNode(rootComponent, rootProps);
                    // store app context on the root VNode.
                    // this will be set on the root instance on initial mount.
                    vnode.appContext = context;
                    if (isHydrate && hydrate) {
                        hydrate(vnode, rootContainer);
                    }
                    else {
                        render(vnode, rootContainer, isSVG);
                    }
                    isMounted = true;
                    app._container = rootContainer;
                    rootContainer.__vue_app__ = app;
                    if (__VUE_PROD_DEVTOOLS__) {
                        app._instance = vnode.component;
                        devtoolsInitApp(app, version$1);
                    }
                    return getExposeProxy(vnode.component) || vnode.component.proxy;
                }
            },
            unmount() {
                if (isMounted) {
                    render(null, app._container);
                    if (__VUE_PROD_DEVTOOLS__) {
                        app._instance = null;
                        devtoolsUnmountApp(app);
                    }
                    delete app._container.__vue_app__;
                }
            },
            provide(key, value) {
                context.provides[key] = value;
                return app;
            }
        });
        return app;
    };
}

/**
 * Function for handling a template ref
 */
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
    if (isArray$2(rawRef)) {
        rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray$2(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
        return;
    }
    if (isAsyncWrapper(vnode) && !isUnmount) {
        // when mounting async components, nothing needs to be done,
        // because the template ref is forwarded to inner component
        return;
    }
    const refValue = vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */
        ? getExposeProxy(vnode.component) || vnode.component.proxy
        : vnode.el;
    const value = isUnmount ? null : refValue;
    const { i: owner, r: ref } = rawRef;
    const oldRef = oldRawRef && oldRawRef.r;
    const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs;
    const setupState = owner.setupState;
    // dynamic ref changed. unset old ref
    if (oldRef != null && oldRef !== ref) {
        if (isString$1(oldRef)) {
            refs[oldRef] = null;
            if (hasOwn(setupState, oldRef)) {
                setupState[oldRef] = null;
            }
        }
        else if (isRef(oldRef)) {
            oldRef.value = null;
        }
    }
    if (isFunction$1(ref)) {
        callWithErrorHandling(ref, owner, 12 /* ErrorCodes.FUNCTION_REF */, [value, refs]);
    }
    else {
        const _isString = isString$1(ref);
        const _isRef = isRef(ref);
        if (_isString || _isRef) {
            const doSet = () => {
                if (rawRef.f) {
                    const existing = _isString ? refs[ref] : ref.value;
                    if (isUnmount) {
                        isArray$2(existing) && remove(existing, refValue);
                    }
                    else {
                        if (!isArray$2(existing)) {
                            if (_isString) {
                                refs[ref] = [refValue];
                                if (hasOwn(setupState, ref)) {
                                    setupState[ref] = refs[ref];
                                }
                            }
                            else {
                                ref.value = [refValue];
                                if (rawRef.k)
                                    refs[rawRef.k] = ref.value;
                            }
                        }
                        else if (!existing.includes(refValue)) {
                            existing.push(refValue);
                        }
                    }
                }
                else if (_isString) {
                    refs[ref] = value;
                    if (hasOwn(setupState, ref)) {
                        setupState[ref] = value;
                    }
                }
                else if (_isRef) {
                    ref.value = value;
                    if (rawRef.k)
                        refs[rawRef.k] = value;
                }
                else ;
            };
            if (value) {
                doSet.id = -1;
                queuePostRenderEffect(doSet, parentSuspense);
            }
            else {
                doSet();
            }
        }
    }
}

let hasMismatch = false;
const isSVGContainer = (container) => /svg/.test(container.namespaceURI) && container.tagName !== 'foreignObject';
const isComment = (node) => node.nodeType === 8 /* DOMNodeTypes.COMMENT */;
// Note: hydration is DOM-specific
// But we have to place it in core due to tight coupling with core - splitting
// it out creates a ton of unnecessary complexity.
// Hydration also depends on some renderer internal logic which needs to be
// passed in via arguments.
function createHydrationFunctions(rendererInternals) {
    const { mt: mountComponent, p: patch, o: { patchProp, createText, nextSibling, parentNode, remove, insert, createComment } } = rendererInternals;
    const hydrate = (vnode, container) => {
        if (!container.hasChildNodes()) {
            patch(null, vnode, container);
            flushPostFlushCbs();
            container._vnode = vnode;
            return;
        }
        hasMismatch = false;
        hydrateNode(container.firstChild, vnode, null, null, null);
        flushPostFlushCbs();
        container._vnode = vnode;
        if (hasMismatch && !false) {
            // this error should show up in production
            console.error(`Hydration completed but contains mismatches.`);
        }
    };
    const hydrateNode = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized = false) => {
        const isFragmentStart = isComment(node) && node.data === '[';
        const onMismatch = () => handleMismatch(node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragmentStart);
        const { type, ref, shapeFlag, patchFlag } = vnode;
        const domType = node.nodeType;
        vnode.el = node;
        if (patchFlag === -2 /* PatchFlags.BAIL */) {
            optimized = false;
            vnode.dynamicChildren = null;
        }
        let nextNode = null;
        switch (type) {
            case Text:
                if (domType !== 3 /* DOMNodeTypes.TEXT */) {
                    // #5728 empty text node inside a slot can cause hydration failure
                    // because the server rendered HTML won't contain a text node
                    if (vnode.children === '') {
                        insert((vnode.el = createText('')), parentNode(node), node);
                        nextNode = node;
                    }
                    else {
                        nextNode = onMismatch();
                    }
                }
                else {
                    if (node.data !== vnode.children) {
                        hasMismatch = true;
                        node.data = vnode.children;
                    }
                    nextNode = nextSibling(node);
                }
                break;
            case Comment:
                if (domType !== 8 /* DOMNodeTypes.COMMENT */ || isFragmentStart) {
                    nextNode = onMismatch();
                }
                else {
                    nextNode = nextSibling(node);
                }
                break;
            case Static:
                if (domType !== 1 /* DOMNodeTypes.ELEMENT */ && domType !== 3 /* DOMNodeTypes.TEXT */) {
                    nextNode = onMismatch();
                }
                else {
                    // determine anchor, adopt content
                    nextNode = node;
                    // if the static vnode has its content stripped during build,
                    // adopt it from the server-rendered HTML.
                    const needToAdoptContent = !vnode.children.length;
                    for (let i = 0; i < vnode.staticCount; i++) {
                        if (needToAdoptContent)
                            vnode.children +=
                                nextNode.nodeType === 1 /* DOMNodeTypes.ELEMENT */
                                    ? nextNode.outerHTML
                                    : nextNode.data;
                        if (i === vnode.staticCount - 1) {
                            vnode.anchor = nextNode;
                        }
                        nextNode = nextSibling(nextNode);
                    }
                    return nextNode;
                }
                break;
            case Fragment:
                if (!isFragmentStart) {
                    nextNode = onMismatch();
                }
                else {
                    nextNode = hydrateFragment(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
                }
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    if (domType !== 1 /* DOMNodeTypes.ELEMENT */ ||
                        vnode.type.toLowerCase() !==
                            node.tagName.toLowerCase()) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = hydrateElement(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
                    }
                }
                else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                    // when setting up the render effect, if the initial vnode already
                    // has .el set, the component will perform hydration instead of mount
                    // on its sub-tree.
                    vnode.slotScopeIds = slotScopeIds;
                    const container = parentNode(node);
                    mountComponent(vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), optimized);
                    // component may be async, so in the case of fragments we cannot rely
                    // on component's rendered output to determine the end of the fragment
                    // instead, we do a lookahead to find the end anchor node.
                    nextNode = isFragmentStart
                        ? locateClosingAsyncAnchor(node)
                        : nextSibling(node);
                    // #4293 teleport as component root
                    if (nextNode &&
                        isComment(nextNode) &&
                        nextNode.data === 'teleport end') {
                        nextNode = nextSibling(nextNode);
                    }
                    // #3787
                    // if component is async, it may get moved / unmounted before its
                    // inner component is loaded, so we need to give it a placeholder
                    // vnode that matches its adopted DOM.
                    if (isAsyncWrapper(vnode)) {
                        let subTree;
                        if (isFragmentStart) {
                            subTree = createVNode(Fragment);
                            subTree.anchor = nextNode
                                ? nextNode.previousSibling
                                : container.lastChild;
                        }
                        else {
                            subTree =
                                node.nodeType === 3 ? createTextVNode('') : createVNode('div');
                        }
                        subTree.el = node;
                        vnode.component.subTree = subTree;
                    }
                }
                else if (shapeFlag & 64 /* ShapeFlags.TELEPORT */) {
                    if (domType !== 8 /* DOMNodeTypes.COMMENT */) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, rendererInternals, hydrateChildren);
                    }
                }
                else if (shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
                    nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, isSVGContainer(parentNode(node)), slotScopeIds, optimized, rendererInternals, hydrateNode);
                }
                else ;
        }
        if (ref != null) {
            setRef(ref, null, parentSuspense, vnode);
        }
        return nextNode;
    };
    const hydrateElement = (el, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        optimized = optimized || !!vnode.dynamicChildren;
        const { type, props, patchFlag, shapeFlag, dirs } = vnode;
        // #4006 for form elements with non-string v-model value bindings
        // e.g. <option :value="obj">, <input type="checkbox" :true-value="1">
        const forcePatchValue = (type === 'input' && dirs) || type === 'option';
        // skip props & children if this is hoisted static nodes
        // #5405 in dev, always hydrate children for HMR
        if (forcePatchValue || patchFlag !== -1 /* PatchFlags.HOISTED */) {
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'created');
            }
            // props
            if (props) {
                if (forcePatchValue ||
                    !optimized ||
                    patchFlag & (16 /* PatchFlags.FULL_PROPS */ | 32 /* PatchFlags.HYDRATE_EVENTS */)) {
                    for (const key in props) {
                        if ((forcePatchValue && key.endsWith('value')) ||
                            (isOn(key) && !isReservedProp(key))) {
                            patchProp(el, key, null, props[key], false, undefined, parentComponent);
                        }
                    }
                }
                else if (props.onClick) {
                    // Fast path for click listeners (which is most often) to avoid
                    // iterating through props.
                    patchProp(el, 'onClick', null, props.onClick, false, undefined, parentComponent);
                }
            }
            // vnode / directive hooks
            let vnodeHooks;
            if ((vnodeHooks = props && props.onVnodeBeforeMount)) {
                invokeVNodeHook(vnodeHooks, parentComponent, vnode);
            }
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
            }
            if ((vnodeHooks = props && props.onVnodeMounted) || dirs) {
                queueEffectWithSuspense(() => {
                    vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
                    dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                }, parentSuspense);
            }
            // children
            if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */ &&
                // skip if element has innerHTML / textContent
                !(props && (props.innerHTML || props.textContent))) {
                let next = hydrateChildren(el.firstChild, vnode, el, parentComponent, parentSuspense, slotScopeIds, optimized);
                while (next) {
                    hasMismatch = true;
                    // The SSRed DOM contains more nodes than it should. Remove them.
                    const cur = next;
                    next = next.nextSibling;
                    remove(cur);
                }
            }
            else if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                if (el.textContent !== vnode.children) {
                    hasMismatch = true;
                    el.textContent = vnode.children;
                }
            }
        }
        return el.nextSibling;
    };
    const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        optimized = optimized || !!parentVNode.dynamicChildren;
        const children = parentVNode.children;
        const l = children.length;
        for (let i = 0; i < l; i++) {
            const vnode = optimized
                ? children[i]
                : (children[i] = normalizeVNode(children[i]));
            if (node) {
                node = hydrateNode(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
            }
            else if (vnode.type === Text && !vnode.children) {
                continue;
            }
            else {
                hasMismatch = true;
                // the SSRed DOM didn't contain enough nodes. Mount the missing ones.
                patch(null, vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), slotScopeIds);
            }
        }
        return node;
    };
    const hydrateFragment = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        const { slotScopeIds: fragmentSlotScopeIds } = vnode;
        if (fragmentSlotScopeIds) {
            slotScopeIds = slotScopeIds
                ? slotScopeIds.concat(fragmentSlotScopeIds)
                : fragmentSlotScopeIds;
        }
        const container = parentNode(node);
        const next = hydrateChildren(nextSibling(node), vnode, container, parentComponent, parentSuspense, slotScopeIds, optimized);
        if (next && isComment(next) && next.data === ']') {
            return nextSibling((vnode.anchor = next));
        }
        else {
            // fragment didn't hydrate successfully, since we didn't get a end anchor
            // back. This should have led to node/children mismatch warnings.
            hasMismatch = true;
            // since the anchor is missing, we need to create one and insert it
            insert((vnode.anchor = createComment(`]`)), container, next);
            return next;
        }
    };
    const handleMismatch = (node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragment) => {
        hasMismatch = true;
        vnode.el = null;
        if (isFragment) {
            // remove excessive fragment nodes
            const end = locateClosingAsyncAnchor(node);
            while (true) {
                const next = nextSibling(node);
                if (next && next !== end) {
                    remove(next);
                }
                else {
                    break;
                }
            }
        }
        const next = nextSibling(node);
        const container = parentNode(node);
        remove(node);
        patch(null, vnode, container, next, parentComponent, parentSuspense, isSVGContainer(container), slotScopeIds);
        return next;
    };
    const locateClosingAsyncAnchor = (node) => {
        let match = 0;
        while (node) {
            node = nextSibling(node);
            if (node && isComment(node)) {
                if (node.data === '[')
                    match++;
                if (node.data === ']') {
                    if (match === 0) {
                        return nextSibling(node);
                    }
                    else {
                        match--;
                    }
                }
            }
        }
        return node;
    };
    return [hydrate, hydrateNode];
}

/**
 * This is only called in esm-bundler builds.
 * It is called when a renderer is created, in `baseCreateRenderer` so that
 * importing runtime-core is side-effects free.
 *
 * istanbul-ignore-next
 */
function initFeatureFlags() {
    if (typeof __VUE_OPTIONS_API__ !== 'boolean') {
        getGlobalThis().__VUE_OPTIONS_API__ = true;
    }
    if (typeof __VUE_PROD_DEVTOOLS__ !== 'boolean') {
        getGlobalThis().__VUE_PROD_DEVTOOLS__ = false;
    }
}

const queuePostRenderEffect = queueEffectWithSuspense
    ;
/**
 * The createRenderer function accepts two generic arguments:
 * HostNode and HostElement, corresponding to Node and Element types in the
 * host environment. For example, for runtime-dom, HostNode would be the DOM
 * `Node` interface and HostElement would be the DOM `Element` interface.
 *
 * Custom renderers can pass in the platform specific types like this:
 *
 * ``` js
 * const { render, createApp } = createRenderer<Node, Element>({
 *   patchProp,
 *   ...nodeOps
 * })
 * ```
 */
function createRenderer(options) {
    return baseCreateRenderer(options);
}
// Separate API for creating hydration-enabled renderer.
// Hydration logic is only used when calling this function, making it
// tree-shakable.
function createHydrationRenderer(options) {
    return baseCreateRenderer(options, createHydrationFunctions);
}
// implementation
function baseCreateRenderer(options, createHydrationFns) {
    // compile-time feature flags check
    {
        initFeatureFlags();
    }
    const target = getGlobalThis();
    target.__VUE__ = true;
    if (__VUE_PROD_DEVTOOLS__) {
        setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target);
    }
    const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
    // Note: functions inside this closure should use `const xxx = () => {}`
    // style in order to prevent being inlined by minifiers.
    const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
        if (n1 === n2) {
            return;
        }
        // patching & not same type, unmount old tree
        if (n1 && !isSameVNodeType(n1, n2)) {
            anchor = getNextHostNode(n1);
            unmount(n1, parentComponent, parentSuspense, true);
            n1 = null;
        }
        if (n2.patchFlag === -2 /* PatchFlags.BAIL */) {
            optimized = false;
            n2.dynamicChildren = null;
        }
        const { type, ref, shapeFlag } = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container, anchor);
                break;
            case Comment:
                processCommentNode(n1, n2, container, anchor);
                break;
            case Static:
                if (n1 == null) {
                    mountStaticNode(n2, container, anchor, isSVG);
                }
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                    processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else if (shapeFlag & 64 /* ShapeFlags.TELEPORT */) {
                    type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                }
                else if (shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
                    type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                }
                else ;
        }
        // set ref
        if (ref != null && parentComponent) {
            setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
        }
    };
    const processText = (n1, n2, container, anchor) => {
        if (n1 == null) {
            hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
        }
        else {
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                hostSetText(el, n2.children);
            }
        }
    };
    const processCommentNode = (n1, n2, container, anchor) => {
        if (n1 == null) {
            hostInsert((n2.el = hostCreateComment(n2.children || '')), container, anchor);
        }
        else {
            // there's no support for dynamic comments
            n2.el = n1.el;
        }
    };
    const mountStaticNode = (n2, container, anchor, isSVG) => {
        [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG, n2.el, n2.anchor);
    };
    const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
        let next;
        while (el && el !== anchor) {
            next = hostNextSibling(el);
            hostInsert(el, container, nextSibling);
            el = next;
        }
        hostInsert(anchor, container, nextSibling);
    };
    const removeStaticNode = ({ el, anchor }) => {
        let next;
        while (el && el !== anchor) {
            next = hostNextSibling(el);
            hostRemove(el);
            el = next;
        }
        hostRemove(anchor);
    };
    const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        isSVG = isSVG || n2.type === 'svg';
        if (n1 == null) {
            mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
        else {
            patchElement(n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
    };
    const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        let el;
        let vnodeHook;
        const { type, props, shapeFlag, transition, patchFlag, dirs } = vnode;
        if (vnode.el &&
            hostCloneNode !== undefined &&
            patchFlag === -1 /* PatchFlags.HOISTED */) {
            // If a vnode has non-null el, it means it's being reused.
            // Only static vnodes can be reused, so its mounted DOM nodes should be
            // exactly the same, and we can simply do a clone here.
            // only do this in production since cloned trees cannot be HMR updated.
            el = vnode.el = hostCloneNode(vnode.el);
        }
        else {
            el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is, props);
            // mount children first, since some props may rely on child content
            // being already rendered, e.g. `<select value>`
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(el, vnode.children);
            }
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', slotScopeIds, optimized);
            }
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'created');
            }
            // props
            if (props) {
                for (const key in props) {
                    if (key !== 'value' && !isReservedProp(key)) {
                        hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                    }
                }
                /**
                 * Special case for setting value on DOM elements:
                 * - it can be order-sensitive (e.g. should be set *after* min/max, #2325, #4024)
                 * - it needs to be forced (#1471)
                 * #2353 proposes adding another renderer option to configure this, but
                 * the properties affects are so finite it is worth special casing it
                 * here to reduce the complexity. (Special casing it also should not
                 * affect non-DOM renderers)
                 */
                if ('value' in props) {
                    hostPatchProp(el, 'value', null, props.value);
                }
                if ((vnodeHook = props.onVnodeBeforeMount)) {
                    invokeVNodeHook(vnodeHook, parentComponent, vnode);
                }
            }
            // scopeId
            setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
        }
        if (__VUE_PROD_DEVTOOLS__) {
            Object.defineProperty(el, '__vnode', {
                value: vnode,
                enumerable: false
            });
            Object.defineProperty(el, '__vueParentComponent', {
                value: parentComponent,
                enumerable: false
            });
        }
        if (dirs) {
            invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
        }
        // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
        // #1689 For inside suspense + suspense resolved case, just call it
        const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
            transition &&
            !transition.persisted;
        if (needCallTransitionHooks) {
            transition.beforeEnter(el);
        }
        hostInsert(el, container, anchor);
        if ((vnodeHook = props && props.onVnodeMounted) ||
            needCallTransitionHooks ||
            dirs) {
            queuePostRenderEffect(() => {
                vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                needCallTransitionHooks && transition.enter(el);
                dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
            }, parentSuspense);
        }
    };
    const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
        if (scopeId) {
            hostSetScopeId(el, scopeId);
        }
        if (slotScopeIds) {
            for (let i = 0; i < slotScopeIds.length; i++) {
                hostSetScopeId(el, slotScopeIds[i]);
            }
        }
        if (parentComponent) {
            let subTree = parentComponent.subTree;
            if (vnode === subTree) {
                const parentVNode = parentComponent.vnode;
                setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
            }
        }
    };
    const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, start = 0) => {
        for (let i = start; i < children.length; i++) {
            const child = (children[i] = optimized
                ? cloneIfMounted(children[i])
                : normalizeVNode(children[i]));
            patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
    };
    const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        const el = (n2.el = n1.el);
        let { patchFlag, dynamicChildren, dirs } = n2;
        // #1426 take the old vnode's patch flag into account since user may clone a
        // compiler-generated vnode, which de-opts to FULL_PROPS
        patchFlag |= n1.patchFlag & 16 /* PatchFlags.FULL_PROPS */;
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        let vnodeHook;
        // disable recurse in beforeUpdate hooks
        parentComponent && toggleRecurse(parentComponent, false);
        if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
            invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        }
        if (dirs) {
            invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
        }
        parentComponent && toggleRecurse(parentComponent, true);
        const areChildrenSVG = isSVG && n2.type !== 'foreignObject';
        if (dynamicChildren) {
            patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds);
        }
        else if (!optimized) {
            // full diff
            patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds, false);
        }
        if (patchFlag > 0) {
            // the presence of a patchFlag means this element's render code was
            // generated by the compiler and can take the fast path.
            // in this path old node and new node are guaranteed to have the same shape
            // (i.e. at the exact same position in the source template)
            if (patchFlag & 16 /* PatchFlags.FULL_PROPS */) {
                // element props contain dynamic keys, full diff needed
                patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
            }
            else {
                // class
                // this flag is matched when the element has dynamic class bindings.
                if (patchFlag & 2 /* PatchFlags.CLASS */) {
                    if (oldProps.class !== newProps.class) {
                        hostPatchProp(el, 'class', null, newProps.class, isSVG);
                    }
                }
                // style
                // this flag is matched when the element has dynamic style bindings
                if (patchFlag & 4 /* PatchFlags.STYLE */) {
                    hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG);
                }
                // props
                // This flag is matched when the element has dynamic prop/attr bindings
                // other than class and style. The keys of dynamic prop/attrs are saved for
                // faster iteration.
                // Note dynamic keys like :[foo]="bar" will cause this optimization to
                // bail out and go through a full diff because we need to unset the old key
                if (patchFlag & 8 /* PatchFlags.PROPS */) {
                    // if the flag is present then dynamicProps must be non-null
                    const propsToUpdate = n2.dynamicProps;
                    for (let i = 0; i < propsToUpdate.length; i++) {
                        const key = propsToUpdate[i];
                        const prev = oldProps[key];
                        const next = newProps[key];
                        // #1471 force patch value
                        if (next !== prev || key === 'value') {
                            hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                }
            }
            // text
            // This flag is matched when the element has only dynamic text children.
            if (patchFlag & 1 /* PatchFlags.TEXT */) {
                if (n1.children !== n2.children) {
                    hostSetElementText(el, n2.children);
                }
            }
        }
        else if (!optimized && dynamicChildren == null) {
            // unoptimized, full diff
            patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
        }
        if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
            queuePostRenderEffect(() => {
                vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
                dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
            }, parentSuspense);
        }
    };
    // The fast path for blocks.
    const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG, slotScopeIds) => {
        for (let i = 0; i < newChildren.length; i++) {
            const oldVNode = oldChildren[i];
            const newVNode = newChildren[i];
            // Determine the container (parent element) for the patch.
            const container = 
            // oldVNode may be an errored async setup() component inside Suspense
            // which will not have a mounted element
            oldVNode.el &&
                // - In the case of a Fragment, we need to provide the actual parent
                // of the Fragment itself so it can move its children.
                (oldVNode.type === Fragment ||
                    // - In the case of different nodes, there is going to be a replacement
                    // which also requires the correct parent container
                    !isSameVNodeType(oldVNode, newVNode) ||
                    // - In the case of a component, it could contain anything.
                    oldVNode.shapeFlag & (6 /* ShapeFlags.COMPONENT */ | 64 /* ShapeFlags.TELEPORT */))
                ? hostParentNode(oldVNode.el)
                : // In other cases, the parent container is not actually used so we
                    // just pass the block element here to avoid a DOM parentNode call.
                    fallbackContainer;
            patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, true);
        }
    };
    const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                // empty string is not valid prop
                if (isReservedProp(key))
                    continue;
                const next = newProps[key];
                const prev = oldProps[key];
                // defer patching value
                if (next !== prev && key !== 'value') {
                    hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!isReservedProp(key) && !(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                    }
                }
            }
            if ('value' in newProps) {
                hostPatchProp(el, 'value', oldProps.value, newProps.value);
            }
        }
    };
    const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
        const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
        let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
        // check if this is a slot fragment with :slotted scope ids
        if (fragmentSlotScopeIds) {
            slotScopeIds = slotScopeIds
                ? slotScopeIds.concat(fragmentSlotScopeIds)
                : fragmentSlotScopeIds;
        }
        if (n1 == null) {
            hostInsert(fragmentStartAnchor, container, anchor);
            hostInsert(fragmentEndAnchor, container, anchor);
            // a fragment can only have array children
            // since they are either generated by the compiler, or implicitly created
            // from arrays.
            mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
        else {
            if (patchFlag > 0 &&
                patchFlag & 64 /* PatchFlags.STABLE_FRAGMENT */ &&
                dynamicChildren &&
                // #2715 the previous fragment could've been a BAILed one as a result
                // of renderSlot() with no valid children
                n1.dynamicChildren) {
                // a stable fragment (template root or <template v-for>) doesn't need to
                // patch children order, but it may contain dynamicChildren.
                patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG, slotScopeIds);
                if (
                // #2080 if the stable fragment has a key, it's a <template v-for> that may
                //  get moved around. Make sure all root level vnodes inherit el.
                // #2134 or if it's a component root, it may also get moved around
                // as the component is being moved.
                n2.key != null ||
                    (parentComponent && n2 === parentComponent.subTree)) {
                    traverseStaticChildren(n1, n2, true /* shallow */);
                }
            }
            else {
                // keyed / unkeyed, or manual fragments.
                // for keyed & unkeyed, since they are compiler generated from v-for,
                // each child is guaranteed to be a block so the fragment will never
                // have dynamicChildren.
                patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
        }
    };
    const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        n2.slotScopeIds = slotScopeIds;
        if (n1 == null) {
            if (n2.shapeFlag & 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */) {
                parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
            }
            else {
                mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
            }
        }
        else {
            updateComponent(n1, n2, optimized);
        }
    };
    const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
        // inject renderer internals for keepAlive
        if (isKeepAlive(initialVNode)) {
            instance.ctx.renderer = internals;
        }
        // resolve props and slots for setup context
        {
            setupComponent(instance);
        }
        // setup() is async. This component relies on async logic to be resolved
        // before proceeding
        if (instance.asyncDep) {
            parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
            // Give it a placeholder if this is not hydration
            // TODO handle self-defined fallback
            if (!initialVNode.el) {
                const placeholder = (instance.subTree = createVNode(Comment));
                processCommentNode(null, placeholder, container, anchor);
            }
            return;
        }
        setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
    };
    const updateComponent = (n1, n2, optimized) => {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2, optimized)) {
            if (instance.asyncDep &&
                !instance.asyncResolved) {
                updateComponentPreRender(instance, n2, optimized);
                return;
            }
            else {
                // normal update
                instance.next = n2;
                // in case the child component is also queued, remove it to avoid
                // double updating the same child component in the same flush.
                invalidateJob(instance.update);
                // instance.update is the reactive effect.
                instance.update();
            }
        }
        else {
            // no update needed. just copy over properties
            n2.el = n1.el;
            instance.vnode = n2;
        }
    };
    const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
        const componentUpdateFn = () => {
            if (!instance.isMounted) {
                let vnodeHook;
                const { el, props } = initialVNode;
                const { bm, m, parent } = instance;
                const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
                toggleRecurse(instance, false);
                // beforeMount hook
                if (bm) {
                    invokeArrayFns(bm);
                }
                // onVnodeBeforeMount
                if (!isAsyncWrapperVNode &&
                    (vnodeHook = props && props.onVnodeBeforeMount)) {
                    invokeVNodeHook(vnodeHook, parent, initialVNode);
                }
                toggleRecurse(instance, true);
                if (el && hydrateNode) {
                    // vnode has adopted host node - perform hydration instead of mount.
                    const hydrateSubTree = () => {
                        instance.subTree = renderComponentRoot(instance);
                        hydrateNode(el, instance.subTree, instance, parentSuspense, null);
                    };
                    if (isAsyncWrapperVNode) {
                        initialVNode.type.__asyncLoader().then(
                        // note: we are moving the render call into an async callback,
                        // which means it won't track dependencies - but it's ok because
                        // a server-rendered async wrapper is already in resolved state
                        // and it will never need to change.
                        () => !instance.isUnmounted && hydrateSubTree());
                    }
                    else {
                        hydrateSubTree();
                    }
                }
                else {
                    const subTree = (instance.subTree = renderComponentRoot(instance));
                    patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                    initialVNode.el = subTree.el;
                }
                // mounted hook
                if (m) {
                    queuePostRenderEffect(m, parentSuspense);
                }
                // onVnodeMounted
                if (!isAsyncWrapperVNode &&
                    (vnodeHook = props && props.onVnodeMounted)) {
                    const scopedInitialVNode = initialVNode;
                    queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
                }
                // activated hook for keep-alive roots.
                // #1742 activated hook must be accessed after first render
                // since the hook may be injected by a child keep-alive
                if (initialVNode.shapeFlag & 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */ ||
                    (parent &&
                        isAsyncWrapper(parent.vnode) &&
                        parent.vnode.shapeFlag & 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */)) {
                    instance.a && queuePostRenderEffect(instance.a, parentSuspense);
                }
                instance.isMounted = true;
                if (__VUE_PROD_DEVTOOLS__) {
                    devtoolsComponentAdded(instance);
                }
                // #2458: deference mount-only object parameters to prevent memleaks
                initialVNode = container = anchor = null;
            }
            else {
                // updateComponent
                // This is triggered by mutation of component's own state (next: null)
                // OR parent calling processComponent (next: VNode)
                let { next, bu, u, parent, vnode } = instance;
                let originNext = next;
                let vnodeHook;
                // Disallow component effect recursion during pre-lifecycle hooks.
                toggleRecurse(instance, false);
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next, optimized);
                }
                else {
                    next = vnode;
                }
                // beforeUpdate hook
                if (bu) {
                    invokeArrayFns(bu);
                }
                // onVnodeBeforeUpdate
                if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                    invokeVNodeHook(vnodeHook, parent, next, vnode);
                }
                toggleRecurse(instance, true);
                const nextTree = renderComponentRoot(instance);
                const prevTree = instance.subTree;
                instance.subTree = nextTree;
                patch(prevTree, nextTree, 
                // parent may have changed if it's in a teleport
                hostParentNode(prevTree.el), 
                // anchor may have changed if it's in a fragment
                getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                next.el = nextTree.el;
                if (originNext === null) {
                    // self-triggered update. In case of HOC, update parent component
                    // vnode el. HOC is indicated by parent instance's subTree pointing
                    // to child component's vnode
                    updateHOCHostEl(instance, nextTree.el);
                }
                // updated hook
                if (u) {
                    queuePostRenderEffect(u, parentSuspense);
                }
                // onVnodeUpdated
                if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
                    queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
                }
                if (__VUE_PROD_DEVTOOLS__) {
                    devtoolsComponentUpdated(instance);
                }
            }
        };
        // create reactive effect for rendering
        const effect = (instance.effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update), instance.scope // track it in component's effect scope
        ));
        const update = (instance.update = () => effect.run());
        update.id = instance.uid;
        // allowRecurse
        // #1801, #2043 component render effects should allow recursive updates
        toggleRecurse(instance, true);
        update();
    };
    const updateComponentPreRender = (instance, nextVNode, optimized) => {
        nextVNode.component = instance;
        const prevProps = instance.vnode.props;
        instance.vnode = nextVNode;
        instance.next = null;
        updateProps(instance, nextVNode.props, prevProps, optimized);
        updateSlots(instance, nextVNode.children, optimized);
        pauseTracking();
        // props update may have triggered pre-flush watchers.
        // flush them before the render update.
        flushPreFlushCbs();
        resetTracking();
    };
    const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized = false) => {
        const c1 = n1 && n1.children;
        const prevShapeFlag = n1 ? n1.shapeFlag : 0;
        const c2 = n2.children;
        const { patchFlag, shapeFlag } = n2;
        // fast path
        if (patchFlag > 0) {
            if (patchFlag & 128 /* PatchFlags.KEYED_FRAGMENT */) {
                // this could be either fully-keyed or mixed (some keyed some not)
                // presence of patchFlag means children are guaranteed to be arrays
                patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                return;
            }
            else if (patchFlag & 256 /* PatchFlags.UNKEYED_FRAGMENT */) {
                // unkeyed
                patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                return;
            }
        }
        // children has 3 possibilities: text, array or no children.
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            // text children fast path
            if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(c1, parentComponent, parentSuspense);
            }
            if (c2 !== c1) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // prev children was array
                if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // two arrays, cannot assume anything, do full diff
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else {
                    // no new children, just unmount old
                    unmountChildren(c1, parentComponent, parentSuspense, true);
                }
            }
            else {
                // prev children was text OR null
                // new children is array OR null
                if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                    hostSetElementText(container, '');
                }
                // mount new if array
                if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
            }
        }
    };
    const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        c1 = c1 || EMPTY_ARR;
        c2 = c2 || EMPTY_ARR;
        const oldLength = c1.length;
        const newLength = c2.length;
        const commonLength = Math.min(oldLength, newLength);
        let i;
        for (i = 0; i < commonLength; i++) {
            const nextChild = (c2[i] = optimized
                ? cloneIfMounted(c2[i])
                : normalizeVNode(c2[i]));
            patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
        if (oldLength > newLength) {
            // remove old
            unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
        }
        else {
            // mount new
            mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, commonLength);
        }
    };
    // can be all-keyed or mixed
    const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1; // prev ending index
        let e2 = l2 - 1; // next ending index
        // 1. sync from start
        // (a b) c
        // (a b) d e
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = (c2[i] = optimized
                ? cloneIfMounted(c2[i])
                : normalizeVNode(c2[i]));
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
            else {
                break;
            }
            i++;
        }
        // 2. sync from end
        // a (b c)
        // d e (b c)
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = (c2[e2] = optimized
                ? cloneIfMounted(c2[e2])
                : normalizeVNode(c2[e2]));
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3. common sequence + mount
        // (a b)
        // (a b) c
        // i = 2, e1 = 1, e2 = 2
        // (a b)
        // c (a b)
        // i = 0, e1 = -1, e2 = 0
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                while (i <= e2) {
                    patch(null, (c2[i] = optimized
                        ? cloneIfMounted(c2[i])
                        : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    i++;
                }
            }
        }
        // 4. common sequence + unmount
        // (a b) c
        // (a b)
        // i = 2, e1 = 2, e2 = 1
        // a (b c)
        // (b c)
        // i = 0, e1 = 0, e2 = -1
        else if (i > e2) {
            while (i <= e1) {
                unmount(c1[i], parentComponent, parentSuspense, true);
                i++;
            }
        }
        // 5. unknown sequence
        // [i ... e1 + 1]: a b [c d e] f g
        // [i ... e2 + 1]: a b [e d c h] f g
        // i = 2, e1 = 4, e2 = 5
        else {
            const s1 = i; // prev starting index
            const s2 = i; // next starting index
            // 5.1 build key:index map for newChildren
            const keyToNewIndexMap = new Map();
            for (i = s2; i <= e2; i++) {
                const nextChild = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                if (nextChild.key != null) {
                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            // 5.2 loop through old children left to be patched and try to patch
            // matching nodes & remove nodes that are no longer present
            let j;
            let patched = 0;
            const toBePatched = e2 - s2 + 1;
            let moved = false;
            // used to track whether any node has moved
            let maxNewIndexSoFar = 0;
            // works as Map<newIndex, oldIndex>
            // Note that oldIndex is offset by +1
            // and oldIndex = 0 is a special value indicating the new node has
            // no corresponding old node.
            // used for determining longest stable subsequence
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // all new children have been patched so this can only be a removal
                    unmount(prevChild, parentComponent, parentSuspense, true);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // key-less node, try to locate a key-less node of the same type
                    for (j = s2; j <= e2; j++) {
                        if (newIndexToOldIndexMap[j - s2] === 0 &&
                            isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    unmount(prevChild, parentComponent, parentSuspense, true);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    patched++;
                }
            }
            // 5.3 move and mount
            // generate longest stable subsequence only when nodes have moved
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : EMPTY_ARR;
            j = increasingNewIndexSequence.length - 1;
            // looping backwards so that we can use last patched node as anchor
            for (i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                if (newIndexToOldIndexMap[i] === 0) {
                    // mount new
                    patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else if (moved) {
                    // move if:
                    // There is no stable subsequence (e.g. a reverse)
                    // OR current node is not among the stable sequence
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        move(nextChild, container, anchor, 2 /* MoveType.REORDER */);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    };
    const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
        const { el, type, transition, children, shapeFlag } = vnode;
        if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
            move(vnode.component.subTree, container, anchor, moveType);
            return;
        }
        if (shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
            vnode.suspense.move(container, anchor, moveType);
            return;
        }
        if (shapeFlag & 64 /* ShapeFlags.TELEPORT */) {
            type.move(vnode, container, anchor, internals);
            return;
        }
        if (type === Fragment) {
            hostInsert(el, container, anchor);
            for (let i = 0; i < children.length; i++) {
                move(children[i], container, anchor, moveType);
            }
            hostInsert(vnode.anchor, container, anchor);
            return;
        }
        if (type === Static) {
            moveStaticNode(vnode, container, anchor);
            return;
        }
        // single nodes
        const needTransition = moveType !== 2 /* MoveType.REORDER */ &&
            shapeFlag & 1 /* ShapeFlags.ELEMENT */ &&
            transition;
        if (needTransition) {
            if (moveType === 0 /* MoveType.ENTER */) {
                transition.beforeEnter(el);
                hostInsert(el, container, anchor);
                queuePostRenderEffect(() => transition.enter(el), parentSuspense);
            }
            else {
                const { leave, delayLeave, afterLeave } = transition;
                const remove = () => hostInsert(el, container, anchor);
                const performLeave = () => {
                    leave(el, () => {
                        remove();
                        afterLeave && afterLeave();
                    });
                };
                if (delayLeave) {
                    delayLeave(el, remove, performLeave);
                }
                else {
                    performLeave();
                }
            }
        }
        else {
            hostInsert(el, container, anchor);
        }
    };
    const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
        const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
        // unset ref
        if (ref != null) {
            setRef(ref, null, parentSuspense, vnode, true);
        }
        if (shapeFlag & 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */) {
            parentComponent.ctx.deactivate(vnode);
            return;
        }
        const shouldInvokeDirs = shapeFlag & 1 /* ShapeFlags.ELEMENT */ && dirs;
        const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
        let vnodeHook;
        if (shouldInvokeVnodeHook &&
            (vnodeHook = props && props.onVnodeBeforeUnmount)) {
            invokeVNodeHook(vnodeHook, parentComponent, vnode);
        }
        if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
            unmountComponent(vnode.component, parentSuspense, doRemove);
        }
        else {
            if (shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
                vnode.suspense.unmount(parentSuspense, doRemove);
                return;
            }
            if (shouldInvokeDirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount');
            }
            if (shapeFlag & 64 /* ShapeFlags.TELEPORT */) {
                vnode.type.remove(vnode, parentComponent, parentSuspense, optimized, internals, doRemove);
            }
            else if (dynamicChildren &&
                // #1153: fast path should not be taken for non-stable (v-for) fragments
                (type !== Fragment ||
                    (patchFlag > 0 && patchFlag & 64 /* PatchFlags.STABLE_FRAGMENT */))) {
                // fast path for block nodes: only need to unmount dynamic children.
                unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
            }
            else if ((type === Fragment &&
                patchFlag &
                    (128 /* PatchFlags.KEYED_FRAGMENT */ | 256 /* PatchFlags.UNKEYED_FRAGMENT */)) ||
                (!optimized && shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */)) {
                unmountChildren(children, parentComponent, parentSuspense);
            }
            if (doRemove) {
                remove(vnode);
            }
        }
        if ((shouldInvokeVnodeHook &&
            (vnodeHook = props && props.onVnodeUnmounted)) ||
            shouldInvokeDirs) {
            queuePostRenderEffect(() => {
                vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                shouldInvokeDirs &&
                    invokeDirectiveHook(vnode, null, parentComponent, 'unmounted');
            }, parentSuspense);
        }
    };
    const remove = vnode => {
        const { type, el, anchor, transition } = vnode;
        if (type === Fragment) {
            {
                removeFragment(el, anchor);
            }
            return;
        }
        if (type === Static) {
            removeStaticNode(vnode);
            return;
        }
        const performRemove = () => {
            hostRemove(el);
            if (transition && !transition.persisted && transition.afterLeave) {
                transition.afterLeave();
            }
        };
        if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */ &&
            transition &&
            !transition.persisted) {
            const { leave, delayLeave } = transition;
            const performLeave = () => leave(el, performRemove);
            if (delayLeave) {
                delayLeave(vnode.el, performRemove, performLeave);
            }
            else {
                performLeave();
            }
        }
        else {
            performRemove();
        }
    };
    const removeFragment = (cur, end) => {
        // For fragments, directly remove all contained DOM nodes.
        // (fragment child nodes cannot have transition)
        let next;
        while (cur !== end) {
            next = hostNextSibling(cur);
            hostRemove(cur);
            cur = next;
        }
        hostRemove(end);
    };
    const unmountComponent = (instance, parentSuspense, doRemove) => {
        const { bum, scope, update, subTree, um } = instance;
        // beforeUnmount hook
        if (bum) {
            invokeArrayFns(bum);
        }
        // stop effects in component scope
        scope.stop();
        // update may be null if a component is unmounted before its async
        // setup has resolved.
        if (update) {
            // so that scheduler will no longer invoke it
            update.active = false;
            unmount(subTree, instance, parentSuspense, doRemove);
        }
        // unmounted hook
        if (um) {
            queuePostRenderEffect(um, parentSuspense);
        }
        queuePostRenderEffect(() => {
            instance.isUnmounted = true;
        }, parentSuspense);
        // A component with async dep inside a pending suspense is unmounted before
        // its async dep resolves. This should remove the dep from the suspense, and
        // cause the suspense to resolve immediately if that was the last dep.
        if (parentSuspense &&
            parentSuspense.pendingBranch &&
            !parentSuspense.isUnmounted &&
            instance.asyncDep &&
            !instance.asyncResolved &&
            instance.suspenseId === parentSuspense.pendingId) {
            parentSuspense.deps--;
            if (parentSuspense.deps === 0) {
                parentSuspense.resolve();
            }
        }
        if (__VUE_PROD_DEVTOOLS__) {
            devtoolsComponentRemoved(instance);
        }
    };
    const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
        for (let i = start; i < children.length; i++) {
            unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
        }
    };
    const getNextHostNode = vnode => {
        if (vnode.shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
            return getNextHostNode(vnode.component.subTree);
        }
        if (vnode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
            return vnode.suspense.next();
        }
        return hostNextSibling((vnode.anchor || vnode.el));
    };
    const render = (vnode, container, isSVG) => {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode, null, null, true);
            }
        }
        else {
            patch(container._vnode || null, vnode, container, null, null, null, isSVG);
        }
        flushPreFlushCbs();
        flushPostFlushCbs();
        container._vnode = vnode;
    };
    const internals = {
        p: patch,
        um: unmount,
        m: move,
        r: remove,
        mt: mountComponent,
        mc: mountChildren,
        pc: patchChildren,
        pbc: patchBlockChildren,
        n: getNextHostNode,
        o: options
    };
    let hydrate;
    let hydrateNode;
    if (createHydrationFns) {
        [hydrate, hydrateNode] = createHydrationFns(internals);
    }
    return {
        render,
        hydrate,
        createApp: createAppAPI(render, hydrate)
    };
}
function toggleRecurse({ effect, update }, allowed) {
    effect.allowRecurse = update.allowRecurse = allowed;
}
/**
 * #1156
 * When a component is HMR-enabled, we need to make sure that all static nodes
 * inside a block also inherit the DOM element from the previous tree so that
 * HMR updates (which are full updates) can retrieve the element for patching.
 *
 * #2080
 * Inside keyed `template` fragment static children, if a fragment is moved,
 * the children will always be moved. Therefore, in order to ensure correct move
 * position, el should be inherited from previous nodes.
 */
function traverseStaticChildren(n1, n2, shallow = false) {
    const ch1 = n1.children;
    const ch2 = n2.children;
    if (isArray$2(ch1) && isArray$2(ch2)) {
        for (let i = 0; i < ch1.length; i++) {
            // this is only called in the optimized path so array children are
            // guaranteed to be vnodes
            const c1 = ch1[i];
            let c2 = ch2[i];
            if (c2.shapeFlag & 1 /* ShapeFlags.ELEMENT */ && !c2.dynamicChildren) {
                if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* PatchFlags.HYDRATE_EVENTS */) {
                    c2 = ch2[i] = cloneIfMounted(ch2[i]);
                    c2.el = c1.el;
                }
                if (!shallow)
                    traverseStaticChildren(c1, c2);
            }
        }
    }
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

const isTeleport = (type) => type.__isTeleport;
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === '');
const isTargetSVG = (target) => typeof SVGElement !== 'undefined' && target instanceof SVGElement;
const resolveTarget = (props, select) => {
    const targetSelector = props && props.to;
    if (isString$1(targetSelector)) {
        if (!select) {
            return null;
        }
        else {
            const target = select(targetSelector);
            return target;
        }
    }
    else {
        return targetSelector;
    }
};
const TeleportImpl = {
    __isTeleport: true,
    process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals) {
        const { mc: mountChildren, pc: patchChildren, pbc: patchBlockChildren, o: { insert, querySelector, createText, createComment } } = internals;
        const disabled = isTeleportDisabled(n2.props);
        let { shapeFlag, children, dynamicChildren } = n2;
        if (n1 == null) {
            // insert anchors in the main view
            const placeholder = (n2.el = createText(''));
            const mainAnchor = (n2.anchor = createText(''));
            insert(placeholder, container, anchor);
            insert(mainAnchor, container, anchor);
            const target = (n2.target = resolveTarget(n2.props, querySelector));
            const targetAnchor = (n2.targetAnchor = createText(''));
            if (target) {
                insert(targetAnchor, target);
                // #2652 we could be teleporting from a non-SVG tree into an SVG tree
                isSVG = isSVG || isTargetSVG(target);
            }
            const mount = (container, anchor) => {
                // Teleport *always* has Array children. This is enforced in both the
                // compiler and vnode children normalization.
                if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    mountChildren(children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
            };
            if (disabled) {
                mount(container, mainAnchor);
            }
            else if (target) {
                mount(target, targetAnchor);
            }
        }
        else {
            // update content
            n2.el = n1.el;
            const mainAnchor = (n2.anchor = n1.anchor);
            const target = (n2.target = n1.target);
            const targetAnchor = (n2.targetAnchor = n1.targetAnchor);
            const wasDisabled = isTeleportDisabled(n1.props);
            const currentContainer = wasDisabled ? container : target;
            const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
            isSVG = isSVG || isTargetSVG(target);
            if (dynamicChildren) {
                // fast path when the teleport happens to be a block root
                patchBlockChildren(n1.dynamicChildren, dynamicChildren, currentContainer, parentComponent, parentSuspense, isSVG, slotScopeIds);
                // even in block tree mode we need to make sure all root-level nodes
                // in the teleport inherit previous DOM references so that they can
                // be moved in future patches.
                traverseStaticChildren(n1, n2, true);
            }
            else if (!optimized) {
                patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, false);
            }
            if (disabled) {
                if (!wasDisabled) {
                    // enabled -> disabled
                    // move into main container
                    moveTeleport(n2, container, mainAnchor, internals, 1 /* TeleportMoveTypes.TOGGLE */);
                }
            }
            else {
                // target changed
                if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
                    const nextTarget = (n2.target = resolveTarget(n2.props, querySelector));
                    if (nextTarget) {
                        moveTeleport(n2, nextTarget, null, internals, 0 /* TeleportMoveTypes.TARGET_CHANGE */);
                    }
                }
                else if (wasDisabled) {
                    // disabled -> enabled
                    // move into teleport target
                    moveTeleport(n2, target, targetAnchor, internals, 1 /* TeleportMoveTypes.TOGGLE */);
                }
            }
        }
    },
    remove(vnode, parentComponent, parentSuspense, optimized, { um: unmount, o: { remove: hostRemove } }, doRemove) {
        const { shapeFlag, children, anchor, targetAnchor, target, props } = vnode;
        if (target) {
            hostRemove(targetAnchor);
        }
        // an unmounted teleport should always remove its children if not disabled
        if (doRemove || !isTeleportDisabled(props)) {
            hostRemove(anchor);
            if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    unmount(child, parentComponent, parentSuspense, true, !!child.dynamicChildren);
                }
            }
        }
    },
    move: moveTeleport,
    hydrate: hydrateTeleport
};
function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2 /* TeleportMoveTypes.REORDER */) {
    // move target anchor if this is a target change.
    if (moveType === 0 /* TeleportMoveTypes.TARGET_CHANGE */) {
        insert(vnode.targetAnchor, container, parentAnchor);
    }
    const { el, anchor, shapeFlag, children, props } = vnode;
    const isReorder = moveType === 2 /* TeleportMoveTypes.REORDER */;
    // move main view anchor if this is a re-order.
    if (isReorder) {
        insert(el, container, parentAnchor);
    }
    // if this is a re-order and teleport is enabled (content is in target)
    // do not move children. So the opposite is: only move children if this
    // is not a reorder, or the teleport is disabled
    if (!isReorder || isTeleportDisabled(props)) {
        // Teleport has either Array children or no children.
        if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            for (let i = 0; i < children.length; i++) {
                move(children[i], container, parentAnchor, 2 /* MoveType.REORDER */);
            }
        }
    }
    // move main view anchor if this is a re-order.
    if (isReorder) {
        insert(anchor, container, parentAnchor);
    }
}
function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, { o: { nextSibling, parentNode, querySelector } }, hydrateChildren) {
    const target = (vnode.target = resolveTarget(vnode.props, querySelector));
    if (target) {
        // if multiple teleports rendered to the same target element, we need to
        // pick up from where the last teleport finished instead of the first node
        const targetNode = target._lpa || target.firstChild;
        if (vnode.shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            if (isTeleportDisabled(vnode.props)) {
                vnode.anchor = hydrateChildren(nextSibling(node), vnode, parentNode(node), parentComponent, parentSuspense, slotScopeIds, optimized);
                vnode.targetAnchor = targetNode;
            }
            else {
                vnode.anchor = nextSibling(node);
                // lookahead until we find the target anchor
                // we cannot rely on return value of hydrateChildren() because there
                // could be nested teleports
                let targetAnchor = targetNode;
                while (targetAnchor) {
                    targetAnchor = nextSibling(targetAnchor);
                    if (targetAnchor &&
                        targetAnchor.nodeType === 8 &&
                        targetAnchor.data === 'teleport anchor') {
                        vnode.targetAnchor = targetAnchor;
                        target._lpa =
                            vnode.targetAnchor && nextSibling(vnode.targetAnchor);
                        break;
                    }
                }
                hydrateChildren(targetNode, vnode, target, parentComponent, parentSuspense, slotScopeIds, optimized);
            }
        }
    }
    return vnode.anchor && nextSibling(vnode.anchor);
}
// Force-casted public typing for h and TSX props inference
const Teleport = TeleportImpl;

const Fragment = Symbol(undefined);
const Text = Symbol(undefined);
const Comment = Symbol(undefined);
const Static = Symbol(undefined);
// Since v-if and v-for are the two possible ways node structure can dynamically
// change, once we consider v-if branches and each v-for fragment a block, we
// can divide a template into nested blocks, and within each block the node
// structure would be stable. This allows us to skip most children diffing
// and only worry about the dynamic nodes (indicated by patch flags).
const blockStack = [];
let currentBlock = null;
/**
 * Open a block.
 * This must be called before `createBlock`. It cannot be part of `createBlock`
 * because the children of the block are evaluated before `createBlock` itself
 * is called. The generated code typically looks like this:
 *
 * ```js
 * function render() {
 *   return (openBlock(),createBlock('div', null, [...]))
 * }
 * ```
 * disableTracking is true when creating a v-for fragment block, since a v-for
 * fragment always diffs its children.
 *
 * @private
 */
function openBlock(disableTracking = false) {
    blockStack.push((currentBlock = disableTracking ? null : []));
}
function closeBlock() {
    blockStack.pop();
    currentBlock = blockStack[blockStack.length - 1] || null;
}
// Whether we should be tracking dynamic child nodes inside a block.
// Only tracks when this value is > 0
// We are not using a simple boolean because this value may need to be
// incremented/decremented by nested usage of v-once (see below)
let isBlockTreeEnabled = 1;
/**
 * Block tracking sometimes needs to be disabled, for example during the
 * creation of a tree that needs to be cached by v-once. The compiler generates
 * code like this:
 *
 * ``` js
 * _cache[1] || (
 *   setBlockTracking(-1),
 *   _cache[1] = createVNode(...),
 *   setBlockTracking(1),
 *   _cache[1]
 * )
 * ```
 *
 * @private
 */
function setBlockTracking(value) {
    isBlockTreeEnabled += value;
}
function setupBlock(vnode) {
    // save current block children on the block vnode
    vnode.dynamicChildren =
        isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
    // close block
    closeBlock();
    // a block is always going to be patched, so track it as a child of its
    // parent block
    if (isBlockTreeEnabled > 0 && currentBlock) {
        currentBlock.push(vnode);
    }
    return vnode;
}
/**
 * @private
 */
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
    return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true /* isBlock */));
}
/**
 * Create a block root vnode. Takes the same exact arguments as `createVNode`.
 * A block root keeps track of dynamic nodes within the block in the
 * `dynamicChildren` array.
 *
 * @private
 */
function createBlock(type, props, children, patchFlag, dynamicProps) {
    return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true /* isBlock: prevent a block from tracking itself */));
}
function isVNode(value) {
    return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}
/**
 * Internal API for registering an arguments transform for createVNode
 * used for creating stubs in the test-utils
 * It is *internal* but needs to be exposed for test-utils to pick up proper
 * typings
 */
function transformVNodeArgs(transformer) {
}
const InternalObjectKey = `__vInternal`;
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({ ref, ref_key, ref_for }) => {
    return (ref != null
        ? isString$1(ref) || isRef(ref) || isFunction$1(ref)
            ? { i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for }
            : ref
        : null);
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1 /* ShapeFlags.ELEMENT */, isBlockNode = false, needFullChildrenNormalization = false) {
    const vnode = {
        __v_isVNode: true,
        __v_skip: true,
        type,
        props,
        key: props && normalizeKey(props),
        ref: props && normalizeRef(props),
        scopeId: currentScopeId,
        slotScopeIds: null,
        children,
        component: null,
        suspense: null,
        ssContent: null,
        ssFallback: null,
        dirs: null,
        transition: null,
        el: null,
        anchor: null,
        target: null,
        targetAnchor: null,
        staticCount: 0,
        shapeFlag,
        patchFlag,
        dynamicProps,
        dynamicChildren: null,
        appContext: null
    };
    if (needFullChildrenNormalization) {
        normalizeChildren(vnode, children);
        // normalize suspense children
        if (shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
            type.normalize(vnode);
        }
    }
    else if (children) {
        // compiled element vnode - if children is passed, only possible types are
        // string or Array.
        vnode.shapeFlag |= isString$1(children)
            ? 8 /* ShapeFlags.TEXT_CHILDREN */
            : 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // track vnode for block tree
    if (isBlockTreeEnabled > 0 &&
        // avoid a block node from tracking itself
        !isBlockNode &&
        // has current parent block
        currentBlock &&
        // presence of a patch flag indicates this node needs patching on updates.
        // component nodes also should always be patched, because even if the
        // component doesn't need to update, it needs to persist the instance on to
        // the next vnode so that it can be properly unmounted later.
        (vnode.patchFlag > 0 || shapeFlag & 6 /* ShapeFlags.COMPONENT */) &&
        // the EVENTS flag is only for hydration and if it is the only flag, the
        // vnode should not be considered dynamic due to handler caching.
        vnode.patchFlag !== 32 /* PatchFlags.HYDRATE_EVENTS */) {
        currentBlock.push(vnode);
    }
    return vnode;
}
const createVNode = (_createVNode);
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
    if (!type || type === NULL_DYNAMIC_COMPONENT) {
        type = Comment;
    }
    if (isVNode(type)) {
        // createVNode receiving an existing vnode. This happens in cases like
        // <component :is="vnode"/>
        // #2078 make sure to merge refs during the clone instead of overwriting it
        const cloned = cloneVNode(type, props, true /* mergeRef: true */);
        if (children) {
            normalizeChildren(cloned, children);
        }
        if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
            if (cloned.shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                currentBlock[currentBlock.indexOf(type)] = cloned;
            }
            else {
                currentBlock.push(cloned);
            }
        }
        cloned.patchFlag |= -2 /* PatchFlags.BAIL */;
        return cloned;
    }
    // class component normalization.
    if (isClassComponent(type)) {
        type = type.__vccOpts;
    }
    // class & style normalization.
    if (props) {
        // for reactive or proxy objects, we need to clone it to enable mutation.
        props = guardReactiveProps(props);
        let { class: klass, style } = props;
        if (klass && !isString$1(klass)) {
            props.class = normalizeClass(klass);
        }
        if (isObject$1(style)) {
            // reactive state objects need to be cloned since they are likely to be
            // mutated
            if (isProxy(style) && !isArray$2(style)) {
                style = extend({}, style);
            }
            props.style = normalizeStyle(style);
        }
    }
    // encode the vnode type information into a bitmap
    const shapeFlag = isString$1(type)
        ? 1 /* ShapeFlags.ELEMENT */
        : isSuspense(type)
            ? 128 /* ShapeFlags.SUSPENSE */
            : isTeleport(type)
                ? 64 /* ShapeFlags.TELEPORT */
                : isObject$1(type)
                    ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                    : isFunction$1(type)
                        ? 2 /* ShapeFlags.FUNCTIONAL_COMPONENT */
                        : 0;
    return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
}
function guardReactiveProps(props) {
    if (!props)
        return null;
    return isProxy(props) || InternalObjectKey in props
        ? extend({}, props)
        : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false) {
    // This is intentionally NOT using spread or extend to avoid the runtime
    // key enumeration cost.
    const { props, ref, patchFlag, children } = vnode;
    const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
    const cloned = {
        __v_isVNode: true,
        __v_skip: true,
        type: vnode.type,
        props: mergedProps,
        key: mergedProps && normalizeKey(mergedProps),
        ref: extraProps && extraProps.ref
            ? // #2078 in the case of <component :is="vnode" ref="extra"/>
                // if the vnode itself already has a ref, cloneVNode will need to merge
                // the refs so the single vnode can be set on multiple refs
                mergeRef && ref
                    ? isArray$2(ref)
                        ? ref.concat(normalizeRef(extraProps))
                        : [ref, normalizeRef(extraProps)]
                    : normalizeRef(extraProps)
            : ref,
        scopeId: vnode.scopeId,
        slotScopeIds: vnode.slotScopeIds,
        children: children,
        target: vnode.target,
        targetAnchor: vnode.targetAnchor,
        staticCount: vnode.staticCount,
        shapeFlag: vnode.shapeFlag,
        // if the vnode is cloned with extra props, we can no longer assume its
        // existing patch flag to be reliable and need to add the FULL_PROPS flag.
        // note: preserve flag for fragments since they use the flag for children
        // fast paths only.
        patchFlag: extraProps && vnode.type !== Fragment
            ? patchFlag === -1 // hoisted node
                ? 16 /* PatchFlags.FULL_PROPS */
                : patchFlag | 16 /* PatchFlags.FULL_PROPS */
            : patchFlag,
        dynamicProps: vnode.dynamicProps,
        dynamicChildren: vnode.dynamicChildren,
        appContext: vnode.appContext,
        dirs: vnode.dirs,
        transition: vnode.transition,
        // These should technically only be non-null on mounted VNodes. However,
        // they *should* be copied for kept-alive vnodes. So we just always copy
        // them since them being non-null during a mount doesn't affect the logic as
        // they will simply be overwritten.
        component: vnode.component,
        suspense: vnode.suspense,
        ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
        ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
        el: vnode.el,
        anchor: vnode.anchor
    };
    return cloned;
}
/**
 * @private
 */
function createTextVNode(text = ' ', flag = 0) {
    return createVNode(Text, null, text, flag);
}
/**
 * @private
 */
function createStaticVNode(content, numberOfNodes) {
    // A static vnode can contain multiple stringified elements, and the number
    // of elements is necessary for hydration.
    const vnode = createVNode(Static, null, content);
    vnode.staticCount = numberOfNodes;
    return vnode;
}
/**
 * @private
 */
function createCommentVNode(text = '', 
// when used as the v-else branch, the comment node must be created as a
// block to ensure correct updates.
asBlock = false) {
    return asBlock
        ? (openBlock(), createBlock(Comment, null, text))
        : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
    if (child == null || typeof child === 'boolean') {
        // empty placeholder
        return createVNode(Comment);
    }
    else if (isArray$2(child)) {
        // fragment
        return createVNode(Fragment, null, 
        // #3666, avoid reference pollution when reusing vnode
        child.slice());
    }
    else if (typeof child === 'object') {
        // already vnode, this should be the most common since compiled templates
        // always produce all-vnode children arrays
        return cloneIfMounted(child);
    }
    else {
        // strings and numbers
        return createVNode(Text, null, String(child));
    }
}
// optimized normalization for template-compiled render fns
function cloneIfMounted(child) {
    return child.el === null || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
    let type = 0;
    const { shapeFlag } = vnode;
    if (children == null) {
        children = null;
    }
    else if (isArray$2(children)) {
        type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    else if (typeof children === 'object') {
        if (shapeFlag & (1 /* ShapeFlags.ELEMENT */ | 64 /* ShapeFlags.TELEPORT */)) {
            // Normalize slot to plain children for plain element and Teleport
            const slot = children.default;
            if (slot) {
                // _c marker is added by withCtx() indicating this is a compiled slot
                slot._c && (slot._d = false);
                normalizeChildren(vnode, slot());
                slot._c && (slot._d = true);
            }
            return;
        }
        else {
            type = 32 /* ShapeFlags.SLOTS_CHILDREN */;
            const slotFlag = children._;
            if (!slotFlag && !(InternalObjectKey in children)) {
                children._ctx = currentRenderingInstance;
            }
            else if (slotFlag === 3 /* SlotFlags.FORWARDED */ && currentRenderingInstance) {
                // a child component receives forwarded slots from the parent.
                // its slot type is determined by its parent's slot type.
                if (currentRenderingInstance.slots._ === 1 /* SlotFlags.STABLE */) {
                    children._ = 1 /* SlotFlags.STABLE */;
                }
                else {
                    children._ = 2 /* SlotFlags.DYNAMIC */;
                    vnode.patchFlag |= 1024 /* PatchFlags.DYNAMIC_SLOTS */;
                }
            }
        }
    }
    else if (isFunction$1(children)) {
        children = { default: children, _ctx: currentRenderingInstance };
        type = 32 /* ShapeFlags.SLOTS_CHILDREN */;
    }
    else {
        children = String(children);
        // force teleport children to array so it can be moved around
        if (shapeFlag & 64 /* ShapeFlags.TELEPORT */) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
            children = [createTextVNode(children)];
        }
        else {
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
    }
    vnode.children = children;
    vnode.shapeFlag |= type;
}
function mergeProps(...args) {
    const ret = {};
    for (let i = 0; i < args.length; i++) {
        const toMerge = args[i];
        for (const key in toMerge) {
            if (key === 'class') {
                if (ret.class !== toMerge.class) {
                    ret.class = normalizeClass([ret.class, toMerge.class]);
                }
            }
            else if (key === 'style') {
                ret.style = normalizeStyle([ret.style, toMerge.style]);
            }
            else if (isOn(key)) {
                const existing = ret[key];
                const incoming = toMerge[key];
                if (incoming &&
                    existing !== incoming &&
                    !(isArray$2(existing) && existing.includes(incoming))) {
                    ret[key] = existing
                        ? [].concat(existing, incoming)
                        : incoming;
                }
            }
            else if (key !== '') {
                ret[key] = toMerge[key];
            }
        }
    }
    return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
    callWithAsyncErrorHandling(hook, instance, 7 /* ErrorCodes.VNODE_HOOK */, [
        vnode,
        prevVNode
    ]);
}

const emptyAppContext = createAppContext();
let uid$1 = 0;
function createComponentInstance(vnode, parent, suspense) {
    const type = vnode.type;
    // inherit parent app context - or - if root, adopt from root vnode
    const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
    const instance = {
        uid: uid$1++,
        vnode,
        type,
        parent,
        appContext,
        root: null,
        next: null,
        subTree: null,
        effect: null,
        update: null,
        scope: new EffectScope(true /* detached */),
        render: null,
        proxy: null,
        exposed: null,
        exposeProxy: null,
        withProxy: null,
        provides: parent ? parent.provides : Object.create(appContext.provides),
        accessCache: null,
        renderCache: [],
        // local resolved assets
        components: null,
        directives: null,
        // resolved props and emits options
        propsOptions: normalizePropsOptions(type, appContext),
        emitsOptions: normalizeEmitsOptions(type, appContext),
        // emit
        emit: null,
        emitted: null,
        // props default value
        propsDefaults: EMPTY_OBJ,
        // inheritAttrs
        inheritAttrs: type.inheritAttrs,
        // state
        ctx: EMPTY_OBJ,
        data: EMPTY_OBJ,
        props: EMPTY_OBJ,
        attrs: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        refs: EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        setupContext: null,
        // suspense related
        suspense,
        suspenseId: suspense ? suspense.pendingId : 0,
        asyncDep: null,
        asyncResolved: false,
        // lifecycle hooks
        // not using enums here because it results in computed properties
        isMounted: false,
        isUnmounted: false,
        isDeactivated: false,
        bc: null,
        c: null,
        bm: null,
        m: null,
        bu: null,
        u: null,
        um: null,
        bum: null,
        da: null,
        a: null,
        rtg: null,
        rtc: null,
        ec: null,
        sp: null
    };
    {
        instance.ctx = { _: instance };
    }
    instance.root = parent ? parent.root : instance;
    instance.emit = emit$1$1.bind(null, instance);
    // apply custom element special handling
    if (vnode.ce) {
        vnode.ce(instance);
    }
    return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
const setCurrentInstance = (instance) => {
    currentInstance = instance;
    instance.scope.on();
};
const unsetCurrentInstance = () => {
    currentInstance && currentInstance.scope.off();
    currentInstance = null;
};
function isStatefulComponent(instance) {
    return instance.vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false) {
    isInSSRComponentSetup = isSSR;
    const { props, children } = instance.vnode;
    const isStateful = isStatefulComponent(instance);
    initProps(instance, props, isStateful, isSSR);
    initSlots(instance, children);
    const setupResult = isStateful
        ? setupStatefulComponent(instance, isSSR)
        : undefined;
    isInSSRComponentSetup = false;
    return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
    const Component = instance.type;
    // 0. create render proxy property access cache
    instance.accessCache = Object.create(null);
    // 1. create public instance / render proxy
    // also mark it raw so it's never observed
    instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));
    // 2. call setup()
    const { setup } = Component;
    if (setup) {
        const setupContext = (instance.setupContext =
            setup.length > 1 ? createSetupContext(instance) : null);
        setCurrentInstance(instance);
        pauseTracking();
        const setupResult = callWithErrorHandling(setup, instance, 0 /* ErrorCodes.SETUP_FUNCTION */, [instance.props, setupContext]);
        resetTracking();
        unsetCurrentInstance();
        if (isPromise(setupResult)) {
            setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
            if (isSSR) {
                // return the promise so server-renderer can wait on it
                return setupResult
                    .then((resolvedResult) => {
                    handleSetupResult(instance, resolvedResult, isSSR);
                })
                    .catch(e => {
                    handleError(e, instance, 0 /* ErrorCodes.SETUP_FUNCTION */);
                });
            }
            else {
                // async setup returned Promise.
                // bail here and wait for re-entry.
                instance.asyncDep = setupResult;
            }
        }
        else {
            handleSetupResult(instance, setupResult, isSSR);
        }
    }
    else {
        finishComponentSetup(instance, isSSR);
    }
}
function handleSetupResult(instance, setupResult, isSSR) {
    if (isFunction$1(setupResult)) {
        // setup returned an inline render function
        if (instance.type.__ssrInlineRender) {
            // when the function's name is `ssrRender` (compiled by SFC inline mode),
            // set it as ssrRender instead.
            instance.ssrRender = setupResult;
        }
        else {
            instance.render = setupResult;
        }
    }
    else if (isObject$1(setupResult)) {
        // setup returned bindings.
        // assuming a render function compiled from template is present.
        if (__VUE_PROD_DEVTOOLS__) {
            instance.devtoolsRawSetupState = setupResult;
        }
        instance.setupState = proxyRefs(setupResult);
    }
    else ;
    finishComponentSetup(instance, isSSR);
}
let compile$1;
let installWithProxy;
/**
 * For runtime-dom to register the compiler.
 * Note the exported method uses any to avoid d.ts relying on the compiler types.
 */
function registerRuntimeCompiler(_compile) {
    compile$1 = _compile;
    installWithProxy = i => {
        if (i.render._rc) {
            i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
        }
    };
}
// dev only
const isRuntimeOnly = () => !compile$1;
function finishComponentSetup(instance, isSSR, skipOptions) {
    const Component = instance.type;
    // template / render function normalization
    // could be already set when returned from setup()
    if (!instance.render) {
        // only do on-the-fly compile if not in SSR - SSR on-the-fly compilation
        // is done by server-renderer
        if (!isSSR && compile$1 && !Component.render) {
            const template = Component.template;
            if (template) {
                const { isCustomElement, compilerOptions } = instance.appContext.config;
                const { delimiters, compilerOptions: componentCompilerOptions } = Component;
                const finalCompilerOptions = extend(extend({
                    isCustomElement,
                    delimiters
                }, compilerOptions), componentCompilerOptions);
                Component.render = compile$1(template, finalCompilerOptions);
            }
        }
        instance.render = (Component.render || NOOP);
        // for runtime-compiled render functions using `with` blocks, the render
        // proxy used needs a different `has` handler which is more performant and
        // also only allows a whitelist of globals to fallthrough.
        if (installWithProxy) {
            installWithProxy(instance);
        }
    }
    // support for 2.x options
    if (__VUE_OPTIONS_API__ && !(false )) {
        setCurrentInstance(instance);
        pauseTracking();
        applyOptions(instance);
        resetTracking();
        unsetCurrentInstance();
    }
}
function createAttrsProxy(instance) {
    return new Proxy(instance.attrs, {
            get(target, key) {
                track(instance, "get" /* TrackOpTypes.GET */, '$attrs');
                return target[key];
            }
        });
}
function createSetupContext(instance) {
    const expose = exposed => {
        instance.exposed = exposed || {};
    };
    let attrs;
    {
        return {
            get attrs() {
                return attrs || (attrs = createAttrsProxy(instance));
            },
            slots: instance.slots,
            emit: instance.emit,
            expose
        };
    }
}
function getExposeProxy(instance) {
    if (instance.exposed) {
        return (instance.exposeProxy ||
            (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
                get(target, key) {
                    if (key in target) {
                        return target[key];
                    }
                    else if (key in publicPropertiesMap) {
                        return publicPropertiesMap[key](instance);
                    }
                }
            })));
    }
}
const classifyRE = /(?:^|[-_])(\w)/g;
const classify = (str) => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');
function getComponentName(Component, includeInferred = true) {
    return isFunction$1(Component)
        ? Component.displayName || Component.name
        : Component.name || (includeInferred && Component.__name);
}
/* istanbul ignore next */
function formatComponentName(instance, Component, isRoot = false) {
    let name = getComponentName(Component);
    if (!name && Component.__file) {
        const match = Component.__file.match(/([^/\\]+)\.\w+$/);
        if (match) {
            name = match[1];
        }
    }
    if (!name && instance && instance.parent) {
        // try to infer the name based on reverse resolution
        const inferFromRegistry = (registry) => {
            for (const key in registry) {
                if (registry[key] === Component) {
                    return key;
                }
            }
        };
        name =
            inferFromRegistry(instance.components ||
                instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
    }
    return name ? classify(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
    return isFunction$1(value) && '__vccOpts' in value;
}

const computed = ((getterOrOptions, debugOptions) => {
    // @ts-ignore
    return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
});
// implementation
function defineProps() {
    return null;
}
// implementation
function defineEmits() {
    return null;
}
/**
 * Vue `<script setup>` compiler macro for declaring a component's exposed
 * instance properties when it is accessed by a parent component via template
 * refs.
 *
 * `<script setup>` components are closed by default - i.e. variables inside
 * the `<script setup>` scope is not exposed to parent unless explicitly exposed
 * via `defineExpose`.
 *
 * This is only usable inside `<script setup>`, is compiled away in the
 * output and should **not** be actually called at runtime.
 */
function defineExpose(exposed) {
}
/**
 * Vue `<script setup>` compiler macro for providing props default values when
 * using type-based `defineProps` declaration.
 *
 * Example usage:
 * ```ts
 * withDefaults(defineProps<{
 *   size?: number
 *   labels?: string[]
 * }>(), {
 *   size: 3,
 *   labels: () => ['default label']
 * })
 * ```
 *
 * This is only usable inside `<script setup>`, is compiled away in the output
 * and should **not** be actually called at runtime.
 */
function withDefaults(props, defaults) {
    return null;
}
function useSlots() {
    return getContext().slots;
}
function useAttrs() {
    return getContext().attrs;
}
function getContext() {
    const i = getCurrentInstance();
    return i.setupContext || (i.setupContext = createSetupContext(i));
}
/**
 * Runtime helper for merging default declarations. Imported by compiled code
 * only.
 * @internal
 */
function mergeDefaults(raw, defaults) {
    const props = isArray$2(raw)
        ? raw.reduce((normalized, p) => ((normalized[p] = {}), normalized), {})
        : raw;
    for (const key in defaults) {
        const opt = props[key];
        if (opt) {
            if (isArray$2(opt) || isFunction$1(opt)) {
                props[key] = { type: opt, default: defaults[key] };
            }
            else {
                opt.default = defaults[key];
            }
        }
        else if (opt === null) {
            props[key] = { default: defaults[key] };
        }
        else ;
    }
    return props;
}
/**
 * Used to create a proxy for the rest element when destructuring props with
 * defineProps().
 * @internal
 */
function createPropsRestProxy(props, excludedKeys) {
    const ret = {};
    for (const key in props) {
        if (!excludedKeys.includes(key)) {
            Object.defineProperty(ret, key, {
                enumerable: true,
                get: () => props[key]
            });
        }
    }
    return ret;
}
/**
 * `<script setup>` helper for persisting the current instance context over
 * async/await flows.
 *
 * `@vue/compiler-sfc` converts the following:
 *
 * ```ts
 * const x = await foo()
 * ```
 *
 * into:
 *
 * ```ts
 * let __temp, __restore
 * const x = (([__temp, __restore] = withAsyncContext(() => foo())),__temp=await __temp,__restore(),__temp)
 * ```
 * @internal
 */
function withAsyncContext(getAwaitable) {
    const ctx = getCurrentInstance();
    let awaitable = getAwaitable();
    unsetCurrentInstance();
    if (isPromise(awaitable)) {
        awaitable = awaitable.catch(e => {
            setCurrentInstance(ctx);
            throw e;
        });
    }
    return [awaitable, () => setCurrentInstance(ctx)];
}

// Actual implementation
function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l === 2) {
        if (isObject$1(propsOrChildren) && !isArray$2(propsOrChildren)) {
            // single vnode without props
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            // props without children
            return createVNode(type, propsOrChildren);
        }
        else {
            // omit props
            return createVNode(type, null, propsOrChildren);
        }
    }
    else {
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (l === 3 && isVNode(children)) {
            children = [children];
        }
        return createVNode(type, propsOrChildren, children);
    }
}

const ssrContextKey = Symbol(``);
const useSSRContext = () => {
    {
        const ctx = inject(ssrContextKey);
        if (!ctx) {
            warn(`Server rendering context not provided. Make sure to only call ` +
                `useSSRContext() conditionally in the server build.`);
        }
        return ctx;
    }
};

function initCustomFormatter() {
    /* eslint-disable no-restricted-globals */
    {
        return;
    }
}

function withMemo(memo, render, cache, index) {
    const cached = cache[index];
    if (cached && isMemoSame(cached, memo)) {
        return cached;
    }
    const ret = render();
    // shallow clone
    ret.memo = memo.slice();
    return (cache[index] = ret);
}
function isMemoSame(cached, memo) {
    const prev = cached.memo;
    if (prev.length != memo.length) {
        return false;
    }
    for (let i = 0; i < prev.length; i++) {
        if (hasChanged(prev[i], memo[i])) {
            return false;
        }
    }
    // make sure to let parent block track it when returning cached
    if (isBlockTreeEnabled > 0 && currentBlock) {
        currentBlock.push(cached);
    }
    return true;
}

// Core API ------------------------------------------------------------------
const version$1 = "3.2.38";
const _ssrUtils = {
    createComponentInstance,
    setupComponent,
    renderComponentRoot,
    setCurrentRenderingInstance,
    isVNode,
    normalizeVNode
};
/**
 * SSR utils for \@vue/server-renderer. Only exposed in ssr-possible builds.
 * @internal
 */
const ssrUtils = (_ssrUtils );
/**
 * @internal only exposed in compat builds
 */
const resolveFilter = null;
/**
 * @internal only exposed in compat builds.
 */
const compatUtils = (null);

const svgNS = 'http://www.w3.org/2000/svg';
const doc = (typeof document !== 'undefined' ? document : null);
const templateContainer = doc && /*#__PURE__*/ doc.createElement('template');
const nodeOps = {
    insert: (child, parent, anchor) => {
        parent.insertBefore(child, anchor || null);
    },
    remove: child => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    createElement: (tag, isSVG, is, props) => {
        const el = isSVG
            ? doc.createElementNS(svgNS, tag)
            : doc.createElement(tag, is ? { is } : undefined);
        if (tag === 'select' && props && props.multiple != null) {
            el.setAttribute('multiple', props.multiple);
        }
        return el;
    },
    createText: text => doc.createTextNode(text),
    createComment: text => doc.createComment(text),
    setText: (node, text) => {
        node.nodeValue = text;
    },
    setElementText: (el, text) => {
        el.textContent = text;
    },
    parentNode: node => node.parentNode,
    nextSibling: node => node.nextSibling,
    querySelector: selector => doc.querySelector(selector),
    setScopeId(el, id) {
        el.setAttribute(id, '');
    },
    cloneNode(el) {
        const cloned = el.cloneNode(true);
        // #3072
        // - in `patchDOMProp`, we store the actual value in the `el._value` property.
        // - normally, elements using `:value` bindings will not be hoisted, but if
        //   the bound value is a constant, e.g. `:value="true"` - they do get
        //   hoisted.
        // - in production, hoisted nodes are cloned when subsequent inserts, but
        //   cloneNode() does not copy the custom property we attached.
        // - This may need to account for other custom DOM properties we attach to
        //   elements in addition to `_value` in the future.
        if (`_value` in el) {
            cloned._value = el._value;
        }
        return cloned;
    },
    // __UNSAFE__
    // Reason: innerHTML.
    // Static content here can only come from compiled templates.
    // As long as the user only uses trusted templates, this is safe.
    insertStaticContent(content, parent, anchor, isSVG, start, end) {
        // <parent> before | first ... last | anchor </parent>
        const before = anchor ? anchor.previousSibling : parent.lastChild;
        // #5308 can only take cached path if:
        // - has a single root node
        // - nextSibling info is still available
        if (start && (start === end || start.nextSibling)) {
            // cached
            while (true) {
                parent.insertBefore(start.cloneNode(true), anchor);
                if (start === end || !(start = start.nextSibling))
                    break;
            }
        }
        else {
            // fresh insert
            templateContainer.innerHTML = isSVG ? `<svg>${content}</svg>` : content;
            const template = templateContainer.content;
            if (isSVG) {
                // remove outer svg wrapper
                const wrapper = template.firstChild;
                while (wrapper.firstChild) {
                    template.appendChild(wrapper.firstChild);
                }
                template.removeChild(wrapper);
            }
            parent.insertBefore(template, anchor);
        }
        return [
            // first
            before ? before.nextSibling : parent.firstChild,
            // last
            anchor ? anchor.previousSibling : parent.lastChild
        ];
    }
};

// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
function patchClass(el, value, isSVG) {
    // directly setting className should be faster than setAttribute in theory
    // if this is an element during a transition, take the temporary transition
    // classes into account.
    const transitionClasses = el._vtc;
    if (transitionClasses) {
        value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(' ');
    }
    if (value == null) {
        el.removeAttribute('class');
    }
    else if (isSVG) {
        el.setAttribute('class', value);
    }
    else {
        el.className = value;
    }
}

function patchStyle(el, prev, next) {
    const style = el.style;
    const isCssString = isString$1(next);
    if (next && !isCssString) {
        for (const key in next) {
            setStyle(style, key, next[key]);
        }
        if (prev && !isString$1(prev)) {
            for (const key in prev) {
                if (next[key] == null) {
                    setStyle(style, key, '');
                }
            }
        }
    }
    else {
        const currentDisplay = style.display;
        if (isCssString) {
            if (prev !== next) {
                style.cssText = next;
            }
        }
        else if (prev) {
            el.removeAttribute('style');
        }
        // indicates that the `display` of the element is controlled by `v-show`,
        // so we always keep the current `display` value regardless of the `style`
        // value, thus handing over control to `v-show`.
        if ('_vod' in el) {
            style.display = currentDisplay;
        }
    }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
    if (isArray$2(val)) {
        val.forEach(v => setStyle(style, name, v));
    }
    else {
        if (val == null)
            val = '';
        if (name.startsWith('--')) {
            // custom property definition
            style.setProperty(name, val);
        }
        else {
            const prefixed = autoPrefix(style, name);
            if (importantRE.test(val)) {
                // !important
                style.setProperty(hyphenate(prefixed), val.replace(importantRE, ''), 'important');
            }
            else {
                style[prefixed] = val;
            }
        }
    }
}
const prefixes = ['Webkit', 'Moz', 'ms'];
const prefixCache = {};
function autoPrefix(style, rawName) {
    const cached = prefixCache[rawName];
    if (cached) {
        return cached;
    }
    let name = camelize(rawName);
    if (name !== 'filter' && name in style) {
        return (prefixCache[rawName] = name);
    }
    name = capitalize(name);
    for (let i = 0; i < prefixes.length; i++) {
        const prefixed = prefixes[i] + name;
        if (prefixed in style) {
            return (prefixCache[rawName] = prefixed);
        }
    }
    return rawName;
}

const xlinkNS = 'http://www.w3.org/1999/xlink';
function patchAttr(el, key, value, isSVG, instance) {
    if (isSVG && key.startsWith('xlink:')) {
        if (value == null) {
            el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
        }
        else {
            el.setAttributeNS(xlinkNS, key, value);
        }
    }
    else {
        // note we are only checking boolean attributes that don't have a
        // corresponding dom prop of the same name here.
        const isBoolean = isSpecialBooleanAttr(key);
        if (value == null || (isBoolean && !includeBooleanAttr(value))) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, isBoolean ? '' : value);
        }
    }
}

// __UNSAFE__
// functions. The user is responsible for using them with only trusted content.
function patchDOMProp(el, key, value, 
// the following args are passed only due to potential innerHTML/textContent
// overriding existing VNodes, in which case the old tree must be properly
// unmounted.
prevChildren, parentComponent, parentSuspense, unmountChildren) {
    if (key === 'innerHTML' || key === 'textContent') {
        if (prevChildren) {
            unmountChildren(prevChildren, parentComponent, parentSuspense);
        }
        el[key] = value == null ? '' : value;
        return;
    }
    if (key === 'value' &&
        el.tagName !== 'PROGRESS' &&
        // custom elements may use _value internally
        !el.tagName.includes('-')) {
        // store value as _value as well since
        // non-string values will be stringified.
        el._value = value;
        const newValue = value == null ? '' : value;
        if (el.value !== newValue ||
            // #4956: always set for OPTION elements because its value falls back to
            // textContent if no value attribute is present. And setting .value for
            // OPTION has no side effect
            el.tagName === 'OPTION') {
            el.value = newValue;
        }
        if (value == null) {
            el.removeAttribute(key);
        }
        return;
    }
    let needRemove = false;
    if (value === '' || value == null) {
        const type = typeof el[key];
        if (type === 'boolean') {
            // e.g. <select multiple> compiles to { multiple: '' }
            value = includeBooleanAttr(value);
        }
        else if (value == null && type === 'string') {
            // e.g. <div :id="null">
            value = '';
            needRemove = true;
        }
        else if (type === 'number') {
            // e.g. <img :width="null">
            // the value of some IDL attr must be greater than 0, e.g. input.size = 0 -> error
            value = 0;
            needRemove = true;
        }
    }
    // some properties perform value validation and throw,
    // some properties has getter, no setter, will error in 'use strict'
    // eg. <select :type="null"></select> <select :willValidate="null"></select>
    try {
        el[key] = value;
    }
    catch (e) {
    }
    needRemove && el.removeAttribute(key);
}

// Async edge case fix requires storing an event listener's attach timestamp.
const [_getNow, skipTimestampCheck] = /*#__PURE__*/ (() => {
    let _getNow = Date.now;
    let skipTimestampCheck = false;
    if (typeof window !== 'undefined') {
        // Determine what event timestamp the browser is using. Annoyingly, the
        // timestamp can either be hi-res (relative to page load) or low-res
        // (relative to UNIX epoch), so in order to compare time we have to use the
        // same timestamp type when saving the flush timestamp.
        if (Date.now() > document.createEvent('Event').timeStamp) {
            // if the low-res timestamp which is bigger than the event timestamp
            // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
            // and we need to use the hi-res version for event listeners as well.
            _getNow = performance.now.bind(performance);
        }
        // #3485: Firefox <= 53 has incorrect Event.timeStamp implementation
        // and does not fire microtasks in between event propagation, so safe to exclude.
        const ffMatch = navigator.userAgent.match(/firefox\/(\d+)/i);
        skipTimestampCheck = !!(ffMatch && Number(ffMatch[1]) <= 53);
    }
    return [_getNow, skipTimestampCheck];
})();
// To avoid the overhead of repeatedly calling performance.now(), we cache
// and use the same timestamp for all event listeners attached in the same tick.
let cachedNow = 0;
const p = /*#__PURE__*/ Promise.resolve();
const reset = () => {
    cachedNow = 0;
};
const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()));
function addEventListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
    el.removeEventListener(event, handler, options);
}
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
    // vei = vue event invokers
    const invokers = el._vei || (el._vei = {});
    const existingInvoker = invokers[rawName];
    if (nextValue && existingInvoker) {
        // patch
        existingInvoker.value = nextValue;
    }
    else {
        const [name, options] = parseName(rawName);
        if (nextValue) {
            // add
            const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
            addEventListener(el, name, invoker, options);
        }
        else if (existingInvoker) {
            // remove
            removeEventListener(el, name, existingInvoker, options);
            invokers[rawName] = undefined;
        }
    }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
    let options;
    if (optionsModifierRE.test(name)) {
        options = {};
        let m;
        while ((m = name.match(optionsModifierRE))) {
            name = name.slice(0, name.length - m[0].length);
            options[m[0].toLowerCase()] = true;
        }
    }
    const event = name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2));
    return [event, options];
}
function createInvoker(initialValue, instance) {
    const invoker = (e) => {
        // async edge case #6566: inner click event triggers patch, event handler
        // attached to outer element during patch, and triggered again. This
        // happens because browsers fire microtask ticks between event propagation.
        // the solution is simple: we save the timestamp when a handler is attached,
        // and the handler would only fire if the event passed to it was fired
        // AFTER it was attached.
        const timeStamp = e.timeStamp || _getNow();
        if (skipTimestampCheck || timeStamp >= invoker.attached - 1) {
            callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5 /* ErrorCodes.NATIVE_EVENT_HANDLER */, [e]);
        }
    };
    invoker.value = initialValue;
    invoker.attached = getNow();
    return invoker;
}
function patchStopImmediatePropagation(e, value) {
    if (isArray$2(value)) {
        const originalStop = e.stopImmediatePropagation;
        e.stopImmediatePropagation = () => {
            originalStop.call(e);
            e._stopped = true;
        };
        return value.map(fn => (e) => !e._stopped && fn && fn(e));
    }
    else {
        return value;
    }
}

const nativeOnRE = /^on[a-z]/;
const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
    if (key === 'class') {
        patchClass(el, nextValue, isSVG);
    }
    else if (key === 'style') {
        patchStyle(el, prevValue, nextValue);
    }
    else if (isOn(key)) {
        // ignore v-model listeners
        if (!isModelListener(key)) {
            patchEvent(el, key, prevValue, nextValue, parentComponent);
        }
    }
    else if (key[0] === '.'
        ? ((key = key.slice(1)), true)
        : key[0] === '^'
            ? ((key = key.slice(1)), false)
            : shouldSetAsProp(el, key, nextValue, isSVG)) {
        patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
    }
    else {
        // special case for <input v-model type="checkbox"> with
        // :true-value & :false-value
        // store value as dom properties since non-string values will be
        // stringified.
        if (key === 'true-value') {
            el._trueValue = nextValue;
        }
        else if (key === 'false-value') {
            el._falseValue = nextValue;
        }
        patchAttr(el, key, nextValue, isSVG);
    }
};
function shouldSetAsProp(el, key, value, isSVG) {
    if (isSVG) {
        // most keys must be set as attribute on svg elements to work
        // ...except innerHTML & textContent
        if (key === 'innerHTML' || key === 'textContent') {
            return true;
        }
        // or native onclick with function values
        if (key in el && nativeOnRE.test(key) && isFunction$1(value)) {
            return true;
        }
        return false;
    }
    // these are enumerated attrs, however their corresponding DOM properties
    // are actually booleans - this leads to setting it with a string "false"
    // value leading it to be coerced to `true`, so we need to always treat
    // them as attributes.
    // Note that `contentEditable` doesn't have this problem: its DOM
    // property is also enumerated string values.
    if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
        return false;
    }
    // #1787, #2840 form property on form elements is readonly and must be set as
    // attribute.
    if (key === 'form') {
        return false;
    }
    // #1526 <input list> must be set as attribute
    if (key === 'list' && el.tagName === 'INPUT') {
        return false;
    }
    // #2766 <textarea type> must be set as attribute
    if (key === 'type' && el.tagName === 'TEXTAREA') {
        return false;
    }
    // native onclick with string value, must be set as attribute
    if (nativeOnRE.test(key) && isString$1(value)) {
        return false;
    }
    return key in el;
}

function defineCustomElement(options, hydrate) {
    const Comp = defineComponent(options);
    class VueCustomElement extends VueElement {
        constructor(initialProps) {
            super(Comp, initialProps, hydrate);
        }
    }
    VueCustomElement.def = Comp;
    return VueCustomElement;
}
const defineSSRCustomElement = ((options) => {
    // @ts-ignore
    return defineCustomElement(options, hydrate);
});
const BaseClass = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {
});
class VueElement extends BaseClass {
    constructor(_def, _props = {}, hydrate) {
        super();
        this._def = _def;
        this._props = _props;
        /**
         * @internal
         */
        this._instance = null;
        this._connected = false;
        this._resolved = false;
        this._numberProps = null;
        if (this.shadowRoot && hydrate) {
            hydrate(this._createVNode(), this.shadowRoot);
        }
        else {
            this.attachShadow({ mode: 'open' });
        }
    }
    connectedCallback() {
        this._connected = true;
        if (!this._instance) {
            this._resolveDef();
        }
    }
    disconnectedCallback() {
        this._connected = false;
        nextTick$1(() => {
            if (!this._connected) {
                render(null, this.shadowRoot);
                this._instance = null;
            }
        });
    }
    /**
     * resolve inner component definition (handle possible async component)
     */
    _resolveDef() {
        if (this._resolved) {
            return;
        }
        this._resolved = true;
        // set initial attrs
        for (let i = 0; i < this.attributes.length; i++) {
            this._setAttr(this.attributes[i].name);
        }
        // watch future attr changes
        new MutationObserver(mutations => {
            for (const m of mutations) {
                this._setAttr(m.attributeName);
            }
        }).observe(this, { attributes: true });
        const resolve = (def) => {
            const { props, styles } = def;
            const hasOptions = !isArray$2(props);
            const rawKeys = props ? (hasOptions ? Object.keys(props) : props) : [];
            // cast Number-type props set before resolve
            let numberProps;
            if (hasOptions) {
                for (const key in this._props) {
                    const opt = props[key];
                    if (opt === Number || (opt && opt.type === Number)) {
                        this._props[key] = toNumber(this._props[key]);
                        (numberProps || (numberProps = Object.create(null)))[key] = true;
                    }
                }
            }
            this._numberProps = numberProps;
            // check if there are props set pre-upgrade or connect
            for (const key of Object.keys(this)) {
                if (key[0] !== '_') {
                    this._setProp(key, this[key], true, false);
                }
            }
            // defining getter/setters on prototype
            for (const key of rawKeys.map(camelize)) {
                Object.defineProperty(this, key, {
                    get() {
                        return this._getProp(key);
                    },
                    set(val) {
                        this._setProp(key, val);
                    }
                });
            }
            // apply CSS
            this._applyStyles(styles);
            // initial render
            this._update();
        };
        const asyncDef = this._def.__asyncLoader;
        if (asyncDef) {
            asyncDef().then(resolve);
        }
        else {
            resolve(this._def);
        }
    }
    _setAttr(key) {
        let value = this.getAttribute(key);
        if (this._numberProps && this._numberProps[key]) {
            value = toNumber(value);
        }
        this._setProp(camelize(key), value, false);
    }
    /**
     * @internal
     */
    _getProp(key) {
        return this._props[key];
    }
    /**
     * @internal
     */
    _setProp(key, val, shouldReflect = true, shouldUpdate = true) {
        if (val !== this._props[key]) {
            this._props[key] = val;
            if (shouldUpdate && this._instance) {
                this._update();
            }
            // reflect
            if (shouldReflect) {
                if (val === true) {
                    this.setAttribute(hyphenate(key), '');
                }
                else if (typeof val === 'string' || typeof val === 'number') {
                    this.setAttribute(hyphenate(key), val + '');
                }
                else if (!val) {
                    this.removeAttribute(hyphenate(key));
                }
            }
        }
    }
    _update() {
        render(this._createVNode(), this.shadowRoot);
    }
    _createVNode() {
        const vnode = createVNode(this._def, extend({}, this._props));
        if (!this._instance) {
            vnode.ce = instance => {
                this._instance = instance;
                instance.isCE = true;
                // intercept emit
                instance.emit = (event, ...args) => {
                    this.dispatchEvent(new CustomEvent(event, {
                        detail: args
                    }));
                };
                // locate nearest Vue custom element parent for provide/inject
                let parent = this;
                while ((parent =
                    parent && (parent.parentNode || parent.host))) {
                    if (parent instanceof VueElement) {
                        instance.parent = parent._instance;
                        break;
                    }
                }
            };
        }
        return vnode;
    }
    _applyStyles(styles) {
        if (styles) {
            styles.forEach(css => {
                const s = document.createElement('style');
                s.textContent = css;
                this.shadowRoot.appendChild(s);
            });
        }
    }
}

function useCssModule(name = '$style') {
    /* istanbul ignore else */
    {
        const instance = getCurrentInstance();
        if (!instance) {
            return EMPTY_OBJ;
        }
        const modules = instance.type.__cssModules;
        if (!modules) {
            return EMPTY_OBJ;
        }
        const mod = modules[name];
        if (!mod) {
            return EMPTY_OBJ;
        }
        return mod;
    }
}

/**
 * Runtime helper for SFC's CSS variable injection feature.
 * @private
 */
function useCssVars(getter) {
    const instance = getCurrentInstance();
    /* istanbul ignore next */
    if (!instance) {
        return;
    }
    const setVars = () => setVarsOnVNode(instance.subTree, getter(instance.proxy));
    watchPostEffect(setVars);
    onMounted(() => {
        const ob = new MutationObserver(setVars);
        ob.observe(instance.subTree.el.parentNode, { childList: true });
        onUnmounted(() => ob.disconnect());
    });
}
function setVarsOnVNode(vnode, vars) {
    if (vnode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
        const suspense = vnode.suspense;
        vnode = suspense.activeBranch;
        if (suspense.pendingBranch && !suspense.isHydrating) {
            suspense.effects.push(() => {
                setVarsOnVNode(suspense.activeBranch, vars);
            });
        }
    }
    // drill down HOCs until it's a non-component vnode
    while (vnode.component) {
        vnode = vnode.component.subTree;
    }
    if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */ && vnode.el) {
        setVarsOnNode(vnode.el, vars);
    }
    else if (vnode.type === Fragment) {
        vnode.children.forEach(c => setVarsOnVNode(c, vars));
    }
    else if (vnode.type === Static) {
        let { el, anchor } = vnode;
        while (el) {
            setVarsOnNode(el, vars);
            if (el === anchor)
                break;
            el = el.nextSibling;
        }
    }
}
function setVarsOnNode(el, vars) {
    if (el.nodeType === 1) {
        const style = el.style;
        for (const key in vars) {
            style.setProperty(`--${key}`, vars[key]);
        }
    }
}

const TRANSITION = 'transition';
const ANIMATION = 'animation';
// DOM Transition is a higher-order-component based on the platform-agnostic
// base Transition component, with DOM-specific logic.
const Transition = (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots);
Transition.displayName = 'Transition';
const DOMTransitionPropsValidators = {
    name: String,
    type: String,
    css: {
        type: Boolean,
        default: true
    },
    duration: [String, Number, Object],
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    appearFromClass: String,
    appearActiveClass: String,
    appearToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String
};
const TransitionPropsValidators = (Transition.props =
    /*#__PURE__*/ extend({}, BaseTransition.props, DOMTransitionPropsValidators));
/**
 * #3227 Incoming hooks may be merged into arrays when wrapping Transition
 * with custom HOCs.
 */
const callHook = (hook, args = []) => {
    if (isArray$2(hook)) {
        hook.forEach(h => h(...args));
    }
    else if (hook) {
        hook(...args);
    }
};
/**
 * Check if a hook expects a callback (2nd arg), which means the user
 * intends to explicitly control the end of the transition.
 */
const hasExplicitCallback = (hook) => {
    return hook
        ? isArray$2(hook)
            ? hook.some(h => h.length > 1)
            : hook.length > 1
        : false;
};
function resolveTransitionProps(rawProps) {
    const baseProps = {};
    for (const key in rawProps) {
        if (!(key in DOMTransitionPropsValidators)) {
            baseProps[key] = rawProps[key];
        }
    }
    if (rawProps.css === false) {
        return baseProps;
    }
    const { name = 'v', type, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to` } = rawProps;
    const durations = normalizeDuration(duration);
    const enterDuration = durations && durations[0];
    const leaveDuration = durations && durations[1];
    const { onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled } = baseProps;
    const finishEnter = (el, isAppear, done) => {
        removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
        removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
        done && done();
    };
    const finishLeave = (el, done) => {
        el._isLeaving = false;
        removeTransitionClass(el, leaveFromClass);
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
        done && done();
    };
    const makeEnterHook = (isAppear) => {
        return (el, done) => {
            const hook = isAppear ? onAppear : onEnter;
            const resolve = () => finishEnter(el, isAppear, done);
            callHook(hook, [el, resolve]);
            nextFrame(() => {
                removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
                addTransitionClass(el, isAppear ? appearToClass : enterToClass);
                if (!hasExplicitCallback(hook)) {
                    whenTransitionEnds(el, type, enterDuration, resolve);
                }
            });
        };
    };
    return extend(baseProps, {
        onBeforeEnter(el) {
            callHook(onBeforeEnter, [el]);
            addTransitionClass(el, enterFromClass);
            addTransitionClass(el, enterActiveClass);
        },
        onBeforeAppear(el) {
            callHook(onBeforeAppear, [el]);
            addTransitionClass(el, appearFromClass);
            addTransitionClass(el, appearActiveClass);
        },
        onEnter: makeEnterHook(false),
        onAppear: makeEnterHook(true),
        onLeave(el, done) {
            el._isLeaving = true;
            const resolve = () => finishLeave(el, done);
            addTransitionClass(el, leaveFromClass);
            // force reflow so *-leave-from classes immediately take effect (#2593)
            forceReflow();
            addTransitionClass(el, leaveActiveClass);
            nextFrame(() => {
                if (!el._isLeaving) {
                    // cancelled
                    return;
                }
                removeTransitionClass(el, leaveFromClass);
                addTransitionClass(el, leaveToClass);
                if (!hasExplicitCallback(onLeave)) {
                    whenTransitionEnds(el, type, leaveDuration, resolve);
                }
            });
            callHook(onLeave, [el, resolve]);
        },
        onEnterCancelled(el) {
            finishEnter(el, false);
            callHook(onEnterCancelled, [el]);
        },
        onAppearCancelled(el) {
            finishEnter(el, true);
            callHook(onAppearCancelled, [el]);
        },
        onLeaveCancelled(el) {
            finishLeave(el);
            callHook(onLeaveCancelled, [el]);
        }
    });
}
function normalizeDuration(duration) {
    if (duration == null) {
        return null;
    }
    else if (isObject$1(duration)) {
        return [NumberOf(duration.enter), NumberOf(duration.leave)];
    }
    else {
        const n = NumberOf(duration);
        return [n, n];
    }
}
function NumberOf(val) {
    const res = toNumber(val);
    return res;
}
function addTransitionClass(el, cls) {
    cls.split(/\s+/).forEach(c => c && el.classList.add(c));
    (el._vtc ||
        (el._vtc = new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
    cls.split(/\s+/).forEach(c => c && el.classList.remove(c));
    const { _vtc } = el;
    if (_vtc) {
        _vtc.delete(cls);
        if (!_vtc.size) {
            el._vtc = undefined;
        }
    }
}
function nextFrame(cb) {
    requestAnimationFrame(() => {
        requestAnimationFrame(cb);
    });
}
let endId = 0;
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
    const id = (el._endId = ++endId);
    const resolveIfNotStale = () => {
        if (id === el._endId) {
            resolve();
        }
    };
    if (explicitTimeout) {
        return setTimeout(resolveIfNotStale, explicitTimeout);
    }
    const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
    if (!type) {
        return resolve();
    }
    const endEvent = type + 'end';
    let ended = 0;
    const end = () => {
        el.removeEventListener(endEvent, onEnd);
        resolveIfNotStale();
    };
    const onEnd = (e) => {
        if (e.target === el && ++ended >= propCount) {
            end();
        }
    };
    setTimeout(() => {
        if (ended < propCount) {
            end();
        }
    }, timeout + 1);
    el.addEventListener(endEvent, onEnd);
}
function getTransitionInfo(el, expectedType) {
    const styles = window.getComputedStyle(el);
    // JSDOM may return undefined for transition properties
    const getStyleProperties = (key) => (styles[key] || '').split(', ');
    const transitionDelays = getStyleProperties(TRANSITION + 'Delay');
    const transitionDurations = getStyleProperties(TRANSITION + 'Duration');
    const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    const animationDelays = getStyleProperties(ANIMATION + 'Delay');
    const animationDurations = getStyleProperties(ANIMATION + 'Duration');
    const animationTimeout = getTimeout(animationDelays, animationDurations);
    let type = null;
    let timeout = 0;
    let propCount = 0;
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
        if (transitionTimeout > 0) {
            type = TRANSITION;
            timeout = transitionTimeout;
            propCount = transitionDurations.length;
        }
    }
    else if (expectedType === ANIMATION) {
        if (animationTimeout > 0) {
            type = ANIMATION;
            timeout = animationTimeout;
            propCount = animationDurations.length;
        }
    }
    else {
        timeout = Math.max(transitionTimeout, animationTimeout);
        type =
            timeout > 0
                ? transitionTimeout > animationTimeout
                    ? TRANSITION
                    : ANIMATION
                : null;
        propCount = type
            ? type === TRANSITION
                ? transitionDurations.length
                : animationDurations.length
            : 0;
    }
    const hasTransform = type === TRANSITION &&
        /\b(transform|all)(,|$)/.test(styles[TRANSITION + 'Property']);
    return {
        type,
        timeout,
        propCount,
        hasTransform
    };
}
function getTimeout(delays, durations) {
    while (delays.length < durations.length) {
        delays = delays.concat(delays);
    }
    return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
}
// Old versions of Chromium (below 61.0.3163.100) formats floating pointer
// numbers in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down
// (i.e. acting as a floor function) causing unexpected behaviors
function toMs(s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000;
}
// synchronously force layout to put elements into a certain state
function forceReflow() {
    return document.body.offsetHeight;
}

const positionMap = new WeakMap();
const newPositionMap = new WeakMap();
const TransitionGroupImpl = {
    name: 'TransitionGroup',
    props: /*#__PURE__*/ extend({}, TransitionPropsValidators, {
        tag: String,
        moveClass: String
    }),
    setup(props, { slots }) {
        const instance = getCurrentInstance();
        const state = useTransitionState();
        let prevChildren;
        let children;
        onUpdated(() => {
            // children is guaranteed to exist after initial render
            if (!prevChildren.length) {
                return;
            }
            const moveClass = props.moveClass || `${props.name || 'v'}-move`;
            if (!hasCSSTransform(prevChildren[0].el, instance.vnode.el, moveClass)) {
                return;
            }
            // we divide the work into three loops to avoid mixing DOM reads and writes
            // in each iteration - which helps prevent layout thrashing.
            prevChildren.forEach(callPendingCbs);
            prevChildren.forEach(recordPosition);
            const movedChildren = prevChildren.filter(applyTranslation);
            // force reflow to put everything in position
            forceReflow();
            movedChildren.forEach(c => {
                const el = c.el;
                const style = el.style;
                addTransitionClass(el, moveClass);
                style.transform = style.webkitTransform = style.transitionDuration = '';
                const cb = (el._moveCb = (e) => {
                    if (e && e.target !== el) {
                        return;
                    }
                    if (!e || /transform$/.test(e.propertyName)) {
                        el.removeEventListener('transitionend', cb);
                        el._moveCb = null;
                        removeTransitionClass(el, moveClass);
                    }
                });
                el.addEventListener('transitionend', cb);
            });
        });
        return () => {
            const rawProps = toRaw(props);
            const cssTransitionProps = resolveTransitionProps(rawProps);
            let tag = rawProps.tag || Fragment;
            prevChildren = children;
            children = slots.default ? getTransitionRawChildren(slots.default()) : [];
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.key != null) {
                    setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                }
            }
            if (prevChildren) {
                for (let i = 0; i < prevChildren.length; i++) {
                    const child = prevChildren[i];
                    setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                    positionMap.set(child, child.el.getBoundingClientRect());
                }
            }
            return createVNode(tag, null, children);
        };
    }
};
const TransitionGroup = TransitionGroupImpl;
function callPendingCbs(c) {
    const el = c.el;
    if (el._moveCb) {
        el._moveCb();
    }
    if (el._enterCb) {
        el._enterCb();
    }
}
function recordPosition(c) {
    newPositionMap.set(c, c.el.getBoundingClientRect());
}
function applyTranslation(c) {
    const oldPos = positionMap.get(c);
    const newPos = newPositionMap.get(c);
    const dx = oldPos.left - newPos.left;
    const dy = oldPos.top - newPos.top;
    if (dx || dy) {
        const s = c.el.style;
        s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
        s.transitionDuration = '0s';
        return c;
    }
}
function hasCSSTransform(el, root, moveClass) {
    // Detect whether an element with the move class applied has
    // CSS transitions. Since the element may be inside an entering
    // transition at this very moment, we make a clone of it and remove
    // all other transition classes applied to ensure only the move class
    // is applied.
    const clone = el.cloneNode();
    if (el._vtc) {
        el._vtc.forEach(cls => {
            cls.split(/\s+/).forEach(c => c && clone.classList.remove(c));
        });
    }
    moveClass.split(/\s+/).forEach(c => c && clone.classList.add(c));
    clone.style.display = 'none';
    const container = (root.nodeType === 1 ? root : root.parentNode);
    container.appendChild(clone);
    const { hasTransform } = getTransitionInfo(clone);
    container.removeChild(clone);
    return hasTransform;
}

const getModelAssigner = (vnode) => {
    const fn = vnode.props['onUpdate:modelValue'] ||
        (false );
    return isArray$2(fn) ? value => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
    e.target.composing = true;
}
function onCompositionEnd(e) {
    const target = e.target;
    if (target.composing) {
        target.composing = false;
        target.dispatchEvent(new Event('input'));
    }
}
// We are exporting the v-model runtime directly as vnode hooks so that it can
// be tree-shaken in case v-model is never used.
const vModelText = {
    created(el, { modifiers: { lazy, trim, number } }, vnode) {
        el._assign = getModelAssigner(vnode);
        const castToNumber = number || (vnode.props && vnode.props.type === 'number');
        addEventListener(el, lazy ? 'change' : 'input', e => {
            if (e.target.composing)
                return;
            let domValue = el.value;
            if (trim) {
                domValue = domValue.trim();
            }
            if (castToNumber) {
                domValue = toNumber(domValue);
            }
            el._assign(domValue);
        });
        if (trim) {
            addEventListener(el, 'change', () => {
                el.value = el.value.trim();
            });
        }
        if (!lazy) {
            addEventListener(el, 'compositionstart', onCompositionStart);
            addEventListener(el, 'compositionend', onCompositionEnd);
            // Safari < 10.2 & UIWebView doesn't fire compositionend when
            // switching focus before confirming composition choice
            // this also fixes the issue where some browsers e.g. iOS Chrome
            // fires "change" instead of "input" on autocomplete.
            addEventListener(el, 'change', onCompositionEnd);
        }
    },
    // set value on mounted so it's after min/max for type="range"
    mounted(el, { value }) {
        el.value = value == null ? '' : value;
    },
    beforeUpdate(el, { value, modifiers: { lazy, trim, number } }, vnode) {
        el._assign = getModelAssigner(vnode);
        // avoid clearing unresolved text. #2302
        if (el.composing)
            return;
        if (document.activeElement === el && el.type !== 'range') {
            if (lazy) {
                return;
            }
            if (trim && el.value.trim() === value) {
                return;
            }
            if ((number || el.type === 'number') && toNumber(el.value) === value) {
                return;
            }
        }
        const newValue = value == null ? '' : value;
        if (el.value !== newValue) {
            el.value = newValue;
        }
    }
};
const vModelCheckbox = {
    // #4096 array checkboxes need to be deep traversed
    deep: true,
    created(el, _, vnode) {
        el._assign = getModelAssigner(vnode);
        addEventListener(el, 'change', () => {
            const modelValue = el._modelValue;
            const elementValue = getValue(el);
            const checked = el.checked;
            const assign = el._assign;
            if (isArray$2(modelValue)) {
                const index = looseIndexOf(modelValue, elementValue);
                const found = index !== -1;
                if (checked && !found) {
                    assign(modelValue.concat(elementValue));
                }
                else if (!checked && found) {
                    const filtered = [...modelValue];
                    filtered.splice(index, 1);
                    assign(filtered);
                }
            }
            else if (isSet(modelValue)) {
                const cloned = new Set(modelValue);
                if (checked) {
                    cloned.add(elementValue);
                }
                else {
                    cloned.delete(elementValue);
                }
                assign(cloned);
            }
            else {
                assign(getCheckboxValue(el, checked));
            }
        });
    },
    // set initial checked on mount to wait for true-value/false-value
    mounted: setChecked,
    beforeUpdate(el, binding, vnode) {
        el._assign = getModelAssigner(vnode);
        setChecked(el, binding, vnode);
    }
};
function setChecked(el, { value, oldValue }, vnode) {
    el._modelValue = value;
    if (isArray$2(value)) {
        el.checked = looseIndexOf(value, vnode.props.value) > -1;
    }
    else if (isSet(value)) {
        el.checked = value.has(vnode.props.value);
    }
    else if (value !== oldValue) {
        el.checked = looseEqual(value, getCheckboxValue(el, true));
    }
}
const vModelRadio = {
    created(el, { value }, vnode) {
        el.checked = looseEqual(value, vnode.props.value);
        el._assign = getModelAssigner(vnode);
        addEventListener(el, 'change', () => {
            el._assign(getValue(el));
        });
    },
    beforeUpdate(el, { value, oldValue }, vnode) {
        el._assign = getModelAssigner(vnode);
        if (value !== oldValue) {
            el.checked = looseEqual(value, vnode.props.value);
        }
    }
};
const vModelSelect = {
    // <select multiple> value need to be deep traversed
    deep: true,
    created(el, { value, modifiers: { number } }, vnode) {
        const isSetModel = isSet(value);
        addEventListener(el, 'change', () => {
            const selectedVal = Array.prototype.filter
                .call(el.options, (o) => o.selected)
                .map((o) => number ? toNumber(getValue(o)) : getValue(o));
            el._assign(el.multiple
                ? isSetModel
                    ? new Set(selectedVal)
                    : selectedVal
                : selectedVal[0]);
        });
        el._assign = getModelAssigner(vnode);
    },
    // set value in mounted & updated because <select> relies on its children
    // <option>s.
    mounted(el, { value }) {
        setSelected(el, value);
    },
    beforeUpdate(el, _binding, vnode) {
        el._assign = getModelAssigner(vnode);
    },
    updated(el, { value }) {
        setSelected(el, value);
    }
};
function setSelected(el, value) {
    const isMultiple = el.multiple;
    if (isMultiple && !isArray$2(value) && !isSet(value)) {
        return;
    }
    for (let i = 0, l = el.options.length; i < l; i++) {
        const option = el.options[i];
        const optionValue = getValue(option);
        if (isMultiple) {
            if (isArray$2(value)) {
                option.selected = looseIndexOf(value, optionValue) > -1;
            }
            else {
                option.selected = value.has(optionValue);
            }
        }
        else {
            if (looseEqual(getValue(option), value)) {
                if (el.selectedIndex !== i)
                    el.selectedIndex = i;
                return;
            }
        }
    }
    if (!isMultiple && el.selectedIndex !== -1) {
        el.selectedIndex = -1;
    }
}
// retrieve raw value set via :value bindings
function getValue(el) {
    return '_value' in el ? el._value : el.value;
}
// retrieve raw value for true-value and false-value set via :true-value or :false-value bindings
function getCheckboxValue(el, checked) {
    const key = checked ? '_trueValue' : '_falseValue';
    return key in el ? el[key] : checked;
}
const vModelDynamic = {
    created(el, binding, vnode) {
        callModelHook(el, binding, vnode, null, 'created');
    },
    mounted(el, binding, vnode) {
        callModelHook(el, binding, vnode, null, 'mounted');
    },
    beforeUpdate(el, binding, vnode, prevVNode) {
        callModelHook(el, binding, vnode, prevVNode, 'beforeUpdate');
    },
    updated(el, binding, vnode, prevVNode) {
        callModelHook(el, binding, vnode, prevVNode, 'updated');
    }
};
function resolveDynamicModel(tagName, type) {
    switch (tagName) {
        case 'SELECT':
            return vModelSelect;
        case 'TEXTAREA':
            return vModelText;
        default:
            switch (type) {
                case 'checkbox':
                    return vModelCheckbox;
                case 'radio':
                    return vModelRadio;
                default:
                    return vModelText;
            }
    }
}
function callModelHook(el, binding, vnode, prevVNode, hook) {
    const modelToUse = resolveDynamicModel(el.tagName, vnode.props && vnode.props.type);
    const fn = modelToUse[hook];
    fn && fn(el, binding, vnode, prevVNode);
}
// SSR vnode transforms, only used when user includes client-oriented render
// function in SSR
function initVModelForSSR() {
    vModelText.getSSRProps = ({ value }) => ({ value });
    vModelRadio.getSSRProps = ({ value }, vnode) => {
        if (vnode.props && looseEqual(vnode.props.value, value)) {
            return { checked: true };
        }
    };
    vModelCheckbox.getSSRProps = ({ value }, vnode) => {
        if (isArray$2(value)) {
            if (vnode.props && looseIndexOf(value, vnode.props.value) > -1) {
                return { checked: true };
            }
        }
        else if (isSet(value)) {
            if (vnode.props && value.has(vnode.props.value)) {
                return { checked: true };
            }
        }
        else if (value) {
            return { checked: true };
        }
    };
    vModelDynamic.getSSRProps = (binding, vnode) => {
        if (typeof vnode.type !== 'string') {
            return;
        }
        const modelToUse = resolveDynamicModel(
        // resolveDynamicModel expects an uppercase tag name, but vnode.type is lowercase
        vnode.type.toUpperCase(), vnode.props && vnode.props.type);
        if (modelToUse.getSSRProps) {
            return modelToUse.getSSRProps(binding, vnode);
        }
    };
}

const systemModifiers = ['ctrl', 'shift', 'alt', 'meta'];
const modifierGuards = {
    stop: e => e.stopPropagation(),
    prevent: e => e.preventDefault(),
    self: e => e.target !== e.currentTarget,
    ctrl: e => !e.ctrlKey,
    shift: e => !e.shiftKey,
    alt: e => !e.altKey,
    meta: e => !e.metaKey,
    left: e => 'button' in e && e.button !== 0,
    middle: e => 'button' in e && e.button !== 1,
    right: e => 'button' in e && e.button !== 2,
    exact: (e, modifiers) => systemModifiers.some(m => e[`${m}Key`] && !modifiers.includes(m))
};
/**
 * @private
 */
const withModifiers = (fn, modifiers) => {
    return (event, ...args) => {
        for (let i = 0; i < modifiers.length; i++) {
            const guard = modifierGuards[modifiers[i]];
            if (guard && guard(event, modifiers))
                return;
        }
        return fn(event, ...args);
    };
};
// Kept for 2.x compat.
// Note: IE11 compat for `spacebar` and `del` is removed for now.
const keyNames = {
    esc: 'escape',
    space: ' ',
    up: 'arrow-up',
    left: 'arrow-left',
    right: 'arrow-right',
    down: 'arrow-down',
    delete: 'backspace'
};
/**
 * @private
 */
const withKeys = (fn, modifiers) => {
    return (event) => {
        if (!('key' in event)) {
            return;
        }
        const eventKey = hyphenate(event.key);
        if (modifiers.some(k => k === eventKey || keyNames[k] === eventKey)) {
            return fn(event);
        }
    };
};

const vShow = {
    beforeMount(el, { value }, { transition }) {
        el._vod = el.style.display === 'none' ? '' : el.style.display;
        if (transition && value) {
            transition.beforeEnter(el);
        }
        else {
            setDisplay(el, value);
        }
    },
    mounted(el, { value }, { transition }) {
        if (transition && value) {
            transition.enter(el);
        }
    },
    updated(el, { value, oldValue }, { transition }) {
        if (!value === !oldValue)
            return;
        if (transition) {
            if (value) {
                transition.beforeEnter(el);
                setDisplay(el, true);
                transition.enter(el);
            }
            else {
                transition.leave(el, () => {
                    setDisplay(el, false);
                });
            }
        }
        else {
            setDisplay(el, value);
        }
    },
    beforeUnmount(el, { value }) {
        setDisplay(el, value);
    }
};
function setDisplay(el, value) {
    el.style.display = value ? el._vod : 'none';
}
// SSR vnode transforms, only used when user includes client-oriented render
// function in SSR
function initVShowForSSR() {
    vShow.getSSRProps = ({ value }) => {
        if (!value) {
            return { style: { display: 'none' } };
        }
    };
}

const rendererOptions = /*#__PURE__*/ extend({ patchProp }, nodeOps);
// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer;
let enabledHydration = false;
function ensureRenderer() {
    return (renderer ||
        (renderer = createRenderer(rendererOptions)));
}
function ensureHydrationRenderer() {
    renderer = enabledHydration
        ? renderer
        : createHydrationRenderer(rendererOptions);
    enabledHydration = true;
    return renderer;
}
// use explicit type casts here to avoid import() calls in rolled-up d.ts
const render = ((...args) => {
    ensureRenderer().render(...args);
});
const hydrate = ((...args) => {
    ensureHydrationRenderer().hydrate(...args);
});
const createApp = ((...args) => {
    const app = ensureRenderer().createApp(...args);
    const { mount } = app;
    app.mount = (containerOrSelector) => {
        const container = normalizeContainer(containerOrSelector);
        if (!container)
            return;
        const component = app._component;
        if (!isFunction$1(component) && !component.render && !component.template) {
            // __UNSAFE__
            // Reason: potential execution of JS expressions in in-DOM template.
            // The user must make sure the in-DOM template is trusted. If it's
            // rendered by the server, the template should not contain any user data.
            component.template = container.innerHTML;
        }
        // clear content before mounting
        container.innerHTML = '';
        const proxy = mount(container, false, container instanceof SVGElement);
        if (container instanceof Element) {
            container.removeAttribute('v-cloak');
            container.setAttribute('data-v-app', '');
        }
        return proxy;
    };
    return app;
});
const createSSRApp = ((...args) => {
    const app = ensureHydrationRenderer().createApp(...args);
    const { mount } = app;
    app.mount = (containerOrSelector) => {
        const container = normalizeContainer(containerOrSelector);
        if (container) {
            return mount(container, true, container instanceof SVGElement);
        }
    };
    return app;
});
function normalizeContainer(container) {
    if (isString$1(container)) {
        const res = document.querySelector(container);
        return res;
    }
    return container;
}
let ssrDirectiveInitialized = false;
/**
 * @internal
 */
const initDirectivesForSSR = () => {
        if (!ssrDirectiveInitialized) {
            ssrDirectiveInitialized = true;
            initVModelForSSR();
            initVShowForSSR();
        }
    }
    ;

const compile = () => {
};

const Vue = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            compile,
            EffectScope,
            ReactiveEffect,
            customRef,
            effect,
            effectScope,
            getCurrentScope,
            isProxy,
            isReactive,
            isReadonly,
            isRef,
            isShallow,
            markRaw,
            onScopeDispose,
            proxyRefs,
            reactive,
            readonly,
            ref,
            shallowReactive,
            shallowReadonly,
            shallowRef,
            stop,
            toRaw,
            toRef,
            toRefs,
            triggerRef,
            unref,
            camelize,
            capitalize,
            normalizeClass,
            normalizeProps,
            normalizeStyle,
            toDisplayString,
            toHandlerKey,
            BaseTransition,
            Comment,
            Fragment,
            KeepAlive,
            Static,
            Suspense,
            Teleport,
            Text,
            callWithAsyncErrorHandling,
            callWithErrorHandling,
            cloneVNode,
            compatUtils,
            computed,
            createBlock,
            createCommentVNode,
            createElementBlock,
            createElementVNode: createBaseVNode,
            createHydrationRenderer,
            createPropsRestProxy,
            createRenderer,
            createSlots,
            createStaticVNode,
            createTextVNode,
            createVNode,
            defineAsyncComponent,
            defineComponent,
            defineEmits,
            defineExpose,
            defineProps,
            get devtools () { return devtools; },
            getCurrentInstance,
            getTransitionRawChildren,
            guardReactiveProps,
            h,
            handleError,
            initCustomFormatter,
            inject,
            isMemoSame,
            isRuntimeOnly,
            isVNode,
            mergeDefaults,
            mergeProps,
            nextTick: nextTick$1,
            onActivated,
            onBeforeMount,
            onBeforeUnmount,
            onBeforeUpdate,
            onDeactivated,
            onErrorCaptured,
            onMounted,
            onRenderTracked,
            onRenderTriggered,
            onServerPrefetch,
            onUnmounted,
            onUpdated,
            openBlock,
            popScopeId,
            provide,
            pushScopeId,
            queuePostFlushCb,
            registerRuntimeCompiler,
            renderList,
            renderSlot,
            resolveComponent,
            resolveDirective,
            resolveDynamicComponent,
            resolveFilter,
            resolveTransitionHooks,
            setBlockTracking,
            setDevtoolsHook,
            setTransitionHooks,
            ssrContextKey,
            ssrUtils,
            toHandlers,
            transformVNodeArgs,
            useAttrs,
            useSSRContext,
            useSlots,
            useTransitionState,
            version: version$1,
            warn,
            watch,
            watchEffect,
            watchPostEffect,
            watchSyncEffect,
            withAsyncContext,
            withCtx,
            withDefaults,
            withDirectives,
            withMemo,
            withScopeId,
            Transition,
            TransitionGroup,
            VueElement,
            createApp,
            createSSRApp,
            defineCustomElement,
            defineSSRCustomElement,
            hydrate,
            initDirectivesForSSR,
            render,
            useCssModule,
            useCssVars,
            vModelCheckbox,
            vModelDynamic,
            vModelRadio,
            vModelSelect,
            vModelText,
            vShow,
            withKeys,
            withModifiers
}, Symbol.toStringTag, { value: 'Module' }));

var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup[tmp >> 10];
    output += lookup[(tmp >> 4) & 0x3F];
    output += lookup[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

const isArray$1 = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

var INSPECT_MAX_BYTES$1 = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer$4.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
  ? global$1.TYPED_ARRAY_SUPPORT
  : true;

/*
 * Export kMaxLength after typed array support is determined.
 */
var _kMaxLength$1 = kMaxLength$1();

function kMaxLength$1 () {
  return Buffer$4.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer$1 (that, length) {
  if (kMaxLength$1() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer$4.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer$4(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer$4 (arg, encodingOrOffset, length) {
  if (!Buffer$4.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$4)) {
    return new Buffer$4(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe$1(this, arg)
  }
  return from$1(this, arg, encodingOrOffset, length)
}

Buffer$4.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer$4._augment = function (arr) {
  arr.__proto__ = Buffer$4.prototype;
  return arr
};

function from$1 (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer$1(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString$1(that, value, encodingOrOffset)
  }

  return fromObject$1(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer$4.from = function (value, encodingOrOffset, length) {
  return from$1(null, value, encodingOrOffset, length)
};

if (Buffer$4.TYPED_ARRAY_SUPPORT) {
  Buffer$4.prototype.__proto__ = Uint8Array.prototype;
  Buffer$4.__proto__ = Uint8Array;
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer$4[Symbol.species] === Buffer$4) ;
}

function assertSize$1 (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc$1 (that, size, fill, encoding) {
  assertSize$1(size);
  if (size <= 0) {
    return createBuffer$1(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer$1(that, size).fill(fill, encoding)
      : createBuffer$1(that, size).fill(fill)
  }
  return createBuffer$1(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer$4.alloc = function (size, fill, encoding) {
  return alloc$1(null, size, fill, encoding)
};

function allocUnsafe$1 (that, size) {
  assertSize$1(size);
  that = createBuffer$1(that, size < 0 ? 0 : checked$1(size) | 0);
  if (!Buffer$4.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer$4.allocUnsafe = function (size) {
  return allocUnsafe$1(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer$4.allocUnsafeSlow = function (size) {
  return allocUnsafe$1(null, size)
};

function fromString$1 (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer$4.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength$1(string, encoding) | 0;
  that = createBuffer$1(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike$1 (that, array) {
  var length = array.length < 0 ? 0 : checked$1(array.length) | 0;
  that = createBuffer$1(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer$1 (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer$4.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike$1(that, array);
  }
  return that
}

function fromObject$1 (that, obj) {
  if (internalIsBuffer$1(obj)) {
    var len = checked$1(obj.length) | 0;
    that = createBuffer$1(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan$1(obj.length)) {
        return createBuffer$1(that, 0)
      }
      return fromArrayLike$1(that, obj)
    }

    if (obj.type === 'Buffer' && isArray$1(obj.data)) {
      return fromArrayLike$1(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked$1 (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength$1()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength$1().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer$1 (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0;
  }
  return Buffer$4.alloc(+length)
}
Buffer$4.isBuffer = isBuffer$2;
function internalIsBuffer$1 (b) {
  return !!(b != null && b._isBuffer)
}

Buffer$4.compare = function compare (a, b) {
  if (!internalIsBuffer$1(a) || !internalIsBuffer$1(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer$4.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer$4.concat = function concat (list, length) {
  if (!isArray$1(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer$4.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer$4.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer$1(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength$1 (string, encoding) {
  if (internalIsBuffer$1(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes$1(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes$1(string).length
      default:
        if (loweredCase) return utf8ToBytes$1(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer$4.byteLength = byteLength$1;

function slowToString$1 (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice$1(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice$1(this, start, end)

      case 'ascii':
        return asciiSlice$1(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice$1(this, start, end)

      case 'base64':
        return base64Slice$1(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice$1(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer$4.prototype._isBuffer = true;

function swap$1 (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer$4.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap$1(this, i, i + 1);
  }
  return this
};

Buffer$4.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap$1(this, i, i + 3);
    swap$1(this, i + 1, i + 2);
  }
  return this
};

Buffer$4.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap$1(this, i, i + 7);
    swap$1(this, i + 1, i + 6);
    swap$1(this, i + 2, i + 5);
    swap$1(this, i + 3, i + 4);
  }
  return this
};

Buffer$4.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice$1(this, 0, length)
  return slowToString$1.apply(this, arguments)
};

Buffer$4.prototype.equals = function equals (b) {
  if (!internalIsBuffer$1(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer$4.compare(this, b) === 0
};

Buffer$4.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES$1;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer$4.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer$1(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf$1 (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer$4.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer$1(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf$1(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer$4.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf$1(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf$1 (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer$4.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer$4.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf$1(this, val, byteOffset, encoding, true)
};

Buffer$4.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf$1(this, val, byteOffset, encoding, false)
};

function hexWrite$1 (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write$1 (buf, string, offset, length) {
  return blitBuffer$1(utf8ToBytes$1(string, buf.length - offset), buf, offset, length)
}

function asciiWrite$1 (buf, string, offset, length) {
  return blitBuffer$1(asciiToBytes$1(string), buf, offset, length)
}

function latin1Write$1 (buf, string, offset, length) {
  return asciiWrite$1(buf, string, offset, length)
}

function base64Write$1 (buf, string, offset, length) {
  return blitBuffer$1(base64ToBytes$1(string), buf, offset, length)
}

function ucs2Write$1 (buf, string, offset, length) {
  return blitBuffer$1(utf16leToBytes$1(string, buf.length - offset), buf, offset, length)
}

Buffer$4.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite$1(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write$1(this, string, offset, length)

      case 'ascii':
        return asciiWrite$1(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write$1(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write$1(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write$1(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer$4.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice$1 (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice$1 (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray$1(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH$1 = 0x1000;

function decodeCodePointsArray$1 (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH$1) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH$1)
    );
  }
  return res
}

function asciiSlice$1 (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice$1 (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice$1 (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex$1(buf[i]);
  }
  return out
}

function utf16leSlice$1 (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer$4.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer$4.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer$4(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset$1 (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer$4.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset$1(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer$4.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset$1(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer$4.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 1, this.length);
  return this[offset]
};

Buffer$4.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer$4.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer$4.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer$4.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer$4.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset$1(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$4.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset$1(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$4.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer$4.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$4.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$4.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer$4.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer$4.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer$4.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer$4.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer$4.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset$1(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt$1 (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer$1(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer$4.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt$1(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$4.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt$1(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$4.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 1, 0xff, 0);
  if (!Buffer$4.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16$1 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer$4.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 2, 0xffff, 0);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16$1(this, value, offset, true);
  }
  return offset + 2
};

Buffer$4.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 2, 0xffff, 0);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16$1(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32$1 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer$4.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32$1(this, value, offset, true);
  }
  return offset + 4
};

Buffer$4.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32$1(this, value, offset, false);
  }
  return offset + 4
};

Buffer$4.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt$1(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$4.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt$1(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$4.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer$4.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer$4.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16$1(this, value, offset, true);
  }
  return offset + 2
};

Buffer$4.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16$1(this, value, offset, false);
  }
  return offset + 2
};

Buffer$4.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32$1(this, value, offset, true);
  }
  return offset + 4
};

Buffer$4.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt$1(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer$4.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32$1(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754$1 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat$1 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754$1(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer$4.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat$1(this, value, offset, true, noAssert)
};

Buffer$4.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat$1(this, value, offset, false, noAssert)
};

function writeDouble$1 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754$1(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer$4.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble$1(this, value, offset, true, noAssert)
};

Buffer$4.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble$1(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer$4.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer$4.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer$4.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer$4.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer$1(val)
      ? val
      : utf8ToBytes$1(new Buffer$4(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE$1 = /[^+\/0-9A-Za-z-_]/g;

function base64clean$1 (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim$1(str).replace(INVALID_BASE64_RE$1, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim$1 (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex$1 (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes$1 (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes$1 (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes$1 (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes$1 (str) {
  return toByteArray(base64clean$1(str))
}

function blitBuffer$1 (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan$1 (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer$2(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer$1(obj) || isSlowBuffer$1(obj))
}

function isFastBuffer$1 (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer$1 (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer$1(obj.slice(0, 0))
}

const bufferEs6$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            INSPECT_MAX_BYTES: INSPECT_MAX_BYTES$1,
            kMaxLength: _kMaxLength$1,
            Buffer: Buffer$4,
            SlowBuffer: SlowBuffer$1,
            isBuffer: isBuffer$2
}, Symbol.toStringTag, { value: 'Module' }));

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter$2() {
  EventEmitter$2.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter$2.EventEmitter = EventEmitter$2;

EventEmitter$2.usingDomains = false;

EventEmitter$2.prototype.domain = undefined;
EventEmitter$2.prototype._events = undefined;
EventEmitter$2.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter$2.defaultMaxListeners = 10;

EventEmitter$2.init = function() {
  this.domain = null;
  if (EventEmitter$2.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active ) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter$2.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter$2.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter$2.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter$2.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter$2.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter$2.prototype.on = EventEmitter$2.prototype.addListener;

EventEmitter$2.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter$2.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter$2.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter$2.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter$2.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter$2.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter$2.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount$1.call(emitter, type);
  }
};

EventEmitter$2.prototype.listenerCount = listenerCount$1;
function listenerCount$1(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter$2.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

const events = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            default: EventEmitter$2,
            EventEmitter: EventEmitter$2
}, Symbol.toStringTag, { value: 'Module' }));

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var env = {};
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance$1 = global$1.performance || {};
var performanceNow =
  performance$1.now        ||
  performance$1.mozNow     ||
  performance$1.msNow      ||
  performance$1.oNow       ||
  performance$1.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance$1)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

const process = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

var inherits;
if (typeof Object.create === 'function'){
  inherits = function inherits(ctor, superCtor) {
    // implementation from standard node.js 'util' module
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
const inherits$1 = inherits;

var formatRegExp = /%[sdj%]/g;
function format(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
}

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global$1.process)) {
    return function() {
      return deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

var debugs = {};
var debugEnviron;
function debuglog(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = 0;
      debugs[set] = function() {
        var msg = format.apply(null, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
}

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    if (cur.indexOf('\n') >= 0) ;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isNull(arg) {
  return arg === null;
}

function isNullOrUndefined(arg) {
  return arg == null;
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isSymbol(arg) {
  return typeof arg === 'symbol';
}

function isUndefined(arg) {
  return arg === void 0;
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}

function isBuffer$1(maybeBuf) {
  return isBuffer$2(maybeBuf);
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
function log() {
  console.log('%s - %s', timestamp(), format.apply(null, arguments));
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

const util$2 = {
  inherits: inherits$1,
  _extend: _extend,
  log: log,
  isBuffer: isBuffer$1,
  isPrimitive: isPrimitive,
  isFunction: isFunction,
  isError: isError,
  isDate: isDate,
  isObject: isObject,
  isRegExp: isRegExp,
  isUndefined: isUndefined,
  isSymbol: isSymbol,
  isString: isString,
  isNumber: isNumber,
  isNullOrUndefined: isNullOrUndefined,
  isNull: isNull,
  isBoolean: isBoolean,
  isArray: isArray,
  inspect: inspect,
  deprecate: deprecate,
  format: format,
  debuglog: debuglog
};

const util$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            format,
            deprecate,
            debuglog,
            inspect,
            isArray,
            isBoolean,
            isNull,
            isNullOrUndefined,
            isNumber,
            isString,
            isSymbol,
            isUndefined,
            isRegExp,
            isObject,
            isDate,
            isError,
            isFunction,
            isPrimitive,
            isBuffer: isBuffer$1,
            log,
            inherits: inherits$1,
            _extend,
            default: util$2
}, Symbol.toStringTag, { value: 'Module' }));

var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer$3.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
  ? global$1.TYPED_ARRAY_SUPPORT
  : true;

/*
 * Export kMaxLength after typed array support is determined.
 */
var _kMaxLength = kMaxLength();

function kMaxLength () {
  return Buffer$3.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer$3.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer$3(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer$3 (arg, encodingOrOffset, length) {
  if (!Buffer$3.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$3)) {
    return new Buffer$3(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer$3.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer$3._augment = function (arr) {
  arr.__proto__ = Buffer$3.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer$3.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer$3.TYPED_ARRAY_SUPPORT) {
  Buffer$3.prototype.__proto__ = Uint8Array.prototype;
  Buffer$3.__proto__ = Uint8Array;
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer$3[Symbol.species] === Buffer$3) ;
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer$3.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer$3.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer$3.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer$3.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer$3.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer$3.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray$1(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0;
  }
  return Buffer$3.alloc(+length)
}
Buffer$3.isBuffer = isBuffer;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer$3.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer$3.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer$3.concat = function concat (list, length) {
  if (!isArray$1(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer$3.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer$3.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer$3.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer$3.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer$3.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer$3.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer$3.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer$3.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer$3.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer$3.compare(this, b) === 0
};

Buffer$3.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer$3.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer$3.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer$3.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer$3.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer$3.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer$3.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer$3.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer$3.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer$3.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer$3.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer$3(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer$3.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer$3.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer$3.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer$3.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer$3.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer$3.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer$3.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer$3.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$3.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$3.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer$3.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$3.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$3.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer$3.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer$3.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer$3.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer$3.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer$3.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer$3.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$3.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$3.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer$3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer$3.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$3.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer$3.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$3.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer$3.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$3.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$3.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer$3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer$3.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$3.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer$3.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$3.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer$3.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer$3.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer$3.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer$3.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer$3.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer$3.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer$3.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer$3.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer$3.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer$3(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

const bufferEs6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            INSPECT_MAX_BYTES,
            kMaxLength: _kMaxLength,
            Buffer: Buffer$3,
            SlowBuffer,
            isBuffer
}, Symbol.toStringTag, { value: 'Module' }));

function BufferList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
}

BufferList.prototype.push = function (v) {
  var entry = { data: v, next: null };
  if (this.length > 0) this.tail.next = entry;else this.head = entry;
  this.tail = entry;
  ++this.length;
};

BufferList.prototype.unshift = function (v) {
  var entry = { data: v, next: this.head };
  if (this.length === 0) this.tail = entry;
  this.head = entry;
  ++this.length;
};

BufferList.prototype.shift = function () {
  if (this.length === 0) return;
  var ret = this.head.data;
  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
  --this.length;
  return ret;
};

BufferList.prototype.clear = function () {
  this.head = this.tail = null;
  this.length = 0;
};

BufferList.prototype.join = function (s) {
  if (this.length === 0) return '';
  var p = this.head;
  var ret = '' + p.data;
  while (p = p.next) {
    ret += s + p.data;
  }return ret;
};

BufferList.prototype.concat = function (n) {
  if (this.length === 0) return Buffer$3.alloc(0);
  if (this.length === 1) return this.head.data;
  var ret = Buffer$3.allocUnsafe(n >>> 0);
  var p = this.head;
  var i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};

// Copyright Joyent, Inc. and other Node contributors.
var isBufferEncoding = Buffer$3.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     };


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
function StringDecoder(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer$3(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
}

// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

Readable$1.ReadableState = ReadableState;

var debug = debuglog('stream');
inherits$1(Readable$1, EventEmitter$2);

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event])
      emitter.on(event, fn);
    else if (Array.isArray(emitter._events[event]))
      emitter._events[event].unshift(fn);
    else
      emitter._events[event] = [fn, emitter._events[event]];
  }
}
function listenerCount (emitter, type) {
  return emitter.listeners(type).length;
}
function ReadableState(options, stream) {

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}
function Readable$1(options) {

  if (!(this instanceof Readable$1)) return new Readable$1(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  EventEmitter$2.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable$1.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = Buffer$4.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable$1.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable$1.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var _e = new Error('stream.unshift() after end event');
      stream.emit('error', _e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable$1.prototype.setEncoding = function (enc) {
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable$1.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!isBuffer$2(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable$1.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable$1.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false);

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (listenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && src.listeners('data').length) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable$1.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable$1.prototype.on = function (ev, fn) {
  var res = EventEmitter$2.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable$1.prototype.addListener = Readable$1.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable$1.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable$1.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable$1.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable$1._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer$4.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

// A bit simpler than readable streams.
Writable$2.WritableState = WritableState;
inherits$1(Writable$2, EventEmitter$2);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  Object.defineProperty(this, 'buffer', {
    get: deprecate(function () {
      return this.getBuffer();
    }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
  });
  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};
function Writable$2(options) {

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable$2) && !(this instanceof Duplex)) return new Writable$2(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  EventEmitter$2.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable$2.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  nextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;
  // Always throw error if a null is written
  // if we are not in object mode then throw
  // if it is not a buffer, string, or undefined.
  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (!Buffer$3.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable$2.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer$3.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable$2.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable$2.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable$2.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer$3.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer$3.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) nextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
        nextTick(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable$2.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable$2.prototype._writev = null;

Writable$2.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}

inherits$1(Duplex, Readable$1);

var keys = Object.keys(Writable$2.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable$2.prototype[method];
}
function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable$1.call(this, options);
  Writable$2.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

// a transform stream is a readable/writable stream where you do
inherits$1(Transform$1, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}
function Transform$1(options) {
  if (!(this instanceof Transform$1)) return new Transform$1(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform$1.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform$1.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('Not implemented');
};

Transform$1.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform$1.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

inherits$1(PassThrough$2, Transform$1);
function PassThrough$2(options) {
  if (!(this instanceof PassThrough$2)) return new PassThrough$2(options);

  Transform$1.call(this, options);
}

PassThrough$2.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

inherits$1(Stream, EventEmitter$2);
Stream.Readable = Readable$1;
Stream.Writable = Writable$2;
Stream.Duplex = Duplex;
Stream.Transform = Transform$1;
Stream.PassThrough = PassThrough$2;

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EventEmitter$2.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EventEmitter$2.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

const stream$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            default: Stream,
            Readable: Readable$1,
            Writable: Writable$2,
            Duplex,
            Transform: Transform$1,
            PassThrough: PassThrough$2,
            Stream
}, Symbol.toStringTag, { value: 'Module' }));

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  var f = n.default;
	if (typeof f == "function") {
		var a = function () {
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var wavEncoder = {exports: {}};

(function (module) {

	function encodeSync(audioData, opts) {
	  opts = opts || {};

	  audioData = toAudioData(audioData);

	  if (audioData === null) {
	    throw new TypeError("Invalid AudioData");
	  }

	  var floatingPoint = !!(opts.floatingPoint || opts.float);
	  var bitDepth = floatingPoint ? 32 : ((opts.bitDepth|0) || 16);
	  var bytes = bitDepth >> 3;
	  var length = audioData.length * audioData.numberOfChannels * bytes;
	  var dataView = new DataView(new Uint8Array(44 + length).buffer);
	  var writer = createWriter(dataView);

	  var format = {
	    formatId: floatingPoint ? 0x0003 : 0x0001,
	    floatingPoint: floatingPoint,
	    numberOfChannels: audioData.numberOfChannels,
	    sampleRate: audioData.sampleRate,
	    bitDepth: bitDepth
	  };

	  writeHeader(writer, format, dataView.buffer.byteLength - 8);

	  var err = writeData(writer, format, length, audioData, opts);

	  if (err instanceof Error) {
	    throw err;
	  }

	  return dataView.buffer;
	}

	function encode(audioData, opts) {
	  return new Promise(function(resolve) {
	    resolve(encodeSync(audioData, opts));
	  });
	}

	function toAudioData(data) {
	  var audioData = {};

	  if (typeof data.sampleRate !== "number") {
	    return null;
	  }
	  if (!Array.isArray(data.channelData)) {
	    return null;
	  }
	  if (!(data.channelData[0] instanceof Float32Array)) {
	    return null;
	  }

	  audioData.numberOfChannels = data.channelData.length;
	  audioData.length = data.channelData[0].length|0;
	  audioData.sampleRate = data.sampleRate|0;
	  audioData.channelData = data.channelData;

	  return audioData;
	}

	function writeHeader(writer, format, length) {
	  var bytes = format.bitDepth >> 3;

	  writer.string("RIFF");
	  writer.uint32(length);
	  writer.string("WAVE");

	  writer.string("fmt ");
	  writer.uint32(16);
	  writer.uint16(format.floatingPoint ? 0x0003 : 0x0001);
	  writer.uint16(format.numberOfChannels);
	  writer.uint32(format.sampleRate);
	  writer.uint32(format.sampleRate * format.numberOfChannels * bytes);
	  writer.uint16(format.numberOfChannels * bytes);
	  writer.uint16(format.bitDepth);
	}

	function writeData(writer, format, length, audioData, opts) {
	  var bitDepth = format.bitDepth;
	  var encoderOption = format.floatingPoint ? "f" : opts.symmetric ? "s" : "";
	  var methodName = "pcm" + bitDepth + encoderOption;

	  if (!writer[methodName]) {
	    return new TypeError("Not supported bit depth: " + bitDepth);
	  }

	  var write = writer[methodName].bind(writer);
	  var numberOfChannels = format.numberOfChannels;
	  var channelData = audioData.channelData;

	  writer.string("data");
	  writer.uint32(length);

	  for (var i = 0, imax = audioData.length; i < imax; i++) {
	    for (var ch = 0; ch < numberOfChannels; ch++) {
	      write(channelData[ch][i]);
	    }
	  }
	}

	function createWriter(dataView) {
	  var pos = 0;

	  return {
	    int16: function(value) {
	      dataView.setInt16(pos, value, true);
	      pos += 2;
	    },
	    uint16: function(value) {
	      dataView.setUint16(pos, value, true);
	      pos += 2;
	    },
	    uint32: function(value) {
	      dataView.setUint32(pos, value, true);
	      pos += 4;
	    },
	    string: function(value) {
	      for (var i = 0, imax = value.length; i < imax; i++) {
	        dataView.setUint8(pos++, value.charCodeAt(i));
	      }
	    },
	    pcm8: function(value) {
	      value = Math.max(-1, Math.min(value, +1));
	      value = (value * 0.5 + 0.5) * 255;
	      value = Math.round(value)|0;
	      dataView.setUint8(pos, value, true);
	      pos += 1;
	    },
	    pcm8s: function(value) {
	      value = Math.round(value * 128) + 128;
	      value = Math.max(0, Math.min(value, 255));
	      dataView.setUint8(pos, value, true);
	      pos += 1;
	    },
	    pcm16: function(value) {
	      value = Math.max(-1, Math.min(value, +1));
	      value = value < 0 ? value * 32768 : value * 32767;
	      value = Math.round(value)|0;
	      dataView.setInt16(pos, value, true);
	      pos += 2;
	    },
	    pcm16s: function(value) {
	      value = Math.round(value * 32768);
	      value = Math.max(-32768, Math.min(value, 32767));
	      dataView.setInt16(pos, value, true);
	      pos += 2;
	    },
	    pcm24: function(value) {
	      value = Math.max(-1, Math.min(value, +1));
	      value = value < 0 ? 0x1000000 + value * 8388608 : value * 8388607;
	      value = Math.round(value)|0;

	      var x0 = (value >>  0) & 0xFF;
	      var x1 = (value >>  8) & 0xFF;
	      var x2 = (value >> 16) & 0xFF;

	      dataView.setUint8(pos + 0, x0);
	      dataView.setUint8(pos + 1, x1);
	      dataView.setUint8(pos + 2, x2);
	      pos += 3;
	    },
	    pcm24s: function(value) {
	      value = Math.round(value * 8388608);
	      value = Math.max(-8388608, Math.min(value, 8388607));

	      var x0 = (value >>  0) & 0xFF;
	      var x1 = (value >>  8) & 0xFF;
	      var x2 = (value >> 16) & 0xFF;

	      dataView.setUint8(pos + 0, x0);
	      dataView.setUint8(pos + 1, x1);
	      dataView.setUint8(pos + 2, x2);
	      pos += 3;
	    },
	    pcm32: function(value) {
	      value = Math.max(-1, Math.min(value, +1));
	      value = value < 0 ? value * 2147483648 : value * 2147483647;
	      value = Math.round(value)|0;
	      dataView.setInt32(pos, value, true);
	      pos += 4;
	    },
	    pcm32s: function(value) {
	      value = Math.round(value * 2147483648);
	      value = Math.max(-2147483648, Math.min(value, +2147483647));
	      dataView.setInt32(pos, value, true);
	      pos += 4;
	    },
	    pcm32f: function(value) {
	      dataView.setFloat32(pos, value, true);
	      pos += 4;
	    }
	  };
	}

	module.exports.encode = encode;
	module.exports.encode.sync = encodeSync;
} (wavEncoder));

const wav = wavEncoder.exports;

var yauzl = {};

const require$$0$1 = /*@__PURE__*/getAugmentedNamespace(bufferEs6$1);

const require$$1 = /*@__PURE__*/getAugmentedNamespace(browser$2);

const empty = {};

const empty$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            default: empty
}, Symbol.toStringTag, { value: 'Module' }));

const require$$2 = /*@__PURE__*/getAugmentedNamespace(empty$1);

// DEFLATE is a complex format; to read this code, you should probably check the RFC first:

// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
// see fleb note
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new u32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return [b, r];
};
var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b[0];
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i) {
        if (cd[i])
            ++l[cd[i] - 1];
    }
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 0; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >>> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    var n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32 : u8)(e - s);
    n.set(v.subarray(s, e));
    return n;
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    ,
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, buf, st) {
    // source length
    var sl = dat.length;
    if (!sl || (st && st.f && !st.l))
        return buf || new u8(0);
    // have to estimate size
    var noBuf = !buf || st;
    // no state
    var noSt = !st || st.i;
    if (!st)
        st = {};
    // Assumes roughly 33% compression ratio average
    if (!buf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (noBuf)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >>> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17;
        if (noBuf)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (noBuf)
                    cbuf(bt + 131072);
                var end = bt + add;
                for (; bt < end; bt += 4) {
                    buf[bt] = buf[bt - dt];
                    buf[bt + 1] = buf[bt + 1 - dt];
                    buf[bt + 2] = buf[bt + 2 - dt];
                    buf[bt + 3] = buf[bt + 3 - dt];
                }
                bt = end;
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt == buf.length ? buf : slc(buf, 0, bt);
};
// empty
var et = /*#__PURE__*/ new u8(0);
/**
 * Streaming DEFLATE decompression
 */
var Inflate = /*#__PURE__*/ (function () {
    /**
     * Creates an inflation stream
     * @param cb The callback to call whenever data is inflated
     */
    function Inflate(cb) {
        this.s = {};
        this.p = new u8(0);
        this.ondata = cb;
    }
    Inflate.prototype.e = function (c) {
        if (!this.ondata)
            err(5);
        if (this.d)
            err(4);
        var l = this.p.length;
        var n = new u8(l + c.length);
        n.set(this.p), n.set(c, l), this.p = n;
    };
    Inflate.prototype.c = function (final) {
        this.d = this.s.i = final || false;
        var bts = this.s.b;
        var dt = inflt(this.p, this.o, this.s);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, (this.s.p / 8) | 0), this.s.p &= 7;
    };
    /**
     * Pushes a chunk to be inflated
     * @param chunk The chunk to push
     * @param final Whether this is the final chunk
     */
    Inflate.prototype.push = function (chunk, final) {
        this.e(chunk), this.c(final);
    };
    return Inflate;
}());
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }

const createInflateRaw = () => {
  const transform = new Transform$1({
    transform(chunk, encoding, callback) {
      let err = null; try {
        inflate.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), false);
      } catch (e) { err = e; }
      callback(err);
    },
    async flush(callback) {
      let err = null; try {
        inflate.push(new Uint8Array(0), true);
        await final;
      } catch (e) { err = e; }
      callback(err);
    }
  });
  let finalCallback;
  const final = new Promise(ok => { finalCallback = ok; });
  const inflate = new Inflate((chunk, final) => {
    transform.push(Buffer$4.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
    if (final) { finalCallback(); }
  });
  return transform
};

const dummyZlib = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
            __proto__: null,
            createInflateRaw
}, Symbol.toStringTag, { value: 'Module' }));

const require$$3 = /*@__PURE__*/getAugmentedNamespace(dummyZlib);

var fdSlicer = {};

const require$$6 = /*@__PURE__*/getAugmentedNamespace(util$3);

const require$$8 = /*@__PURE__*/getAugmentedNamespace(stream$1);

var pend = Pend$1;

function Pend$1() {
  this.pending = 0;
  this.max = Infinity;
  this.listeners = [];
  this.waiting = [];
  this.error = null;
}

Pend$1.prototype.go = function(fn) {
  if (this.pending < this.max) {
    pendGo(this, fn);
  } else {
    this.waiting.push(fn);
  }
};

Pend$1.prototype.wait = function(cb) {
  if (this.pending === 0) {
    cb(this.error);
  } else {
    this.listeners.push(cb);
  }
};

Pend$1.prototype.hold = function() {
  return pendHold(this);
};

function pendHold(self) {
  self.pending += 1;
  var called = false;
  return onCb;
  function onCb(err) {
    if (called) throw new Error("callback called twice");
    called = true;
    self.error = self.error || err;
    self.pending -= 1;
    if (self.waiting.length > 0 && self.pending < self.max) {
      pendGo(self, self.waiting.shift());
    } else if (self.pending === 0) {
      var listeners = self.listeners;
      self.listeners = [];
      listeners.forEach(cbListener);
    }
  }
  function cbListener(listener) {
    listener(self.error);
  }
}

function pendGo(self, fn) {
  fn(pendHold(self));
}

const require$$7 = /*@__PURE__*/getAugmentedNamespace(events);

const {Buffer: Buffer$2}=require$$0$1;
const setImmediate$1=require$$1.nextTick;
var fs$1 = require$$2;
var util$1 = require$$6;
var stream = require$$8;
var Readable = stream.Readable;
var Writable$1 = stream.Writable;
var PassThrough$1 = stream.PassThrough;
var Pend = pend;
var EventEmitter$1 = require$$7.EventEmitter;

fdSlicer.createFromBuffer = createFromBuffer;
fdSlicer.createFromFd = createFromFd;
fdSlicer.BufferSlicer = BufferSlicer;
fdSlicer.FdSlicer = FdSlicer;

util$1.inherits(FdSlicer, EventEmitter$1);
function FdSlicer(fd, options) {
  options = options || {};
  EventEmitter$1.call(this);

  this.fd = fd;
  this.pend = new Pend();
  this.pend.max = 1;
  this.refCount = 0;
  this.autoClose = !!options.autoClose;
}

FdSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs$1.read(self.fd, buffer, offset, length, position, function(err, bytesRead, buffer) {
      cb();
      callback(err, bytesRead, buffer);
    });
  });
};

FdSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs$1.write(self.fd, buffer, offset, length, position, function(err, written, buffer) {
      cb();
      callback(err, written, buffer);
    });
  });
};

FdSlicer.prototype.createReadStream = function(options) {
  return new ReadStream(this, options);
};

FdSlicer.prototype.createWriteStream = function(options) {
  return new WriteStream(this, options);
};

FdSlicer.prototype.ref = function() {
  this.refCount += 1;
};

FdSlicer.prototype.unref = function() {
  var self = this;
  self.refCount -= 1;

  if (self.refCount > 0) return;
  if (self.refCount < 0) throw new Error("invalid unref");

  if (self.autoClose) {
    fs$1.close(self.fd, onCloseDone);
  }

  function onCloseDone(err) {
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('close');
    }
  }
};

util$1.inherits(ReadStream, Readable);
function ReadStream(context, options) {
  options = options || {};
  Readable.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = options.end;
  this.pos = this.start;
  this.destroyed = false;
}

ReadStream.prototype._read = function(n) {
  var self = this;
  if (self.destroyed) return;

  var toRead = Math.min(self._readableState.highWaterMark, n);
  if (self.endOffset != null) {
    toRead = Math.min(toRead, self.endOffset - self.pos);
  }
  if (toRead <= 0) {
    self.destroyed = true;
    self.push(null);
    self.context.unref();
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    var buffer = new Buffer$2(toRead);
    fs$1.read(self.context.fd, buffer, 0, toRead, self.pos, function(err, bytesRead) {
      if (err) {
        self.destroy(err);
      } else if (bytesRead === 0) {
        self.destroyed = true;
        self.push(null);
        self.context.unref();
      } else {
        self.pos += bytesRead;
        self.push(buffer.slice(0, bytesRead));
      }
      cb();
    });
  });
};

ReadStream.prototype.destroy = function(err) {
  if (this.destroyed) return;
  err = err || new Error("stream destroyed");
  this.destroyed = true;
  this.emit('error', err);
  this.context.unref();
};

util$1.inherits(WriteStream, Writable$1);
function WriteStream(context, options) {
  options = options || {};
  Writable$1.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = (options.end == null) ? Infinity : +options.end;
  this.bytesWritten = 0;
  this.pos = this.start;
  this.destroyed = false;

  this.on('finish', this.destroy.bind(this));
}

WriteStream.prototype._write = function(buffer, encoding, callback) {
  var self = this;
  if (self.destroyed) return;

  if (self.pos + buffer.length > self.endOffset) {
    var err = new Error("maximum file length exceeded");
    err.code = 'ETOOBIG';
    self.destroy();
    callback(err);
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    fs$1.write(self.context.fd, buffer, 0, buffer.length, self.pos, function(err, bytes) {
      if (err) {
        self.destroy();
        cb();
        callback(err);
      } else {
        self.bytesWritten += bytes;
        self.pos += bytes;
        self.emit('progress');
        cb();
        callback();
      }
    });
  });
};

WriteStream.prototype.destroy = function() {
  if (this.destroyed) return;
  this.destroyed = true;
  this.context.unref();
};

util$1.inherits(BufferSlicer, EventEmitter$1);
function BufferSlicer(buffer, options) {
  EventEmitter$1.call(this);

  options = options || {};
  this.refCount = 0;
  this.buffer = buffer;
  this.maxChunkSize = options.maxChunkSize || Number.MAX_SAFE_INTEGER;
}

BufferSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var end = position + length;
  var delta = end - this.buffer.length;
  var written = (delta > 0) ? delta : length;
  this.buffer.copy(buffer, offset, position, end);
  setImmediate$1(function() {
    callback(null, written);
  });
};

BufferSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  buffer.copy(this.buffer, position, offset, offset + length);
  setImmediate$1(function() {
    callback(null, length, buffer);
  });
};

BufferSlicer.prototype.createReadStream = function(options) {
  options = options || {};
  var readStream = new PassThrough$1(options);
  readStream.destroyed = false;
  readStream.start = options.start || 0;
  readStream.endOffset = options.end;
  // by the time this function returns, we'll be done.
  readStream.pos = readStream.endOffset || this.buffer.length;

  // respect the maxChunkSize option to slice up the chunk into smaller pieces.
  var entireSlice = this.buffer.slice(readStream.start, readStream.pos);
  var offset = 0;
  while (true) {
    var nextOffset = offset + this.maxChunkSize;
    if (nextOffset >= entireSlice.length) {
      // last chunk
      if (offset < entireSlice.length) {
        readStream.write(entireSlice.slice(offset, entireSlice.length));
      }
      break;
    }
    readStream.write(entireSlice.slice(offset, nextOffset));
    offset = nextOffset;
  }

  readStream.end();
  readStream.destroy = function() {
    readStream.destroyed = true;
  };
  return readStream;
};

BufferSlicer.prototype.createWriteStream = function(options) {
  var bufferSlicer = this;
  options = options || {};
  var writeStream = new Writable$1(options);
  writeStream.start = options.start || 0;
  writeStream.endOffset = (options.end == null) ? this.buffer.length : +options.end;
  writeStream.bytesWritten = 0;
  writeStream.pos = writeStream.start;
  writeStream.destroyed = false;
  writeStream._write = function(buffer, encoding, callback) {
    if (writeStream.destroyed) return;

    var end = writeStream.pos + buffer.length;
    if (end > writeStream.endOffset) {
      var err = new Error("maximum file length exceeded");
      err.code = 'ETOOBIG';
      writeStream.destroyed = true;
      callback(err);
      return;
    }
    buffer.copy(bufferSlicer.buffer, writeStream.pos, 0, buffer.length);

    writeStream.bytesWritten += buffer.length;
    writeStream.pos = end;
    writeStream.emit('progress');
    callback();
  };
  writeStream.destroy = function() {
    writeStream.destroyed = true;
  };
  return writeStream;
};

BufferSlicer.prototype.ref = function() {
  this.refCount += 1;
};

BufferSlicer.prototype.unref = function() {
  this.refCount -= 1;

  if (this.refCount < 0) {
    throw new Error("invalid unref");
  }
};

function createFromBuffer(buffer, options) {
  return new BufferSlicer(buffer, options);
}

function createFromFd(fd, options) {
  return new FdSlicer(fd, options);
}

const require$$0 = /*@__PURE__*/getAugmentedNamespace(bufferEs6);

var Buffer$1 = require$$0.Buffer;

var CRC_TABLE = [
  0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
  0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
  0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
  0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
  0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
  0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
  0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
  0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
  0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
  0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
  0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
  0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
  0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
  0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
  0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
  0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
  0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
  0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
  0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
  0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
  0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
  0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
  0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
  0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
  0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
  0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
  0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
  0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
  0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
  0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
  0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
  0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
  0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
  0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
  0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
  0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
  0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
  0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
  0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
  0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
  0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
  0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
  0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
  0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
  0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
  0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
  0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
  0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
  0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
  0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
  0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
  0x2d02ef8d
];

if (typeof Int32Array !== 'undefined') {
  CRC_TABLE = new Int32Array(CRC_TABLE);
}

function ensureBuffer(input) {
  if (Buffer$1.isBuffer(input)) {
    return input;
  }

  var hasNewBufferAPI =
      typeof Buffer$1.alloc === "function" &&
      typeof Buffer$1.from === "function";

  if (typeof input === "number") {
    return hasNewBufferAPI ? Buffer$1.alloc(input) : new Buffer$1(input);
  }
  else if (typeof input === "string") {
    return hasNewBufferAPI ? Buffer$1.from(input) : new Buffer$1(input);
  }
  else {
    throw new Error("input must be buffer, number, or string, received " +
                    typeof input);
  }
}

function bufferizeInt(num) {
  var tmp = ensureBuffer(4);
  tmp.writeInt32BE(num, 0);
  return tmp;
}

function _crc32(buf, previous) {
  buf = ensureBuffer(buf);
  if (Buffer$1.isBuffer(previous)) {
    previous = previous.readUInt32BE(0);
  }
  var crc = ~~previous ^ -1;
  for (var n = 0; n < buf.length; n++) {
    crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1);
}

function crc32$1() {
  return bufferizeInt(_crc32.apply(null, arguments));
}
crc32$1.signed = function () {
  return _crc32.apply(null, arguments);
};
crc32$1.unsigned = function () {
  return _crc32.apply(null, arguments) >>> 0;
};

var bufferCrc32 = crc32$1;

const {Buffer}=require$$0$1;
const setImmediate=require$$1.nextTick;
var fs = require$$2;
var zlib = require$$3;
var fd_slicer = fdSlicer;
var crc32 = bufferCrc32;
var util = require$$6;
var EventEmitter = require$$7.EventEmitter;
var Transform = require$$8.Transform;
var PassThrough = require$$8.PassThrough;
var Writable = require$$8.Writable;

yauzl.open = open;
yauzl.fromFd = fromFd;
yauzl.fromBuffer = fromBuffer;
yauzl.fromRandomAccessReader = fromRandomAccessReader;
yauzl.dosDateTimeToDate = dosDateTimeToDate;
yauzl.validateFileName = validateFileName;
yauzl.ZipFile = ZipFile;
yauzl.Entry = Entry;
yauzl.RandomAccessReader = RandomAccessReader;

function open(path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = true;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (options.decodeStrings == null) options.decodeStrings = true;
  if (options.validateEntrySizes == null) options.validateEntrySizes = true;
  if (options.strictFileNames == null) options.strictFileNames = false;
  if (callback == null) callback = defaultCallback;
  fs.open(path, "r", function(err, fd) {
    if (err) return callback(err);
    fromFd(fd, options, function(err, zipfile) {
      if (err) fs.close(fd, defaultCallback);
      callback(err, zipfile);
    });
  });
}

function fromFd(fd, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = false;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (options.decodeStrings == null) options.decodeStrings = true;
  if (options.validateEntrySizes == null) options.validateEntrySizes = true;
  if (options.strictFileNames == null) options.strictFileNames = false;
  if (callback == null) callback = defaultCallback;
  fs.fstat(fd, function(err, stats) {
    if (err) return callback(err);
    var reader = fd_slicer.createFromFd(fd, {autoClose: true});
    fromRandomAccessReader(reader, stats.size, options, callback);
  });
}

function fromBuffer(buffer, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  options.autoClose = false;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (options.decodeStrings == null) options.decodeStrings = true;
  if (options.validateEntrySizes == null) options.validateEntrySizes = true;
  if (options.strictFileNames == null) options.strictFileNames = false;
  // limit the max chunk size. see https://github.com/thejoshwolfe/yauzl/issues/87
  var reader = fd_slicer.createFromBuffer(buffer, {maxChunkSize: 0x10000});
  fromRandomAccessReader(reader, buffer.length, options, callback);
}

function fromRandomAccessReader(reader, totalSize, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = true;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (options.decodeStrings == null) options.decodeStrings = true;
  var decodeStrings = !!options.decodeStrings;
  if (options.validateEntrySizes == null) options.validateEntrySizes = true;
  if (options.strictFileNames == null) options.strictFileNames = false;
  if (callback == null) callback = defaultCallback;
  if (typeof totalSize !== "number") throw new Error("expected totalSize parameter to be a number");
  if (totalSize > Number.MAX_SAFE_INTEGER) {
    throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
  }

  // the matching unref() call is in zipfile.close()
  reader.ref();

  // eocdr means End of Central Directory Record.
  // search backwards for the eocdr signature.
  // the last field of the eocdr is a variable-length comment.
  // the comment size is encoded in a 2-byte field in the eocdr, which we can't find without trudging backwards through the comment to find it.
  // as a consequence of this design decision, it's possible to have ambiguous zip file metadata if a coherent eocdr was in the comment.
  // we search backwards for a eocdr signature, and hope that whoever made the zip file was smart enough to forbid the eocdr signature in the comment.
  var eocdrWithoutCommentSize = 22;
  var maxCommentSize = 0xffff; // 2-byte size
  var bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, totalSize);
  var buffer = newBuffer(bufferSize);
  var bufferReadStart = totalSize - buffer.length;
  readAndAssertNoEof(reader, buffer, 0, bufferSize, bufferReadStart, function(err) {
    if (err) return callback(err);
    for (var i = bufferSize - eocdrWithoutCommentSize; i >= 0; i -= 1) {
      if (buffer.readUInt32LE(i) !== 0x06054b50) continue;
      // found eocdr
      var eocdrBuffer = buffer.slice(i);

      // 0 - End of central directory signature = 0x06054b50
      // 4 - Number of this disk
      var diskNumber = eocdrBuffer.readUInt16LE(4);
      if (diskNumber !== 0) {
        return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
      }
      // 6 - Disk where central directory starts
      // 8 - Number of central directory records on this disk
      // 10 - Total number of central directory records
      var entryCount = eocdrBuffer.readUInt16LE(10);
      // 12 - Size of central directory (bytes)
      // 16 - Offset of start of central directory, relative to start of archive
      var centralDirectoryOffset = eocdrBuffer.readUInt32LE(16);
      // 20 - Comment length
      var commentLength = eocdrBuffer.readUInt16LE(20);
      var expectedCommentLength = eocdrBuffer.length - eocdrWithoutCommentSize;
      if (commentLength !== expectedCommentLength) {
        return callback(new Error("invalid comment length. expected: " + expectedCommentLength + ". found: " + commentLength));
      }
      // 22 - Comment
      // the encoding is always cp437.
      var comment = decodeStrings ? decodeBuffer(eocdrBuffer, 22, eocdrBuffer.length, false)
                                  : eocdrBuffer.slice(22);

      if (!(entryCount === 0xffff || centralDirectoryOffset === 0xffffffff)) {
        return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries, decodeStrings, options.validateEntrySizes, options.strictFileNames));
      }

      // ZIP64 format

      // ZIP64 Zip64 end of central directory locator
      var zip64EocdlBuffer = newBuffer(20);
      var zip64EocdlOffset = bufferReadStart + i - zip64EocdlBuffer.length;
      readAndAssertNoEof(reader, zip64EocdlBuffer, 0, zip64EocdlBuffer.length, zip64EocdlOffset, function(err) {
        if (err) return callback(err);

        // 0 - zip64 end of central dir locator signature = 0x07064b50
        if (zip64EocdlBuffer.readUInt32LE(0) !== 0x07064b50) {
          return callback(new Error("invalid zip64 end of central directory locator signature"));
        }
        // 4 - number of the disk with the start of the zip64 end of central directory
        // 8 - relative offset of the zip64 end of central directory record
        var zip64EocdrOffset = readUInt64LE(zip64EocdlBuffer, 8);
        // 16 - total number of disks

        // ZIP64 end of central directory record
        var zip64EocdrBuffer = newBuffer(56);
        readAndAssertNoEof(reader, zip64EocdrBuffer, 0, zip64EocdrBuffer.length, zip64EocdrOffset, function(err) {
          if (err) return callback(err);

          // 0 - zip64 end of central dir signature                           4 bytes  (0x06064b50)
          if (zip64EocdrBuffer.readUInt32LE(0) !== 0x06064b50) {
            return callback(new Error("invalid zip64 end of central directory record signature"));
          }
          // 4 - size of zip64 end of central directory record                8 bytes
          // 12 - version made by                                             2 bytes
          // 14 - version needed to extract                                   2 bytes
          // 16 - number of this disk                                         4 bytes
          // 20 - number of the disk with the start of the central directory  4 bytes
          // 24 - total number of entries in the central directory on this disk         8 bytes
          // 32 - total number of entries in the central directory            8 bytes
          entryCount = readUInt64LE(zip64EocdrBuffer, 32);
          // 40 - size of the central directory                               8 bytes
          // 48 - offset of start of central directory with respect to the starting disk number     8 bytes
          centralDirectoryOffset = readUInt64LE(zip64EocdrBuffer, 48);
          // 56 - zip64 extensible data sector                                (variable size)
          return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries, decodeStrings, options.validateEntrySizes, options.strictFileNames));
        });
      });
      return;
    }
    callback(new Error("end of central directory record signature not found"));
  });
}

util.inherits(ZipFile, EventEmitter);
function ZipFile(reader, centralDirectoryOffset, fileSize, entryCount, comment, autoClose, lazyEntries, decodeStrings, validateEntrySizes, strictFileNames) {
  var self = this;
  EventEmitter.call(self);
  self.reader = reader;
  // forward close events
  self.reader.on("error", function(err) {
    // error closing the fd
    emitError(self, err);
  });
  self.reader.once("close", function() {
    self.emit("close");
  });
  self.readEntryCursor = centralDirectoryOffset;
  self.fileSize = fileSize;
  self.entryCount = entryCount;
  self.comment = comment;
  self.entriesRead = 0;
  self.autoClose = !!autoClose;
  self.lazyEntries = !!lazyEntries;
  self.decodeStrings = !!decodeStrings;
  self.validateEntrySizes = !!validateEntrySizes;
  self.strictFileNames = !!strictFileNames;
  self.isOpen = true;
  self.emittedError = false;

  if (!self.lazyEntries) self._readEntry();
}
ZipFile.prototype.close = function() {
  if (!this.isOpen) return;
  this.isOpen = false;
  this.reader.unref();
};

function emitErrorAndAutoClose(self, err) {
  if (self.autoClose) self.close();
  emitError(self, err);
}
function emitError(self, err) {
  if (self.emittedError) return;
  self.emittedError = true;
  self.emit("error", err);
}

ZipFile.prototype.readEntry = function() {
  if (!this.lazyEntries) throw new Error("readEntry() called without lazyEntries:true");
  this._readEntry();
};
ZipFile.prototype._readEntry = function() {
  var self = this;
  if (self.entryCount === self.entriesRead) {
    // done with metadata
    setImmediate(function() {
      if (self.autoClose) self.close();
      if (self.emittedError) return;
      self.emit("end");
    });
    return;
  }
  if (self.emittedError) return;
  var buffer = newBuffer(46);
  readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
    if (err) return emitErrorAndAutoClose(self, err);
    if (self.emittedError) return;
    var entry = new Entry();
    // 0 - Central directory file header signature
    var signature = buffer.readUInt32LE(0);
    if (signature !== 0x02014b50) return emitErrorAndAutoClose(self, new Error("invalid central directory file header signature: 0x" + signature.toString(16)));
    // 4 - Version made by
    entry.versionMadeBy = buffer.readUInt16LE(4);
    // 6 - Version needed to extract (minimum)
    entry.versionNeededToExtract = buffer.readUInt16LE(6);
    // 8 - General purpose bit flag
    entry.generalPurposeBitFlag = buffer.readUInt16LE(8);
    // 10 - Compression method
    entry.compressionMethod = buffer.readUInt16LE(10);
    // 12 - File last modification time
    entry.lastModFileTime = buffer.readUInt16LE(12);
    // 14 - File last modification date
    entry.lastModFileDate = buffer.readUInt16LE(14);
    // 16 - CRC-32
    entry.crc32 = buffer.readUInt32LE(16);
    // 20 - Compressed size
    entry.compressedSize = buffer.readUInt32LE(20);
    // 24 - Uncompressed size
    entry.uncompressedSize = buffer.readUInt32LE(24);
    // 28 - File name length (n)
    entry.fileNameLength = buffer.readUInt16LE(28);
    // 30 - Extra field length (m)
    entry.extraFieldLength = buffer.readUInt16LE(30);
    // 32 - File comment length (k)
    entry.fileCommentLength = buffer.readUInt16LE(32);
    // 34 - Disk number where file starts
    // 36 - Internal file attributes
    entry.internalFileAttributes = buffer.readUInt16LE(36);
    // 38 - External file attributes
    entry.externalFileAttributes = buffer.readUInt32LE(38);
    // 42 - Relative offset of local file header
    entry.relativeOffsetOfLocalHeader = buffer.readUInt32LE(42);

    if (entry.generalPurposeBitFlag & 0x40) return emitErrorAndAutoClose(self, new Error("strong encryption is not supported"));

    self.readEntryCursor += 46;

    buffer = newBuffer(entry.fileNameLength + entry.extraFieldLength + entry.fileCommentLength);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
      if (err) return emitErrorAndAutoClose(self, err);
      if (self.emittedError) return;
      // 46 - File name
      var isUtf8 = (entry.generalPurposeBitFlag & 0x800) !== 0;
      entry.fileName = self.decodeStrings ? decodeBuffer(buffer, 0, entry.fileNameLength, isUtf8)
                                          : buffer.slice(0, entry.fileNameLength);

      // 46+n - Extra field
      var fileCommentStart = entry.fileNameLength + entry.extraFieldLength;
      var extraFieldBuffer = buffer.slice(entry.fileNameLength, fileCommentStart);
      entry.extraFields = [];
      var i = 0;
      while (i < extraFieldBuffer.length - 3) {
        var headerId = extraFieldBuffer.readUInt16LE(i + 0);
        var dataSize = extraFieldBuffer.readUInt16LE(i + 2);
        var dataStart = i + 4;
        var dataEnd = dataStart + dataSize;
        if (dataEnd > extraFieldBuffer.length) return emitErrorAndAutoClose(self, new Error("extra field length exceeds extra field buffer size"));
        var dataBuffer = newBuffer(dataSize);
        extraFieldBuffer.copy(dataBuffer, 0, dataStart, dataEnd);
        entry.extraFields.push({
          id: headerId,
          data: dataBuffer,
        });
        i = dataEnd;
      }

      // 46+n+m - File comment
      entry.fileComment = self.decodeStrings ? decodeBuffer(buffer, fileCommentStart, fileCommentStart + entry.fileCommentLength, isUtf8)
                                             : buffer.slice(fileCommentStart, fileCommentStart + entry.fileCommentLength);
      // compatibility hack for https://github.com/thejoshwolfe/yauzl/issues/47
      entry.comment = entry.fileComment;

      self.readEntryCursor += buffer.length;
      self.entriesRead += 1;

      if (entry.uncompressedSize            === 0xffffffff ||
          entry.compressedSize              === 0xffffffff ||
          entry.relativeOffsetOfLocalHeader === 0xffffffff) {
        // ZIP64 format
        // find the Zip64 Extended Information Extra Field
        var zip64EiefBuffer = null;
        for (var i = 0; i < entry.extraFields.length; i++) {
          var extraField = entry.extraFields[i];
          if (extraField.id === 0x0001) {
            zip64EiefBuffer = extraField.data;
            break;
          }
        }
        if (zip64EiefBuffer == null) {
          return emitErrorAndAutoClose(self, new Error("expected zip64 extended information extra field"));
        }
        var index = 0;
        // 0 - Original Size          8 bytes
        if (entry.uncompressedSize === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include uncompressed size"));
          }
          entry.uncompressedSize = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 8 - Compressed Size        8 bytes
        if (entry.compressedSize === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include compressed size"));
          }
          entry.compressedSize = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 16 - Relative Header Offset 8 bytes
        if (entry.relativeOffsetOfLocalHeader === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include relative header offset"));
          }
          entry.relativeOffsetOfLocalHeader = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 24 - Disk Start Number      4 bytes
      }

      // check for Info-ZIP Unicode Path Extra Field (0x7075)
      // see https://github.com/thejoshwolfe/yauzl/issues/33
      if (self.decodeStrings) {
        for (var i = 0; i < entry.extraFields.length; i++) {
          var extraField = entry.extraFields[i];
          if (extraField.id === 0x7075) {
            if (extraField.data.length < 6) {
              // too short to be meaningful
              continue;
            }
            // Version       1 byte      version of this extra field, currently 1
            if (extraField.data.readUInt8(0) !== 1) {
              // > Changes may not be backward compatible so this extra
              // > field should not be used if the version is not recognized.
              continue;
            }
            // NameCRC32     4 bytes     File Name Field CRC32 Checksum
            var oldNameCrc32 = extraField.data.readUInt32LE(1);
            if (crc32.unsigned(buffer.slice(0, entry.fileNameLength)) !== oldNameCrc32) {
              // > If the CRC check fails, this UTF-8 Path Extra Field should be
              // > ignored and the File Name field in the header should be used instead.
              continue;
            }
            // UnicodeName   Variable    UTF-8 version of the entry File Name
            entry.fileName = decodeBuffer(extraField.data, 5, extraField.data.length, true);
            break;
          }
        }
      }

      // validate file size
      if (self.validateEntrySizes && entry.compressionMethod === 0) {
        var expectedCompressedSize = entry.uncompressedSize;
        if (entry.isEncrypted()) {
          // traditional encryption prefixes the file data with a header
          expectedCompressedSize += 12;
        }
        if (entry.compressedSize !== expectedCompressedSize) {
          var msg = "compressed/uncompressed size mismatch for stored file: " + entry.compressedSize + " != " + entry.uncompressedSize;
          return emitErrorAndAutoClose(self, new Error(msg));
        }
      }

      if (self.decodeStrings) {
        if (!self.strictFileNames) {
          // allow backslash
          entry.fileName = entry.fileName.replace(/\\/g, "/");
        }
        var errorMessage = validateFileName(entry.fileName, self.validateFileNameOptions);
        if (errorMessage != null) return emitErrorAndAutoClose(self, new Error(errorMessage));
      }
      self.emit("entry", entry);

      if (!self.lazyEntries) self._readEntry();
    });
  });
};

ZipFile.prototype.openReadStream = function(entry, options, callback) {
  var self = this;
  // parameter validation
  var relativeStart = 0;
  var relativeEnd = entry.compressedSize;
  if (callback == null) {
    callback = options;
    options = {};
  } else {
    // validate options that the caller has no excuse to get wrong
    if (options.decrypt != null) {
      if (!entry.isEncrypted()) {
        throw new Error("options.decrypt can only be specified for encrypted entries");
      }
      if (options.decrypt !== false) throw new Error("invalid options.decrypt value: " + options.decrypt);
      if (entry.isCompressed()) {
        if (options.decompress !== false) throw new Error("entry is encrypted and compressed, and options.decompress !== false");
      }
    }
    if (options.decompress != null) {
      if (!entry.isCompressed()) {
        throw new Error("options.decompress can only be specified for compressed entries");
      }
      if (!(options.decompress === false || options.decompress === true)) {
        throw new Error("invalid options.decompress value: " + options.decompress);
      }
    }
    if (options.start != null || options.end != null) {
      if (entry.isCompressed() && options.decompress !== false) {
        throw new Error("start/end range not allowed for compressed entry without options.decompress === false");
      }
      if (entry.isEncrypted() && options.decrypt !== false) {
        throw new Error("start/end range not allowed for encrypted entry without options.decrypt === false");
      }
    }
    if (options.start != null) {
      relativeStart = options.start;
      if (relativeStart < 0) throw new Error("options.start < 0");
      if (relativeStart > entry.compressedSize) throw new Error("options.start > entry.compressedSize");
    }
    if (options.end != null) {
      relativeEnd = options.end;
      if (relativeEnd < 0) throw new Error("options.end < 0");
      if (relativeEnd > entry.compressedSize) throw new Error("options.end > entry.compressedSize");
      if (relativeEnd < relativeStart) throw new Error("options.end < options.start");
    }
  }
  // any further errors can either be caused by the zipfile,
  // or were introduced in a minor version of yauzl,
  // so should be passed to the client rather than thrown.
  if (!self.isOpen) return callback(new Error("closed"));
  if (entry.isEncrypted()) {
    if (options.decrypt !== false) return callback(new Error("entry is encrypted, and options.decrypt !== false"));
  }
  // make sure we don't lose the fd before we open the actual read stream
  self.reader.ref();
  var buffer = newBuffer(30);
  readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader, function(err) {
    try {
      if (err) return callback(err);
      // 0 - Local file header signature = 0x04034b50
      var signature = buffer.readUInt32LE(0);
      if (signature !== 0x04034b50) {
        return callback(new Error("invalid local file header signature: 0x" + signature.toString(16)));
      }
      // all this should be redundant
      // 4 - Version needed to extract (minimum)
      // 6 - General purpose bit flag
      // 8 - Compression method
      // 10 - File last modification time
      // 12 - File last modification date
      // 14 - CRC-32
      // 18 - Compressed size
      // 22 - Uncompressed size
      // 26 - File name length (n)
      var fileNameLength = buffer.readUInt16LE(26);
      // 28 - Extra field length (m)
      var extraFieldLength = buffer.readUInt16LE(28);
      // 30 - File name
      // 30+n - Extra field
      var localFileHeaderEnd = entry.relativeOffsetOfLocalHeader + buffer.length + fileNameLength + extraFieldLength;
      var decompress;
      if (entry.compressionMethod === 0) {
        // 0 - The file is stored (no compression)
        decompress = false;
      } else if (entry.compressionMethod === 8) {
        // 8 - The file is Deflated
        decompress = options.decompress != null ? options.decompress : true;
      } else {
        return callback(new Error("unsupported compression method: " + entry.compressionMethod));
      }
      var fileDataStart = localFileHeaderEnd;
      var fileDataEnd = fileDataStart + entry.compressedSize;
      if (entry.compressedSize !== 0) {
        // bounds check now, because the read streams will probably not complain loud enough.
        // since we're dealing with an unsigned offset plus an unsigned size,
        // we only have 1 thing to check for.
        if (fileDataEnd > self.fileSize) {
          return callback(new Error("file data overflows file bounds: " +
              fileDataStart + " + " + entry.compressedSize + " > " + self.fileSize));
        }
      }
      var readStream = self.reader.createReadStream({
        start: fileDataStart + relativeStart,
        end: fileDataStart + relativeEnd,
      });
      var endpointStream = readStream;
      if (decompress) {
        var destroyed = false;
        var inflateFilter = zlib.createInflateRaw();
        readStream.on("error", function(err) {
          // setImmediate here because errors can be emitted during the first call to pipe()
          setImmediate(function() {
            if (!destroyed) inflateFilter.emit("error", err);
          });
        });
        readStream.pipe(inflateFilter);

        if (self.validateEntrySizes) {
          endpointStream = new AssertByteCountStream(entry.uncompressedSize);
          inflateFilter.on("error", function(err) {
            // forward zlib errors to the client-visible stream
            setImmediate(function() {
              if (!destroyed) endpointStream.emit("error", err);
            });
          });
          inflateFilter.pipe(endpointStream);
        } else {
          // the zlib filter is the client-visible stream
          endpointStream = inflateFilter;
        }
        // this is part of yauzl's API, so implement this function on the client-visible stream
        endpointStream.destroy = function() {
          destroyed = true;
          if (inflateFilter !== endpointStream) inflateFilter.unpipe(endpointStream);
          readStream.unpipe(inflateFilter);
          // TODO: the inflateFilter may cause a memory leak. see Issue #27.
          readStream.destroy();
        };
      }
      callback(null, endpointStream);
    } finally {
      self.reader.unref();
    }
  });
};

function Entry() {
}
Entry.prototype.getLastModDate = function() {
  return dosDateTimeToDate(this.lastModFileDate, this.lastModFileTime);
};
Entry.prototype.isEncrypted = function() {
  return (this.generalPurposeBitFlag & 0x1) !== 0;
};
Entry.prototype.isCompressed = function() {
  return this.compressionMethod === 8;
};

function dosDateTimeToDate(date, time) {
  var day = date & 0x1f; // 1-31
  var month = (date >> 5 & 0xf) - 1; // 1-12, 0-11
  var year = (date >> 9 & 0x7f) + 1980; // 0-128, 1980-2108

  var millisecond = 0;
  var second = (time & 0x1f) * 2; // 0-29, 0-58 (even numbers)
  var minute = time >> 5 & 0x3f; // 0-59
  var hour = time >> 11 & 0x1f; // 0-23

  return new Date(year, month, day, hour, minute, second, millisecond);
}

function validateFileName(fileName) {
  if (fileName.indexOf("\\") !== -1) {
    return "invalid characters in fileName: " + fileName;
  }
  if (/^[a-zA-Z]:/.test(fileName) || /^\//.test(fileName)) {
    return "absolute path: " + fileName;
  }
  if (fileName.split("/").indexOf("..") !== -1) {
    return "invalid relative path: " + fileName;
  }
  // all good
  return null;
}

function readAndAssertNoEof(reader, buffer, offset, length, position, callback) {
  if (length === 0) {
    // fs.read will throw an out-of-bounds error if you try to read 0 bytes from a 0 byte file
    return setImmediate(function() { callback(null, newBuffer(0)); });
  }
  reader.read(buffer, offset, length, position, function(err, bytesRead) {
    if (err) return callback(err);
    if (bytesRead < length) {
      return callback(new Error("unexpected EOF"));
    }
    callback();
  });
}

util.inherits(AssertByteCountStream, Transform);
function AssertByteCountStream(byteCount) {
  Transform.call(this);
  this.actualByteCount = 0;
  this.expectedByteCount = byteCount;
}
AssertByteCountStream.prototype._transform = function(chunk, encoding, cb) {
  this.actualByteCount += chunk.length;
  if (this.actualByteCount > this.expectedByteCount) {
    var msg = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
    return cb(new Error(msg));
  }
  cb(null, chunk);
};
AssertByteCountStream.prototype._flush = function(cb) {
  if (this.actualByteCount < this.expectedByteCount) {
    var msg = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
    return cb(new Error(msg));
  }
  cb();
};

util.inherits(RandomAccessReader, EventEmitter);
function RandomAccessReader() {
  EventEmitter.call(this);
  this.refCount = 0;
}
RandomAccessReader.prototype.ref = function() {
  this.refCount += 1;
};
RandomAccessReader.prototype.unref = function() {
  var self = this;
  self.refCount -= 1;

  if (self.refCount > 0) return;
  if (self.refCount < 0) throw new Error("invalid unref");

  self.close(onCloseDone);

  function onCloseDone(err) {
    if (err) return self.emit('error', err);
    self.emit('close');
  }
};
RandomAccessReader.prototype.createReadStream = function(options) {
  var start = options.start;
  var end = options.end;
  if (start === end) {
    var emptyStream = new PassThrough();
    setImmediate(function() {
      emptyStream.end();
    });
    return emptyStream;
  }
  var stream = this._readStreamForRange(start, end);

  var destroyed = false;
  var refUnrefFilter = new RefUnrefFilter(this);
  stream.on("error", function(err) {
    setImmediate(function() {
      if (!destroyed) refUnrefFilter.emit("error", err);
    });
  });
  refUnrefFilter.destroy = function() {
    stream.unpipe(refUnrefFilter);
    refUnrefFilter.unref();
    stream.destroy();
  };

  var byteCounter = new AssertByteCountStream(end - start);
  refUnrefFilter.on("error", function(err) {
    setImmediate(function() {
      if (!destroyed) byteCounter.emit("error", err);
    });
  });
  byteCounter.destroy = function() {
    destroyed = true;
    refUnrefFilter.unpipe(byteCounter);
    refUnrefFilter.destroy();
  };

  return stream.pipe(refUnrefFilter).pipe(byteCounter);
};
RandomAccessReader.prototype._readStreamForRange = function(start, end) {
  throw new Error("not implemented");
};
RandomAccessReader.prototype.read = function(buffer, offset, length, position, callback) {
  var readStream = this.createReadStream({start: position, end: position + length});
  var writeStream = new Writable();
  var written = 0;
  writeStream._write = function(chunk, encoding, cb) {
    chunk.copy(buffer, offset + written, 0, chunk.length);
    written += chunk.length;
    cb();
  };
  writeStream.on("finish", callback);
  readStream.on("error", function(error) {
    callback(error);
  });
  readStream.pipe(writeStream);
};
RandomAccessReader.prototype.close = function(callback) {
  setImmediate(callback);
};

util.inherits(RefUnrefFilter, PassThrough);
function RefUnrefFilter(context) {
  PassThrough.call(this);
  this.context = context;
  this.context.ref();
  this.unreffedYet = false;
}
RefUnrefFilter.prototype._flush = function(cb) {
  this.unref();
  cb();
};
RefUnrefFilter.prototype.unref = function(cb) {
  if (this.unreffedYet) return;
  this.unreffedYet = true;
  this.context.unref();
};

var cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
function decodeBuffer(buffer, start, end, isUtf8) {
  if (isUtf8) {
    return buffer.toString("utf8", start, end);
  } else {
    var result = "";
    for (var i = start; i < end; i++) {
      result += cp437[buffer[i]];
    }
    return result;
  }
}

function readUInt64LE(buffer, offset) {
  // there is no native function for this, because we can't actually store 64-bit integers precisely.
  // after 53 bits, JavaScript's Number type (IEEE 754 double) can't store individual integers anymore.
  // but since 53 bits is a whole lot more than 32 bits, we do our best anyway.
  var lower32 = buffer.readUInt32LE(offset);
  var upper32 = buffer.readUInt32LE(offset + 4);
  // we can't use bitshifting here, because JavaScript bitshifting only works on 32-bit integers.
  return upper32 * 0x100000000 + lower32;
  // as long as we're bounds checking the result of this function against the total file size,
  // we'll catch any overflow errors, because we already made sure the total file size was within reason.
}

// Node 10 deprecated new Buffer().
var newBuffer;
if (typeof Buffer.allocUnsafe === "function") {
  newBuffer = function(len) {
    return Buffer.allocUnsafe(len);
  };
} else {
  newBuffer = function(len) {
    return new Buffer(len);
  };
}

function defaultCallback(err) {
  if (err) throw err;
}

var pinyinUtil$1 = {exports: {}};

var pinyin_dict_withtone = "yī,dīng zhēng,kǎo qiǎo yú,qī,shàng,xià,hǎn,wàn mò,zhàng,sān,shàng shǎng,xià,qí jī,bù fǒu,yǔ yù yú,miǎn,gài,chǒu,chǒu,zhuān,qiě jū,pī,shì,shì,qiū,bǐng,yè,cóng,dōng,sī,chéng,diū,qiū,liǎng,diū,yǒu,liǎng,yán,bìng,sāng sàng,gǔn,jiū,gè gě,yā,pán,zhōng zhòng,jǐ,jiè,fēng,guàn kuàng,chuàn,chǎn,lín,zhuó,zhǔ,bā,wán,dān,wéi wèi,zhǔ,jǐng,lì lí,jǔ,piě,fú,yí jí,yì,nǎi,wǔ,jiǔ,jiǔ,tuō zhé,me yāo mó ma,yì,yī,zhī,wū,zhà,hū,fá,lè yuè,yín,pīng,pāng,qiáo,hǔ,guāi,chéng shèng,chéng shèng,yǐ,háo yǐ,yǐ,miē niè,jiǔ,qǐ,yě,xí,xiāng,gài,jiǔ,xià,hù,shū,dǒu,shǐ,jī,náng,jiā,none,shí,none,hū,mǎi,luàn,none,rǔ,xué,yǎn,fǔ,shā,nǎ,qián,suǒ,yú,zhù,zhě,qián gān,zhì luàn,guī,qián,luàn,lǐn lìn,yì,jué,le liǎo,gè mā,yú yǔ,zhēng,shì,shì,èr,chù,yú,kuī,yú,yún,hù,qí,wǔ,jǐng,sì,suì,gèn,gèn,yà,xiē suò,yà,qí zhāi,yā yà,jí qì,tóu,wáng wú,kàng,dà,jiāo,hài,yì,chǎn,hēng pēng,mǔ,ye,xiǎng,jīng,tíng,liàng,xiǎng,jīng,yè,qīn qìng,bó,yòu,xiè,dǎn dàn,lián,duǒ,wěi mén,rén,rén,jí,jí,wáng,yì,shén shí,rén,lè,dīng,zè,jǐn jìn,pū pú,chóu qiú,bā,zhǎng,jīn,jiè,bīng,réng,cóng zòng,fó,jīn sǎn,lún,bīng,cāng,zī zǐ zǎi,shì,tā,zhàng,fù,xiān,xiān,tuō chà duó,hóng,tóng,rèn,qiān,gǎn hàn,yì gē,bó,dài,líng lǐng lìng,yǐ,chào,cháng zhǎng,sā,cháng,yí,mù,mén,rèn,fǎn,chào miǎo,yǎng áng,qián,zhòng,pǐ pí,wò,wǔ,jiàn,jià jiè jie,yǎo fó,fēng,cāng,rèn rén,wáng,fèn bīn,dī,fǎng,zhōng,qǐ,pèi,yú,diào,dùn,wěn,yì,xǐn,kàng,yī,jí,ài,wǔ,jì qí,fú,fá,xiū xǔ,jìn yín,pī,dǎn,fū,tǎng,zhòng,yōu,huǒ,huì kuài,yǔ,cuì,yún,sǎn,wěi,chuán zhuàn,chē jū,yá,qiàn,shāng,chāng,lún,cāng chen,xùn,xìn,wěi,zhù,chǐ,xián xuán,nú nǔ,bó bǎi bà,gū gù,nǐ,nǐ nì,xiè,bàn,xù,líng,zhòu,shēn,qū,sì cì,bēng,sì shì,qié jiā gā,pī,yì,sì,yǐ chì,zhēng,diàn tián,hān gàn,mài,dàn,zhù,bù,qū,bǐ,zhāo shào,cǐ,wèi,dī,zhù,zuǒ,yòu,yǎng,tǐ tī bèn,zhàn diān,hé hē hè,bì,tuó,shé,yú,yì dié,fó fú bì bó,zuò,gōu kòu,nìng,tóng,nǐ,xiān,qú,yōng yòng,wǎ,qiān,yòu,kǎ,bāo,pèi,huí huái,gé,lǎo,xiáng,gé,yáng,bǎi,fǎ,mǐng,jiā,èr nài,bìng,jí,hěn,huó,guǐ,quán,tiāo,jiǎo,cì,yì,shǐ,xíng,shēn,tuō,kǎn,zhí,gāi,lái,yí,chǐ,kuǎ,gōng,lì,yīn,shì,mǐ,zhū,xù,yòu,ān,lù,móu,ér,lún,dòng tóng tǒng,chà,chì,xùn,gōng gòng,zhōu,yī,rú,cún jiàn,xiá,sì,dài,lǚ,ta,jiǎo yáo,zhēn,cè zè zhāi,qiáo,kuài,chái,nìng,nóng,jǐn,wǔ,hóu hòu,jiǒng,chěng tǐng,zhèn zhēn,zuò,hào,qīn,lǚ,jú,shù dōu,tǐng,shèn,tuó tuì,bó,nán,xiāo,biàn pián,tuǐ,yǔ,xì,cù,é,qiú,xú,guàng,kù,wù,jùn,yì,fǔ,liáng,zǔ,qiào xiào,lì,yǒng,hùn,jìng,qiàn,sàn,pěi,sú,fú,xī,lǐ,fǔ,pīng,bǎo,yú yù shù,sì qí,xiá,xìn shēn,xiū,yǔ,dì,chē jū,chóu,zhì,yǎn,liǎ,lì,lái,sī,jiǎn,xiū,fǔ,huò,jù,xiào,pái,jiàn,biào,chù tì,fèi,fèng,yà,ǎn,bèi,yù,xīn,bǐ,hǔ chí,chāng,zhī,bìng,jiù,yáo,cuì zú,liǎ,wǎn,lái,cāng,zǒng,gè gě,guān,bèi,tiǎn,shū,shū,mén,dǎo dào,tán tàn,jué juè,chuí,xìng,péng,tǎng cháng,hòu,yǐ,qī,tì,gàn,liàng jìng,jiè,suī,chàng chāng,jié,fǎng,zhí,kōng kǒng,juàn,zōng,jù,qiàn,ní,lún,zhuō,wō wēi,luǒ,sōng,lèng,hùn,dōng,zì,bèn,wǔ,jù,nǎi,cǎi,jiǎn,zhài,yē,zhí,shà,qīng,nìng,yīng,chēng chèn,qián,yǎn,ruǎn,zhòng tóng,chǔn,jiǎ jià,jì jié,wěi,yú,bǐng bìng,ruò,tí,wēi,piān,yàn,fēng,tǎng dàng,wò,è,xié,chě,shěng,kǎn,dì,zuò,chā,tíng,bèi,xiè,huáng,yǎo,zhàn,chǒu qiào,ān,yóu,jiàn,xū,zhā,cī,fù,bī,zhì,zǒng,miǎn,jí,yǐ,xiè,xún,cāi sī,duān,cè zè zhāi,zhēn,ǒu,tōu,tōu,bèi,zá zǎ,lǚ lóu,jié,wěi,fèn,cháng,kuǐ guī,sǒu,zhì sī,sù,xiā,fù,yuàn yuán,rǒng,lì,nù,yùn,jiǎng gòu,mà,bàng,diān,táng,hào,jié,xī xì,shān,qiàn jiān,què jué,cāng chen,chù,sǎn,bèi,xiào,róng,yáo,tà tàn,suō,yǎng,fá,bìng,jiā,dǎi,zài,tǎng,gǔ,bīn,chǔ,nuó,cān càn,lěi,cuī,yōng,zāo cáo,zǒng,péng,sǒng,ào,chuán zhuàn,yǔ,zhài,qī còu,shāng,chuǎng,jìng,chì,shǎ,hàn,zhāng,qīng,yān yàn,dì,xiè,lǚ lóu,bèi,piào biāo,jǐn jìn,liàn,lù,màn,qiān,xiān,tǎn tàn,yíng,dòng,zhuàn,xiàng,shàn,qiáo,jiǒng,tuǐ tuí,zǔn,pú,xī,láo,chǎng,guāng,liáo,qī,chēng dēng,zhàn zhuàn chán,wěi,jī,bō,huì,chuǎn,tiě jiàn,dàn,jiǎo yáo,jiù,sēng,fèn,xiàn,yù jú,è wù wū,jiāo,jiàn,tóng zhuàng,lǐn,bó,gù,xiān,sù,xiàn,jiāng,mǐn,yè,jìn,jià jie,qiào,pì,fēng,zhòu,ài,sài,yí,jùn,nóng,chán tǎn shàn,yì,dāng dàng,jǐng,xuān,kuài,jiǎn,chù,dān dàn,jiǎo,shǎ,zài,càn,bīn bìn,án àn,rú,tái,chóu,chái,lán,nǐ yì,jǐn,qiàn,méng,wǔ,níng,qióng,nǐ,cháng,liè,lěi,lǚ,kuǎng,bào,yù,biāo,zǎn,zhì,sì,yōu,háo,qìng,chèn,lì,téng,wěi,lǒng lóng lòng,chǔ,chán chàn,ráng xiāng,shū,huì xié,lì,luó,zǎn,nuó,tǎng,yǎn,léi,nàng nāng,ér,wù,yǔn,zān,yuán,xiōng,chōng,zhào,xiōng,xiān,guāng,duì ruì yuè,kè,duì ruì yuè,miǎn,tù,cháng zhǎng,ér,duì ruì yuè,ér,qīn,tù,sì,yǎn,yǎn,shǐ,shí kè,dǎng,qiān,dōu,fēn,máo,shēn,dōu,bǎi kè,jīng,lǐ,huǎng,rù,wáng,nèi,quán,liǎng,yú shù,bā,gōng,liù lù,xī,han,lán,gòng gōng,tiān,guān,xīng xìng,bīng,qí jī,jù,diǎn,zī cí,fēn,yǎng,jiān,shòu,jì,yì,jì,chǎn,jiōng,mào,rǎn,nèi nà,yuán,mǎo,gāng,rǎn,cè,jiōng,cè,zài,guǎ,jiǒng,mào,zhòu,mào mò,gòu,xú,miǎn,mì,rǒng,yín yóu,xiě,kǎn,jūn,nóng,yí,mí,shì,guān guàn,měng,zhǒng,zuì,yuān,míng,kòu,lín,fù,xiě,mì,bīng,dōng,tài,gāng,féng píng,bīng,hù,chōng chòng,jué,yà,kuàng,yě,lěng,pàn,fā,mǐn,dòng,xiǎn,liè,qià,jiān,jìng chēng,sōu,měi,tú,qī,gù,zhǔn,sōng,jìng chēng,liáng liàng,qìng,diāo,líng,dòng,gàn,jiǎn,yīn,còu,ái,lì,cāng,mǐng,zhǔn,cuī,sī,duó,jìn,lǐn,lǐn,níng,xī,dú,jī jǐ,fán,fán,fán,fèng,jū,chù chǔ,zhēng,fēng,mù,zhǐ,fú,fēng,píng,fēng,kǎi,huáng,kǎi,gān,dèng,píng,kǎn qiǎn,xiōng,kuài,tū,āo wā,chū,jī,dàng,hán,hán,záo,dāo,diāo,dāo,rèn,rèn,chuāng,fēn fèn,qiē qiè,yì,jī,kān,qiàn,cǔn,chú,wěn,jī,dǎn,xíng,huá huà,wán,jué,lí,yuè,liè,liú,zé,gāng,chuàng chuāng,fú,chū,qù,diāo,shān,mǐn,líng,zhōng,pàn,bié biè,jié,jié,páo bào,lì,shān,bié biè,chǎn chàn,jǐng,guā,gēng,dào,chuàng,kuī,kū,duò,èr,zhì,shuā shuà,quàn xuàn,chà shā,cì cī,kè,jié,guì,cì,guì,kǎi,duò,jì,tì,jǐng,dōu,luǒ,zé,yuān,cuò,xiāo xuē,kēi kè,là lá,qián,chà shā,chuàng,guǎ,jiàn,cuò,lí,tī,fèi,pōu,chǎn chàn,qí,chuàng,zì,gāng,wān,bāo bō,jī,duō,qíng,yǎn shàn,dū zhuó,jiàn,jì,bāo bō,yān,jù,huò,shèng,jiǎn,duó,zhì duān,wū,guǎ,fù pì,shèng,jiàn,gē,dá zhá,kǎi,chuàng chuāng,chuán,chǎn,tuán zhuān,lù jiū,lí,pēng,shān,piāo,kōu,jiǎo chāo,guā,qiāo,jué,huá huà,zhā zhá,zhuó,lián,jù,pī pǐ,liú,guì,jiǎo chāo,guì,jiàn,jiàn,tāng,huō,jì,jiàn,yì,jiàn,zhì,chán,zuān,mó,lí,zhú,lì,yà,quàn,bàn,gōng,jiā,wù,mài,liè,jìn jìng,kēng,xié liè,zhǐ,dòng,zhù chú,nǔ,jié,qú,shào,yì,zhǔ,miǎo,lì,jìn jìng,láo,láo,juàn,kǒu,yáng,wā,xiào,móu,kuāng,jié,liè,hé,shì,kè,jìn jìng,gào,bó bèi,mǐn,chì,láng,yǒng,yǒng,miǎn,kè,xūn,juàn juān,qíng,lù,bù,měng,chì,lè lēi,kài,miǎn,dòng,xù,xù,kān,wù,yì,xūn,wěng yǎng,shèng,láo,mù,lù,piāo,shì,jì,qín,jiàng,jiǎo chāo,quàn,xiàng,yì,qiāo,fān,juān,tóng dòng,jù,dān,xié,mài,xūn,xūn,lǜ,lì,chè,ráng xiāng,quàn,bāo,sháo,yún,jiū,bào,gōu gòu,wù,yún,none,xiōng,gài,gài,bāo,cōng,yì,xiōng,pēng,jū,táo yáo,gé,pú,è,páo,fú,gōng,dá,jiù,gōng,bǐ,huà huā,běi bèi,nǎo,chí shi,fāng,jiù,yí,zā,jiàng,kàng,jiàng,kuāng,hū,xiá,qū,fán,guǐ,qiè,zāng cáng,kuāng,fěi,hū,yǔ,guǐ,kuì guì,huì,dān,kuì guì,lián,lián,suǎn,dú,jiù,jué,xì,pǐ,qū ōu,yī,kē qià,yǎn yàn,biǎn,nì,qū ōu,shí,xùn,qiān,niàn,sà,zú,shēng,wǔ,huì,bàn,shì,xì,wàn,huá huà huā,xié,wàn,bēi,zú cù,zhuó,xié,dān shàn chán,mài,nán nā,dān,jí,bó,shuài lǜ,bǔ bo,guàn kuàng,biàn,bǔ,zhān zhàn,qiǎ kǎ,lú,yǒu,lǔ,xī,guà,wò,xiè,jié,jié,wèi,yǎng áng,qióng,zhī,mǎo,yìn,wēi,shào,jí,què,luǎn,chǐ,juàn juǎn,xiè,xù,jǐn,què,wù,jí,è,qīng,xī,sān,chǎng ān hàn,wēi yán,è,tīng,lì,zhé zhái,hàn àn,lì,yǎ,yā yà,yàn,shè,dǐ,zhǎ zhǎi,páng,none,qiè,yá,zhì shī,cè,máng,tí,lí,shè,hòu,tīng,zuī,cuò,fèi,yuán,cè,yuán,xiāng,yǎn,lì,jué,shà xià,diān,chú,jiù,jǐn,áo,guǐ,yàn,sī,lì,chǎng,qiān lán,lì,yán,yǎn,yuán,sī mǒu,gōng hóng,lín miǎo,róu qiú,qù,qù,none,lěi,dū,xiàn xuán,zhuān,sān,cān shēn cēn sān,cān shēn cēn sān,cān shēn cēn sān,cān shēn cēn sān,ài yǐ,dài,yòu,chā chá chǎ,jí,yǒu,shuāng,fǎn,shōu,guái,bá,fā fà,ruò,lì,shū,zhuó yǐ lì jué,qǔ,shòu,biàn,xù,jiǎ,pàn,sǒu,jí,wèi yù,sǒu,dié,ruì,cóng,kǒu,gǔ,jù gōu,lìng,guǎ,tāo dāo,kòu,zhī zhǐ,jiào,zhào shào,bā,dīng,kě kè,tái tāi,chì,shǐ,yòu,qiú,pǒ,yè xié,hào háo,sī,tàn,chǐ,lè,diāo,jī,none,hōng hóng,miē,xū yù,máng,chī,gè gě,xuān sòng,yāo,zǐ,hé gě,jí,diào,dòu cùn,tóng tòng,míng,hòu,lì,tǔ tù,xiàng,zhà zhā,xià hè,yē,lǚ,yā ā,ma má mǎ,ǒu,huō,yī,jūn,chǒu,lìn,tūn,yín,fèi,pǐ bǐ,qìn,qìn,jiè gè,bù,fǒu pǐ,bā ba,dūn,fēn,é huā,hán,tīng,háng kēng,shǔn,qǐ,hóng,zhī zī,yǐn shěn,wú,wú,chǎo chāo,nà nè,xuè chuò jué,xī,chuī,dōu rú,wěn,hǒu,hǒu hōng ōu,wú yù,gào,yā ya,jùn,lǚ,è,gé,wěn,dāi,qǐ,chéng,wú,gào,fū,jiào,hōng,chǐ,shēng,nà nè,tūn tiān,fǔ,yì,dāi,ǒu ōu òu,lì,bei bài,yuán yún yùn,wā guǎ guō,huá qì,qiāng qiàng,wū,è,shī,juǎn,pěn,wěn mǐn,ní ne,m,líng,rán,yōu,dǐ,zhōu,shì,zhòu,tiè chè,xì,yì,qì zhī,píng,zǐ cī,guā gū guǎ,zī cī,wèi,xǔ hǒu gòu,hē a kē,náo,xiā,pēi,yì,xiāo háo,shēn,hū,mìng,dá dàn,qū,jǔ zuǐ,xián gān,zā,tuō,duō,pǒu,páo,bì,fú,yǎng,hé hè,zǎ zé zhā,hé hè huó huò hú,hāi,jiù,yǒng,fù,dā,zhòu,wǎ,kǎ,gū,kā gā,zuo,bù,lóng,dōng,níng,tuō,sī,xiàn xián,huò,qì,èr,è,guāng,zhà,dié xī,yí,liě liē lié lie,zī,miē,mī,zhǐ,yǎo,jī xī qià,zhòu,kǎ luò gē,shù xún,zá zǎ,xiào,ké hāi,huī,kuā,huài shì,táo,xián,è àn,xuǎn xuān,xiū,wā guǎ guō,yān yàn yè,lǎo,yī,āi,pǐn,shěn,tóng,hōng hǒng hòng,xiōng,duō,wā wa,hā hǎ hà,zāi,yòu,diè dì,pài,xiǎng,āi,gén hěn,kuāng,yǎ yā,dā,xiāo,bì,yuě huì,nián,huá huā,xíng,kuài,duǒ,fēn,jì jiē zhāi,nóng,mōu,yō yo,hào,yuán yún yùn,lòng,pǒu,máng,gē,ó ò é,chī,shào,li lǐ lī,nǎ něi na né,zú,hè,kū,xiào,xiàn,láo,pò bā bō,zhé,zhā,liàng láng,bā,miē,liè lǜ,suī,fú,bǔ,hān,hēng,gěng,chuò yuè,gě jiā,yòu,yàn,gū,gū,bei bài,hán hàn,suō,chún,yì,āi ài,jiá qiǎn,tǔ tù,dàn xián yán,wǎn,lì,xī,táng,zuò,qiú,chē,wù wú ń,zào,yǎ,dōu,qǐ,dí,qìn,mà,none,gòng hǒng gǒng,dǒu,none,lào láo,liǎng,suǒ,zào,huàn,léng,shā,jī,zǔ,wō wěi,fěng,jìn yín,hǔ xià,qì,shòu,wéi,shuā,chàng,ér wā,lì,qiàng,ǎn,jiè zé jí,yō,niàn,yū,tiǎn,lài,shà,xī,tuò,hū,ái,zhōu zhāo tiào,gòu,kěn,zhuó,zhuó zhào,shāng,dí,hèng,lán lín,a ā á ǎ à,cǎi,qiāng,zhūn tūn xiāng duǐ,wǔ,wèn,cuì qi,shà jié dié tì,gǔ,qǐ,qǐ,táo,dàn,dàn,yuē wā,zǐ cǐ,bǐ tú,cuì,chuò chuài,hé,yǎ yā,qǐ,zhé,fēi,liǎng,xián,pí,shá,lā la,zé,qíng yīng,guà,pā,zé shì,sè,zhuàn,niè,guō,luō luó luo,yán,dī,quán,tān chǎn tuō,bo,dìng,lāng,xiào,none,táng,chì,tí,ān án,jiū,dàn,kā,yóng,wèi,nán,shàn,yù,zhé,lǎ,jiē,hóu,hǎn,dié zhá,zhōu,chái,wāi,nuò rě,huò guó xù,yīn,zá zǎ,yāo,ō wō,miǎn,hú,yǔn,chuǎn,huì,huàn,huàn yuán xuǎn hé,xǐ,hē hè yè,jī,kuì,zhǒng chuáng,wéi wèi,shà,xǔ,huáng,duó zhà,yán,xuān,liàng,yù,sāng sàng,chī,qiáo jiāo,yàn,dān shàn chán,pèn bēn,cān sūn qī,lí,yō yo,zhā chā,wēi,miāo,yíng,pēn pèn,bǔ,kuí,xí,yù,jiē,lóu lou,kù,zào qiāo,hù,tí,yáo,hè xiāo xiào hù,shà á,xiù,qiāng qiàng,sè,yōng,sù,gòng hǒng gǒng,xié,yì ài,suō,má mǎ ma,chā,hài,kē kè,tà dā,sǎng,chēn,rù,sōu,wā gǔ,jī,bēng pǎng,wū,xián qiàn qiè,shì,gé,zī,jiē,lào,wēng,wà,sì,chī,háo,suō,jiā lún,hāi hēi,suǒ,qín,niè,hē,zi,sǎi,ň,gě,ná,diǎ,ǎi ài āi,qiāng,tōng,bì,áo,áo,lián,zuī suī,zhē zhè zhù zhe,mò,sòu,sǒu,tǎn,dí,qī,jiào,chōng,jiào dǎo,kǎi gě,tàn,shān càn,cáo,jiā,ái,xiào,piāo,lóu lou,gā gá gǎ,gǔ,xiāo jiāo,hū,huì,guō,ǒu,xiān,zé,cháng,xū shī,pó,dē dēi,ma má,mà,hú,lei lē,dū,gā gá gǎ,tāng,yě,bēng,yīng,sāi,jiào,mì,xiào,huá huā,mǎi,rán,zuō,pēng,lào láo,xiào,jī,zhǔ,cháo zhāo,kuì,zuǐ,xiāo,sī,háo,fǔ ,liáo,qiáo qiào,xī,chù xù shòu,tān chǎn,dàn tán,hēi mò,xùn,ě,zūn,fān bo,chī,huī,zǎn,chuáng,cù zā hé,dàn,jué,tūn kuò,cēng,jiào,yē,xī,qì,háo,lián,xū shī,dēng,huī,yín,pū,juē,qín,xún,niè,lū,sī,yǎn,yīng,dā,zhān,ō,zhòu zhuó,jìn,nóng,yuě huì,xiè,qì,è,zào,yī,shì,jiào qiào chī,yuàn,ǎi ài āi,yōng yǒng,jué xué,kuài,yǔ,pēn pèn,dào,gá,xīn hěn hèn,dūn,dāng,xīn,sāi,pī,pǐ,yīn,zuǐ,níng,dí,làn,tà,huò ǒ,rú,hāo,hè xià,yàn,duō,xiù pì,zhōu chóu,jì jiē zhāi,jìn,háo,tì,cháng,xūn,mē,cā chā,tì,lū,huì,bó pào bào,yōu,niè,yín,hù,mèi me mò,hōng,zhé,lí,liú,xié hái,náng,xiāo,mō,yàn,lì,lú,lóng,pó,dàn,chèn,pín,pǐ,xiàng,huò,mè,xī,duǒ,kù,yán,chán,yīng,rǎng rāng,diǎn,lá,tà,xiāo,jiáo jué jiào,chuò,huàn huān,huò,zhuàn,niè,xiāo,zá cà,lí,chǎn,chài,lì,yì,luō luó luo,náng nāng,zá zàn cān,sū,xǐ,zèng,jiān,yàn zá niè,zhǔ,lán,niè,nāng,lǎn,luó luō luo,wéi guó,huí,yīn,qiú,sì,nín,jiǎn nān,huí,xìn,yīn,nān,tuán,tuán,dùn tún,kàng,yuān,jiǒng,piān,yún,cōng,hú,huí,yuán,é,guó,kùn,cōng,wéi tōng,tú,wéi,lún,guó,qūn,rì,líng,gù,guó,tāi,guó,tú,yòu,guó,yín,hùn,pǔ,yǔ,hán,yuán,lún,quān juàn juān,yǔ,qīng,guó,chuán chuí,wéi,yuán,quān juàn juān,kū,pǔ,yuán,yuán,yà,tuān,tú,tú,tuán,lüè,huì,yì,huán yuán,luán,luán,tǔ,yà,tǔ,tǐng,shèng,pú,lù,kuài,yā,zài,wéi xū,gē,yù zhūn,wū,guī,pǐ,yí,dì de,qiān sú,qiān,zhèn,zhuó,dàng,qià,xià,shān,kuàng,cháng chǎng,qí yín,niè,mò,jī,jiá,zhǐ,zhǐ zhì,bǎn,xūn,yì,qǐn,méi fén,jūn,rǒng kēng,tún dùn,fāng fáng,bèn fèn,bèn,tān,kǎn,huài pēi pī péi,zuò,kēng,bì,jǐng,dì làn,jīng,jì,kuài,dǐ,jīng,jiān,tán,lì,bà,wù,fén,zhuì,pō,pǎn bàn,táng,kūn,qū,tǎn,zhǐ,tuó,gān,píng,diàn,guà,ní,tái,pī,jiōng,yǎng,fó,ào,lù,qiū,mù mǔ,kē kě,gòu,xuè,fá,dǐ chí,chè,líng,zhù,fù,hū,zhì,chuí,lā,lǒng,lǒng,lú,ào,dài,páo,mín,xíng,dòng tóng,jì,hè,lǜ,cí,chǐ,lěi,gāi,yīn,hòu,duī,zhào,fú,guāng,yáo,duǒ duò,duǒ duò,guǐ,chá,yáng,yín,fá,gòu,yuán,dié,xié,kěn,shǎng,shǒu,è,bìng,diàn,hóng,yà,kuǎ,dá,kǎ,dàng,kǎi,háng,nǎo,ǎn,xīng,xiàn,yuàn huán,bāng,póu fú,bà,yì,yìn,hàn,xù,chuí,cén,gěng,āi,běng fēng,dì fáng,què jué,yǒng,jùn,xiá jiā,dì,mái mán,làng,juǎn,chéng,yán shān,qín jīn,zhé,liè,liè,pǔ bù,chéng,huā,bù,shí,xūn,guō,jiōng,yě,niàn,dī,yù,bù,yà,quán,suì sù,pí pì,qīng zhēng,wǎn wān,jù,lǔn,zhēng chéng,kōng,chǒng shǎng,dōng,dài,tán tàn,ǎn,cǎi cài,chù tòu,běng,xiàn kǎn,zhí,duǒ,yì shì,zhí,yì,péi,jī,zhǔn,qí,sào sǎo,jù,ní,kū,kè,táng,kūn,nì,jiān,duī,jīn,gāng,yù,è,péng bèng,gù,tù,lèng líng,fāng,yá,qiàn zàn jiàn,kūn,àn,shēn,duò huī,nǎo,tū,chéng,yīn,huán,bì,liàn,guō,dié,zhuàn,hòu,bǎo bǔ pù,bǎo,yú,dī,máo móu wǔ,jiē,ruán,è ài yè,gèng,kān,zōng,yú,huáng,è,yáo,yàn,bào,jí,méi,cháng chǎng,dǔ,tuó,yìn,féng,zhòng,jiè,jīn,fēng,gāng,chuǎn,jiǎn,píng,lěi,jiǎng,huāng,léng,duàn,wān,xuān,jì,jí,kuài,yíng,tā,chéng,yǒng,kǎi,sù,sù,shí,mì,tǎ,wěng,chéng,tú,táng,què,zhǒng,lì,péng,bàng,sāi sài sè,zàng,duī,tián,wù,zhèng,xūn,gé,zhèn,ài,gōng,yán,xiàn,tián zhèn,yuán,wēn,xiè,liù,hǎi,lǎng,cháng chǎng,péng,bèng,chén,lù,lǔ,ōu qiū,qiàn zàn jiàn,méi,mò,zhuān tuán,shuǎng,shú,lǒu,chí,màn,biāo,jìng,qī,shù,zhì dì,zhàng,kàn,yōng,diàn,chěn,zhǐ zhuó,xì,guō,qiǎng,jìn,dì,shāng,mù,cuī,yàn,tǎ,zēng,qián,qiáng,liáng,wèi,zhuì,qiāo,zēng,xū,shàn,shàn,fá,pú,kuài tuí,tuǎn dǒng,fán,qiáo què,mò,dūn,dūn,zūn dūn,dì,shèng,duò huī,duò,tán,dèng,wú,fén,huáng,tán,dā,yè,zhù,jiàn,ào,qiáng,jī,qiāo áo,kěn,yì tú,pí,bì,diàn,jiāng,yě,yōng,xué bó jué,tán,lǎn,jù,huài,dàng,rǎng,qiàn,xūn,xiàn làn,xǐ,hè,ài,yā yà,dǎo,háo,ruán,jìn,lěi,kuàng,lú,yán,tán,wéi,huài,lǒng,lǒng,ruǐ,lì,lín,rǎng,chán,xūn,yán,lěi,bà,wān,shì,rén,san,zhuàng,zhuàng,shēng,yī,mài,ké qiào,zhù,zhuàng,hú,hú,kǔn,yī,hú,xù,kǔn,shòu,mǎng,cún,shòu,yī,zhǐ zhōng,gǔ yíng,chǔ chù,jiàng xiáng,féng fēng páng,bèi,zhāi,biàn,suī,qūn,líng,fù,cuò,xià,xiòng xuàn,xiè,náo,xià,kuí,xī,wài,yuàn wǎn wān yuān,mǎo wǎn,sù,duō,duō,yè,qíng,wài,gòu,gòu,qì,mèng,mèng,yín,huǒ,chěn,dà dài tài,cè,tiān,tài,fū fú,guài,yāo,yāng,hāng bèn,gǎo,shī,tāo běn,tài,tóu tou,yǎn tāo,bǐ,yí,kuā kuà,jiā jiá gā xiá,duó,huà,kuǎng,yǔn,jiā jiá gā xiá,bā,ēn,lián,huàn,dī tì,yǎn yān,pào,juàn,qí jī,nài,fèng,xié,fèn,diǎn,quān juàn,kuí,zòu,huàn,qì qiè xiè,kāi,shē chǐ zhà,bēn bèn,yì,jiǎng,tào,zàng zhuǎng,běn,xī,huǎng,fěi,diāo,xùn zhuì,bēng,diàn,ào,shē,wěng,pò hǎ tǎi,ào yù,wù,ào yù,jiǎng,lián,duó,yūn,jiǎng,shì,fèn,huò,bì,luán,duǒ chě,nǚ rǔ,nú,dǐng dīng tiǎn,nǎi,qiān,jiān,tā jiě,jiǔ,nuán,chà,hǎo hào,xiān,fàn,jǐ,shuò,rú,fēi pèi,wàng,hóng,zhuāng,fù,mā,dān,rèn,fū yōu,jìng,yán,hài jiè,wèn,zhōng,pā,dù,jì,kēng háng,zhòng,yāo,jìn,yún,miào,fǒu pēi pī,chī,yuè jué,zhuāng,niū,yàn,nà nàn,xīn,fén,bǐ,yú,tuǒ,fēng,wàn yuán,fáng,wǔ,yù,guī,dù,bá,nī,zhóu,zhuó,zhāo,dá,nǐ nǎi,yuàn,tǒu,xián xuán xù,zhí yì,ē,mèi,mò,qī qì,bì,shēn,qiè,ē,hé,xǔ xū,fá,zhēng,mín,bàn,mǔ,fū fú,líng,zǐ,zǐ,shǐ,rǎn,shān shàn,yāng,mán,jiě,gū,sì,xìng,wěi wēi,zī,jù,shān shàn,pīn,rèn,yáo,dòng,jiāng,shū,jí,gāi,xiàng,huá huó,juān,jiāo xiáo,gòu dù,mǔ lǎo,jiān,jiān,yí,nián niàn,zhí,zhěn,jī,xiàn,héng,guāng,jūn xún,kuā hù,yàn,mǐng,liè,pèi,è yà,yòu,yán,chà,shēn xiān,yīn,shí,guǐ,quán,zī,sōng,wēi,hóng,wá,lóu,yà,ráo rǎo,jiāo,luán,pīng,xiàn,shào shāo,lǐ,chéng shèng,xiē,máng,fū,suō,wǔ mǔ,wěi,kè,chuò lài,chuò,tǐng,niáng,xíng,nán,yú,nà nuó,pōu bǐ,něi suī,juān,shēn,zhì,hán,dì,zhuāng,é,pín,tuì,mǎn,miǎn,wú wù yú,yán,wǔ,xī āi,yán,yú,sì,yú,wā,lì,xián,jū,qǔ,zhuì shuì,qī,xián,zhuó,dōng dòng,chāng,lù,ǎi ái è,ē ě,ē,lóu,mián,cóng,pǒu péi bù,jú,pó,cǎi,líng,wǎn,biǎo,xiāo,shū,qǐ,huī,fù fàn,wǒ,wǒ,tán,fēi,fēi,jié,tiān,ní nǐ,quán juàn,jìng,hūn,jīng,qiān jǐn,diàn,xìng,hù,wān wà,lái lài,bì,yīn,zhōu chōu,chuò nào,fù,jìng,lún,nüè,lán,hùn kūn,yín,yà,jū,lì,diǎn,xián,huā,huà,yīng,chán,shěn,tíng,dàng yáng,yǎo,wù,nàn,ruò chuò,jiǎ,tōu yú,xù,yù yú,wéi wěi,dì tí,róu,měi,dān,ruǎn nèn,qīn,huī,wò,qián,chūn,miáo,fù,jiě,duān,yí pèi,zhòng,méi,huáng,mián miǎn,ān,yīng,xuān,jiē,wēi,mèi,yuàn yuán,zhēng,qiū,tí,xiè,tuó duò,liàn,mào,rǎn,sī,piān,wèi,wā,cù,hú,ǎo,jié,bǎo,xū,tōu yú,guī,chú zòu,yáo,pì,xí,yuán,yìng,róng,rù,chī,liú,měi,pán,ǎo,mā,gòu,kuì,qín shēn,jià,sǎo,zhēn zhěn,yuán,jiē suǒ,róng,míng mǐng,yīng,jí,sù,niǎo,xián,tāo,páng,láng,nǎo,biáo,ài,pì,pín,yì,piáo piāo,yù,léi,xuán,màn,yī,zhāng,kāng,yōng,nì,lí,dí,guī,yān,jǐn jìn,zhuān,cháng,zé,hān nǎn,nèn,lào,mó,zhē,hù,hù,ào,nèn,qiáng,mā má,piè,gū,wǔ,qiáo,tuǒ,zhǎn,miáo,xián,xián,mò,liáo,lián,huà,guī,dēng,zhí,xū,yī,huà,xī,kuì,ráo rǎo,xī,yàn,chán,jiāo,měi,fàn,fān,xiān yǎn jìn,yì,huì,jiào,fù,shì,bì,shàn,suì,qiáng,liǎn,huán xuān qióng,xīn,niǎo,dǒng,yǐ,cān,ài,niáng,níng,mó,tiǎo,chóu,jìn,cí,yú,pín,róng,rú,nǎi,yān yàn,tái,yīng,qiàn,niǎo,yuè,yíng,mián,bí,mó,shěn,xìng,nì,dú,liǔ,yuān,lǎn,yàn,shuāng,líng,jiǎo,niáng,lǎn,xiān qiān,yīng,shuāng,xié huī,huān quán,mǐ,lí lì,luán,yǎn,zhú chuò,lǎn,zǐ,jié,jué,jué,kǒng,yùn,zī mā,zì,cún,sūn xùn,fú,bèi,zī,xiào,xìn,mèng,sì,tāi,bāo,jì,gū,nú,xué,yòu niū,zhuǎn,hái,luán,sūn xùn,nāo,miē,cóng,qiān,shú,chán càn,yā,zī,nǐ,fū,zī,lí,xué,bò,rú,nái,niè,niè,yīng,luán,mián,níng nìng zhù,rǒng,tā,guǐ,zhái,qióng,yǔ,shǒu,ān,tū jiā,sòng,wán,ròu,yǎo,hóng,yí,jǐng,zhūn,mì fú,zhǔ,dàng,hóng,zōng,guān,zhòu,dìng,wǎn yuān,yí,bǎo,shí,shí,chǒng,shěn,kè,xuān,shì,yòu,huàn,yí,tiǎo,shǐ,xiàn,gōng,chéng,qún,gōng,xiāo,zǎi,zhà,bǎo shí,hài,yàn,xiāo,jiā jia jie,shěn,chén,róng,huāng huǎng,mì,kòu,kuān,bīn,sù xiǔ xiù,cǎi cài,zǎn,jì,yuān,jì,yín,mì,kòu,qīng,hè,zhēn,jiàn,fù,níng nìng,bǐng bìng,huán,mèi,qǐn,hán,yù,shí,níng nìng,jìn qǐn,níng nìng,zhì,yǔ,bǎo,kuān,níng nìng,qǐn,mò,chá,jù lóu,guǎ,qǐn,hū,wù,liáo,shí,níng nìng,zhài,shěn,wěi,xiě xiè,kuān,huì,liáo,jùn,huán,yì,yí,bǎo,qīn qìn,chǒng,bǎo,fēng,cùn,duì,sì,xún,dǎo,lüè luó,duì,shòu,pǒ,fēng,zhuān,fū,shè yè yì,kēi kè,jiāng jiàng,jiāng jiàng,zhuān,wèi yù,zūn,xún,shù zhù,duì,dǎo,xiǎo,jié jí,shǎo shào,ěr,ěr,ěr,gǎ,jiān,shú,chén,shàng,shàng,mó,gá,cháng,liáo,xiǎn,xiǎn,hùn,yóu,wāng,yóu,liào,liào,yáo,lóng máng méng páng,wāng,wāng,wāng,gà,yáo,duò,kuì kuǐ,zhǒng,jiù,gān,gǔ,gān,tuí,gān,gān,shī,yǐn,chǐ chě,kāo,ní,jìn jǐn,wěi yǐ,niào suī,jú,pì,céng,xì,bī,jū,jiè,tián,qū,tì,jiè,wū,diǎo,shī,shǐ,píng bǐng,jī,xiè,zhěn,xì,ní,zhǎn,xī,wěi,mǎn,ē,lòu,pǐng bǐng,tì,fèi,shǔ zhǔ,xiè tì,tú,lǚ,lǚ,xǐ,céng,lǚ,jù,xiè,jù,juē,liáo,juē,shǔ zhǔ,xì,chè cǎo,tún zhūn,nì jǐ,shān,wā,xiān,lì,àn,huì,huì,hóng lóng,yì,qǐ,rèn,wù,hàn àn,shēn,yǔ,chū,suì,qǐ kǎi,none,yuè,bǎn,yǎo,áng,yá,wù,jié,è,jí,qiān,fén,wán,qí,cén,qián,qí,chà,jiè,qū,gǎng,xiàn,ào,lán,dǎo,bā,zuò,zuò,yǎng,jù,gāng,kě,gǒu,xuè,pō,lì,tiáo,jū jǔ,yán,fú,xiù,jiǎ,lǐng líng,tuó,pī,ào,dài,kuàng,yuè,qū,hù,pò,mín,àn,tiáo,lǐng líng,dī,píng,dōng,zhān,kuī,xiù,mǎo,tóng,xué,yì,biàn,hé,kè bā,luò,é,fù niè,xún,dié,lù,ěn,ér,gāi,quán,tóng dòng,yí,mǔ,shí,ān,wéi,huán,zhì shì,mì,lǐ,fǎ,tóng,wéi,yòu,qiǎ,xiá,lǐ,yáo,jiào qiáo,zhēng,luán,jiāo,é,é,yù,xié yé,bū,qiào,qún,fēng,fēng,náo,lǐ,yōu,xiàn,róng,dǎo,shēn,chéng,tú,gěng,jùn,gào,xiá,yín,wú,lǎng,kàn,láo,lái,xiǎn,què,kōng,chóng,chóng,tà,lín,huà,jū,lái,qí,mín,kūn,kūn,zú cuì,gù,cuī,yá,yá,gǎng gāng,lún,lún,líng léng,jué,duǒ,zhēng,guō,yín,dōng dòng,hán,zhēng,wěi,xiáo,pí bǐ,yān,sōng,jié,bēng,zú,jué,dōng,zhǎn chán,gù,yín,zī,zè,huáng,yú,wǎi wēi,yáng dàng,fēng,qiú,yáng,tí,yǐ,zhì shì,shì dié,zǎi,yǎo,è,zhù,kān zhàn,lǜ,yǎn,měi,hán,jī,jī,huàn,tíng,shèng,méi,qiàn kàn,wù máo,yú,zōng,lán,kě jié,yán,yán,wēi wěi,zōng,chá,suì,róng,kē,qīn,yú,qí,lǒu,tú,cuī,xī,wěng,cāng,dàng táng,róng yíng,jié,kǎi ái,liú,wù,sōng,kāo qiāo,zī,wéi,bēng,diān,cuó,qīn qiǎn,yǒng,niè,cuó,jǐ,shí,ruò,sǒng,zǒng,jiàng,liáo,kāng,chǎn,dié dì,cēn,dǐng,tū,lǒu,zhàng,zhǎn chán,zhǎn chán,áo ào,cáo,qū,qiāng,wěi,zuǐ,dǎo,dǎo,xí,yù,pǐ pèi,lóng,xiàng,céng,bō,qīn,jiāo,yān,láo,zhàn,lín,liáo,liáo,qín,dèng,tuò,zūn,jiào qiáo,jué guì,yáo,jiāo,yáo,jué,zhān shàn,yì,xué,náo,yè,yè,yí,niè,xiǎn,jí,xiè jiè,kě jié,guī xī juàn,dì,ào,zuì,wēi,yí,róng,dǎo,lǐng,jié,yǔ,yuè,yǐn,rū,jié,lì liè,guī xī juàn,lóng,lóng,diān,yíng hōng,xī,jú,chán,yǐng,kuī,yán,wēi,náo,quán,chǎo,cuán,luán,diān,diān,niè,yán,yán,yǎn,kuí,yǎn,chuān,kuài,chuān,zhōu,huāng,jīng xíng,xún,cháo,cháo,liè,gōng,zuǒ,qiǎo,jù,gǒng,none,wū,gū,gū,chà chā chāi cī,qiú,qiú,jǐ,yǐ,sì,bā,zhī,zhāo,xiàng hàng,yí,jǐn,xùn,juàn juǎn,bā,xùn,jīn,fú,zā,bì,shì,bù,dīng,shuài,fān,niè,shī,fēn,pà,zhǐ,xī,hù,dàn,wéi,zhàng,tǎng nú,dài,mò wà,pèi,pà,tiè tiě tiē,fú,lián,zhì,zhǒu,bó,zhì,dì,mò,yì,yì,píng,qià,juàn juǎn,rú,shuài,dài,zhēn,shuì,qiāo,zhēn,shī,qún,xí,bāng,dài,guī,chóu dào,píng,zhàng,jiǎn jiān sàn,wān,dài,wéi,cháng,shà qiè,qí jì,zé,guó,mào,zhǔ,hóu,zhēn,zhèng,mì,wéi,wò,fú,yì,bāng,píng,dié,gōng,pán,huǎng,tāo,mì,jià,téng,huī,zhōng,shān qiāo shēn,màn,mù,biāo,guó,zé,mù,bāng,zhàng,jǐng,chǎn chàn,fú,zhì,hū,fān,chuáng zhuàng,bì,bì,zhǎng,mì,qiāo,chān chàn,fén,méng,bāng,chóu dào,miè,chú,jié,xiǎn,lán,gān gàn,píng,nián,jiān,bìng bīng,bìng bīng,xìng,gàn,yāo,huàn,yòu,yōu,jī jǐ,guǎng ān,pǐ,tīng,zè,guǎng,zhuāng,mó mā me,qìng,bì,qín,dùn tún,chuáng,guǐ,yǎ,bài tīng,jiè,xù,lú,wǔ,zhuāng,kù,yīng yìng,dǐ de,páo,diàn,yā,miào,gēng,cì,fǔ,tóng,páng,fèi,xiáng,yǐ,zhì,tiāo,zhì,xiū,dù duó,zuò,xiāo,tú,guǐ,kù,máng méng páng,tíng,yóu,bū,bìng píng,chěng,lái,bēi,jī cuò,ān,shù,kāng,yōng,tuǒ,sōng,shù,qǐng,yù,yǔ,miào,sōu,cè,xiāng,fèi,jiù,è,guī wěi huì,liù,shà xià,lián,láng,sōu,zhì,bù,qǐng,jiù,jiù,jǐn qín,áo,kuò,lóu,yìn,liào,dài,lù,yì,chú,chán,tú,sī,xīn,miào,chǎng,wǔ,fèi,guǎng,kù,kuài,bì,qiáng sè,xiè,lǐn,lǐn,liáo,lú,jì,yǐng,xiān,tīng,yōng,lí,tīng,yǐn yìn,xún,yán,tíng,dí,pò pǎi,jiàn,huí,nǎi,huí,gǒng,niàn,kāi,biàn,yì,qì,nòng lòng,fèn,jǔ,yǎn,yì,zàng,bì,yì,yī,èr,sān,shì,èr,shì,shì,gōng,diào,yǐn,hù,fú,hóng,wū,tuí,chí,jiàng,bà,shěn,dì tì tuí,zhāng,jué zhāng,tāo,fǔ,dǐ,mí mǐ,xián,hú,chāo,nǔ,jìng,zhěn,yi,mǐ,juàn quān,wān,shāo,ruò,xuān yuān,jìng,diāo,zhāng,jiàng,qiáng qiǎng jiàng,péng,dàn tán,qiáng qiǎng jiàng,bì,bì,shè,dàn tán,jiǎn,gòu,gē,fā,bì,kōu,jiǎn,biè,xiāo,dàn tán,guō,qiáng qiǎng jiàng,hóng,mí mǐ,guō,wān,jué,jì xuě,jì,guī,dāng dàng,lù,lù,tuàn,huì,zhì,huì,huì,yí,yí,yí,yí,huò,huò,shān xiǎn,xíng,wén,tóng,yàn,yàn,yù,chī,cǎi,biāo,diāo,bīn,péng bāng,yǒng,piāo piào,zhāng,yǐng,chī,chì,zhuó bó,tuǒ yí,jí,páng fǎng,zhōng,yì,wǎng,chè,bǐ,dī,líng,fù,wǎng,zhēng,cú,wǎng,jìng,dài dāi,xī,xùn,hěn,yáng,huái,lǜ,hòu,wàng jiā wā,chěng zhèng,zhì,xú,jìng,tú,cóng,cóng,lài lái,cóng,dé děi de,pái,xǐ,dōng,jì,cháng,zhì,cóng zòng,zhōu,lái lài,yù,xiè,jiè,jiàn,shì tǐ,jiǎ xiá,biàn,huáng,fù,xún,wěi,páng,yáo,wēi,xī,zhēng,piào,tí chí,dé,zhǐ zhēng,zhǐ zhēng,bié,dé,zhǒng chōng,chè,jiǎo yáo,huì,jiǎo jiào,huī,méi,lòng lǒng,xiāng,bào,qú jù,xīn,xīn,bì,yì,lè,rén,dāo,dìng tìng,gǎi,jì,rěn,rén,chàn,tǎn,tè,tè tuī,gān hàn,yì qì,shì tài,cǔn,zhì,wàng,máng,xī liě,fān,yīng yìng,tiǎn,mǐn wěn mín,mǐn wěn mín,zhōng,chōng,wù,jí,wǔ,xì,jiá,yōu,wán,cōng,sōng zhōng,kuài,yù shū,biàn,zhì,qí shì,cuì,chén,tài,tún zhūn dùn,qián qín,niàn,hún,xiōng,niǔ,kuáng wǎng,xiān,xīn,kāng hàng,hū,kài xì,fèn,huái,tài,sǒng,wǔ,òu,chàng,chuàng,jù,yì,bǎo bào,chāo,mín mén,pēi,zuò zhà,zěn,yàng,kòu jù,bàn,nù,náo niú,zhēng,pà,bù,tiē zhān,hù gù,hù,cū jù zū,dá,lián,sī sāi,yóu chóu,dì,dài,yí,tū dié,yóu,fū,jí,pēng,xìng,yuàn,ní,guài,fú,xì,bì,yōu yào,qiè,xuàn,cōng,bǐng,huǎng,xù xuè,chù,bì pī,shù,xī shù,tān,yǒng,zǒng,duì,mì,zhǐ,yì,shì,nèn nín,xún,shì,xì,lǎo,héng,kuāng,móu,zhǐ,xié,liàn,tiāo yáo,huǎng,dié,hào,kǒng,guǐ,héng,xī qī xù,xiào jiǎo,shù,sī,hū kuā,qiū,yàng,huì,huí,chì,jiá,yí,xiōng,guài,lìn,huī,zì,xù,chǐ,shàng,nǜ,hèn,ēn,kè,dòng,tián,gōng,quán zhuān,xī,qià,yuè,pēng,kěn,dé,huì,è wù ě wū,qiū,tòng,yān,kǎi,cè,nǎo,yùn,máng,yǒng,yǒng,yuān juàn,pī pǐ,kǔn,qiǎo qiāo,yuè,yù shū,tú,jiè kè,xī,zhé,lìn,tì,hàn,hào jiào,qiè,tì,bù,yì,qiàn,huǐ,xī,bèi,mán mèn,yī yì,hēng hèng,sǒng,quān,chěng,kuī lǐ,wù,wù,yōu,lí,liàng,huàn,cōng,yì niàn,yuè,lì,nín,nǎo,è,què,xuán,qiān,wù,mǐn,cóng,fěi,bēi,dé,cuì,chàng,mèn mēn,lì,jì,guàn,guàn,xìng,dào,qī,kōng kǒng,tiǎn,lǔn lùn,xī,kǎn,gǔn,nì,qíng,chóu,dūn,guǒ,zhān,jīng,wǎn,yuān wǎn,jīn,jì,lán lín,yù xù,huò,hé hè,juàn quán,tán dàn,tì,tì,niàn,wǎng,chuò chuì,hū,hūn mèn,xī,chǎng,xīn,wéi,huì,è wù ě wū,suǒ ruǐ,zǒng,jiān,yǒng,diàn,jù,cǎn,chéng,dé,bèi,qiè,cán,dàn dá,guàn,duò,nǎo,yùn,xiǎng,zhuì,dié,huáng,chǔn,qióng,rě,xīng,cè,biǎn,mǐn,zōng,tí shì,qiǎo,chóu,bèi,xuān,wēi,gé,qiān,wěi,yù,yú tōu,bì,xuān,huàn,mǐn,bì,yì,miǎn,yǒng,qì kài,dàng shāng táng yáng,yīn,è,chén xìn dān,mào,kè qià,kè,yú,ài,qiè,yǎn,nuò,gǎn,yùn,còng sōng,sāi sī sǐ,lèng,fèn,yīng,kuì,kuì,què,gōng gòng hǒng,yún,sù,sù shuò,qí,yáo yào,sǒng,huàng,jí,gǔ,jù,chuàng,nì,xié,kǎi,zhěng,yǒng,cǎo,xùn,shèn,bó,kài xì,yuàn,xì xié,hùn,yǒng,yǎng,lì,cǎo sāo,tāo,yīn,cí,xù chù,qiàn qiè,tài,huāng,yùn,shèn,mǐng,gōng gòng hǒng,shè,cáo cóng,piāo,mù,mù,guó,chì,cǎn,cán,cán,cuī,mín,tè,zhāng,tòng,ào áo,shuǎng,màn,guàn,què,zào,jiù,huì,kǎi,lián liǎn,òu,sǒng,qín jìn jǐn,yìn,lǜ,shāng,wèi,tuán,mán,qiān,shè,yōng,qìng,kāng,dì chì,zhí zhé,lóu lǚ,juàn,qī,qī,yù,píng,liáo,còng,yōu,chōng,zhī zhì,tòng,chēng,qì,qū,péng,bèi,biē,qióng,jiāo,zēng,chì,lián,píng,kuì,huì,qiáo,chéng dèng zhèng,yìn,yìn,xǐ xī,xǐ,dàn dá,tán,duò,duì,duì dùn tūn,sù,jué,cè,xiāo jiāo,fān,fèn,láo,lào láo,chōng,hān,qì,xián xiàn,mǐn,jǐng,liǎo liáo,wǔ,cǎn,jué,cù,xiàn,tǎn,shéng,pī,yì,chù,xiān,náo nǎo náng,dàn,tǎn,jǐng jìng,sōng,hàn,jiǎo jǐ,wèi,xuān huān,dǒng,qín,qín,jù,cǎo sāo sào,kěn,xiè,yīng yìng,ào,mào,yì,lǐn,sè,jùn,huái,mèn,lǎn,ài,lǐn,yān,guō,xià,chì,yǔ yú,yìn,dāi,mèng méng měng,ài yì nǐ,méng měng,duì,qí jī jì,mǒ,lán xiàn,mèn,chóu,zhì,nuò,nuò,yān,yǎng,bó,zhì,kuàng,kuǎng,yōu yǒu,fū,liú liǔ,miè,chéng,huì,chàn,měng,lǎn,huái,xuán,ràng,chàn,jì,jù,huān,shè,yì,liàn,nǎn,mí mó,tǎng,jué,gàng zhuàng,gàng zhuàng,gàng zhuàng,gē,yuè,wù,jiān,xū,shù,róng,xì hū,chéng,wǒ,jiè,gē,jiān,qiāng,huò,qiāng qiàng,zhàn,dòng,qī,jiá,dié,zéi,jiá,jǐ,zhí,kān,jí,kuí,gài,děng,zhàn,qiāng qiàng,gē,jiǎn,jié,yù,jiǎn,yǎn,lù,xì hū,zhàn,xì hū,xì hū,chuō,dài,qú,hù,hù,hù,è,shì,tì,mǎo,hù,lì,fáng,suǒ,biǎn piān,diàn,jiōng,shǎng jiōng,yí,yǐ,shàn shān,hù,fēi,yǎn,shǒu,shǒu,cái,zā zhā zhá,qiú,lè lì cái,pū,bā pá,dǎ dá,rēng,fǎn fú,rù,zài,tuō,zhàng,diǎo dí yuē lì,káng gāng,yū wū,yū wū kū,hàn,shēn,chā,tuō chǐ yǐ,gǔ xì gē jié,kòu,wù,dèn,qiān,zhí,rèn,kuò,mén,sǎo sào,yáng,niǔ,bàn,chě,rǎo,xī chā qì,qián qín,bān,jiá,yú,fú,bā ào,xī zhé,pī,zhǐ,zhì sǔn kǎn,è,dèn,zhǎo,chéng,jì,yǎn,kuáng wǎng zài,biàn,chāo,jū,wěn,hú gǔ,yuè,jué,bǎ bà,qìn,dǎn shěn,zhěng,yǔn,wán,nè nì ruì nà,yì,shū,zhuā,póu,tóu,dǒu,kàng,zhē zhé shé,póu pōu fū,fǔ,pāo,bá,ǎo ào niù,zé,tuán,kōu,lūn lún,qiāng qiǎng chēng,yún,hù,bào,bǐng,zhǐ zhǎi,pēng,nán,bù pū,pī,tái,yǎo tāo,zhěn,zhā,yāng,bào,hē hè qiā,nǐ ní,yè,dǐ,chì,pī pēi,jiā,mǒ mò mā,mèi,chēn,yā,chōu,qū,mǐn,zhù,jiā yá,fú bì,zhǎ,zhǔ,dān dàn dǎn,chāi cā,mǔ,niān,lā lá,fǔ,pāo,bàn pàn,pāi,līn,ná,guǎi,qián,jù,tuò tà zhí,bá,tuō,tuō,ǎo ào niù,jū gōu,zhuō,pàn pīn fān,zhāo,bài,bài,dǐ,nǐ,jù,kuò,lǒng,jiǎn,qiǎ,yōng,lán,níng nǐng nìng,bō,zé zhái,qiān,hén,kuò guā,shì,jié jiá,zhěng,nǐn,gǒng,gǒng,quán,shuān,cún zùn,zā zǎn,kǎo,yí chǐ hài,xié,cè sè chuò,huī,pīn,zhuài zhuāi yè,shí shè,ná,bāi,chí,guà,zhì,kuò guāng,duò,duǒ duò,zhǐ,qiè,àn,nòng,zhèn,gé,jiào jiāo,kuà kū,dòng,rú ná,tiāo tiǎo,liè,zhā,lǚ,dié shè,wā,jué,liě,jǔ,zhì,luán,yà yǎ,zhuā wō,tà,xié jiā,náo,dǎng dàng,jiǎo,zhèng zhēng,jǐ,huī,xián,yǔ,āi ái,tuō shuì,nuó,cuò,bó,gěng,tǐ tì,zhèn,chéng,suō shā,suō shā,kēng qiān,měi,nòng,jú,bàng péng,jiǎn,yì,tǐng,shān,ruó,wǎn,xié jiā,chā,péng,jiǎo kù,wǔ,jùn,jiù,tǒng,kǔn,huò chì,tú shū chá,zhuō,póu pōu fū,luō lǚ,bā,hàn,shāo shào,niē,juān,zè,shù sǒng sōu,yé yú,jué zhuó,bǔ,wán,bù pú zhì,zùn,yè,zhāi,lǚ,sōu,tuō shuì,lāo,sǔn,bāng,jiǎn,huàn,dǎo,wěi,wàn wǎn wān yù,qín,pěng,shě,liè,mín,mén,fǔ fù bǔ,bǎi,jù jū,dáo,wǒ luò luǒ,ái,juǎn quán,yuè,zǒng,chēn,chuí,jié,tū,bèn,nà,niǎn niē,ruó wěi ré,zuó,wò xiá,qī,xiān,chéng,diān,sǎo sào,lūn lún,qìng qiàn,gāng,duō,shòu,diào,pǒu póu,dǐ,zhǎng,hùn,jǐ,tāo,qiā,qí,pái pǎi,shū,qiān wàn,líng,yè yē,yà yǎ,jué,zhēng zhèng,liǎng,guà,nǐ niè yì,huò xù,shàn yàn yǎn,zhěng dìng,lüè,cǎi,tàn,chè,bīng,jiē,tì,kòng,tuī,yǎn,cuò,zōu zhōu chōu,jū,tiàn,qián,kèn,bāi,pá,jiē,lǔ,guó,mìng,jié,zhì,dǎn shàn,mēng,chān xiān càn shǎn,sāo,guàn,pèng,yuàn,nuò,jiǎn,zhēng kēng,jiū yóu,jiǎn jiān,yú,yán,kuí,nǎn,hōng,róu,pì chè,wēi,sāi zǒng cāi,zòu,xuān,miáo,tí dī dǐ,niē,chā,shì,zǒng sōng,zhèn zhēn,yī,xún,huáng yóng,biǎn,yáng,huàn,yǎn,zǎn zuàn,ǎn,xū jū,yà,wò,ké qiā,chuǎi chuài chuāi tuán zhuī,jí,tì dì,là lá,là,chéng,kāi,jiū,jiū,tú,jiē qì,huī,gèn,chòng dǒng,xiāo,shé dié yè,xiē,yuán,qián jiàn jiǎn,yé,chā,zhā,bēi,yáo,wēi,bèng,lǎn,wèn,qìn,chān,gē gé,lǒu lōu,zǒng,gèn,jiǎo,gòu,qìn,róng,què,chōu zǒu,chuāi,zhǎn,sǔn,sūn,bó,chù,róng náng nǎng,bàng péng,cuō,sāo,kē è,yáo,dǎo,zhī,nù nuò nòu,lā xié xiàn,jiān,sōu,qiǔ,gǎo,xiǎn xiān,shuò,sǎng,jìn,miè,è,chuí,nuò,shān,tà,jié zhé,táng,pán bān pó,bān,dā,lì,tāo,hú,zhì nái,wā wǎ wà,huá,qiān,wèn,qiāng qiǎng chēng,tián shēn,zhēn,è,xié,ná nuò,quán,chá,zhà,gé,wǔ,èn,shè,gāng,shè niè,shū,bǎi,yáo,bìn,sōu,tān,sà shā shǎi,chǎn sùn,suō,jiū liú liáo jiǎo náo,chōng,chuāng,guó,bìng,féng pěng,shuāi,dì tú zhí,qì jì chá,sōu sǒng,zhāi,liǎn liàn,chēng,chī,guàn,lù,luò,lǒu lōu,zǒng,gài xì,hù chū,zhā,qiāng,tàng,huà,cuī,zhì nái,mó mā,jiāng qiàng,guī,yǐng,zhí,áo qiáo,zhì,niè chè,mán màn,chàn cán,kōu,chū,sè mí sù,tuán,jiǎo chāo,mō,mó,zhé,chān xiān càn shǎn,kēng qiān,biào biāo,jiàng,yáo,gòu,qiān,liào,jī,yīng,juē jué,piē,piē piě,lāo,dūn,xiàn,ruán,guì,zǎn zān zēn qián,yī,xián,chēng,chēng,sā sǎ,náo,hòng,sī,hàn,héng guàng,dā,zǔn,niǎn,lǐn,zhěng chéng,huī wéi,zhuàng,jiǎo,jǐ,cāo,dǎn,dǎn shàn,chè,bō,chě,juē,xiāo sōu,liāo liáo,bèn,fǔ,qiào,bō,cuō zuǒ,zhuó,zhuàn,wěi tuǒ,pū,qìn,dūn,niǎn,huá,xié,lū,jiǎo,cuān,tà,hàn,qiào yāo jī,zhuā wō,jiǎn,gǎn,yōng,léi lèi,nǎng,lǔ,shàn,zhuó,zé zhái,pǔ,chuò,jī,dǎng dàng,sè,cāo,qíng,qíng jǐng,huàn,jiē,qín,kuǎi,dān dàn,xié,qiā jiā yè,pǐ bò,bò bāi,ào,jù jū,yè,è,mēng,sòu sǒu,mí,jǐ,tái,zhuó,dǎo,xǐng,lǎn,cā,jǔ,yē,rǔ,yè,yè,nǐ,huò,jié,bìn,níng nǐng nìng,gē gé,zhì,zhì jié,kuò,mó,jiàn,xié,liè là,tān,bǎi,sòu sǒu,lū,lì luò yuè,rǎo,tī zhì zhāi,pān,yǎng,léi lèi,cā sǎ,shū,zǎn,niǎn,xiǎn,jùn pèi,huō,lì luò,là lài,huàn,yíng,lú luó,lǒng,qiān,qiān,zǎn cuán,qiān,lán,xiān jiān,yīng,méi,rǎng,chān,wěng,cuān,xié,shè niè,luó,jùn,mí mǐ mó,chī,zǎn cuán,luán,tān,zuàn,lì shài,diān,wā,dǎng,jiǎo,jué,lǎn,lì luǒ,nǎng,zhī,guì,guǐ guì,qī yǐ jī,xún,pū,pū,shōu,kǎo,yōu,gǎi,yǐ,gōng,gān hàn,bān,fàng,zhèng,pò,diān,kòu,mǐn,wù móu,gù,hé,cè,xiào,mǐ,chù shōu,gé guó è,dí,xù,jiào jiāo,mǐn,chén,jiù,shēn,duó duì,yǔ,chì,áo,bài,xù,jiào jiāo,duó duì,liǎn,niè,bì,chǎng,diǎn,duō què,yì,gǎn,sàn sǎn,kě,yàn,dūn duì,qī yǐ jī,tǒu,xiào xué,duō què,jiǎo,jìng,yáng,xiá,mǐn,shù shǔ shuò,ái zhú,qiāo,ái zhú,zhěng,dí,chén,fū,shù shǔ shuò,liáo,qū,xiòng xuàn,yǐ,jiǎo,shàn,jiǎo,zhuó zhú,yì dù,liǎn,bì,lí tái,xiào,xiào,wén,xué,qí,qí,zhāi,bīn,jué jiào,zhāi,láng,fěi fēi,bān,bān,lán,yǔ zhōng,lán,wěi mén,dǒu dòu,shēng,liào,jiǎ,hú,xié,jiǎ,yǔ,zhēn,jiào,wò guǎn,tǒu tiǎo,dòu,jīn,chì,yín zhì,fǔ,qiāng,zhǎn,qú,zhuó,zhǎn,duàn,zhuó,sī,xīn,zhuó,zhuó,qín,lín,zhuó,chù,duàn,zhú,fāng,chǎn jiè,háng,yú wū,shī,pèi,liú yóu,mèi,páng bàng,qí,zhān,máo mào,lǚ,pèi,pī bì,liú,fū,fǎng,xuán xuàn,jīng,jīng,nǐ,zú,zhào,yǐ,liú,shāo,jiàn,yú,yǐ,qí,zhì,fān,piāo,fān,zhān,kuài,suì,yú,wú,jì,jì,jì,huò,rì,dàn,jiù,zhǐ,zǎo,xié,tiāo,xún,xù,gā,lá,gàn hàn,hàn,tái yīng,dì dí de,xù xū,chǎn,shí,kuàng,yáng,shí,wàng,mín,mín,tūn zhùn,chūn,wù wǔ,yún,bèi,áng,zè,bǎn,jié,kūn,shēng,hù,fǎng,hào,guì,chāng,xuān,míng,hūn,fēn,qǐn,hū,yì,xī,xīn,yán,zè,fǎng,tán,shèn,jù,yáng,zǎn,bǐng,xīng,yìng,xuàn,pò,zhěn,líng,chūn,hào,mèi,zuó,mò,biàn,xù,hūn,zhāo,zòng,shì,shì,yù,fèi,dié yì,mǎo,nì,chǎng,wēn,dōng,ǎi,bǐng,áng,zhòu,lóng,xiǎn,kuàng,tiǎo,cháo,shí,huǎng huàng,huǎng,xuān,kuí,xù kuā,jiǎo,jìn,zhì,jìn,shǎng,tóng,hǒng,yàn,gāi,xiǎng,shài,xiǎo,yè,yùn yūn,huī,hán,hàn,jùn,wǎn,xiàn,kūn,zhòu,xī,shèng chéng,shèng,bū,zhé,zhé,wù,wǎn,huì,hào,chén,wǎn,tiǎn,zhuó,zuì,zhǒu,pǔ,jǐng yǐng,xī,shǎn,nǐ,xī,qíng,qǐ dù,jīng,guǐ,zhěng,yì,zhì,àn ǎn yǎn,wǎn,lín,liàng,chēng,wǎng wàng,xiǎo,zàn,fēi,xuān,xuǎn,yí,xiá,yùn yūn,huī,xǔ,mǐn mín,kuí,yē,yìng,shǔ dǔ,wěi,shǔ,qíng,mào,nán,jiǎn lán,nuǎn,àn,yáng,chūn,yáo,suǒ,pǔ,míng,jiǎo,kǎi,hào,wěng,chàng,qì,hào,yàn,lì,ài,jì,jì,mèn,zàn,xiè,hào,mù,mù,cōng,nì,zhāng,huì,bào pù,hàn,xuán,chuán,liáo,xiān,tǎn,jǐng,piē,lín,tūn,xī xǐ,yì,jì,huàng,dài,yè,yè,lì,tán,tóng,xiǎo,fèi,shěn,zhào,hào,yì,xiàng,xīng,shēn,jiǎo,bào,jìng,yàn,ài,yè,rú,shǔ,méng,xūn,yào,pù bào,lì,chén,kuàng,dié,liǎo,yàn,huò,lú,xī,róng,lóng,nǎng,luǒ,luán,shài,tǎng,yǎn,zhú,yuē,yuē,qū qǔ,yè,gēng gèng,yè,hū hù,hé,shū,cáo,cáo,shēng,màn,zēng céng,zēng céng,tì,zuì,cǎn qián jiàn,xù,huì kuài,yǐn,qiè hé,fēn,bì pí,yuè,yǒu yòu,ruǎn,péng,fén bān,fú fù,líng,fěi kū,qú xù chǔn,tì,nǜ gǎ,tiǎo,shuò,zhèn,lǎng,lǎng,juān zuī,míng,huāng máng wáng,wàng,tūn,zhāo cháo,jī,qī jī,yīng,zōng,wàng,tóng chuáng,lǎng,láo,méng,lóng,mù,pìn děng,wèi,mò,běn,zhá,shù shú zhú,shù shú zhú,none,zhū shú,rén,bā,pǔ pò pō piáo,duǒ,duǒ,dāo tiáo mù,lì,qiú guǐ,jī,jiū,bǐ,xiǔ,chéng chēng,cì,shā,rù,zá,quán,qiān,yú wū,gān gǎn,wū,chā chà,shā,xún,fán,wù,zǐ,lǐ,xìng,cái,cūn,rèn ér,sháo biāo,tuō zhé,dì duò,zhàng,máng,chì,yì,gū gài,gōng,dù,yí lì lí duò tuò,qǐ,shù,gàng gāng,tiáo tiāo,jié,mián,wàn,lái,jiǔ,máng,yáng,mà mǎ,miǎo,sì zhǐ xǐ,yuán wán,háng,fèi bèi,bēi,jié,dōng,gǎo,yǎo,xiān,chǔ,chūn,pá,shū duì,huà,xīn,niǔ chǒu,zhù,chǒu,sōng,bǎn,sōng,jí,wò yuè,jìn,gòu,jī,máo,pí,pī mì,wǎng,àng,fāng bìng,fén,yì,fú fū,nán,xī,hù dǐ,yā,dōu,xín,zhěn,yǎo yāo,lín,ruì,ě è,méi,zhào,guǒ,zhī qí,cōng zōng,yùn,huà,shēng,shū,zǎo,dì duò,lì,lú,jiǎn,chéng,sōng,qiāng,fēng,zhān,xiāo,xiān zhēn,kū,píng,sì tái,xǐ,zhǐ,guǎi,xiāo,jià,jiā,jǔ gǒu,bāo fú,mò,yì xiè,yè,yè,shì,niè,bǐ,tuó duò,yí duò lí,líng,bǐng,nǐ chì,lā,hé,pán bàn,fán,zhōng,dài,cí,yǎng yàng yāng yīng,fū fǔ fù,bǎi bó bò,mǒu,gān,qī,rǎn,róu,mào,sháo shào,sōng,zhè,xiá,yòu yóu,shēn,guì jǔ,tuò,zuò zhà,nán,níng,yǒng,dǐ chí,zhì dié,zhā zǔ zū,chá zhā,dàn,gū,bù pū,jiù,āo ào,fú,jiǎn,bā fú pèi bó biē,duò zuó wù,kē,nài,zhù,bì bié,liǔ,chái,shān,sì,zhù,bēi pēi,shì fèi,guǎi,chá zhā,yǎo,chēng,jiù,shì,zhī,liǔ,méi,lì,róng,zhà shān shi cè,zǎo,biāo,zhàn,zhì,lóng,dòng,lú,shēng,lì yuè,lán,yǒng,shù,xún,shuān,qì qiè,chén,qī xī,lì,yí,xiáng,zhèn,lì,sè,guā tiǎn,kān,bēn bīng,rěn,xiào jiào,bǎi,rěn,bìng,zī,chóu,yì xiè,cì,xǔ,zhū,jiàn zùn,zuì,ér,ěr,yǒu yù,fá,gǒng,kǎo,lǎo,zhān,liè,yīn,yàng,hé hú,gēn,zhī yì,shì,gé,zāi,luán,fú,jié,héng háng,guì,táo,guāng guàng,wéi,kuàng,rú,àn,ān,juàn,yí tí,zhuō,kū,zhì,qióng,tóng,sāng,sāng,huán,jié jú,jiù,xuè,duò,chuí,yú móu,zā zǎn,none,yīng,jié,liǔ,zhàn,yā,ráo náo,zhēn,dàng,qī,qiáo,huà,guì huì,jiǎng,zhuāng,xún,suō,shā,chén zhèn,bēi,tīng yíng,guā,jìng,bó,bèn fàn,fú,ruí,tǒng,jué,xī,láng,liǔ,fēng fèng,qī,wěn,jūn,gǎn,sù yìn,liáng,qiú,tǐng tìng,yǒu,méi,bāng,lòng,pēng,zhuāng,dì,xuān juān xié,tú chá,zào,āo yòu,gù,bì,dí,hán,zǐ,zhī,rèn ér,bèi,gěng,jiǎn,huàn,wǎn,nuó,jiā,tiáo tiāo,jì,xiāo,lǚ,kuǎn,shāo sào,chén,fēn,sōng,mèng,wú,lí,sì qǐ,dòu,qǐn,yǐng,suō,jū,tī,xiè,kǔn,zhuō,shū,chān yán,fàn,wěi,jìng,lí,bīn bīng,xià,fó,chóu táo dào,zhì,lái,lián liǎn,jiǎn,zhuō,líng,lí,qì,bǐng,lún,cōng sōng,qiàn,mián,qí,qí,cǎi,gùn hùn,chán,dé zhé,fěi,pái bèi pèi,bàng,bàng pǒu bèi bēi,hūn,zōng,chéng,zǎo,jí,lì liè,péng,yù,yù,gù,jùn,dòng,táng,gāng,wǎng,dì dài tì,què,fán,chēng,zhàn,qǐ,yuān,yǎn yàn,yù,quān juàn,yì,sēn,rěn shěn,chuí,léng lēng líng,qī,zhuō,fú sù,kē,lái,zōu sǒu,zōu,zhào zhuō,guān,fēn,fén,chēn shēn,qíng,ní nǐ,wǎn,guǒ,lù,háo,jiē qiè,yǐ yī,chóu zhòu diāo,jǔ,jú,chéng shèng,zú cuì,liáng,qiāng kōng,zhí,zhuī chuí,yā,jū,bēi,jiāo,zhuó,zī,bīn,péng,dìng,chǔ,chāng,mēn,huā,jiǎn,guī,xì,dú,qiàn,dào,guì,diǎn,luó,zhī,quān juàn quán,mìng,fǔ,gēng,pèng,shàn,yí,tuǒ,sēn,duǒ chuán,yē,fù,wěi huī,wēi,duàn,jiǎ jiā,zōng,jiān hán,yí,zhēn shèn,xí,yà,yǎn,chuán,jiān,chūn,yǔ,hé,zhā chá,wò,piān,bī,yāo,guō kuǎ,xū,ruò,yáng,là,yán,běn,huī,kuí,jiè,kuí,sī,fēng,xiē,tuǒ,jí zhì,jiàn,mù,máo,chǔ,kǔ hù,hú,liàn,léng,tíng,nán,yú,yóu yǒu,méi,sǒng cōng,xuàn yuán,xuàn,yǎng yàng yīng,zhēn,pián,dié yè,jí,jiē,yè,chǔ,shǔn dùn,yú,còu zòu,wēi,méi,dì dǐ shì,jí,jié,kǎi jiē,qiū,yíng,róu ròu,huáng,lóu,lè yuè,quán,xiāng,pǐn,shǐ,gài,tán,lǎn,wēn yùn,yú,chèn,lǘ,jǔ,shén,chū,bī pi,xiè,jiǎ,yì,zhǎn niǎn zhèn,fú fù bó,nuò,mì,láng,róng,gǔ,jiàn jìn,jǔ,tā,yǎo,zhēn,bǎng bàng,shā xiè,yuán,zǐ,míng,sù,jià,yáo,jié,huàng,gàn,fěi,zhà,qián,mà mā,sǔn,yuán,xiè,róng,shí,zhī,cuī,wēn,tíng,liú,róng,táng,què,zhāi,sì,shèng,tà,kē,xī,gù,qī,gǎo,gǎo,sūn,pán,tāo,gé,chūn,diān,nòu,jí,shuò,gòu,chuí,qiāng,chá,qiǎn lián xiàn,huái,méi,xù,gàng,gāo,zhuō,tuó,qiáo,yàng,diān zhěn zhēn,jiǎ,jiàn kǎn,zuì,dǎo,lóng,bīn bīng,zhū,sāng,xí dié,jī guī,lián liǎn,huì,róng yōng,qiàn,guǒ,gài,gài,tuán shuàn quán,huà,qì sè,sēn,cuī zhǐ,pèng,yǒu chǎo,hú,jiǎng,hù,huàn,guì,niè,yì,gāo,kāng,guī,guī,cáo,màn wàn,jǐn,dī,zhuāng,lè yuè yào lào,láng,chén,cōng zōng,lí chī,xiū,qíng,shǎng,fán,tōng,guàn,zé,sù,léi lěi,lǔ,liáng,mì,lóu,cháo jiǎo chāo,sù,kē,chū,táng,biāo,lù,jiū liáo,zhè,zhā,shū,zhāng,mán,mó mú,niǎo mù,yàng,tiáo,péng,zhù,shā xiè,xī,quán,héng hèng,jiān,cōng,jī,yān,qiáng,xuě,yīng,èr,xún,zhí,qiáo,zuī,cóng,pǔ,shù,huà,guì,zhēn,zūn,yuè,shàn,xī,chūn,diàn,fá fèi,gǎn,mó,wú,qiāo,ráo náo,lìn,liú,qiáo,xiàn,rùn,fǎn,zhǎn jiǎn,tuó,liáo,yún,shùn,tuí dūn,chēng,táng chēng,méng,jú,chéng,sù qiū,jué,jué,tán diàn,huì,jī,nuó,xiàng,tuǒ,níng,ruǐ,zhū,tóng chuáng,zēng céng,fén fèn fèi,qióng,rǎn yān,héng hèng,qián,gū,liǔ,lào,gāo,chú,xǐ,shèng,zǐ,zān,jǐ,dōu,jīng,lǔ,xiàn,cū chu,yuán,tà,shū qiāo,jiāng,tán,lǐn,nóng,yǐn,xí,huì,shān,zuì,xuán,chēng,gàn,jū,zuì,yì,qín,pǔ,yán,léi,fēng,huǐ,dàng,jì,suì,bò,píng bò,chéng,chǔ,zhuā,guì huì,jí,jiě,jiǎ,qíng,zhái shì tú,jiǎn,qiáng,dào,yǐ,biāo biǎo,sōng,shē,lǐn,lì,chá,méng,yín,chóu táo dǎo,tái,mián,qí,tuán,bīn bīng,huò,jì,qiān lián,nǐ mí,níng,yī,gǎo,jiàn kǎn,yǐn,nòu ruǎn rú,qǐng,yǎn,qí,mì,zhào,guì,chūn,jī jì,kuí,pó,dèng,chú,gé,mián,yōu,zhì,huǎng guǒ gǔ,qiān,lěi,léi lěi,sà,lǔ,lì,cuán,lǜ chū,miè mèi,huì,ōu,lǘ,zhì,gāo,dú,yuán,lì yuè,fèi,zhuó zhù,sǒu,lián liǎn,jiàng,chú,qìng,zhū,lú,yán,lì,zhū,chèn,jué jì,è,sū,huái guī,niè,yù,lóng,là lài,qiáo,xiǎn,guī,jǔ,xiāo,líng,yīng,jiān,yǐn,yòu yóu,yíng,xiāng,nóng,bó,chán zhàn,lán,jǔ,shuāng,shè,wéi zuì,cóng,quán,qú,cáng,jiù,yù,luó,lì,cuán,luán,dǎng,qú,yán,lǎn,lán,zhú,léi,lǐ,bà,náng,yù,líng,guàn,qiàn,cì,huān,xīn,yú,yù yì,qiān xiān,ōu,xū,chāo,chù qù xì,qì,kài ài,yì yīn,jué,xì kài,xù,hē,yù,kuài,láng,kuǎn,shuò sòu,xī,èi ǎi,qī,qī,xū chuā,chǐ chuài,qīn,kuǎn,kǎn qiàn,kuǎn,kǎn kè,chuǎn chuán,shà,guā,yān yīn,xīn,xiē,yú,qiàn,xiāo,yē,gē,wū,tàn,jìn qūn,ōu,hū,tì,huān,xū,pēn,xǐ,xiào,xū,xī shè,shàn,liǎn hān,chù,yì,è,yú,chuò,huān,zhǐ,zhèng zhēng,cǐ,bù,wǔ,qí,bù,bù,wāi,jù,qián,zhì chí,sè,chǐ,sè shà,zhǒng,suì,suì,lì,zé,yú,lì,guī,dǎi,è,sǐ,jiān,zhé,mò wěn,mò,yāo,mò,cú,yāng,tiǎn,shēng,dài,shāng,xù,xùn,shū,cán,jǐng,piǎo,qià,qiú,sù,qíng jìng,yǔn,liàn,yì,fǒu bó,zhí shi,yè yān yàn,cán,hūn mèi,dān,jí,dié,zhēn,yǔn,wēn,chòu,bìn,tì,jìn,shāng,yín,chī,jiù,kuì huì,cuàn,yì,dān,dù,jiāng,liàn,bìn,dú,jiān,jiān,shū,ōu,duàn,zhù,yīn yān yǐn,qìng kēng shēng,yì,shā,ké qiào,ké qiào,xiáo yáo xiào,xùn,diàn,huǐ,huǐ,gǔ,qiāo,jī,yì,ōu,huǐ,duàn,yī,xiāo,wú,guàn wān,mǔ,měi,měi,ǎi,jiě,dú dài,yù,bǐ,bì,bì,pí,pí,bì,chán,máo,háo,cǎi,bǐ,liě,jiā,zhān,sāi,mù,tuò,xún xùn,ěr,róng,xiǎn,jū,mú,háo,qiú,dòu nuò,shā,tǎn,péi,jū,duō,cuì,bī,sān,sān,mào,sāi suī,shū,shū,tuò,hé,jiàn,tà,sān,lǘ,mú,máo,tóng,rǒng,chǎng,pǔ,lǔ,zhān,sào,zhān,méng,lǔ,qú,dié,shì zhī,dī dǐ,mín,jué,méng máng,qì,piē,nǎi,qì,dāo,xiān,chuān,fēn,yáng rì,nèi,nèi,fú,shēn,dōng,qīng,qì,yīn,xī,hài,yǎng,ān,yà,kè,qīng,yà,dōng,dàn,lǜ,qíng,yǎng,yūn,yūn,shuǐ,shuǐ,zhěng chéng zhèng,bīng,yǒng,dàng,shuǐ,lè,nì,tǔn,fàn,guǐ jiǔ,tīng,zhī,qiú,bīn pà pā,zè,miǎn,cuān,huì,diāo,hàn,chà,zhuó què,chuàn,wán,fàn,tài dà,xī,tuō,máng,qiú,qì,shàn,pìn,hàn hán,qiān,wū,wū,xùn,sì,rǔ,gǒng,jiāng,chí,wū,tu,jiǔ,tāng shāng,zhī jì,zhǐ,qiān,mì,gǔ yù,wāng,jǐng,jǐng,ruì,jūn,hóng,tài,tài,jí,biàn,biàn,gàn hán cén,wèn mén,zhōng,fāng pāng,xiōng,jué,hǔ huǎng,niú yóu,qì,fén,xù,xù,qìn,yí,wò,yún,yuán,hàng,yǎn,shěn chén,chén,dàn,yóu,dùn,hù,huò,qī,mù,nǜ niǔ,méi mò,tà dá,miǎn,mì wù,chōng,hóng pāng,bǐ,shā shà,zhǐ,pèi,pàn,zhuǐ zǐ,zā,gōu,pài,méi mò,zé,fēng,òu ōu,lì,lún,cāng,fēng,wéi,hù,mò,mèi,shù,jǔ jù,zá,tuō duó,tuó,tuó duò,hé,lì,mǐ lì,yí chí,fā,fèi,yóu,tián,zhì,zhǎo,gū,zhān,yán,sī,kuàng,jiǒng,jū,xiè yì,qiú,yì dié,jiā,zhōng,quán,bó pō,huì,mì bì,bēn bèn,zé,chù shè,lè,yōu yòu āo,gū,hóng,gān,fǎ,mǎo,sì,hū,pēng píng,cǐ,fàn,zhī,sù,nìng,chēng,líng,pào pāo,bō,qì,sì,ní nì,jú,yuè sà,zhù,shēng,lèi,xuàn,jué xuè,fú,pàn,mǐn,tài,yāng,jǐ,yǒng,guàn,bèng,xué,lóng shuāng,lú,dàn,luò pō,xiè,pō,zé shì,jīng,yín,pán,jié,yè,huī,huí,zài,chéng,yīn,wéi,hòu,jiàn,yáng,liè,sì,jì,ér,xíng,fú fù,sǎ xǐ,sè qì zì,zhǐ,yìn,wú,xǐ xiǎn,kǎo kào,zhū,jiàng,luò,luò,àn yàn è,dòng,yí,sì,lěi lèi,yī,mǐ,quán,jīn,pò,wěi,xiáo,xiè,hóng,xù,sù shuò,kuāng,táo,qiè jié,jù,ěr,zhōu,rù,píng,xún,xiōng,zhì,guāng,huán,míng,huó,wā,qià,pài,wū,qū,liú,yì,jiā,jìng,qiǎn jiān,jiāng jiàng,jiāo,zhēn,shī,zhuó,cè,fá,kuài huì,jì jǐ,liú,chǎn,hún,hǔ xǔ,nóng,xún,jìn,liè,qiú,wěi,zhè,jùn xùn,hán,bāng,máng,zhuó,yōu dí,xī,bó,dòu,huàn,hóng,yì,pǔ,yǐng chéng yíng,lǎn,hào,làng,hǎn,lǐ,gēng,fú,wú,lì,chún,féng hóng,yì,yù,tóng,láo,hǎi,jìn,jiā,chōng,jiǒng jiōng,měi,suī něi,chēng,pèi,xiàn,shèn,tú,kùn,pīng,niè,hàn,jīng,xiāo,shè,niǎn,tū,yǒng chōng,xiào,xián,tǐng,é,sù,tūn yūn,juān,cén,tì,lì,shuì,sì,lèi,shuì,tāo,dú,lào,lái,lián,wéi,wō guō,yún,huàn,dí,hēng,rùn,jiàn,zhǎng zhàng,sè,fú,guān,xìng,shòu tāo,shuàn,yá,chuò,zhàng,yè,kōng náng,wǎn wò yuān,hán,tuō tuò,dōng,hé,wō,jū,shè,liáng liàng,hūn,tà,zhuō,diàn,qiè jí,dé,juàn,zī,xī,xiáo,qí,gǔ,guǒ guàn,yān,lín lìn,tǎng chǎng,zhōu,pěng,hào,chāng,shū,qī,fāng,zhí,lù,nào chuò zhuō,jú,táo,cóng,lèi,zhè,píng péng,féi,sōng,tiǎn,pì pèi,dàn,yù xù,ní,yū,lù,gàn,mì,jìng chēng,líng,lún,yín,cuì,qú,huái,yù,niǎn shěn,shēn,biāo hǔ,chún zhūn,hū,yuān,lái,hùn hún,qīng,yān,qiǎn,tiān,miǎo,zhǐ,yǐn,bó,bèn,yuān,wèn mín,ruò rè luò,fēi,qīng,yuān,kě,jì jǐ,shè,yuān,sè,lù,zì,dú dòu,yī,jiàn jiān,miǎn shéng,pài,xī,yú,yuān,shěn,shèn,róu,huàn,zhǔ,jiǎn,nuǎn nuán,yú,qiú wù,tíng tīng,qú jù,dù,fēng,zhā,bó,wò,wō guō,tí dī dì,wěi,wēn,rú,xiè,cè,wèi,hé,gǎng jiǎng,yān yǎn,hóng,xuàn,mǐ,kě,máo,yīng,yǎn,yóu,hōng qìng,miǎo,shěng,měi,zāi,hún,nài,guǐ,chì,è,pài,méi,liàn,qì,qì,méi,tián,còu,wéi,cān,tuān,miǎn,huì mǐn xū,pò,xǔ xū,jí,pén,jiān,jiǎn,hú,fèng,xiāng,yì,yìn,zhàn,shí,jiē,zhēn,huáng,tàn,yú,bì,mǐn hūn,shī,tū,shēng,yǒng,jú,dòng,tuàn nuǎn,qiū jiǎo,qiū jiǎo,qiú,yān yīn,tāng shāng,lóng,huò,yuán,nǎn,bàn pán,yǒu,quán,zhuāng hún,liàng,chán,xián,chún,niè,zī,wān,shī,mǎn,yíng,là,kuì huì,féng hóng,jiàn jiān,xù,lóu,wéi,gài,bō,yíng,pō,jìn,yàn guì,táng,yuán,suǒ,yuán,lián liǎn nián xián xiàn,yǎo,méng,zhǔn,chéng,kè,tài,dá tǎ,wā,liū liù,gōu,sāo,míng,zhà,shí,yì,lùn,mǎ,pǔ,wēi,lì,zāi,wù,xī,wēn,qiāng,zé,shī,sù,ái,zhēn qín,sōu,yún,xiù,yīn,róng,hùn,sù,suò,nì niào,tā,shī,rù,āi,pàn,chù xù,chú,pāng,wěng wēng,cāng,miè,gé,diān,hào xuè,huàng,qì xì xiē,zī,dí,zhì,xíng yíng,fǔ,jié,huá,gē,zǐ,tāo,téng,suī,bì,jiào,huì,gǔn,yín,zé hào,lóng,zhì,yàn,shè,mǎn,yíng,chún,lǜ,làn,luán,yáo,bīn,tān,yù,xiǔ,hù,bì,biāo,zhì,jiàng,kòu,shèn,shāng,dī,mì,áo,lǔ,hǔ xǔ,hū,yōu,chǎn,fàn,yōng,gǔn,mǎn,qǐng,yú,piāo piǎo piào,jì,yá,cháo,qī,xǐ,jì,lù,lóu,lóng,jǐn,guó,cóng sǒng,lòu,zhí,gài,qiáng,lí,yǎn,cáo,jiào,cōng,chún,tuán zhuān,òu ōu,téng,yě,xí,mì,táng,mò,shāng,hàn,lián,lǎn,wā,chí,gān,féng péng,xuán,yī,màn,zì,mǎng,kāng,luò tà,bēn pēng,shù,zhǎng zhàng,zhāng,chóng zhuàng,xù,huàn,huǒ huò kuò,jiàn jiān,yān,shuǎng,liáo liú,cuǐ cuī,tí,yàng,jiāng jiàng,cóng zǒng,yǐng,hóng,xiǔ,shù,guàn,yíng,xiāo,cóng zōng,kūn,xù,liàn,zhì,wéi,pì piē,yù,jiào qiáo,pō,dàng xiàng,huì,jié,wǔ,pá,jí,pān,wéi,sù,qián,qián,xī yà,lù,xì,xùn,dùn,huáng guāng,mǐn,rùn,sù,lǎo lào liáo,zhēn,cōng zòng,yì,zhí zhì,wān,tān shàn,tán,cháo,xún,kuì huì,yē,shào,tú zhā,zhū,sàn sǎ,hēi,bì,shān,chán,chán,shǔ,tóng,pū,lín,wéi,sè,sè,chéng,jiǒng,chéng dèng,huà,jiāo,lào,chè,gǎn,cūn cún,jǐng,sī,shù zhù,péng,hán,yún,liū liù,hòng gǒng,fú,hào,hé,xián,jiàn,shān,xì,ào yù,lǔ,lán,nìng,yú,lǐn,miǎn shéng,zǎo,dāng,huàn,zé shì,xiè,yù,lǐ,shì,xué,líng,wàn màn,zī,yōng yǒng,kuài huì,càn,liàn,diàn,yè,ào,huán,zhēn,chán,màn,gǎn,dàn tán,yì,suì,pì,jù,tà,qín,jī,zhuó,lián,nóng,guō wō,jìn,fén pēn,sè,jí shà,suī,huì huò,chǔ,tà,sōng,dǐng tìng,sè,zhǔ,lài,bīn,lián,mǐ nǐ,shī,shù,mì,nìng,yíng,yíng,méng,jìn,qí,bì pì,jì jǐ,háo,rú,cuì zuǐ,wò,tāo,yǐn,yīn,duì,cí,huò hù,qìng,làn,jùn xùn,ǎi kài kè,pú,zhuó zhào,wéi,bīn,gǔ,qián,yíng,bīn,kuò,fèi,cāng,mè,jiàn jiān,wěi duì,luò pō,zàn cuán,lǜ,lì,yōu,yǎng yàng,lǔ,sì,zhì,yíng,dú dòu,wǎng wāng,huī,xiè,pán,shěn,biāo,chán,miè mò,liú,jiān,pù bào,sè,chéng dèng,gǔ,bīn,huò,xiàn,lú,qìn,hàn,yíng,róng,lì,jìng,xiāo,yíng,suǐ,wěi duì,xiè,huái wāi,xuè,zhū,lóng shuāng,lài,duì,fàn,hú,lài,shū,lián,yíng,mí,jì,liàn,jiàn zùn,yīng yǐng yìng,fèn,lín,yì,jiān,yuè,chán,dài,ráng nǎng,jiǎn,lán,fán,shuàng,yuān,zhuó jiào zé,fēng,shè,lěi,lán,cóng,qú,yōng,qián,fǎ,guàn,jué,yàn,hào,yíng,sǎ,zàn cuán,luán luàn,yàn,lí,mǐ,shàn,tān,dǎng tǎng,jiǎo,chǎn,yíng,hào,bà,zhú,lǎn,lán,nǎng,wān,luán,xún quán quàn,xiǎn,yàn,gàn,yàn,yù,huǒ,huǒ biāo,miè,guāng,dēng,huī,xiāo,xiāo,huī,hōng,líng,zào,zhuàn,jiǔ,zhà yù,xiè,chì,zhuó,zāi,zāi,càn,yáng,qì,zhōng,fén bèn,niǔ,jiǒng guì,wén,pū,yì,lú,chuī,pī,kài,pàn,yán,yán,pàng fēng,mù,chǎo,liào,quē,kàng,dùn,guāng,xìn,zhì,guāng,guāng,wěi,qiàng,biān,dá,xiá,zhēng,zhú,kě,zhào zhāo,fú,bá,xiè,xiè,lìng,zhuō chù,xuàn,jù,tàn,páo bāo pào,jiǒng,páo fǒu,tái,tái,bǐng,yǎng,tōng,shǎn qián shān,zhù,zhà zhá,diǎn,wéi wèi,shí,liàn,chì,huǎng,zhōu,hū,shuò,làn,tīng,jiǎo yào,xù,héng,quǎn,liè,huàn,yáng yàng,xiāo,xiū,xiǎn,yín,wū,zhōu,yáo,shì,wēi,tóng dòng,miè,zāi,kài,hōng,lào luò,xiá,zhú,xuǎn,zhēng,pò,yān,huí huǐ,guāng,chè,huī,kǎo,jù,fán,shāo,yè,huì,none,tàng,jìn,rè,liè,xī,fú páo,jiǒng,xiè chè,pǔ,tīng,zhuó,tǐng,wán,hǎi,pēng,lǎng,yàn,xù,fēng,chì,róng,hú,xī,shū,hè,xūn hūn,kù,juān yè,xiāo,xī,yān,hàn,zhuàng,qū jùn,dì,xiè chè,jí qì,wù,yān,lǚ,hán,yàn,huàn,mèn,jú,dào,bèi,fén,lìn,kūn,hùn,tūn,xī,cuì,wú,hōng,chǎo jù,fǔ,wò ài,jiāo,zǒng cōng,fèng,píng,qióng,ruò,xī yì,qióng,xìn,zhuō chāo,yàn,yàn,yì,jué,yù,gàng,rán,pí,xiǒng yīng,gàng,shēng,chàng,shāo,xiǒng yīng,niǎn,gēng,qū,chén,hè,kuǐ,zhǒng,duàn,xiā,huī yùn xūn,fèng,liàn,xuān,xīng,huáng,jiǎo qiāo,jiān,bì,yīng,zhǔ,wěi,tuān,shǎn qián shān,xī yí,nuǎn,nuǎn,chán,yān,jiǒng,jiǒng,yù,mèi,shā shà,wèi,yè zhá,jìn,qióng,róu,méi,huàn,xù,zhào,wēi,fán,qiú,suì,yáng yàng,liè,zhǔ,jiē,zào,guā,bāo,hú,yūn yǔn,nǎn,shì,huǒ,biān,gòu,tuì,táng,chǎo,shān,ēn yūn,bó,huǎng,xié,xì,wù,xī,yūn yǔn,hé,hè xiāo,xī,yún,xióng,xióng,shǎn,qióng,yào,xūn xùn,mì,lián,yíng,wǔ,róng,gòng,yàn,qiàng,liū,xī,bì,biāo,cōng zǒng,lù āo,jiān,shú,yì,lóu,péng fēng,suī cuǐ,yì,tēng,jué,zōng,yù,hù,yí,zhì,āo áo,wèi,liǔ,hàn rǎn,ōu ǒu,rè,jiǒng,màn,kūn,shāng,cuàn,zèng,jiān,xī,xī,xī,yì,xiào,chì,huáng huǎng,chǎn dǎn chàn,yè,tán,rán,yàn,xún,qiāo,jùn,dēng,dùn,shēn,jiāo qiáo jué zhuó,fén,sī,liáo liǎo,yù,lín,tóng dòng,shāo,fén,fán,yàn yān,xún,làn,měi,tàng,yì,jiǒng,mèn,zhǔ,jiǎo,yíng,yù,yì,xué,lán,tài liè,zào,càn,suì,xī,què,zǒng,lián,huǐ,zhú,xiè,líng,wēi,yì,xié,zhào,huì,dá,nóng,lán,xū,xiǎn,hè,xūn,jìn,chóu,dào,yào,hè,làn,biāo,róng yíng,lì liè,mò,bào,ruò,lǜ,là liè,āo,xūn xùn,kuàng huǎng,shuò,liáo liǎo,lì,lú,jué,liáo liǎo,yàn xún,xī,xiè,lóng,yè,cān,rǎng,yuè,làn,cóng,jué,chóng,guàn,qú,chè,mí,tǎng,làn,zhú,lǎn làn,líng,cuàn,yù,zhǎo zhuǎ,zhǎo zhuǎ,pá,zhēng,páo,chēng chèn,yuán,ài,wéi wèi,han,jué,jué,fù fǔ,yé,bà,diē,yé,yáo,zǔ,shuǎng,ěr,pán,chuáng,kē,zāng,dié,qiāng,yōng,qiáng,piàn piān,bǎn,pàn,cháo,jiān,pái,dú,chuāng,yú,zhá,biān miàn,dié,bǎng,bó,chuāng,yǒu,yǒu yōng,dú,yá,chēng chèng,niú,niú,pìn,jiū lè,móu mù,tā,mǔ,láo,rèn,māng,fāng,máo,mù,gāng,wù,yàn,gē qiú,bèi,sì,jiàn,gǔ,yòu chōu,kē,shēng,mǔ,dǐ,qiān,quàn,quán,zì,tè,xī,máng,kēng,qiān,wǔ,gù,xī,lí,lí,pǒu,jī,gāng,zhí tè,bēn,quán,chún,dú,jù,jiā,jiān qián,fēng,piān,kē,jú,kào,chú,xì,bèi,luò,jiè,má,sān,wèi,máo lí,dūn,tóng,qiáo,jiàng,xī,lì,dú,liè,pái,piāo,bào,xī,chōu,wéi,kuí,chōu,quǎn,quǎn,quǎn bá,fàn,qiú,jǐ,chái,zhuó bào,hān àn,gē,zhuàng,guǎng,mǎ,yóu,kàng gǎng,pèi fèi,hǒu,yà,yín,huān fān,zhuàng,yǔn,kuáng,niǔ,dí,kuáng,zhòng,mù,bèi,pī,jú,yí quán chí,shēng xīng,páo,xiá,tuó yí,hú,líng,fèi,pī,nǐ,yǎo,yòu,gǒu,xuè,jū,dàn,bó,kǔ,xiǎn,níng,huán huān,hěn,jiǎo,hé mò,zhào,jié,xùn,shān,tà shì,róng,shòu,tóng dòng,lǎo,dú,xiá,shī,kuài,zhēng,yù,sūn,yú,bì,máng dòu,xī shǐ,juàn,lí,xiá,yín,suān,láng,bèi,zhì,yán,shā,lì,hàn,xiǎn,jīng,pái,fēi,xiāo,bài pí,qí,ní,biāo,yìn,lái,liè,jiān yàn,qiāng,kūn,yàn,guō,zòng,mí,chāng,yī yǐ,zhì,zhēng,yá wèi,měng,cāi,cù,shē,liè,diǎn,luó,hú,zōng,hú,wěi,fēng,wō,yuán,xīng,zhū,māo máo,wèi,chuàn chuān,xiàn,tuān tuàn,yà jiá qiè,náo,xiē hè gé hài,jiā,hóu,biān piàn,yóu,yóu,méi,chá,yáo,sūn,bó pò,míng,huá,yuán,sōu,mǎ,huán,dāi,yù,shī,háo,qiāng,yì,zhēn,cāng,háo gāo,màn,jìng,jiǎng,mò,zhāng,chán,áo,áo,háo,suǒ,fén fèn,jué,bì,bì,huáng,pú,lín lìn,xù,tóng,yào xiāo,liáo,shuò xī,xiāo,shòu,dūn,jiào,gé liè xiē,juàn,dú,huì,kuài,xiǎn,xiè,tǎ,xiǎn,xūn,níng,biān piàn,huò,nòu rú,méng,liè,náo nǎo yōu,guǎng,shòu,lú,tǎ,xiàn,mí,ráng,huān,náo yōu,luó,xiǎn,qí,jué,xuán,miào,zī,shuài lǜ,lú,yù,sù,wáng wàng,qiú,gǎ,dīng,lè,bā,jī,hóng,dì,chuàn,gān,jiǔ,yú,qǐ,yú,chàng yáng,mǎ,hóng,wǔ,fū,mín wén,jiè,yá,bīn fēn,biàn,bàng,yuè,jué,mén yǔn,jué,wán,jiān qián,méi,dǎn,pín,wěi,huán,xiàn,qiāng cāng,líng,dài,yì,án gān,píng,diàn,fú,xuán xián,xǐ,bō,cī cǐ,gǒu,jiǎ,sháo,pò,cí,kē,rǎn,shēng,shēn,yí tāi,zǔ jù,jiā,mín,shān,liǔ,bì,zhēn,zhēn,jué,fà,lóng,jīn,jiào,jiàn,lì,guāng,xiān,zhōu,gǒng,yān,xiù,yáng,xǔ,luò,sù,zhū,qín,yín kèn,xún,bǎo,ěr,xiàng,yáo,xiá,héng,guī,chōng,xù,bān,pèi,lǎo,dāng,yīng,hún huī,wén,é,chéng,dì tí,wǔ,wú,chéng,jùn,méi,bèi,tǐng,xiàn,chù,hán,xuán qióng,yán,qiú,xuàn,láng,lǐ,xiù,fú fū,liú,yá,xī,líng,lí,jīn,liǎn,suǒ,suǒ,fēng,wán,diàn,pín bǐng,zhǎn,cuì sè,mín,yù,jū,chēn,lái,mín,shèng,wéi yù,tiǎn tiàn,shū,zhuó zuó,běng pěi,chēng,hǔ,qí,è,kūn,chāng,qí,běng,wǎn,lù,cóng,guǎn,yǎn,diāo,bèi,lín,qín,pí,pá,què,zhuó,qín,fà,jīn,qióng,dǔ,jiè,hún huī,yǔ,mào,méi,chūn,xuān,tí,xīng,dài,róu,mín,jiān,wěi,ruǎn,huàn,xié jiē,chuān,jiǎn,zhuàn,chàng yáng,liàn,quán,xiá,duàn,yuàn,yé,nǎo,hú,yīng,yú,huáng,ruì,sè,liú,shī,róng,suǒ,yáo,wēn,wǔ,zhēn,jìn,yíng yǐng,mǎ,tāo,liú,táng,lì,láng,guī,tiàn tián zhèn,qiāng cāng,cuō,jué,zhǎo,yáo,ài,bīn pián,tú shū,cháng,kūn,zhuān,cōng,jǐn,yī,cuǐ,cōng,qí,lí,jǐng,zǎo suǒ,qiú,xuán,áo,liǎn,mén,zhāng,yín,yè,yīng,zhì,lù,wú,dēng,xiù,zēng,xún,qú,dàng,lín,liáo,qióng jué,sù,huáng,guī,pú,jǐng,fán,jīn,liú,jī,huì,jǐng,ài,bì,càn,qú,zǎo,dāng,jiǎo,guǎn,tǎn,huì kuài,huán,sè,suì,tián,chǔ,yú,jìn,lú fū,bīn pián,shú,wèn,zuǐ,lán,xǐ,jì zī,xuán,ruǎn,wò,gài,léi,dú,lì,zhì,róu,lí,zàn,qióng,tì,guī,suí,là,lóng,lú,lì,zàn,làn,yīng,mí xǐ,xiāng,qióng wěi wèi,guàn,dào,zàn,huán yè yà,guā,bó,dié,bó páo,hù,zhí hú,piáo,bàn,ráng,lì,wǎ wà,none,xiáng hóng,qián wǎ,bǎn,pén,fǎng,dǎn,wèng,ōu,none,none,wa,hú,líng,yí,píng,cí,none,juàn juān,cháng,chī,none,dàng,wā,bù,zhuì,píng,biān,zhòu,zhēn,none,cí,yīng,qì,xián,lǒu,dì,ōu,méng,zhuān,bèng,lìn,zèng,wǔ,pì,dān,wèng,yīng,yǎn,gān,dài,shèn shén,tián,tián,hán,cháng,shēng,qíng,shēn,chǎn,chǎn,ruí,shēng,sū,shēn,yòng,shuǎi,lù,fǔ,yǒng,béng,béng,níng nìng,tián,yóu,jiǎ,shēn,yóu zhá,diàn,fú,nán,diàn tián shèng,pīng,tǐng dīng,huà,tǐng dīng,zhèn,zāi zī,méng,bì,bì qí,mǔ,xún,liú,chàng,mǔ,yún,fàn,fú,gēng,tián,jiè,jiè,quǎn,wèi,fú bì,tián,mǔ,none,pàn,jiāng,wā,dá fú,nán,liú,běn,zhěn,xù chù,mǔ,mǔ,cè jì,zāi zī,gāi,bì,dá,zhì chóu shì,lüè,qí,lüè,fān pān,yī,fān pān,huà,shē yú,shē,mǔ,jùn,yì,liú,shē,dié,chóu,huà,dāng dàng dǎng,zhuì,jī,wǎn,jiāng jiàng,chéng,chàng,tuǎn,léi,jī,chā,liú,dié,tuǎn,lín lìn,jiāng,jiāng qiáng,chóu,pì,dié,dié,pǐ yǎ shū,jié qiè,dàn,shū,shū,zhì dì,yí nǐ,nè,nǎi,dīng,bǐ,jiē,liáo,gāng,gē yì,jiù,zhǒu,xià,shàn,xū,nüè yào,lì lài,yáng,chèn,yóu,bā,jiè,jué xuè,qí,yǎ xiā,cuì,bì,yì,lì,zòng,chuāng,fēng,zhù,pào,pí,gān,kē,cī,xuē,zhī,dǎn,zhěn,fá biǎn,zhǐ,téng,jū,jí,fèi féi,gōu,shān diàn,jiā,xuán,zhà,bìng,niè,zhèng zhēng,yōng,jìng,quán,téng chóng,tōng tóng,yí,jiē,wěi yòu yù,huí,tān shǐ,yǎng,zhì,zhì,hén,yǎ,mèi,dòu,jìng,xiāo,tòng,tū,máng,pǐ,xiāo,suān,pū pù,lì,zhì,cuó,duó,wù,shā,láo,shòu,huàn,xián,yì,bēng péng,zhàng,guǎn,tán,fèi féi,má,má lìn,chī,jì,tiǎn diàn,ān yè è,chì,bì,bì,mín,gù,duī,kē ē,wěi,yū,cuì,yǎ,zhú,cù,dàn dān,shèn,zhǒng,zhì chì,yù,hóu,fēng,là,yáng,chén,tú,yǔ,guō,wén,huàn,kù,jiǎ xiá xiā,yīn,yì,lòu,sào,jué,chì,xī,guān,yì,wēn,jí,chuāng,bān,huì lěi,liú,chài cuó,shòu,nüè yào,diān chēn,dá da,biē biě,tān,zhàng,biāo,shèn,cù,luǒ,yì,zòng,chōu,zhàng,zhài,sòu,sè,qué,diào,lòu,lòu,mò,qín,yǐn,yǐng,huáng,fú,liáo,lóng,qiáo jiào,liú,láo,xián,fèi,dàn dān,yìn,hè,ái,bān,xián,guān,guì wēi,nòng nóng,yù,wēi,yì,yōng,pǐ,lěi,lì lài,shǔ,dàn,lǐn,diàn,lǐn,lài,biē biě,jì,chī,yǎng,xuǎn,jiē,zhēng,mèng,lì,huò,lài,jī,diān,xuǎn,yǐng,yǐn,qú,yōng,tān,diān,luǒ,luán,luán,bō,bō bǒ,guǐ,bá,fā,dēng,fā,bái,bǎi,qié,jí bī,zào,zào,mào,de dí dì,pā bà,jiē,huáng,guī,cǐ,líng,gāo háo,mò,jí,jiǎo,pěng,gāo yáo,ái,é,hào,hàn,bì,wǎn,chóu,qiàn,xī,ái,xiǎo,hào,huàng,hào,zé,cuǐ,hào,xiǎo,yè,pó,hào,jiǎo,ài,xīng,huàng,lì luò bō,piǎo,hé,jiào,pí,gǎn,pào,zhòu,jūn,qiú,cūn,què,zhā,gǔ,jūn,jūn,zhòu,zhā cǔ,gǔ,zhāo zhǎn dǎn,dú,mǐn,qǐ,yíng,yú,bēi,diào,zhōng,pén,hé,yíng,hé,yì,bō,wǎn,hé,àng,zhǎn,yán,jiān jiàn,hé,yū,kuī,fàn,gài gě hé,dào,pán,fǔ,qiú,shèng chéng,dào,lù,zhǎn,méng,lí,jìn,xù,jiān jiàn,pán,guàn,ān,lú,xǔ,zhōu chóu,dàng,ān,gǔ,lì,mù,dīng,gàn,xū,máng,máng wàng,zhí,qì,yuǎn,xián tián,xiāng xiàng,dǔn,xīn,xì pǎn,pàn,fēng,dùn,mín,míng,shěng xǐng,shì,yún hùn,miǎn,pān,fǎng,miǎo,dān,méi,mào,kàn kān,xiàn,kōu,shì,yāng yǎng yìng,zhēng,yǎo āo ǎo,shēn,huò,dà,zhěn,kuàng,jū xū kōu,shèn,yí chì,shěng,mèi,mò miè,zhù,zhēn,zhēn,mián,shì,yuān,dié tì,nì,zì,zì,chǎo,zhǎ,xuàn,bǐng fǎng,pàng pán,lóng,guì suī,tóng,mī mí,dié zhì,dì,nè,míng,xuàn shùn xún,chī,kuàng,juàn,móu,zhèn,tiào,yáng,yǎn,mò,zhòng,mò,zhuó zháo zhāo zhe,zhēng,méi,suō,qiáo shào xiāo,hàn,huǎn,dì,chěng,cuó zhuài,juàn,é,miǎn,xiàn,xī,kùn,lài,jiǎn,shǎn,tiǎn,gùn,wān,lèng,shì,qióng,lì,yá,jīng,zhēng,lí,lài,suì zuì,juàn,shuì,huī suī,dū,bì,bì pì,mù,hūn,nì,lù,yì zé gāo,jié,cǎi,zhǒu,yú,hūn,mà,xià,xǐng xìng,huī,hùn,zāi,chǔn,jiān,mèi,dǔ,hóu,xuān,tí,kuí,gāo,ruì,mào,xù,fá,wò,miáo,chǒu,guì wèi kuì,mī mí,wěng,kòu jì,dàng,chēn,kē,sǒu,xiā,qióng huán,mò,míng,mán mén,fèn,zé,zhàng,yì,diāo dōu,kōu,mò,shùn,cōng,lóu lǘ lou,chī,mán mén,piǎo,chēng,guī,méng měng,wàn,rún shùn,piē,xī,qiáo,pú,zhǔ,dèng,shěn,shùn,liǎo liào,chè,xián jiàn,kàn,yè,xuè,tóng,wǔ mí,lín,guì kuì,jiàn,yè,ài,huì,zhān,jiǎn,gǔ,zhào,qú jù,wéi,chǒu,sào,nǐng chēng,xūn,yào,huò yuè,mēng,mián,pín,mián,lěi,kuàng guō,jué,xuān,mián,huò,lú,méng měng,lóng,guàn quán,mǎn mán,xǐ,chù,tǎng,kàn,zhǔ,máo,jīn qín guān,jīn qín guān,yù xù jué,shuò,zé,jué,shǐ,yǐ,shěn,zhī zhì,hóu hòu,shěn,yǐng,jǔ,zhōu,jiǎo jiáo,cuó,duǎn,ǎi,jiǎo jiáo,zēng,yuē,bà,shí dàn,dìng,qì,jī,zǐ,gān,wù,zhé,kū,gāng qiāng kòng,xī,fán,kuàng,dàng,mǎ,shā,dān,jué,lì,fū,mín,è,xū huā,kāng,zhǐ,qì qiè,kǎn,jiè,pīn bīn fēn,è,yà,pī,zhé,yán yàn,suì,zhuān,chē,dùn,wǎ,yàn,jīn,fēng,fǎ,mò,zhǎ,jū,yù,kē luǒ,tuó,tuó,dǐ,zhài,zhēn,ě,fú fèi,mǔ,zhù zhǔ,lì lā lá,biān,nǔ,pīng,pēng,líng,pào,lè,pò,bō,pò,shēn,zá,ài,lì,lóng,tóng,yòng,lì,kuàng,chǔ,kēng,quán,zhū,kuāng guāng,guī,è,náo,qià,lù,wěi guì,ài,luò gè,kèn xiàn gǔn yǐn,xíng,yán yàn,dòng,pēng píng,xī,lǎo,hóng,shuò shí,xiá,qiāo,qíng,wéi wèi ái,qiáo,yì,kēng,xiāo,què kè kù,chàn,láng,hōng,yù,xiāo,xiá,mǎng bàng,luò lòng,yǒng tóng,chē,chè,wò,liú,yìng,máng,què,yàn,shā,kǔn,yù,chì,huā,lǔ,chěn,jiǎn,nüè,sōng,zhuó,kēng kěng,péng,yān yǎn,zhuì chuí duǒ,kōng,chēng,qí,zòng cóng,qìng,lín,jūn,bō,dìng,mín,diāo,jiān zhàn,hè,lù liù,ài,suì,què xī,léng,bēi,yín,duì,wǔ,qí,lún lǔn lùn,wǎn,diǎn,náo gāng,bèi,qì,chěn,ruǎn,yán,dié,dìng,zhóu,tuó,jié yà,yīng,biǎn,kè,bì,wěi wèi,shuò shí,zhēn,duàn,xiá,dàng,tí dī,nǎo,pèng,jiǎn,dì,tàn,chá chā,tián,qì,dùn,fēng,xuàn,què,què qiāo,mǎ,gōng,niǎn,sù xiè,é,cí,liú liù,sī tí,táng,bàng páng,huá kě gū,pī,kuǐ wěi,sǎng,lěi,cuō,tián,xiá qià yà,xī,lián qiān,pán,wèi ái gài,yǔn,duī,zhé,kē,lá lā,zhuān,yáo,gǔn,zhuān,chán,qì,áo qiāo,pēng pèng,liù,lǔ,kàn,chuǎng,chěn,yīn yǐn,lěi léi,biāo,qì,mó mò,qì zhú,cuī,zōng,qìng,chuò,lún,jī,shàn,láo luò,qú,zēng,dèng,jiàn,xì,lín,dìng,diàn,huáng,pán bō,jí shé,qiāo,dī,lì,jiàn,jiāo,xī,zhǎng,qiáo,dūn,jiǎn,yù,zhuì,hé qiāo qiào,kè huò,zé,léi lěi,jié,chǔ,yè,què hú,dàng,yǐ,jiāng,pī,pī,yù,pīn,è qì,ài,kē,jiān,yù,ruǎn,méng,pào,cí,bō,yǎng,miè,cǎ,xián xín,kuàng,léi lěi lèi,lěi,zhì,lì,lì,fán,què,pào,yīng,lì,lóng,lóng,mò,bó,shuāng,guàn,jiān,cǎ,yán yǎn,shì,shì,lǐ,réng,shè,yuè,sì,qí,tā,mà,xiè,yāo,xiān,zhǐ qí,qí,zhǐ,bēng fāng,duì,zhòng,rèn,yī,shí,yòu,zhì,tiáo,fú,fù,mì bì,zǔ,zhī,suàn,mèi,zuò,qū,hù,zhù,shén,suì,cí,chái,mí,lǚ,yǔ,xiáng,wú,tiāo,piào piāo,zhù,guǐ,xiá,zhī,jì zhài,gào,zhēn,gào,shuì lèi,jìn,shèn,gāi,kǔn,dì,dǎo,huò,táo,qí,gù,guàn,zuì,líng,lù,bǐng,jīn jìn,dǎo,zhí,lù,chán shàn,bì pí,chǔ,huī,yǒu,xì,yīn,zī,huò,zhēn,fú,yuàn,xú,xiǎn,shāng yáng,tí zhǐ,yī,méi,sī,dì,bèi,zhuó,zhēn,yíng,jì,gào,táng,sī,mà,tà,fù,xuān,qí,yù,xǐ,jī jì,sì,shàn chán,dàn,guì,suì,lǐ,nóng,mí,dǎo,lì,ráng,yuè,tí,zàn,lèi,róu,yǔ,yú yù ǒu,lí,xiè,qín,hé,tū,xiù,sī,rén,tū,zǐ zì,chá ná,gǎn,yì zhí,xiān,bǐng,nián,qiū,qiū,zhǒng zhòng chóng,fèn,hào mào,yún,kē,miǎo,zhī,jīng,bǐ,zhǐ,yù,mì bì,kù kū,bàn,pī,ní nì,lì,yóu,zū,pī,bó,líng,mò,chèng,nián,qín,yāng,zuó,zhì,dī,shú,jù,zǐ,huó kuò,jī,chēng chèn chèng,tóng,shì zhì,huó kuò,huō,yīn,zī,zhì,jiē,rěn,dù,yí,zhū,huì,nóng,fù pū,xī,gǎo,láng,fū,xùn zè,shuì,lǚ,kǔn,gǎn,jīng,tí,chéng,tú shǔ,shāo shào,shuì,yà,lǔn,lù,gū,zuó,rěn,zhùn zhǔn,bàng,bài,jī qí,zhī,zhì,kǔn,léng lēng líng,péng,kē,bǐng,chóu,zuì zú sū,yù,sū,lüè,xiāng,yī,xì qiè,biǎn,jì,fú,pì bì,nuò,jiē,zhǒng zhòng,zōng zǒng,xǔ xū,chēng chèn chèng,dào,wěn,xián jiān liàn,zī jiū,yù,jì,xù,zhěn,zhì,dào,jià,jī qǐ,gǎo,gǎo,gǔ,róng,suì,ròng,jì,kāng,mù,cǎn shān cēn,mén méi,zhì,jì,lù,sū,jī,yǐng,wěn,qiū,sè,hè,yì,huáng,qiè,jǐ jì,suì,xiāo rào,pú,jiāo,zhuō bó,tóng zhǒng,zuō,lǔ,suì,nóng,sè,huì,ráng,nuò,yǔ,pīn,jì,tuí,wěn,chēng chèn chèng,huò,kuàng,lǚ,biāo pāo,sè,ráng,zhuō jué,lí,cuán zàn,xué,wā,jiū,qióng,xī,qióng,kōng kòng kǒng,yū yǔ,shēn,jǐng,yào,chuān,zhūn,tū,láo,qiè,zhǎi,yǎo,biǎn,báo,yǎo,bìng,wā,zhú kū,jiào liáo liù,qiào,diào,wū,wā guī,yáo,zhì,chuāng,yào,tiǎo yáo,jiào,chuāng,jiǒng,xiāo,chéng,kòu,cuàn,wō,dàn,kū,kē,zhuó,huò,sū,guān,kuī,dòu,zhuō,yìn xūn,wō,wā,yà yē,yú,jù,qióng,yáo,yáo,tiǎo,cháo,yǔ,tián diān yǎn,diào,jù,liào,xī,wù,kuī,chuāng,chāo kē,kuǎn cuàn,kuǎn cuàn,lóng,chēng chèng,cuì,liáo,zào,cuàn,qiào,qióng,dòu,zào,lǒng,qiè,lì,chù,shí,fù,qiān,chù qì,hóng,qí,háo,shēng,fēn,shù,miào,qǔ kǒu,zhàn,zhù,líng,lóng,bìng,jìng,jìng,zhāng,bǎi,sì,jùn,hóng,tóng,sǒng,jìng zhěn,diào,yì,shù,jìng,qǔ,jié,píng,duān,lí,zhuǎn,céng zēng,dēng,cūn,wāi,jìng,kǎn kàn,jìng,zhú,zhú dǔ,lè jīn,péng,yú,chí,gān,máng,zhú,wán,dǔ,jī,jiǎo jiào,bā,suàn,jí,qǐn,zhào,sǔn,yá,zhuì ruì,yuán,hù,háng hàng,xiào,cén jìn hán,pí bì,bǐ,jiǎn,yǐ,dōng,shān,shēng,dā xiá nà,dí,zhú,nà,chī,gū,lì,qiè,mǐn,bāo,tiáo,sì,fú,cè,bèn,fá,dá,zǐ,dì,líng,zuó zé,nú,fú fèi,gǒu,fán,jiā,gě,fàn,shǐ,mǎo,pǒ,tì,jiān,qióng,lóng lǒng,mǐn,biān,luò,guì,qū,chí,yīn,yào,xiǎn,bǐ,qióng,kuò,děng,jiǎo jiào,jīn,quán,sǔn,rú,fá,kuāng,zhù zhú,tǒng,jī,dá dā,háng,cè,zhòng,kòu,lái,bì,shāi,dāng,zhēng,cè,fū,yún jūn,tú,pá,lí,láng làng,jǔ,guǎn,jiǎn,hán,tǒng,xiá,zhì zhǐ,chéng,suàn,shì,zhù,zuó,xiǎo,shāo,tíng,cè,yán,gào,kuài,gān,chóu,kuāng,gàng,yún,o,qiān,xiǎo,jiǎn,póu bù fú pú,lái,zōu,pái bēi,bì,bì,gè,tái chí,guǎi dài,yū,jiān,zhào dào,gū,chí,zhēng,qìng jīng,shà,zhǒu,lù,bó,jī,lín lǐn,suàn,jùn qūn,fú,zhá,gū,kōng,qián,quān,jùn,chuí,guǎn,wǎn yuān,cè,zú,pǒ,zé,qiè,tuò,luó,dān,xiāo,ruò,jiàn,xuān,biān,sǔn,xiāng,xiǎn,píng,zhēn,xīng,hú,shī yí,zhù,yuē yào chuò,chūn,lǜ,wū,dǒng,shuò xiāo qiào,jí,jié,huáng,xīng,mèi,fàn,chuán,zhuàn,piān,fēng,zhù zhú,hóng,qiè,hóu,qiū,miǎo,qiàn,gū,kuì,yì,lǒu,yún,hé,táng,yuè,chōu,gāo,fěi,ruò,zhēng,gōu,niè,qiàn,xiǎo,cuàn,gōng gǎn lǒng,péng páng,dǔ,lì,bì,zhuó huò,chú,shāi,chí,zhù,qiāng cāng,lóng lǒng,lán,jiǎn jiān,bù,lí,huì,bì,zhú dí,cōng,yān,péng,cēn zān cǎn,zhuàn zuàn suǎn,pí,piǎo biāo,dōu,yù,miè,tuán zhuān,zé,shāi,guó guì,yí,hù,chǎn,kòu,cù,píng,zào,jī,guǐ,sù,lǒu,cè jí,lù,niǎn,suō,cuàn,diāo,suō,lè,duàn,zhù,xiāo,bó,mì miè,shāi sī,dàng,liáo,dān,diàn,fǔ,jiǎn,mǐn,kuì,dài,jiāo,dēng,huáng,sǔn zhuàn,láo,zān,xiāo,lù,shì,zān,qí,pái,qí,pái,gǎn gàn,jù,lù,lù,yán,bò bǒ,dāng,sài,zhuā,gōu,qiān,lián,bù bó,zhòu,lài,shi,lán,kuì,yú,yuè,háo,zhēn jiān,tái,tì,niè,chóu,jí,yí,qí,téng,zhuàn,zhòu,fān pān biān,sǒu shǔ,zhòu,qiān,zhuó,téng,lù,lú,jiǎn jiān,tuò,yíng,yù,lài,lóng lǒng,qiè,lián,lán,qiān,yuè,zhōng,qú,lián,biān,duàn,zuǎn,lí,shāi,luó,yíng,yuè,zhuó,yù,mǐ,dí,fán,shēn,zhé,shēn,nǚ,hé,lèi,xiān,zǐ,ní,cùn,zhàng,qiān,zhāi,bǐ,bǎn,wù,shā chǎo,kāng jīng,róu,fěn,bì,cuì,yǐn,zhé,mǐ,tà,hù,bā,lì,gān,jù,pò,yù,cū,zhān,zhòu,chī,sù,tiào,lì,xī,sù,hóng,tóng,zī cí,cè sè,yuè,zhōu yù,lín,zhuāng,bǎi,lāo,fèn,ér,qū,hé,liáng,xiàn,fū fú,liáng,càn,jīng,lǐ,yuè,lù,jú,qí,cuì,bài,zhāng,lín,zòng,jīng,guǒ,huā,sǎn shēn,shēn,táng,biān biǎn,róu,miàn,hóu,xǔ,zòng,hū hú hù,jiàn,zān,cí,lí,xiè,fū,nuò,bèi,gǔ gòu,xiǔ,gāo,táng,qiǔ,jiā,cāo,zhuāng,táng,mí méi,sǎn shēn,fèn,zāo,kāng,jiàng,mó,sǎn shēn,sǎn,nuò,xī,liáng,jiàng,kuài,bó,huán,shǔ,zòng,xiàn,nuò,tuán,niè,lì,zuò,dí,niè,tiào,làn,mì sī,sī,jiū jiǔ,xì jì,gōng,zhēng zhěng,jiū,gōng,jì,chà chǎ,zhòu,xún,yuē yāo,hóng gōng,yū,hé gē,wán,rèn,wěn,wén wèn,qiú,nà,zī,tǒu,niǔ,fóu,jì jié jiè,shū,chún,pī pí bǐ,zhèn,shā,hóng,zhǐ,jí,fēn,yún,rèn,dǎn,jīn jìn,sù,fǎng,suǒ,cuì,jiǔ,zhā zā,hā,jǐn,fū fù,zhì,qī,zǐ,chōu chóu,hóng,zhā zā,léi lěi lèi,xì,fú,xiè,shēn,bō bì,zhù,qū qǔ,líng,zhù,shào,gàn,yǎng,fú,tuó,zhěn tiǎn,dài,chù,shī,zhōng,xián,zǔ,jiōng jiǒng,bàn,qú,mò,shù,zuì,kuàng,jīng,rèn,háng,xiè,jié jiē,zhū,chóu,guà kuā,bǎi mò,jué,kuàng,hú,cì,huán gēng,gēng,tāo,xié jié,kù,jiǎo,quán shuān,gǎi ǎi,luò lào,xuàn,bēng bīng pēng,xiàn,fú,gěi jǐ,tōng tóng dòng,róng,tiào diào dào,yīn,lěi lèi léi,xiè,juàn,xù,gāi hài,dié,tǒng,sī,jiàng,xiáng,huì,jué,zhí,jiǎn,juàn,chī zhǐ,miǎn wèn mán wàn,zhèn,lǚ,chéng,qiú,shū,bǎng,tǒng,xiāo,huán huàn wàn,qīn xiān,gěng,xū,tí tì,xiù,xié,hóng,xì,fú,tīng,suí,duì,kǔn,fū,jīng,hù,zhī,yán xiàn,jiǒng,féng,jì,xù,rěn,zōng zèng,lín chēn,duǒ,lì liè,lǜ,jīng,chóu,quǎn,shào,qí,qí,zhǔn zhùn,jī qí,wǎn,qiàn qīng zhēng,xiàn,shòu,wéi,qìng qǐ,táo,wǎn,gāng,wǎng,bēng běng bèng,zhuì,cǎi,guǒ,cuì,lún guān,liǔ,qǐ,zhàn,bì,chuò chāo,líng,mián,qī,jī,tián tǎn chān,zōng,gǔn,zōu,xī,zī,xìng,liǎng,jǐn,fēi,ruí,mín,yù,zǒng,fán,lǜ lù,xù,yīng,shàng,zī,xù,xiāng,jiān,kè,xiàn,ruǎn ruàn,mián,jī qī,duàn,chóng zhòng,dì,mín,miáo máo,yuán,xiè yè,bǎo,sī,qiū,biān,huǎn,gēng gèng,zǒng,miǎn,wèi,fù,wěi,tōu xū shū,gōu,miǎo,xié,liàn,zōng zòng,biàn pián,gǔn yùn,yīn,tí,guā wō,zhì,yùn yūn wēn,chēng,chán,dài,xié,yuán,zǒng,xū,shéng,wēi,gēng gèng,xuān,yíng,jìn,yì,zhuì,nì,bāng bàng,gǔ hú,pán,zhòu,jiān,cī cuò suǒ,quán,shuǎng,yùn yūn wēn,xiá,cuī suī shuāi,xì,róng rǒng ròng,tāo,fù,yún,zhěn,gǎo,rù,hú,zài zēng,téng,xiàn xuán,sù,zhěn,zòng,tāo,huǎng,cài,bì,féng fèng,cù,lí,suō sù,yǎn yǐn,xǐ,zòng zǒng,léi,zhuàn juàn,qiàn,màn,zhí,lǚ,mù mò,piǎo piāo,lián,mí,xuàn,zǒng,jì,shān,suì,fán pó,lǜ,bēng běng bèng,yī,sāo,móu miù miào mù liǎo,yáo yóu zhòu,qiǎng,shéng,xiān,jì,zōng zòng,xiù,rán,xuàn,suì,qiāo,zēng zèng,zuǒ,zhī zhì,shàn,sǎn,lín,jú jué,fān,liáo,chuō chuò,zūn zǔn,jiàn,rào,chǎn chán,ruǐ,xiù,huì huí,huà,zuǎn,xī,qiǎng,wén,da,shéng,huì,xì jì,sè,jiǎn,jiāng,huán,qiāo sāo,cōng,xiè,jiǎo zhuó,bì,dàn tán chán,yì,nǒng,suì,yì,shā,rú,jì,bīn,qiǎn,lán,pú fú,xūn,zuǎn,zī,péng,yào lì,mò,lèi,xiè,zuǎn,kuàng,yōu,xù,léi,xiān,chán,jiǎo,lú,chán,yīng,cái,xiāng rǎng,xiān,zuī,zuǎn,luò,lí xǐ lǐ sǎ,dào,lǎn,léi,liàn,sī,jiū,yū,hóng gōng,zhòu,xiān qiàn,hé gē,yuē yāo,jí,wán,kuàng,jì jǐ,rèn,wěi,yún,hóng,chún,pī pí bǐ,shā,gāng,nà,rèn,zòng zǒng,lún guān,fēn,zhǐ,wén wèn,fǎng,zhù,zhèn,niǔ,shū,xiàn,gàn,xiè,fú,liàn,zǔ,shēn,xì,zhī zhì,zhōng,zhòu,bàn,fú,chù,shào,yì,jīng,dài,bǎng,róng,jié jiē,kù,rào,dié,háng,huì,gěi jǐ,xuàn,jiàng,luò lào,jué,jiǎo,tǒng,gěng,xiāo,juàn,xiù,xì,suí,tāo,jì,tí tì,jì,xù,líng,yīng,xù,qǐ,fēi,chuò chāo,shàng,gǔn,shéng,wéi,mián,shòu,bēng běng bèng,chóu,táo,liǔ,quǎn,zōng zèng,zhàn,wǎn,lǜ lù,zhuì,zī,kè,xiāng,jiān,miǎn,lǎn,tí,miǎo,jī qī,yùn yūn wēn,huì huí,sī,duǒ,duàn,biàn pián,xiàn,gōu,zhuì,huǎn,dì,lǚ,biān,mín,yuán,jìn,fù,rù,zhěn,féng fèng,cuī suī shuāi,gǎo,chán,lí,yì,jiān,bīn,piǎo piāo,màn,léi,yīng,suō sù,móu miù miào mù liǎo,sāo,xié,liáo,shàn,zēng zèng,jiāng,qiǎn,qiāo sāo,huán,jiǎo zhuó,zuǎn,fǒu,xiè,gāng,fǒu,quē,fǒu,quē,bō,píng,xiàng,zhào,gāng,yīng,yīng,qìng,xià,guàn,zūn,tán,chēng,qì,wèng,yīng,léi,tán,lú,guàn,wǎng,wǎng,wǎng,wǎng,hǎn,wǎng,luó,fú,shēn,fá,gū,zhǔ,jū,máo,gǔ,mín,gāng,bà ba pí,guà,tí,juàn,fú,shēn,yǎn,zhào,zuì,guǎi guà,zhuó,yù,zhì,ǎn,fá,lǎn,shǔ,sī,pí,mà,liǔ,bà ba pí,fá,lí,cháo,wèi,bì,jì,zēng,chōng,liǔ,jī,juàn,mì,zhào,luó,pí,jī,jī,luán,yáng xiáng,mǐ,qiāng,dá,měi,yáng xiáng,líng,yǒu,fén,bā,gāo,yàng,gǔ,qiāng,zāng,měi gāo,líng,yì xī,zhù,dī,xiū,qiǎng,yí,xiàn,róng,qún,qún,qiǎng,huán,suō,xiàn,yì,yōu,qiāng kòng,qián xián yán,yú,gēng,jié,tāng,yuán,xī,fán,shān,fén,shān,liǎn,léi,gēng,nóu,qiàng,chàn,yǔ,hóng gòng,yì,chōng,wēng,fēn,hóng,chì,chì,cuì,fú,xiá,běn,yì,là,yì,pī bì pō,líng,liù,zhì,qú yù,xí,xié,xiáng,xī,xī,ké,qiáo qiào,huì,huī,xiāo,shà,hóng,jiāng,dí zhái,cuì,fěi,dào zhōu,shà,chì,zhù,jiǎn,xuān,chì,piān,zōng,wán,huī,hóu,hé,hè,hàn,áo,piāo,yì,lián,hóu qú,áo,lín,pěn,qiáo qiào,áo,fān,yì,huì,xuān,dào,yào,lǎo,lǎo,kǎo,mào,zhě,qí shì,gǒu,gǒu,gǒu,dié,dié,ér,shuǎ,ruǎn nuò,ér nài,nài,duān zhuān,lěi,tīng,zǐ,gēng,chào,hào,yún,bà pá,pī,sì chí,sì,qù chú,jiā,jù,huō,chú,lào,lún lǔn,jí jiè,tǎng,ǒu,lóu,nòu,jiǎng,pǎng,zhá zé,lóu,jī,lào,huò,yōu,mò,huái,ěr,yì,dīng,yé yē,dā,sǒng,qín,yún yíng,chǐ,dān,dān,hóng,gěng,zhí,pàn,niè,dān,zhěn,chè,líng,zhēng,yǒu,wà tuǐ zhuó,liáo,lóng,zhí,níng,tiāo,ér nǜ,yà,tiē zhé,guō,xù,lián,hào,shèng,liè,pìn,jīng,jù,bǐ,dǐ zhì,guó,wén,xù,pīng,cōng,dìng,ní,tíng,jǔ,cōng,kuī,lián,kuì,cōng,lián,wēng,kuì,lián,lián,cōng,áo,shēng,sǒng,tīng,kuì,niè,zhí,dān,níng,qié,nǐ jiàn,tīng,tīng,lóng,yù,yù,zhào,sì,sù,yì,sù,sì,zhào,zhào,ròu,yì,lèi lē,jī,qiú,kěn,cào,gē,bó dí,huàn,huāng,chǐ,rèn,xiāo xiào,rǔ,zhǒu,yuān,dù dǔ,gāng,róng chēn,gān,chāi,wò,cháng,gǔ,zhī,qín hán hàn,fū,féi,bān,pēi,pàn,jiān,fáng,zhūn chún,yóu,nà,āng,kěn,rán,gōng,yù,wěn,yáo,qí,pí bǐ bì,qiǎn,xī,xī,fèi,kěn,jǐng,tài,shèn,zhǒng,zhàng,xié,shèn,wèi,zhòu,dié,dǎn,fèi bì,bá,bó,qú,tián,bèi bēi,guā,tāi,zǐ fèi,fěi kū,zhī,nì,píng pēng,zì,fū fú zhǒu,pàn,zhēn,xián,zuò,pēi,jiǎ,shèng,zhī,bāo,mǔ,qū,hú,qià,chǐ,yìn,xū,yāng,lóng,dòng,kǎ,lú,jìng,nǔ,yān,pāng,kuà,yí,guāng,hǎi,gē gé,dòng,chī,jiāo,xiōng,xiōng,ér,àn,héng,pián,néng nài,zì,guī kuì,zhēng,tiǎo,zhī,cuì,méi,xié,cuì,xié,mài,mài mò,jǐ,xié,nín,kuài,sà,zàng,qí,nǎo,mǐ,nóng,luán,wàn,bó,wěn,wǎn,xiū,jiǎo,jìng,róu,hēng,cuǒ,liè,shān,tǐng,méi,chún,shèn,jiá,none,juān,cù,xiū,xìn,tuō,pāo,chéng,něi,fǔ,dòu,tuō,niào,nǎo,pǐ,gǔ,luó,lì,liǎn,zhàng,cuī,jiē,liǎng,shuí,pí,biāo,lún,pián,guò,juàn,chuí,dàn,tiǎn,něi,jīng,nái,là xī,yè,ā yān,rèn,shèn,zhuì,fǔ,fǔ,jū,féi,qiāng,wàn,dòng,pí,guó,zōng,dìng,wò,méi,ruǎn,zhuàn,chì,còu,luó,ǒu,dì,ān,xīng,nǎo,shù,shuàn,nǎn,yùn,zhǒng,róu,è,sāi,tú,yāo,jiàn,wěi,jiǎo,yú,jiā,duàn,bì,cháng,fù,xiàn,nì,miǎn,wà,téng,tuǐ,bǎng,qiǎn,lǚ,wà,shòu,táng,sù,zhuì,gé,yì,bó,liáo,jí,pí,xié,gāo gào,lǚ,bìn,ōu,cháng,lù biāo,guó,pāng,chuái,biāo,jiǎng,fū,táng,mó,xī,zhuān chuán chún zhuǎn,lǜ,jiāo,yìng,lǘ,zhì,xuě,cūn,lìn,tóng,péng,nì,chuài,liáo,cuì,kuì,xiāo,tēng,fán pán,zhí,jiāo,shàn,hū wǔ,cuì,rùn,xiāng,suǐ,fèn,yīng,shān dàn,zhuā,dǎn,kuài,nóng,tún,lián,bì bei,yōng,jué,chù,yì,juǎn,là gé,liǎn,sāo sào,tún,gǔ,qí,cuì,bìn,xūn,nào,wò yuè,zàng,xiàn,biāo,xìng,kuān,là,yān,lú,huò,zā,luǒ,qú,zàng,luán,ní luán,zā,chén,qiān xián,wò,guàng jiǒng,zāng zàng cáng,lín,guǎng jiǒng,zì,jiǎo,niè,chòu xiù,jì,gāo,chòu,mián biān,niè,zhì,zhì,gé,jiàn,dié zhí,zhī jìn,xiū,tái,zhēn,jiù,xiàn,yú,chā,yǎo,yú,chōng,xì,xì,jiù,yú,yǔ,xīng,jǔ,jiù,xìn,shé,shè,shè,jiǔ,shì,tān,shū,shì,tiǎn,tàn,pù,pù,guǎn,huà,tiàn,chuǎn,shùn,xiá,wǔ,zhōu,dāo,chuán,shān,yǐ,fán,pā,tài,fán,bǎn,chuán,háng,fǎng,bān,bǐ,lú,zhōng,jiàn,cāng,líng,zhú,zé,duò,bó,xián,gě,chuán,xiá,lú,qióng,páng,xī,kuā,fú,zào,féng,lí,shāo,yú,láng,tǐng,yù,wěi,bó,měng,niàn,jū,huáng,shǒu,kè,biàn,mù,dié,dào,bàng,chā,yì,sōu,cāng,cáo,lóu,dài,xuě,yào,chōng,dēng,dāng,qiáng,lǔ,yǐ,jí,jiàn,huò,méng,qí,lǔ,lú,chán,shuāng,gèn,liáng,jiān,jiān,sè,yàn,fú,pīng,yàn,yàn,cǎo,ǎo,yì,lè,dǐng,jiāo qiú,ài,nǎi,tiáo,qiú,jié jiē,péng,wán,yì,chā,mián,mǐ,gǎn,qiān,yù,yù,sháo,xiōng,dù,hù xià,qǐ,máng,zì zǐ,huì hū,suī,zhì,xiāng,bì pí,fú,tún chūn,wěi,wú,zhī,qì,shān,wén,qiàn,rén,fú,kōu,jiè gài,lú,xù zhù,jī,qín,qí,yuán yán,fēn,bā,ruì,xīn xìn,jì,huā,lún huā,fāng,wù hū,jué,gōu gǒu,zhǐ,yún,qín,ǎo,chú,máo mào,yá,fèi fú,rèng,háng,cōng,chán yín,yǒu,biàn,yì,qiē,wěi,lì,pǐ,è,xiàn,cháng,cāng,zhù,sū sù,dì tí,yuàn,rǎn,líng,tái tāi,tiáo sháo,dí,miáo,qǐng,lì jī,yòng,kē hē,mù,bèi,bāo,gǒu,mín,yǐ,yǐ,jù qǔ,piě,ruò rě,kǔ,zhù níng,nǐ,pā bó,bǐng,shān shàn,xiú,yǎo,xiān,běn,hóng,yīng,zuó zhǎ,dōng,jū chá,dié,nié,gān,hū,píng pēng,méi,fú,shēng ruí,gū,bì,wèi,fú,zhuó,mào,fàn,qié,máo,máo,bá,zǐ,mò,zī,zhǐ,chí,jì,jīng,lóng,cōng,niǎo,yuán,xué,yíng,qióng,gè,míng,lì,róng,yìn,gèn,qiàn,chǎi,chén,yù,hāo,zì,liè,wú,jì,guī,cì,jiǎn,cí,hòu,guāng,máng,chá,jiāo,jiāo,fú,yú,zhū,zī,jiāng,huí,yīn,chá,fá,róng,rú,chōng,mǎng,tóng,zhòng,qiān,zhú,xún,huán,fū,quán,gāi,dá,jīng,xìng,chuǎn,cǎo,jīng,ér,àn,qiáo,chí,rěn,jiàn,yí tí,huāng,píng,lì,jīn,lǎo,shù,zhuāng,dá,jiá,ráo,bì,cè,qiáo,huì,jì,dàng,zì,róng,hūn,xíng yīng,luò,yíng,qián xún,jìn,sūn,yīn yìn,mǎi,hóng,zhòu,yào,dù,wěi,lí,dòu,fū,rěn,yín,hé,bí,bù,yǔn,dí,tú,suī,suī,chéng,chén,wú,bié,xī,gěng,lì,pú,zhù,mò,lì,zhuāng,zuó,tuō,qiú,suō shā,suō,chén,péng fēng,jǔ,méi,méng,xìng,jìng,chē,shēn xīn,jūn,yán,tíng,yóu,cuò,guān guǎn wǎn,hàn,yǒu,cuò,jiá,wáng,sù yóu,niǔ,shāo xiāo,xiàn,làng liáng,fú piǎo,é,mò mù,wèn wǎn miǎn,jié,nán,mù,kǎn,lái,lián,shì shí,wō,tù tú,xiān liǎn,huò,yóu,yíng,yīng,gòng,chún,mǎng,mǎng,cì,wǎn yùn,jīng,dì,qú,dōng,jiān,zōu chù,gū,lā,lù,jú,wèi,jūn jùn,niè rěn,kūn,hé,pú,zī zì zāi,gǎo,guǒ,fú,lún,chāng,chóu,sōng,chuí,zhàn,mén,cài,bá,lí,tù tú,bō,hàn,bào,qìn,juǎn,xī,qín,dǐ,jiē shà,pú,dàng,jǐn,qiáo zhǎo,tái zhī chí,gēng,huá huà huā,gū,líng,fēi fěi,qín qīn jīn,ān,wǎng,běng,zhǒu,yān,zū,jiān,lǐn má,tǎn,shū,tián tiàn,dào,hǔ,qí,hé,cuì,táo,chūn,bì,cháng,huán,fèi,lái,qī,méng,píng,wěi,dàn,shà,huán,yǎn,yí,tiáo,qí,wǎn,cè,nài,zhěn,tuò,jiū,tiē,luó,bì,yì,pān,bó,pāo,dìng,yíng,yíng,yíng,xiāo,sà,qiū,kē,xiāng,wàn,yǔ,yú,fù,liàn,xuān,xuān,nǎn,cè,wō,chǔn,shāo,yú,biān,mào,ān,è,là luò lào,yíng,kuò,kuò,jiāng,miǎn,zuò,zuò,zū,bǎo,róu,xǐ,yè,ān,qú,jiān,fú,lǜ,jīng,pén,fēng,hóng,hóng,hóu,xìng,tū,zhù zhuó zhe,zī,xiāng,shèn,gé gě,qiā,qíng,mǐ,huáng,shēn,pú,gài,dǒng,zhòu,qián,wěi,bó,wēi,pā,jì,hú,zàng,jiā,duàn,yào,jùn,cōng,quán,wēi,zhēn,kuí,tíng,hūn,xǐ,shī,qì,lán,zōng,yāo,yuān,méi,yūn,shù,dì,zhuàn,guān,rǎn,xuē,chǎn,kǎi,kuì kuài,huā,jiǎng,lóu,wěi,pài,yòng,sōu,yīn,shī,chún,shì shí,yūn,zhēn,làng,rú ná,mēng méng měng,lì,quē,suàn,yuán huán,lì,jǔ,xī,bàng,chú,xú shú,tú,liú,huò,diǎn,qiàn,zū jù,pò,cuó,yuān,chú,yù,kuǎi,pán,pú,pú,nà,shuò,xí xì,fén,yún,zhēng,jiān,jí,ruò,cāng,ēn,mí,hāo,sūn,zhēn,míng,sōu sǒu,xù,liú,xí,gū,láng,róng,wěng,gài gě hé,cuò,shī,táng,luǒ,rù,suō,xuān,bèi,yǎo zhuó,guì,bì,zǒng,gǔn,zuò,tiáo,cè,pèi,lán,dàn,jì,lí,shēn,lǎng,yù,líng,yíng,mò,diào tiáo dí,tiáo,mǎo,tōng,zhú,péng,ān,lián,cōng,xǐ,píng,qiū xū fū,jǐn,chún,jié,wéi,tuī,cáo,yù,yì,zí jú,liǎo lù,bì,lǔ,xù,bù,zhāng,léi,qiáng,màn,yán,líng,jì,biāo,gǔn,hàn,dí,sù,lù,shè,shāng,dí,miè,hūn,màn wàn,bo,dì,cuó,zhè,shēn,xuàn,wèi,hú,áo,mǐ,lóu,cù,zhōng,cài,pó,jiǎng,mì,cōng,niǎo,huì,juàn,yín,jiān,niān,shū,yīn,guó,chén,hù,shā,kòu,qiàn,má,zàng,zé,qiáng,dōu,liǎn,lìn,kòu,ǎi,bì,lí,wěi,jí,qián xún,shèng,fán,méng,ǒu,chǎn,diǎn,xùn,jiāo,ruǐ,ruǐ,lěi,yú,qiáo,zhū,huá,jiān,mǎi,yún,bāo,yóu,qú,lù,ráo,huì,è,tí,fěi,jué,zuì,fà,rú,fén,kuì,shùn,ruí,yǎ,xū,fù,jué,dàng,wú,dǒng,sī,xiāo,xì,sà,yùn,shāo,qí,jiān,yùn,sūn,líng,yù,xiá,wèng,jí,hòng,sì,nóng,lěi,xuān,yùn,yù,xí xiào,hào,báo bó bò,hāo,ài,wēi,huì,huì,jì,cí zī,xiāng,wàn luàn,miè,yì,léng,jiāng,càn,shēn,qiáng sè,lián,kē,yuán,dá,tì,tāng,xuē,bì,zhān,sūn,xiān liǎn,fán,dǐng,xiè,gǔ,xiè,shǔ,jiàn,hāo kǎo,hōng,sà,xīn,xūn,yào,bài,sǒu,shǔ,xūn,duì,pín,yuǎn wěi,níng,chóu zhòu,mái wō,rú,piáo,tái,jì qí,zǎo,chén,zhēn,ěr,nǐ,yíng,gǎo,cóng,xiāo hào,qí,fá,jiǎn,xù yù xū,kuí,jiè jí,biǎn,diào zhuó,mí,lán,jìn,cáng zàng,miǎo,qióng,qì,xiǎn,liáo,ǒu,xián,sù,lǘ,yì,xù,xiě,lí,yì,lǎ,lěi,jiào,dí,zhǐ,bēi,téng,yào,mò,huàn,biāo pāo,fān,sǒu,tán,tuī,qióng,qiáo,wèi,liú liǔ,huì huí,ōu,gǎo,yùn,bǎo,lì,shǔ,zhū chú,ǎi,lìn,zǎo,xuān,qìn,lài,huò,tuò,wù,ruǐ,ruǐ,qí,héng,lú,sū,tuí,máng,yùn,pín píng,yù,xūn,jì,jiōng,xuān,mó,qiū,sū,jiōng,péng,niè,bò,ráng,yì,xiǎn,yú,jú,liǎn,liǎn,yǐn,qiáng,yīng,lóng,tǒu,huā,yuè,lìng,qú,yáo,fán,mí,lán,guī,lán,jì,dàng,màn,lèi,léi,huī,fēng,zhī,wèi,kuí,zhàn,huái,lí,jì,mí,lěi,huài,luó,jī,kuí,lù,jiān,sà,téng,léi,quǎn,xiāo,yì,luán,mén,biē,hū,hǔ,lǔ,nüè,lǜ,sī,xiāo,qián,chǔ,hū,xū,cuó,fú,xū,xū,lǔ,hǔ,yú,hào,jiāo,jù,guó,bào,yán,zhàn,zhàn,kuī,bīn,xì,shù,chóng,qiú,diāo,jǐ,qiú,dīng,shī,xiā,jué,zhé,shé,yú,hán,zǐ,hóng,huǐ,méng,gè,suī,xiā,chài,shí,yǐ,mǎ mā mà,xiǎng,fāng bàng,è,bā,chǐ,qiān,wén,wén,ruì,bàng bèng,pí,yuè,yuè,jūn,qí,tóng,yǐn,qí zhǐ,cán,yuán wán,jué quē,huí,qín qián,qí,zhòng,yá,háo,mù,wáng,fén,fén,háng,gōng zhōng,zǎo,fù fǔ,rán,jiè,fú,chī,dǒu,bào,xiǎn,ní,dài dé,qiū,yóu,zhà,píng,chí,yòu,kē,hān,jù,lì,fù,rán,zhá,gǒu qú xù,pí,pí bǒ,xián,zhù,diāo,bié,bīng,gū,zhān,qū,shé yí,tiě,líng,gǔ,dàn,tún,yíng,lì,chēng,qū,móu,gé luò,cì,huí,huí,máng bàng,fù,yáng,wā,liè,zhū,yī,xián,kuò,jiāo,lì,yì xǔ,píng,jié,gé há,shé,yí,wǎng,mò,qióng,qiè ní,guǐ,qióng,zhì,mán,lǎo,zhé,jiá,náo,sī,qí,xíng,jiè,qiú,xiāo,yǒng,jiá,tuì,chē,bèi,é yǐ,hàn,shǔ,xuán,fēng,shèn,shèn,fǔ,xiǎn,zhé,wú,fú,lì,láng,bì,chú,yuān,yǒu,jié,dàn,yán,tíng,diàn,tuì,huí,wō,zhī,zhōng,fēi,jū,mì,qí,qí,yù,jùn,là,měng,qiāng,sī,xī,lún,lì,dié,tiáo,táo,kūn,hán,hàn,yù,bàng,féi,pí,wēi,dūn,yì,yuān,suò,quán,qiǎn,ruì,ní,qīng,wèi,liǎng,guǒ,wān,dōng,è,bǎn,dì,wǎng,cán,yǎng,yíng,guō,chán,dìng,là,kē,jí,xiē,tíng,mào,xū,mián,yú,jiē,shí,xuān,huáng,yǎn,biān,róu,wēi,fù,yuán,mèi,wèi,fú,rú,xié,yóu,qiú,máo,xiā,yīng,shī,chóng,tāng,zhū,zōng,dì,fù,yuán,kuí,méng,là,dài,hú,qiū,dié,lì,wō,yūn,qǔ,nǎn,lóu,chūn,róng,yíng,jiāng,bān,láng,páng,sī,xī,cì,xī qī,yuán,wēng,lián,sǒu,bān,róng,róng,jí,wū,xiù,hàn,qín,yí,bī pí,huá,táng,yǐ,dù,nài něng,hé xiá,hú,guì huǐ,mǎ mā mà,míng,yì,wén,yíng,téng,zhōng,cāng,sāo,qí,mǎn,dāo,shāng,shì zhē,cáo,chī,dì,áo,lù,wèi,dié zhì,táng,chén,piāo,qú jù,pí,yú,chán jiàn,luó,lóu,qǐn,zhōng,yǐn,jiāng,shuài,wén,xiāo,wàn,zhé,zhè,má mò,má,guō,liú,máo,xī,cōng,lí,mǎn,xiāo,chán,zhāng,mǎng měng,xiàng,mò,zuī,sī,qiū,tè,zhí,péng,péng,jiǎo,qú,biē bié,liáo,pán,guǐ,xǐ,jǐ,zhuān,huáng,fèi bēn,láo liáo,jué,jué,huì,yín xún,chán,jiāo,shàn,náo,xiāo,wú,chóng,xún,sī,chú,chēng,dāng,lí,xiè,shàn,yǐ,jǐng,dá,chán,qì,cī,xiǎng,shè,luǒ,qín,yíng,chài,lì,zéi,xuān,lián,zhú,zé,xiē,mǎng,xiè,qí,róng,jiǎn,měng,háo,rú,huò,zhuó,jié,pín,hē,miè,fán,lěi,jié,là,mǐn,lǐ,chǔn,lì,qiū,niè,lú,dù,xiāo,zhū,lóng,lí,lóng,fēng,yē,pí,náng,gǔ,juān,yīng,shǔ,xī,cán,qú,quán,dù,cán,mán,qú,jié,zhú,zhuó,xiě xuè,huāng,nǜ,pēi,nǜ,xìn,zhòng,mài,ěr,kè,miè,xì,háng xíng,yǎn,kàn,yuàn,qú,líng,xuàn,shù,xián,tòng,xiàng,jiē,xián,yá,hú,wèi,dào,chōng,wèi,dào,zhūn,héng,qú,yī,yī,bǔ,gǎn,yú,biǎo,chà,yì,shān,chèn,fū,gǔn,fēn,shuāi cuī,jié,nà,zhōng,dǎn,rì,zhòng,zhōng,jiè,zhǐ,xié,rán,zhī,rèn,qīn,jīn,jūn,yuán,mèi,chài,ǎo,niǎo,huī,rán,jiā,tuó tuō,lǐng líng,dài,bào páo pào,páo,yào,zuò,bì,shào,tǎn,jù jiē,hè kè,xué,xiù,zhěn,yí yì,pà,fú,dī,wà,fù,gǔn,zhì,zhì,rán,pàn,yì,mào,tuō,nà jué,gōu,xuàn,zhé,qū,bèi pī,yù,xí,mí,bó,bō,fú,chǐ nuǒ,chǐ qǐ duǒ nuǒ,kù,rèn,péng,jiá jié qiā,jiàn zùn,bó mò,jié,ér,gē,rú,zhū,guī guà,yīn,cái,liè liě,kǎ,háng,zhuāng,dāng,xū,kūn,kèn,niǎo,shù,jiá,kǔn,chéng chěng,lǐ,juān,shēn,póu,gé jiē,yì,yù,zhěn,liú,qiú,qún,jì,yì,bǔ,zhuāng,shuì,shā,qún,lǐ,lián,liǎn,kù,jiǎn,bāo,chān,bì pí,kūn,táo,yuàn,líng,chǐ,chāng,chóu dāo,duō,biǎo,liǎng,cháng shang,péi,péi,fēi,yuān gǔn,luǒ,guǒ,yǎn ān,dú,xī tì,zhì,jū,yǐ,qí,guǒ,guà,kèn,qī,tì,tí,fù,chóng,xiè,biǎn,dié,kūn,duān,xiù,xiù,hè,yuàn,bāo,bǎo,fù fú,yú,tuàn,yǎn,huī,bèi,zhǔ,lǚ,páo,dān,yùn,tā,gōu,dā,huái,róng,yuán,rù,nài,jiǒng,suǒ,bān,tuì tùn,chǐ,sǎng,niǎo,yīng,jiè,qiān,huái,kù,lián,lán,lí,zhě,shī,lǚ,yì,diē,xiè,xiān,wèi,biǎo,cáo,jì,qiǎng,sēn,bāo,xiāng,bì,fú,jiǎn,zhuàn,jiǎn,cuì,jí,dān,zá,fán,bó,xiàng,xín,bié,ráo,mǎn,lán,ǎo,zé,guì,cào,suì,nóng,chān,liǎn,bì,jīn,dāng,shǔ,tǎn,bì,lán,fú,rú,zhǐ,dùi,shǔ,wà,shì,bǎi,xié,bó,chèn,lǎi,lóng,xí,xiān,lán,zhě,dài,jǔ,zàn,shī,jiǎn,pàn,yì,lán,yà,xī,yà,yào yāo,fěng,tán qín,fù,fiào,fù,bà pò,hé,jī,jī,jiàn xiàn,guān guàn,biàn,yàn,guī,jué jiào,piǎn,mào,mì,mì,piē miè,shì,sì,chān,zhěn,jué jiào,mì,tiào,lián,yào,zhì,jūn,xī,shǎn,wēi,xì,tiǎn,yú,lǎn,è,dǔ,qīn qìng,pǎng,jì,míng,yíng yǐng,gòu,qū qù,zhàn zhān,jìn,guān guàn,dèng,jiàn biǎn,luó luǎn,qù qū,jiàn,wéi,jué jiào,qù qū,luó,lǎn,shěn,dí,guān guàn,jiàn xiàn,guān guàn,yàn,guī,mì,shì,chān,lǎn,jué jiào,jì,xí,dí,tiǎn,yú,gòu,jìn,qù qū,jiǎo jué,qiú,jīn,cū,jué,zhì,chào,jí,gū,dàn,zī zuǐ,dǐ,shāng,huà xiè,quán,gé,shì,jiě jiè xiè,guǐ,gōng,chù,jiě jiè xiè,hùn,qiú,xīng,sù,ní,jī qí,jué,zhì,zhā,bì,xīng,hú,shāng,gōng,zhì,xué hù,chù,xī,yí,lì lù,jué,xī,yàn,xī,yán,yán,dìng,fù,qiú,qiú,jiào,hōng,jì,fàn,xùn,diào,hòng,chài,tǎo,xū,jié,dàn,rèn,xùn,yín,shàn,qì,tuō,jì,xùn,yín,é,fēn,yà,yāo,sòng,shěn,yín,xīn,jué,xiáo,nè,chén,yóu,zhǐ,xiōng,fǎng,xìn,chāo,shè,yán,sǎ,zhùn,xū,yì,yì,sù,chī,hē,shēn,hé,xù,zhěn,zhù,zhèng,gòu,zī,zǐ,zhān,gǔ,fù,jiǎn,dié,líng,dǐ,yàng,lì,náo,pàn,zhòu,gàn,yì,jù,yào,zhà,tuó,yí,qǔ,zhào,píng,bì,xiòng,qū,bá,dá,zǔ,tāo,zhǔ,cí,zhé,yǒng,xǔ,xún,yì,huǎng,hé,shì,chá,xiào,shī,hěn,chà,gòu,guǐ,quán,huì,jié,huà,gāi,xiáng,wēi,shēn,chóu,tóng,mí,zhān,míng,luò,huī,yán,xiōng,guà,èr,bìng,tiǎo diào,yí chǐ chì,lěi,zhū,kuāng,kuā kuà,wū,yù,téng,jì,zhì,rèn,cù,lǎng làng,é,kuáng,ēi éi ěi èi xī,shì,tǐng,dàn,bèi bó,chán,yòu,kēng,qiào,qīn,shuà,ān,yǔ yù,xiào,chéng,jiè,xiàn,wū,wù,gào,sòng,bū,huì,jìng,shuō shuì yuè,zhèn,shuō shuì yuè,dú,huā,chàng,shuí shéi,jié,kè,qū juè,cóng,xiáo,suì,wǎng,xián,fěi,chī lài,tà,yì,nì ná,yín,diào tiáo,pǐ bēi,zhuó,chǎn,chēn,zhūn,jì jī,qī,tán,zhuì,wěi,jū,qǐng,dǒng,zhèng,zé zuò zhǎ cuò,zōu,qiān,zhuó,liàng,jiàn,chù jí,xià háo,lùn lún,shěn,biǎo,huà,biàn,yú,dié,xū,piǎn,shì dì,xuān,shì,hùn,huà guā,è,zhòng,dì,xié,fú,pǔ,tíng,jiàn,qǐ,yù,zī,zhuān,xǐ shāi āi,huì,yīn,ān,xián,nán nàn,chén,fěng,zhū,yáng,yàn,huáng,xuān,gé,nuò,xǔ,móu,yè,wèi,xīng,téng,zhōu,shàn,jiǎn,bó,kuì,huǎng,huò,gē,yíng,mí,xiǎo,mì,xǐ,qiāng,chēn,xuè,tí,sù,bàng,chí,qiān,shì,jiǎng,yuán,xiè,hè,tāo,yáo,yáo,lū,yú,biāo,còng,qǐng,lí,mó,mó,shāng,zhé,miù,jiǎn,zé,jiē,lián,lóu,càn,ōu,gùn,xí,zhuó,áo,áo,jǐn,zhé,yí,hū,jiàng,mán,cháo,hàn,huá,chǎn,xū,zēng,sè,xī,zhā,duì,zhèng,náo,lán,é,yīng,jué,jī,zǔn,jiǎo,bò,huì,zhuàn,wú,zèn,zhá,shí,qiáo,tán,jiàn,pǔ,shéng,xuān,zào,tán,dǎng,suì,xiǎn,jī,jiào,jǐng,zhàn,nóng,yī,ǎi,zhān,pì,huǐ,huà,yì,yì,shàn,ràng,ròu,qiǎn,duì,tà,hù,zhōu,háo,ài,yīng,jiān,yù,jiǎn,huì,dú,zhé,juàn xuān,zàn,lěi,shěn,wèi,chǎn,lì,yí tuī,biàn,zhé,yàn,è,chóu,wèi,chóu,yào,chán,ràng,yǐn,lán,chèn,xié,niè,huān,zàn,yì,dǎng,zhán,yàn,dú,yán,jì,dìng,fù,rèn,jī,jié,hòng,tǎo,ràng,shàn,qì,tuō,xùn,yì,xùn,jì,rèn,jiǎng,huì,ōu,jù,yà,nè,xǔ hǔ,é,lùn lún,xiōng,sòng,fěng,shè,fǎng,jué,zhèng,gǔ,hē,píng,zǔ,shí zhì,xiòng,zhà,sù,zhěn,dǐ,zhōu,cí,qū,zhào,bì,yì,yí dài,kuāng,lěi,shì,guà,shī,jié jí,huī,chéng,zhū,shēn,huà,dàn,gòu,quán,guǐ,xún,yì,zhèng,gāi,xiáng yáng,chà,hùn,xǔ,zhōu chóu,jiè,wū,yǔ yù,qiào,wù,gào,yòu,huì,kuáng,shuō shuì yuè,sòng,ēi éi ěi èi xī,qǐng,zhū,zōu,nuò,dú dòu,zhuó,fěi,kè,wěi,yú,shuí,shěn,tiáo diào zhōu,chǎn,liàng,zhūn,suì,tán,shěn,yì,móu,chén,dié,huǎng,jiàn,xié,xuè,yè,wèi,è,yù,xuān,chán,zī,ān,yàn,dì,mí,piǎn,xū,mó,dǎng,sù,xiè,yáo,bàng,shì,qiān,mì,jǐn,mán,zhé,jiǎn,miù,tán,zèn,qiáo,lán,pǔ,jué,yàn,qiǎn,zhān,chèn,gǔ,qiān,hóng,xiā,jí,hóng,hān,hōng,xī,xī,huō huò huá,liáo,hǎn,dú,lóng,dòu,jiāng,qǐ,chǐ,lǐ,dēng,wān,bī,shù,xiàn,fēng,zhì,zhì,yàn,yàn,shǐ,chù,huī,tún,yì,tún,yì,jiān,bā,hòu,è,chú,xiàng,huàn,jiān yàn,kěn,gāi,jù,fú,xī,bīn,háo,yù,zhū,jiā,fén,xī,hù,wēn,huán,bīn,dí,zōng,fén,yì,zhì,bào,chái,àn,pí,nà,pī,gǒu,nà,yòu,diāo,mò,sì,xiū,huán huān,kěn kūn,hé mò,hé háo mò,mò,àn,mào,lí,ní,bǐ,yǔ,jiā,tuān tuàn,māo máo,pí,xī,yì,jù lóu,mò,chū,tán,huān,jué,bèi,zhēn,yuán yún yùn,fù,cái,gòng,tè,yì yí,háng,wán,pín,huò,fàn,tān,guàn,zé zhài,zhì,èr,zhù,shì,bì,zī,èr,guì,piǎn,biǎn,mǎi,dài tè,shèng,kuàng,fèi,tiē,yí,chí,mào,hè,bì bēn,lù,lìn,huì,gāi,pián,zī,jiǎ gǔ jià,xù,zéi,jiǎo,gāi,zāng,jiàn,yīng,jùn,zhèn,shē,bīn,bīn,qiú,shē,chuàn,zāng,zhōu,lài,zàn,cì,chēn,shǎng,tiǎn,péi,gēng,xián,mài,jiàn,suì,fù,dǎn,cóng,cóng,zhì,jī,zhàng,dǔ,jìn,xiōng mín,chǔn,yǔn,bǎo,zāi,lài,fèng,càng,jī,shèng,ài,zhuàn zuàn,fù,gòu,sài,zé,liáo,yì,bài,chěn,wàn zhuàn,zhì,zhuì,biāo,yūn,zèng,dàn,zàn,yàn,pú,shàn,wàn,yíng,jìn,gàn,xián,zāng,bì,dú,shú,yàn,shǎng,xuàn,lòng,gàn,zāng,bèi,zhēn,fù,yuán yùn,gòng,cái,zé,xián,bài,zhàng,huò,zhì,fàn,tān,pín,biǎn,gòu,zhù,guàn,èr,jiàn,bì bēn,shì,tiē,guì,kuàng,dài,mào,fèi,hè,yí,zéi,zhì,gǔ jiǎ,huì,zī,lìn,lù,zāng,zī,gāi,jìn,qiú,zhèn,lài,shē,fù,dǔ,jī,shú,shǎng,cì,bì,zhōu,gēng,péi,dǎn,lài,fèng,zhuì,fù,zhuàn,sài,zé,yàn,zàn,yūn,zèng,shàn,yíng,gàn,chì,xī,shè,nǎn,tóng,xì,chēng,hè,chēng,zhě,xiá,táng,zǒu,zǒu,lì,jiū,fù,zhào,gǎn,qǐ,shàn,qióng,yǐn,xiǎn,zī,jué,qǐn,chí,cī,chèn,chèn,dié tú,qiè jū,chāo,dī,xì,zhān,jué,yuè,qū cù,jí jié,qū,chú,guā huó,xuè,zī,tiào,duǒ,liè,gǎn,suō,cù,xí,zhào,sù,yǐn,jú,jiàn,què qì jí,tàng tāng,chuō zhuó,cuǐ,lù,qù cù,dàng,qiū,zī,tí,qū cù,chì,huáng,qiáo,qiāo,jiào,zào,tì yuè,ěr,zǎn,zǎn,zú,pā,bào bō,kuà wù,kē,dǔn,jué guì,fū,chěn,jiǎn,fāng fàng páng,zhǐ,tā,yuè,bà páo,qí qǐ,yuè,qiāng qiàng,tuò,tái,yì,jiàn chén,líng,mèi,bá,diē,kū,tuó,jiā,cī cǐ,pǎo páo,qiǎ,zhù,jū,diǎn tiē dié,zhí,fū,pán bàn,jū jù qiè,shān,bǒ,ní,jù,lì luò,gēn,yí,jì,dài duò duō chí,xiǎn,jiāo,duò,zhū,quán,kuà,zhuǎi,guì,qióng,kuǐ,xiáng,dié,lù,pián bèng,zhì,jié,tiào táo,cǎi,jiàn,dá,qiāo,bì,xiān,duò,jī,jú,jì,shū chōu,tú,chuò,jìng,niè,xiāo,bù,xué,qūn,mǔ,shū,liáng liàng,yǒng,jiǎo,chóu,qiāo,móu,tà,jiàn,jī,wō,wěi,chuō,jié,jí,niè,jū,niè,lún,lù,lèng,huái,jù,chí,wǎn,quán,tī,bó,zú,qiè,qī,cù,zōng,cǎi,zōng,pèng,zhì,zhēng,diǎn,zhí,yú,duó,dùn,chuǎn,yǒng,zhǒng,dì,zhě,chěn,chuài,jiàn,guā,táng,jǔ,fú,cù,dié,pián,róu,nuò,tí,chǎ,tuǐ,jiǎn,dǎo,cuō,xī,tà,qiāng,niǎn,diān,tí,jí,niè,pán,liū,zàn,bì,chōng,lù,liáo,cù,tāng,dài,sù,xǐ,kuǐ,jì,zhí,qiāng,dí,pán,zōng,lián,bèng,zāo,niǎn,bié,tuí,jú,dēng,cèng,xiān,fán,chú,zhōng,dūn,bō,cù,cù,jué juě,jué,lìn,tà,qiāo,qiāo,pǔ,liāo,dūn,cuān,guàn,zào,tà,bì,bì,zhú,jù,chú,qiào,dǔn,chóu,jī,wǔ,yuè,niǎn,lìn,liè,zhí,lì luò,zhì,chán,chú,duàn,wèi,lóng lǒng,lìn,xiān,wèi,zuān,lán,xiè,ráng,sǎ xiè,niè,tà,qú,jí,cuān,zuān,xǐ,kuí,jué,lìn,shēn,gōng,dān,fēn,qū,tǐ,duǒ,duǒ,gōng,láng,rěn,luǒ,ǎi,jī,jū,tǎng,kōng,lào,yǎn,měi,kāng,qū,lóu,lào,duǒ,zhí,yàn,tǐ,dào,yīng,yù,chē jū,yà zhá gá,guǐ,jūn,wèi,yuè,xìn xiàn,dài,xuān,fàn guǐ,rèn,shān,kuáng,shū,tún,chén,dài,è,nà,qí,máo,ruǎn,kuáng,qián,zhuàn zhuǎn,hōng,hū,qú,kuàng,dǐ,líng,dài,āo ào,zhěn,fàn,kuāng,yǎng,pēng,bèi,gū,gū,páo,zhù,rǒng,è,bá,zhóu zhòu,zhǐ,yáo,kē kě,yì dié,qīng,shì,píng,ér,gǒng,jú,jiào,guāng,lù,kǎi,quán,zhōu,zài,zhì,shē,liàng,yù,shāo,yóu,wàn,yǐn,zhé,wǎn,fǔ,qīng,zhōu,ní,líng,zhé,hàn,liàng,zī,huī,wǎng,chuò,guǒ,kǎn,yǐ,péng,qiàn,gǔn,niǎn,píng,guǎn,bèi,lún,pái,liáng,ruǎn,róu,jí,yáng,xián,chuán,còu,chūn,gé,yóu,hōng,shū,fù,zī,fú,wēn,fàn,zhǎn,yú,wēn,tāo,gǔ,zhēn,xiá,yuán,lù,jiāo,cháo,zhuǎn,wèi,hūn,xuě,zhé,jiào,zhàn,bú,lǎo,fén,fān,lín,gé,sè,kǎn,huàn,yǐ,jí,duì,ér,yú,jiàn,hōng,léi,pèi,lì,lì,lú,lìn,chē jū,yà,guǐ,xuān,dài,rèn,zhuǎn zhuàn zhuǎi,è,lún,ruǎn,hōng,gū,kē,lú,zhóu zhòu,zhǐ,yì,hū,zhěn,lì,yáo,qīng,shì,zǎi zài,zhì,jiào,zhōu,quán,lù,jiào,zhé,fǔ,liàng,niǎn,bèi,huī,gǔn,wǎng,liáng,chuò,zī,còu,fú,jí,wēn,shū,pèi,yuán,xiá,zhǎn niǎn,lù,zhé,lín,xīn,gū,cí,cí,bì pì,zuì,biàn,là,là,cí,xuē,bàn,biàn,biàn,biàn,xuē,biàn,bān,cí,biàn,biàn,chén,rǔ,nóng,nóng,zhěn,chuò,chuò,yī,réng,biān,dào biān,shi,yū,liáo,dá,chān,gān,qiān,yū,yū,qì,xùn,yǐ yí,guò guo guō,mài,qī,zā,wàng kuāng,tù,zhūn,yíng,dá,yùn,jìn,háng,yà,fǎn,wǔ,dá,é,huán hái,zhè zhèi,dá,jìn,yuǎn yuàn,wéi,lián,chí,chè,chí,tiáo,zhì lì,yǐ yí,jiǒng,jiā,chén,dài,ěr,dí,pò pǎi,zhù wǎng,dié,zé,táo,shù,yǐ yí,qù,jìng,huí,dòng,yòu,mí,bèng,jì,nǎi,yí,jié,zhuī duī,liè,xùn,tuì,sòng,shì,táo,páng,hòu,nì,dùn,jiǒng,xuǎn,xùn,bū,yōu,xiāo,qiú,tòu,zhú,qiú,dì,dì,tú,jìng,tì,dòu,yǐ,zhè,tōng,guàng,wǔ,shì,chěng,sù,zào,qūn,féng,lián,suò,huí,lǐ,gǔ,lái,bèn,cuò,zhú,bèng,huàn,dài,lù,yóu,zhōu,jìn,yù,chuō,kuí,wēi,tì,yì,dá,yuǎn,luó,bī,nuò,yú,dàng,suí,dùn,suì,yǎn,chuán,chí,dì tí,yù,shí,zhēn,yóu,yùn,è,biàn,guò,è,xiá,huáng,qiú,dào,dá,wéi,nán,yí,gòu,yáo,chòu,liù,xùn,tà,dì,chí,yuǎn,sù,tà,qiǎn,mǎ,yáo,guàn,zhāng,áo,shì,cà,chì,sù,zāo,zhē,dùn,dì,lóu,chí,cuō,lín,zūn,rào,qiān,xuǎn,yù,yí,è,liáo,jù,shì,bì,yāo,mài,xiè,suì,huán hái,zhān,téng,ěr,miǎo,biān,biān,lā,lí chí,yuán,yáo,luó,lǐ,yì,tíng,dèng,qǐ,yōng,shān,hán,yú,máng,rú,qióng,xī,kuàng,fū,kàng háng,bīn,fāng,xíng,nà nǎ nèi nā,xīn,shěn,bāng,yuán,cūn,huǒ,xié yá yé yú xú,bāng,wū,jù,yóu,hán,tái,qiū,bì,pī,bǐng,shào,bèi,wǎ,dǐ,zōu,yè,lín,kuāng,guī,zhū,shī,kū,yù,gāi hái,hé,qiè xì,zhì,jí,xún huán,hòu,xíng,jiāo,xí,guī,nà,láng làng,jiá,kuài,zhèng,láng,yùn,yán,chéng,dòu,xī,lǚ,fǔ,wú,fú,gào,hǎo,láng,jiá,gěng,jùn,yǐng,bó,xì,bèi,lì zhí,yún,bù,xiáo ǎo,qī,pí,qīng,guō,zhōu,tán,zōu,píng,lái,ní,chēn,yóu,bù,xiāng,dān,jú,yōng,qiāo,yī,dū dōu,yǎn,méi,ruò,bèi,è,shū,juàn,yǔ,yùn,hóu,kuí,xiāng,xiāng,sōu,táng,míng,xī,rǔ,chù,zī,zōu,yì,wū,xiāng,yún,hào,yōng,bǐ,mào,cháo,fū,liǎo,yín,zhuān,hù,qiāo,yān,zhāng,màn,qiāo,xǔ,dèng,bì,xún,bì,zēng,wéi,zhèng,mào,shàn,lín,pó,dān,méng,yè,cào,kuài,fēng,méng,zōu,kuàng,liǎn,zàn,chán,yōu,qí,yàn,chán,zàn,líng,huān,xī,fēng,zàn,lì,yǒu,dīng dǐng,qiú,zhuó,pèi,zhòu,yǐ,gān,yú,jiǔ,yǎn,zuì,máo,dān,xù,dòu,zhēn,fēn,yuán,fū,yùn,tài,tiān,qiǎ,tuó,zuò,hān,gū,sū,pō,chóu,zài,mǐng,lào,chuò,chóu,yòu,tóng,zhǐ,xiān,jiàng,chéng,yìn,tú,jiào,méi,kù,suān,lèi,pú,zuì,hǎi,yàn,shī,niàng niàn niáng,wéi,lù,lǎn,yān,táo,pēi,zhǎn,chún,tán dàn,zuì,zhuì,cù,kūn,tí tǐ,xián,dū,hú,xǔ,xǐng,tǎn,qiú chōu,chún,yùn,pō fā,kē,sōu,mí,quán,chǒu,cuō,yùn,yòng,àng,zhà,hǎi,táng,jiàng,piǎo,chǎn chěn,yù,lí,zāo,láo,yī,jiàng,bú,jiào,xī,tán,pō fā,nóng,yì shì,lǐ,jù,yàn liǎn xiān,yì,niàng,rú,xūn,chóu,yàn,líng,mí,mí,niàng,xìn,jiào,shī,mí,yàn,biàn,cǎi cài,shì,yòu,shì,shì,lǐ,zhòng chóng,yě,liáng liàng,lí xǐ xī,jīn,jīn,gá,yǐ,liǎo liào,dāo,zhāo,dīng dìng,pō,qiú,hé,fǔ,zhēn,zhí,bā,luàn,fǔ,nǎi,diào,shān shàn,qiǎo jiǎo,kòu,chuàn,zǐ,fán,huá yú,huá wū,hàn,gāng,qí,máng,rì rèn jiàn,dì dài,sì,xì,yì,chāi,shī yí,tǔ,xī,nǚ,qiān,qiú,rì rèn jiàn,pī zhāo,yé yá,jīn,bǎ,fāng,chén,xíng,dǒu,yuè,qiān,fū,bù,nà,xīn,é,jué,dùn,gōu,yǐn,qián,bǎn,sà,rèn,chāo,niǔ,fēn,yǔn,yǐ,qín,pī,guō,hóng,yín,jūn,diào,yì,zhōng,xǐ,gài,rì,huǒ,tài,kàng,yuán,lú,è,qín,duó,zī,ní,tú,shì,mín,gū,kē,líng,bǐng,sì,gǔ,bó,pí,yù,sì,zuó,bū,yóu,diàn,jiǎ,zhēn,shǐ,shì,tiě,jù,zuān,shī,tā,xuàn,zhāo,bào,hé,bì,shēng,chú,shí,bó,zhù,chì,zā,pǒ,tóng,qián,fú,zhǎi,mǎo,qiān,fú,lì,yuè,pī,yāng,bàn,bō,jié,gōu,shù,zhēng,mǔ,xǐ,xǐ,dì,jiā,mù,tǎn,shén,yǐ,sī,kuàng,kǎ,běi,jiàn,tóng,xíng,hóng,jiǎo,chǐ,ěr,gè,bǐng píng,shì,máo,hā,yín,jūn,zhōu,chòng,xiǎng jiōng,tóng,mò,lèi,jī,yù sì,xù huì,rén rěn,zùn,zhì,qióng,shàn shuò,chì lì,xiǎn xǐ,xíng,quán,pī,tiě,zhū,hóu xiàng,míng,kuǎ,diào tiáo yáo,xiān kuò tiǎn guā,xián,xiū,jūn,chā,lǎo,jí,pǐ,rú,mǐ,yī,yīn,guāng,ǎn,diū,yǒu,sè,kào,qián,luán,sī,āi,diào,hàn,ruì,shì zhì,kēng,qiú,xiāo,zhé niè,xiù,zàng,tī,cuò,xiān kuò tiǎn guā,hòng gǒng,zhōng yōng,tōu tù dòu,lǚ,méi méng,láng,wàn jiǎn,xīn,yún,bèi,wù,sù,yù,chán,tǐng dìng,bó,hàn,jiá,hóng,juān jiān cuān,fēng,chān,wǎn,zhì,sī tuó,xuān juān juàn,huá wú wū,wú,tiáo,kuàng,zhuó chuò,lüè,xíng xìng jīng,qǐn,shèn,hán,lüè,yé,chú,zèng,jū jú,xiàn,é,máng,pū pù,lí,pàn,ruì,chéng,gào,lǐ,tè,bīng,zhù,zhèn,tū,liǔ,zuì niè,jù jū,chǎng,yuǎn yuān wǎn wān,jiān jiàn,gāng gàng,diào,táo,shǎng,lún,kè,líng,pī,lù,lí,qīng,péi,juǎn,mín,zuì,péng,àn,pī,xiàn,yā,zhuī,lèi,ā,kōng,tà,kūn,dú,nèi,chuí,zī,zhēng,bēn,niè,cóng,chún,tán,dìng,qí,qián,zhuì,jī,yù,jǐn,guǎn,máo,chāng,tiǎn,xī,liàn,diāo,gù,cuò,shù,zhēn,lù,měng,lù,huā,biǎo,gá,lái,kěn,fāng,bū,nài,wàn,zàn,hǔ,dé,xiān,piān,huò,liàng,fǎ,mén,kǎi,yāng,chí,liàn,guō,xiǎn,dù,tú,wéi,zōng,fù,róu,jí,è,jūn,chěn,tí,zhá,hù,yáng,duàn,xiá,yú,kēng,shēng,huáng,wěi,fù,zhāo,chā,qiè,shī,hōng,kuí,nuò,móu,qiāo,qiāo,hóu,tōu,cōng,huán,yè,mín,jiàn,duān,jiàn,sī,kuí,hú,xuān,zhě,jié,zhēn,biān,zhōng,zī,xiū,yé,měi,pài,āi,jiè,qián,méi,cuō chā,dā tà,bàng,xiá,lián,suǒ sè,kài,liú,yáo zú,yè tà gé,nòu,wēng,róng,táng,suǒ,qiāng chēng,gé lì,shuò,chuí,bó,pán,dā,bī bì pī,sǎng,gāng,zī,wū,yíng,huàng,tiáo,liú liù,kǎi,sǔn,shā,sōu,wàn jiǎn,gǎo hào,zhèn,zhèn,láng,yì,yuán,tǎng,niè,xí,jiā,gē,mǎ,juān,sòng,zǔ,suǒ,xià,fēng,wēn,ná,lǔ,suǒ,ōu,zú chuò,tuán,xiū xiù,guàn,xuàn,liàn,shòu sōu,ào,mǎn,mò,luó,bì,wèi,liú,dí dī,sǎn qiāo càn,cōng,yí,lù áo,áo,kēng,qiāng,cuī,qī,shǎng,tāng táng,màn,yōng,chǎn,fēng,jìng,biāo,shù,lòu,xiù,cōng,lóng,zàn,jiàn zàn,cáo,lí,xià,xī,kāng,shuǎng,bèng,zhāng,qiān,zhēng,lù,huá,jí,pú,huì suì ruì,qiǎng qiāng,pō,lín,sè,xiù,sǎn xiàn sà,chēng,guì,sī,liú,náo,huáng,piě,suì,fán,qiáo,quān,xī,tàng,xiàng,jué,jiāo,zūn,liào,qì,láo,duī,xín,zān,jī,jiǎn,zhōng,dèng,yā,yǐng,duī,jué,nòu,zān,pǔ,tiě,fán,chēng,dǐng,shàn,kāi,jiǎn,fèi,suì,lǔ,juān,huì,yù,lián,zhuō,qiāo,jiàn,zhuó,léi,bì,tiě,huán,yè,duó,guò,dāng chēng,jù,fén,dá,bèi,yì,ài,zōng,xùn,diào,zhù,héng,zhuì,jī,niè,hé,huò,qīng,bīn,yīng,guì,níng,xū,jiàn,jiàn,qiǎn,chǎ,zhì,miè,lí,léi,jī,zuān,kuàng,shǎng,péng,là,dú,shuò,chuò,lǜ,biāo,bào,lǔ,xián,kuān,lóng,è,lú,xīn,jiàn,lán,bó,jiān,yuè,chán,xiāng,jiàn,xī,guàn,cáng,niè,lěi,cuān,qú,pàn,luó,zuān,luán,záo,niè,jué,tǎng,zhú,làn,jīn,gá,yǐ,zhēn,dīng dìng,zhāo,pō,liǎo liào,tǔ,qiān,chuàn,shān shàn,sà xì,fán,diào,mén,nǚ,yáng,chāi,xíng,gài,bù,tài,jù,dùn,chāo,zhōng,nà,bèi,gāng gàng,bǎn,qián,yuè yào,qīn,jūn,wū,gōu,kàng,fāng,huǒ,dǒu,niǔ,bǎ pá,yù,qián,zhēng zhèng,qián,gǔ,bō,kē,pǒ,bū,bó,yuè,zuān zuàn,mù,tǎn,jiǎ,diàn tián,yóu,tiě,bó,líng,shuò,qiān yán,mǎo,bào,shì,xuàn,tā tuó,bì,ní,pí pī,duó,xíng,kào,lǎo,ěr,máng,yā yà,yǒu,chéng,jiá,yé,náo,zhì,dāng chēng,tóng,lǚ,diào,yīn,kǎi,zhá,zhū,xiǎn xǐ,tǐng dìng,diū,xiān kuò tiǎn guā,huá,quán,shā,hā kē,diào tiáo yáo,gè,míng,zhēng,sè,jiǎo,yī,chǎn,chòng,tàng tāng,ǎn,yín,rú,zhù,láo,pū pù,wú,lái,tè,liàn,kēng,xiāo,suǒ,lǐ,zèng,chú,guō,gào,é,xiù,cuò,lüè,fēng,xīn,liǔ,kāi,jiǎn,ruì,tī,láng,qǐn,jū,ā,qiāng,zhě,nuò,cuò,máo,bēn,qí,dé,kè,kūn,chāng,xī,gù,luó,chuí,zhuī,jǐn,zhì,xiān,juǎn,huò,péi,tán,dìng,jiàn,jù,měng,zī,qiè,yīng,kǎi,qiāng,sī,è,chā,qiāo,zhōng,duàn,sōu,huáng,huán,āi,dù,měi,lòu,zī,fèi,méi,mò,zhèn,bó,gé,niè,tǎng,juān,niè,ná,liú,gǎo,bàng,yì,jiā,bīn,róng,biāo,tāng,màn,luó,bèng,yōng,jìng,dí,zú,xuàn,liú,xín,jué,liào,pú,lǔ,duī,lán,pǔ,cuān,qiǎng,dèng,huò,léi,huán,zhuó,lián,yì,chǎ,biāo,là,chán,xiāng,cháng zhǎng,cháng,jiǔ,ǎo,dié,jié,liǎo,mí,cháng zhǎng,mén,mà,shuān,shǎn,huò shǎn,mén,yán,bì,hàn bì,bì,shān,kāi,kāng kàng,bēng,hóng,rùn,sàn,xián,xián jiān jiàn,jiān jiàn,mǐn,xiā xiǎ,shuǐ,dòu,zhá,nào,zhān,pēng pèng,xiǎ kě,líng,biàn guān,bì,rùn,hé,guān,gé,hé gé,fá,chù,hòng xiàng,guī,mǐn,sē xī,kǔn,làng,lǘ,tíng tǐng,shà,jú,yuè,yuè,chǎn,qù,lìn,chāng,shā,kǔn,yān,wén,yán,è yān,hūn,yù,wén,hòng,bāo,hòng juǎn xiàng,qù,yǎo,wén,bǎn pàn,àn,wéi,yīn,kuò,què,lán,dū shé,quán,fēng,tián,niè,tà,kǎi,hé,què quē,chuǎng,guān,dòu,qǐ,kuī,táng tāng chāng,guān,piáo,kàn hǎn,xì sè tà,huì,chǎn,pì,dāng dàng,huán,tà,wén,tā,mén,shuān,shǎn,yán,hàn bì,bì,wèn,chuǎng,rùn,wéi,xián,hóng,jiān jiàn,mǐn,kàng kāng,mèn mēn,zhá,nào,guī,wén,tà,mǐn,lǘ,kǎi,fá,gé,hé,kǔn,jiū,yuè,làng,dū shé,yù,yān,chāng,xì,wén,hūn,yán,è,chǎn,lán,qù,huì,kuò,què,hé,tián,tà,quē què,kàn,huán,fù,fǔ,lè,duì,xìn,qiān,wù,yì,tuó,yīn,yáng,dǒu,è,shēng,bǎn,péi,kēng,yǔn,ruǎn,zhǐ,pí,jǐng,fáng,yáng,yīn,zhèn,jiē,chēng,è,qū,dǐ,zǔ,zuò,diàn,lín,ā ē,tuó,tuó,bēi pí pō,bǐng,fù,jì,lù,lǒng,chén,xíng,duò,lòu,mò,jiàng xiáng,shū,duò,xiàn,ér,guǐ,yū,gāi,shǎn,jùn,qiào,xíng,chún,wǔ,bì,xiá,shǎn,shēng,zhì,pū,dǒu,yuàn,zhèn,chú,xiàn,dǎo,niè,yǔn,xiǎn,péi,fèi,zōu,qí,duì,lún,yīn,jū,chuí,chén,pī,líng,táo,xiàn,lù,shēng,xiǎn,yīn,zhǔ,yáng,réng,xiá,chóng,yàn yǎn,yīn,yú yáo shù,dī,yú,lóng,wēi,wēi,niè,duì zhuì,suí duò,àn,huáng,jiē,suí,yǐn yìn,qí gāi ái,yǎn,huī duò,gé,yǔn,wù,wěi kuí,ài,xì,táng,jì,zhàng,dǎo,áo,xì,yǐn yìn,sà,rǎo,lín,tuí,dèng,pí,suì,suí,ào yù,xiǎn,fén,nǐ,ér,jī,dǎo,xí,yǐn yìn,zhì,huī duò,lǒng,xī,lì dài,lì dài,lì dài,zhuī cuī wéi,hú hè,zhī,sǔn,jùn juàn,nán nàn nuó,yì,què qiāo qiǎo,yàn,qín,jiān,xióng,yǎ,jí,gù,huán,zhì,gòu,jùn juàn,cí,yōng,jū,chú,hū,zá,luò,yú,chóu,diāo,suī,hàn,huò,shuāng,guàn huán,chú,zá,yōng,jī,guī xī,chóu,liù,lí,nán nàn nuó,yù,zá,chóu,jí,yǔ yù,yú,xuě,nǎ,fǒu,sè xí,mù,wén,fēn,pāng,yún,lì,chì,yāng,líng,léi,án,báo,wù méng,diàn,dàng,hū hù,wù,diào,xū,jì,mù,chén,xiāo,zhá,tíng,zhèn,pèi,méi,líng,qī,zhōu,huò,shà,fēi,hóng,zhān,yīn,ní,shù,tún,lín,líng,dòng,yīng,wù,líng,shuāng,líng,xiá,hóng,yīn,mài,mài,yǔn,liù,mèng,bīn,wù,wèi,kuò,yín,xí,yì,ǎi,dàn,tèng,xiàn,yù,lòu lù,lóng,dài,jí,pāng,yáng,bà,pī,wēi,fēng,xì,jì,mái,méng,méng,léi,lì,huò,ǎi,fèi,dài,lóng,lìng,ài,fēng,lì,bǎo,hè,hè,hè,bìng,qīng,qīng,jìng liàng,tiān,zhèng,jìng,chēng,qìng,jìng,jìng,diàn,jìng,tiān,fēi,fēi,kào,mí,miàn,miàn,pào,yè,miǎn,huì,yè,gé,dīng,chá,jiān,rèn,dí,dù,wù,rèn,qín,jìn,xuē,niǔ,bǎ,yǐn,sǎ,nà,mò,zǔ,dá,bàn,xiè,yào,táo,bèi,jiē,hóng,páo,yāng yàng,bǐng,yīn,gé tà sǎ,táo,jié jí,xié,ān,ān,hén,gǒng,qiǎ,dá,qiáo,tīng,mán mèn,biān yìng,suī,tiáo,qiào shāo,xuān juān,kòng,běng,tà,shàng zhǎng,bǐng pí bì bēi,kuò,jū,la,xiè dié,róu,bāng,ēng,qiū,qiū,hé,qiào,mù móu,jū,jiàn jiān,biān,dī,jiān,wēn yùn,tāo,gōu,tà,bèi,xié,pán,gé,bì bǐng,kuò,tāng,lóu,guì,qiáo,xuē,jī,jiān,jiāng,chàn,dá,huò,xiǎn,qiān,dú,wā,jiān,lán,wéi,rèn,fú,mèi wà,quàn,gé,wěi,qiào,hán,chàng,kuò,rǒu,yùn,shè xiè,wěi,gé,bài,tāo,gōu,yùn,gāo,bì,wěi,suì,dú,wà,dú,wéi,rèn,fú,hán,wěi,yùn wēn,tāo,jiǔ,jiǔ,xiān,xiè,xiān,jī,yīn,zá,yùn,sháo,lè,péng,huáng,yīng,yùn,péng,ān,yīn,xiǎng,hù,yè,dǐng,qǐng,qiú,xiàng,shùn,hān,xū,yí,xù,ě,sòng,kuǐ,qí,háng,yù,wán,bān,dùn,dí,dān,pàn,pō,lǐng,chè,jǐng,lèi,hé,qiāo,è,é,wěi,jié,kuò,shěn,yí,yí,kē,duǐ,yǔ,pīng,lèi,fǔ,jiá,tóu,huì,kuí,jiá,luō,tǐng,chēng,yǐng,jūn,hú,hàn,jǐng,tuí,tuí,bīn,lài,tuí,zī,zī,chuí,dìng,lài,tán,hàn,qiān,kē,cuì,jiǒng,qīn,yí,sāi,tí,é,è,yán,wèn,kǎn,yóng,zhuān,yán,xiǎn,xìn,yǐ,yuàn,sǎng,diān,diān,jiǎng,kuī,lèi,láo,piǎo,wài,mān,cù,yáo,hào,qiáo,gù,xùn,yǎn,huì,chàn,rú,méng,bīn,xiǎn,pín,lú,lǎn,niè,quán,yè,dǐng,qǐng,hān,xiàng,shùn,xū,xū,wán,gù,dùn,qí,bān,sòng,háng,yù,lú,lǐng,pō,jǐng gěng,jié xié jiá,jiá,tǐng,hé gé,yǐng,jiǒng,kē,yí,pín bīn,huì,tuí,hàn,yǐng,yǐng,kē,tí,yóng,è,zhuān,yán,é,niè,mān,diān,sǎng,hào,lèi,chàn zhàn,rú,pín,quán,fēng fěng,biāo diū,guā,fú,xiā,zhǎn,biāo,sà,bá fú,tái,liè,guā,xuàn,xiāo,jù,biāo,sī,wěi,yáng,yáo,sōu,kǎi,sāo sōu,fān,liú,xí,liù liáo,piāo,piāo,liú,biāo,biāo,biāo,liáo,biāo,sè,fēng,xiū,fēng fěng,yáng,zhǎn,biāo,sà,jù,sī,sōu,yáo,liú,piāo,biāo,biāo,fēi,fān,fēi,fēi,shí sì yì,shí,cān,jī,dìng,sì,tuō,zhān,sūn,xiǎng,tún,rèn,yù,yǎng juàn,chì,yǐn yìn,fàn,fàn,sūn,yǐn yìn,zhù tǒu,yí sì,zuò zé zhā,bì,jiě,tāo,bǎo,cí,tiè,sì,bǎo,shì,duò,hài,rèn,tiǎn,jiǎo,hé,bǐng,yáo,tóng,cí,xiǎng,yǎng,juàn,ěr,yàn,lè,xī,cān,bō,něi,è,bū,jùn,dòu,sù,yú,shì,yáo,hún,guǒ,shì,jiàn,chuò,bǐng,xiàn,bù,yè,dàn,fēi,zhāng,wèi,guǎn,è,nuǎn,yùn,hú,huáng,tiè,huì,jiān,hóu,ài,xíng,fēn,wèi,gǔ,chā,sòng,táng,bó,gāo,xì,kuì,liù,sōu,táo,yè,wēn,mó,táng,mán,bì,yù,xiū,jǐn,sǎn,kuì,zhuàn,shàn,xī,dàn,yì,jī,ráo,chēng,yōng,tāo,wèi,xiǎng,zhān,fēn,hài,méng,yàn,mó,chán,xiǎng náng,luó,zàn,náng,shí,dìng,jī,tuō,xíng,tún,xì,rèn,yù,chì,fàn,yǐn,jiàn,shì,bǎo,sì,duò,yí,ěr,ráo,xiǎng,hé,gē le,jiǎo,xī,bǐng,bō,dòu,è,yú,něi,jùn,guǒ,hún,xiàn,guǎn,chā,kuì,gǔ,sōu,chán,yè,mó,bó,liù liú,xiū,jǐn,mán,sǎn,zhuàn,náng nǎng,shǒu,kuí,guó,xiāng,fēn,bó,ní,bì,bó,tú,hān,fēi,jiān,ān,ài,fù,xiān,yūn wò,xīn,fén,pīn,xīn,mǎ,yù,féng píng,hàn hán,dí,tuó duò,tuō zhé,chí,xùn,zhù,zhī shì,pèi,xìn jìn,rì,sà,yǔn,wén,zhí,dǎn dàn,lú,yóu,bó,bǎo,jué kuài,tuó duò,yì,qū,wén,qū,jiōng,pǒ,zhāo,yuān,pēng,zhòu,jù,zhù,nú,jū,pī,zǎng,jià,líng,zhěn,tái dài,fù,yǎng,shǐ,bì,tuó,tuó,sì,liú,mà,pián,táo,zhì,róng,téng,dòng,xún xuān,quán,shēn,jiōng,ěr,hài,bó,zhū,yīn,luò,zhōu,dàn,hài,liú,jú,sǒng,qīn,máng,liáng láng,hàn,tú,xuān,tuì,jùn,ě,chěng,xīng,sì,lù,zhuī,zhōu,shè,pián,kūn,táo,lái,zōng,kè,qí,qí,yàn,fēi,sāo,yàn,gé,yǎo,wù,piàn,cōng,piàn,qián,fēi,huáng,qián,huō,yú,tí,quán,xiá,zōng,kuí,róu,sī,guā,tuó,guī,sōu,qiān,chéng,zhì,liú,péng,téng,xí,cǎo,dú,yàn,yuán,zōu,sāo,shàn,qí,zhì,shuāng,lù,xí,luó,zhāng,mò,ào,cān,piào,cōng,qū,bì,zhì,yù,xū,huá,bō,sù,xiāo,lín,zhàn,dūn,liú,tuó,céng,diàn,jiāo,tiě,yàn,luó,zhān,jīng,yì,yè,tuó,pīn,zhòu,yàn,lóng,lǘ,téng,xiāng,jì,shuāng,jú,xí,huān,lí,biāo,mǎ,yù,tuó,xùn,chí,qū,rì,bó,lǘ,zǎng,shǐ,sì,fù,jū,zōu,zhù,tuó,nú,jià,yì,tái,xiāo,mà,yīn,jiāo,huá,luò,hài,pián,biāo,lí,chěng,yàn,xīng,qīn,jùn,qí,qí,kè,zhuī,zōng,sù,cān,piàn,zhì,kuí,sāo sǎo,wù,áo,liú,qiān,shàn,piào biāo,luó,cōng,chǎn,zhòu,jì,shuāng,xiāng,gǔ gū,wěi,wěi,wěi,yú,gàn,yì,āng,tóu,jiè,bào,bèi mó,cī,tǐ,dǐ,kū,hái,qiāo xiāo,hóu,kuà,gé,tuǐ,gěng,pián,bì,kē,qià,yú,suí,lóu,bó,xiāo,bǎng,bó jué,cī,kuān,bìn,mó,liáo,lóu,xiāo,dú,zāng,suǐ,tǐ tī,bìn,kuān,lú,gāo,gāo,qiào,kāo,qiǎo,láo,sào,biāo,kūn,kūn,dí,fǎng,xiū,rán,máo,dàn,kūn,bìn,fà,tiáo,pī,zī,fà,rán,tì,bào,bì pǒ,máo méng,fú,ér,èr,qū,gōng,xiū,kuò yuè,jì,péng,zhuā,shāo,shā,tì,lì,bìn,zōng,tì,péng,sōng,zhēng,quán,zōng,shùn,jiǎn,duǒ,hú,là,jiū,qí,lián,zhěn,bìn,péng,mà,sān,mán,mán,sēng,xū,liè,qiān,qiān,nóng,huán,kuò,níng,bìn,liè,ráng,dòu,dòu,nào,hòng,xì,dòu,kàn,dòu,dòu,jiū,chàng,yù,yù,gé lì,yàn,fǔ,zèng,guī,zōng,liù,guī,shāng,yù,guǐ,mèi,jì,qí,gà,kuí,hún,bá,pò,mèi,xū,yǎn,xiāo,liǎng,yù,tuí,qī,wǎng,liǎng,wèi,gān,chī,piāo,bì,mó,jī,xū,chǒu,yǎn,zhān,yú,dāo,rén,jì,bā bà,hóng,tuō,diào,jǐ,yú,é,jì,shā,háng,tún,mò,jiè,shěn,bǎn,yuán,pí,lǔ,wén,hú,lú,zā,fáng,fén,nà,yóu,piàn,mó,hé,xiá,qū,hān,pī,líng,tuó,bà,qiú,píng,fú,bì,cǐ jì,wèi,jū,diāo,bó bà,yóu,gǔn,pí,nián,xīng,tái,bào,fù,zhǎ zhà,jù,gū,shí,dōng,chou dài,tǎ,jié,shū,hòu,xiǎng,ér,ān,wéi,zhào,zhū,yìn,liè,luò gé,tóng,yí,yì,bìng,wěi,jiāo,kū,guī xié wā kuí,xiān xiǎn,gé,huí,lǎo,fú,kào,xiū,tuō,jūn,tí,miǎn,shāo,zhǎ,suō,qīn,yú,něi,zhé,gǔn,gěng,sū,wú,qiú,shān,pū bū,huàn,tiáo,lǐ,shā,shā,kào,méng,chéng,lí,zǒu,xī,yǒng,shēn,zī,qí,qīng,xiǎng,něi,chún,jì,diāo,qiè,gù,zhǒu,dōng,lái,fēi,ní,yì sī,kūn,lù,jiù,chāng,jīng,lún,líng,zōu,lí,měng,zōng,zhì,nián,hǔ,yú,dǐ,shī,shēn,huàn,tí,hóu,xīng,zhū,là,zōng,jì,biān,biān,huàn,quán,zéi,wēi,wēi,yú,chūn,róu,dié,huáng,liàn,yǎn,qiū,qiū,jiǎn,bī,è,yáng,fù,sāi,jiān,xiā,tuǒ,hú,shì,ruò,xuān,wēn,jiān,hào,wū,páng,sāo,liú,mǎ,shí,shī,guān,zī,téng,tǎ,yáo,è,yóng,qián,qí,wēn,ruò,shén,lián,áo,lè,huī,mǐn,jì,tiáo,qū,jiān,shēn,mán,xí,qiú,piào,jì,jì,zhú,jiāng,xiū,zhuān,yōng,zhāng,kāng,xuě,biē,yù,qū,xiàng,bō,jiǎo,xún,sù,huáng,zūn,shàn,shàn,fān,guì,lín,xún,yáo,xǐ,zēng,xiāng,fèn,guān,hòu,kuài,zéi,sāo,zhān,gǎn,guì,yìng,lǐ,cháng,léi,shǔ,ài,rú,jì,xù,hù,shǔ,lǐ,liè,lè,miè,zhēn,xiǎng,è,lú,guàn,lí,xiān,yú,dāo,jǐ,yóu,tún,lǔ,fáng,bā bà,hé gě,bà,píng,nián,lú,yóu,zhǎ zhà,fù,bó bà,bào,hòu,pí,tái,guī xié,jié,kào,wěi,ér,tóng,zéi,hòu,kuài,jì,jiāo,xiān xiǎn,zhǎ,xiǎng,xún,gěng,lí,lián,jiān,lǐ,shí,tiáo,gǔn,shā,huàn,jūn,jì,yǒng,qīng,líng,qí,zōu,fēi,kūn,chāng,gù,ní,nián,diāo,jīng,shēn,shī,zī,fèn,dié,bī,cháng,tí,wēn,wēi,sāi xǐ,è,qiū,fù,huáng,quán,jiāng,biān,sāo,áo,qí,tǎ,guān,yáo,páng,jiān,lè,biào,xuě,biē,mán,mǐn,yōng,wèi,xí,guì jué,shàn,lín,zūn,hù,gǎn,lǐ,zhān shàn,guǎn,niǎo diǎo,yǐ,fú,lì,jiū,bú,yàn,fú,diāo zhāo,jī,fèng,rù,gān hàn yàn,shī,fèng,míng,bǎo,yuān,zhī,hù,qín,fū guī,bān fén,wén,jiān qiān zhān,shī,yù,fǒu,yāo,jué,jué,pǐ,huān,zhèn,bǎo,yàn,yā,zhèng,fāng,fèng,wén,ōu,dài,jiā,rú,líng,miè,fú,tuó,mín,lì,biǎn,zhì,gē,yuān,cí,qú,xiāo,chī,dàn,jū,yāo,gū,zhōng,yù,yāng,yù,yā,dié,yù,tián,yīng,duī,wū,ér,guā,ài,zhī,yàn,héng,xiāo,jiá,liè,zhū,yáng,yí,hóng,lù,rú,móu,gē,rén,jiāo,xiū,zhōu,chī,luò,héng,nián,ě,luán,jiá,jì,tú,huān,tuǒ,bū,wú,jiān,yù,bó,jùn,jùn,bī,xī,jùn,jú,tū,jìng,tí,é,é,kuáng,hú,wǔ,shēn,lài,zān,pàn,lù,pí,shū,fú,ān,zhuó,péng,qín,qiān,bēi,diāo,lù,què,jiān,jú,tù,yā,yuān,qí,lí,yè,zhuī,kōng,duò,kūn,shēng,qí,jīng,yì,yì,jīng,zī,lái,dōng,qī,chún,gēng,jū,qū,yì,zūn,jī,shù,yīng,chì,miáo,róu,ān,qiū,tí chí,hú,tí chí,è,jiē,máo,fú bì,chūn,tú,yǎn,hé jiè,yuán,piān biǎn,kūn,méi,hú,yīng,chuàn zhì,wù,jú,dōng,cāng qiāng,fǎng,hè hú,yīng,yuán,xiān,wēng,shī,hè,chú,táng,xiá,ruò,liú,jī,gǔ hú,jiān,sǔn xùn,hàn,cí,cí,yì,yào,yàn,jī,lì,tián,kòu,tī,tī,yì,tú,mǎ,xiāo,gāo,tián,chén,jì,tuán,zhè,áo,yǎo,yī,ōu,chì,zhì,liù,yōng,lóu lǚ,bì,shuāng,zhuó,yú,wú,jué,yín,tí,sī,jiāo,yì,huá,bì,yīng,sù,huáng,fán,jiāo,liáo,yàn,gāo,jiù,xián,xián,tú,mǎi,zūn,yù,yīng,lù,tuán,xián,xué,yì,pì,zhǔ,luó,xī,yì,jī,zé,yú,zhān,yè,yáng,pì,níng,hù,mí,yīng,méng,dí,yuè,yù,lěi,bǔ,lú,hè,lóng,shuāng,yuè,yīng,guàn,qú,lí,luán,niǎo,jiū,jī,yuān,míng,shī,ōu,yā,cāng,bǎo,zhèn,gū,dōng,lú,yā,xiāo,yāng,líng,chī,qú,yuān,xué,tuó,sī,zhì,ér,guā,xiū,héng,zhōu,gē,luán,hóng,wú,bó,lí,juān,hú,é,yù,xián,tí,wǔ,què,miáo,ān,kūn,bēi,péng,qiān,chún,gēng,yuān,sù,hú,hé,è,gǔ,qiū,cí,méi,wù,yì,yào,wēng,liú,jī,yì,jiān,hè,yī,yīng,zhè,liù,liáo,jiāo,jiù,yù,lù,huán,zhān,yīng,hù,méng,guàn,shuāng,lǔ,jīn,líng,jiǎn,xián,cuó,jiǎn,jiǎn,yán,cuó,lù,yōu,cū,jǐ,páo biāo,cū,páo,zhù cū,jūn qún,zhǔ,jiān,mí,mí,yǔ,liú,chén,jūn,lín,ní,qí,lù,jiù,jūn,jīng,lí lì,xiāng,xián,jiā,mí,lì,shè,zhāng,lín,jīng,qí,líng,yán,cū,mài,mài,hé,chǎo,fū,miàn,miàn,fū,pào,qù,qū,móu,fū,xiàn,lái,qū,miàn,chi,fēng,fū,qū,miàn,má,mó me,mó me,huī,mí,zōu,nún,fén,huáng,huáng,jīn,guāng,tiān,tǒu,hóng,huà,kuàng,hóng,shǔ,lí,nián,chī,hēi,hēi,yì,qián,dǎn,xì,tún,mò,mò,qián,dài,chù,yǒu,diǎn,yī,xiá,yǎn,qū,měi,yǎn,qíng,yuè,lí,dǎng,dú,cǎn,yān,yǎn,yǎn,dàn shèn,àn,zhěn yān,dài,cǎn,yī,méi,dǎn zhǎn,yǎn,dú,lú,zhǐ,fěn,fú,fǔ,mǐn miǎn měng,mǐn miǎn měng,yuán,cù,qù,cháo,wā,zhū,zhī,měng,áo,biē,tuó,bì,yuán,cháo,tuó,dǐng,mì,nài,dǐng,zī,gǔ,gǔ,dōng,fén,táo,yuān,pí,chāng,gāo,cào,yuān,tāng,tēng,shǔ,shǔ,fén,fèi,wén,bá,diāo,tuó,zhōng,qú,shēng,shí,yòu,shí,tíng,wú,jú,jīng,hún,jú,yǎn,tū,sī,xī,xiàn,yǎn,léi,bí,yào,qiú,hān,wù,wù,hōu,xiè,è,zhā,xiù,wèng,zhā,nòng,nàng,qí zhāi,zhāi,jì,zī,jí,jī,qí jì zī zhāi,jī,chǐ,chèn,chèn,hé,yá,yīn,xiè,bāo,zé,xiè,zī,chī,yàn,jǔ,tiáo,líng,líng,chū,quán,xiè,yín,niè,jiù,yǎo,chuò,yǔn,yǔ,chǔ,yǐ,ní,zé,zōu,qǔ,yǔn,yǎn,yú,è,wò,yì,cī,zōu,diān,chǔ,jìn,yà,chǐ,chèn,hé,yín kěn,jǔ,líng,bāo,tiáo,zī,yín kěn,yǔ,chuò,qǔ,wò,lóng lǒng,páng,gōng wò,páng,yǎn,lóng,lóng lǒng,gōng,kān,dá,líng,dá,lóng,gōng,kān,guī jūn qiū,qiū,biē,guī jūn qiū,yuè,chuī,hé,jiǎo,xié,yù";var pinyin_dict_withtone_1=pinyin_dict_withtone;

(function (module) {
	const pinyin_dict_withtone=pinyin_dict_withtone_1;
	const window={pinyin_dict_withtone}
	﻿
	/**
	 * 汉字与拼音互转工具，根据导入的字典文件的不同支持不同
	 * 对于多音字目前只是将所有可能的组合输出，准确识别多音字需要完善的词库，而词库文件往往比字库还要大，所以不太适合web环境。
	 * @start 2016-09-26
	 * @last 2016-09-29
	 */
	;(function(global, factory) {
		{
			module.exports = factory(global);
		}
	})(typeof window !== "undefined" ? window : commonjsGlobal, function(window) {

		
		var dict = {}; // 存储所有字典数据
		var pinyinUtil =
		{
			/**
			 * 解析各种字典文件，所需的字典文件必须在本JS之前导入
			 */
			parseDict: function()
			{
				// 如果导入了 pinyin_dict_firstletter.js
				if(window.pinyin_dict_firstletter)
				{
					dict.firstletter = pinyin_dict_firstletter;
				}
				// 如果导入了 pinyin_dict_notone.js
				if(window.pinyin_dict_notone)
				{
					dict.notone = {};
					dict.py2hz = pinyin_dict_notone; // 拼音转汉字
					for(var i in pinyin_dict_notone)
					{
						var temp = pinyin_dict_notone[i];
						for(var j=0, len=temp.length; j<len; j++)
						{
							if(!dict.notone[temp[j]]) dict.notone[temp[j]] = i; // 不考虑多音字
						}
					}
				}
				// 如果导入了 pinyin_dict_withtone.js
				if(window.pinyin_dict_withtone)
				{
					dict.withtone = {}; // 汉字与拼音映射，多音字用空格分开，类似这种结构：{'大': 'da tai'}
					var temp = pinyin_dict_withtone.split(',');
					for(var i=0, len = temp.length; i<len; i++)
					{
						// 这段代码耗时28毫秒左右，对性能影响不大，所以一次性处理完毕
						dict.withtone[String.fromCharCode(i + 19968)] = temp[i]; // 这里先不进行split(' ')，因为一次性循环2万次split比较消耗性能
					}

					// 拼音 -> 汉字
					if(window.pinyin_dict_notone)
					{
						// 对于拼音转汉字，我们优先使用pinyin_dict_notone字典文件
						// 因为这个字典文件不包含生僻字，且已按照汉字使用频率排序
						dict.py2hz = pinyin_dict_notone; // 拼音转汉字
					}
					else
					{
						// 将字典文件解析成拼音->汉字的结构
						// 与先分割后逐个去掉声调相比，先一次性全部去掉声调然后再分割速度至少快了3倍，前者大约需要120毫秒，后者大约只需要30毫秒（Chrome下）
						var notone = pinyinUtil.removeTone(pinyin_dict_withtone).split(',');
						var py2hz = {}, py, hz;
						for(var i=0, len = notone.length; i<len; i++)
						{
							hz = String.fromCharCode(i + 19968); // 汉字
							py = notone[i].split(' '); // 去掉了声调的拼音数组
							for(var j=0; j<py.length; j++)
							{
								py2hz[py[j]] = (py2hz[py[j]] || '') + hz;
							}
						}
						dict.py2hz = py2hz;
					}
				}
			},
			/**
			 * 根据汉字获取拼音，如果不是汉字直接返回原字符
			 * @param chinese 要转换的汉字
			 * @param splitter 分隔字符，默认用空格分隔
			 * @param withtone 返回结果是否包含声调，默认是
			 * @param polyphone 是否支持多音字，默认否
			 */
			getPinyin: function(chinese, splitter, withtone, polyphone)
			{
				if(!chinese || /^ +$/g.test(chinese)) return '';
				splitter = splitter == undefined ? ' ' : splitter;
				withtone = withtone == undefined ? true : withtone;
				polyphone = polyphone == undefined ? false : polyphone;
				var result = [];
				if(dict.withtone) // 优先使用带声调的字典文件
				{
					var noChinese = '';
					for (var i=0, len = chinese.length; i < len; i++)
					{
						var pinyin = dict.withtone[chinese[i]];
						if(pinyin)
						{
							// 如果不需要多音字，默认返回第一个拼音，后面的直接忽略
							// 所以这对数据字典有一定要求，常见字的拼音必须放在最前面
							if(!polyphone) pinyin = pinyin.replace(/ .*$/g, '');
							if(!withtone) pinyin = this.removeTone(pinyin); // 如果不需要声调
							//空格，把noChinese作为一个词插入
							noChinese && ( result.push( noChinese), noChinese = '' );
							result.push( pinyin ); 
						}
						else if ( !chinese[i] || /^ +$/g.test(chinese[i]) ){
							//空格，把noChinese作为一个词插入
							noChinese && ( result.push( noChinese), noChinese = '' );
						}
						else {
							noChinese += chinese[i];
						}
					}
					if ( noChinese ){
						result.push( noChinese);
						noChinese = '';
					}
				}
				else if(dict.notone) // 使用没有声调的字典文件
				{
					if(withtone) console.warn('pinyin_dict_notone 字典文件不支持声调！');
					if(polyphone) console.warn('pinyin_dict_notone 字典文件不支持多音字！');
					var noChinese = '';
					for (var i=0, len = chinese.length; i < len; i++)
					{
						var temp = chinese.charAt(i),
							pinyin = dict.notone[temp];
						if ( pinyin ){ //插入拼音
							//空格，把noChinese作为一个词插入
							noChinese && ( result.push( noChinese), noChinese = '' );
							result.push( pinyin );
						}
						else if ( !temp || /^ +$/g.test(temp) ){
							//空格，插入之前的非中文字符
							noChinese && ( result.push( noChinese), noChinese = '' );
						}
						else {
							//非空格，关联到noChinese中
							noChinese += temp;
						}
					}

					if ( noChinese ){
						result.push( noChinese );
						noChinese = '';
					}
				}
				else
				{
					throw '抱歉，未找到合适的拼音字典文件！';
				}
				if(!polyphone) return result.join(splitter);
				else
				{
					if(window.pinyin_dict_polyphone) return parsePolyphone(chinese, result, splitter, withtone);
					else return handlePolyphone(result, ' ', splitter);
				}
			},
			/**
			 * 获取汉字的拼音首字母
			 * @param str 汉字字符串，如果遇到非汉字则原样返回
			 * @param polyphone 是否支持多音字，默认false，如果为true，会返回所有可能的组合数组
			 */
			getFirstLetter: function(str, polyphone)
			{
				polyphone = polyphone == undefined ? false : polyphone;
				if(!str || /^ +$/g.test(str)) return '';
				if(dict.firstletter) // 使用首字母字典文件
				{
					var result = [];
					for(var i=0; i<str.length; i++)
					{
						var unicode = str.charCodeAt(i);
						var ch = str.charAt(i);
						if(unicode >= 19968 && unicode <= 40869)
						{
							ch = dict.firstletter.all.charAt(unicode-19968);
							if(polyphone) ch = dict.firstletter.polyphone[unicode] || ch;
						}
						result.push(ch);
					}
					if(!polyphone) return result.join(''); // 如果不用管多音字，直接将数组拼接成字符串
					else return handlePolyphone(result, '', ''); // 处理多音字，此时的result类似于：['D', 'ZC', 'F']
				}
				else
				{
					var py = this.getPinyin(str, ' ', false, polyphone);
					py = py instanceof Array ? py : [py];
					var result = [];
					for(var i=0; i<py.length; i++)
					{
						result.push(py[i].replace(/(^| )(\w)\w*/g, function(m,$1,$2){return $2.toUpperCase();}));
					}
					if(!polyphone) return result[0];
					else return simpleUnique(result);
				}
			},
			/**
			 * 拼音转汉字，只支持单个汉字，返回所有匹配的汉字组合
			 * @param pinyin 单个汉字的拼音，可以包含声调
			 */
			getHanzi: function(pinyin)
			{
				if(!dict.py2hz)
				{
					throw '抱歉，未找到合适的拼音字典文件！';
				}
				return dict.py2hz[this.removeTone(pinyin)] || '';
			},
			/**
			 * 获取某个汉字的同音字，本方法暂时有问题，待完善
			 * @param hz 单个汉字
			 * @param sameTone 是否获取同音同声调的汉字，必须传进来的拼音带声调才支持，默认false
			 */
			getSameVoiceWord: function(hz, sameTone)
			{
				return this.getHanzi(this.getPinyin(hz, ' ', false))
			},
			/**
			 * 去除拼音中的声调，比如将 xiǎo míng tóng xué 转换成 xiao ming tong xue
			 * @param pinyin 需要转换的拼音
			 */
			removeTone: function(pinyin)
			{
				var toneMap = 
				{
					"ā": "a1",
					"á": "a2",
					"ǎ": "a3",
					"à": "a4",
					"ō": "o1",
					"ó": "o2",
					"ǒ": "o3",
					"ò": "o4",
					"ē": "e1",
					"é": "e2",
					"ě": "e3",
					"è": "e4",
					"ī": "i1",
					"í": "i2",
					"ǐ": "i3",
					"ì": "i4",
					"ū": "u1",
					"ú": "u2",
					"ǔ": "u3",
					"ù": "u4",
					"ü": "v0",
					"ǖ": "v1",
					"ǘ": "v2",
					"ǚ": "v3",
					"ǜ": "v4",
					"ń": "n2",
					"ň": "n3",
					"": "m2"
				};
				return pinyin.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùüǖǘǚǜńň]/g, function(m){ return toneMap[m][0]; });
			}
		};


		/**
		 * 处理多音字，将类似['D', 'ZC', 'F']转换成['DZF', 'DCF']
		 * 或者将 ['chang zhang', 'cheng'] 转换成 ['chang cheng', 'zhang cheng']
		 */
		function handlePolyphone(array, splitter, joinChar)
		{
			splitter = splitter || '';
			var result = [''], temp = [];
			for(var i=0; i<array.length; i++)
			{
				temp = [];
				var t = array[i].split(splitter);
				for(var j=0; j<t.length; j++)
				{
					for(var k=0; k<result.length; k++)
						temp.push(result[k] + (result[k]?joinChar:'') + t[j]);
				}
				result = temp;
			}
			return simpleUnique(result);
		}

		/**
		 * 根据词库找出多音字正确的读音
		 * 这里只是非常简单的实现，效率和效果都有一些问题
		 * 推荐使用第三方分词工具先对句子进行分词，然后再匹配多音字
		 * @param chinese 需要转换的汉字
		 * @param result 初步匹配出来的包含多个发音的拼音结果
		 * @param splitter 返回结果拼接字符
		 */
		function parsePolyphone(chinese, result, splitter, withtone)
		{
			var poly = window.pinyin_dict_polyphone;
			var max = 7; // 最多只考虑7个汉字的多音字词，虽然词库里面有10个字的，但是数量非常少，为了整体效率暂时忽略之
			var temp = poly[chinese];
			if(temp) // 如果直接找到了结果
			{
				temp = temp.split(' ');
				for(var i=0; i<temp.length; i++)
				{
					result[i] = temp[i] || result[i];
					if(!withtone) result[i] = pinyinUtil.removeTone(result[i]);
				}
				return result.join(splitter);
			}
			for(var i=0; i<chinese.length; i++)
			{
				temp = '';
				for(var j=0; j<max && (i+j)<chinese.length; j++)
				{
					if(!/^[\u2E80-\u9FFF]+$/.test(chinese[i+j])) break; // 如果碰到非汉字直接停止本次查找
					temp += chinese[i+j];
					var res = poly[temp];
					if(res) // 如果找到了多音字词语
					{
						res = res.split(' ');
						for(var k=0; k<=j; k++)
						{
							if(res[k]) result[i+k] = withtone ? res[k] : pinyinUtil.removeTone(res[k]);
						}
						break;
					}
				}
			}
			// 最后这一步是为了防止出现词库里面也没有包含的多音字词语
			for(var i=0; i<result.length; i++)
			{
				result[i] = result[i].replace(/ .*$/g, '');
			}
			return result.join(splitter);
		}

		// 简单数组去重
		function simpleUnique(array)
		{
			var result = [];
			var hash = {};
			for(var i=0; i<array.length; i++)
			{
				var key = (typeof array[i]) + array[i];
				if(!hash[key])
				{
					result.push(array[i]);
					hash[key] = true;
				}
			}
			return result;
		}

		pinyinUtil.parseDict();
		pinyinUtil.dict = dict;
		window.pinyinUtil = pinyinUtil;

	});
	module.exports=window.pinyinUtil;
} (pinyinUtil$1));

const pinyinUtil = pinyinUtil$1.exports;

const units = 'bytes KB MB GB TB PB EB ZB YB'.split(' ');

function formatBytes(bytes) {
  assert(arguments.length === 1, 'Must receive exactly one argument');

  assert(
    Number.isInteger(bytes) && bytes >= 0,
    'First argument must be a positive integer'
  );

  // Special case - singular form
  if (bytes === 1) {
    return '1 byte';
  }

  // Special case - output precision should not exceed input precision
  if (bytes < 100) {
    return String(bytes) + ' ' + units[0];
  }

  // Round before choosing unit
  const round = Number(bytes.toPrecision(3));

  const magnitude = logFloor(round, 1000);

  // If we don't have a large enough unit, fall back to scientific notation.
  if (magnitude >= units.length) {
    return round.toPrecision(3).replace('e+', ' × 10^') + ' ' + units[0];
  }

  return (
    (round / Math.pow(1000, magnitude)).toPrecision(3) + ' ' + units[magnitude]
  );
}

// Simpler implementations are often off by one due to floating point errors.
function logFloor(n, base) {
  const ceil = Math.round(Math.log(n) / Math.log(base));
  return ceil - (Math.pow(base, ceil) > n ? 1 : 0);
}

function assert(success, message) {
  if (!success) {
    throw Error(message);
  }
}

var formatBytes_1 = formatBytes;

var tick = 1;
var maxTick = 65535;
var resolution = 4;
var timer;
var inc = function () {
  tick = (tick + 1) & maxTick;
};


var speedometer = function (seconds) {
  if (!timer) {
    timer = setInterval(inc, (1000 / resolution) | 0);
    if (timer.unref) timer.unref();
  }

  var size = resolution * (seconds || 5);
  var buffer = [0];
  var pointer = 1;
  var last = (tick - 1) & maxTick;

  return function (delta) {
    var dist = (tick - last) & maxTick;
    if (dist > size) dist = size;
    last = tick;

    while (dist--) {
      if (pointer === size) pointer = 0;
      buffer[pointer] = buffer[pointer === 0 ? size - 1 : pointer - 1];
      pointer++;
    }

    if (delta) buffer[pointer - 1] += delta;

    var top = buffer[pointer - 1];
    var btm = buffer.length < size ? 0 : buffer[pointer === size ? 0 : pointer];

    return buffer.length < resolution ? top : (top - btm) * resolution / buffer.length
  }
};

export { Buffer$4 as B, EventEmitter$2 as E, Readable$1 as R, Stream as S, Vue as V, process$1 as a, createApp as c, formatBytes_1 as f, pinyinUtil as p, speedometer as s, wav as w, yauzl as y };
