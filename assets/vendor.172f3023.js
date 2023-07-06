const global$1 = (typeof global !== "undefined" ? global :
  typeof self !== "undefined" ? self :
  typeof window !== "undefined" ? window : {});

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

var isArray$2 = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

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
  return from$1(this, arg, encodingOrOffset, length)
}

Buffer$3.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer$3._augment = function (arr) {
  arr.__proto__ = Buffer$3.prototype;
  return arr
};

function from$1 (that, value, encodingOrOffset, length) {
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
  return from$1(null, value, encodingOrOffset, length)
};

if (Buffer$3.TYPED_ARRAY_SUPPORT) {
  Buffer$3.prototype.__proto__ = Uint8Array.prototype;
  Buffer$3.__proto__ = Uint8Array;
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

    if (obj.type === 'Buffer' && isArray$2(obj.data)) {
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
Buffer$3.isBuffer = isBuffer$1;
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
  if (!isArray$2(list)) {
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
function isBuffer$1(obj) {
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
  Buffer: Buffer$3,
  INSPECT_MAX_BYTES,
  SlowBuffer,
  isBuffer: isBuffer$1,
  kMaxLength: _kMaxLength
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
    return listenerCount.call(emitter, type);
  }
};

EventEmitter$2.prototype.listenerCount = listenerCount;
function listenerCount(type) {
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

var browser$4 = {exports: {}};

var stream$2 = {exports: {}};

const require$$0$1 = /*@__PURE__*/getAugmentedNamespace(bufferEs6);

/*
  This file is a reduced and adapted version of the main lib/internal/per_context/primordials.js file defined at

  https://github.com/nodejs/node/blob/master/lib/internal/per_context/primordials.js

  Don't try to replace with the original file and keep it up to date with the upstream file.
*/
var primordials = {
  ArrayIsArray(self) {
    return Array.isArray(self)
  },
  ArrayPrototypeIncludes(self, el) {
    return self.includes(el)
  },
  ArrayPrototypeIndexOf(self, el) {
    return self.indexOf(el)
  },
  ArrayPrototypeJoin(self, sep) {
    return self.join(sep)
  },
  ArrayPrototypeMap(self, fn) {
    return self.map(fn)
  },
  ArrayPrototypePop(self, el) {
    return self.pop(el)
  },
  ArrayPrototypePush(self, el) {
    return self.push(el)
  },
  ArrayPrototypeSlice(self, start, end) {
    return self.slice(start, end)
  },
  Error,
  FunctionPrototypeCall(fn, thisArgs, ...args) {
    return fn.call(thisArgs, ...args)
  },
  FunctionPrototypeSymbolHasInstance(self, instance) {
    return Function.prototype[Symbol.hasInstance].call(self, instance)
  },
  MathFloor: Math.floor,
  Number,
  NumberIsInteger: Number.isInteger,
  NumberIsNaN: Number.isNaN,
  NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  NumberParseInt: Number.parseInt,
  ObjectDefineProperties(self, props) {
    return Object.defineProperties(self, props)
  },
  ObjectDefineProperty(self, name, prop) {
    return Object.defineProperty(self, name, prop)
  },
  ObjectGetOwnPropertyDescriptor(self, name) {
    return Object.getOwnPropertyDescriptor(self, name)
  },
  ObjectKeys(obj) {
    return Object.keys(obj)
  },
  ObjectSetPrototypeOf(target, proto) {
    return Object.setPrototypeOf(target, proto)
  },
  Promise,
  PromisePrototypeCatch(self, fn) {
    return self.catch(fn)
  },
  PromisePrototypeThen(self, thenFn, catchFn) {
    return self.then(thenFn, catchFn)
  },
  PromiseReject(err) {
    return Promise.reject(err)
  },
  ReflectApply: Reflect.apply,
  RegExpPrototypeTest(self, value) {
    return self.test(value)
  },
  SafeSet: Set,
  String,
  StringPrototypeSlice(self, start, end) {
    return self.slice(start, end)
  },
  StringPrototypeToLowerCase(self) {
    return self.toLowerCase()
  },
  StringPrototypeToUpperCase(self) {
    return self.toUpperCase()
  },
  StringPrototypeTrim(self) {
    return self.trim()
  },
  Symbol,
  SymbolFor: Symbol.for,
  SymbolAsyncIterator: Symbol.asyncIterator,
  SymbolHasInstance: Symbol.hasInstance,
  SymbolIterator: Symbol.iterator,
  TypedArrayPrototypeSet(self, buf, len) {
    return self.set(buf, len)
  },
  Uint8Array
};

var util$4 = {exports: {}};

(function (module) {

	const bufferModule = require$$0$1;
	const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
	const Blob = globalThis.Blob || bufferModule.Blob;
	/* eslint-disable indent */
	const isBlob =
	  typeof Blob !== 'undefined'
	    ? function isBlob(b) {
	        // eslint-disable-next-line indent
	        return b instanceof Blob
	      }
	    : function isBlob(b) {
	        return false
	      };
	/* eslint-enable indent */

	// This is a simplified version of AggregateError
	class AggregateError extends Error {
	  constructor(errors) {
	    if (!Array.isArray(errors)) {
	      throw new TypeError(`Expected input to be an Array, got ${typeof errors}`)
	    }
	    let message = '';
	    for (let i = 0; i < errors.length; i++) {
	      message += `    ${errors[i].stack}\n`;
	    }
	    super(message);
	    this.name = 'AggregateError';
	    this.errors = errors;
	  }
	}
	module.exports = {
	  AggregateError,
	  kEmptyObject: Object.freeze({}),
	  once(callback) {
	    let called = false;
	    return function (...args) {
	      if (called) {
	        return
	      }
	      called = true;
	      callback.apply(this, args);
	    }
	  },
	  createDeferredPromise: function () {
	    let resolve;
	    let reject;

	    // eslint-disable-next-line promise/param-names
	    const promise = new Promise((res, rej) => {
	      resolve = res;
	      reject = rej;
	    });
	    return {
	      promise,
	      resolve,
	      reject
	    }
	  },
	  promisify(fn) {
	    return new Promise((resolve, reject) => {
	      fn((err, ...args) => {
	        if (err) {
	          return reject(err)
	        }
	        return resolve(...args)
	      });
	    })
	  },
	  debuglog() {
	    return function () {}
	  },
	  format(format, ...args) {
	    // Simplified version of https://nodejs.org/api/util.html#utilformatformat-args
	    return format.replace(/%([sdifj])/g, function (...[_unused, type]) {
	      const replacement = args.shift();
	      if (type === 'f') {
	        return replacement.toFixed(6)
	      } else if (type === 'j') {
	        return JSON.stringify(replacement)
	      } else if (type === 's' && typeof replacement === 'object') {
	        const ctor = replacement.constructor !== Object ? replacement.constructor.name : '';
	        return `${ctor} {}`.trim()
	      } else {
	        return replacement.toString()
	      }
	    })
	  },
	  inspect(value) {
	    // Vastly simplified version of https://nodejs.org/api/util.html#utilinspectobject-options
	    switch (typeof value) {
	      case 'string':
	        if (value.includes("'")) {
	          if (!value.includes('"')) {
	            return `"${value}"`
	          } else if (!value.includes('`') && !value.includes('${')) {
	            return `\`${value}\``
	          }
	        }
	        return `'${value}'`
	      case 'number':
	        if (isNaN(value)) {
	          return 'NaN'
	        } else if (Object.is(value, -0)) {
	          return String(value)
	        }
	        return value
	      case 'bigint':
	        return `${String(value)}n`
	      case 'boolean':
	      case 'undefined':
	        return String(value)
	      case 'object':
	        return '{}'
	    }
	  },
	  types: {
	    isAsyncFunction(fn) {
	      return fn instanceof AsyncFunction
	    },
	    isArrayBufferView(arr) {
	      return ArrayBuffer.isView(arr)
	    }
	  },
	  isBlob
	};
	module.exports.promisify.custom = Symbol.for('nodejs.util.promisify.custom');
} (util$4));

var operators = {};

var browser$3 = {exports: {}};

/*globals self, window */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser$3.exports;
	hasRequiredBrowser = 1;

	/*eslint-disable @mysticatea/prettier */
	const { AbortController, AbortSignal } =
	    typeof self !== "undefined" ? self :
	    typeof window !== "undefined" ? window :
	    /* otherwise */ undefined;
	/*eslint-enable @mysticatea/prettier */

	browser$3.exports = AbortController;
	browser$3.exports.AbortSignal = AbortSignal;
	browser$3.exports.default = AbortController;
	return browser$3.exports;
}

const { format: format$1, inspect: inspect$2, AggregateError: CustomAggregateError } = util$4.exports;

/*
  This file is a reduced and adapted version of the main lib/internal/errors.js file defined at

  https://github.com/nodejs/node/blob/master/lib/internal/errors.js

  Don't try to replace with the original file and keep it up to date (starting from E(...) definitions)
  with the upstream file.
*/

const AggregateError = globalThis.AggregateError || CustomAggregateError;
const kIsNodeError = Symbol('kIsNodeError');
const kTypes = [
  'string',
  'function',
  'number',
  'object',
  // Accept 'Function' and 'Object' as alternative to the lower cased version.
  'Function',
  'Object',
  'boolean',
  'bigint',
  'symbol'
];
const classRegExp = /^([A-Z][a-z0-9]*)+$/;
const nodeInternalPrefix = '__node_internal_';
const codes$1 = {};
function assert(value, message) {
  if (!value) {
    throw new codes$1.ERR_INTERNAL_ASSERTION(message)
  }
}

// Only use this for integers! Decimal numbers do not work with this function.
function addNumericalSeparator(val) {
  let res = '';
  let i = val.length;
  const start = val[0] === '-' ? 1 : 0;
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`;
  }
  return `${val.slice(0, i)}${res}`
}
function getMessage(key, msg, args) {
  if (typeof msg === 'function') {
    assert(
      msg.length <= args.length,
      // Default options do not count.
      `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${msg.length}).`
    );
    return msg(...args)
  }
  const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length;
  assert(
    expectedLength === args.length,
    `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${expectedLength}).`
  );
  if (args.length === 0) {
    return msg
  }
  return format$1(msg, ...args)
}
function E(code, message, Base) {
  if (!Base) {
    Base = Error;
  }
  class NodeError extends Base {
    constructor(...args) {
      super(getMessage(code, message, args));
    }
    toString() {
      return `${this.name} [${code}]: ${this.message}`
    }
  }
  Object.defineProperties(NodeError.prototype, {
    name: {
      value: Base.name,
      writable: true,
      enumerable: false,
      configurable: true
    },
    toString: {
      value() {
        return `${this.name} [${code}]: ${this.message}`
      },
      writable: true,
      enumerable: false,
      configurable: true
    }
  });
  NodeError.prototype.code = code;
  NodeError.prototype[kIsNodeError] = true;
  codes$1[code] = NodeError;
}
function hideStackFrames$1(fn) {
  // We rename the functions that will be hidden to cut off the stacktrace
  // at the outermost one
  const hidden = nodeInternalPrefix + fn.name;
  Object.defineProperty(fn, 'name', {
    value: hidden
  });
  return fn
}
function aggregateTwoErrors$2(innerError, outerError) {
  if (innerError && outerError && innerError !== outerError) {
    if (Array.isArray(outerError.errors)) {
      // If `outerError` is already an `AggregateError`.
      outerError.errors.push(innerError);
      return outerError
    }
    const err = new AggregateError([outerError, innerError], outerError.message);
    err.code = outerError.code;
    return err
  }
  return innerError || outerError
}
class AbortError$5 extends Error {
  constructor(message = 'The operation was aborted', options = undefined) {
    if (options !== undefined && typeof options !== 'object') {
      throw new codes$1.ERR_INVALID_ARG_TYPE('options', 'Object', options)
    }
    super(message, options);
    this.code = 'ABORT_ERR';
    this.name = 'AbortError';
  }
}
E('ERR_ASSERTION', '%s', Error);
E(
  'ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    assert(typeof name === 'string', "'name' must be a string");
    if (!Array.isArray(expected)) {
      expected = [expected];
    }
    let msg = 'The ';
    if (name.endsWith(' argument')) {
      // For cases like 'first argument'
      msg += `${name} `;
    } else {
      msg += `"${name}" ${name.includes('.') ? 'property' : 'argument'} `;
    }
    msg += 'must be ';
    const types = [];
    const instances = [];
    const other = [];
    for (const value of expected) {
      assert(typeof value === 'string', 'All expected entries have to be of type string');
      if (kTypes.includes(value)) {
        types.push(value.toLowerCase());
      } else if (classRegExp.test(value)) {
        instances.push(value);
      } else {
        assert(value !== 'object', 'The value "object" should be written as "Object"');
        other.push(value);
      }
    }

    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
      const pos = types.indexOf('object');
      if (pos !== -1) {
        types.splice(types, pos, 1);
        instances.push('Object');
      }
    }
    if (types.length > 0) {
      switch (types.length) {
        case 1:
          msg += `of type ${types[0]}`;
          break
        case 2:
          msg += `one of type ${types[0]} or ${types[1]}`;
          break
        default: {
          const last = types.pop();
          msg += `one of type ${types.join(', ')}, or ${last}`;
        }
      }
      if (instances.length > 0 || other.length > 0) {
        msg += ' or ';
      }
    }
    if (instances.length > 0) {
      switch (instances.length) {
        case 1:
          msg += `an instance of ${instances[0]}`;
          break
        case 2:
          msg += `an instance of ${instances[0]} or ${instances[1]}`;
          break
        default: {
          const last = instances.pop();
          msg += `an instance of ${instances.join(', ')}, or ${last}`;
        }
      }
      if (other.length > 0) {
        msg += ' or ';
      }
    }
    switch (other.length) {
      case 0:
        break
      case 1:
        if (other[0].toLowerCase() !== other[0]) {
          msg += 'an ';
        }
        msg += `${other[0]}`;
        break
      case 2:
        msg += `one of ${other[0]} or ${other[1]}`;
        break
      default: {
        const last = other.pop();
        msg += `one of ${other.join(', ')}, or ${last}`;
      }
    }
    if (actual == null) {
      msg += `. Received ${actual}`;
    } else if (typeof actual === 'function' && actual.name) {
      msg += `. Received function ${actual.name}`;
    } else if (typeof actual === 'object') {
      var _actual$constructor;
      if (
        (_actual$constructor = actual.constructor) !== null &&
        _actual$constructor !== undefined &&
        _actual$constructor.name
      ) {
        msg += `. Received an instance of ${actual.constructor.name}`;
      } else {
        const inspected = inspect$2(actual, {
          depth: -1
        });
        msg += `. Received ${inspected}`;
      }
    } else {
      let inspected = inspect$2(actual, {
        colors: false
      });
      if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
      }
      msg += `. Received type ${typeof actual} (${inspected})`;
    }
    return msg
  },
  TypeError
);
E(
  'ERR_INVALID_ARG_VALUE',
  (name, value, reason = 'is invalid') => {
    let inspected = inspect$2(value);
    if (inspected.length > 128) {
      inspected = inspected.slice(0, 128) + '...';
    }
    const type = name.includes('.') ? 'property' : 'argument';
    return `The ${type} '${name}' ${reason}. Received ${inspected}`
  },
  TypeError
);
E(
  'ERR_INVALID_RETURN_VALUE',
  (input, name, value) => {
    var _value$constructor;
    const type =
      value !== null &&
      value !== undefined &&
      (_value$constructor = value.constructor) !== null &&
      _value$constructor !== undefined &&
      _value$constructor.name
        ? `instance of ${value.constructor.name}`
        : `type ${typeof value}`;
    return `Expected ${input} to be returned from the "${name}"` + ` function but got ${type}.`
  },
  TypeError
);
E(
  'ERR_MISSING_ARGS',
  (...args) => {
    assert(args.length > 0, 'At least one arg needs to be specified');
    let msg;
    const len = args.length;
    args = (Array.isArray(args) ? args : [args]).map((a) => `"${a}"`).join(' or ');
    switch (len) {
      case 1:
        msg += `The ${args[0]} argument`;
        break
      case 2:
        msg += `The ${args[0]} and ${args[1]} arguments`;
        break
      default:
        {
          const last = args.pop();
          msg += `The ${args.join(', ')}, and ${last} arguments`;
        }
        break
    }
    return `${msg} must be specified`
  },
  TypeError
);
E(
  'ERR_OUT_OF_RANGE',
  (str, range, input) => {
    assert(range, 'Missing "range" argument');
    let received;
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input));
    } else if (typeof input === 'bigint') {
      received = String(input);
      if (input > 2n ** 32n || input < -(2n ** 32n)) {
        received = addNumericalSeparator(received);
      }
      received += 'n';
    } else {
      received = inspect$2(input);
    }
    return `The value of "${str}" is out of range. It must be ${range}. Received ${received}`
  },
  RangeError
);
E('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times', Error);
E('ERR_METHOD_NOT_IMPLEMENTED', 'The %s method is not implemented', Error);
E('ERR_STREAM_ALREADY_FINISHED', 'Cannot call %s after a stream was finished', Error);
E('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable', Error);
E('ERR_STREAM_DESTROYED', 'Cannot call %s after a stream was destroyed', Error);
E('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
E('ERR_STREAM_PREMATURE_CLOSE', 'Premature close', Error);
E('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF', Error);
E('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event', Error);
E('ERR_STREAM_WRITE_AFTER_END', 'write after end', Error);
E('ERR_UNKNOWN_ENCODING', 'Unknown encoding: %s', TypeError);
var errors = {
  AbortError: AbortError$5,
  aggregateTwoErrors: hideStackFrames$1(aggregateTwoErrors$2),
  hideStackFrames: hideStackFrames$1,
  codes: codes$1
};

/* eslint jsdoc/require-jsdoc: "error" */

const {
  ArrayIsArray: ArrayIsArray$2,
  ArrayPrototypeIncludes,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  NumberIsInteger: NumberIsInteger$1,
  NumberIsNaN: NumberIsNaN$1,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  NumberParseInt,
  ObjectPrototypeHasOwnProperty,
  RegExpPrototypeExec,
  String: String$1,
  StringPrototypeToUpperCase,
  StringPrototypeTrim
} = primordials;
const {
  hideStackFrames,
  codes: { ERR_SOCKET_BAD_PORT, ERR_INVALID_ARG_TYPE: ERR_INVALID_ARG_TYPE$4, ERR_INVALID_ARG_VALUE: ERR_INVALID_ARG_VALUE$3, ERR_OUT_OF_RANGE: ERR_OUT_OF_RANGE$1, ERR_UNKNOWN_SIGNAL }
} = errors;
const { normalizeEncoding } = util$4.exports;
const { isAsyncFunction, isArrayBufferView } = util$4.exports.types;
const signals = {};

/**
 * @param {*} value
 * @returns {boolean}
 */
function isInt32(value) {
  return value === (value | 0)
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isUint32(value) {
  return value === value >>> 0
}
const octalReg = /^[0-7]+$/;
const modeDesc = 'must be a 32-bit unsigned integer or an octal string';

/**
 * Parse and validate values that will be converted into mode_t (the S_*
 * constants). Only valid numbers and octal strings are allowed. They could be
 * converted to 32-bit unsigned integers or non-negative signed integers in the
 * C++ land, but any value higher than 0o777 will result in platform-specific
 * behaviors.
 *
 * @param {*} value Values to be validated
 * @param {string} name Name of the argument
 * @param {number} [def] If specified, will be returned for invalid values
 * @returns {number}
 */
function parseFileMode(value, name, def) {
  if (typeof value === 'undefined') {
    value = def;
  }
  if (typeof value === 'string') {
    if (RegExpPrototypeExec(octalReg, value) === null) {
      throw new ERR_INVALID_ARG_VALUE$3(name, value, modeDesc)
    }
    value = NumberParseInt(value, 8);
  }
  validateUint32(value, name);
  return value
}

/**
 * @callback validateInteger
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateInteger} */
const validateInteger$1 = hideStackFrames((value, name, min = NumberMIN_SAFE_INTEGER, max = NumberMAX_SAFE_INTEGER) => {
  if (typeof value !== 'number') throw new ERR_INVALID_ARG_TYPE$4(name, 'number', value)
  if (!NumberIsInteger$1(value)) throw new ERR_OUT_OF_RANGE$1(name, 'an integer', value)
  if (value < min || value > max) throw new ERR_OUT_OF_RANGE$1(name, `>= ${min} && <= ${max}`, value)
});

/**
 * @callback validateInt32
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateInt32} */
const validateInt32 = hideStackFrames((value, name, min = -2147483648, max = 2147483647) => {
  // The defaults for min and max correspond to the limits of 32-bit integers.
  if (typeof value !== 'number') {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'number', value)
  }
  if (!NumberIsInteger$1(value)) {
    throw new ERR_OUT_OF_RANGE$1(name, 'an integer', value)
  }
  if (value < min || value > max) {
    throw new ERR_OUT_OF_RANGE$1(name, `>= ${min} && <= ${max}`, value)
  }
});

/**
 * @callback validateUint32
 * @param {*} value
 * @param {string} name
 * @param {number|boolean} [positive=false]
 * @returns {asserts value is number}
 */

/** @type {validateUint32} */
const validateUint32 = hideStackFrames((value, name, positive = false) => {
  if (typeof value !== 'number') {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'number', value)
  }
  if (!NumberIsInteger$1(value)) {
    throw new ERR_OUT_OF_RANGE$1(name, 'an integer', value)
  }
  const min = positive ? 1 : 0;
  // 2 ** 32 === 4294967296
  const max = 4294967295;
  if (value < min || value > max) {
    throw new ERR_OUT_OF_RANGE$1(name, `>= ${min} && <= ${max}`, value)
  }
});

/**
 * @callback validateString
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is string}
 */

/** @type {validateString} */
function validateString(value, name) {
  if (typeof value !== 'string') throw new ERR_INVALID_ARG_TYPE$4(name, 'string', value)
}

/**
 * @callback validateNumber
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateNumber} */
function validateNumber(value, name, min = undefined, max) {
  if (typeof value !== 'number') throw new ERR_INVALID_ARG_TYPE$4(name, 'number', value)
  if (
    (min != null && value < min) ||
    (max != null && value > max) ||
    ((min != null || max != null) && NumberIsNaN$1(value))
  ) {
    throw new ERR_OUT_OF_RANGE$1(
      name,
      `${min != null ? `>= ${min}` : ''}${min != null && max != null ? ' && ' : ''}${max != null ? `<= ${max}` : ''}`,
      value
    )
  }
}

/**
 * @callback validateOneOf
 * @template T
 * @param {T} value
 * @param {string} name
 * @param {T[]} oneOf
 */

/** @type {validateOneOf} */
const validateOneOf = hideStackFrames((value, name, oneOf) => {
  if (!ArrayPrototypeIncludes(oneOf, value)) {
    const allowed = ArrayPrototypeJoin(
      ArrayPrototypeMap(oneOf, (v) => (typeof v === 'string' ? `'${v}'` : String$1(v))),
      ', '
    );
    const reason = 'must be one of: ' + allowed;
    throw new ERR_INVALID_ARG_VALUE$3(name, value, reason)
  }
});

/**
 * @callback validateBoolean
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is boolean}
 */

/** @type {validateBoolean} */
function validateBoolean$1(value, name) {
  if (typeof value !== 'boolean') throw new ERR_INVALID_ARG_TYPE$4(name, 'boolean', value)
}

/**
 * @param {any} options
 * @param {string} key
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function getOwnPropertyValueOrDefault(options, key, defaultValue) {
  return options == null || !ObjectPrototypeHasOwnProperty(options, key) ? defaultValue : options[key]
}

/**
 * @callback validateObject
 * @param {*} value
 * @param {string} name
 * @param {{
 *   allowArray?: boolean,
 *   allowFunction?: boolean,
 *   nullable?: boolean
 * }} [options]
 */

/** @type {validateObject} */
const validateObject$2 = hideStackFrames((value, name, options = null) => {
  const allowArray = getOwnPropertyValueOrDefault(options, 'allowArray', false);
  const allowFunction = getOwnPropertyValueOrDefault(options, 'allowFunction', false);
  const nullable = getOwnPropertyValueOrDefault(options, 'nullable', false);
  if (
    (!nullable && value === null) ||
    (!allowArray && ArrayIsArray$2(value)) ||
    (typeof value !== 'object' && (!allowFunction || typeof value !== 'function'))
  ) {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'Object', value)
  }
});

/**
 * @callback validateDictionary - We are using the Web IDL Standard definition
 *                                of "dictionary" here, which means any value
 *                                whose Type is either Undefined, Null, or
 *                                Object (which includes functions).
 * @param {*} value
 * @param {string} name
 * @see https://webidl.spec.whatwg.org/#es-dictionary
 * @see https://tc39.es/ecma262/#table-typeof-operator-results
 */

/** @type {validateDictionary} */
const validateDictionary = hideStackFrames((value, name) => {
  if (value != null && typeof value !== 'object' && typeof value !== 'function') {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'a dictionary', value)
  }
});

/**
 * @callback validateArray
 * @param {*} value
 * @param {string} name
 * @param {number} [minLength]
 * @returns {asserts value is any[]}
 */

/** @type {validateArray} */
const validateArray = hideStackFrames((value, name, minLength = 0) => {
  if (!ArrayIsArray$2(value)) {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'Array', value)
  }
  if (value.length < minLength) {
    const reason = `must be longer than ${minLength}`;
    throw new ERR_INVALID_ARG_VALUE$3(name, value, reason)
  }
});

/**
 * @callback validateStringArray
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is string[]}
 */

/** @type {validateStringArray} */
function validateStringArray(value, name) {
  validateArray(value, name);
  for (let i = 0; i < value.length; i++) {
    validateString(value[i], `${name}[${i}]`);
  }
}

/**
 * @callback validateBooleanArray
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is boolean[]}
 */

/** @type {validateBooleanArray} */
function validateBooleanArray(value, name) {
  validateArray(value, name);
  for (let i = 0; i < value.length; i++) {
    validateBoolean$1(value[i], `${name}[${i}]`);
  }
}

/**
 * @param {*} signal
 * @param {string} [name='signal']
 * @returns {asserts signal is keyof signals}
 */
function validateSignalName(signal, name = 'signal') {
  validateString(signal, name);
  if (signals[signal] === undefined) {
    if (signals[StringPrototypeToUpperCase(signal)] !== undefined) {
      throw new ERR_UNKNOWN_SIGNAL(signal + ' (signals must use all capital letters)')
    }
    throw new ERR_UNKNOWN_SIGNAL(signal)
  }
}

/**
 * @callback validateBuffer
 * @param {*} buffer
 * @param {string} [name='buffer']
 * @returns {asserts buffer is ArrayBufferView}
 */

/** @type {validateBuffer} */
const validateBuffer = hideStackFrames((buffer, name = 'buffer') => {
  if (!isArrayBufferView(buffer)) {
    throw new ERR_INVALID_ARG_TYPE$4(name, ['Buffer', 'TypedArray', 'DataView'], buffer)
  }
});

/**
 * @param {string} data
 * @param {string} encoding
 */
function validateEncoding(data, encoding) {
  const normalizedEncoding = normalizeEncoding(encoding);
  const length = data.length;
  if (normalizedEncoding === 'hex' && length % 2 !== 0) {
    throw new ERR_INVALID_ARG_VALUE$3('encoding', encoding, `is invalid for data of length ${length}`)
  }
}

/**
 * Check that the port number is not NaN when coerced to a number,
 * is an integer and that it falls within the legal range of port numbers.
 * @param {*} port
 * @param {string} [name='Port']
 * @param {boolean} [allowZero=true]
 * @returns {number}
 */
function validatePort(port, name = 'Port', allowZero = true) {
  if (
    (typeof port !== 'number' && typeof port !== 'string') ||
    (typeof port === 'string' && StringPrototypeTrim(port).length === 0) ||
    +port !== +port >>> 0 ||
    port > 0xffff ||
    (port === 0 && !allowZero)
  ) {
    throw new ERR_SOCKET_BAD_PORT(name, port, allowZero)
  }
  return port | 0
}

/**
 * @callback validateAbortSignal
 * @param {*} signal
 * @param {string} name
 */

/** @type {validateAbortSignal} */
const validateAbortSignal$3 = hideStackFrames((signal, name) => {
  if (signal !== undefined && (signal === null || typeof signal !== 'object' || !('aborted' in signal))) {
    throw new ERR_INVALID_ARG_TYPE$4(name, 'AbortSignal', signal)
  }
});

/**
 * @callback validateFunction
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is Function}
 */

/** @type {validateFunction} */
const validateFunction$2 = hideStackFrames((value, name) => {
  if (typeof value !== 'function') throw new ERR_INVALID_ARG_TYPE$4(name, 'Function', value)
});

/**
 * @callback validatePlainFunction
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is Function}
 */

/** @type {validatePlainFunction} */
const validatePlainFunction = hideStackFrames((value, name) => {
  if (typeof value !== 'function' || isAsyncFunction(value)) throw new ERR_INVALID_ARG_TYPE$4(name, 'Function', value)
});

/**
 * @callback validateUndefined
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is undefined}
 */

/** @type {validateUndefined} */
const validateUndefined = hideStackFrames((value, name) => {
  if (value !== undefined) throw new ERR_INVALID_ARG_TYPE$4(name, 'undefined', value)
});

/**
 * @template T
 * @param {T} value
 * @param {string} name
 * @param {T[]} union
 */
function validateUnion(value, name, union) {
  if (!ArrayPrototypeIncludes(union, value)) {
    throw new ERR_INVALID_ARG_TYPE$4(name, `('${ArrayPrototypeJoin(union, '|')}')`, value)
  }
}

/*
  The rules for the Link header field are described here:
  https://www.rfc-editor.org/rfc/rfc8288.html#section-3

  This regex validates any string surrounded by angle brackets
  (not necessarily a valid URI reference) followed by zero or more
  link-params separated by semicolons.
*/
const linkValueRegExp = /^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/;

/**
 * @param {any} value
 * @param {string} name
 */
function validateLinkHeaderFormat(value, name) {
  if (typeof value === 'undefined' || !RegExpPrototypeExec(linkValueRegExp, value)) {
    throw new ERR_INVALID_ARG_VALUE$3(
      name,
      value,
      'must be an array or string of format "</styles.css>; rel=preload; as=style"'
    )
  }
}

/**
 * @param {any} hints
 * @return {string}
 */
function validateLinkHeaderValue(hints) {
  if (typeof hints === 'string') {
    validateLinkHeaderFormat(hints, 'hints');
    return hints
  } else if (ArrayIsArray$2(hints)) {
    const hintsLength = hints.length;
    let result = '';
    if (hintsLength === 0) {
      return result
    }
    for (let i = 0; i < hintsLength; i++) {
      const link = hints[i];
      validateLinkHeaderFormat(link, 'hints');
      result += link;
      if (i !== hintsLength - 1) {
        result += ', ';
      }
    }
    return result
  }
  throw new ERR_INVALID_ARG_VALUE$3(
    'hints',
    hints,
    'must be an array or string of format "</styles.css>; rel=preload; as=style"'
  )
}
var validators = {
  isInt32,
  isUint32,
  parseFileMode,
  validateArray,
  validateStringArray,
  validateBooleanArray,
  validateBoolean: validateBoolean$1,
  validateBuffer,
  validateDictionary,
  validateEncoding,
  validateFunction: validateFunction$2,
  validateInt32,
  validateInteger: validateInteger$1,
  validateNumber,
  validateObject: validateObject$2,
  validateOneOf,
  validatePlainFunction,
  validatePort,
  validateSignalName,
  validateString,
  validateUint32,
  validateUndefined,
  validateUnion,
  validateAbortSignal: validateAbortSignal$3,
  validateLinkHeaderValue
};

var endOfStream = {exports: {}};

var browser$2 = {exports: {}};

// shim for using process in browser
var process$5 = browser$2.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout$1;
var cachedClearTimeout$1;

function defaultSetTimout$1() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout$1 () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout$1 = setTimeout;
        } else {
            cachedSetTimeout$1 = defaultSetTimout$1;
        }
    } catch (e) {
        cachedSetTimeout$1 = defaultSetTimout$1;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout$1 = clearTimeout;
        } else {
            cachedClearTimeout$1 = defaultClearTimeout$1;
        }
    } catch (e) {
        cachedClearTimeout$1 = defaultClearTimeout$1;
    }
} ());
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

process$5.nextTick = function (fun) {
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
};

// v8 likes predictible objects
function Item$1(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item$1.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process$5.title = 'browser';
process$5.browser = true;
process$5.env = {};
process$5.argv = [];
process$5.version = ''; // empty string to avoid regexp issues
process$5.versions = {};

function noop$1() {}

process$5.on = noop$1;
process$5.addListener = noop$1;
process$5.once = noop$1;
process$5.off = noop$1;
process$5.removeListener = noop$1;
process$5.removeAllListeners = noop$1;
process$5.emit = noop$1;
process$5.prependListener = noop$1;
process$5.prependOnceListener = noop$1;

process$5.listeners = function (name) { return [] };

process$5.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process$5.cwd = function () { return '/' };
process$5.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process$5.umask = function() { return 0; };

const { Symbol: Symbol$4, SymbolAsyncIterator: SymbolAsyncIterator$2, SymbolIterator: SymbolIterator$2, SymbolFor } = primordials;
const kDestroyed$1 = Symbol$4('kDestroyed');
const kIsErrored = Symbol$4('kIsErrored');
const kIsReadable = Symbol$4('kIsReadable');
const kIsDisturbed = Symbol$4('kIsDisturbed');
const kIsClosedPromise$1 = SymbolFor('nodejs.webstream.isClosedPromise');
const kControllerErrorFunction = SymbolFor('nodejs.webstream.controllerErrorFunction');
function isReadableNodeStream$2(obj, strict = false) {
  var _obj$_readableState;
  return !!(
    (
      obj &&
      typeof obj.pipe === 'function' &&
      typeof obj.on === 'function' &&
      (!strict || (typeof obj.pause === 'function' && typeof obj.resume === 'function')) &&
      (!obj._writableState ||
        ((_obj$_readableState = obj._readableState) === null || _obj$_readableState === undefined
          ? undefined
          : _obj$_readableState.readable) !== false) &&
      // Duplex
      (!obj._writableState || obj._readableState)
    ) // Writable has .pipe.
  )
}

function isWritableNodeStream$1(obj) {
  var _obj$_writableState;
  return !!(
    (
      obj &&
      typeof obj.write === 'function' &&
      typeof obj.on === 'function' &&
      (!obj._readableState ||
        ((_obj$_writableState = obj._writableState) === null || _obj$_writableState === undefined
          ? undefined
          : _obj$_writableState.writable) !== false)
    ) // Duplex
  )
}

function isDuplexNodeStream(obj) {
  return !!(
    obj &&
    typeof obj.pipe === 'function' &&
    obj._readableState &&
    typeof obj.on === 'function' &&
    typeof obj.write === 'function'
  )
}
function isNodeStream$4(obj) {
  return (
    obj &&
    (obj._readableState ||
      obj._writableState ||
      (typeof obj.write === 'function' && typeof obj.on === 'function') ||
      (typeof obj.pipe === 'function' && typeof obj.on === 'function'))
  )
}
function isReadableStream$3(obj) {
  return !!(
    obj &&
    !isNodeStream$4(obj) &&
    typeof obj.pipeThrough === 'function' &&
    typeof obj.getReader === 'function' &&
    typeof obj.cancel === 'function'
  )
}
function isWritableStream$2(obj) {
  return !!(obj && !isNodeStream$4(obj) && typeof obj.getWriter === 'function' && typeof obj.abort === 'function')
}
function isTransformStream$2(obj) {
  return !!(obj && !isNodeStream$4(obj) && typeof obj.readable === 'object' && typeof obj.writable === 'object')
}
function isWebStream$2(obj) {
  return isReadableStream$3(obj) || isWritableStream$2(obj) || isTransformStream$2(obj)
}
function isIterable$1(obj, isAsync) {
  if (obj == null) return false
  if (isAsync === true) return typeof obj[SymbolAsyncIterator$2] === 'function'
  if (isAsync === false) return typeof obj[SymbolIterator$2] === 'function'
  return typeof obj[SymbolAsyncIterator$2] === 'function' || typeof obj[SymbolIterator$2] === 'function'
}
function isDestroyed$1(stream) {
  if (!isNodeStream$4(stream)) return null
  const wState = stream._writableState;
  const rState = stream._readableState;
  const state = wState || rState;
  return !!(stream.destroyed || stream[kDestroyed$1] || (state !== null && state !== undefined && state.destroyed))
}

// Have been end():d.
function isWritableEnded(stream) {
  if (!isWritableNodeStream$1(stream)) return null
  if (stream.writableEnded === true) return true
  const wState = stream._writableState;
  if (wState !== null && wState !== undefined && wState.errored) return false
  if (typeof (wState === null || wState === undefined ? undefined : wState.ended) !== 'boolean') return null
  return wState.ended
}

// Have emitted 'finish'.
function isWritableFinished$1(stream, strict) {
  if (!isWritableNodeStream$1(stream)) return null
  if (stream.writableFinished === true) return true
  const wState = stream._writableState;
  if (wState !== null && wState !== undefined && wState.errored) return false
  if (typeof (wState === null || wState === undefined ? undefined : wState.finished) !== 'boolean') return null
  return !!(wState.finished || (strict === false && wState.ended === true && wState.length === 0))
}

// Have been push(null):d.
function isReadableEnded$1(stream) {
  if (!isReadableNodeStream$2(stream)) return null
  if (stream.readableEnded === true) return true
  const rState = stream._readableState;
  if (!rState || rState.errored) return false
  if (typeof (rState === null || rState === undefined ? undefined : rState.ended) !== 'boolean') return null
  return rState.ended
}

// Have emitted 'end'.
function isReadableFinished$1(stream, strict) {
  if (!isReadableNodeStream$2(stream)) return null
  const rState = stream._readableState;
  if (rState !== null && rState !== undefined && rState.errored) return false
  if (typeof (rState === null || rState === undefined ? undefined : rState.endEmitted) !== 'boolean') return null
  return !!(rState.endEmitted || (strict === false && rState.ended === true && rState.length === 0))
}
function isReadable$3(stream) {
  if (stream && stream[kIsReadable] != null) return stream[kIsReadable]
  if (typeof (stream === null || stream === undefined ? undefined : stream.readable) !== 'boolean') return null
  if (isDestroyed$1(stream)) return false
  return isReadableNodeStream$2(stream) && stream.readable && !isReadableFinished$1(stream)
}
function isWritable$3(stream) {
  if (typeof (stream === null || stream === undefined ? undefined : stream.writable) !== 'boolean') return null
  if (isDestroyed$1(stream)) return false
  return isWritableNodeStream$1(stream) && stream.writable && !isWritableEnded(stream)
}
function isFinished$1(stream, opts) {
  if (!isNodeStream$4(stream)) {
    return null
  }
  if (isDestroyed$1(stream)) {
    return true
  }
  if ((opts === null || opts === undefined ? undefined : opts.readable) !== false && isReadable$3(stream)) {
    return false
  }
  if ((opts === null || opts === undefined ? undefined : opts.writable) !== false && isWritable$3(stream)) {
    return false
  }
  return true
}
function isWritableErrored$1(stream) {
  var _stream$_writableStat, _stream$_writableStat2;
  if (!isNodeStream$4(stream)) {
    return null
  }
  if (stream.writableErrored) {
    return stream.writableErrored
  }
  return (_stream$_writableStat =
    (_stream$_writableStat2 = stream._writableState) === null || _stream$_writableStat2 === undefined
      ? undefined
      : _stream$_writableStat2.errored) !== null && _stream$_writableStat !== undefined
    ? _stream$_writableStat
    : null
}
function isReadableErrored$1(stream) {
  var _stream$_readableStat, _stream$_readableStat2;
  if (!isNodeStream$4(stream)) {
    return null
  }
  if (stream.readableErrored) {
    return stream.readableErrored
  }
  return (_stream$_readableStat =
    (_stream$_readableStat2 = stream._readableState) === null || _stream$_readableStat2 === undefined
      ? undefined
      : _stream$_readableStat2.errored) !== null && _stream$_readableStat !== undefined
    ? _stream$_readableStat
    : null
}
function isClosed$1(stream) {
  if (!isNodeStream$4(stream)) {
    return null
  }
  if (typeof stream.closed === 'boolean') {
    return stream.closed
  }
  const wState = stream._writableState;
  const rState = stream._readableState;
  if (
    typeof (wState === null || wState === undefined ? undefined : wState.closed) === 'boolean' ||
    typeof (rState === null || rState === undefined ? undefined : rState.closed) === 'boolean'
  ) {
    return (
      (wState === null || wState === undefined ? undefined : wState.closed) ||
      (rState === null || rState === undefined ? undefined : rState.closed)
    )
  }
  if (typeof stream._closed === 'boolean' && isOutgoingMessage(stream)) {
    return stream._closed
  }
  return null
}
function isOutgoingMessage(stream) {
  return (
    typeof stream._closed === 'boolean' &&
    typeof stream._defaultKeepAlive === 'boolean' &&
    typeof stream._removedConnection === 'boolean' &&
    typeof stream._removedContLen === 'boolean'
  )
}
function isServerResponse(stream) {
  return typeof stream._sent100 === 'boolean' && isOutgoingMessage(stream)
}
function isServerRequest$1(stream) {
  var _stream$req;
  return (
    typeof stream._consuming === 'boolean' &&
    typeof stream._dumped === 'boolean' &&
    ((_stream$req = stream.req) === null || _stream$req === undefined ? undefined : _stream$req.upgradeOrConnect) ===
      undefined
  )
}
function willEmitClose(stream) {
  if (!isNodeStream$4(stream)) return null
  const wState = stream._writableState;
  const rState = stream._readableState;
  const state = wState || rState;
  return (
    (!state && isServerResponse(stream)) || !!(state && state.autoDestroy && state.emitClose && state.closed === false)
  )
}
function isDisturbed(stream) {
  var _stream$kIsDisturbed;
  return !!(
    stream &&
    ((_stream$kIsDisturbed = stream[kIsDisturbed]) !== null && _stream$kIsDisturbed !== undefined
      ? _stream$kIsDisturbed
      : stream.readableDidRead || stream.readableAborted)
  )
}
function isErrored(stream) {
  var _ref,
    _ref2,
    _ref3,
    _ref4,
    _ref5,
    _stream$kIsErrored,
    _stream$_readableStat3,
    _stream$_writableStat3,
    _stream$_readableStat4,
    _stream$_writableStat4;
  return !!(
    stream &&
    ((_ref =
      (_ref2 =
        (_ref3 =
          (_ref4 =
            (_ref5 =
              (_stream$kIsErrored = stream[kIsErrored]) !== null && _stream$kIsErrored !== undefined
                ? _stream$kIsErrored
                : stream.readableErrored) !== null && _ref5 !== undefined
              ? _ref5
              : stream.writableErrored) !== null && _ref4 !== undefined
            ? _ref4
            : (_stream$_readableStat3 = stream._readableState) === null || _stream$_readableStat3 === undefined
            ? undefined
            : _stream$_readableStat3.errorEmitted) !== null && _ref3 !== undefined
          ? _ref3
          : (_stream$_writableStat3 = stream._writableState) === null || _stream$_writableStat3 === undefined
          ? undefined
          : _stream$_writableStat3.errorEmitted) !== null && _ref2 !== undefined
        ? _ref2
        : (_stream$_readableStat4 = stream._readableState) === null || _stream$_readableStat4 === undefined
        ? undefined
        : _stream$_readableStat4.errored) !== null && _ref !== undefined
      ? _ref
      : (_stream$_writableStat4 = stream._writableState) === null || _stream$_writableStat4 === undefined
      ? undefined
      : _stream$_writableStat4.errored)
  )
}
var utils = {
  kDestroyed: kDestroyed$1,
  isDisturbed,
  kIsDisturbed,
  isErrored,
  kIsErrored,
  isReadable: isReadable$3,
  kIsReadable,
  kIsClosedPromise: kIsClosedPromise$1,
  kControllerErrorFunction,
  isClosed: isClosed$1,
  isDestroyed: isDestroyed$1,
  isDuplexNodeStream,
  isFinished: isFinished$1,
  isIterable: isIterable$1,
  isReadableNodeStream: isReadableNodeStream$2,
  isReadableStream: isReadableStream$3,
  isReadableEnded: isReadableEnded$1,
  isReadableFinished: isReadableFinished$1,
  isReadableErrored: isReadableErrored$1,
  isNodeStream: isNodeStream$4,
  isWebStream: isWebStream$2,
  isWritable: isWritable$3,
  isWritableNodeStream: isWritableNodeStream$1,
  isWritableStream: isWritableStream$2,
  isWritableEnded,
  isWritableFinished: isWritableFinished$1,
  isWritableErrored: isWritableErrored$1,
  isServerRequest: isServerRequest$1,
  isServerResponse,
  willEmitClose,
  isTransformStream: isTransformStream$2
};

/* replacement start */

const process$4 = browser$2.exports

/* replacement end */
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).

;const { AbortError: AbortError$4, codes } = errors;
const { ERR_INVALID_ARG_TYPE: ERR_INVALID_ARG_TYPE$3, ERR_STREAM_PREMATURE_CLOSE: ERR_STREAM_PREMATURE_CLOSE$1 } = codes;
const { kEmptyObject, once: once$2 } = util$4.exports;
const { validateAbortSignal: validateAbortSignal$2, validateFunction: validateFunction$1, validateObject: validateObject$1, validateBoolean } = validators;
const { Promise: Promise$3, PromisePrototypeThen: PromisePrototypeThen$2 } = primordials;
const {
  isClosed,
  isReadable: isReadable$2,
  isReadableNodeStream: isReadableNodeStream$1,
  isReadableStream: isReadableStream$2,
  isReadableFinished,
  isReadableErrored,
  isWritable: isWritable$2,
  isWritableNodeStream,
  isWritableStream: isWritableStream$1,
  isWritableFinished,
  isWritableErrored,
  isNodeStream: isNodeStream$3,
  willEmitClose: _willEmitClose,
  kIsClosedPromise
} = utils;
function isRequest$1(stream) {
  return stream.setHeader && typeof stream.abort === 'function'
}
const nop = () => {};
function eos$2(stream, options, callback) {
  var _options$readable, _options$writable;
  if (arguments.length === 2) {
    callback = options;
    options = kEmptyObject;
  } else if (options == null) {
    options = kEmptyObject;
  } else {
    validateObject$1(options, 'options');
  }
  validateFunction$1(callback, 'callback');
  validateAbortSignal$2(options.signal, 'options.signal');
  callback = once$2(callback);
  if (isReadableStream$2(stream) || isWritableStream$1(stream)) {
    return eosWeb(stream, options, callback)
  }
  if (!isNodeStream$3(stream)) {
    throw new ERR_INVALID_ARG_TYPE$3('stream', ['ReadableStream', 'WritableStream', 'Stream'], stream)
  }
  const readable =
    (_options$readable = options.readable) !== null && _options$readable !== undefined
      ? _options$readable
      : isReadableNodeStream$1(stream);
  const writable =
    (_options$writable = options.writable) !== null && _options$writable !== undefined
      ? _options$writable
      : isWritableNodeStream(stream);
  const wState = stream._writableState;
  const rState = stream._readableState;
  const onlegacyfinish = () => {
    if (!stream.writable) {
      onfinish();
    }
  };

  // TODO (ronag): Improve soft detection to include core modules and
  // common ecosystem modules that do properly emit 'close' but fail
  // this generic check.
  let willEmitClose =
    _willEmitClose(stream) && isReadableNodeStream$1(stream) === readable && isWritableNodeStream(stream) === writable;
  let writableFinished = isWritableFinished(stream, false);
  const onfinish = () => {
    writableFinished = true;
    // Stream should not be destroyed here. If it is that
    // means that user space is doing something differently and
    // we cannot trust willEmitClose.
    if (stream.destroyed) {
      willEmitClose = false;
    }
    if (willEmitClose && (!stream.readable || readable)) {
      return
    }
    if (!readable || readableFinished) {
      callback.call(stream);
    }
  };
  let readableFinished = isReadableFinished(stream, false);
  const onend = () => {
    readableFinished = true;
    // Stream should not be destroyed here. If it is that
    // means that user space is doing something differently and
    // we cannot trust willEmitClose.
    if (stream.destroyed) {
      willEmitClose = false;
    }
    if (willEmitClose && (!stream.writable || writable)) {
      return
    }
    if (!writable || writableFinished) {
      callback.call(stream);
    }
  };
  const onerror = (err) => {
    callback.call(stream, err);
  };
  let closed = isClosed(stream);
  const onclose = () => {
    closed = true;
    const errored = isWritableErrored(stream) || isReadableErrored(stream);
    if (errored && typeof errored !== 'boolean') {
      return callback.call(stream, errored)
    }
    if (readable && !readableFinished && isReadableNodeStream$1(stream, true)) {
      if (!isReadableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE$1())
    }
    if (writable && !writableFinished) {
      if (!isWritableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE$1())
    }
    callback.call(stream);
  };
  const onclosed = () => {
    closed = true;
    const errored = isWritableErrored(stream) || isReadableErrored(stream);
    if (errored && typeof errored !== 'boolean') {
      return callback.call(stream, errored)
    }
    callback.call(stream);
  };
  const onrequest = () => {
    stream.req.on('finish', onfinish);
  };
  if (isRequest$1(stream)) {
    stream.on('complete', onfinish);
    if (!willEmitClose) {
      stream.on('abort', onclose);
    }
    if (stream.req) {
      onrequest();
    } else {
      stream.on('request', onrequest);
    }
  } else if (writable && !wState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  // Not all streams will emit 'close' after 'aborted'.
  if (!willEmitClose && typeof stream.aborted === 'boolean') {
    stream.on('aborted', onclose);
  }
  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (options.error !== false) {
    stream.on('error', onerror);
  }
  stream.on('close', onclose);
  if (closed) {
    process$4.nextTick(onclose);
  } else if (
    (wState !== null && wState !== undefined && wState.errorEmitted) ||
    (rState !== null && rState !== undefined && rState.errorEmitted)
  ) {
    if (!willEmitClose) {
      process$4.nextTick(onclosed);
    }
  } else if (
    !readable &&
    (!willEmitClose || isReadable$2(stream)) &&
    (writableFinished || isWritable$2(stream) === false)
  ) {
    process$4.nextTick(onclosed);
  } else if (
    !writable &&
    (!willEmitClose || isWritable$2(stream)) &&
    (readableFinished || isReadable$2(stream) === false)
  ) {
    process$4.nextTick(onclosed);
  } else if (rState && stream.req && stream.aborted) {
    process$4.nextTick(onclosed);
  }
  const cleanup = () => {
    callback = nop;
    stream.removeListener('aborted', onclose);
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
  if (options.signal && !closed) {
    const abort = () => {
      // Keep it because cleanup removes it.
      const endCallback = callback;
      cleanup();
      endCallback.call(
        stream,
        new AbortError$4(undefined, {
          cause: options.signal.reason
        })
      );
    };
    if (options.signal.aborted) {
      process$4.nextTick(abort);
    } else {
      const originalCallback = callback;
      callback = once$2((...args) => {
        options.signal.removeEventListener('abort', abort);
        originalCallback.apply(stream, args);
      });
      options.signal.addEventListener('abort', abort);
    }
  }
  return cleanup
}
function eosWeb(stream, options, callback) {
  let isAborted = false;
  let abort = nop;
  if (options.signal) {
    abort = () => {
      isAborted = true;
      callback.call(
        stream,
        new AbortError$4(undefined, {
          cause: options.signal.reason
        })
      );
    };
    if (options.signal.aborted) {
      process$4.nextTick(abort);
    } else {
      const originalCallback = callback;
      callback = once$2((...args) => {
        options.signal.removeEventListener('abort', abort);
        originalCallback.apply(stream, args);
      });
      options.signal.addEventListener('abort', abort);
    }
  }
  const resolverFn = (...args) => {
    if (!isAborted) {
      process$4.nextTick(() => callback.apply(stream, args));
    }
  };
  PromisePrototypeThen$2(stream[kIsClosedPromise].promise, resolverFn, resolverFn);
  return nop
}
function finished$1(stream, opts) {
  var _opts;
  let autoCleanup = false;
  if (opts === null) {
    opts = kEmptyObject;
  }
  if ((_opts = opts) !== null && _opts !== undefined && _opts.cleanup) {
    validateBoolean(opts.cleanup, 'cleanup');
    autoCleanup = opts.cleanup;
  }
  return new Promise$3((resolve, reject) => {
    const cleanup = eos$2(stream, opts, (err) => {
      if (autoCleanup) {
        cleanup();
      }
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}
endOfStream.exports = eos$2;
endOfStream.exports.finished = finished$1;

/* replacement start */

const process$3 = browser$2.exports;

/* replacement end */

const {
  aggregateTwoErrors: aggregateTwoErrors$1,
  codes: { ERR_MULTIPLE_CALLBACK },
  AbortError: AbortError$3
} = errors;
const { Symbol: Symbol$3 } = primordials;
const { kDestroyed, isDestroyed, isFinished, isServerRequest } = utils;
const kDestroy = Symbol$3('kDestroy');
const kConstruct = Symbol$3('kConstruct');
function checkError(err, w, r) {
  if (err) {
    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
    err.stack; // eslint-disable-line no-unused-expressions

    if (w && !w.errored) {
      w.errored = err;
    }
    if (r && !r.errored) {
      r.errored = err;
    }
  }
}

// Backwards compat. cb() is undocumented and unused in core but
// unfortunately might be used by modules.
function destroy(err, cb) {
  const r = this._readableState;
  const w = this._writableState;
  // With duplex streams we use the writable side for state.
  const s = w || r;
  if ((w !== null && w !== undefined && w.destroyed) || (r !== null && r !== undefined && r.destroyed)) {
    if (typeof cb === 'function') {
      cb();
    }
    return this
  }

  // We set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks
  checkError(err, w, r);
  if (w) {
    w.destroyed = true;
  }
  if (r) {
    r.destroyed = true;
  }

  // If still constructing then defer calling _destroy.
  if (!s.constructed) {
    this.once(kDestroy, function (er) {
      _destroy(this, aggregateTwoErrors$1(er, err), cb);
    });
  } else {
    _destroy(this, err, cb);
  }
  return this
}
function _destroy(self, err, cb) {
  let called = false;
  function onDestroy(err) {
    if (called) {
      return
    }
    called = true;
    const r = self._readableState;
    const w = self._writableState;
    checkError(err, w, r);
    if (w) {
      w.closed = true;
    }
    if (r) {
      r.closed = true;
    }
    if (typeof cb === 'function') {
      cb(err);
    }
    if (err) {
      process$3.nextTick(emitErrorCloseNT, self, err);
    } else {
      process$3.nextTick(emitCloseNT, self);
    }
  }
  try {
    self._destroy(err || null, onDestroy);
  } catch (err) {
    onDestroy(err);
  }
}
function emitErrorCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}
function emitCloseNT(self) {
  const r = self._readableState;
  const w = self._writableState;
  if (w) {
    w.closeEmitted = true;
  }
  if (r) {
    r.closeEmitted = true;
  }
  if ((w !== null && w !== undefined && w.emitClose) || (r !== null && r !== undefined && r.emitClose)) {
    self.emit('close');
  }
}
function emitErrorNT(self, err) {
  const r = self._readableState;
  const w = self._writableState;
  if ((w !== null && w !== undefined && w.errorEmitted) || (r !== null && r !== undefined && r.errorEmitted)) {
    return
  }
  if (w) {
    w.errorEmitted = true;
  }
  if (r) {
    r.errorEmitted = true;
  }
  self.emit('error', err);
}
function undestroy() {
  const r = this._readableState;
  const w = this._writableState;
  if (r) {
    r.constructed = true;
    r.closed = false;
    r.closeEmitted = false;
    r.destroyed = false;
    r.errored = null;
    r.errorEmitted = false;
    r.reading = false;
    r.ended = r.readable === false;
    r.endEmitted = r.readable === false;
  }
  if (w) {
    w.constructed = true;
    w.destroyed = false;
    w.closed = false;
    w.closeEmitted = false;
    w.errored = null;
    w.errorEmitted = false;
    w.finalCalled = false;
    w.prefinished = false;
    w.ended = w.writable === false;
    w.ending = w.writable === false;
    w.finished = w.writable === false;
  }
}
function errorOrDestroy(stream, err, sync) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.

  const r = stream._readableState;
  const w = stream._writableState;
  if ((w !== null && w !== undefined && w.destroyed) || (r !== null && r !== undefined && r.destroyed)) {
    return this
  }
  if ((r !== null && r !== undefined && r.autoDestroy) || (w !== null && w !== undefined && w.autoDestroy))
    stream.destroy(err);
  else if (err) {
    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
    err.stack; // eslint-disable-line no-unused-expressions

    if (w && !w.errored) {
      w.errored = err;
    }
    if (r && !r.errored) {
      r.errored = err;
    }
    if (sync) {
      process$3.nextTick(emitErrorNT, stream, err);
    } else {
      emitErrorNT(stream, err);
    }
  }
}
function construct(stream, cb) {
  if (typeof stream._construct !== 'function') {
    return
  }
  const r = stream._readableState;
  const w = stream._writableState;
  if (r) {
    r.constructed = false;
  }
  if (w) {
    w.constructed = false;
  }
  stream.once(kConstruct, cb);
  if (stream.listenerCount(kConstruct) > 1) {
    // Duplex
    return
  }
  process$3.nextTick(constructNT, stream);
}
function constructNT(stream) {
  let called = false;
  function onConstruct(err) {
    if (called) {
      errorOrDestroy(stream, err !== null && err !== undefined ? err : new ERR_MULTIPLE_CALLBACK());
      return
    }
    called = true;
    const r = stream._readableState;
    const w = stream._writableState;
    const s = w || r;
    if (r) {
      r.constructed = true;
    }
    if (w) {
      w.constructed = true;
    }
    if (s.destroyed) {
      stream.emit(kDestroy, err);
    } else if (err) {
      errorOrDestroy(stream, err, true);
    } else {
      process$3.nextTick(emitConstructNT, stream);
    }
  }
  try {
    stream._construct((err) => {
      process$3.nextTick(onConstruct, err);
    });
  } catch (err) {
    process$3.nextTick(onConstruct, err);
  }
}
function emitConstructNT(stream) {
  stream.emit(kConstruct);
}
function isRequest(stream) {
  return (stream === null || stream === undefined ? undefined : stream.setHeader) && typeof stream.abort === 'function'
}
function emitCloseLegacy(stream) {
  stream.emit('close');
}
function emitErrorCloseLegacy(stream, err) {
  stream.emit('error', err);
  process$3.nextTick(emitCloseLegacy, stream);
}

// Normalize destroy for legacy.
function destroyer$2(stream, err) {
  if (!stream || isDestroyed(stream)) {
    return
  }
  if (!err && !isFinished(stream)) {
    err = new AbortError$3();
  }

  // TODO: Remove isRequest branches.
  if (isServerRequest(stream)) {
    stream.socket = null;
    stream.destroy(err);
  } else if (isRequest(stream)) {
    stream.abort();
  } else if (isRequest(stream.req)) {
    stream.req.abort();
  } else if (typeof stream.destroy === 'function') {
    stream.destroy(err);
  } else if (typeof stream.close === 'function') {
    // TODO: Don't lose err?
    stream.close();
  } else if (err) {
    process$3.nextTick(emitErrorCloseLegacy, stream, err);
  } else {
    process$3.nextTick(emitCloseLegacy, stream);
  }
  if (!stream.destroyed) {
    stream[kDestroyed] = true;
  }
}
var destroy_1 = {
  construct,
  destroyer: destroyer$2,
  destroy,
  undestroy,
  errorOrDestroy
};

const require$$5 = /*@__PURE__*/getAugmentedNamespace(events);

const { ArrayIsArray: ArrayIsArray$1, ObjectSetPrototypeOf: ObjectSetPrototypeOf$2 } = primordials;
const { EventEmitter: EE } = require$$5;
function Stream(opts) {
  EE.call(this, opts);
}
ObjectSetPrototypeOf$2(Stream.prototype, EE.prototype);
ObjectSetPrototypeOf$2(Stream, EE);
Stream.prototype.pipe = function (dest, options) {
  const source = this;
  function ondata(chunk) {
    if (dest.writable && dest.write(chunk) === false && source.pause) {
      source.pause();
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
  let didOnEnd = false;
  function onend() {
    if (didOnEnd) return
    didOnEnd = true;
    dest.end();
  }
  function onclose() {
    if (didOnEnd) return
    didOnEnd = true;
    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // Don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      this.emit('error', er);
    }
  }
  prependListener(source, 'error', onerror);
  prependListener(dest, 'error', onerror);

  // Remove all the event listeners that were added.
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
  return dest
};
function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn)

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
  else if (ArrayIsArray$1(emitter._events[event])) emitter._events[event].unshift(fn);
  else emitter._events[event] = [fn, emitter._events[event]];
}
var legacy = {
  Stream,
  prependListener
};

var addAbortSignal = {exports: {}};

(function (module) {

	const { AbortError, codes } = errors;
	const { isNodeStream, isWebStream, kControllerErrorFunction } = utils;
	const eos = endOfStream.exports;
	const { ERR_INVALID_ARG_TYPE } = codes;

	// This method is inlined here for readable-stream
	// It also does not allow for signal to not exist on the stream
	// https://github.com/nodejs/node/pull/36061#discussion_r533718029
	const validateAbortSignal = (signal, name) => {
	  if (typeof signal !== 'object' || !('aborted' in signal)) {
	    throw new ERR_INVALID_ARG_TYPE(name, 'AbortSignal', signal)
	  }
	};
	module.exports.addAbortSignal = function addAbortSignal(signal, stream) {
	  validateAbortSignal(signal, 'signal');
	  if (!isNodeStream(stream) && !isWebStream(stream)) {
	    throw new ERR_INVALID_ARG_TYPE('stream', ['ReadableStream', 'WritableStream', 'Stream'], stream)
	  }
	  return module.exports.addAbortSignalNoValidate(signal, stream)
	};
	module.exports.addAbortSignalNoValidate = function (signal, stream) {
	  if (typeof signal !== 'object' || !('aborted' in signal)) {
	    return stream
	  }
	  const onAbort = isNodeStream(stream)
	    ? () => {
	        stream.destroy(
	          new AbortError(undefined, {
	            cause: signal.reason
	          })
	        );
	      }
	    : () => {
	        stream[kControllerErrorFunction](
	          new AbortError(undefined, {
	            cause: signal.reason
	          })
	        );
	      };
	  if (signal.aborted) {
	    onAbort();
	  } else {
	    signal.addEventListener('abort', onAbort);
	    eos(stream, () => signal.removeEventListener('abort', onAbort));
	  }
	  return stream
	};
} (addAbortSignal));

const { StringPrototypeSlice, SymbolIterator: SymbolIterator$1, TypedArrayPrototypeSet, Uint8Array: Uint8Array$1 } = primordials;
const { Buffer: Buffer$2 } = require$$0$1;
const { inspect: inspect$1 } = util$4.exports;
var buffer_list = class BufferList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  push(v) {
    const entry = {
      data: v,
      next: null
    };
    if (this.length > 0) this.tail.next = entry;
    else this.head = entry;
    this.tail = entry;
    ++this.length;
  }
  unshift(v) {
    const entry = {
      data: v,
      next: this.head
    };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  }
  shift() {
    if (this.length === 0) return
    const ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;
    else this.head = this.head.next;
    --this.length;
    return ret
  }
  clear() {
    this.head = this.tail = null;
    this.length = 0;
  }
  join(s) {
    if (this.length === 0) return ''
    let p = this.head;
    let ret = '' + p.data;
    while ((p = p.next) !== null) ret += s + p.data;
    return ret
  }
  concat(n) {
    if (this.length === 0) return Buffer$2.alloc(0)
    const ret = Buffer$2.allocUnsafe(n >>> 0);
    let p = this.head;
    let i = 0;
    while (p) {
      TypedArrayPrototypeSet(ret, p.data, i);
      i += p.data.length;
      p = p.next;
    }
    return ret
  }

  // Consumes a specified amount of bytes or characters from the buffered data.
  consume(n, hasStrings) {
    const data = this.head.data;
    if (n < data.length) {
      // `slice` is the same for buffers and strings.
      const slice = data.slice(0, n);
      this.head.data = data.slice(n);
      return slice
    }
    if (n === data.length) {
      // First chunk is a perfect match.
      return this.shift()
    }
    // Result spans more than one buffer.
    return hasStrings ? this._getString(n) : this._getBuffer(n)
  }
  first() {
    return this.head.data
  }
  *[SymbolIterator$1]() {
    for (let p = this.head; p; p = p.next) {
      yield p.data;
    }
  }

  // Consumes a specified amount of characters from the buffered data.
  _getString(n) {
    let ret = '';
    let p = this.head;
    let c = 0;
    do {
      const str = p.data;
      if (n > str.length) {
        ret += str;
        n -= str.length;
      } else {
        if (n === str.length) {
          ret += str;
          ++c;
          if (p.next) this.head = p.next;
          else this.head = this.tail = null;
        } else {
          ret += StringPrototypeSlice(str, 0, n);
          this.head = p;
          p.data = StringPrototypeSlice(str, n);
        }
        break
      }
      ++c;
    } while ((p = p.next) !== null)
    this.length -= c;
    return ret
  }

  // Consumes a specified amount of bytes from the buffered data.
  _getBuffer(n) {
    const ret = Buffer$2.allocUnsafe(n);
    const retLen = n;
    let p = this.head;
    let c = 0;
    do {
      const buf = p.data;
      if (n > buf.length) {
        TypedArrayPrototypeSet(ret, buf, retLen - n);
        n -= buf.length;
      } else {
        if (n === buf.length) {
          TypedArrayPrototypeSet(ret, buf, retLen - n);
          ++c;
          if (p.next) this.head = p.next;
          else this.head = this.tail = null;
        } else {
          TypedArrayPrototypeSet(ret, new Uint8Array$1(buf.buffer, buf.byteOffset, n), retLen - n);
          this.head = p;
          p.data = buf.slice(n);
        }
        break
      }
      ++c;
    } while ((p = p.next) !== null)
    this.length -= c;
    return ret
  }

  // Make sure the linked list only shows the minimal necessary information.
  [Symbol.for('nodejs.util.inspect.custom')](_, options) {
    return inspect$1(this, {
      ...options,
      // Only inspect one level.
      depth: 0,
      // It should not recurse.
      customInspect: false
    })
  }
};

const { MathFloor: MathFloor$1, NumberIsInteger } = primordials;
const { ERR_INVALID_ARG_VALUE: ERR_INVALID_ARG_VALUE$2 } = errors.codes;
function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null
}
function getDefaultHighWaterMark(objectMode) {
  return objectMode ? 16 : 16 * 1024
}
function getHighWaterMark$1(state, options, duplexKey, isDuplex) {
  const hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
  if (hwm != null) {
    if (!NumberIsInteger(hwm) || hwm < 0) {
      const name = isDuplex ? `options.${duplexKey}` : 'options.highWaterMark';
      throw new ERR_INVALID_ARG_VALUE$2(name, hwm)
    }
    return MathFloor$1(hwm)
  }

  // Default value
  return getDefaultHighWaterMark(state.objectMode)
}
var state = {
  getHighWaterMark: getHighWaterMark$1,
  getDefaultHighWaterMark
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

const stringDecoder = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  StringDecoder
}, Symbol.toStringTag, { value: 'Module' }));

const require$$13 = /*@__PURE__*/getAugmentedNamespace(stringDecoder);

/* replacement start */

const process$2 = browser$2.exports;

/* replacement end */

const { PromisePrototypeThen: PromisePrototypeThen$1, SymbolAsyncIterator: SymbolAsyncIterator$1, SymbolIterator } = primordials;
const { Buffer: Buffer$1 } = require$$0$1;
const { ERR_INVALID_ARG_TYPE: ERR_INVALID_ARG_TYPE$2, ERR_STREAM_NULL_VALUES } = errors.codes;
function from(Readable, iterable, opts) {
  let iterator;
  if (typeof iterable === 'string' || iterable instanceof Buffer$1) {
    return new Readable({
      objectMode: true,
      ...opts,
      read() {
        this.push(iterable);
        this.push(null);
      }
    })
  }
  let isAsync;
  if (iterable && iterable[SymbolAsyncIterator$1]) {
    isAsync = true;
    iterator = iterable[SymbolAsyncIterator$1]();
  } else if (iterable && iterable[SymbolIterator]) {
    isAsync = false;
    iterator = iterable[SymbolIterator]();
  } else {
    throw new ERR_INVALID_ARG_TYPE$2('iterable', ['Iterable'], iterable)
  }
  const readable = new Readable({
    objectMode: true,
    highWaterMark: 1,
    // TODO(ronag): What options should be allowed?
    ...opts
  });

  // Flag to protect against _read
  // being called before last iteration completion.
  let reading = false;
  readable._read = function () {
    if (!reading) {
      reading = true;
      next();
    }
  };
  readable._destroy = function (error, cb) {
    PromisePrototypeThen$1(
      close(error),
      () => process$2.nextTick(cb, error),
      // nextTick is here in case cb throws
      (e) => process$2.nextTick(cb, e || error)
    );
  };
  async function close(error) {
    const hadError = error !== undefined && error !== null;
    const hasThrow = typeof iterator.throw === 'function';
    if (hadError && hasThrow) {
      const { value, done } = await iterator.throw(error);
      await value;
      if (done) {
        return
      }
    }
    if (typeof iterator.return === 'function') {
      const { value } = await iterator.return();
      await value;
    }
  }
  async function next() {
    for (;;) {
      try {
        const { value, done } = isAsync ? await iterator.next() : iterator.next();
        if (done) {
          readable.push(null);
        } else {
          const res = value && typeof value.then === 'function' ? await value : value;
          if (res === null) {
            reading = false;
            throw new ERR_STREAM_NULL_VALUES()
          } else if (readable.push(res)) {
            continue
          } else {
            reading = false;
          }
        }
      } catch (err) {
        readable.destroy(err);
      }
      break
    }
  }
  return readable
}
var from_1 = from;

/* replacement start */

var readable;
var hasRequiredReadable;

function requireReadable () {
	if (hasRequiredReadable) return readable;
	hasRequiredReadable = 1;
	const process = browser$2.exports

	/* replacement end */
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	;	const {
	  ArrayPrototypeIndexOf,
	  NumberIsInteger,
	  NumberIsNaN,
	  NumberParseInt,
	  ObjectDefineProperties,
	  ObjectKeys,
	  ObjectSetPrototypeOf,
	  Promise,
	  SafeSet,
	  SymbolAsyncIterator,
	  Symbol
	} = primordials;
	readable = Readable;
	Readable.ReadableState = ReadableState;
	const { EventEmitter: EE } = require$$5;
	const { Stream, prependListener } = legacy;
	const { Buffer } = require$$0$1;
	const { addAbortSignal: addAbortSignal$1 } = addAbortSignal.exports;
	const eos = endOfStream.exports;
	let debug = util$4.exports.debuglog('stream', (fn) => {
	  debug = fn;
	});
	const BufferList = buffer_list;
	const destroyImpl = destroy_1;
	const { getHighWaterMark, getDefaultHighWaterMark } = state;
	const {
	  aggregateTwoErrors,
	  codes: {
	    ERR_INVALID_ARG_TYPE,
	    ERR_METHOD_NOT_IMPLEMENTED,
	    ERR_OUT_OF_RANGE,
	    ERR_STREAM_PUSH_AFTER_EOF,
	    ERR_STREAM_UNSHIFT_AFTER_END_EVENT
	  }
	} = errors;
	const { validateObject } = validators;
	const kPaused = Symbol('kPaused');
	const { StringDecoder } = require$$13;
	const from = from_1;
	ObjectSetPrototypeOf(Readable.prototype, Stream.prototype);
	ObjectSetPrototypeOf(Readable, Stream);
	const nop = () => {};
	const { errorOrDestroy } = destroyImpl;
	function ReadableState(options, stream, isDuplex) {
	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof requireDuplex();

	  // Object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away.
	  this.objectMode = !!(options && options.objectMode);
	  if (isDuplex) this.objectMode = this.objectMode || !!(options && options.readableObjectMode);

	  // The point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  this.highWaterMark = options
	    ? getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex)
	    : getDefaultHighWaterMark(false);

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift().
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = [];
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // Stream is still being constructed and cannot be
	  // destroyed until construction finished or failed.
	  // Async construction is opt in, therefore we start as
	  // constructed.
	  this.constructed = true;

	  // A flag to be able to tell if the event 'readable'/'data' is emitted
	  // immediately, or on a later tick.  We set this to true at first, because
	  // any actions that shouldn't happen until "later" should generally also
	  // not happen before the first read call.
	  this.sync = true;

	  // Whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;
	  this[kPaused] = null;

	  // True if the error was already emitted and should not be thrown again.
	  this.errorEmitted = false;

	  // Should close be emitted on destroy. Defaults to true.
	  this.emitClose = !options || options.emitClose !== false;

	  // Should .destroy() be called after 'end' (and potentially 'finish').
	  this.autoDestroy = !options || options.autoDestroy !== false;

	  // Has it been destroyed.
	  this.destroyed = false;

	  // Indicates whether the stream has errored. When true no further
	  // _read calls, 'data' or 'readable' events should occur. This is needed
	  // since when autoDestroy is disabled we need a way to tell whether the
	  // stream has failed.
	  this.errored = null;

	  // Indicates whether the stream has finished destroying.
	  this.closed = false;

	  // True if close has been emitted or would have been emitted
	  // depending on emitClose.
	  this.closeEmitted = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = (options && options.defaultEncoding) || 'utf8';

	  // Ref the piped dest which we need a drain event on it
	  // type: null | Writable | Set<Writable>.
	  this.awaitDrainWriters = null;
	  this.multiAwaitDrain = false;

	  // If true, a maybeReadMore has been scheduled.
	  this.readingMore = false;
	  this.dataEmitted = false;
	  this.decoder = null;
	  this.encoding = null;
	  if (options && options.encoding) {
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}
	function Readable(options) {
	  if (!(this instanceof Readable)) return new Readable(options)

	  // Checking for a Stream.Duplex instance is faster here instead of inside
	  // the ReadableState constructor, at least with V8 6.5.
	  const isDuplex = this instanceof requireDuplex();
	  this._readableState = new ReadableState(options, this, isDuplex);
	  if (options) {
	    if (typeof options.read === 'function') this._read = options.read;
	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
	    if (typeof options.construct === 'function') this._construct = options.construct;
	    if (options.signal && !isDuplex) addAbortSignal$1(options.signal, this);
	  }
	  Stream.call(this, options);
	  destroyImpl.construct(this, () => {
	    if (this._readableState.needReadable) {
	      maybeReadMore(this, this._readableState);
	    }
	  });
	}
	Readable.prototype.destroy = destroyImpl.destroy;
	Readable.prototype._undestroy = destroyImpl.undestroy;
	Readable.prototype._destroy = function (err, cb) {
	  cb(err);
	};
	Readable.prototype[EE.captureRejectionSymbol] = function (err) {
	  this.destroy(err);
	};

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  return readableAddChunk(this, chunk, encoding, false)
	};

	// Unshift should *always* be something directly out of read().
	Readable.prototype.unshift = function (chunk, encoding) {
	  return readableAddChunk(this, chunk, encoding, true)
	};
	function readableAddChunk(stream, chunk, encoding, addToFront) {
	  debug('readableAddChunk', chunk);
	  const state = stream._readableState;
	  let err;
	  if (!state.objectMode) {
	    if (typeof chunk === 'string') {
	      encoding = encoding || state.defaultEncoding;
	      if (state.encoding !== encoding) {
	        if (addToFront && state.encoding) {
	          // When unshifting, if state.encoding is set, we have to save
	          // the string in the BufferList with the state encoding.
	          chunk = Buffer.from(chunk, encoding).toString(state.encoding);
	        } else {
	          chunk = Buffer.from(chunk, encoding);
	          encoding = '';
	        }
	      }
	    } else if (chunk instanceof Buffer) {
	      encoding = '';
	    } else if (Stream._isUint8Array(chunk)) {
	      chunk = Stream._uint8ArrayToBuffer(chunk);
	      encoding = '';
	    } else if (chunk != null) {
	      err = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
	    }
	  }
	  if (err) {
	    errorOrDestroy(stream, err);
	  } else if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else if (state.objectMode || (chunk && chunk.length > 0)) {
	    if (addToFront) {
	      if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
	      else if (state.destroyed || state.errored) return false
	      else addChunk(stream, state, chunk, true);
	    } else if (state.ended) {
	      errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
	    } else if (state.destroyed || state.errored) {
	      return false
	    } else {
	      state.reading = false;
	      if (state.decoder && !encoding) {
	        chunk = state.decoder.write(chunk);
	        if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
	        else maybeReadMore(stream, state);
	      } else {
	        addChunk(stream, state, chunk, false);
	      }
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	    maybeReadMore(stream, state);
	  }

	  // We can push more data if we are below the highWaterMark.
	  // Also, if we have no data yet, we can stand some more bytes.
	  // This is to work around cases where hwm=0, such as the repl.
	  return !state.ended && (state.length < state.highWaterMark || state.length === 0)
	}
	function addChunk(stream, state, chunk, addToFront) {
	  if (state.flowing && state.length === 0 && !state.sync && stream.listenerCount('data') > 0) {
	    // Use the guard to avoid creating `Set()` repeatedly
	    // when we have multiple pipes.
	    if (state.multiAwaitDrain) {
	      state.awaitDrainWriters.clear();
	    } else {
	      state.awaitDrainWriters = null;
	    }
	    state.dataEmitted = true;
	    stream.emit('data', chunk);
	  } else {
	    // Update the buffer info.
	    state.length += state.objectMode ? 1 : chunk.length;
	    if (addToFront) state.buffer.unshift(chunk);
	    else state.buffer.push(chunk);
	    if (state.needReadable) emitReadable(stream);
	  }
	  maybeReadMore(stream, state);
	}
	Readable.prototype.isPaused = function () {
	  const state = this._readableState;
	  return state[kPaused] === true || state.flowing === false
	};

	// Backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  const decoder = new StringDecoder(enc);
	  this._readableState.decoder = decoder;
	  // If setEncoding(null), decoder.encoding equals utf8.
	  this._readableState.encoding = this._readableState.decoder.encoding;
	  const buffer = this._readableState.buffer;
	  // Iterate over current buffer to convert already stored Buffers:
	  let content = '';
	  for (const data of buffer) {
	    content += decoder.write(data);
	  }
	  buffer.clear();
	  if (content !== '') buffer.push(content);
	  this._readableState.length = content.length;
	  return this
	};

	// Don't raise the hwm > 1GB.
	const MAX_HWM = 0x40000000;
	function computeNewHighWaterMark(n) {
	  if (n > MAX_HWM) {
	    throw new ERR_OUT_OF_RANGE('size', '<= 1GiB', n)
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts.
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || (state.length === 0 && state.ended)) return 0
	  if (state.objectMode) return 1
	  if (NumberIsNaN(n)) {
	    // Only flow one buffer at a time.
	    if (state.flowing && state.length) return state.buffer.first().length
	    return state.length
	  }
	  if (n <= state.length) return n
	  return state.ended ? state.length : 0
	}

	// You can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  // Same as parseInt(undefined, 10), however V8 7.3 performance regressed
	  // in this scenario, so we are doing it manually.
	  if (n === undefined) {
	    n = NaN;
	  } else if (!NumberIsInteger(n)) {
	    n = NumberParseInt(n, 10);
	  }
	  const state = this._readableState;
	  const nOrig = n;

	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n !== 0) state.emittedReadable = false;

	  // If we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (
	    n === 0 &&
	    state.needReadable &&
	    ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)
	  ) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);
	    else emitReadable(this);
	    return null
	  }
	  n = howMuchToRead(n, state);

	  // If we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null
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
	  let doRead = state.needReadable;
	  debug('need readable', doRead);

	  // If we currently have less than the highWaterMark, then also read some.
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // However, if we've ended, then there's no point, if we're already
	  // reading, then it's unnecessary, if we're constructing we have to wait,
	  // and if we're destroyed or errored, then it's not allowed,
	  if (state.ended || state.reading || state.destroyed || state.errored || !state.constructed) {
	    doRead = false;
	    debug('reading, ended or constructing', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // If the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;

	    // Call internal read method
	    try {
	      this._read(state.highWaterMark);
	    } catch (err) {
	      errorOrDestroy(this, err);
	    }
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }
	  let ret;
	  if (n > 0) ret = fromList(n, state);
	  else ret = null;
	  if (ret === null) {
	    state.needReadable = state.length <= state.highWaterMark;
	    n = 0;
	  } else {
	    state.length -= n;
	    if (state.multiAwaitDrain) {
	      state.awaitDrainWriters.clear();
	    } else {
	      state.awaitDrainWriters = null;
	    }
	  }
	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }
	  if (ret !== null && !state.errorEmitted && !state.closeEmitted) {
	    state.dataEmitted = true;
	    this.emit('data', ret);
	  }
	  return ret
	};
	function onEofChunk(stream, state) {
	  debug('onEofChunk');
	  if (state.ended) return
	  if (state.decoder) {
	    const chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;
	  if (state.sync) {
	    // If we are sync, wait until next tick to emit the data.
	    // Otherwise we risk emitting data in the flow()
	    // the readable code triggers during a read() call.
	    emitReadable(stream);
	  } else {
	    // Emit 'readable' now to make sure it gets picked up.
	    state.needReadable = false;
	    state.emittedReadable = true;
	    // We have to emit readable now that we are EOF. Modules
	    // in the ecosystem (e.g. dicer) rely on this event being sync.
	    emitReadable_(stream);
	  }
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  const state = stream._readableState;
	  debug('emitReadable', state.needReadable, state.emittedReadable);
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    process.nextTick(emitReadable_, stream);
	  }
	}
	function emitReadable_(stream) {
	  const state = stream._readableState;
	  debug('emitReadable_', state.destroyed, state.length, state.ended);
	  if (!state.destroyed && !state.errored && (state.length || state.ended)) {
	    stream.emit('readable');
	    state.emittedReadable = false;
	  }

	  // The stream needs another readable event if:
	  // 1. It is not flowing, as the flow mechanism will take
	  //    care of it.
	  // 2. It is not ended.
	  // 3. It is below the highWaterMark, so we can schedule
	  //    another readable later.
	  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
	  flow(stream);
	}

	// At this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore && state.constructed) {
	    state.readingMore = true;
	    process.nextTick(maybeReadMore_, stream, state);
	  }
	}
	function maybeReadMore_(stream, state) {
	  // Attempt to read more data if we should.
	  //
	  // The conditions for reading more data are (one of):
	  // - Not enough data buffered (state.length < state.highWaterMark). The loop
	  //   is responsible for filling the buffer with enough data if such data
	  //   is available. If highWaterMark is 0 and we are not in the flowing mode
	  //   we should _not_ attempt to buffer any extra data. We'll get more data
	  //   when the stream consumer calls read() instead.
	  // - No data in the buffer, and the stream is in flowing mode. In this mode
	  //   the loop below is responsible for ensuring read() is called. Failing to
	  //   call read here would abort the flow and there's no other mechanism for
	  //   continuing the flow if the stream consumer has just subscribed to the
	  //   'data' event.
	  //
	  // In addition to the above conditions to keep reading data, the following
	  // conditions prevent the data from being read:
	  // - The stream has ended (state.ended).
	  // - There is already a pending 'read' operation (state.reading). This is a
	  //   case where the stream has called the implementation defined _read()
	  //   method, but they are processing the call asynchronously and have _not_
	  //   called push() with new data. In this case we skip performing more
	  //   read()s. The execution ends in this method again after the _read() ends
	  //   up calling push() with more data.
	  while (
	    !state.reading &&
	    !state.ended &&
	    (state.length < state.highWaterMark || (state.flowing && state.length === 0))
	  ) {
	    const len = state.length;
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // Didn't get any data, stop spinning.
	      break
	  }
	  state.readingMore = false;
	}

	// Abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  throw new ERR_METHOD_NOT_IMPLEMENTED('_read()')
	};
	Readable.prototype.pipe = function (dest, pipeOpts) {
	  const src = this;
	  const state = this._readableState;
	  if (state.pipes.length === 1) {
	    if (!state.multiAwaitDrain) {
	      state.multiAwaitDrain = true;
	      state.awaitDrainWriters = new SafeSet(state.awaitDrainWriters ? [state.awaitDrainWriters] : []);
	    }
	  }
	  state.pipes.push(dest);
	  debug('pipe count=%d opts=%j', state.pipes.length, pipeOpts);
	  const doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
	  const endFn = doEnd ? onend : unpipe;
	  if (state.endEmitted) process.nextTick(endFn);
	  else src.once('end', endFn);
	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable, unpipeInfo) {
	    debug('onunpipe');
	    if (readable === src) {
	      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
	        unpipeInfo.hasUnpiped = true;
	        cleanup();
	      }
	    }
	  }
	  function onend() {
	    debug('onend');
	    dest.end();
	  }
	  let ondrain;
	  let cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // Cleanup event handlers once the pipe is broken.
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    if (ondrain) {
	      dest.removeListener('drain', ondrain);
	    }
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', unpipe);
	    src.removeListener('data', ondata);
	    cleanedUp = true;

	    // If the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (ondrain && state.awaitDrainWriters && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }
	  function pause() {
	    // If the user unpiped during `dest.write()`, it is possible
	    // to get stuck in a permanently paused state if that write
	    // also returned false.
	    // => Check whether `dest` is still a piping destination.
	    if (!cleanedUp) {
	      if (state.pipes.length === 1 && state.pipes[0] === dest) {
	        debug('false write response, pause', 0);
	        state.awaitDrainWriters = dest;
	        state.multiAwaitDrain = false;
	      } else if (state.pipes.length > 1 && state.pipes.includes(dest)) {
	        debug('false write response, pause', state.awaitDrainWriters.size);
	        state.awaitDrainWriters.add(dest);
	      }
	      src.pause();
	    }
	    if (!ondrain) {
	      // When the dest drains, it reduces the awaitDrain counter
	      // on the source.  This would be more elegant with a .once()
	      // handler in flow(), but adding and removing repeatedly is
	      // too slow.
	      ondrain = pipeOnDrain(src, dest);
	      dest.on('drain', ondrain);
	    }
	  }
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    const ret = dest.write(chunk);
	    debug('dest.write', ret);
	    if (ret === false) {
	      pause();
	    }
	  }

	  // If the dest has an error, then stop piping into it.
	  // However, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (dest.listenerCount('error') === 0) {
	      const s = dest._writableState || dest._readableState;
	      if (s && !s.errorEmitted) {
	        // User incorrectly emitted 'error' directly on the stream.
	        errorOrDestroy(dest, er);
	      } else {
	        dest.emit('error', er);
	      }
	    }
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

	  // Tell the dest that it's being piped to.
	  dest.emit('pipe', src);

	  // Start the flow if it hasn't been started already.

	  if (dest.writableNeedDrain === true) {
	    if (state.flowing) {
	      pause();
	    }
	  } else if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }
	  return dest
	};
	function pipeOnDrain(src, dest) {
	  return function pipeOnDrainFunctionResult() {
	    const state = src._readableState;

	    // `ondrain` will call directly,
	    // `this` maybe not a reference to dest,
	    // so we use the real dest here.
	    if (state.awaitDrainWriters === dest) {
	      debug('pipeOnDrain', 1);
	      state.awaitDrainWriters = null;
	    } else if (state.multiAwaitDrain) {
	      debug('pipeOnDrain', state.awaitDrainWriters.size);
	      state.awaitDrainWriters.delete(dest);
	    }
	    if ((!state.awaitDrainWriters || state.awaitDrainWriters.size === 0) && src.listenerCount('data')) {
	      src.resume();
	    }
	  }
	}
	Readable.prototype.unpipe = function (dest) {
	  const state = this._readableState;
	  const unpipeInfo = {
	    hasUnpiped: false
	  };

	  // If we're not piping anywhere, then do nothing.
	  if (state.pipes.length === 0) return this
	  if (!dest) {
	    // remove all.
	    const dests = state.pipes;
	    state.pipes = [];
	    this.pause();
	    for (let i = 0; i < dests.length; i++)
	      dests[i].emit('unpipe', this, {
	        hasUnpiped: false
	      });
	    return this
	  }

	  // Try to find the right one.
	  const index = ArrayPrototypeIndexOf(state.pipes, dest);
	  if (index === -1) return this
	  state.pipes.splice(index, 1);
	  if (state.pipes.length === 0) this.pause();
	  dest.emit('unpipe', this, unpipeInfo);
	  return this
	};

	// Set up data events if they are asked for
	// Ensure readable listeners eventually get something.
	Readable.prototype.on = function (ev, fn) {
	  const res = Stream.prototype.on.call(this, ev, fn);
	  const state = this._readableState;
	  if (ev === 'data') {
	    // Update readableListening so that resume() may be a no-op
	    // a few lines down. This is needed to support once('readable').
	    state.readableListening = this.listenerCount('readable') > 0;

	    // Try start flowing on next tick if stream isn't explicitly paused.
	    if (state.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.flowing = false;
	      state.emittedReadable = false;
	      debug('on readable', state.length, state.reading);
	      if (state.length) {
	        emitReadable(this);
	      } else if (!state.reading) {
	        process.nextTick(nReadingNextTick, this);
	      }
	    }
	  }
	  return res
	};
	Readable.prototype.addListener = Readable.prototype.on;
	Readable.prototype.removeListener = function (ev, fn) {
	  const res = Stream.prototype.removeListener.call(this, ev, fn);
	  if (ev === 'readable') {
	    // We need to check if there is someone still listening to
	    // readable and reset the state. However this needs to happen
	    // after readable has been emitted but before I/O (nextTick) to
	    // support once('readable', fn) cycles. This means that calling
	    // resume within the same tick will have no
	    // effect.
	    process.nextTick(updateReadableListening, this);
	  }
	  return res
	};
	Readable.prototype.off = Readable.prototype.removeListener;
	Readable.prototype.removeAllListeners = function (ev) {
	  const res = Stream.prototype.removeAllListeners.apply(this, arguments);
	  if (ev === 'readable' || ev === undefined) {
	    // We need to check if there is someone still listening to
	    // readable and reset the state. However this needs to happen
	    // after readable has been emitted but before I/O (nextTick) to
	    // support once('readable', fn) cycles. This means that calling
	    // resume within the same tick will have no
	    // effect.
	    process.nextTick(updateReadableListening, this);
	  }
	  return res
	};
	function updateReadableListening(self) {
	  const state = self._readableState;
	  state.readableListening = self.listenerCount('readable') > 0;
	  if (state.resumeScheduled && state[kPaused] === false) {
	    // Flowing needs to be set to true now, otherwise
	    // the upcoming resume will not flow.
	    state.flowing = true;

	    // Crude way to check if we should resume.
	  } else if (self.listenerCount('data') > 0) {
	    self.resume();
	  } else if (!state.readableListening) {
	    state.flowing = null;
	  }
	}
	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  const state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    // We flow only if there is no one listening
	    // for readable, but we still have to call
	    // resume().
	    state.flowing = !state.readableListening;
	    resume(this, state);
	  }
	  state[kPaused] = false;
	  return this
	};
	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    process.nextTick(resume_, stream, state);
	  }
	}
	function resume_(stream, state) {
	  debug('resume', state.reading);
	  if (!state.reading) {
	    stream.read(0);
	  }
	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}
	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (this._readableState.flowing !== false) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  this._readableState[kPaused] = true;
	  return this
	};
	function flow(stream) {
	  const state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null);
	}

	// Wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  let paused = false;

	  // TODO (ronag): Should this.destroy(err) emit
	  // 'error' on the wrapped stream? Would require
	  // a static factory method, e.g. Readable.wrap(stream).

	  stream.on('data', (chunk) => {
	    if (!this.push(chunk) && stream.pause) {
	      paused = true;
	      stream.pause();
	    }
	  });
	  stream.on('end', () => {
	    this.push(null);
	  });
	  stream.on('error', (err) => {
	    errorOrDestroy(this, err);
	  });
	  stream.on('close', () => {
	    this.destroy();
	  });
	  stream.on('destroy', () => {
	    this.destroy();
	  });
	  this._read = () => {
	    if (paused && stream.resume) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  // Proxy all the other methods. Important when wrapping filters and duplexes.
	  const streamKeys = ObjectKeys(stream);
	  for (let j = 1; j < streamKeys.length; j++) {
	    const i = streamKeys[j];
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = stream[i].bind(stream);
	    }
	  }
	  return this
	};
	Readable.prototype[SymbolAsyncIterator] = function () {
	  return streamToAsyncIterator(this)
	};
	Readable.prototype.iterator = function (options) {
	  if (options !== undefined) {
	    validateObject(options, 'options');
	  }
	  return streamToAsyncIterator(this, options)
	};
	function streamToAsyncIterator(stream, options) {
	  if (typeof stream.read !== 'function') {
	    stream = Readable.wrap(stream, {
	      objectMode: true
	    });
	  }
	  const iter = createAsyncIterator(stream, options);
	  iter.stream = stream;
	  return iter
	}
	async function* createAsyncIterator(stream, options) {
	  let callback = nop;
	  function next(resolve) {
	    if (this === stream) {
	      callback();
	      callback = nop;
	    } else {
	      callback = resolve;
	    }
	  }
	  stream.on('readable', next);
	  let error;
	  const cleanup = eos(
	    stream,
	    {
	      writable: false
	    },
	    (err) => {
	      error = err ? aggregateTwoErrors(error, err) : null;
	      callback();
	      callback = nop;
	    }
	  );
	  try {
	    while (true) {
	      const chunk = stream.destroyed ? null : stream.read();
	      if (chunk !== null) {
	        yield chunk;
	      } else if (error) {
	        throw error
	      } else if (error === null) {
	        return
	      } else {
	        await new Promise(next);
	      }
	    }
	  } catch (err) {
	    error = aggregateTwoErrors(error, err);
	    throw error
	  } finally {
	    if (
	      (error || (options === null || options === undefined ? undefined : options.destroyOnReturn) !== false) &&
	      (error === undefined || stream._readableState.autoDestroy)
	    ) {
	      destroyImpl.destroyer(stream, null);
	    } else {
	      stream.off('readable', next);
	      cleanup();
	    }
	  }
	}

	// Making it explicit these properties are not enumerable
	// because otherwise some prototype manipulation in
	// userland will fail.
	ObjectDefineProperties(Readable.prototype, {
	  readable: {
	    __proto__: null,
	    get() {
	      const r = this._readableState;
	      // r.readable === false means that this is part of a Duplex stream
	      // where the readable side was disabled upon construction.
	      // Compat. The user might manually disable readable side through
	      // deprecated setter.
	      return !!r && r.readable !== false && !r.destroyed && !r.errorEmitted && !r.endEmitted
	    },
	    set(val) {
	      // Backwards compat.
	      if (this._readableState) {
	        this._readableState.readable = !!val;
	      }
	    }
	  },
	  readableDidRead: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return this._readableState.dataEmitted
	    }
	  },
	  readableAborted: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return !!(
	        this._readableState.readable !== false &&
	        (this._readableState.destroyed || this._readableState.errored) &&
	        !this._readableState.endEmitted
	      )
	    }
	  },
	  readableHighWaterMark: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return this._readableState.highWaterMark
	    }
	  },
	  readableBuffer: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return this._readableState && this._readableState.buffer
	    }
	  },
	  readableFlowing: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return this._readableState.flowing
	    },
	    set: function (state) {
	      if (this._readableState) {
	        this._readableState.flowing = state;
	      }
	    }
	  },
	  readableLength: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState.length
	    }
	  },
	  readableObjectMode: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState ? this._readableState.objectMode : false
	    }
	  },
	  readableEncoding: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState ? this._readableState.encoding : null
	    }
	  },
	  errored: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState ? this._readableState.errored : null
	    }
	  },
	  closed: {
	    __proto__: null,
	    get() {
	      return this._readableState ? this._readableState.closed : false
	    }
	  },
	  destroyed: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState ? this._readableState.destroyed : false
	    },
	    set(value) {
	      // We ignore the value if the stream
	      // has not been initialized yet.
	      if (!this._readableState) {
	        return
	      }

	      // Backward compatibility, the user is explicitly
	      // managing destroyed.
	      this._readableState.destroyed = value;
	    }
	  },
	  readableEnded: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._readableState ? this._readableState.endEmitted : false
	    }
	  }
	});
	ObjectDefineProperties(ReadableState.prototype, {
	  // Legacy getter for `pipesCount`.
	  pipesCount: {
	    __proto__: null,
	    get() {
	      return this.pipes.length
	    }
	  },
	  // Legacy property for `paused`.
	  paused: {
	    __proto__: null,
	    get() {
	      return this[kPaused] !== false
	    },
	    set(value) {
	      this[kPaused] = !!value;
	    }
	  }
	});

	// Exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered.
	  if (state.length === 0) return null
	  let ret;
	  if (state.objectMode) ret = state.buffer.shift();
	  else if (!n || n >= state.length) {
	    // Read it all, truncate the list.
	    if (state.decoder) ret = state.buffer.join('');
	    else if (state.buffer.length === 1) ret = state.buffer.first();
	    else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list.
	    ret = state.buffer.consume(n, state.decoder);
	  }
	  return ret
	}
	function endReadable(stream) {
	  const state = stream._readableState;
	  debug('endReadable', state.endEmitted);
	  if (!state.endEmitted) {
	    state.ended = true;
	    process.nextTick(endReadableNT, state, stream);
	  }
	}
	function endReadableNT(state, stream) {
	  debug('endReadableNT', state.endEmitted, state.length);

	  // Check that we didn't get one last unshift.
	  if (!state.errored && !state.closeEmitted && !state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.emit('end');
	    if (stream.writable && stream.allowHalfOpen === false) {
	      process.nextTick(endWritableNT, stream);
	    } else if (state.autoDestroy) {
	      // In case of duplex streams we need a way to detect
	      // if the writable side is ready for autoDestroy as well.
	      const wState = stream._writableState;
	      const autoDestroy =
	        !wState ||
	        (wState.autoDestroy &&
	          // We don't expect the writable to ever 'finish'
	          // if writable is explicitly set to false.
	          (wState.finished || wState.writable === false));
	      if (autoDestroy) {
	        stream.destroy();
	      }
	    }
	  }
	}
	function endWritableNT(stream) {
	  const writable = stream.writable && !stream.writableEnded && !stream.destroyed;
	  if (writable) {
	    stream.end();
	  }
	}
	Readable.from = function (iterable, opts) {
	  return from(Readable, iterable, opts)
	};
	let webStreamsAdapters;

	// Lazy to avoid circular references
	function lazyWebStreams() {
	  if (webStreamsAdapters === undefined) webStreamsAdapters = {};
	  return webStreamsAdapters
	}
	Readable.fromWeb = function (readableStream, options) {
	  return lazyWebStreams().newStreamReadableFromReadableStream(readableStream, options)
	};
	Readable.toWeb = function (streamReadable, options) {
	  return lazyWebStreams().newReadableStreamFromStreamReadable(streamReadable, options)
	};
	Readable.wrap = function (src, options) {
	  var _ref, _src$readableObjectMo;
	  return new Readable({
	    objectMode:
	      (_ref =
	        (_src$readableObjectMo = src.readableObjectMode) !== null && _src$readableObjectMo !== undefined
	          ? _src$readableObjectMo
	          : src.objectMode) !== null && _ref !== undefined
	        ? _ref
	        : true,
	    ...options,
	    destroy(err, callback) {
	      destroyImpl.destroyer(src, err);
	      callback(err);
	    }
	  }).wrap(src)
	};
	return readable;
}

/* replacement start */

var writable;
var hasRequiredWritable;

function requireWritable () {
	if (hasRequiredWritable) return writable;
	hasRequiredWritable = 1;
	const process = browser$2.exports

	/* replacement end */
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	;	const {
	  ArrayPrototypeSlice,
	  Error,
	  FunctionPrototypeSymbolHasInstance,
	  ObjectDefineProperty,
	  ObjectDefineProperties,
	  ObjectSetPrototypeOf,
	  StringPrototypeToLowerCase,
	  Symbol,
	  SymbolHasInstance
	} = primordials;
	writable = Writable;
	Writable.WritableState = WritableState;
	const { EventEmitter: EE } = require$$5;
	const Stream = legacy.Stream;
	const { Buffer } = require$$0$1;
	const destroyImpl = destroy_1;
	const { addAbortSignal: addAbortSignal$1 } = addAbortSignal.exports;
	const { getHighWaterMark, getDefaultHighWaterMark } = state;
	const {
	  ERR_INVALID_ARG_TYPE,
	  ERR_METHOD_NOT_IMPLEMENTED,
	  ERR_MULTIPLE_CALLBACK,
	  ERR_STREAM_CANNOT_PIPE,
	  ERR_STREAM_DESTROYED,
	  ERR_STREAM_ALREADY_FINISHED,
	  ERR_STREAM_NULL_VALUES,
	  ERR_STREAM_WRITE_AFTER_END,
	  ERR_UNKNOWN_ENCODING
	} = errors.codes;
	const { errorOrDestroy } = destroyImpl;
	ObjectSetPrototypeOf(Writable.prototype, Stream.prototype);
	ObjectSetPrototypeOf(Writable, Stream);
	function nop() {}
	const kOnFinished = Symbol('kOnFinished');
	function WritableState(options, stream, isDuplex) {
	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream,
	  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
	  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof requireDuplex();

	  // Object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!(options && options.objectMode);
	  if (isDuplex) this.objectMode = this.objectMode || !!(options && options.writableObjectMode);

	  // The point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write().
	  this.highWaterMark = options
	    ? getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex)
	    : getDefaultHighWaterMark(false);

	  // if _final has been called.
	  this.finalCalled = false;

	  // drain event flag.
	  this.needDrain = false;
	  // At the start of calling end()
	  this.ending = false;
	  // When end() has been called, and returned.
	  this.ended = false;
	  // When 'finish' is emitted.
	  this.finished = false;

	  // Has it been destroyed
	  this.destroyed = false;

	  // Should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  const noDecode = !!(options && options.decodeStrings === false);
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = (options && options.defaultEncoding) || 'utf8';

	  // Not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // A flag to see when we're in the middle of a write.
	  this.writing = false;

	  // When true all writes will be buffered until .uncork() call.
	  this.corked = 0;

	  // A flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // A flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // The callback that's passed to _write(chunk, cb).
	  this.onwrite = onwrite.bind(undefined, stream);

	  // The callback that the user supplies to write(chunk, encoding, cb).
	  this.writecb = null;

	  // The amount that is being written when _write is called.
	  this.writelen = 0;

	  // Storage for data passed to the afterWrite() callback in case of
	  // synchronous _write() completion.
	  this.afterWriteTickInfo = null;
	  resetBuffer(this);

	  // Number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted.
	  this.pendingcb = 0;

	  // Stream is still being constructed and cannot be
	  // destroyed until construction finished or failed.
	  // Async construction is opt in, therefore we start as
	  // constructed.
	  this.constructed = true;

	  // Emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams.
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again.
	  this.errorEmitted = false;

	  // Should close be emitted on destroy. Defaults to true.
	  this.emitClose = !options || options.emitClose !== false;

	  // Should .destroy() be called after 'finish' (and potentially 'end').
	  this.autoDestroy = !options || options.autoDestroy !== false;

	  // Indicates whether the stream has errored. When true all write() calls
	  // should return false. This is needed since when autoDestroy
	  // is disabled we need a way to tell whether the stream has failed.
	  this.errored = null;

	  // Indicates whether the stream has finished destroying.
	  this.closed = false;

	  // True if close has been emitted or would have been emitted
	  // depending on emitClose.
	  this.closeEmitted = false;
	  this[kOnFinished] = [];
	}
	function resetBuffer(state) {
	  state.buffered = [];
	  state.bufferedIndex = 0;
	  state.allBuffers = true;
	  state.allNoop = true;
	}
	WritableState.prototype.getBuffer = function getBuffer() {
	  return ArrayPrototypeSlice(this.buffered, this.bufferedIndex)
	};
	ObjectDefineProperty(WritableState.prototype, 'bufferedRequestCount', {
	  __proto__: null,
	  get() {
	    return this.buffered.length - this.bufferedIndex
	  }
	});
	function Writable(options) {
	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.

	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.

	  // Checking for a Stream.Duplex instance is faster here instead of inside
	  // the WritableState constructor, at least with V8 6.5.
	  const isDuplex = this instanceof requireDuplex();
	  if (!isDuplex && !FunctionPrototypeSymbolHasInstance(Writable, this)) return new Writable(options)
	  this._writableState = new WritableState(options, this, isDuplex);
	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;
	    if (typeof options.writev === 'function') this._writev = options.writev;
	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
	    if (typeof options.final === 'function') this._final = options.final;
	    if (typeof options.construct === 'function') this._construct = options.construct;
	    if (options.signal) addAbortSignal$1(options.signal, this);
	  }
	  Stream.call(this, options);
	  destroyImpl.construct(this, () => {
	    const state = this._writableState;
	    if (!state.writing) {
	      clearBuffer(this, state);
	    }
	    finishMaybe(this, state);
	  });
	}
	ObjectDefineProperty(Writable, SymbolHasInstance, {
	  __proto__: null,
	  value: function (object) {
	    if (FunctionPrototypeSymbolHasInstance(this, object)) return true
	    if (this !== Writable) return false
	    return object && object._writableState instanceof WritableState
	  }
	});

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
	};
	function _write(stream, chunk, encoding, cb) {
	  const state = stream._writableState;
	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = state.defaultEncoding;
	  } else {
	    if (!encoding) encoding = state.defaultEncoding;
	    else if (encoding !== 'buffer' && !Buffer.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding)
	    if (typeof cb !== 'function') cb = nop;
	  }
	  if (chunk === null) {
	    throw new ERR_STREAM_NULL_VALUES()
	  } else if (!state.objectMode) {
	    if (typeof chunk === 'string') {
	      if (state.decodeStrings !== false) {
	        chunk = Buffer.from(chunk, encoding);
	        encoding = 'buffer';
	      }
	    } else if (chunk instanceof Buffer) {
	      encoding = 'buffer';
	    } else if (Stream._isUint8Array(chunk)) {
	      chunk = Stream._uint8ArrayToBuffer(chunk);
	      encoding = 'buffer';
	    } else {
	      throw new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk)
	    }
	  }
	  let err;
	  if (state.ending) {
	    err = new ERR_STREAM_WRITE_AFTER_END();
	  } else if (state.destroyed) {
	    err = new ERR_STREAM_DESTROYED('write');
	  }
	  if (err) {
	    process.nextTick(cb, err);
	    errorOrDestroy(stream, err, true);
	    return err
	  }
	  state.pendingcb++;
	  return writeOrBuffer(stream, state, chunk, encoding, cb)
	}
	Writable.prototype.write = function (chunk, encoding, cb) {
	  return _write(this, chunk, encoding, cb) === true
	};
	Writable.prototype.cork = function () {
	  this._writableState.corked++;
	};
	Writable.prototype.uncork = function () {
	  const state = this._writableState;
	  if (state.corked) {
	    state.corked--;
	    if (!state.writing) clearBuffer(this, state);
	  }
	};
	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = StringPrototypeToLowerCase(encoding);
	  if (!Buffer.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding)
	  this._writableState.defaultEncoding = encoding;
	  return this
	};

	// If we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, callback) {
	  const len = state.objectMode ? 1 : chunk.length;
	  state.length += len;

	  // stream._write resets state.length
	  const ret = state.length < state.highWaterMark;
	  // We must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;
	  if (state.writing || state.corked || state.errored || !state.constructed) {
	    state.buffered.push({
	      chunk,
	      encoding,
	      callback
	    });
	    if (state.allBuffers && encoding !== 'buffer') {
	      state.allBuffers = false;
	    }
	    if (state.allNoop && callback !== nop) {
	      state.allNoop = false;
	    }
	  } else {
	    state.writelen = len;
	    state.writecb = callback;
	    state.writing = true;
	    state.sync = true;
	    stream._write(chunk, encoding, state.onwrite);
	    state.sync = false;
	  }

	  // Return false if errored or destroyed in order to break
	  // any synchronous while(stream.write(data)) loops.
	  return ret && !state.errored && !state.destroyed
	}
	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));
	  else if (writev) stream._writev(chunk, state.onwrite);
	  else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}
	function onwriteError(stream, state, er, cb) {
	  --state.pendingcb;
	  cb(er);
	  // Ensure callbacks are invoked even when autoDestroy is
	  // not enabled. Passing `er` here doesn't make sense since
	  // it's related to one specific write, not to the buffered
	  // writes.
	  errorBuffer(state);
	  // This can emit error, but error must always follow cb.
	  errorOrDestroy(stream, er);
	}
	function onwrite(stream, er) {
	  const state = stream._writableState;
	  const sync = state.sync;
	  const cb = state.writecb;
	  if (typeof cb !== 'function') {
	    errorOrDestroy(stream, new ERR_MULTIPLE_CALLBACK());
	    return
	  }
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	  if (er) {
	    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
	    er.stack; // eslint-disable-line no-unused-expressions

	    if (!state.errored) {
	      state.errored = er;
	    }

	    // In case of duplex streams we need to notify the readable side of the
	    // error.
	    if (stream._readableState && !stream._readableState.errored) {
	      stream._readableState.errored = er;
	    }
	    if (sync) {
	      process.nextTick(onwriteError, stream, state, er, cb);
	    } else {
	      onwriteError(stream, state, er, cb);
	    }
	  } else {
	    if (state.buffered.length > state.bufferedIndex) {
	      clearBuffer(stream, state);
	    }
	    if (sync) {
	      // It is a common case that the callback passed to .write() is always
	      // the same. In that case, we do not schedule a new nextTick(), but
	      // rather just increase a counter, to improve performance and avoid
	      // memory allocations.
	      if (state.afterWriteTickInfo !== null && state.afterWriteTickInfo.cb === cb) {
	        state.afterWriteTickInfo.count++;
	      } else {
	        state.afterWriteTickInfo = {
	          count: 1,
	          cb,
	          stream,
	          state
	        };
	        process.nextTick(afterWriteTick, state.afterWriteTickInfo);
	      }
	    } else {
	      afterWrite(stream, state, 1, cb);
	    }
	  }
	}
	function afterWriteTick({ stream, state, count, cb }) {
	  state.afterWriteTickInfo = null;
	  return afterWrite(stream, state, count, cb)
	}
	function afterWrite(stream, state, count, cb) {
	  const needDrain = !state.ending && !stream.destroyed && state.length === 0 && state.needDrain;
	  if (needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	  while (count-- > 0) {
	    state.pendingcb--;
	    cb();
	  }
	  if (state.destroyed) {
	    errorBuffer(state);
	  }
	  finishMaybe(stream, state);
	}

	// If there's something in the buffer waiting, then invoke callbacks.
	function errorBuffer(state) {
	  if (state.writing) {
	    return
	  }
	  for (let n = state.bufferedIndex; n < state.buffered.length; ++n) {
	    var _state$errored;
	    const { chunk, callback } = state.buffered[n];
	    const len = state.objectMode ? 1 : chunk.length;
	    state.length -= len;
	    callback(
	      (_state$errored = state.errored) !== null && _state$errored !== undefined
	        ? _state$errored
	        : new ERR_STREAM_DESTROYED('write')
	    );
	  }
	  const onfinishCallbacks = state[kOnFinished].splice(0);
	  for (let i = 0; i < onfinishCallbacks.length; i++) {
	    var _state$errored2;
	    onfinishCallbacks[i](
	      (_state$errored2 = state.errored) !== null && _state$errored2 !== undefined
	        ? _state$errored2
	        : new ERR_STREAM_DESTROYED('end')
	    );
	  }
	  resetBuffer(state);
	}

	// If there's something in the buffer waiting, then process it.
	function clearBuffer(stream, state) {
	  if (state.corked || state.bufferProcessing || state.destroyed || !state.constructed) {
	    return
	  }
	  const { buffered, bufferedIndex, objectMode } = state;
	  const bufferedLength = buffered.length - bufferedIndex;
	  if (!bufferedLength) {
	    return
	  }
	  let i = bufferedIndex;
	  state.bufferProcessing = true;
	  if (bufferedLength > 1 && stream._writev) {
	    state.pendingcb -= bufferedLength - 1;
	    const callback = state.allNoop
	      ? nop
	      : (err) => {
	          for (let n = i; n < buffered.length; ++n) {
	            buffered[n].callback(err);
	          }
	        };
	    // Make a copy of `buffered` if it's going to be used by `callback` above,
	    // since `doWrite` will mutate the array.
	    const chunks = state.allNoop && i === 0 ? buffered : ArrayPrototypeSlice(buffered, i);
	    chunks.allBuffers = state.allBuffers;
	    doWrite(stream, state, true, state.length, chunks, '', callback);
	    resetBuffer(state);
	  } else {
	    do {
	      const { chunk, encoding, callback } = buffered[i];
	      buffered[i++] = null;
	      const len = objectMode ? 1 : chunk.length;
	      doWrite(stream, state, false, len, chunk, encoding, callback);
	    } while (i < buffered.length && !state.writing)
	    if (i === buffered.length) {
	      resetBuffer(state);
	    } else if (i > 256) {
	      buffered.splice(0, i);
	      state.bufferedIndex = 0;
	    } else {
	      state.bufferedIndex = i;
	    }
	  }
	  state.bufferProcessing = false;
	}
	Writable.prototype._write = function (chunk, encoding, cb) {
	  if (this._writev) {
	    this._writev(
	      [
	        {
	          chunk,
	          encoding
	        }
	      ],
	      cb
	    );
	  } else {
	    throw new ERR_METHOD_NOT_IMPLEMENTED('_write()')
	  }
	};
	Writable.prototype._writev = null;
	Writable.prototype.end = function (chunk, encoding, cb) {
	  const state = this._writableState;
	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }
	  let err;
	  if (chunk !== null && chunk !== undefined) {
	    const ret = _write(this, chunk, encoding);
	    if (ret instanceof Error) {
	      err = ret;
	    }
	  }

	  // .end() fully uncorks.
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }
	  if (err) ; else if (!state.errored && !state.ending) {
	    // This is forgiving in terms of unnecessary calls to end() and can hide
	    // logic errors. However, usually such errors are harmless and causing a
	    // hard error can be disproportionately destructive. It is not always
	    // trivial for the user to determine whether end() needs to be called
	    // or not.

	    state.ending = true;
	    finishMaybe(this, state, true);
	    state.ended = true;
	  } else if (state.finished) {
	    err = new ERR_STREAM_ALREADY_FINISHED('end');
	  } else if (state.destroyed) {
	    err = new ERR_STREAM_DESTROYED('end');
	  }
	  if (typeof cb === 'function') {
	    if (err || state.finished) {
	      process.nextTick(cb, err);
	    } else {
	      state[kOnFinished].push(cb);
	    }
	  }
	  return this
	};
	function needFinish(state) {
	  return (
	    state.ending &&
	    !state.destroyed &&
	    state.constructed &&
	    state.length === 0 &&
	    !state.errored &&
	    state.buffered.length === 0 &&
	    !state.finished &&
	    !state.writing &&
	    !state.errorEmitted &&
	    !state.closeEmitted
	  )
	}
	function callFinal(stream, state) {
	  let called = false;
	  function onFinish(err) {
	    if (called) {
	      errorOrDestroy(stream, err !== null && err !== undefined ? err : ERR_MULTIPLE_CALLBACK());
	      return
	    }
	    called = true;
	    state.pendingcb--;
	    if (err) {
	      const onfinishCallbacks = state[kOnFinished].splice(0);
	      for (let i = 0; i < onfinishCallbacks.length; i++) {
	        onfinishCallbacks[i](err);
	      }
	      errorOrDestroy(stream, err, state.sync);
	    } else if (needFinish(state)) {
	      state.prefinished = true;
	      stream.emit('prefinish');
	      // Backwards compat. Don't check state.sync here.
	      // Some streams assume 'finish' will be emitted
	      // asynchronously relative to _final callback.
	      state.pendingcb++;
	      process.nextTick(finish, stream, state);
	    }
	  }
	  state.sync = true;
	  state.pendingcb++;
	  try {
	    stream._final(onFinish);
	  } catch (err) {
	    onFinish(err);
	  }
	  state.sync = false;
	}
	function prefinish(stream, state) {
	  if (!state.prefinished && !state.finalCalled) {
	    if (typeof stream._final === 'function' && !state.destroyed) {
	      state.finalCalled = true;
	      callFinal(stream, state);
	    } else {
	      state.prefinished = true;
	      stream.emit('prefinish');
	    }
	  }
	}
	function finishMaybe(stream, state, sync) {
	  if (needFinish(state)) {
	    prefinish(stream, state);
	    if (state.pendingcb === 0) {
	      if (sync) {
	        state.pendingcb++;
	        process.nextTick(
	          (stream, state) => {
	            if (needFinish(state)) {
	              finish(stream, state);
	            } else {
	              state.pendingcb--;
	            }
	          },
	          stream,
	          state
	        );
	      } else if (needFinish(state)) {
	        state.pendingcb++;
	        finish(stream, state);
	      }
	    }
	  }
	}
	function finish(stream, state) {
	  state.pendingcb--;
	  state.finished = true;
	  const onfinishCallbacks = state[kOnFinished].splice(0);
	  for (let i = 0; i < onfinishCallbacks.length; i++) {
	    onfinishCallbacks[i]();
	  }
	  stream.emit('finish');
	  if (state.autoDestroy) {
	    // In case of duplex streams we need a way to detect
	    // if the readable side is ready for autoDestroy as well.
	    const rState = stream._readableState;
	    const autoDestroy =
	      !rState ||
	      (rState.autoDestroy &&
	        // We don't expect the readable to ever 'end'
	        // if readable is explicitly set to false.
	        (rState.endEmitted || rState.readable === false));
	    if (autoDestroy) {
	      stream.destroy();
	    }
	  }
	}
	ObjectDefineProperties(Writable.prototype, {
	  closed: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.closed : false
	    }
	  },
	  destroyed: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.destroyed : false
	    },
	    set(value) {
	      // Backward compatibility, the user is explicitly managing destroyed.
	      if (this._writableState) {
	        this._writableState.destroyed = value;
	      }
	    }
	  },
	  writable: {
	    __proto__: null,
	    get() {
	      const w = this._writableState;
	      // w.writable === false means that this is part of a Duplex stream
	      // where the writable side was disabled upon construction.
	      // Compat. The user might manually disable writable side through
	      // deprecated setter.
	      return !!w && w.writable !== false && !w.destroyed && !w.errored && !w.ending && !w.ended
	    },
	    set(val) {
	      // Backwards compatible.
	      if (this._writableState) {
	        this._writableState.writable = !!val;
	      }
	    }
	  },
	  writableFinished: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.finished : false
	    }
	  },
	  writableObjectMode: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.objectMode : false
	    }
	  },
	  writableBuffer: {
	    __proto__: null,
	    get() {
	      return this._writableState && this._writableState.getBuffer()
	    }
	  },
	  writableEnded: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.ending : false
	    }
	  },
	  writableNeedDrain: {
	    __proto__: null,
	    get() {
	      const wState = this._writableState;
	      if (!wState) return false
	      return !wState.destroyed && !wState.ending && wState.needDrain
	    }
	  },
	  writableHighWaterMark: {
	    __proto__: null,
	    get() {
	      return this._writableState && this._writableState.highWaterMark
	    }
	  },
	  writableCorked: {
	    __proto__: null,
	    get() {
	      return this._writableState ? this._writableState.corked : 0
	    }
	  },
	  writableLength: {
	    __proto__: null,
	    get() {
	      return this._writableState && this._writableState.length
	    }
	  },
	  errored: {
	    __proto__: null,
	    enumerable: false,
	    get() {
	      return this._writableState ? this._writableState.errored : null
	    }
	  },
	  writableAborted: {
	    __proto__: null,
	    enumerable: false,
	    get: function () {
	      return !!(
	        this._writableState.writable !== false &&
	        (this._writableState.destroyed || this._writableState.errored) &&
	        !this._writableState.finished
	      )
	    }
	  }
	});
	const destroy = destroyImpl.destroy;
	Writable.prototype.destroy = function (err, cb) {
	  const state = this._writableState;

	  // Invoke pending callbacks.
	  if (!state.destroyed && (state.bufferedIndex < state.buffered.length || state[kOnFinished].length)) {
	    process.nextTick(errorBuffer, state);
	  }
	  destroy.call(this, err, cb);
	  return this
	};
	Writable.prototype._undestroy = destroyImpl.undestroy;
	Writable.prototype._destroy = function (err, cb) {
	  cb(err);
	};
	Writable.prototype[EE.captureRejectionSymbol] = function (err) {
	  this.destroy(err);
	};
	let webStreamsAdapters;

	// Lazy to avoid circular references
	function lazyWebStreams() {
	  if (webStreamsAdapters === undefined) webStreamsAdapters = {};
	  return webStreamsAdapters
	}
	Writable.fromWeb = function (writableStream, options) {
	  return lazyWebStreams().newStreamWritableFromWritableStream(writableStream, options)
	};
	Writable.toWeb = function (streamWritable) {
	  return lazyWebStreams().newWritableStreamFromStreamWritable(streamWritable)
	};
	return writable;
}

/* replacement start */

var duplexify;
var hasRequiredDuplexify;

function requireDuplexify () {
	if (hasRequiredDuplexify) return duplexify;
	hasRequiredDuplexify = 1;
	const process = browser$2.exports

	/* replacement end */

	;	const bufferModule = require$$0$1;
	const {
	  isReadable,
	  isWritable,
	  isIterable,
	  isNodeStream,
	  isReadableNodeStream,
	  isWritableNodeStream,
	  isDuplexNodeStream
	} = utils;
	const eos = endOfStream.exports;
	const {
	  AbortError,
	  codes: { ERR_INVALID_ARG_TYPE, ERR_INVALID_RETURN_VALUE }
	} = errors;
	const { destroyer } = destroy_1;
	const Duplex = requireDuplex();
	const Readable = requireReadable();
	const { createDeferredPromise } = util$4.exports;
	const from = from_1;
	const Blob = globalThis.Blob || bufferModule.Blob;
	const isBlob =
	  typeof Blob !== 'undefined'
	    ? function isBlob(b) {
	        return b instanceof Blob
	      }
	    : function isBlob(b) {
	        return false
	      };
	const AbortController = globalThis.AbortController || requireBrowser().AbortController;
	const { FunctionPrototypeCall } = primordials;

	// This is needed for pre node 17.
	class Duplexify extends Duplex {
	  constructor(options) {
	    super(options);

	    // https://github.com/nodejs/node/pull/34385

	    if ((options === null || options === undefined ? undefined : options.readable) === false) {
	      this._readableState.readable = false;
	      this._readableState.ended = true;
	      this._readableState.endEmitted = true;
	    }
	    if ((options === null || options === undefined ? undefined : options.writable) === false) {
	      this._writableState.writable = false;
	      this._writableState.ending = true;
	      this._writableState.ended = true;
	      this._writableState.finished = true;
	    }
	  }
	}
	duplexify = function duplexify(body, name) {
	  if (isDuplexNodeStream(body)) {
	    return body
	  }
	  if (isReadableNodeStream(body)) {
	    return _duplexify({
	      readable: body
	    })
	  }
	  if (isWritableNodeStream(body)) {
	    return _duplexify({
	      writable: body
	    })
	  }
	  if (isNodeStream(body)) {
	    return _duplexify({
	      writable: false,
	      readable: false
	    })
	  }

	  // TODO: Webstreams
	  // if (isReadableStream(body)) {
	  //   return _duplexify({ readable: Readable.fromWeb(body) });
	  // }

	  // TODO: Webstreams
	  // if (isWritableStream(body)) {
	  //   return _duplexify({ writable: Writable.fromWeb(body) });
	  // }

	  if (typeof body === 'function') {
	    const { value, write, final, destroy } = fromAsyncGen(body);
	    if (isIterable(value)) {
	      return from(Duplexify, value, {
	        // TODO (ronag): highWaterMark?
	        objectMode: true,
	        write,
	        final,
	        destroy
	      })
	    }
	    const then = value === null || value === undefined ? undefined : value.then;
	    if (typeof then === 'function') {
	      let d;
	      const promise = FunctionPrototypeCall(
	        then,
	        value,
	        (val) => {
	          if (val != null) {
	            throw new ERR_INVALID_RETURN_VALUE('nully', 'body', val)
	          }
	        },
	        (err) => {
	          destroyer(d, err);
	        }
	      );
	      return (d = new Duplexify({
	        // TODO (ronag): highWaterMark?
	        objectMode: true,
	        readable: false,
	        write,
	        final(cb) {
	          final(async () => {
	            try {
	              await promise;
	              process.nextTick(cb, null);
	            } catch (err) {
	              process.nextTick(cb, err);
	            }
	          });
	        },
	        destroy
	      }))
	    }
	    throw new ERR_INVALID_RETURN_VALUE('Iterable, AsyncIterable or AsyncFunction', name, value)
	  }
	  if (isBlob(body)) {
	    return duplexify(body.arrayBuffer())
	  }
	  if (isIterable(body)) {
	    return from(Duplexify, body, {
	      // TODO (ronag): highWaterMark?
	      objectMode: true,
	      writable: false
	    })
	  }

	  // TODO: Webstreams.
	  // if (
	  //   isReadableStream(body?.readable) &&
	  //   isWritableStream(body?.writable)
	  // ) {
	  //   return Duplexify.fromWeb(body);
	  // }

	  if (
	    typeof (body === null || body === undefined ? undefined : body.writable) === 'object' ||
	    typeof (body === null || body === undefined ? undefined : body.readable) === 'object'
	  ) {
	    const readable =
	      body !== null && body !== undefined && body.readable
	        ? isReadableNodeStream(body === null || body === undefined ? undefined : body.readable)
	          ? body === null || body === undefined
	            ? undefined
	            : body.readable
	          : duplexify(body.readable)
	        : undefined;
	    const writable =
	      body !== null && body !== undefined && body.writable
	        ? isWritableNodeStream(body === null || body === undefined ? undefined : body.writable)
	          ? body === null || body === undefined
	            ? undefined
	            : body.writable
	          : duplexify(body.writable)
	        : undefined;
	    return _duplexify({
	      readable,
	      writable
	    })
	  }
	  const then = body === null || body === undefined ? undefined : body.then;
	  if (typeof then === 'function') {
	    let d;
	    FunctionPrototypeCall(
	      then,
	      body,
	      (val) => {
	        if (val != null) {
	          d.push(val);
	        }
	        d.push(null);
	      },
	      (err) => {
	        destroyer(d, err);
	      }
	    );
	    return (d = new Duplexify({
	      objectMode: true,
	      writable: false,
	      read() {}
	    }))
	  }
	  throw new ERR_INVALID_ARG_TYPE(
	    name,
	    [
	      'Blob',
	      'ReadableStream',
	      'WritableStream',
	      'Stream',
	      'Iterable',
	      'AsyncIterable',
	      'Function',
	      '{ readable, writable } pair',
	      'Promise'
	    ],
	    body
	  )
	};
	function fromAsyncGen(fn) {
	  let { promise, resolve } = createDeferredPromise();
	  const ac = new AbortController();
	  const signal = ac.signal;
	  const value = fn(
	    (async function* () {
	      while (true) {
	        const _promise = promise;
	        promise = null;
	        const { chunk, done, cb } = await _promise;
	        process.nextTick(cb);
	        if (done) return
	        if (signal.aborted)
	          throw new AbortError(undefined, {
	            cause: signal.reason
	          })
	        ;({ promise, resolve } = createDeferredPromise());
	        yield chunk;
	      }
	    })(),
	    {
	      signal
	    }
	  );
	  return {
	    value,
	    write(chunk, encoding, cb) {
	      const _resolve = resolve;
	      resolve = null;
	      _resolve({
	        chunk,
	        done: false,
	        cb
	      });
	    },
	    final(cb) {
	      const _resolve = resolve;
	      resolve = null;
	      _resolve({
	        done: true,
	        cb
	      });
	    },
	    destroy(err, cb) {
	      ac.abort();
	      cb(err);
	    }
	  }
	}
	function _duplexify(pair) {
	  const r = pair.readable && typeof pair.readable.read !== 'function' ? Readable.wrap(pair.readable) : pair.readable;
	  const w = pair.writable;
	  let readable = !!isReadable(r);
	  let writable = !!isWritable(w);
	  let ondrain;
	  let onfinish;
	  let onreadable;
	  let onclose;
	  let d;
	  function onfinished(err) {
	    const cb = onclose;
	    onclose = null;
	    if (cb) {
	      cb(err);
	    } else if (err) {
	      d.destroy(err);
	    }
	  }

	  // TODO(ronag): Avoid double buffering.
	  // Implement Writable/Readable/Duplex traits.
	  // See, https://github.com/nodejs/node/pull/33515.
	  d = new Duplexify({
	    // TODO (ronag): highWaterMark?
	    readableObjectMode: !!(r !== null && r !== undefined && r.readableObjectMode),
	    writableObjectMode: !!(w !== null && w !== undefined && w.writableObjectMode),
	    readable,
	    writable
	  });
	  if (writable) {
	    eos(w, (err) => {
	      writable = false;
	      if (err) {
	        destroyer(r, err);
	      }
	      onfinished(err);
	    });
	    d._write = function (chunk, encoding, callback) {
	      if (w.write(chunk, encoding)) {
	        callback();
	      } else {
	        ondrain = callback;
	      }
	    };
	    d._final = function (callback) {
	      w.end();
	      onfinish = callback;
	    };
	    w.on('drain', function () {
	      if (ondrain) {
	        const cb = ondrain;
	        ondrain = null;
	        cb();
	      }
	    });
	    w.on('finish', function () {
	      if (onfinish) {
	        const cb = onfinish;
	        onfinish = null;
	        cb();
	      }
	    });
	  }
	  if (readable) {
	    eos(r, (err) => {
	      readable = false;
	      if (err) {
	        destroyer(r, err);
	      }
	      onfinished(err);
	    });
	    r.on('readable', function () {
	      if (onreadable) {
	        const cb = onreadable;
	        onreadable = null;
	        cb();
	      }
	    });
	    r.on('end', function () {
	      d.push(null);
	    });
	    d._read = function () {
	      while (true) {
	        const buf = r.read();
	        if (buf === null) {
	          onreadable = d._read;
	          return
	        }
	        if (!d.push(buf)) {
	          return
	        }
	      }
	    };
	  }
	  d._destroy = function (err, callback) {
	    if (!err && onclose !== null) {
	      err = new AbortError();
	    }
	    onreadable = null;
	    ondrain = null;
	    onfinish = null;
	    if (onclose === null) {
	      callback(err);
	    } else {
	      onclose = callback;
	      destroyer(w, err);
	      destroyer(r, err);
	    }
	  };
	  return d
	}
	return duplexify;
}

var duplex;
var hasRequiredDuplex;

function requireDuplex () {
	if (hasRequiredDuplex) return duplex;
	hasRequiredDuplex = 1;

	const {
	  ObjectDefineProperties,
	  ObjectGetOwnPropertyDescriptor,
	  ObjectKeys,
	  ObjectSetPrototypeOf
	} = primordials;
	duplex = Duplex;
	const Readable = requireReadable();
	const Writable = requireWritable();
	ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
	ObjectSetPrototypeOf(Duplex, Readable);
	{
	  const keys = ObjectKeys(Writable.prototype);
	  // Allow the keys array to be GC'ed.
	  for (let i = 0; i < keys.length; i++) {
	    const method = keys[i];
	    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	  }
	}
	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options)
	  Readable.call(this, options);
	  Writable.call(this, options);
	  if (options) {
	    this.allowHalfOpen = options.allowHalfOpen !== false;
	    if (options.readable === false) {
	      this._readableState.readable = false;
	      this._readableState.ended = true;
	      this._readableState.endEmitted = true;
	    }
	    if (options.writable === false) {
	      this._writableState.writable = false;
	      this._writableState.ending = true;
	      this._writableState.ended = true;
	      this._writableState.finished = true;
	    }
	  } else {
	    this.allowHalfOpen = true;
	  }
	}
	ObjectDefineProperties(Duplex.prototype, {
	  writable: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writable')
	  },
	  writableHighWaterMark: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableHighWaterMark')
	  },
	  writableObjectMode: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableObjectMode')
	  },
	  writableBuffer: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableBuffer')
	  },
	  writableLength: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableLength')
	  },
	  writableFinished: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableFinished')
	  },
	  writableCorked: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableCorked')
	  },
	  writableEnded: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableEnded')
	  },
	  writableNeedDrain: {
	    __proto__: null,
	    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableNeedDrain')
	  },
	  destroyed: {
	    __proto__: null,
	    get() {
	      if (this._readableState === undefined || this._writableState === undefined) {
	        return false
	      }
	      return this._readableState.destroyed && this._writableState.destroyed
	    },
	    set(value) {
	      // Backward compatibility, the user is explicitly
	      // managing destroyed.
	      if (this._readableState && this._writableState) {
	        this._readableState.destroyed = value;
	        this._writableState.destroyed = value;
	      }
	    }
	  }
	});
	let webStreamsAdapters;

	// Lazy to avoid circular references
	function lazyWebStreams() {
	  if (webStreamsAdapters === undefined) webStreamsAdapters = {};
	  return webStreamsAdapters
	}
	Duplex.fromWeb = function (pair, options) {
	  return lazyWebStreams().newStreamDuplexFromReadableWritablePair(pair, options)
	};
	Duplex.toWeb = function (duplex) {
	  return lazyWebStreams().newReadableWritablePairFromDuplex(duplex)
	};
	let duplexify;
	Duplex.from = function (body) {
	  if (!duplexify) {
	    duplexify = requireDuplexify();
	  }
	  return duplexify(body, 'body')
	};
	return duplex;
}

const { ObjectSetPrototypeOf: ObjectSetPrototypeOf$1, Symbol: Symbol$2 } = primordials;
var transform = Transform$2;
const { ERR_METHOD_NOT_IMPLEMENTED } = errors.codes;
const Duplex$2 = requireDuplex();
const { getHighWaterMark } = state;
ObjectSetPrototypeOf$1(Transform$2.prototype, Duplex$2.prototype);
ObjectSetPrototypeOf$1(Transform$2, Duplex$2);
const kCallback = Symbol$2('kCallback');
function Transform$2(options) {
  if (!(this instanceof Transform$2)) return new Transform$2(options)

  // TODO (ronag): This should preferably always be
  // applied but would be semver-major. Or even better;
  // make Transform a Readable with the Writable interface.
  const readableHighWaterMark = options ? getHighWaterMark(this, options, 'readableHighWaterMark', true) : null;
  if (readableHighWaterMark === 0) {
    // A Duplex will buffer both on the writable and readable side while
    // a Transform just wants to buffer hwm number of elements. To avoid
    // buffering twice we disable buffering on the writable side.
    options = {
      ...options,
      highWaterMark: null,
      readableHighWaterMark,
      // TODO (ronag): 0 is not optimal since we have
      // a "bug" where we check needDrain before calling _write and not after.
      // Refs: https://github.com/nodejs/node/pull/32887
      // Refs: https://github.com/nodejs/node/pull/35941
      writableHighWaterMark: options.writableHighWaterMark || 0
    };
  }
  Duplex$2.call(this, options);

  // We have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;
  this[kCallback] = null;
  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  // Backwards compat. Some Transform streams incorrectly implement _final
  // instead of or in addition to _flush. By using 'prefinish' instead of
  // implementing _final we continue supporting this unfortunate use case.
  this.on('prefinish', prefinish);
}
function final(cb) {
  if (typeof this._flush === 'function' && !this.destroyed) {
    this._flush((er, data) => {
      if (er) {
        if (cb) {
          cb(er);
        } else {
          this.destroy(er);
        }
        return
      }
      if (data != null) {
        this.push(data);
      }
      this.push(null);
      if (cb) {
        cb();
      }
    });
  } else {
    this.push(null);
    if (cb) {
      cb();
    }
  }
}
function prefinish() {
  if (this._final !== final) {
    final.call(this);
  }
}
Transform$2.prototype._final = final;
Transform$2.prototype._transform = function (chunk, encoding, callback) {
  throw new ERR_METHOD_NOT_IMPLEMENTED('_transform()')
};
Transform$2.prototype._write = function (chunk, encoding, callback) {
  const rState = this._readableState;
  const wState = this._writableState;
  const length = rState.length;
  this._transform(chunk, encoding, (err, val) => {
    if (err) {
      callback(err);
      return
    }
    if (val != null) {
      this.push(val);
    }
    if (
      wState.ended ||
      // Backwards compat.
      length === rState.length ||
      // Backwards compat.
      rState.length < rState.highWaterMark
    ) {
      callback();
    } else {
      this[kCallback] = callback;
    }
  });
};
Transform$2.prototype._read = function () {
  if (this[kCallback]) {
    const callback = this[kCallback];
    this[kCallback] = null;
    callback();
  }
};

const { ObjectSetPrototypeOf } = primordials;
var passthrough = PassThrough$3;
const Transform$1 = transform;
ObjectSetPrototypeOf(PassThrough$3.prototype, Transform$1.prototype);
ObjectSetPrototypeOf(PassThrough$3, Transform$1);
function PassThrough$3(options) {
  if (!(this instanceof PassThrough$3)) return new PassThrough$3(options)
  Transform$1.call(this, options);
}
PassThrough$3.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/* replacement start */

const process$1 = browser$2.exports

/* replacement end */
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).

;const { ArrayIsArray, Promise: Promise$2, SymbolAsyncIterator } = primordials;
const eos$1 = endOfStream.exports;
const { once: once$1 } = util$4.exports;
const destroyImpl = destroy_1;
const Duplex$1 = requireDuplex();
const {
  aggregateTwoErrors,
  codes: {
    ERR_INVALID_ARG_TYPE: ERR_INVALID_ARG_TYPE$1,
    ERR_INVALID_RETURN_VALUE,
    ERR_MISSING_ARGS: ERR_MISSING_ARGS$2,
    ERR_STREAM_DESTROYED,
    ERR_STREAM_PREMATURE_CLOSE
  },
  AbortError: AbortError$2
} = errors;
const { validateFunction, validateAbortSignal: validateAbortSignal$1 } = validators;
const {
  isIterable,
  isReadable: isReadable$1,
  isReadableNodeStream,
  isNodeStream: isNodeStream$2,
  isTransformStream: isTransformStream$1,
  isWebStream: isWebStream$1,
  isReadableStream: isReadableStream$1,
  isReadableEnded
} = utils;
const AbortController$1 = globalThis.AbortController || requireBrowser().AbortController;
let PassThrough$2;
let Readable$1;
function destroyer$1(stream, reading, writing) {
  let finished = false;
  stream.on('close', () => {
    finished = true;
  });
  const cleanup = eos$1(
    stream,
    {
      readable: reading,
      writable: writing
    },
    (err) => {
      finished = !err;
    }
  );
  return {
    destroy: (err) => {
      if (finished) return
      finished = true;
      destroyImpl.destroyer(stream, err || new ERR_STREAM_DESTROYED('pipe'));
    },
    cleanup
  }
}
function popCallback(streams) {
  // Streams should never be an empty array. It should always contain at least
  // a single stream. Therefore optimize for the average case instead of
  // checking for length === 0 as well.
  validateFunction(streams[streams.length - 1], 'streams[stream.length - 1]');
  return streams.pop()
}
function makeAsyncIterable(val) {
  if (isIterable(val)) {
    return val
  } else if (isReadableNodeStream(val)) {
    // Legacy streams are not Iterable.
    return fromReadable(val)
  }
  throw new ERR_INVALID_ARG_TYPE$1('val', ['Readable', 'Iterable', 'AsyncIterable'], val)
}
async function* fromReadable(val) {
  if (!Readable$1) {
    Readable$1 = requireReadable();
  }
  yield* Readable$1.prototype[SymbolAsyncIterator].call(val);
}
async function pumpToNode(iterable, writable, finish, { end }) {
  let error;
  let onresolve = null;
  const resume = (err) => {
    if (err) {
      error = err;
    }
    if (onresolve) {
      const callback = onresolve;
      onresolve = null;
      callback();
    }
  };
  const wait = () =>
    new Promise$2((resolve, reject) => {
      if (error) {
        reject(error);
      } else {
        onresolve = () => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        };
      }
    });
  writable.on('drain', resume);
  const cleanup = eos$1(
    writable,
    {
      readable: false
    },
    resume
  );
  try {
    if (writable.writableNeedDrain) {
      await wait();
    }
    for await (const chunk of iterable) {
      if (!writable.write(chunk)) {
        await wait();
      }
    }
    if (end) {
      writable.end();
    }
    await wait();
    finish();
  } catch (err) {
    finish(error !== err ? aggregateTwoErrors(error, err) : err);
  } finally {
    cleanup();
    writable.off('drain', resume);
  }
}
async function pumpToWeb(readable, writable, finish, { end }) {
  if (isTransformStream$1(writable)) {
    writable = writable.writable;
  }
  // https://streams.spec.whatwg.org/#example-manual-write-with-backpressure
  const writer = writable.getWriter();
  try {
    for await (const chunk of readable) {
      await writer.ready;
      writer.write(chunk).catch(() => {});
    }
    await writer.ready;
    if (end) {
      await writer.close();
    }
    finish();
  } catch (err) {
    try {
      await writer.abort(err);
      finish(err);
    } catch (err) {
      finish(err);
    }
  }
}
function pipeline$1(...streams) {
  return pipelineImpl(streams, once$1(popCallback(streams)))
}
function pipelineImpl(streams, callback, opts) {
  if (streams.length === 1 && ArrayIsArray(streams[0])) {
    streams = streams[0];
  }
  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS$2('streams')
  }
  const ac = new AbortController$1();
  const signal = ac.signal;
  const outerSignal = opts === null || opts === undefined ? undefined : opts.signal;

  // Need to cleanup event listeners if last stream is readable
  // https://github.com/nodejs/node/issues/35452
  const lastStreamCleanup = [];
  validateAbortSignal$1(outerSignal, 'options.signal');
  function abort() {
    finishImpl(new AbortError$2());
  }
  outerSignal === null || outerSignal === undefined ? undefined : outerSignal.addEventListener('abort', abort);
  let error;
  let value;
  const destroys = [];
  let finishCount = 0;
  function finish(err) {
    finishImpl(err, --finishCount === 0);
  }
  function finishImpl(err, final) {
    if (err && (!error || error.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
      error = err;
    }
    if (!error && !final) {
      return
    }
    while (destroys.length) {
      destroys.shift()(error);
    }
    outerSignal === null || outerSignal === undefined ? undefined : outerSignal.removeEventListener('abort', abort);
    ac.abort();
    if (final) {
      if (!error) {
        lastStreamCleanup.forEach((fn) => fn());
      }
      process$1.nextTick(callback, error, value);
    }
  }
  let ret;
  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    const reading = i < streams.length - 1;
    const writing = i > 0;
    const end = reading || (opts === null || opts === undefined ? undefined : opts.end) !== false;
    const isLastStream = i === streams.length - 1;
    if (isNodeStream$2(stream)) {
      if (end) {
        const { destroy, cleanup } = destroyer$1(stream, reading, writing);
        destroys.push(destroy);
        if (isReadable$1(stream) && isLastStream) {
          lastStreamCleanup.push(cleanup);
        }
      }

      // Catch stream errors that occur after pipe/pump has completed.
      function onError(err) {
        if (err && err.name !== 'AbortError' && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
          finish(err);
        }
      }
      stream.on('error', onError);
      if (isReadable$1(stream) && isLastStream) {
        lastStreamCleanup.push(() => {
          stream.removeListener('error', onError);
        });
      }
    }
    if (i === 0) {
      if (typeof stream === 'function') {
        ret = stream({
          signal
        });
        if (!isIterable(ret)) {
          throw new ERR_INVALID_RETURN_VALUE('Iterable, AsyncIterable or Stream', 'source', ret)
        }
      } else if (isIterable(stream) || isReadableNodeStream(stream) || isTransformStream$1(stream)) {
        ret = stream;
      } else {
        ret = Duplex$1.from(stream);
      }
    } else if (typeof stream === 'function') {
      if (isTransformStream$1(ret)) {
        var _ret;
        ret = makeAsyncIterable((_ret = ret) === null || _ret === undefined ? undefined : _ret.readable);
      } else {
        ret = makeAsyncIterable(ret);
      }
      ret = stream(ret, {
        signal
      });
      if (reading) {
        if (!isIterable(ret, true)) {
          throw new ERR_INVALID_RETURN_VALUE('AsyncIterable', `transform[${i - 1}]`, ret)
        }
      } else {
        var _ret2;
        if (!PassThrough$2) {
          PassThrough$2 = passthrough;
        }

        // If the last argument to pipeline is not a stream
        // we must create a proxy stream so that pipeline(...)
        // always returns a stream which can be further
        // composed through `.pipe(stream)`.

        const pt = new PassThrough$2({
          objectMode: true
        });

        // Handle Promises/A+ spec, `then` could be a getter that throws on
        // second use.
        const then = (_ret2 = ret) === null || _ret2 === undefined ? undefined : _ret2.then;
        if (typeof then === 'function') {
          finishCount++;
          then.call(
            ret,
            (val) => {
              value = val;
              if (val != null) {
                pt.write(val);
              }
              if (end) {
                pt.end();
              }
              process$1.nextTick(finish);
            },
            (err) => {
              pt.destroy(err);
              process$1.nextTick(finish, err);
            }
          );
        } else if (isIterable(ret, true)) {
          finishCount++;
          pumpToNode(ret, pt, finish, {
            end
          });
        } else if (isReadableStream$1(ret) || isTransformStream$1(ret)) {
          const toRead = ret.readable || ret;
          finishCount++;
          pumpToNode(toRead, pt, finish, {
            end
          });
        } else {
          throw new ERR_INVALID_RETURN_VALUE('AsyncIterable or Promise', 'destination', ret)
        }
        ret = pt;
        const { destroy, cleanup } = destroyer$1(ret, false, true);
        destroys.push(destroy);
        if (isLastStream) {
          lastStreamCleanup.push(cleanup);
        }
      }
    } else if (isNodeStream$2(stream)) {
      if (isReadableNodeStream(ret)) {
        finishCount += 2;
        const cleanup = pipe(ret, stream, finish, {
          end
        });
        if (isReadable$1(stream) && isLastStream) {
          lastStreamCleanup.push(cleanup);
        }
      } else if (isTransformStream$1(ret) || isReadableStream$1(ret)) {
        const toRead = ret.readable || ret;
        finishCount++;
        pumpToNode(toRead, stream, finish, {
          end
        });
      } else if (isIterable(ret)) {
        finishCount++;
        pumpToNode(ret, stream, finish, {
          end
        });
      } else {
        throw new ERR_INVALID_ARG_TYPE$1(
          'val',
          ['Readable', 'Iterable', 'AsyncIterable', 'ReadableStream', 'TransformStream'],
          ret
        )
      }
      ret = stream;
    } else if (isWebStream$1(stream)) {
      if (isReadableNodeStream(ret)) {
        finishCount++;
        pumpToWeb(makeAsyncIterable(ret), stream, finish, {
          end
        });
      } else if (isReadableStream$1(ret) || isIterable(ret)) {
        finishCount++;
        pumpToWeb(ret, stream, finish, {
          end
        });
      } else if (isTransformStream$1(ret)) {
        finishCount++;
        pumpToWeb(ret.readable, stream, finish, {
          end
        });
      } else {
        throw new ERR_INVALID_ARG_TYPE$1(
          'val',
          ['Readable', 'Iterable', 'AsyncIterable', 'ReadableStream', 'TransformStream'],
          ret
        )
      }
      ret = stream;
    } else {
      ret = Duplex$1.from(stream);
    }
  }
  if (
    (signal !== null && signal !== undefined && signal.aborted) ||
    (outerSignal !== null && outerSignal !== undefined && outerSignal.aborted)
  ) {
    process$1.nextTick(abort);
  }
  return ret
}
function pipe(src, dst, finish, { end }) {
  let ended = false;
  dst.on('close', () => {
    if (!ended) {
      // Finish if the destination closes before the source has completed.
      finish(new ERR_STREAM_PREMATURE_CLOSE());
    }
  });
  src.pipe(dst, {
    end: false
  }); // If end is true we already will have a listener to end dst.

  if (end) {
    // Compat. Before node v10.12.0 stdio used to throw an error so
    // pipe() did/does not end() stdio destinations.
    // Now they allow it but "secretly" don't close the underlying fd.

    function endFn() {
      ended = true;
      dst.end();
    }
    if (isReadableEnded(src)) {
      // End the destination if the source has already ended.
      process$1.nextTick(endFn);
    } else {
      src.once('end', endFn);
    }
  } else {
    finish();
  }
  eos$1(
    src,
    {
      readable: true,
      writable: false
    },
    (err) => {
      const rState = src._readableState;
      if (
        err &&
        err.code === 'ERR_STREAM_PREMATURE_CLOSE' &&
        rState &&
        rState.ended &&
        !rState.errored &&
        !rState.errorEmitted
      ) {
        // Some readable streams will emit 'close' before 'end'. However, since
        // this is on the readable side 'end' should still be emitted if the
        // stream has been ended and no error emitted. This should be allowed in
        // favor of backwards compatibility. Since the stream is piped to a
        // destination this should not result in any observable difference.
        // We don't need to check if this is a writable premature close since
        // eos will only fail with premature close on the reading side for
        // duplex streams.
        src.once('end', finish).once('error', finish);
      } else {
        finish(err);
      }
    }
  );
  return eos$1(
    dst,
    {
      readable: false,
      writable: true
    },
    finish
  )
}
var pipeline_1 = {
  pipelineImpl,
  pipeline: pipeline$1
};

const { pipeline } = pipeline_1;
const Duplex = requireDuplex();
const { destroyer } = destroy_1;
const {
  isNodeStream: isNodeStream$1,
  isReadable,
  isWritable: isWritable$1,
  isWebStream,
  isTransformStream,
  isWritableStream,
  isReadableStream
} = utils;
const {
  AbortError: AbortError$1,
  codes: { ERR_INVALID_ARG_VALUE: ERR_INVALID_ARG_VALUE$1, ERR_MISSING_ARGS: ERR_MISSING_ARGS$1 }
} = errors;
const eos = endOfStream.exports;
var compose$1 = function compose(...streams) {
  if (streams.length === 0) {
    throw new ERR_MISSING_ARGS$1('streams')
  }
  if (streams.length === 1) {
    return Duplex.from(streams[0])
  }
  const orgStreams = [...streams];
  if (typeof streams[0] === 'function') {
    streams[0] = Duplex.from(streams[0]);
  }
  if (typeof streams[streams.length - 1] === 'function') {
    const idx = streams.length - 1;
    streams[idx] = Duplex.from(streams[idx]);
  }
  for (let n = 0; n < streams.length; ++n) {
    if (!isNodeStream$1(streams[n]) && !isWebStream(streams[n])) {
      // TODO(ronag): Add checks for non streams.
      continue
    }
    if (
      n < streams.length - 1 &&
      !(isReadable(streams[n]) || isReadableStream(streams[n]) || isTransformStream(streams[n]))
    ) {
      throw new ERR_INVALID_ARG_VALUE$1(`streams[${n}]`, orgStreams[n], 'must be readable')
    }
    if (n > 0 && !(isWritable$1(streams[n]) || isWritableStream(streams[n]) || isTransformStream(streams[n]))) {
      throw new ERR_INVALID_ARG_VALUE$1(`streams[${n}]`, orgStreams[n], 'must be writable')
    }
  }
  let ondrain;
  let onfinish;
  let onreadable;
  let onclose;
  let d;
  function onfinished(err) {
    const cb = onclose;
    onclose = null;
    if (cb) {
      cb(err);
    } else if (err) {
      d.destroy(err);
    } else if (!readable && !writable) {
      d.destroy();
    }
  }
  const head = streams[0];
  const tail = pipeline(streams, onfinished);
  const writable = !!(isWritable$1(head) || isWritableStream(head) || isTransformStream(head));
  const readable = !!(isReadable(tail) || isReadableStream(tail) || isTransformStream(tail));

  // TODO(ronag): Avoid double buffering.
  // Implement Writable/Readable/Duplex traits.
  // See, https://github.com/nodejs/node/pull/33515.
  d = new Duplex({
    // TODO (ronag): highWaterMark?
    writableObjectMode: !!(head !== null && head !== undefined && head.writableObjectMode),
    readableObjectMode: !!(tail !== null && tail !== undefined && tail.writableObjectMode),
    writable,
    readable
  });
  if (writable) {
    if (isNodeStream$1(head)) {
      d._write = function (chunk, encoding, callback) {
        if (head.write(chunk, encoding)) {
          callback();
        } else {
          ondrain = callback;
        }
      };
      d._final = function (callback) {
        head.end();
        onfinish = callback;
      };
      head.on('drain', function () {
        if (ondrain) {
          const cb = ondrain;
          ondrain = null;
          cb();
        }
      });
    } else if (isWebStream(head)) {
      const writable = isTransformStream(head) ? head.writable : head;
      const writer = writable.getWriter();
      d._write = async function (chunk, encoding, callback) {
        try {
          await writer.ready;
          writer.write(chunk).catch(() => {});
          callback();
        } catch (err) {
          callback(err);
        }
      };
      d._final = async function (callback) {
        try {
          await writer.ready;
          writer.close().catch(() => {});
          onfinish = callback;
        } catch (err) {
          callback(err);
        }
      };
    }
    const toRead = isTransformStream(tail) ? tail.readable : tail;
    eos(toRead, () => {
      if (onfinish) {
        const cb = onfinish;
        onfinish = null;
        cb();
      }
    });
  }
  if (readable) {
    if (isNodeStream$1(tail)) {
      tail.on('readable', function () {
        if (onreadable) {
          const cb = onreadable;
          onreadable = null;
          cb();
        }
      });
      tail.on('end', function () {
        d.push(null);
      });
      d._read = function () {
        while (true) {
          const buf = tail.read();
          if (buf === null) {
            onreadable = d._read;
            return
          }
          if (!d.push(buf)) {
            return
          }
        }
      };
    } else if (isWebStream(tail)) {
      const readable = isTransformStream(tail) ? tail.readable : tail;
      const reader = readable.getReader();
      d._read = async function () {
        while (true) {
          try {
            const { value, done } = await reader.read();
            if (!d.push(value)) {
              return
            }
            if (done) {
              d.push(null);
              return
            }
          } catch {
            return
          }
        }
      };
    }
  }
  d._destroy = function (err, callback) {
    if (!err && onclose !== null) {
      err = new AbortError$1();
    }
    onreadable = null;
    ondrain = null;
    onfinish = null;
    if (onclose === null) {
      callback(err);
    } else {
      onclose = callback;
      if (isNodeStream$1(tail)) {
        destroyer(tail, err);
      }
    }
  };
  return d
};

const AbortController = globalThis.AbortController || requireBrowser().AbortController;
const {
  codes: { ERR_INVALID_ARG_VALUE, ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS, ERR_OUT_OF_RANGE },
  AbortError
} = errors;
const { validateAbortSignal, validateInteger, validateObject } = validators;
const kWeakHandler = primordials.Symbol('kWeak');
const { finished } = endOfStream.exports;
const staticCompose = compose$1;
const { addAbortSignalNoValidate } = addAbortSignal.exports;
const { isWritable, isNodeStream } = utils;
const {
  ArrayPrototypePush,
  MathFloor,
  Number: Number$1,
  NumberIsNaN,
  Promise: Promise$1,
  PromiseReject,
  PromisePrototypeThen,
  Symbol: Symbol$1
} = primordials;
const kEmpty = Symbol$1('kEmpty');
const kEof = Symbol$1('kEof');
function compose(stream, options) {
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  if (isNodeStream(stream) && !isWritable(stream)) {
    throw new ERR_INVALID_ARG_VALUE('stream', stream, 'must be writable')
  }
  const composedStream = staticCompose(this, stream);
  if (options !== null && options !== undefined && options.signal) {
    // Not validating as we already validated before
    addAbortSignalNoValidate(options.signal, composedStream);
  }
  return composedStream
}
function map(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  let concurrency = 1;
  if ((options === null || options === undefined ? undefined : options.concurrency) != null) {
    concurrency = MathFloor(options.concurrency);
  }
  validateInteger(concurrency, 'concurrency', 1);
  return async function* map() {
    var _options$signal, _options$signal2;
    const ac = new AbortController();
    const stream = this;
    const queue = [];
    const signal = ac.signal;
    const signalOpt = {
      signal
    };
    const abort = () => ac.abort();
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal = options.signal) !== null &&
      _options$signal !== undefined &&
      _options$signal.aborted
    ) {
      abort();
    }
    options === null || options === undefined
      ? undefined
      : (_options$signal2 = options.signal) === null || _options$signal2 === undefined
      ? undefined
      : _options$signal2.addEventListener('abort', abort);
    let next;
    let resume;
    let done = false;
    function onDone() {
      done = true;
    }
    async function pump() {
      try {
        for await (let val of stream) {
          var _val;
          if (done) {
            return
          }
          if (signal.aborted) {
            throw new AbortError()
          }
          try {
            val = fn(val, signalOpt);
          } catch (err) {
            val = PromiseReject(err);
          }
          if (val === kEmpty) {
            continue
          }
          if (typeof ((_val = val) === null || _val === undefined ? undefined : _val.catch) === 'function') {
            val.catch(onDone);
          }
          queue.push(val);
          if (next) {
            next();
            next = null;
          }
          if (!done && queue.length && queue.length >= concurrency) {
            await new Promise$1((resolve) => {
              resume = resolve;
            });
          }
        }
        queue.push(kEof);
      } catch (err) {
        const val = PromiseReject(err);
        PromisePrototypeThen(val, undefined, onDone);
        queue.push(val);
      } finally {
        var _options$signal3;
        done = true;
        if (next) {
          next();
          next = null;
        }
        options === null || options === undefined
          ? undefined
          : (_options$signal3 = options.signal) === null || _options$signal3 === undefined
          ? undefined
          : _options$signal3.removeEventListener('abort', abort);
      }
    }
    pump();
    try {
      while (true) {
        while (queue.length > 0) {
          const val = await queue[0];
          if (val === kEof) {
            return
          }
          if (signal.aborted) {
            throw new AbortError()
          }
          if (val !== kEmpty) {
            yield val;
          }
          queue.shift();
          if (resume) {
            resume();
            resume = null;
          }
        }
        await new Promise$1((resolve) => {
          next = resolve;
        });
      }
    } finally {
      ac.abort();
      done = true;
      if (resume) {
        resume();
        resume = null;
      }
    }
  }.call(this)
}
function asIndexedPairs(options = undefined) {
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  return async function* asIndexedPairs() {
    let index = 0;
    for await (const val of this) {
      var _options$signal4;
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal4 = options.signal) !== null &&
        _options$signal4 !== undefined &&
        _options$signal4.aborted
      ) {
        throw new AbortError({
          cause: options.signal.reason
        })
      }
      yield [index++, val];
    }
  }.call(this)
}
async function some(fn, options = undefined) {
  for await (const unused of filter.call(this, fn, options)) {
    return true
  }
  return false
}
async function every(fn, options = undefined) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  // https://en.wikipedia.org/wiki/De_Morgan%27s_laws
  return !(await some.call(
    this,
    async (...args) => {
      return !(await fn(...args))
    },
    options
  ))
}
async function find(fn, options) {
  for await (const result of filter.call(this, fn, options)) {
    return result
  }
  return undefined
}
async function forEach(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  async function forEachFn(value, options) {
    await fn(value, options);
    return kEmpty
  }
  // eslint-disable-next-line no-unused-vars
  for await (const unused of map.call(this, forEachFn, options));
}
function filter(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  async function filterFn(value, options) {
    if (await fn(value, options)) {
      return value
    }
    return kEmpty
  }
  return map.call(this, filterFn, options)
}

// Specific to provide better error to reduce since the argument is only
// missing if the stream has no items in it - but the code is still appropriate
class ReduceAwareErrMissingArgs extends ERR_MISSING_ARGS {
  constructor() {
    super('reduce');
    this.message = 'Reduce of an empty stream requires an initial value';
  }
}
async function reduce(reducer, initialValue, options) {
  var _options$signal5;
  if (typeof reducer !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('reducer', ['Function', 'AsyncFunction'], reducer)
  }
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  let hasInitialValue = arguments.length > 1;
  if (
    options !== null &&
    options !== undefined &&
    (_options$signal5 = options.signal) !== null &&
    _options$signal5 !== undefined &&
    _options$signal5.aborted
  ) {
    const err = new AbortError(undefined, {
      cause: options.signal.reason
    });
    this.once('error', () => {}); // The error is already propagated
    await finished(this.destroy(err));
    throw err
  }
  const ac = new AbortController();
  const signal = ac.signal;
  if (options !== null && options !== undefined && options.signal) {
    const opts = {
      once: true,
      [kWeakHandler]: this
    };
    options.signal.addEventListener('abort', () => ac.abort(), opts);
  }
  let gotAnyItemFromStream = false;
  try {
    for await (const value of this) {
      var _options$signal6;
      gotAnyItemFromStream = true;
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal6 = options.signal) !== null &&
        _options$signal6 !== undefined &&
        _options$signal6.aborted
      ) {
        throw new AbortError()
      }
      if (!hasInitialValue) {
        initialValue = value;
        hasInitialValue = true;
      } else {
        initialValue = await reducer(initialValue, value, {
          signal
        });
      }
    }
    if (!gotAnyItemFromStream && !hasInitialValue) {
      throw new ReduceAwareErrMissingArgs()
    }
  } finally {
    ac.abort();
  }
  return initialValue
}
async function toArray(options) {
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  const result = [];
  for await (const val of this) {
    var _options$signal7;
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal7 = options.signal) !== null &&
      _options$signal7 !== undefined &&
      _options$signal7.aborted
    ) {
      throw new AbortError(undefined, {
        cause: options.signal.reason
      })
    }
    ArrayPrototypePush(result, val);
  }
  return result
}
function flatMap(fn, options) {
  const values = map.call(this, fn, options);
  return async function* flatMap() {
    for await (const val of values) {
      yield* val;
    }
  }.call(this)
}
function toIntegerOrInfinity(number) {
  // We coerce here to align with the spec
  // https://github.com/tc39/proposal-iterator-helpers/issues/169
  number = Number$1(number);
  if (NumberIsNaN(number)) {
    return 0
  }
  if (number < 0) {
    throw new ERR_OUT_OF_RANGE('number', '>= 0', number)
  }
  return number
}
function drop(number, options = undefined) {
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  number = toIntegerOrInfinity(number);
  return async function* drop() {
    var _options$signal8;
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal8 = options.signal) !== null &&
      _options$signal8 !== undefined &&
      _options$signal8.aborted
    ) {
      throw new AbortError()
    }
    for await (const val of this) {
      var _options$signal9;
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal9 = options.signal) !== null &&
        _options$signal9 !== undefined &&
        _options$signal9.aborted
      ) {
        throw new AbortError()
      }
      if (number-- <= 0) {
        yield val;
      }
    }
  }.call(this)
}
function take(number, options = undefined) {
  if (options != null) {
    validateObject(options, 'options');
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal');
  }
  number = toIntegerOrInfinity(number);
  return async function* take() {
    var _options$signal10;
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal10 = options.signal) !== null &&
      _options$signal10 !== undefined &&
      _options$signal10.aborted
    ) {
      throw new AbortError()
    }
    for await (const val of this) {
      var _options$signal11;
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal11 = options.signal) !== null &&
        _options$signal11 !== undefined &&
        _options$signal11.aborted
      ) {
        throw new AbortError()
      }
      if (number-- > 0) {
        yield val;
      } else {
        return
      }
    }
  }.call(this)
}
operators.streamReturningOperators = {
  asIndexedPairs,
  drop,
  filter,
  flatMap,
  map,
  take,
  compose
};
operators.promiseReturningOperators = {
  every,
  forEach,
  reduce,
  toArray,
  some,
  find
};

var promises;
var hasRequiredPromises;

function requirePromises () {
	if (hasRequiredPromises) return promises;
	hasRequiredPromises = 1;

	const { ArrayPrototypePop, Promise } = primordials;
	const { isIterable, isNodeStream, isWebStream } = utils;
	const { pipelineImpl: pl } = pipeline_1;
	const { finished } = endOfStream.exports;
	requireStream();
	function pipeline(...streams) {
	  return new Promise((resolve, reject) => {
	    let signal;
	    let end;
	    const lastArg = streams[streams.length - 1];
	    if (
	      lastArg &&
	      typeof lastArg === 'object' &&
	      !isNodeStream(lastArg) &&
	      !isIterable(lastArg) &&
	      !isWebStream(lastArg)
	    ) {
	      const options = ArrayPrototypePop(streams);
	      signal = options.signal;
	      end = options.end;
	    }
	    pl(
	      streams,
	      (err, value) => {
	        if (err) {
	          reject(err);
	        } else {
	          resolve(value);
	        }
	      },
	      {
	        signal,
	        end
	      }
	    );
	  })
	}
	promises = {
	  finished,
	  pipeline
	};
	return promises;
}

/* replacement start */

var hasRequiredStream;

function requireStream () {
	if (hasRequiredStream) return stream$2.exports;
	hasRequiredStream = 1;
	const { Buffer } = require$$0$1

	/* replacement end */
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	;	const { ObjectDefineProperty, ObjectKeys, ReflectApply } = primordials;
	const {
	  promisify: { custom: customPromisify }
	} = util$4.exports;
	const { streamReturningOperators, promiseReturningOperators } = operators;
	const {
	  codes: { ERR_ILLEGAL_CONSTRUCTOR }
	} = errors;
	const compose = compose$1;
	const { pipeline } = pipeline_1;
	const { destroyer } = destroy_1;
	const eos = endOfStream.exports;
	const promises = requirePromises();
	const utils$1 = utils;
	const Stream = (stream$2.exports = legacy.Stream);
	Stream.isDisturbed = utils$1.isDisturbed;
	Stream.isErrored = utils$1.isErrored;
	Stream.isReadable = utils$1.isReadable;
	Stream.Readable = requireReadable();
	for (const key of ObjectKeys(streamReturningOperators)) {
	  const op = streamReturningOperators[key];
	  function fn(...args) {
	    if (new.target) {
	      throw ERR_ILLEGAL_CONSTRUCTOR()
	    }
	    return Stream.Readable.from(ReflectApply(op, this, args))
	  }
	  ObjectDefineProperty(fn, 'name', {
	    __proto__: null,
	    value: op.name
	  });
	  ObjectDefineProperty(fn, 'length', {
	    __proto__: null,
	    value: op.length
	  });
	  ObjectDefineProperty(Stream.Readable.prototype, key, {
	    __proto__: null,
	    value: fn,
	    enumerable: false,
	    configurable: true,
	    writable: true
	  });
	}
	for (const key of ObjectKeys(promiseReturningOperators)) {
	  const op = promiseReturningOperators[key];
	  function fn(...args) {
	    if (new.target) {
	      throw ERR_ILLEGAL_CONSTRUCTOR()
	    }
	    return ReflectApply(op, this, args)
	  }
	  ObjectDefineProperty(fn, 'name', {
	    __proto__: null,
	    value: op.name
	  });
	  ObjectDefineProperty(fn, 'length', {
	    __proto__: null,
	    value: op.length
	  });
	  ObjectDefineProperty(Stream.Readable.prototype, key, {
	    __proto__: null,
	    value: fn,
	    enumerable: false,
	    configurable: true,
	    writable: true
	  });
	}
	Stream.Writable = requireWritable();
	Stream.Duplex = requireDuplex();
	Stream.Transform = transform;
	Stream.PassThrough = passthrough;
	Stream.pipeline = pipeline;
	const { addAbortSignal: addAbortSignal$1 } = addAbortSignal.exports;
	Stream.addAbortSignal = addAbortSignal$1;
	Stream.finished = eos;
	Stream.destroy = destroyer;
	Stream.compose = compose;
	ObjectDefineProperty(Stream, 'promises', {
	  __proto__: null,
	  configurable: true,
	  enumerable: true,
	  get() {
	    return promises
	  }
	});
	ObjectDefineProperty(pipeline, customPromisify, {
	  __proto__: null,
	  enumerable: true,
	  get() {
	    return promises.pipeline
	  }
	});
	ObjectDefineProperty(eos, customPromisify, {
	  __proto__: null,
	  enumerable: true,
	  get() {
	    return promises.finished
	  }
	});

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;
	Stream._isUint8Array = function isUint8Array(value) {
	  return value instanceof Uint8Array
	};
	Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
	};
	return stream$2.exports;
}

(function (module) {

	const CustomStream = requireStream();
	const promises = requirePromises();
	const originalDestroy = CustomStream.Readable.destroy;
	module.exports = CustomStream.Readable;

	// Explicit export naming is needed for ESM
	module.exports._uint8ArrayToBuffer = CustomStream._uint8ArrayToBuffer;
	module.exports._isUint8Array = CustomStream._isUint8Array;
	module.exports.isDisturbed = CustomStream.isDisturbed;
	module.exports.isErrored = CustomStream.isErrored;
	module.exports.isReadable = CustomStream.isReadable;
	module.exports.Readable = CustomStream.Readable;
	module.exports.Writable = CustomStream.Writable;
	module.exports.Duplex = CustomStream.Duplex;
	module.exports.Transform = CustomStream.Transform;
	module.exports.PassThrough = CustomStream.PassThrough;
	module.exports.addAbortSignal = CustomStream.addAbortSignal;
	module.exports.finished = CustomStream.finished;
	module.exports.destroy = CustomStream.destroy;
	module.exports.destroy = originalDestroy;
	module.exports.pipeline = CustomStream.pipeline;
	module.exports.compose = CustomStream.compose;
	Object.defineProperty(CustomStream, 'promises', {
	  configurable: true,
	  enumerable: true,
	  get() {
	    return promises
	  }
	});
	module.exports.Stream = CustomStream.Stream;

	// Allow default importing
	module.exports.default = module.exports;
} (browser$4));

const stream$1 = browser$4.exports;

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
var queue$1 = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue$1 = currentQueue.concat(queue$1);
    } else {
        queueIndex = -1;
    }
    if (queue$1.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue$1.length;
    while(len) {
        currentQueue = queue$1;
        queue$1 = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue$1.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick$1(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue$1.push(new Item(fun, args));
    if (queue$1.length === 1 && !draining) {
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
var version$1 = ''; // empty string to avoid regexp issues
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
var emit$2 = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = global$1.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
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

var browser$1 = {
  nextTick: nextTick$1,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version$1,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit$2,
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

const process = browser$1;

/*
MIT Licence
Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola
https://github.com/YuzuJS/setImmediate/blob/f1ccbfdf09cb93aadf77c4aa749ea554503b9234/LICENSE.txt
*/

var nextHandle = 1; // Spec says greater than zero
var tasksByHandle = {};
var currentlyRunningATask = false;
var doc$1 = global$1.document;
var registerImmediate;

function setImmediate(callback) {
  // Callback can either be a function or a string
  if (typeof callback !== "function") {
    callback = new Function("" + callback);
  }
  // Copy function arguments
  var args = new Array(arguments.length - 1);
  for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i + 1];
  }
  // Store and register the task
  var task = { callback: callback, args: args };
  tasksByHandle[nextHandle] = task;
  registerImmediate(nextHandle);
  return nextHandle++;
}

function clearImmediate(handle) {
    delete tasksByHandle[handle];
}

function run(task) {
    var callback = task.callback;
    var args = task.args;
    switch (args.length) {
    case 0:
        callback();
        break;
    case 1:
        callback(args[0]);
        break;
    case 2:
        callback(args[0], args[1]);
        break;
    case 3:
        callback(args[0], args[1], args[2]);
        break;
    default:
        callback.apply(undefined, args);
        break;
    }
}

function runIfPresent(handle) {
    // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
    // So if we're currently running a task, we'll need to delay this invocation.
    if (currentlyRunningATask) {
        // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
        // "too much recursion" error.
        setTimeout(runIfPresent, 0, handle);
    } else {
        var task = tasksByHandle[handle];
        if (task) {
            currentlyRunningATask = true;
            try {
                run(task);
            } finally {
                clearImmediate(handle);
                currentlyRunningATask = false;
            }
        }
    }
}

function installNextTickImplementation() {
    registerImmediate = function(handle) {
        process.nextTick(function () { runIfPresent(handle); });
    };
}

function canUsePostMessage() {
    // The test against `importScripts` prevents this implementation from being installed inside a web worker,
    // where `global.postMessage` means something completely different and can't be used for this purpose.
    if (global$1.postMessage && !global$1.importScripts) {
        var postMessageIsAsynchronous = true;
        var oldOnMessage = global$1.onmessage;
        global$1.onmessage = function() {
            postMessageIsAsynchronous = false;
        };
        global$1.postMessage("", "*");
        global$1.onmessage = oldOnMessage;
        return postMessageIsAsynchronous;
    }
}

function installPostMessageImplementation() {
    // Installs an event handler on `global` for the `message` event: see
    // * https://developer.mozilla.org/en/DOM/window.postMessage
    // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

    var messagePrefix = "setImmediate$" + Math.random() + "$";
    var onGlobalMessage = function(event) {
        if (event.source === global$1 &&
            typeof event.data === "string" &&
            event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
        }
    };

    if (global$1.addEventListener) {
        global$1.addEventListener("message", onGlobalMessage, false);
    } else {
        global$1.attachEvent("onmessage", onGlobalMessage);
    }

    registerImmediate = function(handle) {
        global$1.postMessage(messagePrefix + handle, "*");
    };
}

function installMessageChannelImplementation() {
    var channel = new MessageChannel();
    channel.port1.onmessage = function(event) {
        var handle = event.data;
        runIfPresent(handle);
    };

    registerImmediate = function(handle) {
        channel.port2.postMessage(handle);
    };
}

function installReadyStateChangeImplementation() {
    var html = doc$1.documentElement;
    registerImmediate = function(handle) {
        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var script = doc$1.createElement("script");
        script.onreadystatechange = function () {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
        };
        html.appendChild(script);
    };
}

function installSetTimeoutImplementation() {
    registerImmediate = function(handle) {
        setTimeout(runIfPresent, 0, handle);
    };
}

// If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global$1);
attachTo = attachTo && attachTo.setTimeout ? attachTo : global$1;

// Don't get fooled by e.g. browserify environments.
if ({}.toString.call(global$1.process) === "[object process]") {
    // For Node.js before 0.9
    installNextTickImplementation();

} else if (canUsePostMessage()) {
    // For non-IE10 modern browsers
    installPostMessageImplementation();

} else if (global$1.MessageChannel) {
    // For web workers, where supported
    installMessageChannelImplementation();

} else if (doc$1 && "onreadystatechange" in doc$1.createElement("script")) {
    // For IE 6–8
    installReadyStateChangeImplementation();

} else {
    // For older browsers
    installSetTimeoutImplementation();
}

var yauzl = {};

const empty = {};

const empty$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: empty
}, Symbol.toStringTag, { value: 'Module' }));

const require$$0 = /*@__PURE__*/getAugmentedNamespace(empty$1);

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

const duplexToNode = (pair) => {
  let reader, writer;
  return new browser$4.exports.Duplex({
    async construct(callback) {
      let err = null; try {
        reader = pair.readable.getReader();
        writer = pair.writable.getWriter();
        await writer.ready;
      } catch (e) { err = e; }
      callback(err);
    },
    async read(n) {
      try {
        const { done, value: chunk } = await reader.read();
        if (done) { this.push(null); return }
        this.push(Buffer$3.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } catch (e) { this.destroy(e); }
    },
    async write(chunk, encoding, callback) {
      let err = null; try {
        await writer.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } catch (e) { err = e; }
      callback(err);
    },
    async final(callback) {
      let err = null; try {
        await writer.close();
      } catch (e) { err = e; }
      callback(err);
    },
    async destroy(err, cb) {
      try {
        if (writer != null) { await writer.abort(err); }
        else if (reader != null) { await reader.cancel(err); }
      } catch (e) { err = e; }
      cb(err);
    }
  })
};

const createTransform = (FflateStream) => {
  let final, finalCallback;
  const transform = new browser$4.exports.Transform({
    transform(chunk, encoding, callback) {
      let err = null; try {
        stream.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), false);
      } catch (e) { err = e; }
      callback(err);
    },
    flush(callback) {
      let err = null; try {
        stream.push(new Uint8Array(0), true);
        if (!final) { finalCallback = callback; return }
      } catch (e) { err = e; }
      callback(err);
    }
  });
  const stream = new FflateStream((chunk, _) => {
    transform.push(Buffer$3.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
    final = _;
    if (final && finalCallback != null) { finalCallback(); }
  });
  return transform
};

const createInflateRawNativeNative = () => new DecompressionStream('deflate-raw');
const hasInflateRawNative = (() => {
  try {
    createInflateRawNativeNative();
    return true
  } catch (e) {
    return false
  }
})();

const createInflateRawNative = hasInflateRawNative ? () => duplexToNode(createInflateRawNativeNative()) : null;
const createInflateRawFflate = () => createTransform(Inflate);
const createInflateRaw = createInflateRawNative ?? createInflateRawFflate;

const dummyZlib = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createInflateRawNative,
  createInflateRawFflate,
  createInflateRaw
}, Symbol.toStringTag, { value: 'Module' }));

const require$$1 = /*@__PURE__*/getAugmentedNamespace(dummyZlib);

var fdSlicer = {};

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
  if (!isString$1(f)) {
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
    if (isNull(x) || !isObject$1(x)) {
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
    debugEnviron = ({}).NODE_DEBUG || '';
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
      isFunction$1(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString$1(ret)) {
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
    if (isFunction$1(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp$1(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate$1(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray$1(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction$1(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp$1(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate$1(value)) {
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
    if (isRegExp$1(value)) {
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
  if (isString$1(value)) {
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
    if (hasOwnProperty$2(value, String(i))) {
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
  if (!hasOwnProperty$2(visibleKeys, key)) {
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
function isArray$1(ar) {
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

function isString$1(arg) {
  return typeof arg === 'string';
}

function isSymbol$1(arg) {
  return typeof arg === 'symbol';
}

function isUndefined(arg) {
  return arg === void 0;
}

function isRegExp$1(re) {
  return isObject$1(re) && objectToString$1(re) === '[object RegExp]';
}

function isObject$1(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isDate$1(d) {
  return isObject$1(d) && objectToString$1(d) === '[object Date]';
}

function isError(e) {
  return isObject$1(e) &&
      (objectToString$1(e) === '[object Error]' || e instanceof Error);
}

function isFunction$1(arg) {
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

function isBuffer(maybeBuf) {
  return Buffer$3.isBuffer(maybeBuf);
}

function objectToString$1(o) {
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
  if (!add || !isObject$1(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function hasOwnProperty$2(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

const util$2 = {
  inherits: inherits$1,
  _extend: _extend,
  log: log,
  isBuffer: isBuffer,
  isPrimitive: isPrimitive,
  isFunction: isFunction$1,
  isError: isError,
  isDate: isDate$1,
  isObject: isObject$1,
  isRegExp: isRegExp$1,
  isUndefined: isUndefined,
  isSymbol: isSymbol$1,
  isString: isString$1,
  isNumber: isNumber,
  isNullOrUndefined: isNullOrUndefined,
  isNull: isNull,
  isBoolean: isBoolean,
  isArray: isArray$1,
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
  isArray: isArray$1,
  isBoolean,
  isNull,
  isNullOrUndefined,
  isNumber,
  isString: isString$1,
  isSymbol: isSymbol$1,
  isUndefined,
  isRegExp: isRegExp$1,
  isObject: isObject$1,
  isDate: isDate$1,
  isError,
  isFunction: isFunction$1,
  isPrimitive,
  isBuffer,
  log,
  inherits: inherits$1,
  _extend,
  default: util$2
}, Symbol.toStringTag, { value: 'Module' }));

const require$$4 = /*@__PURE__*/getAugmentedNamespace(util$3);

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

var fs$1 = require$$0;
var util$1 = require$$4;
var stream = browser$4.exports;
var Readable = stream.Readable;
var Writable$1 = stream.Writable;
var PassThrough$1 = stream.PassThrough;
var Pend = pend;
var EventEmitter$1 = require$$5.EventEmitter;

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
    var buffer = new Buffer$3(toRead);
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
  setImmediate(function() {
    callback(null, written);
  });
};

BufferSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  buffer.copy(this.buffer, position, offset, offset + length);
  setImmediate(function() {
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

var Buffer = require$$0$1.Buffer;

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
  if (Buffer.isBuffer(input)) {
    return input;
  }

  var hasNewBufferAPI =
      typeof Buffer.alloc === "function" &&
      typeof Buffer.from === "function";

  if (typeof input === "number") {
    return hasNewBufferAPI ? Buffer.alloc(input) : new Buffer(input);
  }
  else if (typeof input === "string") {
    return hasNewBufferAPI ? Buffer.from(input) : new Buffer(input);
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
  if (Buffer.isBuffer(previous)) {
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

var fs = require$$0;
var zlib = require$$1;
var fd_slicer = fdSlicer;
var crc32 = bufferCrc32;
var util = require$$4;
var EventEmitter = require$$5.EventEmitter;
var Transform = browser$4.exports.Transform;
var PassThrough = browser$4.exports.PassThrough;
var Writable = browser$4.exports.Writable;

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
if (typeof Buffer$3.allocUnsafe === "function") {
  newBuffer = function(len) {
    return Buffer$3.allocUnsafe(len);
  };
} else {
  newBuffer = function(len) {
    return new Buffer$3(len);
  };
}

function defaultCallback(err) {
  if (err) throw err;
}

var pinyin_dict_withtone = "yī,dīng zhēng,kǎo qiǎo yú,qī,shàng,xià,hǎn,wàn mò,zhàng,sān,shàng shǎng,xià,qí jī,bù fǒu,yǔ yù yú,miǎn,gài,chǒu,chǒu,zhuān,qiě jū,pī,shì,shì,qiū,bǐng,yè,cóng,dōng,sī,chéng,diū,qiū,liǎng,diū,yǒu,liǎng,yán,bìng,sāng sàng,gǔn,jiū,gè gě,yā,pán,zhōng zhòng,jǐ,jiè,fēng,guàn kuàng,chuàn,chǎn,lín,zhuó,zhǔ,bā,wán,dān,wéi wèi,zhǔ,jǐng,lì lí,jǔ,piě,fú,yí jí,yì,nǎi,wǔ,jiǔ,jiǔ,tuō zhé,me yāo mó ma,yì,yī,zhī,wū,zhà,hū,fá,lè yuè,yín,pīng,pāng,qiáo,hǔ,guāi,chéng shèng,chéng shèng,yǐ,háo yǐ,yǐ,miē niè,jiǔ,qǐ,yě,xí,xiāng,gài,jiǔ,xià,hù,shū,dǒu,shǐ,jī,náng,jiā,none,shí,none,hū,mǎi,luàn,none,rǔ,xué,yǎn,fǔ,shā,nǎ,qián,suǒ,yú,zhù,zhě,qián gān,zhì luàn,guī,qián,luàn,lǐn lìn,yì,jué,le liǎo,gè mā,yú yǔ,zhēng,shì,shì,èr,chù,yú,kuī,yú,yún,hù,qí,wǔ,jǐng,sì,suì,gèn,gèn,yà,xiē suò,yà,qí zhāi,yā yà,jí qì,tóu,wáng wú,kàng,dà,jiāo,hài,yì,chǎn,hēng pēng,mǔ,ye,xiǎng,jīng,tíng,liàng,xiǎng,jīng,yè,qīn qìng,bó,yòu,xiè,dǎn dàn,lián,duǒ,wěi mén,rén,rén,jí,jí,wáng,yì,shén shí,rén,lè,dīng,zè,jǐn jìn,pū pú,chóu qiú,bā,zhǎng,jīn,jiè,bīng,réng,cóng zòng,fó,jīn sǎn,lún,bīng,cāng,zī zǐ zǎi,shì,tā,zhàng,fù,xiān,xiān,tuō chà duó,hóng,tóng,rèn,qiān,gǎn hàn,yì gē,bó,dài,líng lǐng lìng,yǐ,chào,cháng zhǎng,sā,cháng,yí,mù,mén,rèn,fǎn,chào miǎo,yǎng áng,qián,zhòng,pǐ pí,wò,wǔ,jiàn,jià jiè jie,yǎo fó,fēng,cāng,rèn rén,wáng,fèn bīn,dī,fǎng,zhōng,qǐ,pèi,yú,diào,dùn,wěn,yì,xǐn,kàng,yī,jí,ài,wǔ,jì qí,fú,fá,xiū xǔ,jìn yín,pī,dǎn,fū,tǎng,zhòng,yōu,huǒ,huì kuài,yǔ,cuì,yún,sǎn,wěi,chuán zhuàn,chē jū,yá,qiàn,shāng,chāng,lún,cāng chen,xùn,xìn,wěi,zhù,chǐ,xián xuán,nú nǔ,bó bǎi bà,gū gù,nǐ,nǐ nì,xiè,bàn,xù,líng,zhòu,shēn,qū,sì cì,bēng,sì shì,qié jiā gā,pī,yì,sì,yǐ chì,zhēng,diàn tián,hān gàn,mài,dàn,zhù,bù,qū,bǐ,zhāo shào,cǐ,wèi,dī,zhù,zuǒ,yòu,yǎng,tǐ tī bèn,zhàn diān,hé hē hè,bì,tuó,shé,yú,yì dié,fó fú bì bó,zuò,gōu kòu,nìng,tóng,nǐ,xiān,qú,yōng yòng,wǎ,qiān,yòu,kǎ,bāo,pèi,huí huái,gé,lǎo,xiáng,gé,yáng,bǎi,fǎ,mǐng,jiā,èr nài,bìng,jí,hěn,huó,guǐ,quán,tiāo,jiǎo,cì,yì,shǐ,xíng,shēn,tuō,kǎn,zhí,gāi,lái,yí,chǐ,kuǎ,gōng,lì,yīn,shì,mǐ,zhū,xù,yòu,ān,lù,móu,ér,lún,dòng tóng tǒng,chà,chì,xùn,gōng gòng,zhōu,yī,rú,cún jiàn,xiá,sì,dài,lǚ,ta,jiǎo yáo,zhēn,cè zè zhāi,qiáo,kuài,chái,nìng,nóng,jǐn,wǔ,hóu hòu,jiǒng,chěng tǐng,zhèn zhēn,zuò,hào,qīn,lǚ,jú,shù dōu,tǐng,shèn,tuó tuì,bó,nán,xiāo,biàn pián,tuǐ,yǔ,xì,cù,é,qiú,xú,guàng,kù,wù,jùn,yì,fǔ,liáng,zǔ,qiào xiào,lì,yǒng,hùn,jìng,qiàn,sàn,pěi,sú,fú,xī,lǐ,fǔ,pīng,bǎo,yú yù shù,sì qí,xiá,xìn shēn,xiū,yǔ,dì,chē jū,chóu,zhì,yǎn,liǎ,lì,lái,sī,jiǎn,xiū,fǔ,huò,jù,xiào,pái,jiàn,biào,chù tì,fèi,fèng,yà,ǎn,bèi,yù,xīn,bǐ,hǔ chí,chāng,zhī,bìng,jiù,yáo,cuì zú,liǎ,wǎn,lái,cāng,zǒng,gè gě,guān,bèi,tiǎn,shū,shū,mén,dǎo dào,tán tàn,jué juè,chuí,xìng,péng,tǎng cháng,hòu,yǐ,qī,tì,gàn,liàng jìng,jiè,suī,chàng chāng,jié,fǎng,zhí,kōng kǒng,juàn,zōng,jù,qiàn,ní,lún,zhuō,wō wēi,luǒ,sōng,lèng,hùn,dōng,zì,bèn,wǔ,jù,nǎi,cǎi,jiǎn,zhài,yē,zhí,shà,qīng,nìng,yīng,chēng chèn,qián,yǎn,ruǎn,zhòng tóng,chǔn,jiǎ jià,jì jié,wěi,yú,bǐng bìng,ruò,tí,wēi,piān,yàn,fēng,tǎng dàng,wò,è,xié,chě,shěng,kǎn,dì,zuò,chā,tíng,bèi,xiè,huáng,yǎo,zhàn,chǒu qiào,ān,yóu,jiàn,xū,zhā,cī,fù,bī,zhì,zǒng,miǎn,jí,yǐ,xiè,xún,cāi sī,duān,cè zè zhāi,zhēn,ǒu,tōu,tōu,bèi,zá zǎ,lǚ lóu,jié,wěi,fèn,cháng,kuǐ guī,sǒu,zhì sī,sù,xiā,fù,yuàn yuán,rǒng,lì,nù,yùn,jiǎng gòu,mà,bàng,diān,táng,hào,jié,xī xì,shān,qiàn jiān,què jué,cāng chen,chù,sǎn,bèi,xiào,róng,yáo,tà tàn,suō,yǎng,fá,bìng,jiā,dǎi,zài,tǎng,gǔ,bīn,chǔ,nuó,cān càn,lěi,cuī,yōng,zāo cáo,zǒng,péng,sǒng,ào,chuán zhuàn,yǔ,zhài,qī còu,shāng,chuǎng,jìng,chì,shǎ,hàn,zhāng,qīng,yān yàn,dì,xiè,lǚ lóu,bèi,piào biāo,jǐn jìn,liàn,lù,màn,qiān,xiān,tǎn tàn,yíng,dòng,zhuàn,xiàng,shàn,qiáo,jiǒng,tuǐ tuí,zǔn,pú,xī,láo,chǎng,guāng,liáo,qī,chēng dēng,zhàn zhuàn chán,wěi,jī,bō,huì,chuǎn,tiě jiàn,dàn,jiǎo yáo,jiù,sēng,fèn,xiàn,yù jú,è wù wū,jiāo,jiàn,tóng zhuàng,lǐn,bó,gù,xiān,sù,xiàn,jiāng,mǐn,yè,jìn,jià jie,qiào,pì,fēng,zhòu,ài,sài,yí,jùn,nóng,chán tǎn shàn,yì,dāng dàng,jǐng,xuān,kuài,jiǎn,chù,dān dàn,jiǎo,shǎ,zài,càn,bīn bìn,án àn,rú,tái,chóu,chái,lán,nǐ yì,jǐn,qiàn,méng,wǔ,níng,qióng,nǐ,cháng,liè,lěi,lǚ,kuǎng,bào,yù,biāo,zǎn,zhì,sì,yōu,háo,qìng,chèn,lì,téng,wěi,lǒng lóng lòng,chǔ,chán chàn,ráng xiāng,shū,huì xié,lì,luó,zǎn,nuó,tǎng,yǎn,léi,nàng nāng,ér,wù,yǔn,zān,yuán,xiōng,chōng,zhào,xiōng,xiān,guāng,duì ruì yuè,kè,duì ruì yuè,miǎn,tù,cháng zhǎng,ér,duì ruì yuè,ér,qīn,tù,sì,yǎn,yǎn,shǐ,shí kè,dǎng,qiān,dōu,fēn,máo,shēn,dōu,bǎi kè,jīng,lǐ,huǎng,rù,wáng,nèi,quán,liǎng,yú shù,bā,gōng,liù lù,xī,han,lán,gòng gōng,tiān,guān,xīng xìng,bīng,qí jī,jù,diǎn,zī cí,fēn,yǎng,jiān,shòu,jì,yì,jì,chǎn,jiōng,mào,rǎn,nèi nà,yuán,mǎo,gāng,rǎn,cè,jiōng,cè,zài,guǎ,jiǒng,mào,zhòu,mào mò,gòu,xú,miǎn,mì,rǒng,yín yóu,xiě,kǎn,jūn,nóng,yí,mí,shì,guān guàn,měng,zhǒng,zuì,yuān,míng,kòu,lín,fù,xiě,mì,bīng,dōng,tài,gāng,féng píng,bīng,hù,chōng chòng,jué,yà,kuàng,yě,lěng,pàn,fā,mǐn,dòng,xiǎn,liè,qià,jiān,jìng chēng,sōu,měi,tú,qī,gù,zhǔn,sōng,jìng chēng,liáng liàng,qìng,diāo,líng,dòng,gàn,jiǎn,yīn,còu,ái,lì,cāng,mǐng,zhǔn,cuī,sī,duó,jìn,lǐn,lǐn,níng,xī,dú,jī jǐ,fán,fán,fán,fèng,jū,chù chǔ,zhēng,fēng,mù,zhǐ,fú,fēng,píng,fēng,kǎi,huáng,kǎi,gān,dèng,píng,kǎn qiǎn,xiōng,kuài,tū,āo wā,chū,jī,dàng,hán,hán,záo,dāo,diāo,dāo,rèn,rèn,chuāng,fēn fèn,qiē qiè,yì,jī,kān,qiàn,cǔn,chú,wěn,jī,dǎn,xíng,huá huà,wán,jué,lí,yuè,liè,liú,zé,gāng,chuàng chuāng,fú,chū,qù,diāo,shān,mǐn,líng,zhōng,pàn,bié biè,jié,jié,páo bào,lì,shān,bié biè,chǎn chàn,jǐng,guā,gēng,dào,chuàng,kuī,kū,duò,èr,zhì,shuā shuà,quàn xuàn,chà shā,cì cī,kè,jié,guì,cì,guì,kǎi,duò,jì,tì,jǐng,dōu,luǒ,zé,yuān,cuò,xiāo xuē,kēi kè,là lá,qián,chà shā,chuàng,guǎ,jiàn,cuò,lí,tī,fèi,pōu,chǎn chàn,qí,chuàng,zì,gāng,wān,bāo bō,jī,duō,qíng,yǎn shàn,dū zhuó,jiàn,jì,bāo bō,yān,jù,huò,shèng,jiǎn,duó,zhì duān,wū,guǎ,fù pì,shèng,jiàn,gē,dá zhá,kǎi,chuàng chuāng,chuán,chǎn,tuán zhuān,lù jiū,lí,pēng,shān,piāo,kōu,jiǎo chāo,guā,qiāo,jué,huá huà,zhā zhá,zhuó,lián,jù,pī pǐ,liú,guì,jiǎo chāo,guì,jiàn,jiàn,tāng,huō,jì,jiàn,yì,jiàn,zhì,chán,zuān,mó,lí,zhú,lì,yà,quàn,bàn,gōng,jiā,wù,mài,liè,jìn jìng,kēng,xié liè,zhǐ,dòng,zhù chú,nǔ,jié,qú,shào,yì,zhǔ,miǎo,lì,jìn jìng,láo,láo,juàn,kǒu,yáng,wā,xiào,móu,kuāng,jié,liè,hé,shì,kè,jìn jìng,gào,bó bèi,mǐn,chì,láng,yǒng,yǒng,miǎn,kè,xūn,juàn juān,qíng,lù,bù,měng,chì,lè lēi,kài,miǎn,dòng,xù,xù,kān,wù,yì,xūn,wěng yǎng,shèng,láo,mù,lù,piāo,shì,jì,qín,jiàng,jiǎo chāo,quàn,xiàng,yì,qiāo,fān,juān,tóng dòng,jù,dān,xié,mài,xūn,xūn,lǜ,lì,chè,ráng xiāng,quàn,bāo,sháo,yún,jiū,bào,gōu gòu,wù,yún,none,xiōng,gài,gài,bāo,cōng,yì,xiōng,pēng,jū,táo yáo,gé,pú,è,páo,fú,gōng,dá,jiù,gōng,bǐ,huà huā,běi bèi,nǎo,chí shi,fāng,jiù,yí,zā,jiàng,kàng,jiàng,kuāng,hū,xiá,qū,fán,guǐ,qiè,zāng cáng,kuāng,fěi,hū,yǔ,guǐ,kuì guì,huì,dān,kuì guì,lián,lián,suǎn,dú,jiù,jué,xì,pǐ,qū ōu,yī,kē qià,yǎn yàn,biǎn,nì,qū ōu,shí,xùn,qiān,niàn,sà,zú,shēng,wǔ,huì,bàn,shì,xì,wàn,huá huà huā,xié,wàn,bēi,zú cù,zhuó,xié,dān shàn chán,mài,nán nā,dān,jí,bó,shuài lǜ,bǔ bo,guàn kuàng,biàn,bǔ,zhān zhàn,qiǎ kǎ,lú,yǒu,lǔ,xī,guà,wò,xiè,jié,jié,wèi,yǎng áng,qióng,zhī,mǎo,yìn,wēi,shào,jí,què,luǎn,chǐ,juàn juǎn,xiè,xù,jǐn,què,wù,jí,è,qīng,xī,sān,chǎng ān hàn,wēi yán,è,tīng,lì,zhé zhái,hàn àn,lì,yǎ,yā yà,yàn,shè,dǐ,zhǎ zhǎi,páng,none,qiè,yá,zhì shī,cè,máng,tí,lí,shè,hòu,tīng,zuī,cuò,fèi,yuán,cè,yuán,xiāng,yǎn,lì,jué,shà xià,diān,chú,jiù,jǐn,áo,guǐ,yàn,sī,lì,chǎng,qiān lán,lì,yán,yǎn,yuán,sī mǒu,gōng hóng,lín miǎo,róu qiú,qù,qù,none,lěi,dū,xiàn xuán,zhuān,sān,cān shēn cēn sān,cān shēn cēn sān,cān shēn cēn sān,cān shēn cēn sān,ài yǐ,dài,yòu,chā chá chǎ,jí,yǒu,shuāng,fǎn,shōu,guái,bá,fā fà,ruò,lì,shū,zhuó yǐ lì jué,qǔ,shòu,biàn,xù,jiǎ,pàn,sǒu,jí,wèi yù,sǒu,dié,ruì,cóng,kǒu,gǔ,jù gōu,lìng,guǎ,tāo dāo,kòu,zhī zhǐ,jiào,zhào shào,bā,dīng,kě kè,tái tāi,chì,shǐ,yòu,qiú,pǒ,yè xié,hào háo,sī,tàn,chǐ,lè,diāo,jī,none,hōng hóng,miē,xū yù,máng,chī,gè gě,xuān sòng,yāo,zǐ,hé gě,jí,diào,dòu cùn,tóng tòng,míng,hòu,lì,tǔ tù,xiàng,zhà zhā,xià hè,yē,lǚ,yā ā,ma má mǎ,ǒu,huō,yī,jūn,chǒu,lìn,tūn,yín,fèi,pǐ bǐ,qìn,qìn,jiè gè,bù,fǒu pǐ,bā ba,dūn,fēn,é huā,hán,tīng,háng kēng,shǔn,qǐ,hóng,zhī zī,yǐn shěn,wú,wú,chǎo chāo,nà nè,xuè chuò jué,xī,chuī,dōu rú,wěn,hǒu,hǒu hōng ōu,wú yù,gào,yā ya,jùn,lǚ,è,gé,wěn,dāi,qǐ,chéng,wú,gào,fū,jiào,hōng,chǐ,shēng,nà nè,tūn tiān,fǔ,yì,dāi,ǒu ōu òu,lì,bei bài,yuán yún yùn,wā guǎ guō,huá qì,qiāng qiàng,wū,è,shī,juǎn,pěn,wěn mǐn,ní ne,m,líng,rán,yōu,dǐ,zhōu,shì,zhòu,tiè chè,xì,yì,qì zhī,píng,zǐ cī,guā gū guǎ,zī cī,wèi,xǔ hǒu gòu,hē a kē,náo,xiā,pēi,yì,xiāo háo,shēn,hū,mìng,dá dàn,qū,jǔ zuǐ,xián gān,zā,tuō,duō,pǒu,páo,bì,fú,yǎng,hé hè,zǎ zé zhā,hé hè huó huò hú,hāi,jiù,yǒng,fù,dā,zhòu,wǎ,kǎ,gū,kā gā,zuo,bù,lóng,dōng,níng,tuō,sī,xiàn xián,huò,qì,èr,è,guāng,zhà,dié xī,yí,liě liē lié lie,zī,miē,mī,zhǐ,yǎo,jī xī qià,zhòu,kǎ luò gē,shù xún,zá zǎ,xiào,ké hāi,huī,kuā,huài shì,táo,xián,è àn,xuǎn xuān,xiū,wā guǎ guō,yān yàn yè,lǎo,yī,āi,pǐn,shěn,tóng,hōng hǒng hòng,xiōng,duō,wā wa,hā hǎ hà,zāi,yòu,diè dì,pài,xiǎng,āi,gén hěn,kuāng,yǎ yā,dā,xiāo,bì,yuě huì,nián,huá huā,xíng,kuài,duǒ,fēn,jì jiē zhāi,nóng,mōu,yō yo,hào,yuán yún yùn,lòng,pǒu,máng,gē,ó ò é,chī,shào,li lǐ lī,nǎ něi na né,zú,hè,kū,xiào,xiàn,láo,pò bā bō,zhé,zhā,liàng láng,bā,miē,liè lǜ,suī,fú,bǔ,hān,hēng,gěng,chuò yuè,gě jiā,yòu,yàn,gū,gū,bei bài,hán hàn,suō,chún,yì,āi ài,jiá qiǎn,tǔ tù,dàn xián yán,wǎn,lì,xī,táng,zuò,qiú,chē,wù wú ń,zào,yǎ,dōu,qǐ,dí,qìn,mà,none,gòng hǒng gǒng,dǒu,none,lào láo,liǎng,suǒ,zào,huàn,léng,shā,jī,zǔ,wō wěi,fěng,jìn yín,hǔ xià,qì,shòu,wéi,shuā,chàng,ér wā,lì,qiàng,ǎn,jiè zé jí,yō,niàn,yū,tiǎn,lài,shà,xī,tuò,hū,ái,zhōu zhāo tiào,gòu,kěn,zhuó,zhuó zhào,shāng,dí,hèng,lán lín,a ā á ǎ à,cǎi,qiāng,zhūn tūn xiāng duǐ,wǔ,wèn,cuì qi,shà jié dié tì,gǔ,qǐ,qǐ,táo,dàn,dàn,yuē wā,zǐ cǐ,bǐ tú,cuì,chuò chuài,hé,yǎ yā,qǐ,zhé,fēi,liǎng,xián,pí,shá,lā la,zé,qíng yīng,guà,pā,zé shì,sè,zhuàn,niè,guō,luō luó luo,yán,dī,quán,tān chǎn tuō,bo,dìng,lāng,xiào,none,táng,chì,tí,ān án,jiū,dàn,kā,yóng,wèi,nán,shàn,yù,zhé,lǎ,jiē,hóu,hǎn,dié zhá,zhōu,chái,wāi,nuò rě,huò guó xù,yīn,zá zǎ,yāo,ō wō,miǎn,hú,yǔn,chuǎn,huì,huàn,huàn yuán xuǎn hé,xǐ,hē hè yè,jī,kuì,zhǒng chuáng,wéi wèi,shà,xǔ,huáng,duó zhà,yán,xuān,liàng,yù,sāng sàng,chī,qiáo jiāo,yàn,dān shàn chán,pèn bēn,cān sūn qī,lí,yō yo,zhā chā,wēi,miāo,yíng,pēn pèn,bǔ,kuí,xí,yù,jiē,lóu lou,kù,zào qiāo,hù,tí,yáo,hè xiāo xiào hù,shà á,xiù,qiāng qiàng,sè,yōng,sù,gòng hǒng gǒng,xié,yì ài,suō,má mǎ ma,chā,hài,kē kè,tà dā,sǎng,chēn,rù,sōu,wā gǔ,jī,bēng pǎng,wū,xián qiàn qiè,shì,gé,zī,jiē,lào,wēng,wà,sì,chī,háo,suō,jiā lún,hāi hēi,suǒ,qín,niè,hē,zi,sǎi,ň,gě,ná,diǎ,ǎi ài āi,qiāng,tōng,bì,áo,áo,lián,zuī suī,zhē zhè zhù zhe,mò,sòu,sǒu,tǎn,dí,qī,jiào,chōng,jiào dǎo,kǎi gě,tàn,shān càn,cáo,jiā,ái,xiào,piāo,lóu lou,gā gá gǎ,gǔ,xiāo jiāo,hū,huì,guō,ǒu,xiān,zé,cháng,xū shī,pó,dē dēi,ma má,mà,hú,lei lē,dū,gā gá gǎ,tāng,yě,bēng,yīng,sāi,jiào,mì,xiào,huá huā,mǎi,rán,zuō,pēng,lào láo,xiào,jī,zhǔ,cháo zhāo,kuì,zuǐ,xiāo,sī,háo,fǔ ,liáo,qiáo qiào,xī,chù xù shòu,tān chǎn,dàn tán,hēi mò,xùn,ě,zūn,fān bo,chī,huī,zǎn,chuáng,cù zā hé,dàn,jué,tūn kuò,cēng,jiào,yē,xī,qì,háo,lián,xū shī,dēng,huī,yín,pū,juē,qín,xún,niè,lū,sī,yǎn,yīng,dā,zhān,ō,zhòu zhuó,jìn,nóng,yuě huì,xiè,qì,è,zào,yī,shì,jiào qiào chī,yuàn,ǎi ài āi,yōng yǒng,jué xué,kuài,yǔ,pēn pèn,dào,gá,xīn hěn hèn,dūn,dāng,xīn,sāi,pī,pǐ,yīn,zuǐ,níng,dí,làn,tà,huò ǒ,rú,hāo,hè xià,yàn,duō,xiù pì,zhōu chóu,jì jiē zhāi,jìn,háo,tì,cháng,xūn,mē,cā chā,tì,lū,huì,bó pào bào,yōu,niè,yín,hù,mèi me mò,hōng,zhé,lí,liú,xié hái,náng,xiāo,mō,yàn,lì,lú,lóng,pó,dàn,chèn,pín,pǐ,xiàng,huò,mè,xī,duǒ,kù,yán,chán,yīng,rǎng rāng,diǎn,lá,tà,xiāo,jiáo jué jiào,chuò,huàn huān,huò,zhuàn,niè,xiāo,zá cà,lí,chǎn,chài,lì,yì,luō luó luo,náng nāng,zá zàn cān,sū,xǐ,zèng,jiān,yàn zá niè,zhǔ,lán,niè,nāng,lǎn,luó luō luo,wéi guó,huí,yīn,qiú,sì,nín,jiǎn nān,huí,xìn,yīn,nān,tuán,tuán,dùn tún,kàng,yuān,jiǒng,piān,yún,cōng,hú,huí,yuán,é,guó,kùn,cōng,wéi tōng,tú,wéi,lún,guó,qūn,rì,líng,gù,guó,tāi,guó,tú,yòu,guó,yín,hùn,pǔ,yǔ,hán,yuán,lún,quān juàn juān,yǔ,qīng,guó,chuán chuí,wéi,yuán,quān juàn juān,kū,pǔ,yuán,yuán,yà,tuān,tú,tú,tuán,lüè,huì,yì,huán yuán,luán,luán,tǔ,yà,tǔ,tǐng,shèng,pú,lù,kuài,yā,zài,wéi xū,gē,yù zhūn,wū,guī,pǐ,yí,dì de,qiān sú,qiān,zhèn,zhuó,dàng,qià,xià,shān,kuàng,cháng chǎng,qí yín,niè,mò,jī,jiá,zhǐ,zhǐ zhì,bǎn,xūn,yì,qǐn,méi fén,jūn,rǒng kēng,tún dùn,fāng fáng,bèn fèn,bèn,tān,kǎn,huài pēi pī péi,zuò,kēng,bì,jǐng,dì làn,jīng,jì,kuài,dǐ,jīng,jiān,tán,lì,bà,wù,fén,zhuì,pō,pǎn bàn,táng,kūn,qū,tǎn,zhǐ,tuó,gān,píng,diàn,guà,ní,tái,pī,jiōng,yǎng,fó,ào,lù,qiū,mù mǔ,kē kě,gòu,xuè,fá,dǐ chí,chè,líng,zhù,fù,hū,zhì,chuí,lā,lǒng,lǒng,lú,ào,dài,páo,mín,xíng,dòng tóng,jì,hè,lǜ,cí,chǐ,lěi,gāi,yīn,hòu,duī,zhào,fú,guāng,yáo,duǒ duò,duǒ duò,guǐ,chá,yáng,yín,fá,gòu,yuán,dié,xié,kěn,shǎng,shǒu,è,bìng,diàn,hóng,yà,kuǎ,dá,kǎ,dàng,kǎi,háng,nǎo,ǎn,xīng,xiàn,yuàn huán,bāng,póu fú,bà,yì,yìn,hàn,xù,chuí,cén,gěng,āi,běng fēng,dì fáng,què jué,yǒng,jùn,xiá jiā,dì,mái mán,làng,juǎn,chéng,yán shān,qín jīn,zhé,liè,liè,pǔ bù,chéng,huā,bù,shí,xūn,guō,jiōng,yě,niàn,dī,yù,bù,yà,quán,suì sù,pí pì,qīng zhēng,wǎn wān,jù,lǔn,zhēng chéng,kōng,chǒng shǎng,dōng,dài,tán tàn,ǎn,cǎi cài,chù tòu,běng,xiàn kǎn,zhí,duǒ,yì shì,zhí,yì,péi,jī,zhǔn,qí,sào sǎo,jù,ní,kū,kè,táng,kūn,nì,jiān,duī,jīn,gāng,yù,è,péng bèng,gù,tù,lèng líng,fāng,yá,qiàn zàn jiàn,kūn,àn,shēn,duò huī,nǎo,tū,chéng,yīn,huán,bì,liàn,guō,dié,zhuàn,hòu,bǎo bǔ pù,bǎo,yú,dī,máo móu wǔ,jiē,ruán,è ài yè,gèng,kān,zōng,yú,huáng,è,yáo,yàn,bào,jí,méi,cháng chǎng,dǔ,tuó,yìn,féng,zhòng,jiè,jīn,fēng,gāng,chuǎn,jiǎn,píng,lěi,jiǎng,huāng,léng,duàn,wān,xuān,jì,jí,kuài,yíng,tā,chéng,yǒng,kǎi,sù,sù,shí,mì,tǎ,wěng,chéng,tú,táng,què,zhǒng,lì,péng,bàng,sāi sài sè,zàng,duī,tián,wù,zhèng,xūn,gé,zhèn,ài,gōng,yán,xiàn,tián zhèn,yuán,wēn,xiè,liù,hǎi,lǎng,cháng chǎng,péng,bèng,chén,lù,lǔ,ōu qiū,qiàn zàn jiàn,méi,mò,zhuān tuán,shuǎng,shú,lǒu,chí,màn,biāo,jìng,qī,shù,zhì dì,zhàng,kàn,yōng,diàn,chěn,zhǐ zhuó,xì,guō,qiǎng,jìn,dì,shāng,mù,cuī,yàn,tǎ,zēng,qián,qiáng,liáng,wèi,zhuì,qiāo,zēng,xū,shàn,shàn,fá,pú,kuài tuí,tuǎn dǒng,fán,qiáo què,mò,dūn,dūn,zūn dūn,dì,shèng,duò huī,duò,tán,dèng,wú,fén,huáng,tán,dā,yè,zhù,jiàn,ào,qiáng,jī,qiāo áo,kěn,yì tú,pí,bì,diàn,jiāng,yě,yōng,xué bó jué,tán,lǎn,jù,huài,dàng,rǎng,qiàn,xūn,xiàn làn,xǐ,hè,ài,yā yà,dǎo,háo,ruán,jìn,lěi,kuàng,lú,yán,tán,wéi,huài,lǒng,lǒng,ruǐ,lì,lín,rǎng,chán,xūn,yán,lěi,bà,wān,shì,rén,san,zhuàng,zhuàng,shēng,yī,mài,ké qiào,zhù,zhuàng,hú,hú,kǔn,yī,hú,xù,kǔn,shòu,mǎng,cún,shòu,yī,zhǐ zhōng,gǔ yíng,chǔ chù,jiàng xiáng,féng fēng páng,bèi,zhāi,biàn,suī,qūn,líng,fù,cuò,xià,xiòng xuàn,xiè,náo,xià,kuí,xī,wài,yuàn wǎn wān yuān,mǎo wǎn,sù,duō,duō,yè,qíng,wài,gòu,gòu,qì,mèng,mèng,yín,huǒ,chěn,dà dài tài,cè,tiān,tài,fū fú,guài,yāo,yāng,hāng bèn,gǎo,shī,tāo běn,tài,tóu tou,yǎn tāo,bǐ,yí,kuā kuà,jiā jiá gā xiá,duó,huà,kuǎng,yǔn,jiā jiá gā xiá,bā,ēn,lián,huàn,dī tì,yǎn yān,pào,juàn,qí jī,nài,fèng,xié,fèn,diǎn,quān juàn,kuí,zòu,huàn,qì qiè xiè,kāi,shē chǐ zhà,bēn bèn,yì,jiǎng,tào,zàng zhuǎng,běn,xī,huǎng,fěi,diāo,xùn zhuì,bēng,diàn,ào,shē,wěng,pò hǎ tǎi,ào yù,wù,ào yù,jiǎng,lián,duó,yūn,jiǎng,shì,fèn,huò,bì,luán,duǒ chě,nǚ rǔ,nú,dǐng dīng tiǎn,nǎi,qiān,jiān,tā jiě,jiǔ,nuán,chà,hǎo hào,xiān,fàn,jǐ,shuò,rú,fēi pèi,wàng,hóng,zhuāng,fù,mā,dān,rèn,fū yōu,jìng,yán,hài jiè,wèn,zhōng,pā,dù,jì,kēng háng,zhòng,yāo,jìn,yún,miào,fǒu pēi pī,chī,yuè jué,zhuāng,niū,yàn,nà nàn,xīn,fén,bǐ,yú,tuǒ,fēng,wàn yuán,fáng,wǔ,yù,guī,dù,bá,nī,zhóu,zhuó,zhāo,dá,nǐ nǎi,yuàn,tǒu,xián xuán xù,zhí yì,ē,mèi,mò,qī qì,bì,shēn,qiè,ē,hé,xǔ xū,fá,zhēng,mín,bàn,mǔ,fū fú,líng,zǐ,zǐ,shǐ,rǎn,shān shàn,yāng,mán,jiě,gū,sì,xìng,wěi wēi,zī,jù,shān shàn,pīn,rèn,yáo,dòng,jiāng,shū,jí,gāi,xiàng,huá huó,juān,jiāo xiáo,gòu dù,mǔ lǎo,jiān,jiān,yí,nián niàn,zhí,zhěn,jī,xiàn,héng,guāng,jūn xún,kuā hù,yàn,mǐng,liè,pèi,è yà,yòu,yán,chà,shēn xiān,yīn,shí,guǐ,quán,zī,sōng,wēi,hóng,wá,lóu,yà,ráo rǎo,jiāo,luán,pīng,xiàn,shào shāo,lǐ,chéng shèng,xiē,máng,fū,suō,wǔ mǔ,wěi,kè,chuò lài,chuò,tǐng,niáng,xíng,nán,yú,nà nuó,pōu bǐ,něi suī,juān,shēn,zhì,hán,dì,zhuāng,é,pín,tuì,mǎn,miǎn,wú wù yú,yán,wǔ,xī āi,yán,yú,sì,yú,wā,lì,xián,jū,qǔ,zhuì shuì,qī,xián,zhuó,dōng dòng,chāng,lù,ǎi ái è,ē ě,ē,lóu,mián,cóng,pǒu péi bù,jú,pó,cǎi,líng,wǎn,biǎo,xiāo,shū,qǐ,huī,fù fàn,wǒ,wǒ,tán,fēi,fēi,jié,tiān,ní nǐ,quán juàn,jìng,hūn,jīng,qiān jǐn,diàn,xìng,hù,wān wà,lái lài,bì,yīn,zhōu chōu,chuò nào,fù,jìng,lún,nüè,lán,hùn kūn,yín,yà,jū,lì,diǎn,xián,huā,huà,yīng,chán,shěn,tíng,dàng yáng,yǎo,wù,nàn,ruò chuò,jiǎ,tōu yú,xù,yù yú,wéi wěi,dì tí,róu,měi,dān,ruǎn nèn,qīn,huī,wò,qián,chūn,miáo,fù,jiě,duān,yí pèi,zhòng,méi,huáng,mián miǎn,ān,yīng,xuān,jiē,wēi,mèi,yuàn yuán,zhēng,qiū,tí,xiè,tuó duò,liàn,mào,rǎn,sī,piān,wèi,wā,cù,hú,ǎo,jié,bǎo,xū,tōu yú,guī,chú zòu,yáo,pì,xí,yuán,yìng,róng,rù,chī,liú,měi,pán,ǎo,mā,gòu,kuì,qín shēn,jià,sǎo,zhēn zhěn,yuán,jiē suǒ,róng,míng mǐng,yīng,jí,sù,niǎo,xián,tāo,páng,láng,nǎo,biáo,ài,pì,pín,yì,piáo piāo,yù,léi,xuán,màn,yī,zhāng,kāng,yōng,nì,lí,dí,guī,yān,jǐn jìn,zhuān,cháng,zé,hān nǎn,nèn,lào,mó,zhē,hù,hù,ào,nèn,qiáng,mā má,piè,gū,wǔ,qiáo,tuǒ,zhǎn,miáo,xián,xián,mò,liáo,lián,huà,guī,dēng,zhí,xū,yī,huà,xī,kuì,ráo rǎo,xī,yàn,chán,jiāo,měi,fàn,fān,xiān yǎn jìn,yì,huì,jiào,fù,shì,bì,shàn,suì,qiáng,liǎn,huán xuān qióng,xīn,niǎo,dǒng,yǐ,cān,ài,niáng,níng,mó,tiǎo,chóu,jìn,cí,yú,pín,róng,rú,nǎi,yān yàn,tái,yīng,qiàn,niǎo,yuè,yíng,mián,bí,mó,shěn,xìng,nì,dú,liǔ,yuān,lǎn,yàn,shuāng,líng,jiǎo,niáng,lǎn,xiān qiān,yīng,shuāng,xié huī,huān quán,mǐ,lí lì,luán,yǎn,zhú chuò,lǎn,zǐ,jié,jué,jué,kǒng,yùn,zī mā,zì,cún,sūn xùn,fú,bèi,zī,xiào,xìn,mèng,sì,tāi,bāo,jì,gū,nú,xué,yòu niū,zhuǎn,hái,luán,sūn xùn,nāo,miē,cóng,qiān,shú,chán càn,yā,zī,nǐ,fū,zī,lí,xué,bò,rú,nái,niè,niè,yīng,luán,mián,níng nìng zhù,rǒng,tā,guǐ,zhái,qióng,yǔ,shǒu,ān,tū jiā,sòng,wán,ròu,yǎo,hóng,yí,jǐng,zhūn,mì fú,zhǔ,dàng,hóng,zōng,guān,zhòu,dìng,wǎn yuān,yí,bǎo,shí,shí,chǒng,shěn,kè,xuān,shì,yòu,huàn,yí,tiǎo,shǐ,xiàn,gōng,chéng,qún,gōng,xiāo,zǎi,zhà,bǎo shí,hài,yàn,xiāo,jiā jia jie,shěn,chén,róng,huāng huǎng,mì,kòu,kuān,bīn,sù xiǔ xiù,cǎi cài,zǎn,jì,yuān,jì,yín,mì,kòu,qīng,hè,zhēn,jiàn,fù,níng nìng,bǐng bìng,huán,mèi,qǐn,hán,yù,shí,níng nìng,jìn qǐn,níng nìng,zhì,yǔ,bǎo,kuān,níng nìng,qǐn,mò,chá,jù lóu,guǎ,qǐn,hū,wù,liáo,shí,níng nìng,zhài,shěn,wěi,xiě xiè,kuān,huì,liáo,jùn,huán,yì,yí,bǎo,qīn qìn,chǒng,bǎo,fēng,cùn,duì,sì,xún,dǎo,lüè luó,duì,shòu,pǒ,fēng,zhuān,fū,shè yè yì,kēi kè,jiāng jiàng,jiāng jiàng,zhuān,wèi yù,zūn,xún,shù zhù,duì,dǎo,xiǎo,jié jí,shǎo shào,ěr,ěr,ěr,gǎ,jiān,shú,chén,shàng,shàng,mó,gá,cháng,liáo,xiǎn,xiǎn,hùn,yóu,wāng,yóu,liào,liào,yáo,lóng máng méng páng,wāng,wāng,wāng,gà,yáo,duò,kuì kuǐ,zhǒng,jiù,gān,gǔ,gān,tuí,gān,gān,shī,yǐn,chǐ chě,kāo,ní,jìn jǐn,wěi yǐ,niào suī,jú,pì,céng,xì,bī,jū,jiè,tián,qū,tì,jiè,wū,diǎo,shī,shǐ,píng bǐng,jī,xiè,zhěn,xì,ní,zhǎn,xī,wěi,mǎn,ē,lòu,pǐng bǐng,tì,fèi,shǔ zhǔ,xiè tì,tú,lǚ,lǚ,xǐ,céng,lǚ,jù,xiè,jù,juē,liáo,juē,shǔ zhǔ,xì,chè cǎo,tún zhūn,nì jǐ,shān,wā,xiān,lì,àn,huì,huì,hóng lóng,yì,qǐ,rèn,wù,hàn àn,shēn,yǔ,chū,suì,qǐ kǎi,none,yuè,bǎn,yǎo,áng,yá,wù,jié,è,jí,qiān,fén,wán,qí,cén,qián,qí,chà,jiè,qū,gǎng,xiàn,ào,lán,dǎo,bā,zuò,zuò,yǎng,jù,gāng,kě,gǒu,xuè,pō,lì,tiáo,jū jǔ,yán,fú,xiù,jiǎ,lǐng líng,tuó,pī,ào,dài,kuàng,yuè,qū,hù,pò,mín,àn,tiáo,lǐng líng,dī,píng,dōng,zhān,kuī,xiù,mǎo,tóng,xué,yì,biàn,hé,kè bā,luò,é,fù niè,xún,dié,lù,ěn,ér,gāi,quán,tóng dòng,yí,mǔ,shí,ān,wéi,huán,zhì shì,mì,lǐ,fǎ,tóng,wéi,yòu,qiǎ,xiá,lǐ,yáo,jiào qiáo,zhēng,luán,jiāo,é,é,yù,xié yé,bū,qiào,qún,fēng,fēng,náo,lǐ,yōu,xiàn,róng,dǎo,shēn,chéng,tú,gěng,jùn,gào,xiá,yín,wú,lǎng,kàn,láo,lái,xiǎn,què,kōng,chóng,chóng,tà,lín,huà,jū,lái,qí,mín,kūn,kūn,zú cuì,gù,cuī,yá,yá,gǎng gāng,lún,lún,líng léng,jué,duǒ,zhēng,guō,yín,dōng dòng,hán,zhēng,wěi,xiáo,pí bǐ,yān,sōng,jié,bēng,zú,jué,dōng,zhǎn chán,gù,yín,zī,zè,huáng,yú,wǎi wēi,yáng dàng,fēng,qiú,yáng,tí,yǐ,zhì shì,shì dié,zǎi,yǎo,è,zhù,kān zhàn,lǜ,yǎn,měi,hán,jī,jī,huàn,tíng,shèng,méi,qiàn kàn,wù máo,yú,zōng,lán,kě jié,yán,yán,wēi wěi,zōng,chá,suì,róng,kē,qīn,yú,qí,lǒu,tú,cuī,xī,wěng,cāng,dàng táng,róng yíng,jié,kǎi ái,liú,wù,sōng,kāo qiāo,zī,wéi,bēng,diān,cuó,qīn qiǎn,yǒng,niè,cuó,jǐ,shí,ruò,sǒng,zǒng,jiàng,liáo,kāng,chǎn,dié dì,cēn,dǐng,tū,lǒu,zhàng,zhǎn chán,zhǎn chán,áo ào,cáo,qū,qiāng,wěi,zuǐ,dǎo,dǎo,xí,yù,pǐ pèi,lóng,xiàng,céng,bō,qīn,jiāo,yān,láo,zhàn,lín,liáo,liáo,qín,dèng,tuò,zūn,jiào qiáo,jué guì,yáo,jiāo,yáo,jué,zhān shàn,yì,xué,náo,yè,yè,yí,niè,xiǎn,jí,xiè jiè,kě jié,guī xī juàn,dì,ào,zuì,wēi,yí,róng,dǎo,lǐng,jié,yǔ,yuè,yǐn,rū,jié,lì liè,guī xī juàn,lóng,lóng,diān,yíng hōng,xī,jú,chán,yǐng,kuī,yán,wēi,náo,quán,chǎo,cuán,luán,diān,diān,niè,yán,yán,yǎn,kuí,yǎn,chuān,kuài,chuān,zhōu,huāng,jīng xíng,xún,cháo,cháo,liè,gōng,zuǒ,qiǎo,jù,gǒng,none,wū,gū,gū,chà chā chāi cī,qiú,qiú,jǐ,yǐ,sì,bā,zhī,zhāo,xiàng hàng,yí,jǐn,xùn,juàn juǎn,bā,xùn,jīn,fú,zā,bì,shì,bù,dīng,shuài,fān,niè,shī,fēn,pà,zhǐ,xī,hù,dàn,wéi,zhàng,tǎng nú,dài,mò wà,pèi,pà,tiè tiě tiē,fú,lián,zhì,zhǒu,bó,zhì,dì,mò,yì,yì,píng,qià,juàn juǎn,rú,shuài,dài,zhēn,shuì,qiāo,zhēn,shī,qún,xí,bāng,dài,guī,chóu dào,píng,zhàng,jiǎn jiān sàn,wān,dài,wéi,cháng,shà qiè,qí jì,zé,guó,mào,zhǔ,hóu,zhēn,zhèng,mì,wéi,wò,fú,yì,bāng,píng,dié,gōng,pán,huǎng,tāo,mì,jià,téng,huī,zhōng,shān qiāo shēn,màn,mù,biāo,guó,zé,mù,bāng,zhàng,jǐng,chǎn chàn,fú,zhì,hū,fān,chuáng zhuàng,bì,bì,zhǎng,mì,qiāo,chān chàn,fén,méng,bāng,chóu dào,miè,chú,jié,xiǎn,lán,gān gàn,píng,nián,jiān,bìng bīng,bìng bīng,xìng,gàn,yāo,huàn,yòu,yōu,jī jǐ,guǎng ān,pǐ,tīng,zè,guǎng,zhuāng,mó mā me,qìng,bì,qín,dùn tún,chuáng,guǐ,yǎ,bài tīng,jiè,xù,lú,wǔ,zhuāng,kù,yīng yìng,dǐ de,páo,diàn,yā,miào,gēng,cì,fǔ,tóng,páng,fèi,xiáng,yǐ,zhì,tiāo,zhì,xiū,dù duó,zuò,xiāo,tú,guǐ,kù,máng méng páng,tíng,yóu,bū,bìng píng,chěng,lái,bēi,jī cuò,ān,shù,kāng,yōng,tuǒ,sōng,shù,qǐng,yù,yǔ,miào,sōu,cè,xiāng,fèi,jiù,è,guī wěi huì,liù,shà xià,lián,láng,sōu,zhì,bù,qǐng,jiù,jiù,jǐn qín,áo,kuò,lóu,yìn,liào,dài,lù,yì,chú,chán,tú,sī,xīn,miào,chǎng,wǔ,fèi,guǎng,kù,kuài,bì,qiáng sè,xiè,lǐn,lǐn,liáo,lú,jì,yǐng,xiān,tīng,yōng,lí,tīng,yǐn yìn,xún,yán,tíng,dí,pò pǎi,jiàn,huí,nǎi,huí,gǒng,niàn,kāi,biàn,yì,qì,nòng lòng,fèn,jǔ,yǎn,yì,zàng,bì,yì,yī,èr,sān,shì,èr,shì,shì,gōng,diào,yǐn,hù,fú,hóng,wū,tuí,chí,jiàng,bà,shěn,dì tì tuí,zhāng,jué zhāng,tāo,fǔ,dǐ,mí mǐ,xián,hú,chāo,nǔ,jìng,zhěn,yi,mǐ,juàn quān,wān,shāo,ruò,xuān yuān,jìng,diāo,zhāng,jiàng,qiáng qiǎng jiàng,péng,dàn tán,qiáng qiǎng jiàng,bì,bì,shè,dàn tán,jiǎn,gòu,gē,fā,bì,kōu,jiǎn,biè,xiāo,dàn tán,guō,qiáng qiǎng jiàng,hóng,mí mǐ,guō,wān,jué,jì xuě,jì,guī,dāng dàng,lù,lù,tuàn,huì,zhì,huì,huì,yí,yí,yí,yí,huò,huò,shān xiǎn,xíng,wén,tóng,yàn,yàn,yù,chī,cǎi,biāo,diāo,bīn,péng bāng,yǒng,piāo piào,zhāng,yǐng,chī,chì,zhuó bó,tuǒ yí,jí,páng fǎng,zhōng,yì,wǎng,chè,bǐ,dī,líng,fù,wǎng,zhēng,cú,wǎng,jìng,dài dāi,xī,xùn,hěn,yáng,huái,lǜ,hòu,wàng jiā wā,chěng zhèng,zhì,xú,jìng,tú,cóng,cóng,lài lái,cóng,dé děi de,pái,xǐ,dōng,jì,cháng,zhì,cóng zòng,zhōu,lái lài,yù,xiè,jiè,jiàn,shì tǐ,jiǎ xiá,biàn,huáng,fù,xún,wěi,páng,yáo,wēi,xī,zhēng,piào,tí chí,dé,zhǐ zhēng,zhǐ zhēng,bié,dé,zhǒng chōng,chè,jiǎo yáo,huì,jiǎo jiào,huī,méi,lòng lǒng,xiāng,bào,qú jù,xīn,xīn,bì,yì,lè,rén,dāo,dìng tìng,gǎi,jì,rěn,rén,chàn,tǎn,tè,tè tuī,gān hàn,yì qì,shì tài,cǔn,zhì,wàng,máng,xī liě,fān,yīng yìng,tiǎn,mǐn wěn mín,mǐn wěn mín,zhōng,chōng,wù,jí,wǔ,xì,jiá,yōu,wán,cōng,sōng zhōng,kuài,yù shū,biàn,zhì,qí shì,cuì,chén,tài,tún zhūn dùn,qián qín,niàn,hún,xiōng,niǔ,kuáng wǎng,xiān,xīn,kāng hàng,hū,kài xì,fèn,huái,tài,sǒng,wǔ,òu,chàng,chuàng,jù,yì,bǎo bào,chāo,mín mén,pēi,zuò zhà,zěn,yàng,kòu jù,bàn,nù,náo niú,zhēng,pà,bù,tiē zhān,hù gù,hù,cū jù zū,dá,lián,sī sāi,yóu chóu,dì,dài,yí,tū dié,yóu,fū,jí,pēng,xìng,yuàn,ní,guài,fú,xì,bì,yōu yào,qiè,xuàn,cōng,bǐng,huǎng,xù xuè,chù,bì pī,shù,xī shù,tān,yǒng,zǒng,duì,mì,zhǐ,yì,shì,nèn nín,xún,shì,xì,lǎo,héng,kuāng,móu,zhǐ,xié,liàn,tiāo yáo,huǎng,dié,hào,kǒng,guǐ,héng,xī qī xù,xiào jiǎo,shù,sī,hū kuā,qiū,yàng,huì,huí,chì,jiá,yí,xiōng,guài,lìn,huī,zì,xù,chǐ,shàng,nǜ,hèn,ēn,kè,dòng,tián,gōng,quán zhuān,xī,qià,yuè,pēng,kěn,dé,huì,è wù ě wū,qiū,tòng,yān,kǎi,cè,nǎo,yùn,máng,yǒng,yǒng,yuān juàn,pī pǐ,kǔn,qiǎo qiāo,yuè,yù shū,tú,jiè kè,xī,zhé,lìn,tì,hàn,hào jiào,qiè,tì,bù,yì,qiàn,huǐ,xī,bèi,mán mèn,yī yì,hēng hèng,sǒng,quān,chěng,kuī lǐ,wù,wù,yōu,lí,liàng,huàn,cōng,yì niàn,yuè,lì,nín,nǎo,è,què,xuán,qiān,wù,mǐn,cóng,fěi,bēi,dé,cuì,chàng,mèn mēn,lì,jì,guàn,guàn,xìng,dào,qī,kōng kǒng,tiǎn,lǔn lùn,xī,kǎn,gǔn,nì,qíng,chóu,dūn,guǒ,zhān,jīng,wǎn,yuān wǎn,jīn,jì,lán lín,yù xù,huò,hé hè,juàn quán,tán dàn,tì,tì,niàn,wǎng,chuò chuì,hū,hūn mèn,xī,chǎng,xīn,wéi,huì,è wù ě wū,suǒ ruǐ,zǒng,jiān,yǒng,diàn,jù,cǎn,chéng,dé,bèi,qiè,cán,dàn dá,guàn,duò,nǎo,yùn,xiǎng,zhuì,dié,huáng,chǔn,qióng,rě,xīng,cè,biǎn,mǐn,zōng,tí shì,qiǎo,chóu,bèi,xuān,wēi,gé,qiān,wěi,yù,yú tōu,bì,xuān,huàn,mǐn,bì,yì,miǎn,yǒng,qì kài,dàng shāng táng yáng,yīn,è,chén xìn dān,mào,kè qià,kè,yú,ài,qiè,yǎn,nuò,gǎn,yùn,còng sōng,sāi sī sǐ,lèng,fèn,yīng,kuì,kuì,què,gōng gòng hǒng,yún,sù,sù shuò,qí,yáo yào,sǒng,huàng,jí,gǔ,jù,chuàng,nì,xié,kǎi,zhěng,yǒng,cǎo,xùn,shèn,bó,kài xì,yuàn,xì xié,hùn,yǒng,yǎng,lì,cǎo sāo,tāo,yīn,cí,xù chù,qiàn qiè,tài,huāng,yùn,shèn,mǐng,gōng gòng hǒng,shè,cáo cóng,piāo,mù,mù,guó,chì,cǎn,cán,cán,cuī,mín,tè,zhāng,tòng,ào áo,shuǎng,màn,guàn,què,zào,jiù,huì,kǎi,lián liǎn,òu,sǒng,qín jìn jǐn,yìn,lǜ,shāng,wèi,tuán,mán,qiān,shè,yōng,qìng,kāng,dì chì,zhí zhé,lóu lǚ,juàn,qī,qī,yù,píng,liáo,còng,yōu,chōng,zhī zhì,tòng,chēng,qì,qū,péng,bèi,biē,qióng,jiāo,zēng,chì,lián,píng,kuì,huì,qiáo,chéng dèng zhèng,yìn,yìn,xǐ xī,xǐ,dàn dá,tán,duò,duì,duì dùn tūn,sù,jué,cè,xiāo jiāo,fān,fèn,láo,lào láo,chōng,hān,qì,xián xiàn,mǐn,jǐng,liǎo liáo,wǔ,cǎn,jué,cù,xiàn,tǎn,shéng,pī,yì,chù,xiān,náo nǎo náng,dàn,tǎn,jǐng jìng,sōng,hàn,jiǎo jǐ,wèi,xuān huān,dǒng,qín,qín,jù,cǎo sāo sào,kěn,xiè,yīng yìng,ào,mào,yì,lǐn,sè,jùn,huái,mèn,lǎn,ài,lǐn,yān,guō,xià,chì,yǔ yú,yìn,dāi,mèng méng měng,ài yì nǐ,méng měng,duì,qí jī jì,mǒ,lán xiàn,mèn,chóu,zhì,nuò,nuò,yān,yǎng,bó,zhì,kuàng,kuǎng,yōu yǒu,fū,liú liǔ,miè,chéng,huì,chàn,měng,lǎn,huái,xuán,ràng,chàn,jì,jù,huān,shè,yì,liàn,nǎn,mí mó,tǎng,jué,gàng zhuàng,gàng zhuàng,gàng zhuàng,gē,yuè,wù,jiān,xū,shù,róng,xì hū,chéng,wǒ,jiè,gē,jiān,qiāng,huò,qiāng qiàng,zhàn,dòng,qī,jiá,dié,zéi,jiá,jǐ,zhí,kān,jí,kuí,gài,děng,zhàn,qiāng qiàng,gē,jiǎn,jié,yù,jiǎn,yǎn,lù,xì hū,zhàn,xì hū,xì hū,chuō,dài,qú,hù,hù,hù,è,shì,tì,mǎo,hù,lì,fáng,suǒ,biǎn piān,diàn,jiōng,shǎng jiōng,yí,yǐ,shàn shān,hù,fēi,yǎn,shǒu,shǒu,cái,zā zhā zhá,qiú,lè lì cái,pū,bā pá,dǎ dá,rēng,fǎn fú,rù,zài,tuō,zhàng,diǎo dí yuē lì,káng gāng,yū wū,yū wū kū,hàn,shēn,chā,tuō chǐ yǐ,gǔ xì gē jié,kòu,wù,dèn,qiān,zhí,rèn,kuò,mén,sǎo sào,yáng,niǔ,bàn,chě,rǎo,xī chā qì,qián qín,bān,jiá,yú,fú,bā ào,xī zhé,pī,zhǐ,zhì sǔn kǎn,è,dèn,zhǎo,chéng,jì,yǎn,kuáng wǎng zài,biàn,chāo,jū,wěn,hú gǔ,yuè,jué,bǎ bà,qìn,dǎn shěn,zhěng,yǔn,wán,nè nì ruì nà,yì,shū,zhuā,póu,tóu,dǒu,kàng,zhē zhé shé,póu pōu fū,fǔ,pāo,bá,ǎo ào niù,zé,tuán,kōu,lūn lún,qiāng qiǎng chēng,yún,hù,bào,bǐng,zhǐ zhǎi,pēng,nán,bù pū,pī,tái,yǎo tāo,zhěn,zhā,yāng,bào,hē hè qiā,nǐ ní,yè,dǐ,chì,pī pēi,jiā,mǒ mò mā,mèi,chēn,yā,chōu,qū,mǐn,zhù,jiā yá,fú bì,zhǎ,zhǔ,dān dàn dǎn,chāi cā,mǔ,niān,lā lá,fǔ,pāo,bàn pàn,pāi,līn,ná,guǎi,qián,jù,tuò tà zhí,bá,tuō,tuō,ǎo ào niù,jū gōu,zhuō,pàn pīn fān,zhāo,bài,bài,dǐ,nǐ,jù,kuò,lǒng,jiǎn,qiǎ,yōng,lán,níng nǐng nìng,bō,zé zhái,qiān,hén,kuò guā,shì,jié jiá,zhěng,nǐn,gǒng,gǒng,quán,shuān,cún zùn,zā zǎn,kǎo,yí chǐ hài,xié,cè sè chuò,huī,pīn,zhuài zhuāi yè,shí shè,ná,bāi,chí,guà,zhì,kuò guāng,duò,duǒ duò,zhǐ,qiè,àn,nòng,zhèn,gé,jiào jiāo,kuà kū,dòng,rú ná,tiāo tiǎo,liè,zhā,lǚ,dié shè,wā,jué,liě,jǔ,zhì,luán,yà yǎ,zhuā wō,tà,xié jiā,náo,dǎng dàng,jiǎo,zhèng zhēng,jǐ,huī,xián,yǔ,āi ái,tuō shuì,nuó,cuò,bó,gěng,tǐ tì,zhèn,chéng,suō shā,suō shā,kēng qiān,měi,nòng,jú,bàng péng,jiǎn,yì,tǐng,shān,ruó,wǎn,xié jiā,chā,péng,jiǎo kù,wǔ,jùn,jiù,tǒng,kǔn,huò chì,tú shū chá,zhuō,póu pōu fū,luō lǚ,bā,hàn,shāo shào,niē,juān,zè,shù sǒng sōu,yé yú,jué zhuó,bǔ,wán,bù pú zhì,zùn,yè,zhāi,lǚ,sōu,tuō shuì,lāo,sǔn,bāng,jiǎn,huàn,dǎo,wěi,wàn wǎn wān yù,qín,pěng,shě,liè,mín,mén,fǔ fù bǔ,bǎi,jù jū,dáo,wǒ luò luǒ,ái,juǎn quán,yuè,zǒng,chēn,chuí,jié,tū,bèn,nà,niǎn niē,ruó wěi ré,zuó,wò xiá,qī,xiān,chéng,diān,sǎo sào,lūn lún,qìng qiàn,gāng,duō,shòu,diào,pǒu póu,dǐ,zhǎng,hùn,jǐ,tāo,qiā,qí,pái pǎi,shū,qiān wàn,líng,yè yē,yà yǎ,jué,zhēng zhèng,liǎng,guà,nǐ niè yì,huò xù,shàn yàn yǎn,zhěng dìng,lüè,cǎi,tàn,chè,bīng,jiē,tì,kòng,tuī,yǎn,cuò,zōu zhōu chōu,jū,tiàn,qián,kèn,bāi,pá,jiē,lǔ,guó,mìng,jié,zhì,dǎn shàn,mēng,chān xiān càn shǎn,sāo,guàn,pèng,yuàn,nuò,jiǎn,zhēng kēng,jiū yóu,jiǎn jiān,yú,yán,kuí,nǎn,hōng,róu,pì chè,wēi,sāi zǒng cāi,zòu,xuān,miáo,tí dī dǐ,niē,chā,shì,zǒng sōng,zhèn zhēn,yī,xún,huáng yóng,biǎn,yáng,huàn,yǎn,zǎn zuàn,ǎn,xū jū,yà,wò,ké qiā,chuǎi chuài chuāi tuán zhuī,jí,tì dì,là lá,là,chéng,kāi,jiū,jiū,tú,jiē qì,huī,gèn,chòng dǒng,xiāo,shé dié yè,xiē,yuán,qián jiàn jiǎn,yé,chā,zhā,bēi,yáo,wēi,bèng,lǎn,wèn,qìn,chān,gē gé,lǒu lōu,zǒng,gèn,jiǎo,gòu,qìn,róng,què,chōu zǒu,chuāi,zhǎn,sǔn,sūn,bó,chù,róng náng nǎng,bàng péng,cuō,sāo,kē è,yáo,dǎo,zhī,nù nuò nòu,lā xié xiàn,jiān,sōu,qiǔ,gǎo,xiǎn xiān,shuò,sǎng,jìn,miè,è,chuí,nuò,shān,tà,jié zhé,táng,pán bān pó,bān,dā,lì,tāo,hú,zhì nái,wā wǎ wà,huá,qiān,wèn,qiāng qiǎng chēng,tián shēn,zhēn,è,xié,ná nuò,quán,chá,zhà,gé,wǔ,èn,shè,gāng,shè niè,shū,bǎi,yáo,bìn,sōu,tān,sà shā shǎi,chǎn sùn,suō,jiū liú liáo jiǎo náo,chōng,chuāng,guó,bìng,féng pěng,shuāi,dì tú zhí,qì jì chá,sōu sǒng,zhāi,liǎn liàn,chēng,chī,guàn,lù,luò,lǒu lōu,zǒng,gài xì,hù chū,zhā,qiāng,tàng,huà,cuī,zhì nái,mó mā,jiāng qiàng,guī,yǐng,zhí,áo qiáo,zhì,niè chè,mán màn,chàn cán,kōu,chū,sè mí sù,tuán,jiǎo chāo,mō,mó,zhé,chān xiān càn shǎn,kēng qiān,biào biāo,jiàng,yáo,gòu,qiān,liào,jī,yīng,juē jué,piē,piē piě,lāo,dūn,xiàn,ruán,guì,zǎn zān zēn qián,yī,xián,chēng,chēng,sā sǎ,náo,hòng,sī,hàn,héng guàng,dā,zǔn,niǎn,lǐn,zhěng chéng,huī wéi,zhuàng,jiǎo,jǐ,cāo,dǎn,dǎn shàn,chè,bō,chě,juē,xiāo sōu,liāo liáo,bèn,fǔ,qiào,bō,cuō zuǒ,zhuó,zhuàn,wěi tuǒ,pū,qìn,dūn,niǎn,huá,xié,lū,jiǎo,cuān,tà,hàn,qiào yāo jī,zhuā wō,jiǎn,gǎn,yōng,léi lèi,nǎng,lǔ,shàn,zhuó,zé zhái,pǔ,chuò,jī,dǎng dàng,sè,cāo,qíng,qíng jǐng,huàn,jiē,qín,kuǎi,dān dàn,xié,qiā jiā yè,pǐ bò,bò bāi,ào,jù jū,yè,è,mēng,sòu sǒu,mí,jǐ,tái,zhuó,dǎo,xǐng,lǎn,cā,jǔ,yē,rǔ,yè,yè,nǐ,huò,jié,bìn,níng nǐng nìng,gē gé,zhì,zhì jié,kuò,mó,jiàn,xié,liè là,tān,bǎi,sòu sǒu,lū,lì luò yuè,rǎo,tī zhì zhāi,pān,yǎng,léi lèi,cā sǎ,shū,zǎn,niǎn,xiǎn,jùn pèi,huō,lì luò,là lài,huàn,yíng,lú luó,lǒng,qiān,qiān,zǎn cuán,qiān,lán,xiān jiān,yīng,méi,rǎng,chān,wěng,cuān,xié,shè niè,luó,jùn,mí mǐ mó,chī,zǎn cuán,luán,tān,zuàn,lì shài,diān,wā,dǎng,jiǎo,jué,lǎn,lì luǒ,nǎng,zhī,guì,guǐ guì,qī yǐ jī,xún,pū,pū,shōu,kǎo,yōu,gǎi,yǐ,gōng,gān hàn,bān,fàng,zhèng,pò,diān,kòu,mǐn,wù móu,gù,hé,cè,xiào,mǐ,chù shōu,gé guó è,dí,xù,jiào jiāo,mǐn,chén,jiù,shēn,duó duì,yǔ,chì,áo,bài,xù,jiào jiāo,duó duì,liǎn,niè,bì,chǎng,diǎn,duō què,yì,gǎn,sàn sǎn,kě,yàn,dūn duì,qī yǐ jī,tǒu,xiào xué,duō què,jiǎo,jìng,yáng,xiá,mǐn,shù shǔ shuò,ái zhú,qiāo,ái zhú,zhěng,dí,chén,fū,shù shǔ shuò,liáo,qū,xiòng xuàn,yǐ,jiǎo,shàn,jiǎo,zhuó zhú,yì dù,liǎn,bì,lí tái,xiào,xiào,wén,xué,qí,qí,zhāi,bīn,jué jiào,zhāi,láng,fěi fēi,bān,bān,lán,yǔ zhōng,lán,wěi mén,dǒu dòu,shēng,liào,jiǎ,hú,xié,jiǎ,yǔ,zhēn,jiào,wò guǎn,tǒu tiǎo,dòu,jīn,chì,yín zhì,fǔ,qiāng,zhǎn,qú,zhuó,zhǎn,duàn,zhuó,sī,xīn,zhuó,zhuó,qín,lín,zhuó,chù,duàn,zhú,fāng,chǎn jiè,háng,yú wū,shī,pèi,liú yóu,mèi,páng bàng,qí,zhān,máo mào,lǚ,pèi,pī bì,liú,fū,fǎng,xuán xuàn,jīng,jīng,nǐ,zú,zhào,yǐ,liú,shāo,jiàn,yú,yǐ,qí,zhì,fān,piāo,fān,zhān,kuài,suì,yú,wú,jì,jì,jì,huò,rì,dàn,jiù,zhǐ,zǎo,xié,tiāo,xún,xù,gā,lá,gàn hàn,hàn,tái yīng,dì dí de,xù xū,chǎn,shí,kuàng,yáng,shí,wàng,mín,mín,tūn zhùn,chūn,wù wǔ,yún,bèi,áng,zè,bǎn,jié,kūn,shēng,hù,fǎng,hào,guì,chāng,xuān,míng,hūn,fēn,qǐn,hū,yì,xī,xīn,yán,zè,fǎng,tán,shèn,jù,yáng,zǎn,bǐng,xīng,yìng,xuàn,pò,zhěn,líng,chūn,hào,mèi,zuó,mò,biàn,xù,hūn,zhāo,zòng,shì,shì,yù,fèi,dié yì,mǎo,nì,chǎng,wēn,dōng,ǎi,bǐng,áng,zhòu,lóng,xiǎn,kuàng,tiǎo,cháo,shí,huǎng huàng,huǎng,xuān,kuí,xù kuā,jiǎo,jìn,zhì,jìn,shǎng,tóng,hǒng,yàn,gāi,xiǎng,shài,xiǎo,yè,yùn yūn,huī,hán,hàn,jùn,wǎn,xiàn,kūn,zhòu,xī,shèng chéng,shèng,bū,zhé,zhé,wù,wǎn,huì,hào,chén,wǎn,tiǎn,zhuó,zuì,zhǒu,pǔ,jǐng yǐng,xī,shǎn,nǐ,xī,qíng,qǐ dù,jīng,guǐ,zhěng,yì,zhì,àn ǎn yǎn,wǎn,lín,liàng,chēng,wǎng wàng,xiǎo,zàn,fēi,xuān,xuǎn,yí,xiá,yùn yūn,huī,xǔ,mǐn mín,kuí,yē,yìng,shǔ dǔ,wěi,shǔ,qíng,mào,nán,jiǎn lán,nuǎn,àn,yáng,chūn,yáo,suǒ,pǔ,míng,jiǎo,kǎi,hào,wěng,chàng,qì,hào,yàn,lì,ài,jì,jì,mèn,zàn,xiè,hào,mù,mù,cōng,nì,zhāng,huì,bào pù,hàn,xuán,chuán,liáo,xiān,tǎn,jǐng,piē,lín,tūn,xī xǐ,yì,jì,huàng,dài,yè,yè,lì,tán,tóng,xiǎo,fèi,shěn,zhào,hào,yì,xiàng,xīng,shēn,jiǎo,bào,jìng,yàn,ài,yè,rú,shǔ,méng,xūn,yào,pù bào,lì,chén,kuàng,dié,liǎo,yàn,huò,lú,xī,róng,lóng,nǎng,luǒ,luán,shài,tǎng,yǎn,zhú,yuē,yuē,qū qǔ,yè,gēng gèng,yè,hū hù,hé,shū,cáo,cáo,shēng,màn,zēng céng,zēng céng,tì,zuì,cǎn qián jiàn,xù,huì kuài,yǐn,qiè hé,fēn,bì pí,yuè,yǒu yòu,ruǎn,péng,fén bān,fú fù,líng,fěi kū,qú xù chǔn,tì,nǜ gǎ,tiǎo,shuò,zhèn,lǎng,lǎng,juān zuī,míng,huāng máng wáng,wàng,tūn,zhāo cháo,jī,qī jī,yīng,zōng,wàng,tóng chuáng,lǎng,láo,méng,lóng,mù,pìn děng,wèi,mò,běn,zhá,shù shú zhú,shù shú zhú,none,zhū shú,rén,bā,pǔ pò pō piáo,duǒ,duǒ,dāo tiáo mù,lì,qiú guǐ,jī,jiū,bǐ,xiǔ,chéng chēng,cì,shā,rù,zá,quán,qiān,yú wū,gān gǎn,wū,chā chà,shā,xún,fán,wù,zǐ,lǐ,xìng,cái,cūn,rèn ér,sháo biāo,tuō zhé,dì duò,zhàng,máng,chì,yì,gū gài,gōng,dù,yí lì lí duò tuò,qǐ,shù,gàng gāng,tiáo tiāo,jié,mián,wàn,lái,jiǔ,máng,yáng,mà mǎ,miǎo,sì zhǐ xǐ,yuán wán,háng,fèi bèi,bēi,jié,dōng,gǎo,yǎo,xiān,chǔ,chūn,pá,shū duì,huà,xīn,niǔ chǒu,zhù,chǒu,sōng,bǎn,sōng,jí,wò yuè,jìn,gòu,jī,máo,pí,pī mì,wǎng,àng,fāng bìng,fén,yì,fú fū,nán,xī,hù dǐ,yā,dōu,xín,zhěn,yǎo yāo,lín,ruì,ě è,méi,zhào,guǒ,zhī qí,cōng zōng,yùn,huà,shēng,shū,zǎo,dì duò,lì,lú,jiǎn,chéng,sōng,qiāng,fēng,zhān,xiāo,xiān zhēn,kū,píng,sì tái,xǐ,zhǐ,guǎi,xiāo,jià,jiā,jǔ gǒu,bāo fú,mò,yì xiè,yè,yè,shì,niè,bǐ,tuó duò,yí duò lí,líng,bǐng,nǐ chì,lā,hé,pán bàn,fán,zhōng,dài,cí,yǎng yàng yāng yīng,fū fǔ fù,bǎi bó bò,mǒu,gān,qī,rǎn,róu,mào,sháo shào,sōng,zhè,xiá,yòu yóu,shēn,guì jǔ,tuò,zuò zhà,nán,níng,yǒng,dǐ chí,zhì dié,zhā zǔ zū,chá zhā,dàn,gū,bù pū,jiù,āo ào,fú,jiǎn,bā fú pèi bó biē,duò zuó wù,kē,nài,zhù,bì bié,liǔ,chái,shān,sì,zhù,bēi pēi,shì fèi,guǎi,chá zhā,yǎo,chēng,jiù,shì,zhī,liǔ,méi,lì,róng,zhà shān shi cè,zǎo,biāo,zhàn,zhì,lóng,dòng,lú,shēng,lì yuè,lán,yǒng,shù,xún,shuān,qì qiè,chén,qī xī,lì,yí,xiáng,zhèn,lì,sè,guā tiǎn,kān,bēn bīng,rěn,xiào jiào,bǎi,rěn,bìng,zī,chóu,yì xiè,cì,xǔ,zhū,jiàn zùn,zuì,ér,ěr,yǒu yù,fá,gǒng,kǎo,lǎo,zhān,liè,yīn,yàng,hé hú,gēn,zhī yì,shì,gé,zāi,luán,fú,jié,héng háng,guì,táo,guāng guàng,wéi,kuàng,rú,àn,ān,juàn,yí tí,zhuō,kū,zhì,qióng,tóng,sāng,sāng,huán,jié jú,jiù,xuè,duò,chuí,yú móu,zā zǎn,none,yīng,jié,liǔ,zhàn,yā,ráo náo,zhēn,dàng,qī,qiáo,huà,guì huì,jiǎng,zhuāng,xún,suō,shā,chén zhèn,bēi,tīng yíng,guā,jìng,bó,bèn fàn,fú,ruí,tǒng,jué,xī,láng,liǔ,fēng fèng,qī,wěn,jūn,gǎn,sù yìn,liáng,qiú,tǐng tìng,yǒu,méi,bāng,lòng,pēng,zhuāng,dì,xuān juān xié,tú chá,zào,āo yòu,gù,bì,dí,hán,zǐ,zhī,rèn ér,bèi,gěng,jiǎn,huàn,wǎn,nuó,jiā,tiáo tiāo,jì,xiāo,lǚ,kuǎn,shāo sào,chén,fēn,sōng,mèng,wú,lí,sì qǐ,dòu,qǐn,yǐng,suō,jū,tī,xiè,kǔn,zhuō,shū,chān yán,fàn,wěi,jìng,lí,bīn bīng,xià,fó,chóu táo dào,zhì,lái,lián liǎn,jiǎn,zhuō,líng,lí,qì,bǐng,lún,cōng sōng,qiàn,mián,qí,qí,cǎi,gùn hùn,chán,dé zhé,fěi,pái bèi pèi,bàng,bàng pǒu bèi bēi,hūn,zōng,chéng,zǎo,jí,lì liè,péng,yù,yù,gù,jùn,dòng,táng,gāng,wǎng,dì dài tì,què,fán,chēng,zhàn,qǐ,yuān,yǎn yàn,yù,quān juàn,yì,sēn,rěn shěn,chuí,léng lēng líng,qī,zhuō,fú sù,kē,lái,zōu sǒu,zōu,zhào zhuō,guān,fēn,fén,chēn shēn,qíng,ní nǐ,wǎn,guǒ,lù,háo,jiē qiè,yǐ yī,chóu zhòu diāo,jǔ,jú,chéng shèng,zú cuì,liáng,qiāng kōng,zhí,zhuī chuí,yā,jū,bēi,jiāo,zhuó,zī,bīn,péng,dìng,chǔ,chāng,mēn,huā,jiǎn,guī,xì,dú,qiàn,dào,guì,diǎn,luó,zhī,quān juàn quán,mìng,fǔ,gēng,pèng,shàn,yí,tuǒ,sēn,duǒ chuán,yē,fù,wěi huī,wēi,duàn,jiǎ jiā,zōng,jiān hán,yí,zhēn shèn,xí,yà,yǎn,chuán,jiān,chūn,yǔ,hé,zhā chá,wò,piān,bī,yāo,guō kuǎ,xū,ruò,yáng,là,yán,běn,huī,kuí,jiè,kuí,sī,fēng,xiē,tuǒ,jí zhì,jiàn,mù,máo,chǔ,kǔ hù,hú,liàn,léng,tíng,nán,yú,yóu yǒu,méi,sǒng cōng,xuàn yuán,xuàn,yǎng yàng yīng,zhēn,pián,dié yè,jí,jiē,yè,chǔ,shǔn dùn,yú,còu zòu,wēi,méi,dì dǐ shì,jí,jié,kǎi jiē,qiū,yíng,róu ròu,huáng,lóu,lè yuè,quán,xiāng,pǐn,shǐ,gài,tán,lǎn,wēn yùn,yú,chèn,lǘ,jǔ,shén,chū,bī pi,xiè,jiǎ,yì,zhǎn niǎn zhèn,fú fù bó,nuò,mì,láng,róng,gǔ,jiàn jìn,jǔ,tā,yǎo,zhēn,bǎng bàng,shā xiè,yuán,zǐ,míng,sù,jià,yáo,jié,huàng,gàn,fěi,zhà,qián,mà mā,sǔn,yuán,xiè,róng,shí,zhī,cuī,wēn,tíng,liú,róng,táng,què,zhāi,sì,shèng,tà,kē,xī,gù,qī,gǎo,gǎo,sūn,pán,tāo,gé,chūn,diān,nòu,jí,shuò,gòu,chuí,qiāng,chá,qiǎn lián xiàn,huái,méi,xù,gàng,gāo,zhuō,tuó,qiáo,yàng,diān zhěn zhēn,jiǎ,jiàn kǎn,zuì,dǎo,lóng,bīn bīng,zhū,sāng,xí dié,jī guī,lián liǎn,huì,róng yōng,qiàn,guǒ,gài,gài,tuán shuàn quán,huà,qì sè,sēn,cuī zhǐ,pèng,yǒu chǎo,hú,jiǎng,hù,huàn,guì,niè,yì,gāo,kāng,guī,guī,cáo,màn wàn,jǐn,dī,zhuāng,lè yuè yào lào,láng,chén,cōng zōng,lí chī,xiū,qíng,shǎng,fán,tōng,guàn,zé,sù,léi lěi,lǔ,liáng,mì,lóu,cháo jiǎo chāo,sù,kē,chū,táng,biāo,lù,jiū liáo,zhè,zhā,shū,zhāng,mán,mó mú,niǎo mù,yàng,tiáo,péng,zhù,shā xiè,xī,quán,héng hèng,jiān,cōng,jī,yān,qiáng,xuě,yīng,èr,xún,zhí,qiáo,zuī,cóng,pǔ,shù,huà,guì,zhēn,zūn,yuè,shàn,xī,chūn,diàn,fá fèi,gǎn,mó,wú,qiāo,ráo náo,lìn,liú,qiáo,xiàn,rùn,fǎn,zhǎn jiǎn,tuó,liáo,yún,shùn,tuí dūn,chēng,táng chēng,méng,jú,chéng,sù qiū,jué,jué,tán diàn,huì,jī,nuó,xiàng,tuǒ,níng,ruǐ,zhū,tóng chuáng,zēng céng,fén fèn fèi,qióng,rǎn yān,héng hèng,qián,gū,liǔ,lào,gāo,chú,xǐ,shèng,zǐ,zān,jǐ,dōu,jīng,lǔ,xiàn,cū chu,yuán,tà,shū qiāo,jiāng,tán,lǐn,nóng,yǐn,xí,huì,shān,zuì,xuán,chēng,gàn,jū,zuì,yì,qín,pǔ,yán,léi,fēng,huǐ,dàng,jì,suì,bò,píng bò,chéng,chǔ,zhuā,guì huì,jí,jiě,jiǎ,qíng,zhái shì tú,jiǎn,qiáng,dào,yǐ,biāo biǎo,sōng,shē,lǐn,lì,chá,méng,yín,chóu táo dǎo,tái,mián,qí,tuán,bīn bīng,huò,jì,qiān lián,nǐ mí,níng,yī,gǎo,jiàn kǎn,yǐn,nòu ruǎn rú,qǐng,yǎn,qí,mì,zhào,guì,chūn,jī jì,kuí,pó,dèng,chú,gé,mián,yōu,zhì,huǎng guǒ gǔ,qiān,lěi,léi lěi,sà,lǔ,lì,cuán,lǜ chū,miè mèi,huì,ōu,lǘ,zhì,gāo,dú,yuán,lì yuè,fèi,zhuó zhù,sǒu,lián liǎn,jiàng,chú,qìng,zhū,lú,yán,lì,zhū,chèn,jué jì,è,sū,huái guī,niè,yù,lóng,là lài,qiáo,xiǎn,guī,jǔ,xiāo,líng,yīng,jiān,yǐn,yòu yóu,yíng,xiāng,nóng,bó,chán zhàn,lán,jǔ,shuāng,shè,wéi zuì,cóng,quán,qú,cáng,jiù,yù,luó,lì,cuán,luán,dǎng,qú,yán,lǎn,lán,zhú,léi,lǐ,bà,náng,yù,líng,guàn,qiàn,cì,huān,xīn,yú,yù yì,qiān xiān,ōu,xū,chāo,chù qù xì,qì,kài ài,yì yīn,jué,xì kài,xù,hē,yù,kuài,láng,kuǎn,shuò sòu,xī,èi ǎi,qī,qī,xū chuā,chǐ chuài,qīn,kuǎn,kǎn qiàn,kuǎn,kǎn kè,chuǎn chuán,shà,guā,yān yīn,xīn,xiē,yú,qiàn,xiāo,yē,gē,wū,tàn,jìn qūn,ōu,hū,tì,huān,xū,pēn,xǐ,xiào,xū,xī shè,shàn,liǎn hān,chù,yì,è,yú,chuò,huān,zhǐ,zhèng zhēng,cǐ,bù,wǔ,qí,bù,bù,wāi,jù,qián,zhì chí,sè,chǐ,sè shà,zhǒng,suì,suì,lì,zé,yú,lì,guī,dǎi,è,sǐ,jiān,zhé,mò wěn,mò,yāo,mò,cú,yāng,tiǎn,shēng,dài,shāng,xù,xùn,shū,cán,jǐng,piǎo,qià,qiú,sù,qíng jìng,yǔn,liàn,yì,fǒu bó,zhí shi,yè yān yàn,cán,hūn mèi,dān,jí,dié,zhēn,yǔn,wēn,chòu,bìn,tì,jìn,shāng,yín,chī,jiù,kuì huì,cuàn,yì,dān,dù,jiāng,liàn,bìn,dú,jiān,jiān,shū,ōu,duàn,zhù,yīn yān yǐn,qìng kēng shēng,yì,shā,ké qiào,ké qiào,xiáo yáo xiào,xùn,diàn,huǐ,huǐ,gǔ,qiāo,jī,yì,ōu,huǐ,duàn,yī,xiāo,wú,guàn wān,mǔ,měi,měi,ǎi,jiě,dú dài,yù,bǐ,bì,bì,pí,pí,bì,chán,máo,háo,cǎi,bǐ,liě,jiā,zhān,sāi,mù,tuò,xún xùn,ěr,róng,xiǎn,jū,mú,háo,qiú,dòu nuò,shā,tǎn,péi,jū,duō,cuì,bī,sān,sān,mào,sāi suī,shū,shū,tuò,hé,jiàn,tà,sān,lǘ,mú,máo,tóng,rǒng,chǎng,pǔ,lǔ,zhān,sào,zhān,méng,lǔ,qú,dié,shì zhī,dī dǐ,mín,jué,méng máng,qì,piē,nǎi,qì,dāo,xiān,chuān,fēn,yáng rì,nèi,nèi,fú,shēn,dōng,qīng,qì,yīn,xī,hài,yǎng,ān,yà,kè,qīng,yà,dōng,dàn,lǜ,qíng,yǎng,yūn,yūn,shuǐ,shuǐ,zhěng chéng zhèng,bīng,yǒng,dàng,shuǐ,lè,nì,tǔn,fàn,guǐ jiǔ,tīng,zhī,qiú,bīn pà pā,zè,miǎn,cuān,huì,diāo,hàn,chà,zhuó què,chuàn,wán,fàn,tài dà,xī,tuō,máng,qiú,qì,shàn,pìn,hàn hán,qiān,wū,wū,xùn,sì,rǔ,gǒng,jiāng,chí,wū,tu,jiǔ,tāng shāng,zhī jì,zhǐ,qiān,mì,gǔ yù,wāng,jǐng,jǐng,ruì,jūn,hóng,tài,tài,jí,biàn,biàn,gàn hán cén,wèn mén,zhōng,fāng pāng,xiōng,jué,hǔ huǎng,niú yóu,qì,fén,xù,xù,qìn,yí,wò,yún,yuán,hàng,yǎn,shěn chén,chén,dàn,yóu,dùn,hù,huò,qī,mù,nǜ niǔ,méi mò,tà dá,miǎn,mì wù,chōng,hóng pāng,bǐ,shā shà,zhǐ,pèi,pàn,zhuǐ zǐ,zā,gōu,pài,méi mò,zé,fēng,òu ōu,lì,lún,cāng,fēng,wéi,hù,mò,mèi,shù,jǔ jù,zá,tuō duó,tuó,tuó duò,hé,lì,mǐ lì,yí chí,fā,fèi,yóu,tián,zhì,zhǎo,gū,zhān,yán,sī,kuàng,jiǒng,jū,xiè yì,qiú,yì dié,jiā,zhōng,quán,bó pō,huì,mì bì,bēn bèn,zé,chù shè,lè,yōu yòu āo,gū,hóng,gān,fǎ,mǎo,sì,hū,pēng píng,cǐ,fàn,zhī,sù,nìng,chēng,líng,pào pāo,bō,qì,sì,ní nì,jú,yuè sà,zhù,shēng,lèi,xuàn,jué xuè,fú,pàn,mǐn,tài,yāng,jǐ,yǒng,guàn,bèng,xué,lóng shuāng,lú,dàn,luò pō,xiè,pō,zé shì,jīng,yín,pán,jié,yè,huī,huí,zài,chéng,yīn,wéi,hòu,jiàn,yáng,liè,sì,jì,ér,xíng,fú fù,sǎ xǐ,sè qì zì,zhǐ,yìn,wú,xǐ xiǎn,kǎo kào,zhū,jiàng,luò,luò,àn yàn è,dòng,yí,sì,lěi lèi,yī,mǐ,quán,jīn,pò,wěi,xiáo,xiè,hóng,xù,sù shuò,kuāng,táo,qiè jié,jù,ěr,zhōu,rù,píng,xún,xiōng,zhì,guāng,huán,míng,huó,wā,qià,pài,wū,qū,liú,yì,jiā,jìng,qiǎn jiān,jiāng jiàng,jiāo,zhēn,shī,zhuó,cè,fá,kuài huì,jì jǐ,liú,chǎn,hún,hǔ xǔ,nóng,xún,jìn,liè,qiú,wěi,zhè,jùn xùn,hán,bāng,máng,zhuó,yōu dí,xī,bó,dòu,huàn,hóng,yì,pǔ,yǐng chéng yíng,lǎn,hào,làng,hǎn,lǐ,gēng,fú,wú,lì,chún,féng hóng,yì,yù,tóng,láo,hǎi,jìn,jiā,chōng,jiǒng jiōng,měi,suī něi,chēng,pèi,xiàn,shèn,tú,kùn,pīng,niè,hàn,jīng,xiāo,shè,niǎn,tū,yǒng chōng,xiào,xián,tǐng,é,sù,tūn yūn,juān,cén,tì,lì,shuì,sì,lèi,shuì,tāo,dú,lào,lái,lián,wéi,wō guō,yún,huàn,dí,hēng,rùn,jiàn,zhǎng zhàng,sè,fú,guān,xìng,shòu tāo,shuàn,yá,chuò,zhàng,yè,kōng náng,wǎn wò yuān,hán,tuō tuò,dōng,hé,wō,jū,shè,liáng liàng,hūn,tà,zhuō,diàn,qiè jí,dé,juàn,zī,xī,xiáo,qí,gǔ,guǒ guàn,yān,lín lìn,tǎng chǎng,zhōu,pěng,hào,chāng,shū,qī,fāng,zhí,lù,nào chuò zhuō,jú,táo,cóng,lèi,zhè,píng péng,féi,sōng,tiǎn,pì pèi,dàn,yù xù,ní,yū,lù,gàn,mì,jìng chēng,líng,lún,yín,cuì,qú,huái,yù,niǎn shěn,shēn,biāo hǔ,chún zhūn,hū,yuān,lái,hùn hún,qīng,yān,qiǎn,tiān,miǎo,zhǐ,yǐn,bó,bèn,yuān,wèn mín,ruò rè luò,fēi,qīng,yuān,kě,jì jǐ,shè,yuān,sè,lù,zì,dú dòu,yī,jiàn jiān,miǎn shéng,pài,xī,yú,yuān,shěn,shèn,róu,huàn,zhǔ,jiǎn,nuǎn nuán,yú,qiú wù,tíng tīng,qú jù,dù,fēng,zhā,bó,wò,wō guō,tí dī dì,wěi,wēn,rú,xiè,cè,wèi,hé,gǎng jiǎng,yān yǎn,hóng,xuàn,mǐ,kě,máo,yīng,yǎn,yóu,hōng qìng,miǎo,shěng,měi,zāi,hún,nài,guǐ,chì,è,pài,méi,liàn,qì,qì,méi,tián,còu,wéi,cān,tuān,miǎn,huì mǐn xū,pò,xǔ xū,jí,pén,jiān,jiǎn,hú,fèng,xiāng,yì,yìn,zhàn,shí,jiē,zhēn,huáng,tàn,yú,bì,mǐn hūn,shī,tū,shēng,yǒng,jú,dòng,tuàn nuǎn,qiū jiǎo,qiū jiǎo,qiú,yān yīn,tāng shāng,lóng,huò,yuán,nǎn,bàn pán,yǒu,quán,zhuāng hún,liàng,chán,xián,chún,niè,zī,wān,shī,mǎn,yíng,là,kuì huì,féng hóng,jiàn jiān,xù,lóu,wéi,gài,bō,yíng,pō,jìn,yàn guì,táng,yuán,suǒ,yuán,lián liǎn nián xián xiàn,yǎo,méng,zhǔn,chéng,kè,tài,dá tǎ,wā,liū liù,gōu,sāo,míng,zhà,shí,yì,lùn,mǎ,pǔ,wēi,lì,zāi,wù,xī,wēn,qiāng,zé,shī,sù,ái,zhēn qín,sōu,yún,xiù,yīn,róng,hùn,sù,suò,nì niào,tā,shī,rù,āi,pàn,chù xù,chú,pāng,wěng wēng,cāng,miè,gé,diān,hào xuè,huàng,qì xì xiē,zī,dí,zhì,xíng yíng,fǔ,jié,huá,gē,zǐ,tāo,téng,suī,bì,jiào,huì,gǔn,yín,zé hào,lóng,zhì,yàn,shè,mǎn,yíng,chún,lǜ,làn,luán,yáo,bīn,tān,yù,xiǔ,hù,bì,biāo,zhì,jiàng,kòu,shèn,shāng,dī,mì,áo,lǔ,hǔ xǔ,hū,yōu,chǎn,fàn,yōng,gǔn,mǎn,qǐng,yú,piāo piǎo piào,jì,yá,cháo,qī,xǐ,jì,lù,lóu,lóng,jǐn,guó,cóng sǒng,lòu,zhí,gài,qiáng,lí,yǎn,cáo,jiào,cōng,chún,tuán zhuān,òu ōu,téng,yě,xí,mì,táng,mò,shāng,hàn,lián,lǎn,wā,chí,gān,féng péng,xuán,yī,màn,zì,mǎng,kāng,luò tà,bēn pēng,shù,zhǎng zhàng,zhāng,chóng zhuàng,xù,huàn,huǒ huò kuò,jiàn jiān,yān,shuǎng,liáo liú,cuǐ cuī,tí,yàng,jiāng jiàng,cóng zǒng,yǐng,hóng,xiǔ,shù,guàn,yíng,xiāo,cóng zōng,kūn,xù,liàn,zhì,wéi,pì piē,yù,jiào qiáo,pō,dàng xiàng,huì,jié,wǔ,pá,jí,pān,wéi,sù,qián,qián,xī yà,lù,xì,xùn,dùn,huáng guāng,mǐn,rùn,sù,lǎo lào liáo,zhēn,cōng zòng,yì,zhí zhì,wān,tān shàn,tán,cháo,xún,kuì huì,yē,shào,tú zhā,zhū,sàn sǎ,hēi,bì,shān,chán,chán,shǔ,tóng,pū,lín,wéi,sè,sè,chéng,jiǒng,chéng dèng,huà,jiāo,lào,chè,gǎn,cūn cún,jǐng,sī,shù zhù,péng,hán,yún,liū liù,hòng gǒng,fú,hào,hé,xián,jiàn,shān,xì,ào yù,lǔ,lán,nìng,yú,lǐn,miǎn shéng,zǎo,dāng,huàn,zé shì,xiè,yù,lǐ,shì,xué,líng,wàn màn,zī,yōng yǒng,kuài huì,càn,liàn,diàn,yè,ào,huán,zhēn,chán,màn,gǎn,dàn tán,yì,suì,pì,jù,tà,qín,jī,zhuó,lián,nóng,guō wō,jìn,fén pēn,sè,jí shà,suī,huì huò,chǔ,tà,sōng,dǐng tìng,sè,zhǔ,lài,bīn,lián,mǐ nǐ,shī,shù,mì,nìng,yíng,yíng,méng,jìn,qí,bì pì,jì jǐ,háo,rú,cuì zuǐ,wò,tāo,yǐn,yīn,duì,cí,huò hù,qìng,làn,jùn xùn,ǎi kài kè,pú,zhuó zhào,wéi,bīn,gǔ,qián,yíng,bīn,kuò,fèi,cāng,mè,jiàn jiān,wěi duì,luò pō,zàn cuán,lǜ,lì,yōu,yǎng yàng,lǔ,sì,zhì,yíng,dú dòu,wǎng wāng,huī,xiè,pán,shěn,biāo,chán,miè mò,liú,jiān,pù bào,sè,chéng dèng,gǔ,bīn,huò,xiàn,lú,qìn,hàn,yíng,róng,lì,jìng,xiāo,yíng,suǐ,wěi duì,xiè,huái wāi,xuè,zhū,lóng shuāng,lài,duì,fàn,hú,lài,shū,lián,yíng,mí,jì,liàn,jiàn zùn,yīng yǐng yìng,fèn,lín,yì,jiān,yuè,chán,dài,ráng nǎng,jiǎn,lán,fán,shuàng,yuān,zhuó jiào zé,fēng,shè,lěi,lán,cóng,qú,yōng,qián,fǎ,guàn,jué,yàn,hào,yíng,sǎ,zàn cuán,luán luàn,yàn,lí,mǐ,shàn,tān,dǎng tǎng,jiǎo,chǎn,yíng,hào,bà,zhú,lǎn,lán,nǎng,wān,luán,xún quán quàn,xiǎn,yàn,gàn,yàn,yù,huǒ,huǒ biāo,miè,guāng,dēng,huī,xiāo,xiāo,huī,hōng,líng,zào,zhuàn,jiǔ,zhà yù,xiè,chì,zhuó,zāi,zāi,càn,yáng,qì,zhōng,fén bèn,niǔ,jiǒng guì,wén,pū,yì,lú,chuī,pī,kài,pàn,yán,yán,pàng fēng,mù,chǎo,liào,quē,kàng,dùn,guāng,xìn,zhì,guāng,guāng,wěi,qiàng,biān,dá,xiá,zhēng,zhú,kě,zhào zhāo,fú,bá,xiè,xiè,lìng,zhuō chù,xuàn,jù,tàn,páo bāo pào,jiǒng,páo fǒu,tái,tái,bǐng,yǎng,tōng,shǎn qián shān,zhù,zhà zhá,diǎn,wéi wèi,shí,liàn,chì,huǎng,zhōu,hū,shuò,làn,tīng,jiǎo yào,xù,héng,quǎn,liè,huàn,yáng yàng,xiāo,xiū,xiǎn,yín,wū,zhōu,yáo,shì,wēi,tóng dòng,miè,zāi,kài,hōng,lào luò,xiá,zhú,xuǎn,zhēng,pò,yān,huí huǐ,guāng,chè,huī,kǎo,jù,fán,shāo,yè,huì,none,tàng,jìn,rè,liè,xī,fú páo,jiǒng,xiè chè,pǔ,tīng,zhuó,tǐng,wán,hǎi,pēng,lǎng,yàn,xù,fēng,chì,róng,hú,xī,shū,hè,xūn hūn,kù,juān yè,xiāo,xī,yān,hàn,zhuàng,qū jùn,dì,xiè chè,jí qì,wù,yān,lǚ,hán,yàn,huàn,mèn,jú,dào,bèi,fén,lìn,kūn,hùn,tūn,xī,cuì,wú,hōng,chǎo jù,fǔ,wò ài,jiāo,zǒng cōng,fèng,píng,qióng,ruò,xī yì,qióng,xìn,zhuō chāo,yàn,yàn,yì,jué,yù,gàng,rán,pí,xiǒng yīng,gàng,shēng,chàng,shāo,xiǒng yīng,niǎn,gēng,qū,chén,hè,kuǐ,zhǒng,duàn,xiā,huī yùn xūn,fèng,liàn,xuān,xīng,huáng,jiǎo qiāo,jiān,bì,yīng,zhǔ,wěi,tuān,shǎn qián shān,xī yí,nuǎn,nuǎn,chán,yān,jiǒng,jiǒng,yù,mèi,shā shà,wèi,yè zhá,jìn,qióng,róu,méi,huàn,xù,zhào,wēi,fán,qiú,suì,yáng yàng,liè,zhǔ,jiē,zào,guā,bāo,hú,yūn yǔn,nǎn,shì,huǒ,biān,gòu,tuì,táng,chǎo,shān,ēn yūn,bó,huǎng,xié,xì,wù,xī,yūn yǔn,hé,hè xiāo,xī,yún,xióng,xióng,shǎn,qióng,yào,xūn xùn,mì,lián,yíng,wǔ,róng,gòng,yàn,qiàng,liū,xī,bì,biāo,cōng zǒng,lù āo,jiān,shú,yì,lóu,péng fēng,suī cuǐ,yì,tēng,jué,zōng,yù,hù,yí,zhì,āo áo,wèi,liǔ,hàn rǎn,ōu ǒu,rè,jiǒng,màn,kūn,shāng,cuàn,zèng,jiān,xī,xī,xī,yì,xiào,chì,huáng huǎng,chǎn dǎn chàn,yè,tán,rán,yàn,xún,qiāo,jùn,dēng,dùn,shēn,jiāo qiáo jué zhuó,fén,sī,liáo liǎo,yù,lín,tóng dòng,shāo,fén,fán,yàn yān,xún,làn,měi,tàng,yì,jiǒng,mèn,zhǔ,jiǎo,yíng,yù,yì,xué,lán,tài liè,zào,càn,suì,xī,què,zǒng,lián,huǐ,zhú,xiè,líng,wēi,yì,xié,zhào,huì,dá,nóng,lán,xū,xiǎn,hè,xūn,jìn,chóu,dào,yào,hè,làn,biāo,róng yíng,lì liè,mò,bào,ruò,lǜ,là liè,āo,xūn xùn,kuàng huǎng,shuò,liáo liǎo,lì,lú,jué,liáo liǎo,yàn xún,xī,xiè,lóng,yè,cān,rǎng,yuè,làn,cóng,jué,chóng,guàn,qú,chè,mí,tǎng,làn,zhú,lǎn làn,líng,cuàn,yù,zhǎo zhuǎ,zhǎo zhuǎ,pá,zhēng,páo,chēng chèn,yuán,ài,wéi wèi,han,jué,jué,fù fǔ,yé,bà,diē,yé,yáo,zǔ,shuǎng,ěr,pán,chuáng,kē,zāng,dié,qiāng,yōng,qiáng,piàn piān,bǎn,pàn,cháo,jiān,pái,dú,chuāng,yú,zhá,biān miàn,dié,bǎng,bó,chuāng,yǒu,yǒu yōng,dú,yá,chēng chèng,niú,niú,pìn,jiū lè,móu mù,tā,mǔ,láo,rèn,māng,fāng,máo,mù,gāng,wù,yàn,gē qiú,bèi,sì,jiàn,gǔ,yòu chōu,kē,shēng,mǔ,dǐ,qiān,quàn,quán,zì,tè,xī,máng,kēng,qiān,wǔ,gù,xī,lí,lí,pǒu,jī,gāng,zhí tè,bēn,quán,chún,dú,jù,jiā,jiān qián,fēng,piān,kē,jú,kào,chú,xì,bèi,luò,jiè,má,sān,wèi,máo lí,dūn,tóng,qiáo,jiàng,xī,lì,dú,liè,pái,piāo,bào,xī,chōu,wéi,kuí,chōu,quǎn,quǎn,quǎn bá,fàn,qiú,jǐ,chái,zhuó bào,hān àn,gē,zhuàng,guǎng,mǎ,yóu,kàng gǎng,pèi fèi,hǒu,yà,yín,huān fān,zhuàng,yǔn,kuáng,niǔ,dí,kuáng,zhòng,mù,bèi,pī,jú,yí quán chí,shēng xīng,páo,xiá,tuó yí,hú,líng,fèi,pī,nǐ,yǎo,yòu,gǒu,xuè,jū,dàn,bó,kǔ,xiǎn,níng,huán huān,hěn,jiǎo,hé mò,zhào,jié,xùn,shān,tà shì,róng,shòu,tóng dòng,lǎo,dú,xiá,shī,kuài,zhēng,yù,sūn,yú,bì,máng dòu,xī shǐ,juàn,lí,xiá,yín,suān,láng,bèi,zhì,yán,shā,lì,hàn,xiǎn,jīng,pái,fēi,xiāo,bài pí,qí,ní,biāo,yìn,lái,liè,jiān yàn,qiāng,kūn,yàn,guō,zòng,mí,chāng,yī yǐ,zhì,zhēng,yá wèi,měng,cāi,cù,shē,liè,diǎn,luó,hú,zōng,hú,wěi,fēng,wō,yuán,xīng,zhū,māo máo,wèi,chuàn chuān,xiàn,tuān tuàn,yà jiá qiè,náo,xiē hè gé hài,jiā,hóu,biān piàn,yóu,yóu,méi,chá,yáo,sūn,bó pò,míng,huá,yuán,sōu,mǎ,huán,dāi,yù,shī,háo,qiāng,yì,zhēn,cāng,háo gāo,màn,jìng,jiǎng,mò,zhāng,chán,áo,áo,háo,suǒ,fén fèn,jué,bì,bì,huáng,pú,lín lìn,xù,tóng,yào xiāo,liáo,shuò xī,xiāo,shòu,dūn,jiào,gé liè xiē,juàn,dú,huì,kuài,xiǎn,xiè,tǎ,xiǎn,xūn,níng,biān piàn,huò,nòu rú,méng,liè,náo nǎo yōu,guǎng,shòu,lú,tǎ,xiàn,mí,ráng,huān,náo yōu,luó,xiǎn,qí,jué,xuán,miào,zī,shuài lǜ,lú,yù,sù,wáng wàng,qiú,gǎ,dīng,lè,bā,jī,hóng,dì,chuàn,gān,jiǔ,yú,qǐ,yú,chàng yáng,mǎ,hóng,wǔ,fū,mín wén,jiè,yá,bīn fēn,biàn,bàng,yuè,jué,mén yǔn,jué,wán,jiān qián,méi,dǎn,pín,wěi,huán,xiàn,qiāng cāng,líng,dài,yì,án gān,píng,diàn,fú,xuán xián,xǐ,bō,cī cǐ,gǒu,jiǎ,sháo,pò,cí,kē,rǎn,shēng,shēn,yí tāi,zǔ jù,jiā,mín,shān,liǔ,bì,zhēn,zhēn,jué,fà,lóng,jīn,jiào,jiàn,lì,guāng,xiān,zhōu,gǒng,yān,xiù,yáng,xǔ,luò,sù,zhū,qín,yín kèn,xún,bǎo,ěr,xiàng,yáo,xiá,héng,guī,chōng,xù,bān,pèi,lǎo,dāng,yīng,hún huī,wén,é,chéng,dì tí,wǔ,wú,chéng,jùn,méi,bèi,tǐng,xiàn,chù,hán,xuán qióng,yán,qiú,xuàn,láng,lǐ,xiù,fú fū,liú,yá,xī,líng,lí,jīn,liǎn,suǒ,suǒ,fēng,wán,diàn,pín bǐng,zhǎn,cuì sè,mín,yù,jū,chēn,lái,mín,shèng,wéi yù,tiǎn tiàn,shū,zhuó zuó,běng pěi,chēng,hǔ,qí,è,kūn,chāng,qí,běng,wǎn,lù,cóng,guǎn,yǎn,diāo,bèi,lín,qín,pí,pá,què,zhuó,qín,fà,jīn,qióng,dǔ,jiè,hún huī,yǔ,mào,méi,chūn,xuān,tí,xīng,dài,róu,mín,jiān,wěi,ruǎn,huàn,xié jiē,chuān,jiǎn,zhuàn,chàng yáng,liàn,quán,xiá,duàn,yuàn,yé,nǎo,hú,yīng,yú,huáng,ruì,sè,liú,shī,róng,suǒ,yáo,wēn,wǔ,zhēn,jìn,yíng yǐng,mǎ,tāo,liú,táng,lì,láng,guī,tiàn tián zhèn,qiāng cāng,cuō,jué,zhǎo,yáo,ài,bīn pián,tú shū,cháng,kūn,zhuān,cōng,jǐn,yī,cuǐ,cōng,qí,lí,jǐng,zǎo suǒ,qiú,xuán,áo,liǎn,mén,zhāng,yín,yè,yīng,zhì,lù,wú,dēng,xiù,zēng,xún,qú,dàng,lín,liáo,qióng jué,sù,huáng,guī,pú,jǐng,fán,jīn,liú,jī,huì,jǐng,ài,bì,càn,qú,zǎo,dāng,jiǎo,guǎn,tǎn,huì kuài,huán,sè,suì,tián,chǔ,yú,jìn,lú fū,bīn pián,shú,wèn,zuǐ,lán,xǐ,jì zī,xuán,ruǎn,wò,gài,léi,dú,lì,zhì,róu,lí,zàn,qióng,tì,guī,suí,là,lóng,lú,lì,zàn,làn,yīng,mí xǐ,xiāng,qióng wěi wèi,guàn,dào,zàn,huán yè yà,guā,bó,dié,bó páo,hù,zhí hú,piáo,bàn,ráng,lì,wǎ wà,none,xiáng hóng,qián wǎ,bǎn,pén,fǎng,dǎn,wèng,ōu,none,none,wa,hú,líng,yí,píng,cí,none,juàn juān,cháng,chī,none,dàng,wā,bù,zhuì,píng,biān,zhòu,zhēn,none,cí,yīng,qì,xián,lǒu,dì,ōu,méng,zhuān,bèng,lìn,zèng,wǔ,pì,dān,wèng,yīng,yǎn,gān,dài,shèn shén,tián,tián,hán,cháng,shēng,qíng,shēn,chǎn,chǎn,ruí,shēng,sū,shēn,yòng,shuǎi,lù,fǔ,yǒng,béng,béng,níng nìng,tián,yóu,jiǎ,shēn,yóu zhá,diàn,fú,nán,diàn tián shèng,pīng,tǐng dīng,huà,tǐng dīng,zhèn,zāi zī,méng,bì,bì qí,mǔ,xún,liú,chàng,mǔ,yún,fàn,fú,gēng,tián,jiè,jiè,quǎn,wèi,fú bì,tián,mǔ,none,pàn,jiāng,wā,dá fú,nán,liú,běn,zhěn,xù chù,mǔ,mǔ,cè jì,zāi zī,gāi,bì,dá,zhì chóu shì,lüè,qí,lüè,fān pān,yī,fān pān,huà,shē yú,shē,mǔ,jùn,yì,liú,shē,dié,chóu,huà,dāng dàng dǎng,zhuì,jī,wǎn,jiāng jiàng,chéng,chàng,tuǎn,léi,jī,chā,liú,dié,tuǎn,lín lìn,jiāng,jiāng qiáng,chóu,pì,dié,dié,pǐ yǎ shū,jié qiè,dàn,shū,shū,zhì dì,yí nǐ,nè,nǎi,dīng,bǐ,jiē,liáo,gāng,gē yì,jiù,zhǒu,xià,shàn,xū,nüè yào,lì lài,yáng,chèn,yóu,bā,jiè,jué xuè,qí,yǎ xiā,cuì,bì,yì,lì,zòng,chuāng,fēng,zhù,pào,pí,gān,kē,cī,xuē,zhī,dǎn,zhěn,fá biǎn,zhǐ,téng,jū,jí,fèi féi,gōu,shān diàn,jiā,xuán,zhà,bìng,niè,zhèng zhēng,yōng,jìng,quán,téng chóng,tōng tóng,yí,jiē,wěi yòu yù,huí,tān shǐ,yǎng,zhì,zhì,hén,yǎ,mèi,dòu,jìng,xiāo,tòng,tū,máng,pǐ,xiāo,suān,pū pù,lì,zhì,cuó,duó,wù,shā,láo,shòu,huàn,xián,yì,bēng péng,zhàng,guǎn,tán,fèi féi,má,má lìn,chī,jì,tiǎn diàn,ān yè è,chì,bì,bì,mín,gù,duī,kē ē,wěi,yū,cuì,yǎ,zhú,cù,dàn dān,shèn,zhǒng,zhì chì,yù,hóu,fēng,là,yáng,chén,tú,yǔ,guō,wén,huàn,kù,jiǎ xiá xiā,yīn,yì,lòu,sào,jué,chì,xī,guān,yì,wēn,jí,chuāng,bān,huì lěi,liú,chài cuó,shòu,nüè yào,diān chēn,dá da,biē biě,tān,zhàng,biāo,shèn,cù,luǒ,yì,zòng,chōu,zhàng,zhài,sòu,sè,qué,diào,lòu,lòu,mò,qín,yǐn,yǐng,huáng,fú,liáo,lóng,qiáo jiào,liú,láo,xián,fèi,dàn dān,yìn,hè,ái,bān,xián,guān,guì wēi,nòng nóng,yù,wēi,yì,yōng,pǐ,lěi,lì lài,shǔ,dàn,lǐn,diàn,lǐn,lài,biē biě,jì,chī,yǎng,xuǎn,jiē,zhēng,mèng,lì,huò,lài,jī,diān,xuǎn,yǐng,yǐn,qú,yōng,tān,diān,luǒ,luán,luán,bō,bō bǒ,guǐ,bá,fā,dēng,fā,bái,bǎi,qié,jí bī,zào,zào,mào,de dí dì,pā bà,jiē,huáng,guī,cǐ,líng,gāo háo,mò,jí,jiǎo,pěng,gāo yáo,ái,é,hào,hàn,bì,wǎn,chóu,qiàn,xī,ái,xiǎo,hào,huàng,hào,zé,cuǐ,hào,xiǎo,yè,pó,hào,jiǎo,ài,xīng,huàng,lì luò bō,piǎo,hé,jiào,pí,gǎn,pào,zhòu,jūn,qiú,cūn,què,zhā,gǔ,jūn,jūn,zhòu,zhā cǔ,gǔ,zhāo zhǎn dǎn,dú,mǐn,qǐ,yíng,yú,bēi,diào,zhōng,pén,hé,yíng,hé,yì,bō,wǎn,hé,àng,zhǎn,yán,jiān jiàn,hé,yū,kuī,fàn,gài gě hé,dào,pán,fǔ,qiú,shèng chéng,dào,lù,zhǎn,méng,lí,jìn,xù,jiān jiàn,pán,guàn,ān,lú,xǔ,zhōu chóu,dàng,ān,gǔ,lì,mù,dīng,gàn,xū,máng,máng wàng,zhí,qì,yuǎn,xián tián,xiāng xiàng,dǔn,xīn,xì pǎn,pàn,fēng,dùn,mín,míng,shěng xǐng,shì,yún hùn,miǎn,pān,fǎng,miǎo,dān,méi,mào,kàn kān,xiàn,kōu,shì,yāng yǎng yìng,zhēng,yǎo āo ǎo,shēn,huò,dà,zhěn,kuàng,jū xū kōu,shèn,yí chì,shěng,mèi,mò miè,zhù,zhēn,zhēn,mián,shì,yuān,dié tì,nì,zì,zì,chǎo,zhǎ,xuàn,bǐng fǎng,pàng pán,lóng,guì suī,tóng,mī mí,dié zhì,dì,nè,míng,xuàn shùn xún,chī,kuàng,juàn,móu,zhèn,tiào,yáng,yǎn,mò,zhòng,mò,zhuó zháo zhāo zhe,zhēng,méi,suō,qiáo shào xiāo,hàn,huǎn,dì,chěng,cuó zhuài,juàn,é,miǎn,xiàn,xī,kùn,lài,jiǎn,shǎn,tiǎn,gùn,wān,lèng,shì,qióng,lì,yá,jīng,zhēng,lí,lài,suì zuì,juàn,shuì,huī suī,dū,bì,bì pì,mù,hūn,nì,lù,yì zé gāo,jié,cǎi,zhǒu,yú,hūn,mà,xià,xǐng xìng,huī,hùn,zāi,chǔn,jiān,mèi,dǔ,hóu,xuān,tí,kuí,gāo,ruì,mào,xù,fá,wò,miáo,chǒu,guì wèi kuì,mī mí,wěng,kòu jì,dàng,chēn,kē,sǒu,xiā,qióng huán,mò,míng,mán mén,fèn,zé,zhàng,yì,diāo dōu,kōu,mò,shùn,cōng,lóu lǘ lou,chī,mán mén,piǎo,chēng,guī,méng měng,wàn,rún shùn,piē,xī,qiáo,pú,zhǔ,dèng,shěn,shùn,liǎo liào,chè,xián jiàn,kàn,yè,xuè,tóng,wǔ mí,lín,guì kuì,jiàn,yè,ài,huì,zhān,jiǎn,gǔ,zhào,qú jù,wéi,chǒu,sào,nǐng chēng,xūn,yào,huò yuè,mēng,mián,pín,mián,lěi,kuàng guō,jué,xuān,mián,huò,lú,méng měng,lóng,guàn quán,mǎn mán,xǐ,chù,tǎng,kàn,zhǔ,máo,jīn qín guān,jīn qín guān,yù xù jué,shuò,zé,jué,shǐ,yǐ,shěn,zhī zhì,hóu hòu,shěn,yǐng,jǔ,zhōu,jiǎo jiáo,cuó,duǎn,ǎi,jiǎo jiáo,zēng,yuē,bà,shí dàn,dìng,qì,jī,zǐ,gān,wù,zhé,kū,gāng qiāng kòng,xī,fán,kuàng,dàng,mǎ,shā,dān,jué,lì,fū,mín,è,xū huā,kāng,zhǐ,qì qiè,kǎn,jiè,pīn bīn fēn,è,yà,pī,zhé,yán yàn,suì,zhuān,chē,dùn,wǎ,yàn,jīn,fēng,fǎ,mò,zhǎ,jū,yù,kē luǒ,tuó,tuó,dǐ,zhài,zhēn,ě,fú fèi,mǔ,zhù zhǔ,lì lā lá,biān,nǔ,pīng,pēng,líng,pào,lè,pò,bō,pò,shēn,zá,ài,lì,lóng,tóng,yòng,lì,kuàng,chǔ,kēng,quán,zhū,kuāng guāng,guī,è,náo,qià,lù,wěi guì,ài,luò gè,kèn xiàn gǔn yǐn,xíng,yán yàn,dòng,pēng píng,xī,lǎo,hóng,shuò shí,xiá,qiāo,qíng,wéi wèi ái,qiáo,yì,kēng,xiāo,què kè kù,chàn,láng,hōng,yù,xiāo,xiá,mǎng bàng,luò lòng,yǒng tóng,chē,chè,wò,liú,yìng,máng,què,yàn,shā,kǔn,yù,chì,huā,lǔ,chěn,jiǎn,nüè,sōng,zhuó,kēng kěng,péng,yān yǎn,zhuì chuí duǒ,kōng,chēng,qí,zòng cóng,qìng,lín,jūn,bō,dìng,mín,diāo,jiān zhàn,hè,lù liù,ài,suì,què xī,léng,bēi,yín,duì,wǔ,qí,lún lǔn lùn,wǎn,diǎn,náo gāng,bèi,qì,chěn,ruǎn,yán,dié,dìng,zhóu,tuó,jié yà,yīng,biǎn,kè,bì,wěi wèi,shuò shí,zhēn,duàn,xiá,dàng,tí dī,nǎo,pèng,jiǎn,dì,tàn,chá chā,tián,qì,dùn,fēng,xuàn,què,què qiāo,mǎ,gōng,niǎn,sù xiè,é,cí,liú liù,sī tí,táng,bàng páng,huá kě gū,pī,kuǐ wěi,sǎng,lěi,cuō,tián,xiá qià yà,xī,lián qiān,pán,wèi ái gài,yǔn,duī,zhé,kē,lá lā,zhuān,yáo,gǔn,zhuān,chán,qì,áo qiāo,pēng pèng,liù,lǔ,kàn,chuǎng,chěn,yīn yǐn,lěi léi,biāo,qì,mó mò,qì zhú,cuī,zōng,qìng,chuò,lún,jī,shàn,láo luò,qú,zēng,dèng,jiàn,xì,lín,dìng,diàn,huáng,pán bō,jí shé,qiāo,dī,lì,jiàn,jiāo,xī,zhǎng,qiáo,dūn,jiǎn,yù,zhuì,hé qiāo qiào,kè huò,zé,léi lěi,jié,chǔ,yè,què hú,dàng,yǐ,jiāng,pī,pī,yù,pīn,è qì,ài,kē,jiān,yù,ruǎn,méng,pào,cí,bō,yǎng,miè,cǎ,xián xín,kuàng,léi lěi lèi,lěi,zhì,lì,lì,fán,què,pào,yīng,lì,lóng,lóng,mò,bó,shuāng,guàn,jiān,cǎ,yán yǎn,shì,shì,lǐ,réng,shè,yuè,sì,qí,tā,mà,xiè,yāo,xiān,zhǐ qí,qí,zhǐ,bēng fāng,duì,zhòng,rèn,yī,shí,yòu,zhì,tiáo,fú,fù,mì bì,zǔ,zhī,suàn,mèi,zuò,qū,hù,zhù,shén,suì,cí,chái,mí,lǚ,yǔ,xiáng,wú,tiāo,piào piāo,zhù,guǐ,xiá,zhī,jì zhài,gào,zhēn,gào,shuì lèi,jìn,shèn,gāi,kǔn,dì,dǎo,huò,táo,qí,gù,guàn,zuì,líng,lù,bǐng,jīn jìn,dǎo,zhí,lù,chán shàn,bì pí,chǔ,huī,yǒu,xì,yīn,zī,huò,zhēn,fú,yuàn,xú,xiǎn,shāng yáng,tí zhǐ,yī,méi,sī,dì,bèi,zhuó,zhēn,yíng,jì,gào,táng,sī,mà,tà,fù,xuān,qí,yù,xǐ,jī jì,sì,shàn chán,dàn,guì,suì,lǐ,nóng,mí,dǎo,lì,ráng,yuè,tí,zàn,lèi,róu,yǔ,yú yù ǒu,lí,xiè,qín,hé,tū,xiù,sī,rén,tū,zǐ zì,chá ná,gǎn,yì zhí,xiān,bǐng,nián,qiū,qiū,zhǒng zhòng chóng,fèn,hào mào,yún,kē,miǎo,zhī,jīng,bǐ,zhǐ,yù,mì bì,kù kū,bàn,pī,ní nì,lì,yóu,zū,pī,bó,líng,mò,chèng,nián,qín,yāng,zuó,zhì,dī,shú,jù,zǐ,huó kuò,jī,chēng chèn chèng,tóng,shì zhì,huó kuò,huō,yīn,zī,zhì,jiē,rěn,dù,yí,zhū,huì,nóng,fù pū,xī,gǎo,láng,fū,xùn zè,shuì,lǚ,kǔn,gǎn,jīng,tí,chéng,tú shǔ,shāo shào,shuì,yà,lǔn,lù,gū,zuó,rěn,zhùn zhǔn,bàng,bài,jī qí,zhī,zhì,kǔn,léng lēng líng,péng,kē,bǐng,chóu,zuì zú sū,yù,sū,lüè,xiāng,yī,xì qiè,biǎn,jì,fú,pì bì,nuò,jiē,zhǒng zhòng,zōng zǒng,xǔ xū,chēng chèn chèng,dào,wěn,xián jiān liàn,zī jiū,yù,jì,xù,zhěn,zhì,dào,jià,jī qǐ,gǎo,gǎo,gǔ,róng,suì,ròng,jì,kāng,mù,cǎn shān cēn,mén méi,zhì,jì,lù,sū,jī,yǐng,wěn,qiū,sè,hè,yì,huáng,qiè,jǐ jì,suì,xiāo rào,pú,jiāo,zhuō bó,tóng zhǒng,zuō,lǔ,suì,nóng,sè,huì,ráng,nuò,yǔ,pīn,jì,tuí,wěn,chēng chèn chèng,huò,kuàng,lǚ,biāo pāo,sè,ráng,zhuō jué,lí,cuán zàn,xué,wā,jiū,qióng,xī,qióng,kōng kòng kǒng,yū yǔ,shēn,jǐng,yào,chuān,zhūn,tū,láo,qiè,zhǎi,yǎo,biǎn,báo,yǎo,bìng,wā,zhú kū,jiào liáo liù,qiào,diào,wū,wā guī,yáo,zhì,chuāng,yào,tiǎo yáo,jiào,chuāng,jiǒng,xiāo,chéng,kòu,cuàn,wō,dàn,kū,kē,zhuó,huò,sū,guān,kuī,dòu,zhuō,yìn xūn,wō,wā,yà yē,yú,jù,qióng,yáo,yáo,tiǎo,cháo,yǔ,tián diān yǎn,diào,jù,liào,xī,wù,kuī,chuāng,chāo kē,kuǎn cuàn,kuǎn cuàn,lóng,chēng chèng,cuì,liáo,zào,cuàn,qiào,qióng,dòu,zào,lǒng,qiè,lì,chù,shí,fù,qiān,chù qì,hóng,qí,háo,shēng,fēn,shù,miào,qǔ kǒu,zhàn,zhù,líng,lóng,bìng,jìng,jìng,zhāng,bǎi,sì,jùn,hóng,tóng,sǒng,jìng zhěn,diào,yì,shù,jìng,qǔ,jié,píng,duān,lí,zhuǎn,céng zēng,dēng,cūn,wāi,jìng,kǎn kàn,jìng,zhú,zhú dǔ,lè jīn,péng,yú,chí,gān,máng,zhú,wán,dǔ,jī,jiǎo jiào,bā,suàn,jí,qǐn,zhào,sǔn,yá,zhuì ruì,yuán,hù,háng hàng,xiào,cén jìn hán,pí bì,bǐ,jiǎn,yǐ,dōng,shān,shēng,dā xiá nà,dí,zhú,nà,chī,gū,lì,qiè,mǐn,bāo,tiáo,sì,fú,cè,bèn,fá,dá,zǐ,dì,líng,zuó zé,nú,fú fèi,gǒu,fán,jiā,gě,fàn,shǐ,mǎo,pǒ,tì,jiān,qióng,lóng lǒng,mǐn,biān,luò,guì,qū,chí,yīn,yào,xiǎn,bǐ,qióng,kuò,děng,jiǎo jiào,jīn,quán,sǔn,rú,fá,kuāng,zhù zhú,tǒng,jī,dá dā,háng,cè,zhòng,kòu,lái,bì,shāi,dāng,zhēng,cè,fū,yún jūn,tú,pá,lí,láng làng,jǔ,guǎn,jiǎn,hán,tǒng,xiá,zhì zhǐ,chéng,suàn,shì,zhù,zuó,xiǎo,shāo,tíng,cè,yán,gào,kuài,gān,chóu,kuāng,gàng,yún,o,qiān,xiǎo,jiǎn,póu bù fú pú,lái,zōu,pái bēi,bì,bì,gè,tái chí,guǎi dài,yū,jiān,zhào dào,gū,chí,zhēng,qìng jīng,shà,zhǒu,lù,bó,jī,lín lǐn,suàn,jùn qūn,fú,zhá,gū,kōng,qián,quān,jùn,chuí,guǎn,wǎn yuān,cè,zú,pǒ,zé,qiè,tuò,luó,dān,xiāo,ruò,jiàn,xuān,biān,sǔn,xiāng,xiǎn,píng,zhēn,xīng,hú,shī yí,zhù,yuē yào chuò,chūn,lǜ,wū,dǒng,shuò xiāo qiào,jí,jié,huáng,xīng,mèi,fàn,chuán,zhuàn,piān,fēng,zhù zhú,hóng,qiè,hóu,qiū,miǎo,qiàn,gū,kuì,yì,lǒu,yún,hé,táng,yuè,chōu,gāo,fěi,ruò,zhēng,gōu,niè,qiàn,xiǎo,cuàn,gōng gǎn lǒng,péng páng,dǔ,lì,bì,zhuó huò,chú,shāi,chí,zhù,qiāng cāng,lóng lǒng,lán,jiǎn jiān,bù,lí,huì,bì,zhú dí,cōng,yān,péng,cēn zān cǎn,zhuàn zuàn suǎn,pí,piǎo biāo,dōu,yù,miè,tuán zhuān,zé,shāi,guó guì,yí,hù,chǎn,kòu,cù,píng,zào,jī,guǐ,sù,lǒu,cè jí,lù,niǎn,suō,cuàn,diāo,suō,lè,duàn,zhù,xiāo,bó,mì miè,shāi sī,dàng,liáo,dān,diàn,fǔ,jiǎn,mǐn,kuì,dài,jiāo,dēng,huáng,sǔn zhuàn,láo,zān,xiāo,lù,shì,zān,qí,pái,qí,pái,gǎn gàn,jù,lù,lù,yán,bò bǒ,dāng,sài,zhuā,gōu,qiān,lián,bù bó,zhòu,lài,shi,lán,kuì,yú,yuè,háo,zhēn jiān,tái,tì,niè,chóu,jí,yí,qí,téng,zhuàn,zhòu,fān pān biān,sǒu shǔ,zhòu,qiān,zhuó,téng,lù,lú,jiǎn jiān,tuò,yíng,yù,lài,lóng lǒng,qiè,lián,lán,qiān,yuè,zhōng,qú,lián,biān,duàn,zuǎn,lí,shāi,luó,yíng,yuè,zhuó,yù,mǐ,dí,fán,shēn,zhé,shēn,nǚ,hé,lèi,xiān,zǐ,ní,cùn,zhàng,qiān,zhāi,bǐ,bǎn,wù,shā chǎo,kāng jīng,róu,fěn,bì,cuì,yǐn,zhé,mǐ,tà,hù,bā,lì,gān,jù,pò,yù,cū,zhān,zhòu,chī,sù,tiào,lì,xī,sù,hóng,tóng,zī cí,cè sè,yuè,zhōu yù,lín,zhuāng,bǎi,lāo,fèn,ér,qū,hé,liáng,xiàn,fū fú,liáng,càn,jīng,lǐ,yuè,lù,jú,qí,cuì,bài,zhāng,lín,zòng,jīng,guǒ,huā,sǎn shēn,shēn,táng,biān biǎn,róu,miàn,hóu,xǔ,zòng,hū hú hù,jiàn,zān,cí,lí,xiè,fū,nuò,bèi,gǔ gòu,xiǔ,gāo,táng,qiǔ,jiā,cāo,zhuāng,táng,mí méi,sǎn shēn,fèn,zāo,kāng,jiàng,mó,sǎn shēn,sǎn,nuò,xī,liáng,jiàng,kuài,bó,huán,shǔ,zòng,xiàn,nuò,tuán,niè,lì,zuò,dí,niè,tiào,làn,mì sī,sī,jiū jiǔ,xì jì,gōng,zhēng zhěng,jiū,gōng,jì,chà chǎ,zhòu,xún,yuē yāo,hóng gōng,yū,hé gē,wán,rèn,wěn,wén wèn,qiú,nà,zī,tǒu,niǔ,fóu,jì jié jiè,shū,chún,pī pí bǐ,zhèn,shā,hóng,zhǐ,jí,fēn,yún,rèn,dǎn,jīn jìn,sù,fǎng,suǒ,cuì,jiǔ,zhā zā,hā,jǐn,fū fù,zhì,qī,zǐ,chōu chóu,hóng,zhā zā,léi lěi lèi,xì,fú,xiè,shēn,bō bì,zhù,qū qǔ,líng,zhù,shào,gàn,yǎng,fú,tuó,zhěn tiǎn,dài,chù,shī,zhōng,xián,zǔ,jiōng jiǒng,bàn,qú,mò,shù,zuì,kuàng,jīng,rèn,háng,xiè,jié jiē,zhū,chóu,guà kuā,bǎi mò,jué,kuàng,hú,cì,huán gēng,gēng,tāo,xié jié,kù,jiǎo,quán shuān,gǎi ǎi,luò lào,xuàn,bēng bīng pēng,xiàn,fú,gěi jǐ,tōng tóng dòng,róng,tiào diào dào,yīn,lěi lèi léi,xiè,juàn,xù,gāi hài,dié,tǒng,sī,jiàng,xiáng,huì,jué,zhí,jiǎn,juàn,chī zhǐ,miǎn wèn mán wàn,zhèn,lǚ,chéng,qiú,shū,bǎng,tǒng,xiāo,huán huàn wàn,qīn xiān,gěng,xū,tí tì,xiù,xié,hóng,xì,fú,tīng,suí,duì,kǔn,fū,jīng,hù,zhī,yán xiàn,jiǒng,féng,jì,xù,rěn,zōng zèng,lín chēn,duǒ,lì liè,lǜ,jīng,chóu,quǎn,shào,qí,qí,zhǔn zhùn,jī qí,wǎn,qiàn qīng zhēng,xiàn,shòu,wéi,qìng qǐ,táo,wǎn,gāng,wǎng,bēng běng bèng,zhuì,cǎi,guǒ,cuì,lún guān,liǔ,qǐ,zhàn,bì,chuò chāo,líng,mián,qī,jī,tián tǎn chān,zōng,gǔn,zōu,xī,zī,xìng,liǎng,jǐn,fēi,ruí,mín,yù,zǒng,fán,lǜ lù,xù,yīng,shàng,zī,xù,xiāng,jiān,kè,xiàn,ruǎn ruàn,mián,jī qī,duàn,chóng zhòng,dì,mín,miáo máo,yuán,xiè yè,bǎo,sī,qiū,biān,huǎn,gēng gèng,zǒng,miǎn,wèi,fù,wěi,tōu xū shū,gōu,miǎo,xié,liàn,zōng zòng,biàn pián,gǔn yùn,yīn,tí,guā wō,zhì,yùn yūn wēn,chēng,chán,dài,xié,yuán,zǒng,xū,shéng,wēi,gēng gèng,xuān,yíng,jìn,yì,zhuì,nì,bāng bàng,gǔ hú,pán,zhòu,jiān,cī cuò suǒ,quán,shuǎng,yùn yūn wēn,xiá,cuī suī shuāi,xì,róng rǒng ròng,tāo,fù,yún,zhěn,gǎo,rù,hú,zài zēng,téng,xiàn xuán,sù,zhěn,zòng,tāo,huǎng,cài,bì,féng fèng,cù,lí,suō sù,yǎn yǐn,xǐ,zòng zǒng,léi,zhuàn juàn,qiàn,màn,zhí,lǚ,mù mò,piǎo piāo,lián,mí,xuàn,zǒng,jì,shān,suì,fán pó,lǜ,bēng běng bèng,yī,sāo,móu miù miào mù liǎo,yáo yóu zhòu,qiǎng,shéng,xiān,jì,zōng zòng,xiù,rán,xuàn,suì,qiāo,zēng zèng,zuǒ,zhī zhì,shàn,sǎn,lín,jú jué,fān,liáo,chuō chuò,zūn zǔn,jiàn,rào,chǎn chán,ruǐ,xiù,huì huí,huà,zuǎn,xī,qiǎng,wén,da,shéng,huì,xì jì,sè,jiǎn,jiāng,huán,qiāo sāo,cōng,xiè,jiǎo zhuó,bì,dàn tán chán,yì,nǒng,suì,yì,shā,rú,jì,bīn,qiǎn,lán,pú fú,xūn,zuǎn,zī,péng,yào lì,mò,lèi,xiè,zuǎn,kuàng,yōu,xù,léi,xiān,chán,jiǎo,lú,chán,yīng,cái,xiāng rǎng,xiān,zuī,zuǎn,luò,lí xǐ lǐ sǎ,dào,lǎn,léi,liàn,sī,jiū,yū,hóng gōng,zhòu,xiān qiàn,hé gē,yuē yāo,jí,wán,kuàng,jì jǐ,rèn,wěi,yún,hóng,chún,pī pí bǐ,shā,gāng,nà,rèn,zòng zǒng,lún guān,fēn,zhǐ,wén wèn,fǎng,zhù,zhèn,niǔ,shū,xiàn,gàn,xiè,fú,liàn,zǔ,shēn,xì,zhī zhì,zhōng,zhòu,bàn,fú,chù,shào,yì,jīng,dài,bǎng,róng,jié jiē,kù,rào,dié,háng,huì,gěi jǐ,xuàn,jiàng,luò lào,jué,jiǎo,tǒng,gěng,xiāo,juàn,xiù,xì,suí,tāo,jì,tí tì,jì,xù,líng,yīng,xù,qǐ,fēi,chuò chāo,shàng,gǔn,shéng,wéi,mián,shòu,bēng běng bèng,chóu,táo,liǔ,quǎn,zōng zèng,zhàn,wǎn,lǜ lù,zhuì,zī,kè,xiāng,jiān,miǎn,lǎn,tí,miǎo,jī qī,yùn yūn wēn,huì huí,sī,duǒ,duàn,biàn pián,xiàn,gōu,zhuì,huǎn,dì,lǚ,biān,mín,yuán,jìn,fù,rù,zhěn,féng fèng,cuī suī shuāi,gǎo,chán,lí,yì,jiān,bīn,piǎo piāo,màn,léi,yīng,suō sù,móu miù miào mù liǎo,sāo,xié,liáo,shàn,zēng zèng,jiāng,qiǎn,qiāo sāo,huán,jiǎo zhuó,zuǎn,fǒu,xiè,gāng,fǒu,quē,fǒu,quē,bō,píng,xiàng,zhào,gāng,yīng,yīng,qìng,xià,guàn,zūn,tán,chēng,qì,wèng,yīng,léi,tán,lú,guàn,wǎng,wǎng,wǎng,wǎng,hǎn,wǎng,luó,fú,shēn,fá,gū,zhǔ,jū,máo,gǔ,mín,gāng,bà ba pí,guà,tí,juàn,fú,shēn,yǎn,zhào,zuì,guǎi guà,zhuó,yù,zhì,ǎn,fá,lǎn,shǔ,sī,pí,mà,liǔ,bà ba pí,fá,lí,cháo,wèi,bì,jì,zēng,chōng,liǔ,jī,juàn,mì,zhào,luó,pí,jī,jī,luán,yáng xiáng,mǐ,qiāng,dá,měi,yáng xiáng,líng,yǒu,fén,bā,gāo,yàng,gǔ,qiāng,zāng,měi gāo,líng,yì xī,zhù,dī,xiū,qiǎng,yí,xiàn,róng,qún,qún,qiǎng,huán,suō,xiàn,yì,yōu,qiāng kòng,qián xián yán,yú,gēng,jié,tāng,yuán,xī,fán,shān,fén,shān,liǎn,léi,gēng,nóu,qiàng,chàn,yǔ,hóng gòng,yì,chōng,wēng,fēn,hóng,chì,chì,cuì,fú,xiá,běn,yì,là,yì,pī bì pō,líng,liù,zhì,qú yù,xí,xié,xiáng,xī,xī,ké,qiáo qiào,huì,huī,xiāo,shà,hóng,jiāng,dí zhái,cuì,fěi,dào zhōu,shà,chì,zhù,jiǎn,xuān,chì,piān,zōng,wán,huī,hóu,hé,hè,hàn,áo,piāo,yì,lián,hóu qú,áo,lín,pěn,qiáo qiào,áo,fān,yì,huì,xuān,dào,yào,lǎo,lǎo,kǎo,mào,zhě,qí shì,gǒu,gǒu,gǒu,dié,dié,ér,shuǎ,ruǎn nuò,ér nài,nài,duān zhuān,lěi,tīng,zǐ,gēng,chào,hào,yún,bà pá,pī,sì chí,sì,qù chú,jiā,jù,huō,chú,lào,lún lǔn,jí jiè,tǎng,ǒu,lóu,nòu,jiǎng,pǎng,zhá zé,lóu,jī,lào,huò,yōu,mò,huái,ěr,yì,dīng,yé yē,dā,sǒng,qín,yún yíng,chǐ,dān,dān,hóng,gěng,zhí,pàn,niè,dān,zhěn,chè,líng,zhēng,yǒu,wà tuǐ zhuó,liáo,lóng,zhí,níng,tiāo,ér nǜ,yà,tiē zhé,guō,xù,lián,hào,shèng,liè,pìn,jīng,jù,bǐ,dǐ zhì,guó,wén,xù,pīng,cōng,dìng,ní,tíng,jǔ,cōng,kuī,lián,kuì,cōng,lián,wēng,kuì,lián,lián,cōng,áo,shēng,sǒng,tīng,kuì,niè,zhí,dān,níng,qié,nǐ jiàn,tīng,tīng,lóng,yù,yù,zhào,sì,sù,yì,sù,sì,zhào,zhào,ròu,yì,lèi lē,jī,qiú,kěn,cào,gē,bó dí,huàn,huāng,chǐ,rèn,xiāo xiào,rǔ,zhǒu,yuān,dù dǔ,gāng,róng chēn,gān,chāi,wò,cháng,gǔ,zhī,qín hán hàn,fū,féi,bān,pēi,pàn,jiān,fáng,zhūn chún,yóu,nà,āng,kěn,rán,gōng,yù,wěn,yáo,qí,pí bǐ bì,qiǎn,xī,xī,fèi,kěn,jǐng,tài,shèn,zhǒng,zhàng,xié,shèn,wèi,zhòu,dié,dǎn,fèi bì,bá,bó,qú,tián,bèi bēi,guā,tāi,zǐ fèi,fěi kū,zhī,nì,píng pēng,zì,fū fú zhǒu,pàn,zhēn,xián,zuò,pēi,jiǎ,shèng,zhī,bāo,mǔ,qū,hú,qià,chǐ,yìn,xū,yāng,lóng,dòng,kǎ,lú,jìng,nǔ,yān,pāng,kuà,yí,guāng,hǎi,gē gé,dòng,chī,jiāo,xiōng,xiōng,ér,àn,héng,pián,néng nài,zì,guī kuì,zhēng,tiǎo,zhī,cuì,méi,xié,cuì,xié,mài,mài mò,jǐ,xié,nín,kuài,sà,zàng,qí,nǎo,mǐ,nóng,luán,wàn,bó,wěn,wǎn,xiū,jiǎo,jìng,róu,hēng,cuǒ,liè,shān,tǐng,méi,chún,shèn,jiá,none,juān,cù,xiū,xìn,tuō,pāo,chéng,něi,fǔ,dòu,tuō,niào,nǎo,pǐ,gǔ,luó,lì,liǎn,zhàng,cuī,jiē,liǎng,shuí,pí,biāo,lún,pián,guò,juàn,chuí,dàn,tiǎn,něi,jīng,nái,là xī,yè,ā yān,rèn,shèn,zhuì,fǔ,fǔ,jū,féi,qiāng,wàn,dòng,pí,guó,zōng,dìng,wò,méi,ruǎn,zhuàn,chì,còu,luó,ǒu,dì,ān,xīng,nǎo,shù,shuàn,nǎn,yùn,zhǒng,róu,è,sāi,tú,yāo,jiàn,wěi,jiǎo,yú,jiā,duàn,bì,cháng,fù,xiàn,nì,miǎn,wà,téng,tuǐ,bǎng,qiǎn,lǚ,wà,shòu,táng,sù,zhuì,gé,yì,bó,liáo,jí,pí,xié,gāo gào,lǚ,bìn,ōu,cháng,lù biāo,guó,pāng,chuái,biāo,jiǎng,fū,táng,mó,xī,zhuān chuán chún zhuǎn,lǜ,jiāo,yìng,lǘ,zhì,xuě,cūn,lìn,tóng,péng,nì,chuài,liáo,cuì,kuì,xiāo,tēng,fán pán,zhí,jiāo,shàn,hū wǔ,cuì,rùn,xiāng,suǐ,fèn,yīng,shān dàn,zhuā,dǎn,kuài,nóng,tún,lián,bì bei,yōng,jué,chù,yì,juǎn,là gé,liǎn,sāo sào,tún,gǔ,qí,cuì,bìn,xūn,nào,wò yuè,zàng,xiàn,biāo,xìng,kuān,là,yān,lú,huò,zā,luǒ,qú,zàng,luán,ní luán,zā,chén,qiān xián,wò,guàng jiǒng,zāng zàng cáng,lín,guǎng jiǒng,zì,jiǎo,niè,chòu xiù,jì,gāo,chòu,mián biān,niè,zhì,zhì,gé,jiàn,dié zhí,zhī jìn,xiū,tái,zhēn,jiù,xiàn,yú,chā,yǎo,yú,chōng,xì,xì,jiù,yú,yǔ,xīng,jǔ,jiù,xìn,shé,shè,shè,jiǔ,shì,tān,shū,shì,tiǎn,tàn,pù,pù,guǎn,huà,tiàn,chuǎn,shùn,xiá,wǔ,zhōu,dāo,chuán,shān,yǐ,fán,pā,tài,fán,bǎn,chuán,háng,fǎng,bān,bǐ,lú,zhōng,jiàn,cāng,líng,zhú,zé,duò,bó,xián,gě,chuán,xiá,lú,qióng,páng,xī,kuā,fú,zào,féng,lí,shāo,yú,láng,tǐng,yù,wěi,bó,měng,niàn,jū,huáng,shǒu,kè,biàn,mù,dié,dào,bàng,chā,yì,sōu,cāng,cáo,lóu,dài,xuě,yào,chōng,dēng,dāng,qiáng,lǔ,yǐ,jí,jiàn,huò,méng,qí,lǔ,lú,chán,shuāng,gèn,liáng,jiān,jiān,sè,yàn,fú,pīng,yàn,yàn,cǎo,ǎo,yì,lè,dǐng,jiāo qiú,ài,nǎi,tiáo,qiú,jié jiē,péng,wán,yì,chā,mián,mǐ,gǎn,qiān,yù,yù,sháo,xiōng,dù,hù xià,qǐ,máng,zì zǐ,huì hū,suī,zhì,xiāng,bì pí,fú,tún chūn,wěi,wú,zhī,qì,shān,wén,qiàn,rén,fú,kōu,jiè gài,lú,xù zhù,jī,qín,qí,yuán yán,fēn,bā,ruì,xīn xìn,jì,huā,lún huā,fāng,wù hū,jué,gōu gǒu,zhǐ,yún,qín,ǎo,chú,máo mào,yá,fèi fú,rèng,háng,cōng,chán yín,yǒu,biàn,yì,qiē,wěi,lì,pǐ,è,xiàn,cháng,cāng,zhù,sū sù,dì tí,yuàn,rǎn,líng,tái tāi,tiáo sháo,dí,miáo,qǐng,lì jī,yòng,kē hē,mù,bèi,bāo,gǒu,mín,yǐ,yǐ,jù qǔ,piě,ruò rě,kǔ,zhù níng,nǐ,pā bó,bǐng,shān shàn,xiú,yǎo,xiān,běn,hóng,yīng,zuó zhǎ,dōng,jū chá,dié,nié,gān,hū,píng pēng,méi,fú,shēng ruí,gū,bì,wèi,fú,zhuó,mào,fàn,qié,máo,máo,bá,zǐ,mò,zī,zhǐ,chí,jì,jīng,lóng,cōng,niǎo,yuán,xué,yíng,qióng,gè,míng,lì,róng,yìn,gèn,qiàn,chǎi,chén,yù,hāo,zì,liè,wú,jì,guī,cì,jiǎn,cí,hòu,guāng,máng,chá,jiāo,jiāo,fú,yú,zhū,zī,jiāng,huí,yīn,chá,fá,róng,rú,chōng,mǎng,tóng,zhòng,qiān,zhú,xún,huán,fū,quán,gāi,dá,jīng,xìng,chuǎn,cǎo,jīng,ér,àn,qiáo,chí,rěn,jiàn,yí tí,huāng,píng,lì,jīn,lǎo,shù,zhuāng,dá,jiá,ráo,bì,cè,qiáo,huì,jì,dàng,zì,róng,hūn,xíng yīng,luò,yíng,qián xún,jìn,sūn,yīn yìn,mǎi,hóng,zhòu,yào,dù,wěi,lí,dòu,fū,rěn,yín,hé,bí,bù,yǔn,dí,tú,suī,suī,chéng,chén,wú,bié,xī,gěng,lì,pú,zhù,mò,lì,zhuāng,zuó,tuō,qiú,suō shā,suō,chén,péng fēng,jǔ,méi,méng,xìng,jìng,chē,shēn xīn,jūn,yán,tíng,yóu,cuò,guān guǎn wǎn,hàn,yǒu,cuò,jiá,wáng,sù yóu,niǔ,shāo xiāo,xiàn,làng liáng,fú piǎo,é,mò mù,wèn wǎn miǎn,jié,nán,mù,kǎn,lái,lián,shì shí,wō,tù tú,xiān liǎn,huò,yóu,yíng,yīng,gòng,chún,mǎng,mǎng,cì,wǎn yùn,jīng,dì,qú,dōng,jiān,zōu chù,gū,lā,lù,jú,wèi,jūn jùn,niè rěn,kūn,hé,pú,zī zì zāi,gǎo,guǒ,fú,lún,chāng,chóu,sōng,chuí,zhàn,mén,cài,bá,lí,tù tú,bō,hàn,bào,qìn,juǎn,xī,qín,dǐ,jiē shà,pú,dàng,jǐn,qiáo zhǎo,tái zhī chí,gēng,huá huà huā,gū,líng,fēi fěi,qín qīn jīn,ān,wǎng,běng,zhǒu,yān,zū,jiān,lǐn má,tǎn,shū,tián tiàn,dào,hǔ,qí,hé,cuì,táo,chūn,bì,cháng,huán,fèi,lái,qī,méng,píng,wěi,dàn,shà,huán,yǎn,yí,tiáo,qí,wǎn,cè,nài,zhěn,tuò,jiū,tiē,luó,bì,yì,pān,bó,pāo,dìng,yíng,yíng,yíng,xiāo,sà,qiū,kē,xiāng,wàn,yǔ,yú,fù,liàn,xuān,xuān,nǎn,cè,wō,chǔn,shāo,yú,biān,mào,ān,è,là luò lào,yíng,kuò,kuò,jiāng,miǎn,zuò,zuò,zū,bǎo,róu,xǐ,yè,ān,qú,jiān,fú,lǜ,jīng,pén,fēng,hóng,hóng,hóu,xìng,tū,zhù zhuó zhe,zī,xiāng,shèn,gé gě,qiā,qíng,mǐ,huáng,shēn,pú,gài,dǒng,zhòu,qián,wěi,bó,wēi,pā,jì,hú,zàng,jiā,duàn,yào,jùn,cōng,quán,wēi,zhēn,kuí,tíng,hūn,xǐ,shī,qì,lán,zōng,yāo,yuān,méi,yūn,shù,dì,zhuàn,guān,rǎn,xuē,chǎn,kǎi,kuì kuài,huā,jiǎng,lóu,wěi,pài,yòng,sōu,yīn,shī,chún,shì shí,yūn,zhēn,làng,rú ná,mēng méng měng,lì,quē,suàn,yuán huán,lì,jǔ,xī,bàng,chú,xú shú,tú,liú,huò,diǎn,qiàn,zū jù,pò,cuó,yuān,chú,yù,kuǎi,pán,pú,pú,nà,shuò,xí xì,fén,yún,zhēng,jiān,jí,ruò,cāng,ēn,mí,hāo,sūn,zhēn,míng,sōu sǒu,xù,liú,xí,gū,láng,róng,wěng,gài gě hé,cuò,shī,táng,luǒ,rù,suō,xuān,bèi,yǎo zhuó,guì,bì,zǒng,gǔn,zuò,tiáo,cè,pèi,lán,dàn,jì,lí,shēn,lǎng,yù,líng,yíng,mò,diào tiáo dí,tiáo,mǎo,tōng,zhú,péng,ān,lián,cōng,xǐ,píng,qiū xū fū,jǐn,chún,jié,wéi,tuī,cáo,yù,yì,zí jú,liǎo lù,bì,lǔ,xù,bù,zhāng,léi,qiáng,màn,yán,líng,jì,biāo,gǔn,hàn,dí,sù,lù,shè,shāng,dí,miè,hūn,màn wàn,bo,dì,cuó,zhè,shēn,xuàn,wèi,hú,áo,mǐ,lóu,cù,zhōng,cài,pó,jiǎng,mì,cōng,niǎo,huì,juàn,yín,jiān,niān,shū,yīn,guó,chén,hù,shā,kòu,qiàn,má,zàng,zé,qiáng,dōu,liǎn,lìn,kòu,ǎi,bì,lí,wěi,jí,qián xún,shèng,fán,méng,ǒu,chǎn,diǎn,xùn,jiāo,ruǐ,ruǐ,lěi,yú,qiáo,zhū,huá,jiān,mǎi,yún,bāo,yóu,qú,lù,ráo,huì,è,tí,fěi,jué,zuì,fà,rú,fén,kuì,shùn,ruí,yǎ,xū,fù,jué,dàng,wú,dǒng,sī,xiāo,xì,sà,yùn,shāo,qí,jiān,yùn,sūn,líng,yù,xiá,wèng,jí,hòng,sì,nóng,lěi,xuān,yùn,yù,xí xiào,hào,báo bó bò,hāo,ài,wēi,huì,huì,jì,cí zī,xiāng,wàn luàn,miè,yì,léng,jiāng,càn,shēn,qiáng sè,lián,kē,yuán,dá,tì,tāng,xuē,bì,zhān,sūn,xiān liǎn,fán,dǐng,xiè,gǔ,xiè,shǔ,jiàn,hāo kǎo,hōng,sà,xīn,xūn,yào,bài,sǒu,shǔ,xūn,duì,pín,yuǎn wěi,níng,chóu zhòu,mái wō,rú,piáo,tái,jì qí,zǎo,chén,zhēn,ěr,nǐ,yíng,gǎo,cóng,xiāo hào,qí,fá,jiǎn,xù yù xū,kuí,jiè jí,biǎn,diào zhuó,mí,lán,jìn,cáng zàng,miǎo,qióng,qì,xiǎn,liáo,ǒu,xián,sù,lǘ,yì,xù,xiě,lí,yì,lǎ,lěi,jiào,dí,zhǐ,bēi,téng,yào,mò,huàn,biāo pāo,fān,sǒu,tán,tuī,qióng,qiáo,wèi,liú liǔ,huì huí,ōu,gǎo,yùn,bǎo,lì,shǔ,zhū chú,ǎi,lìn,zǎo,xuān,qìn,lài,huò,tuò,wù,ruǐ,ruǐ,qí,héng,lú,sū,tuí,máng,yùn,pín píng,yù,xūn,jì,jiōng,xuān,mó,qiū,sū,jiōng,péng,niè,bò,ráng,yì,xiǎn,yú,jú,liǎn,liǎn,yǐn,qiáng,yīng,lóng,tǒu,huā,yuè,lìng,qú,yáo,fán,mí,lán,guī,lán,jì,dàng,màn,lèi,léi,huī,fēng,zhī,wèi,kuí,zhàn,huái,lí,jì,mí,lěi,huài,luó,jī,kuí,lù,jiān,sà,téng,léi,quǎn,xiāo,yì,luán,mén,biē,hū,hǔ,lǔ,nüè,lǜ,sī,xiāo,qián,chǔ,hū,xū,cuó,fú,xū,xū,lǔ,hǔ,yú,hào,jiāo,jù,guó,bào,yán,zhàn,zhàn,kuī,bīn,xì,shù,chóng,qiú,diāo,jǐ,qiú,dīng,shī,xiā,jué,zhé,shé,yú,hán,zǐ,hóng,huǐ,méng,gè,suī,xiā,chài,shí,yǐ,mǎ mā mà,xiǎng,fāng bàng,è,bā,chǐ,qiān,wén,wén,ruì,bàng bèng,pí,yuè,yuè,jūn,qí,tóng,yǐn,qí zhǐ,cán,yuán wán,jué quē,huí,qín qián,qí,zhòng,yá,háo,mù,wáng,fén,fén,háng,gōng zhōng,zǎo,fù fǔ,rán,jiè,fú,chī,dǒu,bào,xiǎn,ní,dài dé,qiū,yóu,zhà,píng,chí,yòu,kē,hān,jù,lì,fù,rán,zhá,gǒu qú xù,pí,pí bǒ,xián,zhù,diāo,bié,bīng,gū,zhān,qū,shé yí,tiě,líng,gǔ,dàn,tún,yíng,lì,chēng,qū,móu,gé luò,cì,huí,huí,máng bàng,fù,yáng,wā,liè,zhū,yī,xián,kuò,jiāo,lì,yì xǔ,píng,jié,gé há,shé,yí,wǎng,mò,qióng,qiè ní,guǐ,qióng,zhì,mán,lǎo,zhé,jiá,náo,sī,qí,xíng,jiè,qiú,xiāo,yǒng,jiá,tuì,chē,bèi,é yǐ,hàn,shǔ,xuán,fēng,shèn,shèn,fǔ,xiǎn,zhé,wú,fú,lì,láng,bì,chú,yuān,yǒu,jié,dàn,yán,tíng,diàn,tuì,huí,wō,zhī,zhōng,fēi,jū,mì,qí,qí,yù,jùn,là,měng,qiāng,sī,xī,lún,lì,dié,tiáo,táo,kūn,hán,hàn,yù,bàng,féi,pí,wēi,dūn,yì,yuān,suò,quán,qiǎn,ruì,ní,qīng,wèi,liǎng,guǒ,wān,dōng,è,bǎn,dì,wǎng,cán,yǎng,yíng,guō,chán,dìng,là,kē,jí,xiē,tíng,mào,xū,mián,yú,jiē,shí,xuān,huáng,yǎn,biān,róu,wēi,fù,yuán,mèi,wèi,fú,rú,xié,yóu,qiú,máo,xiā,yīng,shī,chóng,tāng,zhū,zōng,dì,fù,yuán,kuí,méng,là,dài,hú,qiū,dié,lì,wō,yūn,qǔ,nǎn,lóu,chūn,róng,yíng,jiāng,bān,láng,páng,sī,xī,cì,xī qī,yuán,wēng,lián,sǒu,bān,róng,róng,jí,wū,xiù,hàn,qín,yí,bī pí,huá,táng,yǐ,dù,nài něng,hé xiá,hú,guì huǐ,mǎ mā mà,míng,yì,wén,yíng,téng,zhōng,cāng,sāo,qí,mǎn,dāo,shāng,shì zhē,cáo,chī,dì,áo,lù,wèi,dié zhì,táng,chén,piāo,qú jù,pí,yú,chán jiàn,luó,lóu,qǐn,zhōng,yǐn,jiāng,shuài,wén,xiāo,wàn,zhé,zhè,má mò,má,guō,liú,máo,xī,cōng,lí,mǎn,xiāo,chán,zhāng,mǎng měng,xiàng,mò,zuī,sī,qiū,tè,zhí,péng,péng,jiǎo,qú,biē bié,liáo,pán,guǐ,xǐ,jǐ,zhuān,huáng,fèi bēn,láo liáo,jué,jué,huì,yín xún,chán,jiāo,shàn,náo,xiāo,wú,chóng,xún,sī,chú,chēng,dāng,lí,xiè,shàn,yǐ,jǐng,dá,chán,qì,cī,xiǎng,shè,luǒ,qín,yíng,chài,lì,zéi,xuān,lián,zhú,zé,xiē,mǎng,xiè,qí,róng,jiǎn,měng,háo,rú,huò,zhuó,jié,pín,hē,miè,fán,lěi,jié,là,mǐn,lǐ,chǔn,lì,qiū,niè,lú,dù,xiāo,zhū,lóng,lí,lóng,fēng,yē,pí,náng,gǔ,juān,yīng,shǔ,xī,cán,qú,quán,dù,cán,mán,qú,jié,zhú,zhuó,xiě xuè,huāng,nǜ,pēi,nǜ,xìn,zhòng,mài,ěr,kè,miè,xì,háng xíng,yǎn,kàn,yuàn,qú,líng,xuàn,shù,xián,tòng,xiàng,jiē,xián,yá,hú,wèi,dào,chōng,wèi,dào,zhūn,héng,qú,yī,yī,bǔ,gǎn,yú,biǎo,chà,yì,shān,chèn,fū,gǔn,fēn,shuāi cuī,jié,nà,zhōng,dǎn,rì,zhòng,zhōng,jiè,zhǐ,xié,rán,zhī,rèn,qīn,jīn,jūn,yuán,mèi,chài,ǎo,niǎo,huī,rán,jiā,tuó tuō,lǐng líng,dài,bào páo pào,páo,yào,zuò,bì,shào,tǎn,jù jiē,hè kè,xué,xiù,zhěn,yí yì,pà,fú,dī,wà,fù,gǔn,zhì,zhì,rán,pàn,yì,mào,tuō,nà jué,gōu,xuàn,zhé,qū,bèi pī,yù,xí,mí,bó,bō,fú,chǐ nuǒ,chǐ qǐ duǒ nuǒ,kù,rèn,péng,jiá jié qiā,jiàn zùn,bó mò,jié,ér,gē,rú,zhū,guī guà,yīn,cái,liè liě,kǎ,háng,zhuāng,dāng,xū,kūn,kèn,niǎo,shù,jiá,kǔn,chéng chěng,lǐ,juān,shēn,póu,gé jiē,yì,yù,zhěn,liú,qiú,qún,jì,yì,bǔ,zhuāng,shuì,shā,qún,lǐ,lián,liǎn,kù,jiǎn,bāo,chān,bì pí,kūn,táo,yuàn,líng,chǐ,chāng,chóu dāo,duō,biǎo,liǎng,cháng shang,péi,péi,fēi,yuān gǔn,luǒ,guǒ,yǎn ān,dú,xī tì,zhì,jū,yǐ,qí,guǒ,guà,kèn,qī,tì,tí,fù,chóng,xiè,biǎn,dié,kūn,duān,xiù,xiù,hè,yuàn,bāo,bǎo,fù fú,yú,tuàn,yǎn,huī,bèi,zhǔ,lǚ,páo,dān,yùn,tā,gōu,dā,huái,róng,yuán,rù,nài,jiǒng,suǒ,bān,tuì tùn,chǐ,sǎng,niǎo,yīng,jiè,qiān,huái,kù,lián,lán,lí,zhě,shī,lǚ,yì,diē,xiè,xiān,wèi,biǎo,cáo,jì,qiǎng,sēn,bāo,xiāng,bì,fú,jiǎn,zhuàn,jiǎn,cuì,jí,dān,zá,fán,bó,xiàng,xín,bié,ráo,mǎn,lán,ǎo,zé,guì,cào,suì,nóng,chān,liǎn,bì,jīn,dāng,shǔ,tǎn,bì,lán,fú,rú,zhǐ,dùi,shǔ,wà,shì,bǎi,xié,bó,chèn,lǎi,lóng,xí,xiān,lán,zhě,dài,jǔ,zàn,shī,jiǎn,pàn,yì,lán,yà,xī,yà,yào yāo,fěng,tán qín,fù,fiào,fù,bà pò,hé,jī,jī,jiàn xiàn,guān guàn,biàn,yàn,guī,jué jiào,piǎn,mào,mì,mì,piē miè,shì,sì,chān,zhěn,jué jiào,mì,tiào,lián,yào,zhì,jūn,xī,shǎn,wēi,xì,tiǎn,yú,lǎn,è,dǔ,qīn qìng,pǎng,jì,míng,yíng yǐng,gòu,qū qù,zhàn zhān,jìn,guān guàn,dèng,jiàn biǎn,luó luǎn,qù qū,jiàn,wéi,jué jiào,qù qū,luó,lǎn,shěn,dí,guān guàn,jiàn xiàn,guān guàn,yàn,guī,mì,shì,chān,lǎn,jué jiào,jì,xí,dí,tiǎn,yú,gòu,jìn,qù qū,jiǎo jué,qiú,jīn,cū,jué,zhì,chào,jí,gū,dàn,zī zuǐ,dǐ,shāng,huà xiè,quán,gé,shì,jiě jiè xiè,guǐ,gōng,chù,jiě jiè xiè,hùn,qiú,xīng,sù,ní,jī qí,jué,zhì,zhā,bì,xīng,hú,shāng,gōng,zhì,xué hù,chù,xī,yí,lì lù,jué,xī,yàn,xī,yán,yán,dìng,fù,qiú,qiú,jiào,hōng,jì,fàn,xùn,diào,hòng,chài,tǎo,xū,jié,dàn,rèn,xùn,yín,shàn,qì,tuō,jì,xùn,yín,é,fēn,yà,yāo,sòng,shěn,yín,xīn,jué,xiáo,nè,chén,yóu,zhǐ,xiōng,fǎng,xìn,chāo,shè,yán,sǎ,zhùn,xū,yì,yì,sù,chī,hē,shēn,hé,xù,zhěn,zhù,zhèng,gòu,zī,zǐ,zhān,gǔ,fù,jiǎn,dié,líng,dǐ,yàng,lì,náo,pàn,zhòu,gàn,yì,jù,yào,zhà,tuó,yí,qǔ,zhào,píng,bì,xiòng,qū,bá,dá,zǔ,tāo,zhǔ,cí,zhé,yǒng,xǔ,xún,yì,huǎng,hé,shì,chá,xiào,shī,hěn,chà,gòu,guǐ,quán,huì,jié,huà,gāi,xiáng,wēi,shēn,chóu,tóng,mí,zhān,míng,luò,huī,yán,xiōng,guà,èr,bìng,tiǎo diào,yí chǐ chì,lěi,zhū,kuāng,kuā kuà,wū,yù,téng,jì,zhì,rèn,cù,lǎng làng,é,kuáng,ēi éi ěi èi xī,shì,tǐng,dàn,bèi bó,chán,yòu,kēng,qiào,qīn,shuà,ān,yǔ yù,xiào,chéng,jiè,xiàn,wū,wù,gào,sòng,bū,huì,jìng,shuō shuì yuè,zhèn,shuō shuì yuè,dú,huā,chàng,shuí shéi,jié,kè,qū juè,cóng,xiáo,suì,wǎng,xián,fěi,chī lài,tà,yì,nì ná,yín,diào tiáo,pǐ bēi,zhuó,chǎn,chēn,zhūn,jì jī,qī,tán,zhuì,wěi,jū,qǐng,dǒng,zhèng,zé zuò zhǎ cuò,zōu,qiān,zhuó,liàng,jiàn,chù jí,xià háo,lùn lún,shěn,biǎo,huà,biàn,yú,dié,xū,piǎn,shì dì,xuān,shì,hùn,huà guā,è,zhòng,dì,xié,fú,pǔ,tíng,jiàn,qǐ,yù,zī,zhuān,xǐ shāi āi,huì,yīn,ān,xián,nán nàn,chén,fěng,zhū,yáng,yàn,huáng,xuān,gé,nuò,xǔ,móu,yè,wèi,xīng,téng,zhōu,shàn,jiǎn,bó,kuì,huǎng,huò,gē,yíng,mí,xiǎo,mì,xǐ,qiāng,chēn,xuè,tí,sù,bàng,chí,qiān,shì,jiǎng,yuán,xiè,hè,tāo,yáo,yáo,lū,yú,biāo,còng,qǐng,lí,mó,mó,shāng,zhé,miù,jiǎn,zé,jiē,lián,lóu,càn,ōu,gùn,xí,zhuó,áo,áo,jǐn,zhé,yí,hū,jiàng,mán,cháo,hàn,huá,chǎn,xū,zēng,sè,xī,zhā,duì,zhèng,náo,lán,é,yīng,jué,jī,zǔn,jiǎo,bò,huì,zhuàn,wú,zèn,zhá,shí,qiáo,tán,jiàn,pǔ,shéng,xuān,zào,tán,dǎng,suì,xiǎn,jī,jiào,jǐng,zhàn,nóng,yī,ǎi,zhān,pì,huǐ,huà,yì,yì,shàn,ràng,ròu,qiǎn,duì,tà,hù,zhōu,háo,ài,yīng,jiān,yù,jiǎn,huì,dú,zhé,juàn xuān,zàn,lěi,shěn,wèi,chǎn,lì,yí tuī,biàn,zhé,yàn,è,chóu,wèi,chóu,yào,chán,ràng,yǐn,lán,chèn,xié,niè,huān,zàn,yì,dǎng,zhán,yàn,dú,yán,jì,dìng,fù,rèn,jī,jié,hòng,tǎo,ràng,shàn,qì,tuō,xùn,yì,xùn,jì,rèn,jiǎng,huì,ōu,jù,yà,nè,xǔ hǔ,é,lùn lún,xiōng,sòng,fěng,shè,fǎng,jué,zhèng,gǔ,hē,píng,zǔ,shí zhì,xiòng,zhà,sù,zhěn,dǐ,zhōu,cí,qū,zhào,bì,yì,yí dài,kuāng,lěi,shì,guà,shī,jié jí,huī,chéng,zhū,shēn,huà,dàn,gòu,quán,guǐ,xún,yì,zhèng,gāi,xiáng yáng,chà,hùn,xǔ,zhōu chóu,jiè,wū,yǔ yù,qiào,wù,gào,yòu,huì,kuáng,shuō shuì yuè,sòng,ēi éi ěi èi xī,qǐng,zhū,zōu,nuò,dú dòu,zhuó,fěi,kè,wěi,yú,shuí,shěn,tiáo diào zhōu,chǎn,liàng,zhūn,suì,tán,shěn,yì,móu,chén,dié,huǎng,jiàn,xié,xuè,yè,wèi,è,yù,xuān,chán,zī,ān,yàn,dì,mí,piǎn,xū,mó,dǎng,sù,xiè,yáo,bàng,shì,qiān,mì,jǐn,mán,zhé,jiǎn,miù,tán,zèn,qiáo,lán,pǔ,jué,yàn,qiǎn,zhān,chèn,gǔ,qiān,hóng,xiā,jí,hóng,hān,hōng,xī,xī,huō huò huá,liáo,hǎn,dú,lóng,dòu,jiāng,qǐ,chǐ,lǐ,dēng,wān,bī,shù,xiàn,fēng,zhì,zhì,yàn,yàn,shǐ,chù,huī,tún,yì,tún,yì,jiān,bā,hòu,è,chú,xiàng,huàn,jiān yàn,kěn,gāi,jù,fú,xī,bīn,háo,yù,zhū,jiā,fén,xī,hù,wēn,huán,bīn,dí,zōng,fén,yì,zhì,bào,chái,àn,pí,nà,pī,gǒu,nà,yòu,diāo,mò,sì,xiū,huán huān,kěn kūn,hé mò,hé háo mò,mò,àn,mào,lí,ní,bǐ,yǔ,jiā,tuān tuàn,māo máo,pí,xī,yì,jù lóu,mò,chū,tán,huān,jué,bèi,zhēn,yuán yún yùn,fù,cái,gòng,tè,yì yí,háng,wán,pín,huò,fàn,tān,guàn,zé zhài,zhì,èr,zhù,shì,bì,zī,èr,guì,piǎn,biǎn,mǎi,dài tè,shèng,kuàng,fèi,tiē,yí,chí,mào,hè,bì bēn,lù,lìn,huì,gāi,pián,zī,jiǎ gǔ jià,xù,zéi,jiǎo,gāi,zāng,jiàn,yīng,jùn,zhèn,shē,bīn,bīn,qiú,shē,chuàn,zāng,zhōu,lài,zàn,cì,chēn,shǎng,tiǎn,péi,gēng,xián,mài,jiàn,suì,fù,dǎn,cóng,cóng,zhì,jī,zhàng,dǔ,jìn,xiōng mín,chǔn,yǔn,bǎo,zāi,lài,fèng,càng,jī,shèng,ài,zhuàn zuàn,fù,gòu,sài,zé,liáo,yì,bài,chěn,wàn zhuàn,zhì,zhuì,biāo,yūn,zèng,dàn,zàn,yàn,pú,shàn,wàn,yíng,jìn,gàn,xián,zāng,bì,dú,shú,yàn,shǎng,xuàn,lòng,gàn,zāng,bèi,zhēn,fù,yuán yùn,gòng,cái,zé,xián,bài,zhàng,huò,zhì,fàn,tān,pín,biǎn,gòu,zhù,guàn,èr,jiàn,bì bēn,shì,tiē,guì,kuàng,dài,mào,fèi,hè,yí,zéi,zhì,gǔ jiǎ,huì,zī,lìn,lù,zāng,zī,gāi,jìn,qiú,zhèn,lài,shē,fù,dǔ,jī,shú,shǎng,cì,bì,zhōu,gēng,péi,dǎn,lài,fèng,zhuì,fù,zhuàn,sài,zé,yàn,zàn,yūn,zèng,shàn,yíng,gàn,chì,xī,shè,nǎn,tóng,xì,chēng,hè,chēng,zhě,xiá,táng,zǒu,zǒu,lì,jiū,fù,zhào,gǎn,qǐ,shàn,qióng,yǐn,xiǎn,zī,jué,qǐn,chí,cī,chèn,chèn,dié tú,qiè jū,chāo,dī,xì,zhān,jué,yuè,qū cù,jí jié,qū,chú,guā huó,xuè,zī,tiào,duǒ,liè,gǎn,suō,cù,xí,zhào,sù,yǐn,jú,jiàn,què qì jí,tàng tāng,chuō zhuó,cuǐ,lù,qù cù,dàng,qiū,zī,tí,qū cù,chì,huáng,qiáo,qiāo,jiào,zào,tì yuè,ěr,zǎn,zǎn,zú,pā,bào bō,kuà wù,kē,dǔn,jué guì,fū,chěn,jiǎn,fāng fàng páng,zhǐ,tā,yuè,bà páo,qí qǐ,yuè,qiāng qiàng,tuò,tái,yì,jiàn chén,líng,mèi,bá,diē,kū,tuó,jiā,cī cǐ,pǎo páo,qiǎ,zhù,jū,diǎn tiē dié,zhí,fū,pán bàn,jū jù qiè,shān,bǒ,ní,jù,lì luò,gēn,yí,jì,dài duò duō chí,xiǎn,jiāo,duò,zhū,quán,kuà,zhuǎi,guì,qióng,kuǐ,xiáng,dié,lù,pián bèng,zhì,jié,tiào táo,cǎi,jiàn,dá,qiāo,bì,xiān,duò,jī,jú,jì,shū chōu,tú,chuò,jìng,niè,xiāo,bù,xué,qūn,mǔ,shū,liáng liàng,yǒng,jiǎo,chóu,qiāo,móu,tà,jiàn,jī,wō,wěi,chuō,jié,jí,niè,jū,niè,lún,lù,lèng,huái,jù,chí,wǎn,quán,tī,bó,zú,qiè,qī,cù,zōng,cǎi,zōng,pèng,zhì,zhēng,diǎn,zhí,yú,duó,dùn,chuǎn,yǒng,zhǒng,dì,zhě,chěn,chuài,jiàn,guā,táng,jǔ,fú,cù,dié,pián,róu,nuò,tí,chǎ,tuǐ,jiǎn,dǎo,cuō,xī,tà,qiāng,niǎn,diān,tí,jí,niè,pán,liū,zàn,bì,chōng,lù,liáo,cù,tāng,dài,sù,xǐ,kuǐ,jì,zhí,qiāng,dí,pán,zōng,lián,bèng,zāo,niǎn,bié,tuí,jú,dēng,cèng,xiān,fán,chú,zhōng,dūn,bō,cù,cù,jué juě,jué,lìn,tà,qiāo,qiāo,pǔ,liāo,dūn,cuān,guàn,zào,tà,bì,bì,zhú,jù,chú,qiào,dǔn,chóu,jī,wǔ,yuè,niǎn,lìn,liè,zhí,lì luò,zhì,chán,chú,duàn,wèi,lóng lǒng,lìn,xiān,wèi,zuān,lán,xiè,ráng,sǎ xiè,niè,tà,qú,jí,cuān,zuān,xǐ,kuí,jué,lìn,shēn,gōng,dān,fēn,qū,tǐ,duǒ,duǒ,gōng,láng,rěn,luǒ,ǎi,jī,jū,tǎng,kōng,lào,yǎn,měi,kāng,qū,lóu,lào,duǒ,zhí,yàn,tǐ,dào,yīng,yù,chē jū,yà zhá gá,guǐ,jūn,wèi,yuè,xìn xiàn,dài,xuān,fàn guǐ,rèn,shān,kuáng,shū,tún,chén,dài,è,nà,qí,máo,ruǎn,kuáng,qián,zhuàn zhuǎn,hōng,hū,qú,kuàng,dǐ,líng,dài,āo ào,zhěn,fàn,kuāng,yǎng,pēng,bèi,gū,gū,páo,zhù,rǒng,è,bá,zhóu zhòu,zhǐ,yáo,kē kě,yì dié,qīng,shì,píng,ér,gǒng,jú,jiào,guāng,lù,kǎi,quán,zhōu,zài,zhì,shē,liàng,yù,shāo,yóu,wàn,yǐn,zhé,wǎn,fǔ,qīng,zhōu,ní,líng,zhé,hàn,liàng,zī,huī,wǎng,chuò,guǒ,kǎn,yǐ,péng,qiàn,gǔn,niǎn,píng,guǎn,bèi,lún,pái,liáng,ruǎn,róu,jí,yáng,xián,chuán,còu,chūn,gé,yóu,hōng,shū,fù,zī,fú,wēn,fàn,zhǎn,yú,wēn,tāo,gǔ,zhēn,xiá,yuán,lù,jiāo,cháo,zhuǎn,wèi,hūn,xuě,zhé,jiào,zhàn,bú,lǎo,fén,fān,lín,gé,sè,kǎn,huàn,yǐ,jí,duì,ér,yú,jiàn,hōng,léi,pèi,lì,lì,lú,lìn,chē jū,yà,guǐ,xuān,dài,rèn,zhuǎn zhuàn zhuǎi,è,lún,ruǎn,hōng,gū,kē,lú,zhóu zhòu,zhǐ,yì,hū,zhěn,lì,yáo,qīng,shì,zǎi zài,zhì,jiào,zhōu,quán,lù,jiào,zhé,fǔ,liàng,niǎn,bèi,huī,gǔn,wǎng,liáng,chuò,zī,còu,fú,jí,wēn,shū,pèi,yuán,xiá,zhǎn niǎn,lù,zhé,lín,xīn,gū,cí,cí,bì pì,zuì,biàn,là,là,cí,xuē,bàn,biàn,biàn,biàn,xuē,biàn,bān,cí,biàn,biàn,chén,rǔ,nóng,nóng,zhěn,chuò,chuò,yī,réng,biān,dào biān,shi,yū,liáo,dá,chān,gān,qiān,yū,yū,qì,xùn,yǐ yí,guò guo guō,mài,qī,zā,wàng kuāng,tù,zhūn,yíng,dá,yùn,jìn,háng,yà,fǎn,wǔ,dá,é,huán hái,zhè zhèi,dá,jìn,yuǎn yuàn,wéi,lián,chí,chè,chí,tiáo,zhì lì,yǐ yí,jiǒng,jiā,chén,dài,ěr,dí,pò pǎi,zhù wǎng,dié,zé,táo,shù,yǐ yí,qù,jìng,huí,dòng,yòu,mí,bèng,jì,nǎi,yí,jié,zhuī duī,liè,xùn,tuì,sòng,shì,táo,páng,hòu,nì,dùn,jiǒng,xuǎn,xùn,bū,yōu,xiāo,qiú,tòu,zhú,qiú,dì,dì,tú,jìng,tì,dòu,yǐ,zhè,tōng,guàng,wǔ,shì,chěng,sù,zào,qūn,féng,lián,suò,huí,lǐ,gǔ,lái,bèn,cuò,zhú,bèng,huàn,dài,lù,yóu,zhōu,jìn,yù,chuō,kuí,wēi,tì,yì,dá,yuǎn,luó,bī,nuò,yú,dàng,suí,dùn,suì,yǎn,chuán,chí,dì tí,yù,shí,zhēn,yóu,yùn,è,biàn,guò,è,xiá,huáng,qiú,dào,dá,wéi,nán,yí,gòu,yáo,chòu,liù,xùn,tà,dì,chí,yuǎn,sù,tà,qiǎn,mǎ,yáo,guàn,zhāng,áo,shì,cà,chì,sù,zāo,zhē,dùn,dì,lóu,chí,cuō,lín,zūn,rào,qiān,xuǎn,yù,yí,è,liáo,jù,shì,bì,yāo,mài,xiè,suì,huán hái,zhān,téng,ěr,miǎo,biān,biān,lā,lí chí,yuán,yáo,luó,lǐ,yì,tíng,dèng,qǐ,yōng,shān,hán,yú,máng,rú,qióng,xī,kuàng,fū,kàng háng,bīn,fāng,xíng,nà nǎ nèi nā,xīn,shěn,bāng,yuán,cūn,huǒ,xié yá yé yú xú,bāng,wū,jù,yóu,hán,tái,qiū,bì,pī,bǐng,shào,bèi,wǎ,dǐ,zōu,yè,lín,kuāng,guī,zhū,shī,kū,yù,gāi hái,hé,qiè xì,zhì,jí,xún huán,hòu,xíng,jiāo,xí,guī,nà,láng làng,jiá,kuài,zhèng,láng,yùn,yán,chéng,dòu,xī,lǚ,fǔ,wú,fú,gào,hǎo,láng,jiá,gěng,jùn,yǐng,bó,xì,bèi,lì zhí,yún,bù,xiáo ǎo,qī,pí,qīng,guō,zhōu,tán,zōu,píng,lái,ní,chēn,yóu,bù,xiāng,dān,jú,yōng,qiāo,yī,dū dōu,yǎn,méi,ruò,bèi,è,shū,juàn,yǔ,yùn,hóu,kuí,xiāng,xiāng,sōu,táng,míng,xī,rǔ,chù,zī,zōu,yì,wū,xiāng,yún,hào,yōng,bǐ,mào,cháo,fū,liǎo,yín,zhuān,hù,qiāo,yān,zhāng,màn,qiāo,xǔ,dèng,bì,xún,bì,zēng,wéi,zhèng,mào,shàn,lín,pó,dān,méng,yè,cào,kuài,fēng,méng,zōu,kuàng,liǎn,zàn,chán,yōu,qí,yàn,chán,zàn,líng,huān,xī,fēng,zàn,lì,yǒu,dīng dǐng,qiú,zhuó,pèi,zhòu,yǐ,gān,yú,jiǔ,yǎn,zuì,máo,dān,xù,dòu,zhēn,fēn,yuán,fū,yùn,tài,tiān,qiǎ,tuó,zuò,hān,gū,sū,pō,chóu,zài,mǐng,lào,chuò,chóu,yòu,tóng,zhǐ,xiān,jiàng,chéng,yìn,tú,jiào,méi,kù,suān,lèi,pú,zuì,hǎi,yàn,shī,niàng niàn niáng,wéi,lù,lǎn,yān,táo,pēi,zhǎn,chún,tán dàn,zuì,zhuì,cù,kūn,tí tǐ,xián,dū,hú,xǔ,xǐng,tǎn,qiú chōu,chún,yùn,pō fā,kē,sōu,mí,quán,chǒu,cuō,yùn,yòng,àng,zhà,hǎi,táng,jiàng,piǎo,chǎn chěn,yù,lí,zāo,láo,yī,jiàng,bú,jiào,xī,tán,pō fā,nóng,yì shì,lǐ,jù,yàn liǎn xiān,yì,niàng,rú,xūn,chóu,yàn,líng,mí,mí,niàng,xìn,jiào,shī,mí,yàn,biàn,cǎi cài,shì,yòu,shì,shì,lǐ,zhòng chóng,yě,liáng liàng,lí xǐ xī,jīn,jīn,gá,yǐ,liǎo liào,dāo,zhāo,dīng dìng,pō,qiú,hé,fǔ,zhēn,zhí,bā,luàn,fǔ,nǎi,diào,shān shàn,qiǎo jiǎo,kòu,chuàn,zǐ,fán,huá yú,huá wū,hàn,gāng,qí,máng,rì rèn jiàn,dì dài,sì,xì,yì,chāi,shī yí,tǔ,xī,nǚ,qiān,qiú,rì rèn jiàn,pī zhāo,yé yá,jīn,bǎ,fāng,chén,xíng,dǒu,yuè,qiān,fū,bù,nà,xīn,é,jué,dùn,gōu,yǐn,qián,bǎn,sà,rèn,chāo,niǔ,fēn,yǔn,yǐ,qín,pī,guō,hóng,yín,jūn,diào,yì,zhōng,xǐ,gài,rì,huǒ,tài,kàng,yuán,lú,è,qín,duó,zī,ní,tú,shì,mín,gū,kē,líng,bǐng,sì,gǔ,bó,pí,yù,sì,zuó,bū,yóu,diàn,jiǎ,zhēn,shǐ,shì,tiě,jù,zuān,shī,tā,xuàn,zhāo,bào,hé,bì,shēng,chú,shí,bó,zhù,chì,zā,pǒ,tóng,qián,fú,zhǎi,mǎo,qiān,fú,lì,yuè,pī,yāng,bàn,bō,jié,gōu,shù,zhēng,mǔ,xǐ,xǐ,dì,jiā,mù,tǎn,shén,yǐ,sī,kuàng,kǎ,běi,jiàn,tóng,xíng,hóng,jiǎo,chǐ,ěr,gè,bǐng píng,shì,máo,hā,yín,jūn,zhōu,chòng,xiǎng jiōng,tóng,mò,lèi,jī,yù sì,xù huì,rén rěn,zùn,zhì,qióng,shàn shuò,chì lì,xiǎn xǐ,xíng,quán,pī,tiě,zhū,hóu xiàng,míng,kuǎ,diào tiáo yáo,xiān kuò tiǎn guā,xián,xiū,jūn,chā,lǎo,jí,pǐ,rú,mǐ,yī,yīn,guāng,ǎn,diū,yǒu,sè,kào,qián,luán,sī,āi,diào,hàn,ruì,shì zhì,kēng,qiú,xiāo,zhé niè,xiù,zàng,tī,cuò,xiān kuò tiǎn guā,hòng gǒng,zhōng yōng,tōu tù dòu,lǚ,méi méng,láng,wàn jiǎn,xīn,yún,bèi,wù,sù,yù,chán,tǐng dìng,bó,hàn,jiá,hóng,juān jiān cuān,fēng,chān,wǎn,zhì,sī tuó,xuān juān juàn,huá wú wū,wú,tiáo,kuàng,zhuó chuò,lüè,xíng xìng jīng,qǐn,shèn,hán,lüè,yé,chú,zèng,jū jú,xiàn,é,máng,pū pù,lí,pàn,ruì,chéng,gào,lǐ,tè,bīng,zhù,zhèn,tū,liǔ,zuì niè,jù jū,chǎng,yuǎn yuān wǎn wān,jiān jiàn,gāng gàng,diào,táo,shǎng,lún,kè,líng,pī,lù,lí,qīng,péi,juǎn,mín,zuì,péng,àn,pī,xiàn,yā,zhuī,lèi,ā,kōng,tà,kūn,dú,nèi,chuí,zī,zhēng,bēn,niè,cóng,chún,tán,dìng,qí,qián,zhuì,jī,yù,jǐn,guǎn,máo,chāng,tiǎn,xī,liàn,diāo,gù,cuò,shù,zhēn,lù,měng,lù,huā,biǎo,gá,lái,kěn,fāng,bū,nài,wàn,zàn,hǔ,dé,xiān,piān,huò,liàng,fǎ,mén,kǎi,yāng,chí,liàn,guō,xiǎn,dù,tú,wéi,zōng,fù,róu,jí,è,jūn,chěn,tí,zhá,hù,yáng,duàn,xiá,yú,kēng,shēng,huáng,wěi,fù,zhāo,chā,qiè,shī,hōng,kuí,nuò,móu,qiāo,qiāo,hóu,tōu,cōng,huán,yè,mín,jiàn,duān,jiàn,sī,kuí,hú,xuān,zhě,jié,zhēn,biān,zhōng,zī,xiū,yé,měi,pài,āi,jiè,qián,méi,cuō chā,dā tà,bàng,xiá,lián,suǒ sè,kài,liú,yáo zú,yè tà gé,nòu,wēng,róng,táng,suǒ,qiāng chēng,gé lì,shuò,chuí,bó,pán,dā,bī bì pī,sǎng,gāng,zī,wū,yíng,huàng,tiáo,liú liù,kǎi,sǔn,shā,sōu,wàn jiǎn,gǎo hào,zhèn,zhèn,láng,yì,yuán,tǎng,niè,xí,jiā,gē,mǎ,juān,sòng,zǔ,suǒ,xià,fēng,wēn,ná,lǔ,suǒ,ōu,zú chuò,tuán,xiū xiù,guàn,xuàn,liàn,shòu sōu,ào,mǎn,mò,luó,bì,wèi,liú,dí dī,sǎn qiāo càn,cōng,yí,lù áo,áo,kēng,qiāng,cuī,qī,shǎng,tāng táng,màn,yōng,chǎn,fēng,jìng,biāo,shù,lòu,xiù,cōng,lóng,zàn,jiàn zàn,cáo,lí,xià,xī,kāng,shuǎng,bèng,zhāng,qiān,zhēng,lù,huá,jí,pú,huì suì ruì,qiǎng qiāng,pō,lín,sè,xiù,sǎn xiàn sà,chēng,guì,sī,liú,náo,huáng,piě,suì,fán,qiáo,quān,xī,tàng,xiàng,jué,jiāo,zūn,liào,qì,láo,duī,xín,zān,jī,jiǎn,zhōng,dèng,yā,yǐng,duī,jué,nòu,zān,pǔ,tiě,fán,chēng,dǐng,shàn,kāi,jiǎn,fèi,suì,lǔ,juān,huì,yù,lián,zhuō,qiāo,jiàn,zhuó,léi,bì,tiě,huán,yè,duó,guò,dāng chēng,jù,fén,dá,bèi,yì,ài,zōng,xùn,diào,zhù,héng,zhuì,jī,niè,hé,huò,qīng,bīn,yīng,guì,níng,xū,jiàn,jiàn,qiǎn,chǎ,zhì,miè,lí,léi,jī,zuān,kuàng,shǎng,péng,là,dú,shuò,chuò,lǜ,biāo,bào,lǔ,xián,kuān,lóng,è,lú,xīn,jiàn,lán,bó,jiān,yuè,chán,xiāng,jiàn,xī,guàn,cáng,niè,lěi,cuān,qú,pàn,luó,zuān,luán,záo,niè,jué,tǎng,zhú,làn,jīn,gá,yǐ,zhēn,dīng dìng,zhāo,pō,liǎo liào,tǔ,qiān,chuàn,shān shàn,sà xì,fán,diào,mén,nǚ,yáng,chāi,xíng,gài,bù,tài,jù,dùn,chāo,zhōng,nà,bèi,gāng gàng,bǎn,qián,yuè yào,qīn,jūn,wū,gōu,kàng,fāng,huǒ,dǒu,niǔ,bǎ pá,yù,qián,zhēng zhèng,qián,gǔ,bō,kē,pǒ,bū,bó,yuè,zuān zuàn,mù,tǎn,jiǎ,diàn tián,yóu,tiě,bó,líng,shuò,qiān yán,mǎo,bào,shì,xuàn,tā tuó,bì,ní,pí pī,duó,xíng,kào,lǎo,ěr,máng,yā yà,yǒu,chéng,jiá,yé,náo,zhì,dāng chēng,tóng,lǚ,diào,yīn,kǎi,zhá,zhū,xiǎn xǐ,tǐng dìng,diū,xiān kuò tiǎn guā,huá,quán,shā,hā kē,diào tiáo yáo,gè,míng,zhēng,sè,jiǎo,yī,chǎn,chòng,tàng tāng,ǎn,yín,rú,zhù,láo,pū pù,wú,lái,tè,liàn,kēng,xiāo,suǒ,lǐ,zèng,chú,guō,gào,é,xiù,cuò,lüè,fēng,xīn,liǔ,kāi,jiǎn,ruì,tī,láng,qǐn,jū,ā,qiāng,zhě,nuò,cuò,máo,bēn,qí,dé,kè,kūn,chāng,xī,gù,luó,chuí,zhuī,jǐn,zhì,xiān,juǎn,huò,péi,tán,dìng,jiàn,jù,měng,zī,qiè,yīng,kǎi,qiāng,sī,è,chā,qiāo,zhōng,duàn,sōu,huáng,huán,āi,dù,měi,lòu,zī,fèi,méi,mò,zhèn,bó,gé,niè,tǎng,juān,niè,ná,liú,gǎo,bàng,yì,jiā,bīn,róng,biāo,tāng,màn,luó,bèng,yōng,jìng,dí,zú,xuàn,liú,xín,jué,liào,pú,lǔ,duī,lán,pǔ,cuān,qiǎng,dèng,huò,léi,huán,zhuó,lián,yì,chǎ,biāo,là,chán,xiāng,cháng zhǎng,cháng,jiǔ,ǎo,dié,jié,liǎo,mí,cháng zhǎng,mén,mà,shuān,shǎn,huò shǎn,mén,yán,bì,hàn bì,bì,shān,kāi,kāng kàng,bēng,hóng,rùn,sàn,xián,xián jiān jiàn,jiān jiàn,mǐn,xiā xiǎ,shuǐ,dòu,zhá,nào,zhān,pēng pèng,xiǎ kě,líng,biàn guān,bì,rùn,hé,guān,gé,hé gé,fá,chù,hòng xiàng,guī,mǐn,sē xī,kǔn,làng,lǘ,tíng tǐng,shà,jú,yuè,yuè,chǎn,qù,lìn,chāng,shā,kǔn,yān,wén,yán,è yān,hūn,yù,wén,hòng,bāo,hòng juǎn xiàng,qù,yǎo,wén,bǎn pàn,àn,wéi,yīn,kuò,què,lán,dū shé,quán,fēng,tián,niè,tà,kǎi,hé,què quē,chuǎng,guān,dòu,qǐ,kuī,táng tāng chāng,guān,piáo,kàn hǎn,xì sè tà,huì,chǎn,pì,dāng dàng,huán,tà,wén,tā,mén,shuān,shǎn,yán,hàn bì,bì,wèn,chuǎng,rùn,wéi,xián,hóng,jiān jiàn,mǐn,kàng kāng,mèn mēn,zhá,nào,guī,wén,tà,mǐn,lǘ,kǎi,fá,gé,hé,kǔn,jiū,yuè,làng,dū shé,yù,yān,chāng,xì,wén,hūn,yán,è,chǎn,lán,qù,huì,kuò,què,hé,tián,tà,quē què,kàn,huán,fù,fǔ,lè,duì,xìn,qiān,wù,yì,tuó,yīn,yáng,dǒu,è,shēng,bǎn,péi,kēng,yǔn,ruǎn,zhǐ,pí,jǐng,fáng,yáng,yīn,zhèn,jiē,chēng,è,qū,dǐ,zǔ,zuò,diàn,lín,ā ē,tuó,tuó,bēi pí pō,bǐng,fù,jì,lù,lǒng,chén,xíng,duò,lòu,mò,jiàng xiáng,shū,duò,xiàn,ér,guǐ,yū,gāi,shǎn,jùn,qiào,xíng,chún,wǔ,bì,xiá,shǎn,shēng,zhì,pū,dǒu,yuàn,zhèn,chú,xiàn,dǎo,niè,yǔn,xiǎn,péi,fèi,zōu,qí,duì,lún,yīn,jū,chuí,chén,pī,líng,táo,xiàn,lù,shēng,xiǎn,yīn,zhǔ,yáng,réng,xiá,chóng,yàn yǎn,yīn,yú yáo shù,dī,yú,lóng,wēi,wēi,niè,duì zhuì,suí duò,àn,huáng,jiē,suí,yǐn yìn,qí gāi ái,yǎn,huī duò,gé,yǔn,wù,wěi kuí,ài,xì,táng,jì,zhàng,dǎo,áo,xì,yǐn yìn,sà,rǎo,lín,tuí,dèng,pí,suì,suí,ào yù,xiǎn,fén,nǐ,ér,jī,dǎo,xí,yǐn yìn,zhì,huī duò,lǒng,xī,lì dài,lì dài,lì dài,zhuī cuī wéi,hú hè,zhī,sǔn,jùn juàn,nán nàn nuó,yì,què qiāo qiǎo,yàn,qín,jiān,xióng,yǎ,jí,gù,huán,zhì,gòu,jùn juàn,cí,yōng,jū,chú,hū,zá,luò,yú,chóu,diāo,suī,hàn,huò,shuāng,guàn huán,chú,zá,yōng,jī,guī xī,chóu,liù,lí,nán nàn nuó,yù,zá,chóu,jí,yǔ yù,yú,xuě,nǎ,fǒu,sè xí,mù,wén,fēn,pāng,yún,lì,chì,yāng,líng,léi,án,báo,wù méng,diàn,dàng,hū hù,wù,diào,xū,jì,mù,chén,xiāo,zhá,tíng,zhèn,pèi,méi,líng,qī,zhōu,huò,shà,fēi,hóng,zhān,yīn,ní,shù,tún,lín,líng,dòng,yīng,wù,líng,shuāng,líng,xiá,hóng,yīn,mài,mài,yǔn,liù,mèng,bīn,wù,wèi,kuò,yín,xí,yì,ǎi,dàn,tèng,xiàn,yù,lòu lù,lóng,dài,jí,pāng,yáng,bà,pī,wēi,fēng,xì,jì,mái,méng,méng,léi,lì,huò,ǎi,fèi,dài,lóng,lìng,ài,fēng,lì,bǎo,hè,hè,hè,bìng,qīng,qīng,jìng liàng,tiān,zhèng,jìng,chēng,qìng,jìng,jìng,diàn,jìng,tiān,fēi,fēi,kào,mí,miàn,miàn,pào,yè,miǎn,huì,yè,gé,dīng,chá,jiān,rèn,dí,dù,wù,rèn,qín,jìn,xuē,niǔ,bǎ,yǐn,sǎ,nà,mò,zǔ,dá,bàn,xiè,yào,táo,bèi,jiē,hóng,páo,yāng yàng,bǐng,yīn,gé tà sǎ,táo,jié jí,xié,ān,ān,hén,gǒng,qiǎ,dá,qiáo,tīng,mán mèn,biān yìng,suī,tiáo,qiào shāo,xuān juān,kòng,běng,tà,shàng zhǎng,bǐng pí bì bēi,kuò,jū,la,xiè dié,róu,bāng,ēng,qiū,qiū,hé,qiào,mù móu,jū,jiàn jiān,biān,dī,jiān,wēn yùn,tāo,gōu,tà,bèi,xié,pán,gé,bì bǐng,kuò,tāng,lóu,guì,qiáo,xuē,jī,jiān,jiāng,chàn,dá,huò,xiǎn,qiān,dú,wā,jiān,lán,wéi,rèn,fú,mèi wà,quàn,gé,wěi,qiào,hán,chàng,kuò,rǒu,yùn,shè xiè,wěi,gé,bài,tāo,gōu,yùn,gāo,bì,wěi,suì,dú,wà,dú,wéi,rèn,fú,hán,wěi,yùn wēn,tāo,jiǔ,jiǔ,xiān,xiè,xiān,jī,yīn,zá,yùn,sháo,lè,péng,huáng,yīng,yùn,péng,ān,yīn,xiǎng,hù,yè,dǐng,qǐng,qiú,xiàng,shùn,hān,xū,yí,xù,ě,sòng,kuǐ,qí,háng,yù,wán,bān,dùn,dí,dān,pàn,pō,lǐng,chè,jǐng,lèi,hé,qiāo,è,é,wěi,jié,kuò,shěn,yí,yí,kē,duǐ,yǔ,pīng,lèi,fǔ,jiá,tóu,huì,kuí,jiá,luō,tǐng,chēng,yǐng,jūn,hú,hàn,jǐng,tuí,tuí,bīn,lài,tuí,zī,zī,chuí,dìng,lài,tán,hàn,qiān,kē,cuì,jiǒng,qīn,yí,sāi,tí,é,è,yán,wèn,kǎn,yóng,zhuān,yán,xiǎn,xìn,yǐ,yuàn,sǎng,diān,diān,jiǎng,kuī,lèi,láo,piǎo,wài,mān,cù,yáo,hào,qiáo,gù,xùn,yǎn,huì,chàn,rú,méng,bīn,xiǎn,pín,lú,lǎn,niè,quán,yè,dǐng,qǐng,hān,xiàng,shùn,xū,xū,wán,gù,dùn,qí,bān,sòng,háng,yù,lú,lǐng,pō,jǐng gěng,jié xié jiá,jiá,tǐng,hé gé,yǐng,jiǒng,kē,yí,pín bīn,huì,tuí,hàn,yǐng,yǐng,kē,tí,yóng,è,zhuān,yán,é,niè,mān,diān,sǎng,hào,lèi,chàn zhàn,rú,pín,quán,fēng fěng,biāo diū,guā,fú,xiā,zhǎn,biāo,sà,bá fú,tái,liè,guā,xuàn,xiāo,jù,biāo,sī,wěi,yáng,yáo,sōu,kǎi,sāo sōu,fān,liú,xí,liù liáo,piāo,piāo,liú,biāo,biāo,biāo,liáo,biāo,sè,fēng,xiū,fēng fěng,yáng,zhǎn,biāo,sà,jù,sī,sōu,yáo,liú,piāo,biāo,biāo,fēi,fān,fēi,fēi,shí sì yì,shí,cān,jī,dìng,sì,tuō,zhān,sūn,xiǎng,tún,rèn,yù,yǎng juàn,chì,yǐn yìn,fàn,fàn,sūn,yǐn yìn,zhù tǒu,yí sì,zuò zé zhā,bì,jiě,tāo,bǎo,cí,tiè,sì,bǎo,shì,duò,hài,rèn,tiǎn,jiǎo,hé,bǐng,yáo,tóng,cí,xiǎng,yǎng,juàn,ěr,yàn,lè,xī,cān,bō,něi,è,bū,jùn,dòu,sù,yú,shì,yáo,hún,guǒ,shì,jiàn,chuò,bǐng,xiàn,bù,yè,dàn,fēi,zhāng,wèi,guǎn,è,nuǎn,yùn,hú,huáng,tiè,huì,jiān,hóu,ài,xíng,fēn,wèi,gǔ,chā,sòng,táng,bó,gāo,xì,kuì,liù,sōu,táo,yè,wēn,mó,táng,mán,bì,yù,xiū,jǐn,sǎn,kuì,zhuàn,shàn,xī,dàn,yì,jī,ráo,chēng,yōng,tāo,wèi,xiǎng,zhān,fēn,hài,méng,yàn,mó,chán,xiǎng náng,luó,zàn,náng,shí,dìng,jī,tuō,xíng,tún,xì,rèn,yù,chì,fàn,yǐn,jiàn,shì,bǎo,sì,duò,yí,ěr,ráo,xiǎng,hé,gē le,jiǎo,xī,bǐng,bō,dòu,è,yú,něi,jùn,guǒ,hún,xiàn,guǎn,chā,kuì,gǔ,sōu,chán,yè,mó,bó,liù liú,xiū,jǐn,mán,sǎn,zhuàn,náng nǎng,shǒu,kuí,guó,xiāng,fēn,bó,ní,bì,bó,tú,hān,fēi,jiān,ān,ài,fù,xiān,yūn wò,xīn,fén,pīn,xīn,mǎ,yù,féng píng,hàn hán,dí,tuó duò,tuō zhé,chí,xùn,zhù,zhī shì,pèi,xìn jìn,rì,sà,yǔn,wén,zhí,dǎn dàn,lú,yóu,bó,bǎo,jué kuài,tuó duò,yì,qū,wén,qū,jiōng,pǒ,zhāo,yuān,pēng,zhòu,jù,zhù,nú,jū,pī,zǎng,jià,líng,zhěn,tái dài,fù,yǎng,shǐ,bì,tuó,tuó,sì,liú,mà,pián,táo,zhì,róng,téng,dòng,xún xuān,quán,shēn,jiōng,ěr,hài,bó,zhū,yīn,luò,zhōu,dàn,hài,liú,jú,sǒng,qīn,máng,liáng láng,hàn,tú,xuān,tuì,jùn,ě,chěng,xīng,sì,lù,zhuī,zhōu,shè,pián,kūn,táo,lái,zōng,kè,qí,qí,yàn,fēi,sāo,yàn,gé,yǎo,wù,piàn,cōng,piàn,qián,fēi,huáng,qián,huō,yú,tí,quán,xiá,zōng,kuí,róu,sī,guā,tuó,guī,sōu,qiān,chéng,zhì,liú,péng,téng,xí,cǎo,dú,yàn,yuán,zōu,sāo,shàn,qí,zhì,shuāng,lù,xí,luó,zhāng,mò,ào,cān,piào,cōng,qū,bì,zhì,yù,xū,huá,bō,sù,xiāo,lín,zhàn,dūn,liú,tuó,céng,diàn,jiāo,tiě,yàn,luó,zhān,jīng,yì,yè,tuó,pīn,zhòu,yàn,lóng,lǘ,téng,xiāng,jì,shuāng,jú,xí,huān,lí,biāo,mǎ,yù,tuó,xùn,chí,qū,rì,bó,lǘ,zǎng,shǐ,sì,fù,jū,zōu,zhù,tuó,nú,jià,yì,tái,xiāo,mà,yīn,jiāo,huá,luò,hài,pián,biāo,lí,chěng,yàn,xīng,qīn,jùn,qí,qí,kè,zhuī,zōng,sù,cān,piàn,zhì,kuí,sāo sǎo,wù,áo,liú,qiān,shàn,piào biāo,luó,cōng,chǎn,zhòu,jì,shuāng,xiāng,gǔ gū,wěi,wěi,wěi,yú,gàn,yì,āng,tóu,jiè,bào,bèi mó,cī,tǐ,dǐ,kū,hái,qiāo xiāo,hóu,kuà,gé,tuǐ,gěng,pián,bì,kē,qià,yú,suí,lóu,bó,xiāo,bǎng,bó jué,cī,kuān,bìn,mó,liáo,lóu,xiāo,dú,zāng,suǐ,tǐ tī,bìn,kuān,lú,gāo,gāo,qiào,kāo,qiǎo,láo,sào,biāo,kūn,kūn,dí,fǎng,xiū,rán,máo,dàn,kūn,bìn,fà,tiáo,pī,zī,fà,rán,tì,bào,bì pǒ,máo méng,fú,ér,èr,qū,gōng,xiū,kuò yuè,jì,péng,zhuā,shāo,shā,tì,lì,bìn,zōng,tì,péng,sōng,zhēng,quán,zōng,shùn,jiǎn,duǒ,hú,là,jiū,qí,lián,zhěn,bìn,péng,mà,sān,mán,mán,sēng,xū,liè,qiān,qiān,nóng,huán,kuò,níng,bìn,liè,ráng,dòu,dòu,nào,hòng,xì,dòu,kàn,dòu,dòu,jiū,chàng,yù,yù,gé lì,yàn,fǔ,zèng,guī,zōng,liù,guī,shāng,yù,guǐ,mèi,jì,qí,gà,kuí,hún,bá,pò,mèi,xū,yǎn,xiāo,liǎng,yù,tuí,qī,wǎng,liǎng,wèi,gān,chī,piāo,bì,mó,jī,xū,chǒu,yǎn,zhān,yú,dāo,rén,jì,bā bà,hóng,tuō,diào,jǐ,yú,é,jì,shā,háng,tún,mò,jiè,shěn,bǎn,yuán,pí,lǔ,wén,hú,lú,zā,fáng,fén,nà,yóu,piàn,mó,hé,xiá,qū,hān,pī,líng,tuó,bà,qiú,píng,fú,bì,cǐ jì,wèi,jū,diāo,bó bà,yóu,gǔn,pí,nián,xīng,tái,bào,fù,zhǎ zhà,jù,gū,shí,dōng,chou dài,tǎ,jié,shū,hòu,xiǎng,ér,ān,wéi,zhào,zhū,yìn,liè,luò gé,tóng,yí,yì,bìng,wěi,jiāo,kū,guī xié wā kuí,xiān xiǎn,gé,huí,lǎo,fú,kào,xiū,tuō,jūn,tí,miǎn,shāo,zhǎ,suō,qīn,yú,něi,zhé,gǔn,gěng,sū,wú,qiú,shān,pū bū,huàn,tiáo,lǐ,shā,shā,kào,méng,chéng,lí,zǒu,xī,yǒng,shēn,zī,qí,qīng,xiǎng,něi,chún,jì,diāo,qiè,gù,zhǒu,dōng,lái,fēi,ní,yì sī,kūn,lù,jiù,chāng,jīng,lún,líng,zōu,lí,měng,zōng,zhì,nián,hǔ,yú,dǐ,shī,shēn,huàn,tí,hóu,xīng,zhū,là,zōng,jì,biān,biān,huàn,quán,zéi,wēi,wēi,yú,chūn,róu,dié,huáng,liàn,yǎn,qiū,qiū,jiǎn,bī,è,yáng,fù,sāi,jiān,xiā,tuǒ,hú,shì,ruò,xuān,wēn,jiān,hào,wū,páng,sāo,liú,mǎ,shí,shī,guān,zī,téng,tǎ,yáo,è,yóng,qián,qí,wēn,ruò,shén,lián,áo,lè,huī,mǐn,jì,tiáo,qū,jiān,shēn,mán,xí,qiú,piào,jì,jì,zhú,jiāng,xiū,zhuān,yōng,zhāng,kāng,xuě,biē,yù,qū,xiàng,bō,jiǎo,xún,sù,huáng,zūn,shàn,shàn,fān,guì,lín,xún,yáo,xǐ,zēng,xiāng,fèn,guān,hòu,kuài,zéi,sāo,zhān,gǎn,guì,yìng,lǐ,cháng,léi,shǔ,ài,rú,jì,xù,hù,shǔ,lǐ,liè,lè,miè,zhēn,xiǎng,è,lú,guàn,lí,xiān,yú,dāo,jǐ,yóu,tún,lǔ,fáng,bā bà,hé gě,bà,píng,nián,lú,yóu,zhǎ zhà,fù,bó bà,bào,hòu,pí,tái,guī xié,jié,kào,wěi,ér,tóng,zéi,hòu,kuài,jì,jiāo,xiān xiǎn,zhǎ,xiǎng,xún,gěng,lí,lián,jiān,lǐ,shí,tiáo,gǔn,shā,huàn,jūn,jì,yǒng,qīng,líng,qí,zōu,fēi,kūn,chāng,gù,ní,nián,diāo,jīng,shēn,shī,zī,fèn,dié,bī,cháng,tí,wēn,wēi,sāi xǐ,è,qiū,fù,huáng,quán,jiāng,biān,sāo,áo,qí,tǎ,guān,yáo,páng,jiān,lè,biào,xuě,biē,mán,mǐn,yōng,wèi,xí,guì jué,shàn,lín,zūn,hù,gǎn,lǐ,zhān shàn,guǎn,niǎo diǎo,yǐ,fú,lì,jiū,bú,yàn,fú,diāo zhāo,jī,fèng,rù,gān hàn yàn,shī,fèng,míng,bǎo,yuān,zhī,hù,qín,fū guī,bān fén,wén,jiān qiān zhān,shī,yù,fǒu,yāo,jué,jué,pǐ,huān,zhèn,bǎo,yàn,yā,zhèng,fāng,fèng,wén,ōu,dài,jiā,rú,líng,miè,fú,tuó,mín,lì,biǎn,zhì,gē,yuān,cí,qú,xiāo,chī,dàn,jū,yāo,gū,zhōng,yù,yāng,yù,yā,dié,yù,tián,yīng,duī,wū,ér,guā,ài,zhī,yàn,héng,xiāo,jiá,liè,zhū,yáng,yí,hóng,lù,rú,móu,gē,rén,jiāo,xiū,zhōu,chī,luò,héng,nián,ě,luán,jiá,jì,tú,huān,tuǒ,bū,wú,jiān,yù,bó,jùn,jùn,bī,xī,jùn,jú,tū,jìng,tí,é,é,kuáng,hú,wǔ,shēn,lài,zān,pàn,lù,pí,shū,fú,ān,zhuó,péng,qín,qiān,bēi,diāo,lù,què,jiān,jú,tù,yā,yuān,qí,lí,yè,zhuī,kōng,duò,kūn,shēng,qí,jīng,yì,yì,jīng,zī,lái,dōng,qī,chún,gēng,jū,qū,yì,zūn,jī,shù,yīng,chì,miáo,róu,ān,qiū,tí chí,hú,tí chí,è,jiē,máo,fú bì,chūn,tú,yǎn,hé jiè,yuán,piān biǎn,kūn,méi,hú,yīng,chuàn zhì,wù,jú,dōng,cāng qiāng,fǎng,hè hú,yīng,yuán,xiān,wēng,shī,hè,chú,táng,xiá,ruò,liú,jī,gǔ hú,jiān,sǔn xùn,hàn,cí,cí,yì,yào,yàn,jī,lì,tián,kòu,tī,tī,yì,tú,mǎ,xiāo,gāo,tián,chén,jì,tuán,zhè,áo,yǎo,yī,ōu,chì,zhì,liù,yōng,lóu lǚ,bì,shuāng,zhuó,yú,wú,jué,yín,tí,sī,jiāo,yì,huá,bì,yīng,sù,huáng,fán,jiāo,liáo,yàn,gāo,jiù,xián,xián,tú,mǎi,zūn,yù,yīng,lù,tuán,xián,xué,yì,pì,zhǔ,luó,xī,yì,jī,zé,yú,zhān,yè,yáng,pì,níng,hù,mí,yīng,méng,dí,yuè,yù,lěi,bǔ,lú,hè,lóng,shuāng,yuè,yīng,guàn,qú,lí,luán,niǎo,jiū,jī,yuān,míng,shī,ōu,yā,cāng,bǎo,zhèn,gū,dōng,lú,yā,xiāo,yāng,líng,chī,qú,yuān,xué,tuó,sī,zhì,ér,guā,xiū,héng,zhōu,gē,luán,hóng,wú,bó,lí,juān,hú,é,yù,xián,tí,wǔ,què,miáo,ān,kūn,bēi,péng,qiān,chún,gēng,yuān,sù,hú,hé,è,gǔ,qiū,cí,méi,wù,yì,yào,wēng,liú,jī,yì,jiān,hè,yī,yīng,zhè,liù,liáo,jiāo,jiù,yù,lù,huán,zhān,yīng,hù,méng,guàn,shuāng,lǔ,jīn,líng,jiǎn,xián,cuó,jiǎn,jiǎn,yán,cuó,lù,yōu,cū,jǐ,páo biāo,cū,páo,zhù cū,jūn qún,zhǔ,jiān,mí,mí,yǔ,liú,chén,jūn,lín,ní,qí,lù,jiù,jūn,jīng,lí lì,xiāng,xián,jiā,mí,lì,shè,zhāng,lín,jīng,qí,líng,yán,cū,mài,mài,hé,chǎo,fū,miàn,miàn,fū,pào,qù,qū,móu,fū,xiàn,lái,qū,miàn,chi,fēng,fū,qū,miàn,má,mó me,mó me,huī,mí,zōu,nún,fén,huáng,huáng,jīn,guāng,tiān,tǒu,hóng,huà,kuàng,hóng,shǔ,lí,nián,chī,hēi,hēi,yì,qián,dǎn,xì,tún,mò,mò,qián,dài,chù,yǒu,diǎn,yī,xiá,yǎn,qū,měi,yǎn,qíng,yuè,lí,dǎng,dú,cǎn,yān,yǎn,yǎn,dàn shèn,àn,zhěn yān,dài,cǎn,yī,méi,dǎn zhǎn,yǎn,dú,lú,zhǐ,fěn,fú,fǔ,mǐn miǎn měng,mǐn miǎn měng,yuán,cù,qù,cháo,wā,zhū,zhī,měng,áo,biē,tuó,bì,yuán,cháo,tuó,dǐng,mì,nài,dǐng,zī,gǔ,gǔ,dōng,fén,táo,yuān,pí,chāng,gāo,cào,yuān,tāng,tēng,shǔ,shǔ,fén,fèi,wén,bá,diāo,tuó,zhōng,qú,shēng,shí,yòu,shí,tíng,wú,jú,jīng,hún,jú,yǎn,tū,sī,xī,xiàn,yǎn,léi,bí,yào,qiú,hān,wù,wù,hōu,xiè,è,zhā,xiù,wèng,zhā,nòng,nàng,qí zhāi,zhāi,jì,zī,jí,jī,qí jì zī zhāi,jī,chǐ,chèn,chèn,hé,yá,yīn,xiè,bāo,zé,xiè,zī,chī,yàn,jǔ,tiáo,líng,líng,chū,quán,xiè,yín,niè,jiù,yǎo,chuò,yǔn,yǔ,chǔ,yǐ,ní,zé,zōu,qǔ,yǔn,yǎn,yú,è,wò,yì,cī,zōu,diān,chǔ,jìn,yà,chǐ,chèn,hé,yín kěn,jǔ,líng,bāo,tiáo,zī,yín kěn,yǔ,chuò,qǔ,wò,lóng lǒng,páng,gōng wò,páng,yǎn,lóng,lóng lǒng,gōng,kān,dá,líng,dá,lóng,gōng,kān,guī jūn qiū,qiū,biē,guī jūn qiū,yuè,chuī,hé,jiǎo,xié,yù";

var window$1 = { pinyin_dict_withtone };(function(global, factory) {
	{
		factory(global);
	}
})(typeof window$1 !== "undefined" ? window$1 : globalThis, function(window) {

	
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
const pinyinUtil = window$1.pinyinUtil;

function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}

const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => toTypeString(val) === "[object Date]";
const isRegExp = (val) => toTypeString(val) === "[object RegExp]";
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
const capitalize = cacheStringFunction(
  (str) => str.charAt(0).toUpperCase() + str.slice(1)
);
const toHandlerKey = cacheStringFunction(
  (str) => str ? `on${capitalize(str)}` : ``
);
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
const looseToNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
const toNumber = (val) => {
  const n = isString(val) ? Number(val) : NaN;
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global$1 !== "undefined" ? global$1 : {});
};

const GLOBALS_WHITE_LISTED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console";
const isGloballyWhitelisted = /* @__PURE__ */ makeMap(GLOBALS_WHITE_LISTED);

function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString(value)) {
    return value;
  } else if (isObject(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}

const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
function includeBooleanAttr(value) {
  return !!value || value === "";
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
  let aValidType = isDate(a);
  let bValidType = isDate(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray(a);
  bValidType = isArray(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject(a);
  bValidType = isObject(b);
  if (aValidType || bValidType) {
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
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}

const toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};

let activeEffectScope;
class EffectScope {
  constructor(detached = false) {
    this.detached = detached;
    /**
     * @internal
     */
    this._active = true;
    /**
     * @internal
     */
    this.effects = [];
    /**
     * @internal
     */
    this.cleanups = [];
    this.parent = activeEffectScope;
    if (!detached && activeEffectScope) {
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
        this
      ) - 1;
    }
  }
  get active() {
    return this._active;
  }
  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
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
    if (this._active) {
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
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
      this._active = false;
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
      deps[i].w |= trackOpBit;
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
      } else {
        deps[ptr++] = dep;
      }
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
    deps.length = ptr;
  }
};

const targetMap = /* @__PURE__ */ new WeakMap();
let effectTrackDepth = 0;
let trackOpBit = 1;
const maxMarkerBits = 30;
let activeEffect;
const ITERATE_KEY = Symbol("");
const MAP_KEY_ITERATE_KEY = Symbol("");
class ReactiveEffect {
  constructor(fn, scheduler = null, scope) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
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
      } else {
        cleanupEffect(this);
      }
      return this.fn();
    } finally {
      if (effectTrackDepth <= maxMarkerBits) {
        finalizeDepMarkers(this);
      }
      trackOpBit = 1 << --effectTrackDepth;
      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = void 0;
      if (this.deferStop) {
        this.stop();
      }
    }
  }
  stop() {
    if (activeEffect === this) {
      this.deferStop = true;
    } else if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect2) {
  const { deps } = effect2;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
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
  shouldTrack = last === void 0 ? true : last;
}
function track(target, type, key) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep());
    }
    trackEffects(dep);
  }
}
function trackEffects(dep, debuggerEventExtraInfo) {
  let shouldTrack2 = false;
  if (effectTrackDepth <= maxMarkerBits) {
    if (!newTracked(dep)) {
      dep.n |= trackOpBit;
      shouldTrack2 = !wasTracked(dep);
    }
  } else {
    shouldTrack2 = !dep.has(activeEffect);
  }
  if (shouldTrack2) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = [];
  if (type === "clear") {
    deps = [...depsMap.values()];
  } else if (key === "length" && isArray(target)) {
    const newLength = Number(newValue);
    depsMap.forEach((dep, key2) => {
      if (key2 === "length" || key2 >= newLength) {
        deps.push(dep);
      }
    });
  } else {
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }
    switch (type) {
      case "add":
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else if (isIntegerKey(key)) {
          deps.push(depsMap.get("length"));
        }
        break;
      case "delete":
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        }
        break;
      case "set":
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
  } else {
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
  const effects = isArray(dep) ? dep : [...dep];
  for (const effect2 of effects) {
    if (effect2.computed) {
      triggerEffect(effect2);
    }
  }
  for (const effect2 of effects) {
    if (!effect2.computed) {
      triggerEffect(effect2);
    }
  }
}
function triggerEffect(effect2, debuggerEventExtraInfo) {
  if (effect2 !== activeEffect || effect2.allowRecurse) {
    if (effect2.scheduler) {
      effect2.scheduler();
    } else {
      effect2.run();
    }
  }
}
function getDepFromReactive(object, key) {
  var _a;
  return (_a = targetMap.get(object)) == null ? void 0 : _a.get(key);
}

const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
const get$1 = /* @__PURE__ */ createGetter();
const shallowGet = /* @__PURE__ */ createGetter(false, true);
const readonlyGet = /* @__PURE__ */ createGetter(true);
const shallowReadonlyGet = /* @__PURE__ */ createGetter(true, true);
const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    instrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        return arr[key](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    instrumentations[key] = function(...args) {
      pauseTracking();
      const res = toRaw(this)[key].apply(this, args);
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}
function hasOwnProperty(key) {
  const obj = toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
function createGetter(isReadonly2 = false, shallow = false) {
  return function get2(target, key, receiver) {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return shallow;
    } else if (key === "__v_raw" && receiver === (isReadonly2 ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
      return target;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly2) {
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (shallow) {
      return res;
    }
    if (isRef(res)) {
      return targetIsArray && isIntegerKey(key) ? res : res.value;
    }
    if (isObject(res)) {
      return isReadonly2 ? readonly(res) : reactive(res);
    }
    return res;
  };
}
const set$1 = /* @__PURE__ */ createSetter();
const shallowSet = /* @__PURE__ */ createSetter(true);
function createSetter(shallow = false) {
  return function set2(target, key, value, receiver) {
    let oldValue = target[key];
    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
      return false;
    }
    if (!shallow) {
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value);
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
    trigger(target, "delete", key, void 0);
  }
  return result;
}
function has$1(target, key) {
  const result = Reflect.has(target, key);
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, "has", key);
  }
  return result;
}
function ownKeys(target) {
  track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
  return Reflect.ownKeys(target);
}
const mutableHandlers = {
  get: get$1,
  set: set$1,
  deleteProperty,
  has: has$1,
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
const shallowReactiveHandlers = /* @__PURE__ */ extend(
  {},
  mutableHandlers,
  {
    get: shallowGet,
    set: shallowSet
  }
);
const shallowReadonlyHandlers = /* @__PURE__ */ extend(
  {},
  readonlyHandlers,
  {
    get: shallowReadonlyGet
  }
);

const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function get(target, key, isReadonly = false, isShallow = false) {
  target = target["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (!isReadonly) {
    if (key !== rawKey) {
      track(rawTarget, "get", key);
    }
    track(rawTarget, "get", rawKey);
  }
  const { has: has2 } = getProto(rawTarget);
  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
  if (has2.call(rawTarget, key)) {
    return wrap(target.get(key));
  } else if (has2.call(rawTarget, rawKey)) {
    return wrap(target.get(rawKey));
  } else if (target !== rawTarget) {
    target.get(key);
  }
}
function has(key, isReadonly = false) {
  const target = this["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (!isReadonly) {
    if (key !== rawKey) {
      track(rawTarget, "has", key);
    }
    track(rawTarget, "has", rawKey);
  }
  return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
}
function size(target, isReadonly = false) {
  target = target["__v_raw"];
  !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
  return Reflect.get(target, "size", target);
}
function add(value) {
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  if (!hadKey) {
    target.add(value);
    trigger(target, "add", value, value);
  }
  return this;
}
function set(key, value) {
  value = toRaw(value);
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  }
  const oldValue = get2.call(target, key);
  target.set(key, value);
  if (!hadKey) {
    trigger(target, "add", key, value);
  } else if (hasChanged(value, oldValue)) {
    trigger(target, "set", key, value);
  }
  return this;
}
function deleteEntry(key) {
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  }
  get2 ? get2.call(target, key) : void 0;
  const result = target.delete(key);
  if (hadKey) {
    trigger(target, "delete", key, void 0);
  }
  return result;
}
function clear() {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  const result = target.clear();
  if (hadItems) {
    trigger(target, "clear", void 0, void 0);
  }
  return result;
}
function createForEach(isReadonly, isShallow) {
  return function forEach(callback, thisArg) {
    const observed = this;
    const target = observed["__v_raw"];
    const rawTarget = toRaw(target);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
    return target.forEach((value, key) => {
      return callback.call(thisArg, wrap(value), wrap(key), observed);
    });
  };
}
function createIterableMethod(method, isReadonly, isShallow) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
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
  return function(...args) {
    return type === "delete" ? false : this;
  };
}
function createInstrumentations() {
  const mutableInstrumentations2 = {
    get(key) {
      return get(this, key);
    },
    get size() {
      return size(this);
    },
    has,
    add,
    set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  const shallowInstrumentations2 = {
    get(key) {
      return get(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has,
    add,
    set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  const readonlyInstrumentations2 = {
    get(key) {
      return get(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  const shallowReadonlyInstrumentations2 = {
    get(key) {
      return get(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(
      method,
      false,
      false
    );
    readonlyInstrumentations2[method] = createIterableMethod(
      method,
      true,
      false
    );
    shallowInstrumentations2[method] = createIterableMethod(
      method,
      false,
      true
    );
    shallowReadonlyInstrumentations2[method] = createIterableMethod(
      method,
      true,
      true
    );
  });
  return [
    mutableInstrumentations2,
    readonlyInstrumentations2,
    shallowInstrumentations2,
    shallowReadonlyInstrumentations2
  ];
}
const [
  mutableInstrumentations,
  readonlyInstrumentations,
  shallowInstrumentations,
  shallowReadonlyInstrumentations
] = /* @__PURE__ */ createInstrumentations();
function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly;
    } else if (key === "__v_isReadonly") {
      return isReadonly;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};

const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1 /* COMMON */;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2 /* COLLECTION */;
    default:
      return 0 /* INVALID */;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 /* INVALID */ : targetTypeMap(toRawType(value));
}
function reactive(target) {
  if (isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0 /* INVALID */) {
    return target;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? toRaw(raw) : observed;
}
function markRaw(value) {
  def(value, "__v_skip", true);
  return value;
}
const toReactive = (value) => isObject(value) ? reactive(value) : value;
const toReadonly = (value) => isObject(value) ? readonly(value) : value;

function trackRefValue(ref2) {
  if (shouldTrack && activeEffect) {
    ref2 = toRaw(ref2);
    {
      trackEffects(ref2.dep || (ref2.dep = createDep()));
    }
  }
}
function triggerRefValue(ref2, newVal) {
  ref2 = toRaw(ref2);
  const dep = ref2.dep;
  if (dep) {
    {
      triggerEffects(dep);
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
    this.dep = void 0;
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
function triggerRef(ref2) {
  triggerRefValue(ref2);
}
function unref(ref2) {
  return isRef(ref2) ? ref2.value : ref2;
}
function toValue(source) {
  return isFunction(source) ? source() : unref(source);
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class CustomRefImpl {
  constructor(factory) {
    this.dep = void 0;
    this.__v_isRef = true;
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this)
    );
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
  const ret = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = propertyToRef(object, key);
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
    return val === void 0 ? this._defaultValue : val;
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
  get dep() {
    return getDepFromReactive(toRaw(this._object), this._key);
  }
}
class GetterRefImpl {
  constructor(_getter) {
    this._getter = _getter;
    this.__v_isRef = true;
    this.__v_isReadonly = true;
  }
  get value() {
    return this._getter();
  }
}
function toRef(source, key, defaultValue) {
  if (isRef(source)) {
    return source;
  } else if (isFunction(source)) {
    return new GetterRefImpl(source);
  } else if (isObject(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue);
  } else {
    return ref(source);
  }
}
function propertyToRef(source, key, defaultValue) {
  const val = source[key];
  return isRef(val) ? val : new ObjectRefImpl(
    source,
    key,
    defaultValue
  );
}

class ComputedRefImpl {
  constructor(getter, _setter, isReadonly, isSSR) {
    this._setter = _setter;
    this.dep = void 0;
    this.__v_isRef = true;
    this["__v_isReadonly"] = false;
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = this;
    this.effect.active = this._cacheable = !isSSR;
    this["__v_isReadonly"] = isReadonly;
  }
  get value() {
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
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  const onlyGetter = isFunction(getterOrOptions);
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter, isSSR);
  return cRef;
}

function warn(msg, ...args) {
  return;
}
function assertNumber(val, type) {
  return;
}
function callWithErrorHandling(fn, instance, type, args) {
  let res;
  try {
    res = args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
  return res;
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
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
    const exposedInstance = instance.proxy;
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
    const appErrorHandler = instance.appContext.config.errorHandler;
    if (appErrorHandler) {
      callWithErrorHandling(
        appErrorHandler,
        null,
        10,
        [err, exposedInstance, errorInfo]
      );
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev);
}
function logError(err, type, contextVNode, throwInDev = true) {
  {
    console.error(err);
  }
}

let isFlushing = false;
let isFlushPending = false;
const queue = [];
let flushIndex = 0;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
let currentFlushPromise = null;
function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJobId = getId(queue[middle]);
    middleJobId < id ? start = middle + 1 : end = middle;
  }
  return start;
}
function queueJob(job) {
  if (!queue.length || !queue.includes(
    job,
    isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
  )) {
    if (job.id == null) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job);
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
  const i = queue.indexOf(job);
  if (i > flushIndex) {
    queue.splice(i, 1);
  }
}
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (!activePostFlushCbs || !activePostFlushCbs.includes(
      cb,
      cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex
    )) {
      pendingPostFlushCbs.push(cb);
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}
function flushPreFlushCbs(seen, i = isFlushing ? flushIndex + 1 : 0) {
  for (; i < queue.length; i++) {
    const cb = queue[i];
    if (cb && cb.pre) {
      queue.splice(i, 1);
      i--;
      cb();
    }
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;
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
  queue.sort(comparator);
  const check = NOOP;
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && job.active !== false) {
        if (!!("production" !== "production") && check(job)) ;
        callWithErrorHandling(job, null, 14);
      }
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;
    flushPostFlushCbs();
    isFlushing = false;
    currentFlushPromise = null;
    if (queue.length || pendingPostFlushCbs.length) {
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
  } else if (!devtoolsNotInstalled) {
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
  } else if (
    // handle late devtools injection - only do this if we are in an actual
    // browser environment to avoid the timer handle stalling test runner exit
    // (#4815)
    typeof window !== "undefined" && // some envs mock window but not fully
    window.HTMLElement && // also exclude jsdom
    !((_b = (_a = window.navigator) == null ? void 0 : _a.userAgent) == null ? void 0 : _b.includes("jsdom"))
  ) {
    const replay = target.__VUE_DEVTOOLS_HOOK_REPLAY__ = target.__VUE_DEVTOOLS_HOOK_REPLAY__ || [];
    replay.push((newHook) => {
      setDevtoolsHook(newHook, target);
    });
    setTimeout(() => {
      if (!devtools) {
        target.__VUE_DEVTOOLS_HOOK_REPLAY__ = null;
        devtoolsNotInstalled = true;
        buffer = [];
      }
    }, 3e3);
  } else {
    devtoolsNotInstalled = true;
    buffer = [];
  }
}
function devtoolsInitApp(app, version) {
  emit$1("app:init" /* APP_INIT */, app, version, {
    Fragment,
    Text,
    Comment,
    Static
  });
}
function devtoolsUnmountApp(app) {
  emit$1("app:unmount" /* APP_UNMOUNT */, app);
}
const devtoolsComponentAdded = /* @__PURE__ */ createDevtoolsComponentHook(
  "component:added" /* COMPONENT_ADDED */
);
const devtoolsComponentUpdated = /* @__PURE__ */ createDevtoolsComponentHook("component:updated" /* COMPONENT_UPDATED */);
const _devtoolsComponentRemoved = /* @__PURE__ */ createDevtoolsComponentHook(
  "component:removed" /* COMPONENT_REMOVED */
);
const devtoolsComponentRemoved = (component) => {
  if (devtools && typeof devtools.cleanupBuffer === "function" && // remove the component if it wasn't buffered
  !devtools.cleanupBuffer(component)) {
    _devtoolsComponentRemoved(component);
  }
};
function createDevtoolsComponentHook(hook) {
  return (component) => {
    emit$1(
      hook,
      component.appContext.app,
      component.uid,
      component.parent ? component.parent.uid : void 0,
      component
    );
  };
}
function devtoolsComponentEmit(component, event, params) {
  emit$1(
    "component:emit" /* COMPONENT_EMIT */,
    component.appContext.app,
    component,
    event,
    params
  );
}

function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted)
    return;
  const props = instance.vnode.props || EMPTY_OBJ;
  let args = rawArgs;
  const isModelListener = event.startsWith("update:");
  const modelArg = isModelListener && event.slice(7);
  if (modelArg && modelArg in props) {
    const modifiersKey = `${modelArg === "modelValue" ? "model" : modelArg}Modifiers`;
    const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
    if (trim) {
      args = rawArgs.map((a) => isString(a) ? a.trim() : a);
    }
    if (number) {
      args = rawArgs.map(looseToNumber);
    }
  }
  if (__VUE_PROD_DEVTOOLS__) {
    devtoolsComponentEmit(instance, event, args);
  }
  let handlerName;
  let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
  props[handlerName = toHandlerKey(camelize(event))];
  if (!handler && isModelListener) {
    handler = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance,
      6,
      args
    );
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance.emitted) {
      instance.emitted = {};
    } else if (instance.emitted[handlerName]) {
      return;
    }
    instance.emitted[handlerName] = true;
    callWithAsyncErrorHandling(
      onceHandler,
      instance,
      6,
      args
    );
  }
}
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache = appContext.emitsCache;
  const cached = cache.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (__VUE_OPTIONS_API__ && !isFunction(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
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
    if (isObject(comp)) {
      cache.set(comp, null);
    }
    return null;
  }
  if (isArray(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend(normalized, raw);
  }
  if (isObject(comp)) {
    cache.set(comp, normalized);
  }
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2).replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}

let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  currentScopeId = instance && instance.type.__scopeId || null;
  return prev;
}
function pushScopeId(id) {
  currentScopeId = id;
}
function popScopeId() {
  currentScopeId = null;
}
const withScopeId = (_id) => withCtx;
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx)
    return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    let res;
    try {
      res = fn(...args);
    } finally {
      setCurrentRenderingInstance(prevInstance);
      if (renderFnWithContext._d) {
        setBlockTracking(1);
      }
    }
    if (__VUE_PROD_DEVTOOLS__) {
      devtoolsComponentUpdated(ctx);
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    props,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit,
    render,
    renderCache,
    data,
    setupState,
    ctx,
    inheritAttrs
  } = instance;
  let result;
  let fallthroughAttrs;
  const prev = setCurrentRenderingInstance(instance);
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      result = normalizeVNode(
        render.call(
          proxyToUse,
          proxyToUse,
          renderCache,
          props,
          setupState,
          data,
          ctx
        )
      );
      fallthroughAttrs = attrs;
    } else {
      const render2 = Component;
      if (!!("production" !== "production") && attrs === props) ;
      result = normalizeVNode(
        render2.length > 1 ? render2(
          props,
          !!("production" !== "production") ? {
            get attrs() {
              markAttrsAccessed();
              return attrs;
            },
            slots,
            emit
          } : { attrs, slots, emit }
        ) : render2(
          props,
          null
          /* we know it doesn't need it */
        )
      );
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance, 1);
    result = createVNode(Comment);
  }
  let root = result;
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(
            fallthroughAttrs,
            propsOptions
          );
        }
        root = cloneVNode(root, fallthroughAttrs);
      }
    }
  }
  if (vnode.dirs) {
    root = cloneVNode(root);
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
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
      if (child.type !== Comment || child.children === "v-if") {
        if (singleRoot) {
          return;
        } else {
          singleRoot = child;
        }
      }
    } else {
      return;
    }
  }
  return singleRoot;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
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
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (nextProps[key] !== prevProps[key] && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
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
    if (nextProps[key] !== prevProps[key] && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function updateHOCHostEl({ vnode, parent }, el) {
  while (parent && parent.subTree === vnode) {
    (vnode = parent.vnode).el = el;
    parent = parent.parent;
  }
}

const isSuspense = (type) => type.__isSuspense;
const SuspenseImpl = {
  name: "Suspense",
  // In order to make Suspense tree-shakable, we need to avoid importing it
  // directly in the renderer. The renderer checks for the __isSuspense flag
  // on a vnode's type and calls the `process` method, passing in renderer
  // internals.
  __isSuspense: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals) {
    if (n1 == null) {
      mountSuspense(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized,
        rendererInternals
      );
    } else {
      patchSuspense(
        n1,
        n2,
        container,
        anchor,
        parentComponent,
        isSVG,
        slotScopeIds,
        optimized,
        rendererInternals
      );
    }
  },
  hydrate: hydrateSuspense,
  create: createSuspenseBoundary,
  normalize: normalizeSuspenseChildren
};
const Suspense = SuspenseImpl ;
function triggerEvent(vnode, name) {
  const eventListener = vnode.props && vnode.props[name];
  if (isFunction(eventListener)) {
    eventListener();
  }
}
function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals) {
  const {
    p: patch,
    o: { createElement }
  } = rendererInternals;
  const hiddenContainer = createElement("div");
  const suspense = vnode.suspense = createSuspenseBoundary(
    vnode,
    parentSuspense,
    parentComponent,
    container,
    hiddenContainer,
    anchor,
    isSVG,
    slotScopeIds,
    optimized,
    rendererInternals
  );
  patch(
    null,
    suspense.pendingBranch = vnode.ssContent,
    hiddenContainer,
    null,
    parentComponent,
    suspense,
    isSVG,
    slotScopeIds
  );
  if (suspense.deps > 0) {
    triggerEvent(vnode, "onPending");
    triggerEvent(vnode, "onFallback");
    patch(
      null,
      vnode.ssFallback,
      container,
      anchor,
      parentComponent,
      null,
      // fallback tree will not have suspense context
      isSVG,
      slotScopeIds
    );
    setActiveBranch(suspense, vnode.ssFallback);
  } else {
    suspense.resolve(false, true);
  }
}
function patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, slotScopeIds, optimized, { p: patch, um: unmount, o: { createElement } }) {
  const suspense = n2.suspense = n1.suspense;
  suspense.vnode = n2;
  n2.el = n1.el;
  const newBranch = n2.ssContent;
  const newFallback = n2.ssFallback;
  const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
  if (pendingBranch) {
    suspense.pendingBranch = newBranch;
    if (isSameVNodeType(newBranch, pendingBranch)) {
      patch(
        pendingBranch,
        newBranch,
        suspense.hiddenContainer,
        null,
        parentComponent,
        suspense,
        isSVG,
        slotScopeIds,
        optimized
      );
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else if (isInFallback) {
        patch(
          activeBranch,
          newFallback,
          container,
          anchor,
          parentComponent,
          null,
          // fallback tree will not have suspense context
          isSVG,
          slotScopeIds,
          optimized
        );
        setActiveBranch(suspense, newFallback);
      }
    } else {
      suspense.pendingId++;
      if (isHydrating) {
        suspense.isHydrating = false;
        suspense.activeBranch = pendingBranch;
      } else {
        unmount(pendingBranch, parentComponent, suspense);
      }
      suspense.deps = 0;
      suspense.effects.length = 0;
      suspense.hiddenContainer = createElement("div");
      if (isInFallback) {
        patch(
          null,
          newBranch,
          suspense.hiddenContainer,
          null,
          parentComponent,
          suspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        if (suspense.deps <= 0) {
          suspense.resolve();
        } else {
          patch(
            activeBranch,
            newFallback,
            container,
            anchor,
            parentComponent,
            null,
            // fallback tree will not have suspense context
            isSVG,
            slotScopeIds,
            optimized
          );
          setActiveBranch(suspense, newFallback);
        }
      } else if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
        patch(
          activeBranch,
          newBranch,
          container,
          anchor,
          parentComponent,
          suspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        suspense.resolve(true);
      } else {
        patch(
          null,
          newBranch,
          suspense.hiddenContainer,
          null,
          parentComponent,
          suspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        if (suspense.deps <= 0) {
          suspense.resolve();
        }
      }
    }
  } else {
    if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
      patch(
        activeBranch,
        newBranch,
        container,
        anchor,
        parentComponent,
        suspense,
        isSVG,
        slotScopeIds,
        optimized
      );
      setActiveBranch(suspense, newBranch);
    } else {
      triggerEvent(n2, "onPending");
      suspense.pendingBranch = newBranch;
      suspense.pendingId++;
      patch(
        null,
        newBranch,
        suspense.hiddenContainer,
        null,
        parentComponent,
        suspense,
        isSVG,
        slotScopeIds,
        optimized
      );
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else {
        const { timeout, pendingId } = suspense;
        if (timeout > 0) {
          setTimeout(() => {
            if (suspense.pendingId === pendingId) {
              suspense.fallback(newFallback);
            }
          }, timeout);
        } else if (timeout === 0) {
          suspense.fallback(newFallback);
        }
      }
    }
  }
}
function createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, isSVG, slotScopeIds, optimized, rendererInternals, isHydrating = false) {
  const {
    p: patch,
    m: move,
    um: unmount,
    n: next,
    o: { parentNode, remove }
  } = rendererInternals;
  let parentSuspenseId;
  const isSuspensible = isVNodeSuspensible(vnode);
  if (isSuspensible) {
    if (parentSuspense == null ? void 0 : parentSuspense.pendingBranch) {
      parentSuspenseId = parentSuspense.pendingId;
      parentSuspense.deps++;
    }
  }
  const timeout = vnode.props ? toNumber(vnode.props.timeout) : void 0;
  const suspense = {
    vnode,
    parent: parentSuspense,
    parentComponent,
    isSVG,
    container,
    hiddenContainer,
    anchor,
    deps: 0,
    pendingId: 0,
    timeout: typeof timeout === "number" ? timeout : -1,
    activeBranch: null,
    pendingBranch: null,
    isInFallback: true,
    isHydrating,
    isUnmounted: false,
    effects: [],
    resolve(resume = false, sync = false) {
      const {
        vnode: vnode2,
        activeBranch,
        pendingBranch,
        pendingId,
        effects,
        parentComponent: parentComponent2,
        container: container2
      } = suspense;
      if (suspense.isHydrating) {
        suspense.isHydrating = false;
      } else if (!resume) {
        const delayEnter = activeBranch && pendingBranch.transition && pendingBranch.transition.mode === "out-in";
        if (delayEnter) {
          activeBranch.transition.afterLeave = () => {
            if (pendingId === suspense.pendingId) {
              move(pendingBranch, container2, anchor2, 0);
            }
          };
        }
        let { anchor: anchor2 } = suspense;
        if (activeBranch) {
          anchor2 = next(activeBranch);
          unmount(activeBranch, parentComponent2, suspense, true);
        }
        if (!delayEnter) {
          move(pendingBranch, container2, anchor2, 0);
        }
      }
      setActiveBranch(suspense, pendingBranch);
      suspense.pendingBranch = null;
      suspense.isInFallback = false;
      let parent = suspense.parent;
      let hasUnresolvedAncestor = false;
      while (parent) {
        if (parent.pendingBranch) {
          parent.effects.push(...effects);
          hasUnresolvedAncestor = true;
          break;
        }
        parent = parent.parent;
      }
      if (!hasUnresolvedAncestor) {
        queuePostFlushCb(effects);
      }
      suspense.effects = [];
      if (isSuspensible) {
        if (parentSuspense && parentSuspense.pendingBranch && parentSuspenseId === parentSuspense.pendingId) {
          parentSuspense.deps--;
          if (parentSuspense.deps === 0 && !sync) {
            parentSuspense.resolve();
          }
        }
      }
      triggerEvent(vnode2, "onResolve");
    },
    fallback(fallbackVNode) {
      if (!suspense.pendingBranch) {
        return;
      }
      const { vnode: vnode2, activeBranch, parentComponent: parentComponent2, container: container2, isSVG: isSVG2 } = suspense;
      triggerEvent(vnode2, "onFallback");
      const anchor2 = next(activeBranch);
      const mountFallback = () => {
        if (!suspense.isInFallback) {
          return;
        }
        patch(
          null,
          fallbackVNode,
          container2,
          anchor2,
          parentComponent2,
          null,
          // fallback tree will not have suspense context
          isSVG2,
          slotScopeIds,
          optimized
        );
        setActiveBranch(suspense, fallbackVNode);
      };
      const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === "out-in";
      if (delayEnter) {
        activeBranch.transition.afterLeave = mountFallback;
      }
      suspense.isInFallback = true;
      unmount(
        activeBranch,
        parentComponent2,
        null,
        // no suspense so unmount hooks fire now
        true
        // shouldRemove
      );
      if (!delayEnter) {
        mountFallback();
      }
    },
    move(container2, anchor2, type) {
      suspense.activeBranch && move(suspense.activeBranch, container2, anchor2, type);
      suspense.container = container2;
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
      instance.asyncDep.catch((err) => {
        handleError(err, instance, 0);
      }).then((asyncSetupResult) => {
        if (instance.isUnmounted || suspense.isUnmounted || suspense.pendingId !== instance.suspenseId) {
          return;
        }
        instance.asyncResolved = true;
        const { vnode: vnode2 } = instance;
        handleSetupResult(instance, asyncSetupResult, false);
        if (hydratedEl) {
          vnode2.el = hydratedEl;
        }
        const placeholder = !hydratedEl && instance.subTree.el;
        setupRenderEffect(
          instance,
          vnode2,
          // component may have been moved before resolve.
          // if this is not a hydration, instance.subTree will be the comment
          // placeholder.
          parentNode(hydratedEl || instance.subTree.el),
          // anchor will not be used if this is hydration, so only need to
          // consider the comment placeholder case.
          hydratedEl ? null : next(instance.subTree),
          suspense,
          isSVG,
          optimized
        );
        if (placeholder) {
          remove(placeholder);
        }
        updateHOCHostEl(instance, vnode2.el);
        if (isInPendingSuspense && --suspense.deps === 0) {
          suspense.resolve();
        }
      });
    },
    unmount(parentSuspense2, doRemove) {
      suspense.isUnmounted = true;
      if (suspense.activeBranch) {
        unmount(
          suspense.activeBranch,
          parentComponent,
          parentSuspense2,
          doRemove
        );
      }
      if (suspense.pendingBranch) {
        unmount(
          suspense.pendingBranch,
          parentComponent,
          parentSuspense2,
          doRemove
        );
      }
    }
  };
  return suspense;
}
function hydrateSuspense(node, vnode, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals, hydrateNode) {
  const suspense = vnode.suspense = createSuspenseBoundary(
    vnode,
    parentSuspense,
    parentComponent,
    node.parentNode,
    document.createElement("div"),
    null,
    isSVG,
    slotScopeIds,
    optimized,
    rendererInternals,
    true
    /* hydrating */
  );
  const result = hydrateNode(
    node,
    suspense.pendingBranch = vnode.ssContent,
    parentComponent,
    suspense,
    slotScopeIds,
    optimized
  );
  if (suspense.deps === 0) {
    suspense.resolve(false, true);
  }
  return result;
}
function normalizeSuspenseChildren(vnode) {
  const { shapeFlag, children } = vnode;
  const isSlotChildren = shapeFlag & 32;
  vnode.ssContent = normalizeSuspenseSlot(
    isSlotChildren ? children.default : children
  );
  vnode.ssFallback = isSlotChildren ? normalizeSuspenseSlot(children.fallback) : createVNode(Comment);
}
function normalizeSuspenseSlot(s) {
  let block;
  if (isFunction(s)) {
    const trackBlock = isBlockTreeEnabled && s._c;
    if (trackBlock) {
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
  if (isArray(s)) {
    const singleChild = filterSingleRoot(s);
    s = singleChild;
  }
  s = normalizeVNode(s);
  if (block && !s.dynamicChildren) {
    s.dynamicChildren = block.filter((c) => c !== s);
  }
  return s;
}
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
function setActiveBranch(suspense, branch) {
  suspense.activeBranch = branch;
  const { vnode, parentComponent } = suspense;
  const el = vnode.el = branch.el;
  if (parentComponent && parentComponent.subTree === vnode) {
    parentComponent.vnode.el = el;
    updateHOCHostEl(parentComponent, el);
  }
}
function isVNodeSuspensible(vnode) {
  var _a;
  return ((_a = vnode.props) == null ? void 0 : _a.suspensible) != null && vnode.props.suspensible !== false;
}

function watchEffect(effect, options) {
  return doWatch(effect, null, options);
}
function watchPostEffect(effect, options) {
  return doWatch(
    effect,
    null,
    { flush: "post" }
  );
}
function watchSyncEffect(effect, options) {
  return doWatch(
    effect,
    null,
    { flush: "sync" }
  );
}
const INITIAL_WATCHER_VALUE = {};
function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
  var _a;
  const instance = getCurrentScope() === ((_a = currentInstance) == null ? void 0 : _a.scope) ? currentInstance : null;
  let getter;
  let forceTrigger = false;
  let isMultiSource = false;
  if (isRef(source)) {
    getter = () => source.value;
    forceTrigger = isShallow(source);
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => isReactive(s) || isShallow(s));
    getter = () => source.map((s) => {
      if (isRef(s)) {
        return s.value;
      } else if (isReactive(s)) {
        return traverse(s);
      } else if (isFunction(s)) {
        return callWithErrorHandling(s, instance, 2);
      } else ;
    });
  } else if (isFunction(source)) {
    if (cb) {
      getter = () => callWithErrorHandling(source, instance, 2);
    } else {
      getter = () => {
        if (instance && instance.isUnmounted) {
          return;
        }
        if (cleanup) {
          cleanup();
        }
        return callWithAsyncErrorHandling(
          source,
          instance,
          3,
          [onCleanup]
        );
      };
    }
  } else {
    getter = NOOP;
  }
  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }
  let cleanup;
  let onCleanup = (fn) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, 4);
    };
  };
  let ssrCleanup;
  if (isInSSRComponentSetup) {
    onCleanup = NOOP;
    if (!cb) {
      getter();
    } else if (immediate) {
      callWithAsyncErrorHandling(cb, instance, 3, [
        getter(),
        isMultiSource ? [] : void 0,
        onCleanup
      ]);
    }
    if (flush === "sync") {
      const ctx = useSSRContext();
      ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
    } else {
      return NOOP;
    }
  }
  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
  const job = () => {
    if (!effect.active) {
      return;
    }
    if (cb) {
      const newValue = effect.run();
      if (deep || forceTrigger || (isMultiSource ? newValue.some(
        (v, i) => hasChanged(v, oldValue[i])
      ) : hasChanged(newValue, oldValue)) || false) {
        if (cleanup) {
          cleanup();
        }
        callWithAsyncErrorHandling(cb, instance, 3, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
          onCleanup
        ]);
        oldValue = newValue;
      }
    } else {
      effect.run();
    }
  };
  job.allowRecurse = !!cb;
  let scheduler;
  if (flush === "sync") {
    scheduler = job;
  } else if (flush === "post") {
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
  } else {
    job.pre = true;
    if (instance)
      job.id = instance.uid;
    scheduler = () => queueJob(job);
  }
  const effect = new ReactiveEffect(getter, scheduler);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else if (flush === "post") {
    queuePostRenderEffect(
      effect.run.bind(effect),
      instance && instance.suspense
    );
  } else {
    effect.run();
  }
  const unwatch = () => {
    effect.stop();
    if (instance && instance.scope) {
      remove(instance.scope.effects, effect);
    }
  };
  if (ssrCleanup)
    ssrCleanup.push(unwatch);
  return unwatch;
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const cur = currentInstance;
  setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  if (cur) {
    setCurrentInstance(cur);
  } else {
    unsetCurrentInstance();
  }
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
function traverse(value, seen) {
  if (!isObject(value) || value["__v_skip"]) {
    return value;
  }
  seen = seen || /* @__PURE__ */ new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], seen);
    }
  }
  return value;
}
function withDirectives(vnode, directives) {
  const internalInstance = currentRenderingInstance;
  if (internalInstance === null) {
    return vnode;
  }
  const instance = getExposeProxy(internalInstance) || internalInstance.proxy;
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction(dir)) {
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
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}

function useTransitionState() {
  const state = {
    isMounted: false,
    isLeaving: false,
    isUnmounting: false,
    leavingVNodes: /* @__PURE__ */ new Map()
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
const BaseTransitionPropsValidators = {
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
};
const BaseTransitionImpl = {
  name: `BaseTransition`,
  props: BaseTransitionPropsValidators,
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
        for (const c of children) {
          if (c.type !== Comment) {
            child = c;
            break;
          }
        }
      }
      const rawProps = toRaw(props);
      const { mode } = rawProps;
      if (state.isLeaving) {
        return emptyPlaceholder(child);
      }
      const innerChild = getKeepAliveChild(child);
      if (!innerChild) {
        return emptyPlaceholder(child);
      }
      const enterHooks = resolveTransitionHooks(
        innerChild,
        rawProps,
        state,
        instance
      );
      setTransitionHooks(innerChild, enterHooks);
      const oldChild = instance.subTree;
      const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
      let transitionKeyChanged = false;
      const { getTransitionKey } = innerChild.type;
      if (getTransitionKey) {
        const key = getTransitionKey();
        if (prevTransitionKey === void 0) {
          prevTransitionKey = key;
        } else if (key !== prevTransitionKey) {
          prevTransitionKey = key;
          transitionKeyChanged = true;
        }
      }
      if (oldInnerChild && oldInnerChild.type !== Comment && (!isSameVNodeType(innerChild, oldInnerChild) || transitionKeyChanged)) {
        const leavingHooks = resolveTransitionHooks(
          oldInnerChild,
          rawProps,
          state,
          instance
        );
        setTransitionHooks(oldInnerChild, leavingHooks);
        if (mode === "out-in") {
          state.isLeaving = true;
          leavingHooks.afterLeave = () => {
            state.isLeaving = false;
            if (instance.update.active !== false) {
              instance.update();
            }
          };
          return emptyPlaceholder(child);
        } else if (mode === "in-out" && innerChild.type !== Comment) {
          leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
            const leavingVNodesCache = getLeavingNodesForType(
              state,
              oldInnerChild
            );
            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
            el._leaveCb = () => {
              earlyRemove();
              el._leaveCb = void 0;
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
const BaseTransition = BaseTransitionImpl;
function getLeavingNodesForType(state, vnode) {
  const { leavingVNodes } = state;
  let leavingVNodesCache = leavingVNodes.get(vnode.type);
  if (!leavingVNodesCache) {
    leavingVNodesCache = /* @__PURE__ */ Object.create(null);
    leavingVNodes.set(vnode.type, leavingVNodesCache);
  }
  return leavingVNodesCache;
}
function resolveTransitionHooks(vnode, props, state, instance) {
  const {
    appear,
    mode,
    persisted = false,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onEnterCancelled,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onLeaveCancelled,
    onBeforeAppear,
    onAppear,
    onAfterAppear,
    onAppearCancelled
  } = props;
  const key = String(vnode.key);
  const leavingVNodesCache = getLeavingNodesForType(state, vnode);
  const callHook = (hook, args) => {
    hook && callWithAsyncErrorHandling(
      hook,
      instance,
      9,
      args
    );
  };
  const callAsyncHook = (hook, args) => {
    const done = args[1];
    callHook(hook, args);
    if (isArray(hook)) {
      if (hook.every((hook2) => hook2.length <= 1))
        done();
    } else if (hook.length <= 1) {
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
        } else {
          return;
        }
      }
      if (el._leaveCb) {
        el._leaveCb(
          true
          /* cancelled */
        );
      }
      const leavingVNode = leavingVNodesCache[key];
      if (leavingVNode && isSameVNodeType(vnode, leavingVNode) && leavingVNode.el._leaveCb) {
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
        } else {
          return;
        }
      }
      let called = false;
      const done = el._enterCb = (cancelled) => {
        if (called)
          return;
        called = true;
        if (cancelled) {
          callHook(cancelHook, [el]);
        } else {
          callHook(afterHook, [el]);
        }
        if (hooks.delayedLeave) {
          hooks.delayedLeave();
        }
        el._enterCb = void 0;
      };
      if (hook) {
        callAsyncHook(hook, [el, done]);
      } else {
        done();
      }
    },
    leave(el, remove) {
      const key2 = String(vnode.key);
      if (el._enterCb) {
        el._enterCb(
          true
          /* cancelled */
        );
      }
      if (state.isUnmounting) {
        return remove();
      }
      callHook(onBeforeLeave, [el]);
      let called = false;
      const done = el._leaveCb = (cancelled) => {
        if (called)
          return;
        called = true;
        remove();
        if (cancelled) {
          callHook(onLeaveCancelled, [el]);
        } else {
          callHook(onAfterLeave, [el]);
        }
        el._leaveCb = void 0;
        if (leavingVNodesCache[key2] === vnode) {
          delete leavingVNodesCache[key2];
        }
      };
      leavingVNodesCache[key2] = vnode;
      if (onLeave) {
        callAsyncHook(onLeave, [el, done]);
      } else {
        done();
      }
    },
    clone(vnode2) {
      return resolveTransitionHooks(vnode2, props, state, instance);
    }
  };
  return hooks;
}
function emptyPlaceholder(vnode) {
  if (isKeepAlive(vnode)) {
    vnode = cloneVNode(vnode);
    vnode.children = null;
    return vnode;
  }
}
function getKeepAliveChild(vnode) {
  return isKeepAlive(vnode) ? vnode.children ? vnode.children[0] : void 0 : vnode;
}
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    setTransitionHooks(vnode.component.subTree, hooks);
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
function getTransitionRawChildren(children, keepComment = false, parentKey) {
  let ret = [];
  let keyedFragmentCount = 0;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    const key = parentKey == null ? child.key : String(parentKey) + String(child.key != null ? child.key : i);
    if (child.type === Fragment) {
      if (child.patchFlag & 128)
        keyedFragmentCount++;
      ret = ret.concat(
        getTransitionRawChildren(child.children, keepComment, key)
      );
    } else if (keepComment || child.type !== Comment) {
      ret.push(key != null ? cloneVNode(child, { key }) : child);
    }
  }
  if (keyedFragmentCount > 1) {
    for (let i = 0; i < ret.length; i++) {
      ret[i].patchFlag = -2;
    }
  }
  return ret;
}

function defineComponent(options, extraOptions) {
  return isFunction(options) ? (
    // #8326: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}

const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
function defineAsyncComponent(source) {
  if (isFunction(source)) {
    source = { loader: source };
  }
  const {
    loader,
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout,
    // undefined = never times out
    suspensible = true,
    onError: userOnError
  } = source;
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
    return pendingRequest || (thisRequest = pendingRequest = loader().catch((err) => {
      err = err instanceof Error ? err : new Error(String(err));
      if (userOnError) {
        return new Promise((resolve, reject) => {
          const userRetry = () => resolve(retry());
          const userFail = () => reject(err);
          userOnError(err, userRetry, userFail, retries + 1);
        });
      } else {
        throw err;
      }
    }).then((comp) => {
      if (thisRequest !== pendingRequest && pendingRequest) {
        return pendingRequest;
      }
      if (comp && (comp.__esModule || comp[Symbol.toStringTag] === "Module")) {
        comp = comp.default;
      }
      resolvedComp = comp;
      return comp;
    }));
  };
  return defineComponent({
    name: "AsyncComponentWrapper",
    __asyncLoader: load,
    get __asyncResolved() {
      return resolvedComp;
    },
    setup() {
      const instance = currentInstance;
      if (resolvedComp) {
        return () => createInnerComp(resolvedComp, instance);
      }
      const onError = (err) => {
        pendingRequest = null;
        handleError(
          err,
          instance,
          13,
          !errorComponent
          /* do not throw in dev if user provided error component */
        );
      };
      if (suspensible && instance.suspense || isInSSRComponentSetup) {
        return load().then((comp) => {
          return () => createInnerComp(comp, instance);
        }).catch((err) => {
          onError(err);
          return () => errorComponent ? createVNode(errorComponent, {
            error: err
          }) : null;
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
            const err = new Error(
              `Async component timed out after ${timeout}ms.`
            );
            onError(err);
            error.value = err;
          }
        }, timeout);
      }
      load().then(() => {
        loaded.value = true;
        if (instance.parent && isKeepAlive(instance.parent.vnode)) {
          queueJob(instance.parent.update);
        }
      }).catch((err) => {
        onError(err);
        error.value = err;
      });
      return () => {
        if (loaded.value && resolvedComp) {
          return createInnerComp(resolvedComp, instance);
        } else if (error.value && errorComponent) {
          return createVNode(errorComponent, {
            error: error.value
          });
        } else if (loadingComponent && !delayed.value) {
          return createVNode(loadingComponent);
        }
      };
    }
  });
}
function createInnerComp(comp, parent) {
  const { ref: ref2, props, children, ce } = parent.vnode;
  const vnode = createVNode(comp, props, children);
  vnode.ref = ref2;
  vnode.ce = ce;
  delete parent.vnode.ce;
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
    const sharedContext = instance.ctx;
    if (!sharedContext.renderer) {
      return () => {
        const children = slots.default && slots.default();
        return children && children.length === 1 ? children[0] : children;
      };
    }
    const cache = /* @__PURE__ */ new Map();
    const keys = /* @__PURE__ */ new Set();
    let current = null;
    if (__VUE_PROD_DEVTOOLS__) {
      instance.__v_cache = cache;
    }
    const parentSuspense = instance.suspense;
    const {
      renderer: {
        p: patch,
        m: move,
        um: _unmount,
        o: { createElement }
      }
    } = sharedContext;
    const storageContainer = createElement("div");
    sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
      const instance2 = vnode.component;
      move(vnode, container, anchor, 0, parentSuspense);
      patch(
        instance2.vnode,
        vnode,
        container,
        anchor,
        instance2,
        parentSuspense,
        isSVG,
        vnode.slotScopeIds,
        optimized
      );
      queuePostRenderEffect(() => {
        instance2.isDeactivated = false;
        if (instance2.a) {
          invokeArrayFns(instance2.a);
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode);
        }
      }, parentSuspense);
      if (__VUE_PROD_DEVTOOLS__) {
        devtoolsComponentAdded(instance2);
      }
    };
    sharedContext.deactivate = (vnode) => {
      const instance2 = vnode.component;
      move(vnode, storageContainer, null, 1, parentSuspense);
      queuePostRenderEffect(() => {
        if (instance2.da) {
          invokeArrayFns(instance2.da);
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode);
        }
        instance2.isDeactivated = true;
      }, parentSuspense);
      if (__VUE_PROD_DEVTOOLS__) {
        devtoolsComponentAdded(instance2);
      }
    };
    function unmount(vnode) {
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
      if (!current || !isSameVNodeType(cached, current)) {
        unmount(cached);
      } else if (current) {
        resetShapeFlag(current);
      }
      cache.delete(key);
      keys.delete(key);
    }
    watch(
      () => [props.include, props.exclude],
      ([include, exclude]) => {
        include && pruneCache((name) => matches(include, name));
        exclude && pruneCache((name) => !matches(exclude, name));
      },
      // prune post-render after `current` has been updated
      { flush: "post", deep: true }
    );
    let pendingCacheKey = null;
    const cacheSubtree = () => {
      if (pendingCacheKey != null) {
        cache.set(pendingCacheKey, getInnerChild(instance.subTree));
      }
    };
    onMounted(cacheSubtree);
    onUpdated(cacheSubtree);
    onBeforeUnmount(() => {
      cache.forEach((cached) => {
        const { subTree, suspense } = instance;
        const vnode = getInnerChild(subTree);
        if (cached.type === vnode.type && cached.key === vnode.key) {
          resetShapeFlag(vnode);
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
      } else if (!isVNode(rawVNode) || !(rawVNode.shapeFlag & 4) && !(rawVNode.shapeFlag & 128)) {
        current = null;
        return rawVNode;
      }
      let vnode = getInnerChild(rawVNode);
      const comp = vnode.type;
      const name = getComponentName(
        isAsyncWrapper(vnode) ? vnode.type.__asyncResolved || {} : comp
      );
      const { include, exclude, max } = props;
      if (include && (!name || !matches(include, name)) || exclude && name && matches(exclude, name)) {
        current = vnode;
        return rawVNode;
      }
      const key = vnode.key == null ? comp : vnode.key;
      const cachedVNode = cache.get(key);
      if (vnode.el) {
        vnode = cloneVNode(vnode);
        if (rawVNode.shapeFlag & 128) {
          rawVNode.ssContent = vnode;
        }
      }
      pendingCacheKey = key;
      if (cachedVNode) {
        vnode.el = cachedVNode.el;
        vnode.component = cachedVNode.component;
        if (vnode.transition) {
          setTransitionHooks(vnode, vnode.transition);
        }
        vnode.shapeFlag |= 512;
        keys.delete(key);
        keys.add(key);
      } else {
        keys.add(key);
        if (max && keys.size > parseInt(max, 10)) {
          pruneCacheEntry(keys.values().next().value);
        }
      }
      vnode.shapeFlag |= 256;
      current = vnode;
      return isSuspense(rawVNode.type) ? rawVNode : vnode;
    };
  }
};
const KeepAlive = KeepAliveImpl;
function matches(pattern, name) {
  if (isArray(pattern)) {
    return pattern.some((p) => matches(p, name));
  } else if (isString(pattern)) {
    return pattern.split(",").includes(name);
  } else if (isRegExp(pattern)) {
    return pattern.test(name);
  }
  return false;
}
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
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
  const injected = injectHook(
    type,
    hook,
    keepAliveRoot,
    true
    /* prepend */
  );
  onUnmounted(() => {
    remove(keepAliveRoot[type], injected);
  }, target);
}
function resetShapeFlag(vnode) {
  vnode.shapeFlag &= ~256;
  vnode.shapeFlag &= ~512;
}
function getInnerChild(vnode) {
  return vnode.shapeFlag & 128 ? vnode.ssContent : vnode;
}

function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      if (target.isUnmounted) {
        return;
      }
      pauseTracking();
      setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      unsetCurrentInstance();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => (
  // post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
  (!isInSSRComponentSetup || lifecycle === "sp") && injectHook(lifecycle, (...args) => hook(...args), target)
);
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook("bu");
const onUpdated = createHook("u");
const onBeforeUnmount = createHook("bum");
const onUnmounted = createHook("um");
const onServerPrefetch = createHook("sp");
const onRenderTriggered = createHook(
  "rtg"
);
const onRenderTracked = createHook(
  "rtc"
);
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}

const COMPONENTS = "components";
const DIRECTIVES = "directives";
function resolveComponent(name, maybeSelfReference) {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
const NULL_DYNAMIC_COMPONENT = Symbol.for("v-ndc");
function resolveDynamicComponent(component) {
  if (isString(component)) {
    return resolveAsset(COMPONENTS, component, false) || component;
  } else {
    return component || NULL_DYNAMIC_COMPONENT;
  }
}
function resolveDirective(name) {
  return resolveAsset(DIRECTIVES, name);
}
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
  const instance = currentRenderingInstance || currentInstance;
  if (instance) {
    const Component = instance.type;
    if (type === COMPONENTS) {
      const selfName = getComponentName(
        Component,
        false
        /* do not include inferred name to avoid breaking existing code */
      );
      if (selfName && (selfName === name || selfName === camelize(name) || selfName === capitalize(camelize(name)))) {
        return Component;
      }
    }
    const res = (
      // local registration
      // check instance[type] first which is resolved for options API
      resolve(instance[type] || Component[type], name) || // global registration
      resolve(instance.appContext[type], name)
    );
    if (!res && maybeSelfReference) {
      return Component;
    }
    return res;
  }
}
function resolve(registry, name) {
  return registry && (registry[name] || registry[camelize(name)] || registry[capitalize(camelize(name))]);
}

function renderList(source, renderItem, cache, index) {
  let ret;
  const cached = cache && cache[index];
  if (isArray(source) || isString(source)) {
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(source[i], i, void 0, cached && cached[i]);
    }
  } else if (typeof source === "number") {
    ret = new Array(source);
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
    }
  } else if (isObject(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(
        source,
        (item, i) => renderItem(item, i, void 0, cached && cached[i])
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached && cached[i]);
      }
    }
  } else {
    ret = [];
  }
  if (cache) {
    cache[index] = ret;
  }
  return ret;
}

function createSlots(slots, dynamicSlots) {
  for (let i = 0; i < dynamicSlots.length; i++) {
    const slot = dynamicSlots[i];
    if (isArray(slot)) {
      for (let j = 0; j < slot.length; j++) {
        slots[slot[j].name] = slot[j].fn;
      }
    } else if (slot) {
      slots[slot.name] = slot.key ? (...args) => {
        const res = slot.fn(...args);
        if (res)
          res.key = slot.key;
        return res;
      } : slot.fn;
    }
  }
  return slots;
}

function renderSlot(slots, name, props = {}, fallback, noSlotted) {
  if (currentRenderingInstance.isCE || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.isCE) {
    if (name !== "default")
      props.name = name;
    return createVNode("slot", props, fallback && fallback());
  }
  let slot = slots[name];
  if (slot && slot._c) {
    slot._d = false;
  }
  openBlock();
  const validSlotContent = slot && ensureValidVNode(slot(props));
  const rendered = createBlock(
    Fragment,
    {
      key: props.key || // slot content array of a dynamic conditional slot may have a branch
      // key attached in the `createSlots` helper, respect that
      validSlotContent && validSlotContent.key || `_${name}`
    },
    validSlotContent || (fallback ? fallback() : []),
    validSlotContent && slots._ === 1 ? 64 : -2
  );
  if (!noSlotted && rendered.scopeId) {
    rendered.slotScopeIds = [rendered.scopeId + "-s"];
  }
  if (slot && slot._c) {
    slot._d = true;
  }
  return rendered;
}
function ensureValidVNode(vnodes) {
  return vnodes.some((child) => {
    if (!isVNode(child))
      return true;
    if (child.type === Comment)
      return false;
    if (child.type === Fragment && !ensureValidVNode(child.children))
      return false;
    return true;
  }) ? vnodes : null;
}

function toHandlers(obj, preserveCaseIfNecessary) {
  const ret = {};
  for (const key in obj) {
    ret[preserveCaseIfNecessary && /[A-Z]/.test(key) ? `on:${key}` : toHandlerKey(key)] = obj[key];
  }
  return ret;
}

const getPublicInstance = (i) => {
  if (!i)
    return null;
  if (isStatefulComponent(i))
    return getExposeProxy(i) || i.proxy;
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
    $: (i) => i,
    $el: (i) => i.vnode.el,
    $data: (i) => i.data,
    $props: (i) => i.props,
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots,
    $refs: (i) => i.refs,
    $parent: (i) => getPublicInstance(i.parent),
    $root: (i) => getPublicInstance(i.root),
    $emit: (i) => i.emit,
    $options: (i) => __VUE_OPTIONS_API__ ? resolveMergedOptions(i) : i.type,
    $forceUpdate: (i) => i.f || (i.f = () => queueJob(i.update)),
    $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
    $watch: (i) => __VUE_OPTIONS_API__ ? instanceWatch.bind(i) : NOOP
  })
);
const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
    let normalizedProps;
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 1 /* SETUP */:
            return setupState[key];
          case 2 /* DATA */:
            return data[key];
          case 4 /* CONTEXT */:
            return ctx[key];
          case 3 /* PROPS */:
            return props[key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache[key] = 1 /* SETUP */;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 2 /* DATA */;
        return data[key];
      } else if (
        // only cache other properties when instance has declared (thus stable)
        // props
        (normalizedProps = instance.propsOptions[0]) && hasOwn(normalizedProps, key)
      ) {
        accessCache[key] = 3 /* PROPS */;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 4 /* CONTEXT */;
        return ctx[key];
      } else if (!__VUE_OPTIONS_API__ || shouldCacheAccess) {
        accessCache[key] = 0 /* OTHER */;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance, "get", key);
      }
      return publicGetter(instance);
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) && (cssModule = cssModule[key])
    ) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 4 /* CONTEXT */;
      return ctx[key];
    } else if (
      // global properties
      globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)
    ) {
      {
        return globalProperties[key];
      }
    } else ;
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      return false;
    } else {
      {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({
    _: { data, setupState, accessCache, ctx, appContext, propsOptions }
  }, key) {
    let normalizedProps;
    return !!accessCache[key] || data !== EMPTY_OBJ && hasOwn(data, key) || hasSetupBinding(setupState, key) || (normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor.get != null) {
      target._.accessCache[key] = 0;
    } else if (hasOwn(descriptor, "value")) {
      this.set(target, key, descriptor.value, null);
    }
    return Reflect.defineProperty(target, key, descriptor);
  }
};
const RuntimeCompiledPublicInstanceProxyHandlers = /* @__PURE__ */ extend(
  {},
  PublicInstanceProxyHandlers,
  {
    get(target, key) {
      if (key === Symbol.unscopables) {
        return;
      }
      return PublicInstanceProxyHandlers.get(target, key, target);
    },
    has(_, key) {
      const has = key[0] !== "_" && !isGloballyWhitelisted(key);
      return has;
    }
  }
);
function defineProps() {
  return null;
}
function defineEmits() {
  return null;
}
function defineExpose(exposed) {
}
function defineOptions(options) {
}
function defineSlots() {
  return null;
}
function defineModel() {
}
function withDefaults(props, defaults) {
  return null;
}
function useSlots() {
  return getContext().slots;
}
function useAttrs() {
  return getContext().attrs;
}
function useModel(props, name, options) {
  const i = getCurrentInstance();
  if (options && options.local) {
    const proxy = ref(props[name]);
    watch(
      () => props[name],
      (v) => proxy.value = v
    );
    watch(proxy, (value) => {
      if (value !== props[name]) {
        i.emit(`update:${name}`, value);
      }
    });
    return proxy;
  } else {
    return {
      __v_isRef: true,
      get value() {
        return props[name];
      },
      set value(value) {
        i.emit(`update:${name}`, value);
      }
    };
  }
}
function getContext() {
  const i = getCurrentInstance();
  return i.setupContext || (i.setupContext = createSetupContext(i));
}
function normalizePropsOrEmits(props) {
  return isArray(props) ? props.reduce(
    (normalized, p) => (normalized[p] = null, normalized),
    {}
  ) : props;
}
function mergeDefaults(raw, defaults) {
  const props = normalizePropsOrEmits(raw);
  for (const key in defaults) {
    if (key.startsWith("__skip"))
      continue;
    let opt = props[key];
    if (opt) {
      if (isArray(opt) || isFunction(opt)) {
        opt = props[key] = { type: opt, default: defaults[key] };
      } else {
        opt.default = defaults[key];
      }
    } else if (opt === null) {
      opt = props[key] = { default: defaults[key] };
    } else ;
    if (opt && defaults[`__skip_${key}`]) {
      opt.skipFactory = true;
    }
  }
  return props;
}
function mergeModels(a, b) {
  if (!a || !b)
    return a || b;
  if (isArray(a) && isArray(b))
    return a.concat(b);
  return extend({}, normalizePropsOrEmits(a), normalizePropsOrEmits(b));
}
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
function withAsyncContext(getAwaitable) {
  const ctx = getCurrentInstance();
  let awaitable = getAwaitable();
  unsetCurrentInstance();
  if (isPromise(awaitable)) {
    awaitable = awaitable.catch((e) => {
      setCurrentInstance(ctx);
      throw e;
    });
  }
  return [awaitable, () => setCurrentInstance(ctx)];
}
let shouldCacheAccess = true;
function applyOptions(instance) {
  const options = resolveMergedOptions(instance);
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook$1(options.beforeCreate, instance, "bc");
  }
  const {
    // state
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // lifecycle
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    // public API
    expose,
    inheritAttrs,
    // assets
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = null;
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction(methodHandler)) {
        {
          ctx[key] = methodHandler.bind(publicThis);
        }
      }
    }
  }
  if (dataOptions) {
    const data = dataOptions.call(publicThis, publicThis);
    if (!isObject(data)) ; else {
      instance.data = reactive(data);
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get = isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
      const set = !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP;
      const c = computed({
        get,
        set
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook$1(created, instance, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
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
  if (isArray(expose)) {
    if (expose.length) {
      const exposed = instance.exposed || (instance.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val
        });
      });
    } else if (!instance.exposed) {
      instance.exposed = {};
    }
  }
  if (render && instance.render === NOOP) {
    instance.render = render;
  }
  if (inheritAttrs != null) {
    instance.inheritAttrs = inheritAttrs;
  }
  if (components)
    instance.components = components;
  if (directives)
    instance.directives = directives;
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
  if (isArray(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject(opt)) {
      if ("default" in opt) {
        injected = inject(
          opt.from || key,
          opt.default,
          true
          /* treat default function as factory */
        );
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (isRef(injected)) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => injected.value,
        set: (v) => injected.value = v
      });
    } else {
      ctx[key] = injected;
    }
  }
}
function callHook$1(hook, instance, type) {
  callWithAsyncErrorHandling(
    isArray(hook) ? hook.map((h) => h.bind(instance.proxy)) : hook.bind(instance.proxy),
    instance,
    type
  );
}
function createWatcher(raw, ctx, publicThis, key) {
  const getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString(raw)) {
    const handler = ctx[raw];
    if (isFunction(handler)) {
      watch(getter, handler);
    }
  } else if (isFunction(raw)) {
    watch(getter, raw.bind(publicThis));
  } else if (isObject(raw)) {
    if (isArray(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction(handler)) {
        watch(getter, handler, raw);
      }
    }
  } else ;
}
function resolveMergedOptions(instance) {
  const base = instance.type;
  const { mixins, extends: extendsOptions } = base;
  const {
    mixins: globalMixins,
    optionsCache: cache,
    config: { optionMergeStrategies }
  } = instance.appContext;
  const cached = cache.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach(
        (m) => mergeOptions(resolved, m, optionMergeStrategies, true)
      );
    }
    mergeOptions(resolved, base, optionMergeStrategies);
  }
  if (isObject(base)) {
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
    mixins.forEach(
      (m) => mergeOptions(to, m, strats, true)
    );
  }
  for (const key in from) {
    if (asMixin && key === "expose") ; else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeEmitsOrPropsOptions,
  emits: mergeEmitsOrPropsOptions,
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
    return (extend)(
      isFunction(to) ? to.call(this, this) : to,
      isFunction(from) ? from.call(this, this) : from
    );
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray(raw)) {
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
  return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
  if (to) {
    if (isArray(to) && isArray(from)) {
      return [.../* @__PURE__ */ new Set([...to, ...from])];
    }
    return extend(
      /* @__PURE__ */ Object.create(null),
      normalizePropsOrEmits(to),
      normalizePropsOrEmits(from != null ? from : {})
    );
  } else {
    return from;
  }
}
function mergeWatchOptions(to, from) {
  if (!to)
    return from;
  if (!from)
    return to;
  const merged = extend(/* @__PURE__ */ Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray(to[key], from[key]);
  }
  return merged;
}

function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let uid$1 = 0;
function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent);
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = /* @__PURE__ */ new Set();
    let isMounted = false;
    const app = context.app = {
      _uid: uid$1++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) ; else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else ;
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
          const vnode = createVNode(
            rootComponent,
            rootProps
          );
          vnode.appContext = context;
          if (isHydrate && hydrate) {
            hydrate(vnode, rootContainer);
          } else {
            render(vnode, rootContainer, isSVG);
          }
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          if (__VUE_PROD_DEVTOOLS__) {
            app._instance = vnode.component;
            devtoolsInitApp(app, version);
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
      },
      runWithContext(fn) {
        currentApp = app;
        try {
          return fn();
        } finally {
          currentApp = null;
        }
      }
    };
    return app;
  };
}
let currentApp = null;

function provide(key, value) {
  if (!currentInstance) ; else {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance || currentRenderingInstance;
  if (instance || currentApp) {
    const provides = instance ? instance.parent == null ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : currentApp._context.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
    } else ;
  }
}
function hasInjectionContext() {
  return !!(currentInstance || currentRenderingInstance || currentApp);
}

function initProps(instance, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = {};
  def(attrs, InternalObjectKey, 1);
  instance.propsDefaults = /* @__PURE__ */ Object.create(null);
  setFullProps(instance, rawProps, props, attrs);
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (isStateful) {
    instance.props = isSSR ? props : shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance;
  const rawCurrentProps = toRaw(props);
  const [options] = instance.propsOptions;
  let hasAttrsChanged = false;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) && !(patchFlag & 16)
  ) {
    if (patchFlag & 8) {
      const propsToUpdate = instance.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        if (isEmitListener(instance.emitsOptions, key)) {
          continue;
        }
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize(key);
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance,
              false
              /* isAbsent */
            );
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || // for camelCase
      !hasOwn(rawProps, key) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && // for camelCase
          (rawPrevProps[key] !== void 0 || // for kebab-case
          rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(
              options,
              rawCurrentProps,
              key,
              void 0,
              instance,
              true
              /* isAbsent */
            );
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key) && true) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger(instance, "set", "$attrs");
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
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
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance,
        !hasOwn(castValues, key)
      );
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(
            null,
            props
          );
          unsetCurrentInstance();
        }
      } else {
        value = defaultValue;
      }
    }
    if (opt[0 /* shouldCast */]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[1 /* shouldCastTrue */] && (value === "" || value === hyphenate(key))) {
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
  let hasExtends = false;
  if (__VUE_OPTIONS_API__ && !isFunction(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
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
    if (isObject(comp)) {
      cache.set(comp, EMPTY_ARR);
    }
    return EMPTY_ARR;
  }
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    for (const key in raw) {
      const normalizedKey = camelize(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
        if (prop) {
          const booleanIndex = getTypeIndex(Boolean, prop.type);
          const stringIndex = getTypeIndex(String, prop.type);
          prop[0 /* shouldCast */] = booleanIndex > -1;
          prop[1 /* shouldCastTrue */] = stringIndex < 0 || booleanIndex < stringIndex;
          if (booleanIndex > -1 || hasOwn(prop, "default")) {
            needCastKeys.push(normalizedKey);
          }
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject(comp)) {
    cache.set(comp, res);
  }
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$") {
    return true;
  }
  return false;
}
function getType(ctor) {
  const match = ctor && ctor.toString().match(/^\s*(function|class) (\w+)/);
  return match ? match[2] : ctor === null ? "null" : "";
}
function isSameType(a, b) {
  return getType(a) === getType(b);
}
function getTypeIndex(type, expectedTypes) {
  if (isArray(expectedTypes)) {
    return expectedTypes.findIndex((t) => isSameType(t, type));
  } else if (isFunction(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1;
  }
  return -1;
}

const isInternalKey = (key) => key[0] === "_" || key === "$stable";
const normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot = (key, rawSlot, ctx) => {
  if (rawSlot._n) {
    return rawSlot;
  }
  const normalized = withCtx((...args) => {
    if (!!("production" !== "production") && currentInstance) ;
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
    if (isFunction(value)) {
      slots[key] = normalizeSlot(key, value, ctx);
    } else if (value != null) {
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
  if (instance.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      instance.slots = toRaw(children);
      def(children, "_", type);
    } else {
      normalizeObjectSlots(
        children,
        instance.slots = {});
    }
  } else {
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
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        extend(slots, children);
        if (!optimized && type === 1) {
          delete slots._;
        }
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
        delete slots[key];
      }
    }
  }
};

function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray(rawRef)) {
    rawRef.forEach(
      (r, i) => setRef(
        r,
        oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef),
        parentSuspense,
        vnode,
        isUnmount
      )
    );
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getExposeProxy(vnode.component) || vnode.component.proxy : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref } = rawRef;
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  if (oldRef != null && oldRef !== ref) {
    if (isString(oldRef)) {
      refs[oldRef] = null;
      if (hasOwn(setupState, oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (isRef(oldRef)) {
      oldRef.value = null;
    }
  }
  if (isFunction(ref)) {
    callWithErrorHandling(ref, owner, 12, [value, refs]);
  } else {
    const _isString = isString(ref);
    const _isRef = isRef(ref);
    if (_isString || _isRef) {
      const doSet = () => {
        if (rawRef.f) {
          const existing = _isString ? hasOwn(setupState, ref) ? setupState[ref] : refs[ref] : ref.value;
          if (isUnmount) {
            isArray(existing) && remove(existing, refValue);
          } else {
            if (!isArray(existing)) {
              if (_isString) {
                refs[ref] = [refValue];
                if (hasOwn(setupState, ref)) {
                  setupState[ref] = refs[ref];
                }
              } else {
                ref.value = [refValue];
                if (rawRef.k)
                  refs[rawRef.k] = ref.value;
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue);
            }
          }
        } else if (_isString) {
          refs[ref] = value;
          if (hasOwn(setupState, ref)) {
            setupState[ref] = value;
          }
        } else if (_isRef) {
          ref.value = value;
          if (rawRef.k)
            refs[rawRef.k] = value;
        } else ;
      };
      if (value) {
        doSet.id = -1;
        queuePostRenderEffect(doSet, parentSuspense);
      } else {
        doSet();
      }
    }
  }
}

let hasMismatch = false;
const isSVGContainer = (container) => /svg/.test(container.namespaceURI) && container.tagName !== "foreignObject";
const isComment = (node) => node.nodeType === 8 /* COMMENT */;
function createHydrationFunctions(rendererInternals) {
  const {
    mt: mountComponent,
    p: patch,
    o: {
      patchProp,
      createText,
      nextSibling,
      parentNode,
      remove,
      insert,
      createComment
    }
  } = rendererInternals;
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
    if (hasMismatch && true) {
      console.error(`Hydration completed but contains mismatches.`);
    }
  };
  const hydrateNode = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized = false) => {
    const isFragmentStart = isComment(node) && node.data === "[";
    const onMismatch = () => handleMismatch(
      node,
      vnode,
      parentComponent,
      parentSuspense,
      slotScopeIds,
      isFragmentStart
    );
    const { type, ref, shapeFlag, patchFlag } = vnode;
    let domType = node.nodeType;
    vnode.el = node;
    if (patchFlag === -2) {
      optimized = false;
      vnode.dynamicChildren = null;
    }
    let nextNode = null;
    switch (type) {
      case Text:
        if (domType !== 3 /* TEXT */) {
          if (vnode.children === "") {
            insert(vnode.el = createText(""), parentNode(node), node);
            nextNode = node;
          } else {
            nextNode = onMismatch();
          }
        } else {
          if (node.data !== vnode.children) {
            hasMismatch = true;
            node.data = vnode.children;
          }
          nextNode = nextSibling(node);
        }
        break;
      case Comment:
        if (domType !== 8 /* COMMENT */ || isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = nextSibling(node);
        }
        break;
      case Static:
        if (isFragmentStart) {
          node = nextSibling(node);
          domType = node.nodeType;
        }
        if (domType === 1 /* ELEMENT */ || domType === 3 /* TEXT */) {
          nextNode = node;
          const needToAdoptContent = !vnode.children.length;
          for (let i = 0; i < vnode.staticCount; i++) {
            if (needToAdoptContent)
              vnode.children += nextNode.nodeType === 1 /* ELEMENT */ ? nextNode.outerHTML : nextNode.data;
            if (i === vnode.staticCount - 1) {
              vnode.anchor = nextNode;
            }
            nextNode = nextSibling(nextNode);
          }
          return isFragmentStart ? nextSibling(nextNode) : nextNode;
        } else {
          onMismatch();
        }
        break;
      case Fragment:
        if (!isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = hydrateFragment(
            node,
            vnode,
            parentComponent,
            parentSuspense,
            slotScopeIds,
            optimized
          );
        }
        break;
      default:
        if (shapeFlag & 1) {
          if (domType !== 1 /* ELEMENT */ || vnode.type.toLowerCase() !== node.tagName.toLowerCase()) {
            nextNode = onMismatch();
          } else {
            nextNode = hydrateElement(
              node,
              vnode,
              parentComponent,
              parentSuspense,
              slotScopeIds,
              optimized
            );
          }
        } else if (shapeFlag & 6) {
          vnode.slotScopeIds = slotScopeIds;
          const container = parentNode(node);
          mountComponent(
            vnode,
            container,
            null,
            parentComponent,
            parentSuspense,
            isSVGContainer(container),
            optimized
          );
          nextNode = isFragmentStart ? locateClosingAsyncAnchor(node) : nextSibling(node);
          if (nextNode && isComment(nextNode) && nextNode.data === "teleport end") {
            nextNode = nextSibling(nextNode);
          }
          if (isAsyncWrapper(vnode)) {
            let subTree;
            if (isFragmentStart) {
              subTree = createVNode(Fragment);
              subTree.anchor = nextNode ? nextNode.previousSibling : container.lastChild;
            } else {
              subTree = node.nodeType === 3 ? createTextVNode("") : createVNode("div");
            }
            subTree.el = node;
            vnode.component.subTree = subTree;
          }
        } else if (shapeFlag & 64) {
          if (domType !== 8 /* COMMENT */) {
            nextNode = onMismatch();
          } else {
            nextNode = vnode.type.hydrate(
              node,
              vnode,
              parentComponent,
              parentSuspense,
              slotScopeIds,
              optimized,
              rendererInternals,
              hydrateChildren
            );
          }
        } else if (shapeFlag & 128) {
          nextNode = vnode.type.hydrate(
            node,
            vnode,
            parentComponent,
            parentSuspense,
            isSVGContainer(parentNode(node)),
            slotScopeIds,
            optimized,
            rendererInternals,
            hydrateNode
          );
        } else ;
    }
    if (ref != null) {
      setRef(ref, null, parentSuspense, vnode);
    }
    return nextNode;
  };
  const hydrateElement = (el, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    optimized = optimized || !!vnode.dynamicChildren;
    const { type, props, patchFlag, shapeFlag, dirs } = vnode;
    const forcePatchValue = type === "input" && dirs || type === "option";
    if (forcePatchValue || patchFlag !== -1) {
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "created");
      }
      if (props) {
        if (forcePatchValue || !optimized || patchFlag & (16 | 32)) {
          for (const key in props) {
            if (forcePatchValue && key.endsWith("value") || isOn(key) && !isReservedProp(key)) {
              patchProp(
                el,
                key,
                null,
                props[key],
                false,
                void 0,
                parentComponent
              );
            }
          }
        } else if (props.onClick) {
          patchProp(
            el,
            "onClick",
            null,
            props.onClick,
            false,
            void 0,
            parentComponent
          );
        }
      }
      let vnodeHooks;
      if (vnodeHooks = props && props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHooks, parentComponent, vnode);
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
      }
      if ((vnodeHooks = props && props.onVnodeMounted) || dirs) {
        queueEffectWithSuspense(() => {
          vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        }, parentSuspense);
      }
      if (shapeFlag & 16 && // skip if element has innerHTML / textContent
      !(props && (props.innerHTML || props.textContent))) {
        let next = hydrateChildren(
          el.firstChild,
          vnode,
          el,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
        while (next) {
          hasMismatch = true;
          const cur = next;
          next = next.nextSibling;
          remove(cur);
        }
      } else if (shapeFlag & 8) {
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
      const vnode = optimized ? children[i] : children[i] = normalizeVNode(children[i]);
      if (node) {
        node = hydrateNode(
          node,
          vnode,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
      } else if (vnode.type === Text && !vnode.children) {
        continue;
      } else {
        hasMismatch = true;
        patch(
          null,
          vnode,
          container,
          null,
          parentComponent,
          parentSuspense,
          isSVGContainer(container),
          slotScopeIds
        );
      }
    }
    return node;
  };
  const hydrateFragment = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    const { slotScopeIds: fragmentSlotScopeIds } = vnode;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    const container = parentNode(node);
    const next = hydrateChildren(
      nextSibling(node),
      vnode,
      container,
      parentComponent,
      parentSuspense,
      slotScopeIds,
      optimized
    );
    if (next && isComment(next) && next.data === "]") {
      return nextSibling(vnode.anchor = next);
    } else {
      hasMismatch = true;
      insert(vnode.anchor = createComment(`]`), container, next);
      return next;
    }
  };
  const handleMismatch = (node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragment) => {
    hasMismatch = true;
    vnode.el = null;
    if (isFragment) {
      const end = locateClosingAsyncAnchor(node);
      while (true) {
        const next2 = nextSibling(node);
        if (next2 && next2 !== end) {
          remove(next2);
        } else {
          break;
        }
      }
    }
    const next = nextSibling(node);
    const container = parentNode(node);
    remove(node);
    patch(
      null,
      vnode,
      container,
      next,
      parentComponent,
      parentSuspense,
      isSVGContainer(container),
      slotScopeIds
    );
    return next;
  };
  const locateClosingAsyncAnchor = (node) => {
    let match = 0;
    while (node) {
      node = nextSibling(node);
      if (node && isComment(node)) {
        if (node.data === "[")
          match++;
        if (node.data === "]") {
          if (match === 0) {
            return nextSibling(node);
          } else {
            match--;
          }
        }
      }
    }
    return node;
  };
  return [hydrate, hydrateNode];
}

function initFeatureFlags() {
  if (typeof __VUE_OPTIONS_API__ !== "boolean") {
    getGlobalThis().__VUE_OPTIONS_API__ = true;
  }
  if (typeof __VUE_PROD_DEVTOOLS__ !== "boolean") {
    getGlobalThis().__VUE_PROD_DEVTOOLS__ = false;
  }
}

const queuePostRenderEffect = queueEffectWithSuspense ;
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function createHydrationRenderer(options) {
  return baseCreateRenderer(options, createHydrationFunctions);
}
function baseCreateRenderer(options, createHydrationFns) {
  {
    initFeatureFlags();
  }
  const target = getGlobalThis();
  target.__VUE__ = true;
  if (__VUE_PROD_DEVTOOLS__) {
    setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target);
  }
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
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
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        break;
      default:
        if (shapeFlag & 1) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 6) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 64) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (shapeFlag & 128) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized,
            internals
          );
        } else ;
    }
    if (ref != null && parentComponent) {
      setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children),
        container,
        anchor
      );
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateComment(n2.children || ""),
        container,
        anchor
      );
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, isSVG) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      isSVG,
      n2.el,
      n2.anchor
    );
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
    isSVG = isSVG || n2.type === "svg";
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
    } else {
      patchElement(
        n1,
        n2,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { type, props, shapeFlag, transition, dirs } = vnode;
    el = vnode.el = hostCreateElement(
      vnode.type,
      isSVG,
      props && props.is,
      props
    );
    if (shapeFlag & 8) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16) {
      mountChildren(
        vnode.children,
        el,
        null,
        parentComponent,
        parentSuspense,
        isSVG && type !== "foreignObject",
        slotScopeIds,
        optimized
      );
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "created");
    }
    setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    if (props) {
      for (const key in props) {
        if (key !== "value" && !isReservedProp(key)) {
          hostPatchProp(
            el,
            key,
            null,
            props[key],
            isSVG,
            vnode.children,
            parentComponent,
            parentSuspense,
            unmountChildren
          );
        }
      }
      if ("value" in props) {
        hostPatchProp(el, "value", null, props.value);
      }
      if (vnodeHook = props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
    }
    if (__VUE_PROD_DEVTOOLS__) {
      Object.defineProperty(el, "__vnode", {
        value: vnode,
        enumerable: false
      });
      Object.defineProperty(el, "__vueParentComponent", {
        value: parentComponent,
        enumerable: false
      });
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        needCallTransitionHooks && transition.enter(el);
        dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
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
        setScopeId(
          el,
          parentVNode,
          parentVNode.scopeId,
          parentVNode.slotScopeIds,
          parentComponent.parent
        );
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    parentComponent && toggleRecurse(parentComponent, false);
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    parentComponent && toggleRecurse(parentComponent, true);
    const areChildrenSVG = isSVG && n2.type !== "foreignObject";
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        areChildrenSVG,
        slotScopeIds
      );
    } else if (!optimized) {
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        areChildrenSVG,
        slotScopeIds,
        false
      );
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(
          el,
          n2,
          oldProps,
          newProps,
          parentComponent,
          parentSuspense,
          isSVG
        );
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, isSVG);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, isSVG);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(
                el,
                key,
                prev,
                next,
                isSVG,
                n1.children,
                parentComponent,
                parentSuspense,
                unmountChildren
              );
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(
        el,
        n2,
        oldProps,
        newProps,
        parentComponent,
        parentSuspense,
        isSVG
      );
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (oldVNode.type === Fragment || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & (6 | 64)) ? hostParentNode(oldVNode.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          fallbackContainer
        )
      );
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        true
      );
    }
  };
  const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
    if (oldProps !== newProps) {
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              isSVG,
              vnode.children,
              parentComponent,
              parentSuspense,
              unmountChildren
            );
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProp(key))
          continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(
            el,
            key,
            prev,
            next,
            isSVG,
            vnode.children,
            parentComponent,
            parentSuspense,
            unmountChildren
          );
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        n2.children,
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
      // of renderSlot() with no valid children
      n1.dynamicChildren) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds
        );
        if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null || parentComponent && n2 === parentComponent.subTree
        ) {
          traverseStaticChildren(
            n1,
            n2,
            true
            /* shallow */
          );
        }
      } else {
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(
          n2,
          container,
          anchor,
          isSVG,
          optimized
        );
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        );
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    ));
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
    }
    {
      setupComponent(instance);
    }
    if (instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
      if (!initialVNode.el) {
        const placeholder = instance.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
      }
      return;
    }
    setupRenderEffect(
      instance,
      initialVNode,
      container,
      anchor,
      parentSuspense,
      isSVG,
      optimized
    );
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        updateComponentPreRender(instance, n2, optimized);
        return;
      } else {
        instance.next = n2;
        invalidateJob(instance.update);
        instance.update();
      }
    } else {
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
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode);
        }
        toggleRecurse(instance, true);
        if (el && hydrateNode) {
          const hydrateSubTree = () => {
            instance.subTree = renderComponentRoot(instance);
            hydrateNode(
              el,
              instance.subTree,
              instance,
              parentSuspense,
              null
            );
          };
          if (isAsyncWrapperVNode) {
            initialVNode.type.__asyncLoader().then(
              // note: we are moving the render call into an async callback,
              // which means it won't track dependencies - but it's ok because
              // a server-rendered async wrapper is already in resolved state
              // and it will never need to change.
              () => !instance.isUnmounted && hydrateSubTree()
            );
          } else {
            hydrateSubTree();
          }
        } else {
          const subTree = instance.subTree = renderComponentRoot(instance);
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            isSVG
          );
          initialVNode.el = subTree.el;
        }
        if (m) {
          queuePostRenderEffect(m, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
            parentSuspense
          );
        }
        if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense);
        }
        instance.isMounted = true;
        if (__VUE_PROD_DEVTOOLS__) {
          devtoolsComponentAdded(instance);
        }
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent, vnode } = instance;
        let originNext = next;
        let vnodeHook;
        toggleRecurse(instance, false);
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent, next, vnode);
        }
        toggleRecurse(instance, true);
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance,
          parentSuspense,
          isSVG
        );
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, next, vnode),
            parentSuspense
          );
        }
        if (__VUE_PROD_DEVTOOLS__) {
          devtoolsComponentUpdated(instance);
        }
      }
    };
    const effect = instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(update),
      instance.scope
      // track it in component's effect scope
    );
    const update = instance.update = () => effect.run();
    update.id = instance.uid;
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
    flushPreFlushCbs();
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
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
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      );
    }
    if (oldLength > newLength) {
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength
      );
    } else {
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized,
        commonLength
      );
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(
            null,
            c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++)
        newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
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
    const needTransition = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition) {
      if (moveType === 0) {
        transition.beforeEnter(el);
        hostInsert(el, container, anchor);
        queuePostRenderEffect(() => transition.enter(el), parentSuspense);
      } else {
        const { leave, delayLeave, afterLeave } = transition;
        const remove2 = () => hostInsert(el, container, anchor);
        const performLeave = () => {
          leave(el, () => {
            remove2();
            afterLeave && afterLeave();
          });
        };
        if (delayLeave) {
          delayLeave(el, remove2, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const {
      type,
      props,
      ref,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs
    } = vnode;
    if (ref != null) {
      setRef(ref, null, parentSuspense, vnode, true);
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(
          vnode,
          parentComponent,
          parentSuspense,
          optimized,
          internals,
          doRemove
        );
      } else if (dynamicChildren && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        );
      } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove(vnode);
      }
    }
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
      }, parentSuspense);
    }
  };
  const remove = (vnode) => {
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
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave, delayLeave } = transition;
      const performLeave = () => leave(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
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
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (update) {
      update.active = false;
      unmount(subTree, instance, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true;
    }, parentSuspense);
    if (parentSuspense && parentSuspense.pendingBranch && !parentSuspense.isUnmounted && instance.asyncDep && !instance.asyncResolved && instance.suspenseId === parentSuspense.pendingId) {
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
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    return hostNextSibling(vnode.anchor || vnode.el);
  };
  const render = (vnode, container, isSVG) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
      }
    } else {
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
    [hydrate, hydrateNode] = createHydrationFns(
      internals
    );
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
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray(ch1) && isArray(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow)
          traverseStaticChildren(c1, c2);
      }
      if (c2.type === Text) {
        c2.el = c1.el;
      }
    }
  }
}
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
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
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
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === "");
const isTargetSVG = (target) => typeof SVGElement !== "undefined" && target instanceof SVGElement;
const resolveTarget = (props, select) => {
  const targetSelector = props && props.to;
  if (isString(targetSelector)) {
    if (!select) {
      return null;
    } else {
      const target = select(targetSelector);
      return target;
    }
  } else {
    return targetSelector;
  }
};
const TeleportImpl = {
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      o: { insert, querySelector, createText, createComment }
    } = internals;
    const disabled = isTeleportDisabled(n2.props);
    let { shapeFlag, children, dynamicChildren } = n2;
    if (n1 == null) {
      const placeholder = n2.el = createText("");
      const mainAnchor = n2.anchor = createText("");
      insert(placeholder, container, anchor);
      insert(mainAnchor, container, anchor);
      const target = n2.target = resolveTarget(n2.props, querySelector);
      const targetAnchor = n2.targetAnchor = createText("");
      if (target) {
        insert(targetAnchor, target);
        isSVG = isSVG || isTargetSVG(target);
      }
      const mount = (container2, anchor2) => {
        if (shapeFlag & 16) {
          mountChildren(
            children,
            container2,
            anchor2,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          );
        }
      };
      if (disabled) {
        mount(container, mainAnchor);
      } else if (target) {
        mount(target, targetAnchor);
      }
    } else {
      n2.el = n1.el;
      const mainAnchor = n2.anchor = n1.anchor;
      const target = n2.target = n1.target;
      const targetAnchor = n2.targetAnchor = n1.targetAnchor;
      const wasDisabled = isTeleportDisabled(n1.props);
      const currentContainer = wasDisabled ? container : target;
      const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
      isSVG = isSVG || isTargetSVG(target);
      if (dynamicChildren) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          currentContainer,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds
        );
        traverseStaticChildren(n1, n2, true);
      } else if (!optimized) {
        patchChildren(
          n1,
          n2,
          currentContainer,
          currentAnchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          false
        );
      }
      if (disabled) {
        if (!wasDisabled) {
          moveTeleport(
            n2,
            container,
            mainAnchor,
            internals,
            1
          );
        }
      } else {
        if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
          const nextTarget = n2.target = resolveTarget(
            n2.props,
            querySelector
          );
          if (nextTarget) {
            moveTeleport(
              n2,
              nextTarget,
              null,
              internals,
              0
            );
          }
        } else if (wasDisabled) {
          moveTeleport(
            n2,
            target,
            targetAnchor,
            internals,
            1
          );
        }
      }
    }
    updateCssVars(n2);
  },
  remove(vnode, parentComponent, parentSuspense, optimized, { um: unmount, o: { remove: hostRemove } }, doRemove) {
    const { shapeFlag, children, anchor, targetAnchor, target, props } = vnode;
    if (target) {
      hostRemove(targetAnchor);
    }
    if (doRemove || !isTeleportDisabled(props)) {
      hostRemove(anchor);
      if (shapeFlag & 16) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          unmount(
            child,
            parentComponent,
            parentSuspense,
            true,
            !!child.dynamicChildren
          );
        }
      }
    }
  },
  move: moveTeleport,
  hydrate: hydrateTeleport
};
function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2) {
  if (moveType === 0) {
    insert(vnode.targetAnchor, container, parentAnchor);
  }
  const { el, anchor, shapeFlag, children, props } = vnode;
  const isReorder = moveType === 2;
  if (isReorder) {
    insert(el, container, parentAnchor);
  }
  if (!isReorder || isTeleportDisabled(props)) {
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        move(
          children[i],
          container,
          parentAnchor,
          2
        );
      }
    }
  }
  if (isReorder) {
    insert(anchor, container, parentAnchor);
  }
}
function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, {
  o: { nextSibling, parentNode, querySelector }
}, hydrateChildren) {
  const target = vnode.target = resolveTarget(
    vnode.props,
    querySelector
  );
  if (target) {
    const targetNode = target._lpa || target.firstChild;
    if (vnode.shapeFlag & 16) {
      if (isTeleportDisabled(vnode.props)) {
        vnode.anchor = hydrateChildren(
          nextSibling(node),
          vnode,
          parentNode(node),
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
        vnode.targetAnchor = targetNode;
      } else {
        vnode.anchor = nextSibling(node);
        let targetAnchor = targetNode;
        while (targetAnchor) {
          targetAnchor = nextSibling(targetAnchor);
          if (targetAnchor && targetAnchor.nodeType === 8 && targetAnchor.data === "teleport anchor") {
            vnode.targetAnchor = targetAnchor;
            target._lpa = vnode.targetAnchor && nextSibling(vnode.targetAnchor);
            break;
          }
        }
        hydrateChildren(
          targetNode,
          vnode,
          target,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
      }
    }
    updateCssVars(vnode);
  }
  return vnode.anchor && nextSibling(vnode.anchor);
}
const Teleport = TeleportImpl;
function updateCssVars(vnode) {
  const ctx = vnode.ctx;
  if (ctx && ctx.ut) {
    let node = vnode.children[0].el;
    while (node !== vnode.targetAnchor) {
      if (node.nodeType === 1)
        node.setAttribute("data-v-owner", ctx.uid);
      node = node.nextSibling;
    }
    ctx.ut();
  }
}

const Fragment = Symbol.for("v-fgt");
const Text = Symbol.for("v-txt");
const Comment = Symbol.for("v-cmt");
const Static = Symbol.for("v-stc");
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value) {
  isBlockTreeEnabled += value;
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true
      /* isBlock */
    )
  );
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true
      /* isBlock: prevent a block from tracking itself */
    )
  );
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function transformVNodeArgs(transformer) {
}
const InternalObjectKey = `__vInternal`;
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({
  ref,
  ref_key,
  ref_for
}) => {
  if (typeof ref === "number") {
    ref = "" + ref;
  }
  return ref != null ? isString(ref) || isRef(ref) || isFunction(ref) ? { i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for } : ref : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
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
    appContext: null,
    ctx: currentRenderingInstance
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString(children) ? 8 : 16;
  }
  if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
  !isBlockNode && // has current parent block
  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(
      type,
      props,
      true
      /* mergeRef: true */
    );
    if (children) {
      normalizeChildren(cloned, children);
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & 6) {
        currentBlock[currentBlock.indexOf(type)] = cloned;
      } else {
        currentBlock.push(cloned);
      }
    }
    cloned.patchFlag |= -2;
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject(style)) {
      if (isProxy(style) && !isArray(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}
function guardReactiveProps(props) {
  if (!props)
    return null;
  return isProxy(props) || InternalObjectKey in props ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false) {
  const { props, ref, patchFlag, children } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps)
    ) : ref,
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
    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
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
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce
  };
  return cloned;
}
function createTextVNode(text = " ", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function createStaticVNode(content, numberOfNodes) {
  const vnode = createVNode(Static, null, content);
  vnode.staticCount = numberOfNodes;
  return vnode;
}
function createCommentVNode(text = "", asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray(child)) {
    return createVNode(
      Fragment,
      null,
      // #3666, avoid reference pollution when reusing vnode
      child.slice()
    );
  } else if (typeof child === "object") {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !(InternalObjectKey in children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction(children)) {
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
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
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7, [
    vnode,
    prevVNode
  ]);
}

const emptyAppContext = createAppContext();
let uid = 0;
function createComponentInstance(vnode, parent, suspense) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    scope: new EffectScope(
      true
      /* detached */
    ),
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
    // to be set immediately
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
    attrsProxy: null,
    slotsProxy: null,
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
  instance.emit = emit.bind(null, instance);
  if (vnode.ce) {
    vnode.ce(instance);
  }
  return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
let internalSetCurrentInstance;
let globalCurrentInstanceSetters;
let settersKey = "__VUE_INSTANCE_SETTERS__";
{
  if (!(globalCurrentInstanceSetters = getGlobalThis()[settersKey])) {
    globalCurrentInstanceSetters = getGlobalThis()[settersKey] = [];
  }
  globalCurrentInstanceSetters.push((i) => currentInstance = i);
  internalSetCurrentInstance = (instance) => {
    if (globalCurrentInstanceSetters.length > 1) {
      globalCurrentInstanceSetters.forEach((s) => s(instance));
    } else {
      globalCurrentInstanceSetters[0](instance);
    }
  };
}
const setCurrentInstance = (instance) => {
  internalSetCurrentInstance(instance);
  instance.scope.on();
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false) {
  isInSSRComponentSetup = isSSR;
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isInSSRComponentSetup = false;
  return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type;
  instance.accessCache = /* @__PURE__ */ Object.create(null);
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));
  const { setup } = Component;
  if (setup) {
    const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
    setCurrentInstance(instance);
    pauseTracking();
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      0,
      [instance.props, setupContext]
    );
    resetTracking();
    unsetCurrentInstance();
    if (isPromise(setupResult)) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          handleSetupResult(instance, resolvedResult, isSSR);
        }).catch((e) => {
          handleError(e, instance, 0);
        });
      } else {
        instance.asyncDep = setupResult;
      }
    } else {
      handleSetupResult(instance, setupResult, isSSR);
    }
  } else {
    finishComponentSetup(instance, isSSR);
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction(setupResult)) {
    if (instance.type.__ssrInlineRender) {
      instance.ssrRender = setupResult;
    } else {
      instance.render = setupResult;
    }
  } else if (isObject(setupResult)) {
    if (__VUE_PROD_DEVTOOLS__) {
      instance.devtoolsRawSetupState = setupResult;
    }
    instance.setupState = proxyRefs(setupResult);
  } else ;
  finishComponentSetup(instance, isSSR);
}
let compile$1;
let installWithProxy;
function registerRuntimeCompiler(_compile) {
  compile$1 = _compile;
  installWithProxy = (i) => {
    if (i.render._rc) {
      i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
    }
  };
}
const isRuntimeOnly = () => !compile$1;
function finishComponentSetup(instance, isSSR, skipOptions) {
  const Component = instance.type;
  if (!instance.render) {
    if (!isSSR && compile$1 && !Component.render) {
      const template = Component.template || resolveMergedOptions(instance).template;
      if (template) {
        const { isCustomElement, compilerOptions } = instance.appContext.config;
        const { delimiters, compilerOptions: componentCompilerOptions } = Component;
        const finalCompilerOptions = extend(
          extend(
            {
              isCustomElement,
              delimiters
            },
            compilerOptions
          ),
          componentCompilerOptions
        );
        Component.render = compile$1(template, finalCompilerOptions);
      }
    }
    instance.render = Component.render || NOOP;
    if (installWithProxy) {
      installWithProxy(instance);
    }
  }
  if (__VUE_OPTIONS_API__ && true) {
    setCurrentInstance(instance);
    pauseTracking();
    applyOptions(instance);
    resetTracking();
    unsetCurrentInstance();
  }
}
function getAttrsProxy(instance) {
  return instance.attrsProxy || (instance.attrsProxy = new Proxy(
    instance.attrs,
    {
      get(target, key) {
        track(instance, "get", "$attrs");
        return target[key];
      }
    }
  ));
}
function createSetupContext(instance) {
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  {
    return {
      get attrs() {
        return getAttrsProxy(instance);
      },
      slots: instance.slots,
      emit: instance.emit,
      expose
    };
  }
}
function getExposeProxy(instance) {
  if (instance.exposed) {
    return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      },
      has(target, key) {
        return key in target || key in publicPropertiesMap;
      }
    }));
  }
}
function getComponentName(Component, includeInferred = true) {
  return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function isClassComponent(value) {
  return isFunction(value) && "__vccOpts" in value;
}

const computed = (getterOrOptions, debugOptions) => {
  return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
};

function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

const ssrContextKey = Symbol.for("v-scx");
const useSSRContext = () => {
  {
    const ctx = inject(ssrContextKey);
    return ctx;
  }
};

function initCustomFormatter() {
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
  ret.memo = memo.slice();
  return cache[index] = ret;
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
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(cached);
  }
  return true;
}

const version = "3.3.4";
const _ssrUtils = {
  createComponentInstance,
  setupComponent,
  renderComponentRoot,
  setCurrentRenderingInstance,
  isVNode: isVNode,
  normalizeVNode
};
const ssrUtils = _ssrUtils ;
const resolveFilter = null;
const compatUtils = null;

const svgNS = "http://www.w3.org/2000/svg";
const doc = typeof document !== "undefined" ? document : null;
const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag, isSVG, is, props) => {
    const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : void 0);
    if (tag === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text) => doc.createTextNode(text),
  createComment: (text) => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text;
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, isSVG, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild;
    if (start && (start === end || start.nextSibling)) {
      while (true) {
        parent.insertBefore(start.cloneNode(true), anchor);
        if (start === end || !(start = start.nextSibling))
          break;
      }
    } else {
      templateContainer.innerHTML = isSVG ? `<svg>${content}</svg>` : content;
      const template = templateContainer.content;
      if (isSVG) {
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

function patchClass(el, value, isSVG) {
  const transitionClasses = el._vtc;
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}

function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);
  if (next && !isCssString) {
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          setStyle(style, key, "");
        }
      }
    }
    for (const key in next) {
      setStyle(style, key, next[key]);
    }
  } else {
    const currentDisplay = style.display;
    if (isCssString) {
      if (prev !== next) {
        style.cssText = next;
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
    if ("_vod" in el) {
      style.display = currentDisplay;
    }
  }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (val == null)
      val = "";
    if (name.startsWith("--")) {
      style.setProperty(name, val);
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ""),
          "important"
        );
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}

const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    const isBoolean = isSpecialBooleanAttr(key);
    if (value == null || isBoolean && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, isBoolean ? "" : value);
    }
  }
}

function patchDOMProp(el, key, value, prevChildren, parentComponent, parentSuspense, unmountChildren) {
  if (key === "innerHTML" || key === "textContent") {
    if (prevChildren) {
      unmountChildren(prevChildren, parentComponent, parentSuspense);
    }
    el[key] = value == null ? "" : value;
    return;
  }
  const tag = el.tagName;
  if (key === "value" && tag !== "PROGRESS" && // custom elements may use _value internally
  !tag.includes("-")) {
    el._value = value;
    const oldValue = tag === "OPTION" ? el.getAttribute("value") : el.value;
    const newValue = value == null ? "" : value;
    if (oldValue !== newValue) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    return;
  }
  let needRemove = false;
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      value = includeBooleanAttr(value);
    } else if (value == null && type === "string") {
      value = "";
      needRemove = true;
    } else if (type === "number") {
      value = 0;
      needRemove = true;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
  }
  needRemove && el.removeAttribute(key);
}

function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(nextValue, instance);
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {
    options = {};
    let m;
    while (m = name.match(optionsModifierRE)) {
      name = name.slice(0, name.length - m[0].length);
      options[m[0].toLowerCase()] = true;
    }
  }
  const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
let cachedNow = 0;
const p = /* @__PURE__ */ Promise.resolve();
const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    if (!e._vts) {
      e._vts = Date.now();
    } else if (e._vts <= invoker.attached) {
      return;
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance,
      5,
      [e]
    );
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
function patchStopImmediatePropagation(e, value) {
  if (isArray(value)) {
    const originalStop = e.stopImmediatePropagation;
    e.stopImmediatePropagation = () => {
      originalStop.call(e);
      e._stopped = true;
    };
    return value.map((fn) => (e2) => !e2._stopped && fn && fn(e2));
  } else {
    return value;
  }
}

const nativeOnRE = /^on[a-z]/;
const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(
      el,
      key,
      nextValue,
      prevChildren,
      parentComponent,
      parentSuspense,
      unmountChildren
    );
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && nativeOnRE.test(key) && isFunction(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (nativeOnRE.test(key) && isString(value)) {
    return false;
  }
  return key in el;
}

function defineCustomElement(options, hydrate2) {
  const Comp = defineComponent(options);
  class VueCustomElement extends VueElement {
    constructor(initialProps) {
      super(Comp, initialProps, hydrate2);
    }
  }
  VueCustomElement.def = Comp;
  return VueCustomElement;
}
const defineSSRCustomElement = (options) => {
  return defineCustomElement(options, hydrate);
};
const BaseClass = typeof HTMLElement !== "undefined" ? HTMLElement : class {
};
class VueElement extends BaseClass {
  constructor(_def, _props = {}, hydrate2) {
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
    if (this.shadowRoot && hydrate2) {
      hydrate2(this._createVNode(), this.shadowRoot);
    } else {
      this.attachShadow({ mode: "open" });
      if (!this._def.__asyncLoader) {
        this._resolveProps(this._def);
      }
    }
  }
  connectedCallback() {
    this._connected = true;
    if (!this._instance) {
      if (this._resolved) {
        this._update();
      } else {
        this._resolveDef();
      }
    }
  }
  disconnectedCallback() {
    this._connected = false;
    nextTick(() => {
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
    this._resolved = true;
    for (let i = 0; i < this.attributes.length; i++) {
      this._setAttr(this.attributes[i].name);
    }
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        this._setAttr(m.attributeName);
      }
    }).observe(this, { attributes: true });
    const resolve = (def, isAsync = false) => {
      const { props, styles } = def;
      let numberProps;
      if (props && !isArray(props)) {
        for (const key in props) {
          const opt = props[key];
          if (opt === Number || opt && opt.type === Number) {
            if (key in this._props) {
              this._props[key] = toNumber(this._props[key]);
            }
            (numberProps || (numberProps = /* @__PURE__ */ Object.create(null)))[camelize(key)] = true;
          }
        }
      }
      this._numberProps = numberProps;
      if (isAsync) {
        this._resolveProps(def);
      }
      this._applyStyles(styles);
      this._update();
    };
    const asyncDef = this._def.__asyncLoader;
    if (asyncDef) {
      asyncDef().then((def) => resolve(def, true));
    } else {
      resolve(this._def);
    }
  }
  _resolveProps(def) {
    const { props } = def;
    const declaredPropKeys = isArray(props) ? props : Object.keys(props || {});
    for (const key of Object.keys(this)) {
      if (key[0] !== "_" && declaredPropKeys.includes(key)) {
        this._setProp(key, this[key], true, false);
      }
    }
    for (const key of declaredPropKeys.map(camelize)) {
      Object.defineProperty(this, key, {
        get() {
          return this._getProp(key);
        },
        set(val) {
          this._setProp(key, val);
        }
      });
    }
  }
  _setAttr(key) {
    let value = this.getAttribute(key);
    const camelKey = camelize(key);
    if (this._numberProps && this._numberProps[camelKey]) {
      value = toNumber(value);
    }
    this._setProp(camelKey, value, false);
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
      if (shouldReflect) {
        if (val === true) {
          this.setAttribute(hyphenate(key), "");
        } else if (typeof val === "string" || typeof val === "number") {
          this.setAttribute(hyphenate(key), val + "");
        } else if (!val) {
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
      vnode.ce = (instance) => {
        this._instance = instance;
        instance.isCE = true;
        const dispatch = (event, args) => {
          this.dispatchEvent(
            new CustomEvent(event, {
              detail: args
            })
          );
        };
        instance.emit = (event, ...args) => {
          dispatch(event, args);
          if (hyphenate(event) !== event) {
            dispatch(hyphenate(event), args);
          }
        };
        let parent = this;
        while (parent = parent && (parent.parentNode || parent.host)) {
          if (parent instanceof VueElement) {
            instance.parent = parent._instance;
            instance.provides = parent._instance.provides;
            break;
          }
        }
      };
    }
    return vnode;
  }
  _applyStyles(styles) {
    if (styles) {
      styles.forEach((css) => {
        const s = document.createElement("style");
        s.textContent = css;
        this.shadowRoot.appendChild(s);
      });
    }
  }
}

function useCssModule(name = "$style") {
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

function useCssVars(getter) {
  const instance = getCurrentInstance();
  if (!instance) {
    return;
  }
  const updateTeleports = instance.ut = (vars = getter(instance.proxy)) => {
    Array.from(
      document.querySelectorAll(`[data-v-owner="${instance.uid}"]`)
    ).forEach((node) => setVarsOnNode(node, vars));
  };
  const setVars = () => {
    const vars = getter(instance.proxy);
    setVarsOnVNode(instance.subTree, vars);
    updateTeleports(vars);
  };
  watchPostEffect(setVars);
  onMounted(() => {
    const ob = new MutationObserver(setVars);
    ob.observe(instance.subTree.el.parentNode, { childList: true });
    onUnmounted(() => ob.disconnect());
  });
}
function setVarsOnVNode(vnode, vars) {
  if (vnode.shapeFlag & 128) {
    const suspense = vnode.suspense;
    vnode = suspense.activeBranch;
    if (suspense.pendingBranch && !suspense.isHydrating) {
      suspense.effects.push(() => {
        setVarsOnVNode(suspense.activeBranch, vars);
      });
    }
  }
  while (vnode.component) {
    vnode = vnode.component.subTree;
  }
  if (vnode.shapeFlag & 1 && vnode.el) {
    setVarsOnNode(vnode.el, vars);
  } else if (vnode.type === Fragment) {
    vnode.children.forEach((c) => setVarsOnVNode(c, vars));
  } else if (vnode.type === Static) {
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

const TRANSITION = "transition";
const ANIMATION = "animation";
const Transition = (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots);
Transition.displayName = "Transition";
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
const TransitionPropsValidators = Transition.props = /* @__PURE__ */ extend(
  {},
  BaseTransitionPropsValidators,
  DOMTransitionPropsValidators
);
const callHook = (hook, args = []) => {
  if (isArray(hook)) {
    hook.forEach((h2) => h2(...args));
  } else if (hook) {
    hook(...args);
  }
};
const hasExplicitCallback = (hook) => {
  return hook ? isArray(hook) ? hook.some((h2) => h2.length > 1) : hook.length > 1 : false;
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
  const {
    name = "v",
    type,
    duration,
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    appearFromClass = enterFromClass,
    appearActiveClass = enterActiveClass,
    appearToClass = enterToClass,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`
  } = rawProps;
  const durations = normalizeDuration(duration);
  const enterDuration = durations && durations[0];
  const leaveDuration = durations && durations[1];
  const {
    onBeforeEnter,
    onEnter,
    onEnterCancelled,
    onLeave,
    onLeaveCancelled,
    onBeforeAppear = onBeforeEnter,
    onAppear = onEnter,
    onAppearCancelled = onEnterCancelled
  } = baseProps;
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
      forceReflow();
      addTransitionClass(el, leaveActiveClass);
      nextFrame(() => {
        if (!el._isLeaving) {
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
  } else if (isObject(duration)) {
    return [NumberOf(duration.enter), NumberOf(duration.leave)];
  } else {
    const n = NumberOf(duration);
    return [n, n];
  }
}
function NumberOf(val) {
  const res = toNumber(val);
  return res;
}
function addTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.add(c));
  (el._vtc || (el._vtc = /* @__PURE__ */ new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.remove(c));
  const { _vtc } = el;
  if (_vtc) {
    _vtc.delete(cls);
    if (!_vtc.size) {
      el._vtc = void 0;
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
  const id = el._endId = ++endId;
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
  const endEvent = type + "end";
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
  const getStyleProperties = (key) => (styles[key] || "").split(", ");
  const transitionDelays = getStyleProperties(`${TRANSITION}Delay`);
  const transitionDurations = getStyleProperties(`${TRANSITION}Duration`);
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties(`${ANIMATION}Delay`);
  const animationDurations = getStyleProperties(`${ANIMATION}Duration`);
  const animationTimeout = getTimeout(animationDelays, animationDurations);
  let type = null;
  let timeout = 0;
  let propCount = 0;
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
    propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
  }
  const hasTransform = type === TRANSITION && /\b(transform|all)(,|$)/.test(
    getStyleProperties(`${TRANSITION}Property`).toString()
  );
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
function toMs(s) {
  return Number(s.slice(0, -1).replace(",", ".")) * 1e3;
}
function forceReflow() {
  return document.body.offsetHeight;
}

const positionMap = /* @__PURE__ */ new WeakMap();
const newPositionMap = /* @__PURE__ */ new WeakMap();
const TransitionGroupImpl = {
  name: "TransitionGroup",
  props: /* @__PURE__ */ extend({}, TransitionPropsValidators, {
    tag: String,
    moveClass: String
  }),
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const state = useTransitionState();
    let prevChildren;
    let children;
    onUpdated(() => {
      if (!prevChildren.length) {
        return;
      }
      const moveClass = props.moveClass || `${props.name || "v"}-move`;
      if (!hasCSSTransform(
        prevChildren[0].el,
        instance.vnode.el,
        moveClass
      )) {
        return;
      }
      prevChildren.forEach(callPendingCbs);
      prevChildren.forEach(recordPosition);
      const movedChildren = prevChildren.filter(applyTranslation);
      forceReflow();
      movedChildren.forEach((c) => {
        const el = c.el;
        const style = el.style;
        addTransitionClass(el, moveClass);
        style.transform = style.webkitTransform = style.transitionDuration = "";
        const cb = el._moveCb = (e) => {
          if (e && e.target !== el) {
            return;
          }
          if (!e || /transform$/.test(e.propertyName)) {
            el.removeEventListener("transitionend", cb);
            el._moveCb = null;
            removeTransitionClass(el, moveClass);
          }
        };
        el.addEventListener("transitionend", cb);
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
          setTransitionHooks(
            child,
            resolveTransitionHooks(child, cssTransitionProps, state, instance)
          );
        }
      }
      if (prevChildren) {
        for (let i = 0; i < prevChildren.length; i++) {
          const child = prevChildren[i];
          setTransitionHooks(
            child,
            resolveTransitionHooks(child, cssTransitionProps, state, instance)
          );
          positionMap.set(child, child.el.getBoundingClientRect());
        }
      }
      return createVNode(tag, null, children);
    };
  }
};
const removeMode = (props) => delete props.mode;
/* @__PURE__ */ removeMode(TransitionGroupImpl.props);
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
    s.transitionDuration = "0s";
    return c;
  }
}
function hasCSSTransform(el, root, moveClass) {
  const clone = el.cloneNode();
  if (el._vtc) {
    el._vtc.forEach((cls) => {
      cls.split(/\s+/).forEach((c) => c && clone.classList.remove(c));
    });
  }
  moveClass.split(/\s+/).forEach((c) => c && clone.classList.add(c));
  clone.style.display = "none";
  const container = root.nodeType === 1 ? root : root.parentNode;
  container.appendChild(clone);
  const { hasTransform } = getTransitionInfo(clone);
  container.removeChild(clone);
  return hasTransform;
}

const getModelAssigner = (vnode) => {
  const fn = vnode.props["onUpdate:modelValue"] || false;
  return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
  e.target.composing = true;
}
function onCompositionEnd(e) {
  const target = e.target;
  if (target.composing) {
    target.composing = false;
    target.dispatchEvent(new Event("input"));
  }
}
const vModelText = {
  created(el, { modifiers: { lazy, trim, number } }, vnode) {
    el._assign = getModelAssigner(vnode);
    const castToNumber = number || vnode.props && vnode.props.type === "number";
    addEventListener(el, lazy ? "change" : "input", (e) => {
      if (e.target.composing)
        return;
      let domValue = el.value;
      if (trim) {
        domValue = domValue.trim();
      }
      if (castToNumber) {
        domValue = looseToNumber(domValue);
      }
      el._assign(domValue);
    });
    if (trim) {
      addEventListener(el, "change", () => {
        el.value = el.value.trim();
      });
    }
    if (!lazy) {
      addEventListener(el, "compositionstart", onCompositionStart);
      addEventListener(el, "compositionend", onCompositionEnd);
      addEventListener(el, "change", onCompositionEnd);
    }
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(el, { value }) {
    el.value = value == null ? "" : value;
  },
  beforeUpdate(el, { value, modifiers: { lazy, trim, number } }, vnode) {
    el._assign = getModelAssigner(vnode);
    if (el.composing)
      return;
    if (document.activeElement === el && el.type !== "range") {
      if (lazy) {
        return;
      }
      if (trim && el.value.trim() === value) {
        return;
      }
      if ((number || el.type === "number") && looseToNumber(el.value) === value) {
        return;
      }
    }
    const newValue = value == null ? "" : value;
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
    addEventListener(el, "change", () => {
      const modelValue = el._modelValue;
      const elementValue = getValue(el);
      const checked = el.checked;
      const assign = el._assign;
      if (isArray(modelValue)) {
        const index = looseIndexOf(modelValue, elementValue);
        const found = index !== -1;
        if (checked && !found) {
          assign(modelValue.concat(elementValue));
        } else if (!checked && found) {
          const filtered = [...modelValue];
          filtered.splice(index, 1);
          assign(filtered);
        }
      } else if (isSet(modelValue)) {
        const cloned = new Set(modelValue);
        if (checked) {
          cloned.add(elementValue);
        } else {
          cloned.delete(elementValue);
        }
        assign(cloned);
      } else {
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
  if (isArray(value)) {
    el.checked = looseIndexOf(value, vnode.props.value) > -1;
  } else if (isSet(value)) {
    el.checked = value.has(vnode.props.value);
  } else if (value !== oldValue) {
    el.checked = looseEqual(value, getCheckboxValue(el, true));
  }
}
const vModelRadio = {
  created(el, { value }, vnode) {
    el.checked = looseEqual(value, vnode.props.value);
    el._assign = getModelAssigner(vnode);
    addEventListener(el, "change", () => {
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
    addEventListener(el, "change", () => {
      const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map(
        (o) => number ? looseToNumber(getValue(o)) : getValue(o)
      );
      el._assign(
        el.multiple ? isSetModel ? new Set(selectedVal) : selectedVal : selectedVal[0]
      );
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
  if (isMultiple && !isArray(value) && !isSet(value)) {
    return;
  }
  for (let i = 0, l = el.options.length; i < l; i++) {
    const option = el.options[i];
    const optionValue = getValue(option);
    if (isMultiple) {
      if (isArray(value)) {
        option.selected = looseIndexOf(value, optionValue) > -1;
      } else {
        option.selected = value.has(optionValue);
      }
    } else {
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
function getValue(el) {
  return "_value" in el ? el._value : el.value;
}
function getCheckboxValue(el, checked) {
  const key = checked ? "_trueValue" : "_falseValue";
  return key in el ? el[key] : checked;
}
const vModelDynamic = {
  created(el, binding, vnode) {
    callModelHook(el, binding, vnode, null, "created");
  },
  mounted(el, binding, vnode) {
    callModelHook(el, binding, vnode, null, "mounted");
  },
  beforeUpdate(el, binding, vnode, prevVNode) {
    callModelHook(el, binding, vnode, prevVNode, "beforeUpdate");
  },
  updated(el, binding, vnode, prevVNode) {
    callModelHook(el, binding, vnode, prevVNode, "updated");
  }
};
function resolveDynamicModel(tagName, type) {
  switch (tagName) {
    case "SELECT":
      return vModelSelect;
    case "TEXTAREA":
      return vModelText;
    default:
      switch (type) {
        case "checkbox":
          return vModelCheckbox;
        case "radio":
          return vModelRadio;
        default:
          return vModelText;
      }
  }
}
function callModelHook(el, binding, vnode, prevVNode, hook) {
  const modelToUse = resolveDynamicModel(
    el.tagName,
    vnode.props && vnode.props.type
  );
  const fn = modelToUse[hook];
  fn && fn(el, binding, vnode, prevVNode);
}
function initVModelForSSR() {
  vModelText.getSSRProps = ({ value }) => ({ value });
  vModelRadio.getSSRProps = ({ value }, vnode) => {
    if (vnode.props && looseEqual(vnode.props.value, value)) {
      return { checked: true };
    }
  };
  vModelCheckbox.getSSRProps = ({ value }, vnode) => {
    if (isArray(value)) {
      if (vnode.props && looseIndexOf(value, vnode.props.value) > -1) {
        return { checked: true };
      }
    } else if (isSet(value)) {
      if (vnode.props && value.has(vnode.props.value)) {
        return { checked: true };
      }
    } else if (value) {
      return { checked: true };
    }
  };
  vModelDynamic.getSSRProps = (binding, vnode) => {
    if (typeof vnode.type !== "string") {
      return;
    }
    const modelToUse = resolveDynamicModel(
      // resolveDynamicModel expects an uppercase tag name, but vnode.type is lowercase
      vnode.type.toUpperCase(),
      vnode.props && vnode.props.type
    );
    if (modelToUse.getSSRProps) {
      return modelToUse.getSSRProps(binding, vnode);
    }
  };
}

const systemModifiers = ["ctrl", "shift", "alt", "meta"];
const modifierGuards = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
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
const keyNames = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
};
const withKeys = (fn, modifiers) => {
  return (event) => {
    if (!("key" in event)) {
      return;
    }
    const eventKey = hyphenate(event.key);
    if (modifiers.some((k) => k === eventKey || keyNames[k] === eventKey)) {
      return fn(event);
    }
  };
};

const vShow = {
  beforeMount(el, { value }, { transition }) {
    el._vod = el.style.display === "none" ? "" : el.style.display;
    if (transition && value) {
      transition.beforeEnter(el);
    } else {
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
      } else {
        transition.leave(el, () => {
          setDisplay(el, false);
        });
      }
    } else {
      setDisplay(el, value);
    }
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value);
  }
};
function setDisplay(el, value) {
  el.style.display = value ? el._vod : "none";
}
function initVShowForSSR() {
  vShow.getSSRProps = ({ value }) => {
    if (!value) {
      return { style: { display: "none" } };
    }
  };
}

const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
let renderer;
let enabledHydration = false;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
function ensureHydrationRenderer() {
  renderer = enabledHydration ? renderer : createHydrationRenderer(rendererOptions);
  enabledHydration = true;
  return renderer;
}
const render = (...args) => {
  ensureRenderer().render(...args);
};
const hydrate = (...args) => {
  ensureHydrationRenderer().hydrate(...args);
};
const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (!container)
      return;
    const component = app._component;
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    container.innerHTML = "";
    const proxy = mount(container, false, container instanceof SVGElement);
    if (container instanceof Element) {
      container.removeAttribute("v-cloak");
      container.setAttribute("data-v-app", "");
    }
    return proxy;
  };
  return app;
};
const createSSRApp = (...args) => {
  const app = ensureHydrationRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (container) {
      return mount(container, true, container instanceof SVGElement);
    }
  };
  return app;
};
function normalizeContainer(container) {
  if (isString(container)) {
    const res = document.querySelector(container);
    return res;
  }
  return container;
}
let ssrDirectiveInitialized = false;
const initDirectivesForSSR = () => {
  if (!ssrDirectiveInitialized) {
    ssrDirectiveInitialized = true;
    initVModelForSSR();
    initVShowForSSR();
  }
} ;

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
  toValue,
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
  BaseTransitionPropsValidators,
  Comment,
  Fragment,
  KeepAlive,
  Static,
  Suspense,
  Teleport,
  Text,
  assertNumber,
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
  defineModel,
  defineOptions,
  defineProps,
  defineSlots,
  get devtools () { return devtools; },
  getCurrentInstance,
  getTransitionRawChildren,
  guardReactiveProps,
  h,
  handleError,
  hasInjectionContext,
  initCustomFormatter,
  inject,
  isMemoSame,
  isRuntimeOnly,
  isVNode,
  mergeDefaults,
  mergeModels,
  mergeProps,
  nextTick,
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
  useModel,
  useSSRContext,
  useSlots,
  useTransitionState,
  version,
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

export { Buffer$3 as B, EventEmitter$2 as E, Vue as V, createApp as a, browser$4 as b, createVNode as c, defineComponent as d, stream$1 as e, pinyinUtil as p, speedometer as s, wav as w, yauzl as y };
