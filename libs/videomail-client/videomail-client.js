require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var toBuffer       = require('typedarray-to-buffer'),
    isFloat32Array = require('validate.io-float32array')

module.exports = function(float32Array) {

    if (!float32Array)
        throw new Error('A Float32Array parameter is missing.')

    if (!isFloat32Array(float32Array))
        throw new Error('The parameter is not a Float32Array.')

    this.toBuffer = function() {

        var l   = float32Array.length,
            arr = new Int16Array(l),
            i

        for (i = 0; i < l; i++) {
            arr[i] = Math.min(1, float32Array[i]) * 0x7FFF
        }

        return toBuffer(arr)
    }
}

},{"typedarray-to-buffer":64,"validate.io-float32array":70}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],5:[function(require,module,exports){
(function (global){
'use strict';

var buffer = require('buffer');
var Buffer = buffer.Buffer;
var SlowBuffer = buffer.SlowBuffer;
var MAX_LEN = buffer.kMaxLength || 2147483647;
exports.alloc = function alloc(size, fill, encoding) {
  if (typeof Buffer.alloc === 'function') {
    return Buffer.alloc(size, fill, encoding);
  }
  if (typeof encoding === 'number') {
    throw new TypeError('encoding must not be number');
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  var enc = encoding;
  var _fill = fill;
  if (_fill === undefined) {
    enc = undefined;
    _fill = 0;
  }
  var buf = new Buffer(size);
  if (typeof _fill === 'string') {
    var fillBuf = new Buffer(_fill, enc);
    var flen = fillBuf.length;
    var i = -1;
    while (++i < size) {
      buf[i] = fillBuf[i % flen];
    }
  } else {
    buf.fill(_fill);
  }
  return buf;
}
exports.allocUnsafe = function allocUnsafe(size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    return Buffer.allocUnsafe(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new Buffer(size);
}
exports.from = function from(value, encodingOrOffset, length) {
  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
    return Buffer.from(value, encodingOrOffset, length);
  }
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof value === 'string') {
    return new Buffer(value, encodingOrOffset);
  }
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    var offset = encodingOrOffset;
    if (arguments.length === 1) {
      return new Buffer(value);
    }
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    var len = length;
    if (typeof len === 'undefined') {
      len = value.byteLength - offset;
    }
    if (offset >= value.byteLength) {
      throw new RangeError('\'offset\' is out of bounds');
    }
    if (len > value.byteLength - offset) {
      throw new RangeError('\'length\' is out of bounds');
    }
    return new Buffer(value.slice(offset, offset + len));
  }
  if (Buffer.isBuffer(value)) {
    var out = new Buffer(value.length);
    value.copy(out, 0, 0, value.length);
    return out;
  }
  if (value) {
    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
      return new Buffer(value);
    }
    if (value.type === 'Buffer' && Array.isArray(value.data)) {
      return new Buffer(value.data);
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
}
exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
  if (typeof Buffer.allocUnsafeSlow === 'function') {
    return Buffer.allocUnsafeSlow(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size >= MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new SlowBuffer(size);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"buffer":6}],6:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

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
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
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

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
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

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

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
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
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
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
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

    if (obj.type === 'Buffer' && isArray(obj.data)) {
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
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
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
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
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
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

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
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
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

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

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
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
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
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
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

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
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
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

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
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
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
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":2,"ieee754":24,"isarray":34}],7:[function(require,module,exports){
var toBuffer  = require('typedarray-to-buffer'),
    isBrowser = typeof(document) !== 'undefined' && typeof(document.createElement) === 'function',

    // cached, used only once for browser environments
    verifiedImageType

module.exports = function(canvas, options) {

    var self = this, quality

    options             = options               ? options :             {}
    options.image       = options.image         ? options.image :       {}
    options.image.types = options.image.types   ? options.image.types : []

    // validate some options this class needs
    if (options.image.types.length > 2)
        throw new Error('Too many image types are specified!')

    else if (options.image.types.length < 1) {

        // Set a default image type, just to be robust
        options.image.types = isBrowser ? ['webp', 'jpeg'] : ['png']
    }

    if (!options.image.quality)
        options.image.quality = .5 // default

    quality = parseFloat(options.image.quality)

    function composeImageType(index) {
        var imageType

        if (options.image.types[index])
            imageType = 'image/' + options.image.types[index]

        return imageType
    }

    function isMatch(uri, imageType) {
        var match = uri && uri.match(imageType)

        match && options.debug && options.debug('Image type %s verified', imageType)

        return match
    }

    // Performance tweak, we do not need a big canvas for finding out the supported image type
    function getTestCanvas() {

        var testCanvas

        if (isBrowser) {
            testCanvas = document.createElement('canvas')
            testCanvas.width = testCanvas.height = 1
        } else
            testCanvas = canvas

        return testCanvas
    }

    function canvasSupportsImageTypeAsync(imageType, cb) {
        try {
            getTestCanvas().toDataURL(imageType, function(err, uri) {
                if (err)
                    cb(err)
                else
                    cb(null, isMatch(uri, imageType))
            })
        } catch (exc) {
            cb(null, false)
        }
    }

    function canvasSupportsImageTypeSync(imageType) {
        var match

        try {
            var testCanvas = getTestCanvas(),
                uri        = testCanvas.toDataURL && testCanvas.toDataURL(imageType)

            match = isMatch(uri, imageType)
        } catch (exc) {

            // Can happen when i.E. a spider is coming. Just be robust here and continue.
            options.debug &&
            options.logger.debug('Failed to call toDataURL() on canvas for image type %s', imageType)
        }

        return match
    }

    function verifyImageTypeAsync(imageType, cb) {
        canvasSupportsImageTypeAsync(imageType, function(err, match) {
            if (err)
                cb(err)
            else {

                if (match)
                    cb(null, imageType)
                else {
                    imageType = composeImageType(1)

                    canvasSupportsImageTypeAsync(imageType, function(err, match) {
                        if (err)
                            cb(err)
                        else
                            cb(null, match ? imageType: null)
                    })
                }
            }
        })
    }

    function verifyImageTypeSync(imageType) {
        if (!canvasSupportsImageTypeSync(imageType)) {

            if (options.image.types[1]) {
                imageType = composeImageType(1)

                if (!canvasSupportsImageTypeSync(imageType))
                    imageType = null
            } else
                imageType = null
        }

        !imageType && options.debug && options.logger.debug('Unable to verify image type')

        return imageType
    }

    // callbacks are needed for server side tests
    function verifyImageType(cb) {
        var imageType = composeImageType(0)

        if (cb) {
            verifyImageTypeAsync(imageType, cb)
        } else {
            return verifyImageTypeSync(imageType)
        }
    }

    // this method is proven to be fast, see
    // http://jsperf.com/data-uri-to-buffer-performance/3
    function uriToBuffer(uri) {

        var uri = uri.split(',')[1],
            bytes

        // Beware that the atob function might be a static one for server side tests
        if (typeof(atob) === 'function')
            bytes = atob(uri)
        else if (typeof(self.constructor.atob) === 'function')
            bytes = self.constructor.atob(uri)
        else
            throw new Error('atob function is missing')

        var arr = new Uint8Array(bytes.length)

        // http://mrale.ph/blog/2014/12/24/array-length-caching.html
        for (var i = 0, l = bytes.length; i < l; i++) {
            arr[i] = bytes.charCodeAt(i)
        }

        return toBuffer(arr)
    }

    function toBufferSync() {
        var imageType = self.getImageType(),
            buffer

        if (imageType) {
            var uri = canvas.toDataURL(imageType, quality)
            buffer = uriToBuffer(uri)
        }

        return buffer
    }

    function toBufferAsync(cb) {
        self.getImageType(function(err, imageType) {
            if (err)
                cb(err)
            else if (!imageType)
                cb()
            else
                canvas.toDataURL(imageType, function(err, uri) {
                    if (err)
                        cb(err)
                    else
                        cb(null, uriToBuffer(uri))
                })
        })
    }

    this.toBuffer = function(cb) {
        if (cb)
            toBufferAsync(cb)
        else
            return toBufferSync()
    }

    // browsers do not need a callback, but tests do
    this.getImageType = function(cb) {

        // only run for the first time this constructor is called and
        // cache result for the next calls

        if (cb) {
            if (!verifiedImageType || !isBrowser)
                verifyImageType(function(err, newVerifiedImageType) {
                    if (err)
                        cb(err)
                    else {
                        verifiedImageType = newVerifiedImageType
                        cb(null, verifiedImageType)
                    }
                })
            else
                cb(null, verifiedImageType)

        } else {
            // on the browser side we do cache it for speed
            if (!verifiedImageType || !isBrowser)
                verifiedImageType = verifyImageType()

            return verifiedImageType
        }
    }
}

},{"typedarray-to-buffer":64}],8:[function(require,module,exports){
// contains, add, remove, toggle
var indexof = require('indexof')

module.exports = ClassList

function ClassList(elem) {
    var cl = elem.classList

    if (cl) {
        return cl
    }

    var classList = {
        add: add
        , remove: remove
        , contains: contains
        , toggle: toggle
        , toString: $toString
        , length: 0
        , item: item
    }

    return classList

    function add(token) {
        var list = getTokens()
        if (indexof(list, token) > -1) {
            return
        }
        list.push(token)
        setTokens(list)
    }

    function remove(token) {
        var list = getTokens()
            , index = indexof(list, token)

        if (index === -1) {
            return
        }

        list.splice(index, 1)
        setTokens(list)
    }

    function contains(token) {
        return indexof(getTokens(), token) > -1
    }

    function toggle(token) {
        if (contains(token)) {
            remove(token)
            return false
        } else {
            add(token)
            return true
        }
    }

    function $toString() {
        return elem.className
    }

    function item(index) {
        var tokens = getTokens()
        return tokens[index] || null
    }

    function getTokens() {
        var className = elem.className

        return filter(className.split(" "), isTruthy)
    }

    function setTokens(list) {
        var length = list.length

        elem.className = list.join(" ")
        classList.length = length

        for (var i = 0; i < list.length; i++) {
            classList[i] = list[i]
        }

        delete list[length]
    }
}

function filter (arr, fn) {
    var ret = []
    for (var i = 0; i < arr.length; i++) {
        if (fn(arr[i])) ret.push(arr[i])
    }
    return ret
}

function isTruthy(value) {
    return !!value
}

},{"indexof":25}],9:[function(require,module,exports){
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20150312
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList
if (!("classList" in document.createElement("_")) 
	|| document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
	  classListProp = "classList"
	, protoProp = "prototype"
	, elemCtrProto = view.Element[protoProp]
	, objCtr = Object
	, strTrim = String[protoProp].trim || function () {
		return this.replace(/^\s+|\s+$/g, "");
	}
	, arrIndexOf = Array[protoProp].indexOf || function (item) {
		var
			  i = 0
			, len = this.length
		;
		for (; i < len; i++) {
			if (i in this && this[i] === item) {
				return i;
			}
		}
		return -1;
	}
	// Vendors: please allow content code to instantiate DOMExceptions
	, DOMEx = function (type, message) {
		this.name = type;
		this.code = DOMException[type];
		this.message = message;
	}
	, checkTokenAndGetIndex = function (classList, token) {
		if (token === "") {
			throw new DOMEx(
				  "SYNTAX_ERR"
				, "An invalid or illegal string was specified"
			);
		}
		if (/\s/.test(token)) {
			throw new DOMEx(
				  "INVALID_CHARACTER_ERR"
				, "String contains an invalid character"
			);
		}
		return arrIndexOf.call(classList, token);
	}
	, ClassList = function (elem) {
		var
			  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
			, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
			, i = 0
			, len = classes.length
		;
		for (; i < len; i++) {
			this.push(classes[i]);
		}
		this._updateClassName = function () {
			elem.setAttribute("class", this.toString());
		};
	}
	, classListProto = ClassList[protoProp] = []
	, classListGetter = function () {
		return new ClassList(this);
	}
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
	return this[i] || null;
};
classListProto.contains = function (token) {
	token += "";
	return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
	;
	do {
		token = tokens[i] + "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.push(token);
			updated = true;
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.remove = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
		, index
	;
	do {
		token = tokens[i] + "";
		index = checkTokenAndGetIndex(this, token);
		while (index !== -1) {
			this.splice(index, 1);
			updated = true;
			index = checkTokenAndGetIndex(this, token);
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.toggle = function (token, force) {
	token += "";

	var
		  result = this.contains(token)
		, method = result ?
			force !== true && "remove"
		:
			force !== false && "add"
	;

	if (method) {
		this[method](token);
	}

	if (force === true || force === false) {
		return force;
	} else {
		return !result;
	}
};
classListProto.toString = function () {
	return this.join(" ");
};

if (objCtr.defineProperty) {
	var classListPropDesc = {
		  get: classListGetter
		, enumerable: true
		, configurable: true
	};
	try {
		objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
	} catch (ex) { // IE 8 doesn't support enumerable:true
		if (ex.number === -0x7FF5EC54) {
			classListPropDesc.enumerable = false;
			objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
		}
	}
} else if (objCtr[protoProp].__defineGetter__) {
	elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

} else {
// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

(function () {
	"use strict";

	var testElement = document.createElement("_");

	testElement.classList.add("c1", "c2");

	// Polyfill for IE 10/11 and Firefox <26, where classList.add and
	// classList.remove exist but support only one argument at a time.
	if (!testElement.classList.contains("c2")) {
		var createMethod = function(method) {
			var original = DOMTokenList.prototype[method];

			DOMTokenList.prototype[method] = function(token) {
				var i, len = arguments.length;

				for (i = 0; i < len; i++) {
					token = arguments[i];
					original.call(this, token);
				}
			};
		};
		createMethod('add');
		createMethod('remove');
	}

	testElement.classList.toggle("c3", false);

	// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
	// support the second argument.
	if (testElement.classList.contains("c3")) {
		var _toggle = DOMTokenList.prototype.toggle;

		DOMTokenList.prototype.toggle = function(token, force) {
			if (1 in arguments && !this.contains(token) === !force) {
				return force;
			} else {
				return _toggle.call(this, token);
			}
		};

	}

	testElement = null;
}());

}

}


},{}],10:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],11:[function(require,module,exports){
(function (Buffer){
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})

},{"../../is-buffer/index.js":30}],12:[function(require,module,exports){
//     create-error.js 0.3.1
//     (c) 2013 Tim Griesser
//     This source may be freely distributed under the MIT license.
(function(factory) {

"use strict";

// A simple utility for subclassing the "Error"
// object in multiple environments, while maintaining
// relevant stack traces, messages, and prototypes.
factory(function() {

var toString = Object.prototype.toString;

// Creates an new error type with a "name",
// and any additional properties that should be set
// on the error instance.
return function() {
  var args = new Array(arguments.length);
  for (var i = 0; i < args.length; ++i) {
    args[i] = arguments[i];
  }
  var name       = getName(args);
  var target     = getTarget(args);
  var properties = getProps(args);
  function ErrorCtor(message, obj) {
    attachProps(this, properties);
    attachProps(this, obj);
    this.message = (message || this.message);
    if (message instanceof Error) {
      this.message = message.message;
      this.stack = message.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  function Err() { this.constructor = ErrorCtor; }
  Err.prototype = target['prototype'];
  ErrorCtor.prototype = new Err();
  ErrorCtor.prototype.name = ('' + name) || 'CustomError';
  return ErrorCtor;
};

// Just a few helpers to clean up the function above
// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
function getName(args) {
  if (args.length === 0) return '';
  return isError(args[0]) ? (args[1] || '') : args[0];
}
function getTarget(args) {
  if (args.length === 0) return Error;
  return isError(args[0]) ? args[0] : Error;
}
function getProps(args) {
  if (args.length === 0) return null;
  return isError(args[0]) ? args[2] : args[1];
}
function inheritedKeys(obj) {
  var ret = [];
  for (var key in obj) {
    ret.push(key);
  }
  return ret;
}

// Right now we're just assuming that a function in the first argument is an error.
function isError(obj) {
  return (typeof obj === "function");
}

// We don't need the full underscore check here, since it should either be
// an object-literal, or nothing at all.
function isObject(obj) {
  return (obj && typeof obj === "object" && toString.call(obj) === "[object Object]");
}

// Used to attach attributes to the error object in the constructor.
function attachProps(context, target) {
  if (isObject(target)) {
    var keys = inheritedKeys(target);
    for (var i = 0, l = keys.length; i < l; ++i) {
      context[keys[i]] = clone(target[keys[i]]);
    }
  }
}

// Don't need the full-out "clone" mechanism here, since if you're
// trying to set things other than empty arrays/objects on your
// sub-classed `Error` object, you're probably doing it wrong.
function clone(target) {
  if (target == null || typeof target !== "object") return target;
  var cloned = target.constructor ? target.constructor() : Object.create(null);
  for (var attr in target) {
    if (target.hasOwnProperty(attr)) {
      cloned[attr] = target[attr];
    }
  }
  return cloned;
}

});

// Boilerplate UMD definition block...
})(function(createErrorLib) {
  if (typeof define === "function" && define.amd) {
    define(createErrorLib);
  } else if (typeof exports === 'object') {
    module.exports = createErrorLib();
  } else {
    var root = this;
    var lastcreateError = root.createError;
    var createError = root.createError = createErrorLib();
    createError.noConflict = function() {
      root.createError = lastcreateError;
      return createError;
    };
  }
});

},{}],13:[function(require,module,exports){
module.exports = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
    }
};

},{}],14:[function(require,module,exports){
var util         = require('util'),
    events       = require('events'),
    EventEmitter = events.EventEmitter

module.exports = function() {

  var Despot = function() {

    if (arguments.callee._singletonInstance) {
      return arguments.callee._singletonInstance
    }

    arguments.callee._singletonInstance = this
    EventEmitter.call(this)
  }

  util.inherits(Despot, EventEmitter)

  return new Despot()
}()

},{"events":18,"util":69}],15:[function(require,module,exports){
(function (process,Buffer){
var stream = require('readable-stream')
var eos = require('end-of-stream')
var inherits = require('inherits')
var shift = require('stream-shift')

var SIGNAL_FLUSH = new Buffer([0])

var onuncork = function(self, fn) {
  if (self._corked) self.once('uncork', fn)
  else fn()
}

var destroyer = function(self, end) {
  return function(err) {
    if (err) self.destroy(err.message === 'premature close' ? null : err)
    else if (end && !self._ended) self.end()
  }
}

var end = function(ws, fn) {
  if (!ws) return fn()
  if (ws._writableState && ws._writableState.finished) return fn()
  if (ws._writableState) return ws.end(fn)
  ws.end()
  fn()
}

var toStreams2 = function(rs) {
  return new (stream.Readable)({objectMode:true, highWaterMark:16}).wrap(rs)
}

var Duplexify = function(writable, readable, opts) {
  if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts)
  stream.Duplex.call(this, opts)

  this._writable = null
  this._readable = null
  this._readable2 = null

  this._forwardDestroy = !opts || opts.destroy !== false
  this._forwardEnd = !opts || opts.end !== false
  this._corked = 1 // start corked
  this._ondrain = null
  this._drained = false
  this._forwarding = false
  this._unwrite = null
  this._unread = null
  this._ended = false

  this.destroyed = false

  if (writable) this.setWritable(writable)
  if (readable) this.setReadable(readable)
}

inherits(Duplexify, stream.Duplex)

Duplexify.obj = function(writable, readable, opts) {
  if (!opts) opts = {}
  opts.objectMode = true
  opts.highWaterMark = 16
  return new Duplexify(writable, readable, opts)
}

Duplexify.prototype.cork = function() {
  if (++this._corked === 1) this.emit('cork')
}

Duplexify.prototype.uncork = function() {
  if (this._corked && --this._corked === 0) this.emit('uncork')
}

Duplexify.prototype.setWritable = function(writable) {
  if (this._unwrite) this._unwrite()

  if (this.destroyed) {
    if (writable && writable.destroy) writable.destroy()
    return
  }

  if (writable === null || writable === false) {
    this.end()
    return
  }

  var self = this
  var unend = eos(writable, {writable:true, readable:false}, destroyer(this, this._forwardEnd))

  var ondrain = function() {
    var ondrain = self._ondrain
    self._ondrain = null
    if (ondrain) ondrain()
  }

  var clear = function() {
    self._writable.removeListener('drain', ondrain)
    unend()
  }

  if (this._unwrite) process.nextTick(ondrain) // force a drain on stream reset to avoid livelocks

  this._writable = writable
  this._writable.on('drain', ondrain)
  this._unwrite = clear

  this.uncork() // always uncork setWritable
}

Duplexify.prototype.setReadable = function(readable) {
  if (this._unread) this._unread()

  if (this.destroyed) {
    if (readable && readable.destroy) readable.destroy()
    return
  }

  if (readable === null || readable === false) {
    this.push(null)
    this.resume()
    return
  }

  var self = this
  var unend = eos(readable, {writable:false, readable:true}, destroyer(this))

  var onreadable = function() {
    self._forward()
  }

  var onend = function() {
    self.push(null)
  }

  var clear = function() {
    self._readable2.removeListener('readable', onreadable)
    self._readable2.removeListener('end', onend)
    unend()
  }

  this._drained = true
  this._readable = readable
  this._readable2 = readable._readableState ? readable : toStreams2(readable)
  this._readable2.on('readable', onreadable)
  this._readable2.on('end', onend)
  this._unread = clear

  this._forward()
}

Duplexify.prototype._read = function() {
  this._drained = true
  this._forward()
}

Duplexify.prototype._forward = function() {
  if (this._forwarding || !this._readable2 || !this._drained) return
  this._forwarding = true

  var data

  while (this._drained && (data = shift(this._readable2)) !== null) {
    if (this.destroyed) continue
    this._drained = this.push(data)
  }

  this._forwarding = false
}

Duplexify.prototype.destroy = function(err) {
  if (this.destroyed) return
  this.destroyed = true

  var self = this
  process.nextTick(function() {
    self._destroy(err)
  })
}

Duplexify.prototype._destroy = function(err) {
  if (err) {
    var ondrain = this._ondrain
    this._ondrain = null
    if (ondrain) ondrain(err)
    else this.emit('error', err)
  }

  if (this._forwardDestroy) {
    if (this._readable && this._readable.destroy) this._readable.destroy()
    if (this._writable && this._writable.destroy) this._writable.destroy()
  }

  this.emit('close')
}

Duplexify.prototype._write = function(data, enc, cb) {
  if (this.destroyed) return cb()
  if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb))
  if (data === SIGNAL_FLUSH) return this._finish(cb)
  if (!this._writable) return cb()

  if (this._writable.write(data) === false) this._ondrain = cb
  else cb()
}


Duplexify.prototype._finish = function(cb) {
  var self = this
  this.emit('preend')
  onuncork(this, function() {
    end(self._forwardEnd && self._writable, function() {
      // haxx to not emit prefinish twice
      if (self._writableState.prefinished === false) self._writableState.prefinished = true
      self.emit('prefinish')
      onuncork(self, cb)
    })
  })
}

Duplexify.prototype.end = function(data, enc, cb) {
  if (typeof data === 'function') return this.end(null, null, data)
  if (typeof enc === 'function') return this.end(data, null, enc)
  this._ended = true
  if (data) this.write(data)
  if (!this._writableState.ending) this.write(SIGNAL_FLUSH)
  return stream.Writable.prototype.end.call(this, cb)
}

module.exports = Duplexify

}).call(this,require('_process'),require("buffer").Buffer)

},{"_process":43,"buffer":6,"end-of-stream":16,"inherits":26,"readable-stream":50,"stream-shift":55}],16:[function(require,module,exports){
var once = require('once');

var noop = function() {};

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback();
	};

	var onend = function() {
		readable = false;
		if (!writable) callback();
	};

	var onclose = function() {
		if (readable && !(rs && rs.ended)) return callback(new Error('premature close'));
		if (writable && !(ws && ws.ended)) return callback(new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', callback);
	stream.on('close', onclose);

	return function() {
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('end', onend);
		stream.removeListener('error', callback);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;
},{"once":39}],17:[function(require,module,exports){
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2015 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

// Add semicolon to prevent IIFE from being passed as argument to concatenated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
    'use strict';

    /* global define, exports, module */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {
    /**
     * Brings an environment as close to ECMAScript 5 compliance
     * as is possible with the facilities of erstwhile engines.
     *
     * Annotated ES5: http://es5.github.com/ (specific links below)
     * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
     * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
     */

    // Shortcut to an often accessed properties, in order to avoid multiple
    // dereference that costs universally. This also holds a reference to known-good
    // functions.
    var $Array = Array;
    var ArrayPrototype = $Array.prototype;
    var $Object = Object;
    var ObjectPrototype = $Object.prototype;
    var $Function = Function;
    var FunctionPrototype = $Function.prototype;
    var $String = String;
    var StringPrototype = $String.prototype;
    var $Number = Number;
    var NumberPrototype = $Number.prototype;
    var array_slice = ArrayPrototype.slice;
    var array_splice = ArrayPrototype.splice;
    var array_push = ArrayPrototype.push;
    var array_unshift = ArrayPrototype.unshift;
    var array_concat = ArrayPrototype.concat;
    var array_join = ArrayPrototype.join;
    var call = FunctionPrototype.call;
    var apply = FunctionPrototype.apply;
    var max = Math.max;
    var min = Math.min;

    // Having a toString local variable name breaks in Opera so use to_string.
    var to_string = ObjectPrototype.toString;

    /* global Symbol */
    /* eslint-disable one-var-declaration-per-line, no-redeclare, max-statements-per-line */
    var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
    var isCallable; /* inlined from https://npmjs.com/is-callable */ var fnToStr = Function.prototype.toString, constructorRegex = /^\s*class /, isES6ClassFn = function isES6ClassFn(value) { try { var fnStr = fnToStr.call(value); var singleStripped = fnStr.replace(/\/\/.*\n/g, ''); var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, ''); var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' '); return constructorRegex.test(spaceStripped); } catch (e) { return false; /* not a function */ } }, tryFunctionObject = function tryFunctionObject(value) { try { if (isES6ClassFn(value)) { return false; } fnToStr.call(value); return true; } catch (e) { return false; } }, fnClass = '[object Function]', genClass = '[object GeneratorFunction]', isCallable = function isCallable(value) { if (!value) { return false; } if (typeof value !== 'function' && typeof value !== 'object') { return false; } if (hasToStringTag) { return tryFunctionObject(value); } if (isES6ClassFn(value)) { return false; } var strClass = to_string.call(value); return strClass === fnClass || strClass === genClass; };

    var isRegex; /* inlined from https://npmjs.com/is-regex */ var regexExec = RegExp.prototype.exec, tryRegexExec = function tryRegexExec(value) { try { regexExec.call(value); return true; } catch (e) { return false; } }, regexClass = '[object RegExp]'; isRegex = function isRegex(value) { if (typeof value !== 'object') { return false; } return hasToStringTag ? tryRegexExec(value) : to_string.call(value) === regexClass; };
    var isString; /* inlined from https://npmjs.com/is-string */ var strValue = String.prototype.valueOf, tryStringObject = function tryStringObject(value) { try { strValue.call(value); return true; } catch (e) { return false; } }, stringClass = '[object String]'; isString = function isString(value) { if (typeof value === 'string') { return true; } if (typeof value !== 'object') { return false; } return hasToStringTag ? tryStringObject(value) : to_string.call(value) === stringClass; };
    /* eslint-enable one-var-declaration-per-line, no-redeclare, max-statements-per-line */

    /* inlined from http://npmjs.com/define-properties */
    var supportsDescriptors = $Object.defineProperty && (function () {
        try {
            var obj = {};
            $Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
            for (var _ in obj) { // jscs:ignore disallowUnusedVariables
                return false;
            }
            return obj.x === obj;
        } catch (e) { /* this is ES3 */
            return false;
        }
    }());
    var defineProperties = (function (has) {
        // Define configurable, writable, and non-enumerable props
        // if they don't exist.
        var defineProperty;
        if (supportsDescriptors) {
            defineProperty = function (object, name, method, forceAssign) {
                if (!forceAssign && (name in object)) {
                    return;
                }
                $Object.defineProperty(object, name, {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: method
                });
            };
        } else {
            defineProperty = function (object, name, method, forceAssign) {
                if (!forceAssign && (name in object)) {
                    return;
                }
                object[name] = method;
            };
        }
        return function defineProperties(object, map, forceAssign) {
            for (var name in map) {
                if (has.call(map, name)) {
                    defineProperty(object, name, map[name], forceAssign);
                }
            }
        };
    }(ObjectPrototype.hasOwnProperty));

    //
    // Util
    // ======
    //

    /* replaceable with https://npmjs.com/package/es-abstract /helpers/isPrimitive */
    var isPrimitive = function isPrimitive(input) {
        var type = typeof input;
        return input === null || (type !== 'object' && type !== 'function');
    };

    var isActualNaN = $Number.isNaN || function isActualNaN(x) {
        return x !== x;
    };

    var ES = {
        // ES5 9.4
        // http://es5.github.com/#x9.4
        // http://jsperf.com/to-integer
        /* replaceable with https://npmjs.com/package/es-abstract ES5.ToInteger */
        ToInteger: function ToInteger(num) {
            var n = +num;
            if (isActualNaN(n)) {
                n = 0;
            } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
            return n;
        },

        /* replaceable with https://npmjs.com/package/es-abstract ES5.ToPrimitive */
        ToPrimitive: function ToPrimitive(input) {
            var val, valueOf, toStr;
            if (isPrimitive(input)) {
                return input;
            }
            valueOf = input.valueOf;
            if (isCallable(valueOf)) {
                val = valueOf.call(input);
                if (isPrimitive(val)) {
                    return val;
                }
            }
            toStr = input.toString;
            if (isCallable(toStr)) {
                val = toStr.call(input);
                if (isPrimitive(val)) {
                    return val;
                }
            }
            throw new TypeError();
        },

        // ES5 9.9
        // http://es5.github.com/#x9.9
        /* replaceable with https://npmjs.com/package/es-abstract ES5.ToObject */
        ToObject: function (o) {
            if (o == null) { // this matches both null and undefined
                throw new TypeError("can't convert " + o + ' to object');
            }
            return $Object(o);
        },

        /* replaceable with https://npmjs.com/package/es-abstract ES5.ToUint32 */
        ToUint32: function ToUint32(x) {
            return x >>> 0;
        }
    };

    //
    // Function
    // ========
    //

    // ES-5 15.3.4.5
    // http://es5.github.com/#x15.3.4.5

    var Empty = function Empty() {};

    defineProperties(FunctionPrototype, {
        bind: function bind(that) { // .length is 1
            // 1. Let Target be the this value.
            var target = this;
            // 2. If IsCallable(Target) is false, throw a TypeError exception.
            if (!isCallable(target)) {
                throw new TypeError('Function.prototype.bind called on incompatible ' + target);
            }
            // 3. Let A be a new (possibly empty) internal list of all of the
            //   argument values provided after thisArg (arg1, arg2 etc), in order.
            // XXX slicedArgs will stand in for "A" if used
            var args = array_slice.call(arguments, 1); // for normal call
            // 4. Let F be a new native ECMAScript object.
            // 11. Set the [[Prototype]] internal property of F to the standard
            //   built-in Function prototype object as specified in 15.3.3.1.
            // 12. Set the [[Call]] internal property of F as described in
            //   15.3.4.5.1.
            // 13. Set the [[Construct]] internal property of F as described in
            //   15.3.4.5.2.
            // 14. Set the [[HasInstance]] internal property of F as described in
            //   15.3.4.5.3.
            var bound;
            var binder = function () {

                if (this instanceof bound) {
                    // 15.3.4.5.2 [[Construct]]
                    // When the [[Construct]] internal method of a function object,
                    // F that was created using the bind function is called with a
                    // list of arguments ExtraArgs, the following steps are taken:
                    // 1. Let target be the value of F's [[TargetFunction]]
                    //   internal property.
                    // 2. If target has no [[Construct]] internal method, a
                    //   TypeError exception is thrown.
                    // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                    //   property.
                    // 4. Let args be a new list containing the same values as the
                    //   list boundArgs in the same order followed by the same
                    //   values as the list ExtraArgs in the same order.
                    // 5. Return the result of calling the [[Construct]] internal
                    //   method of target providing args as the arguments.

                    var result = apply.call(
                        target,
                        this,
                        array_concat.call(args, array_slice.call(arguments))
                    );
                    if ($Object(result) === result) {
                        return result;
                    }
                    return this;

                } else {
                    // 15.3.4.5.1 [[Call]]
                    // When the [[Call]] internal method of a function object, F,
                    // which was created using the bind function is called with a
                    // this value and a list of arguments ExtraArgs, the following
                    // steps are taken:
                    // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                    //   property.
                    // 2. Let boundThis be the value of F's [[BoundThis]] internal
                    //   property.
                    // 3. Let target be the value of F's [[TargetFunction]] internal
                    //   property.
                    // 4. Let args be a new list containing the same values as the
                    //   list boundArgs in the same order followed by the same
                    //   values as the list ExtraArgs in the same order.
                    // 5. Return the result of calling the [[Call]] internal method
                    //   of target providing boundThis as the this value and
                    //   providing args as the arguments.

                    // equiv: target.call(this, ...boundArgs, ...args)
                    return apply.call(
                        target,
                        that,
                        array_concat.call(args, array_slice.call(arguments))
                    );

                }

            };

            // 15. If the [[Class]] internal property of Target is "Function", then
            //     a. Let L be the length property of Target minus the length of A.
            //     b. Set the length own property of F to either 0 or L, whichever is
            //       larger.
            // 16. Else set the length own property of F to 0.

            var boundLength = max(0, target.length - args.length);

            // 17. Set the attributes of the length own property of F to the values
            //   specified in 15.3.5.1.
            var boundArgs = [];
            for (var i = 0; i < boundLength; i++) {
                array_push.call(boundArgs, '$' + i);
            }

            // XXX Build a dynamic function with desired amount of arguments is the only
            // way to set the length property of a function.
            // In environments where Content Security Policies enabled (Chrome extensions,
            // for ex.) all use of eval or Function costructor throws an exception.
            // However in all of these environments Function.prototype.bind exists
            // and so this code will never be executed.
            bound = $Function('binder', 'return function (' + array_join.call(boundArgs, ',') + '){ return binder.apply(this, arguments); }')(binder);

            if (target.prototype) {
                Empty.prototype = target.prototype;
                bound.prototype = new Empty();
                // Clean up dangling references.
                Empty.prototype = null;
            }

            // TODO
            // 18. Set the [[Extensible]] internal property of F to true.

            // TODO
            // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
            // 20. Call the [[DefineOwnProperty]] internal method of F with
            //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
            //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
            //   false.
            // 21. Call the [[DefineOwnProperty]] internal method of F with
            //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
            //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
            //   and false.

            // TODO
            // NOTE Function objects created using Function.prototype.bind do not
            // have a prototype property or the [[Code]], [[FormalParameters]], and
            // [[Scope]] internal properties.
            // XXX can't delete prototype in pure-js.

            // 22. Return F.
            return bound;
        }
    });

    // _Please note: Shortcuts are defined after `Function.prototype.bind` as we
    // use it in defining shortcuts.
    var owns = call.bind(ObjectPrototype.hasOwnProperty);
    var toStr = call.bind(ObjectPrototype.toString);
    var arraySlice = call.bind(array_slice);
    var arraySliceApply = apply.bind(array_slice);
    var strSlice = call.bind(StringPrototype.slice);
    var strSplit = call.bind(StringPrototype.split);
    var strIndexOf = call.bind(StringPrototype.indexOf);
    var pushCall = call.bind(array_push);
    var isEnum = call.bind(ObjectPrototype.propertyIsEnumerable);
    var arraySort = call.bind(ArrayPrototype.sort);

    //
    // Array
    // =====
    //

    var isArray = $Array.isArray || function isArray(obj) {
        return toStr(obj) === '[object Array]';
    };

    // ES5 15.4.4.12
    // http://es5.github.com/#x15.4.4.13
    // Return len+argCount.
    // [bugfix, ielt8]
    // IE < 8 bug: [].unshift(0) === undefined but should be "1"
    var hasUnshiftReturnValueBug = [].unshift(0) !== 1;
    defineProperties(ArrayPrototype, {
        unshift: function () {
            array_unshift.apply(this, arguments);
            return this.length;
        }
    }, hasUnshiftReturnValueBug);

    // ES5 15.4.3.2
    // http://es5.github.com/#x15.4.3.2
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
    defineProperties($Array, { isArray: isArray });

    // The IsCallable() check in the Array functions
    // has been replaced with a strict check on the
    // internal class of the object to trap cases where
    // the provided function was actually a regular
    // expression literal, which in V8 and
    // JavaScriptCore is a typeof "function".  Only in
    // V8 are regular expression literals permitted as
    // reduce parameters, so it is desirable in the
    // general case for the shim to match the more
    // strict and common behavior of rejecting regular
    // expressions.

    // ES5 15.4.4.18
    // http://es5.github.com/#x15.4.4.18
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

    // Check failure of by-index access of string characters (IE < 9)
    // and failure of `0 in boxedString` (Rhino)
    var boxedString = $Object('a');
    var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

    var properlyBoxesContext = function properlyBoxed(method) {
        // Check node 0.6.21 bug where third parameter is not boxed
        var properlyBoxesNonStrict = true;
        var properlyBoxesStrict = true;
        var threwException = false;
        if (method) {
            try {
                method.call('foo', function (_, __, context) {
                    if (typeof context !== 'object') {
                        properlyBoxesNonStrict = false;
                    }
                });

                method.call([1], function () {
                    'use strict';

                    properlyBoxesStrict = typeof this === 'string';
                }, 'x');
            } catch (e) {
                threwException = true;
            }
        }
        return !!method && !threwException && properlyBoxesNonStrict && properlyBoxesStrict;
    };

    defineProperties(ArrayPrototype, {
        forEach: function forEach(callbackfn/*, thisArg*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var i = -1;
            var length = ES.ToUint32(self.length);
            var T;
            if (arguments.length > 1) {
                T = arguments[1];
            }

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.forEach callback must be a function');
            }

            while (++i < length) {
                if (i in self) {
                    // Invoke the callback function with call, passing arguments:
                    // context, property value, property key, thisArg object
                    if (typeof T === 'undefined') {
                        callbackfn(self[i], i, object);
                    } else {
                        callbackfn.call(T, self[i], i, object);
                    }
                }
            }
        }
    }, !properlyBoxesContext(ArrayPrototype.forEach));

    // ES5 15.4.4.19
    // http://es5.github.com/#x15.4.4.19
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
    defineProperties(ArrayPrototype, {
        map: function map(callbackfn/*, thisArg*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);
            var result = $Array(length);
            var T;
            if (arguments.length > 1) {
                T = arguments[1];
            }

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.map callback must be a function');
            }

            for (var i = 0; i < length; i++) {
                if (i in self) {
                    if (typeof T === 'undefined') {
                        result[i] = callbackfn(self[i], i, object);
                    } else {
                        result[i] = callbackfn.call(T, self[i], i, object);
                    }
                }
            }
            return result;
        }
    }, !properlyBoxesContext(ArrayPrototype.map));

    // ES5 15.4.4.20
    // http://es5.github.com/#x15.4.4.20
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
    defineProperties(ArrayPrototype, {
        filter: function filter(callbackfn/*, thisArg*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);
            var result = [];
            var value;
            var T;
            if (arguments.length > 1) {
                T = arguments[1];
            }

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.filter callback must be a function');
            }

            for (var i = 0; i < length; i++) {
                if (i in self) {
                    value = self[i];
                    if (typeof T === 'undefined' ? callbackfn(value, i, object) : callbackfn.call(T, value, i, object)) {
                        pushCall(result, value);
                    }
                }
            }
            return result;
        }
    }, !properlyBoxesContext(ArrayPrototype.filter));

    // ES5 15.4.4.16
    // http://es5.github.com/#x15.4.4.16
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
    defineProperties(ArrayPrototype, {
        every: function every(callbackfn/*, thisArg*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);
            var T;
            if (arguments.length > 1) {
                T = arguments[1];
            }

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.every callback must be a function');
            }

            for (var i = 0; i < length; i++) {
                if (i in self && !(typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                    return false;
                }
            }
            return true;
        }
    }, !properlyBoxesContext(ArrayPrototype.every));

    // ES5 15.4.4.17
    // http://es5.github.com/#x15.4.4.17
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
    defineProperties(ArrayPrototype, {
        some: function some(callbackfn/*, thisArg */) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);
            var T;
            if (arguments.length > 1) {
                T = arguments[1];
            }

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.some callback must be a function');
            }

            for (var i = 0; i < length; i++) {
                if (i in self && (typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                    return true;
                }
            }
            return false;
        }
    }, !properlyBoxesContext(ArrayPrototype.some));

    // ES5 15.4.4.21
    // http://es5.github.com/#x15.4.4.21
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
    var reduceCoercesToObject = false;
    if (ArrayPrototype.reduce) {
        reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) {
            return list;
        }) === 'object';
    }
    defineProperties(ArrayPrototype, {
        reduce: function reduce(callbackfn/*, initialValue*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.reduce callback must be a function');
            }

            // no value to return if no initial value and an empty array
            if (length === 0 && arguments.length === 1) {
                throw new TypeError('reduce of empty array with no initial value');
            }

            var i = 0;
            var result;
            if (arguments.length >= 2) {
                result = arguments[1];
            } else {
                do {
                    if (i in self) {
                        result = self[i++];
                        break;
                    }

                    // if array contains no values, no initial value to return
                    if (++i >= length) {
                        throw new TypeError('reduce of empty array with no initial value');
                    }
                } while (true);
            }

            for (; i < length; i++) {
                if (i in self) {
                    result = callbackfn(result, self[i], i, object);
                }
            }

            return result;
        }
    }, !reduceCoercesToObject);

    // ES5 15.4.4.22
    // http://es5.github.com/#x15.4.4.22
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
    var reduceRightCoercesToObject = false;
    if (ArrayPrototype.reduceRight) {
        reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) {
            return list;
        }) === 'object';
    }
    defineProperties(ArrayPrototype, {
        reduceRight: function reduceRight(callbackfn/*, initial*/) {
            var object = ES.ToObject(this);
            var self = splitString && isString(this) ? strSplit(this, '') : object;
            var length = ES.ToUint32(self.length);

            // If no callback function or if callback is not a callable function
            if (!isCallable(callbackfn)) {
                throw new TypeError('Array.prototype.reduceRight callback must be a function');
            }

            // no value to return if no initial value, empty array
            if (length === 0 && arguments.length === 1) {
                throw new TypeError('reduceRight of empty array with no initial value');
            }

            var result;
            var i = length - 1;
            if (arguments.length >= 2) {
                result = arguments[1];
            } else {
                do {
                    if (i in self) {
                        result = self[i--];
                        break;
                    }

                    // if array contains no values, no initial value to return
                    if (--i < 0) {
                        throw new TypeError('reduceRight of empty array with no initial value');
                    }
                } while (true);
            }

            if (i < 0) {
                return result;
            }

            do {
                if (i in self) {
                    result = callbackfn(result, self[i], i, object);
                }
            } while (i--);

            return result;
        }
    }, !reduceRightCoercesToObject);

    // ES5 15.4.4.14
    // http://es5.github.com/#x15.4.4.14
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
    var hasFirefox2IndexOfBug = ArrayPrototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
    defineProperties(ArrayPrototype, {
        indexOf: function indexOf(searchElement/*, fromIndex */) {
            var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
            var length = ES.ToUint32(self.length);

            if (length === 0) {
                return -1;
            }

            var i = 0;
            if (arguments.length > 1) {
                i = ES.ToInteger(arguments[1]);
            }

            // handle negative indices
            i = i >= 0 ? i : max(0, length + i);
            for (; i < length; i++) {
                if (i in self && self[i] === searchElement) {
                    return i;
                }
            }
            return -1;
        }
    }, hasFirefox2IndexOfBug);

    // ES5 15.4.4.15
    // http://es5.github.com/#x15.4.4.15
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
    var hasFirefox2LastIndexOfBug = ArrayPrototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
    defineProperties(ArrayPrototype, {
        lastIndexOf: function lastIndexOf(searchElement/*, fromIndex */) {
            var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
            var length = ES.ToUint32(self.length);

            if (length === 0) {
                return -1;
            }
            var i = length - 1;
            if (arguments.length > 1) {
                i = min(i, ES.ToInteger(arguments[1]));
            }
            // handle negative indices
            i = i >= 0 ? i : length - Math.abs(i);
            for (; i >= 0; i--) {
                if (i in self && searchElement === self[i]) {
                    return i;
                }
            }
            return -1;
        }
    }, hasFirefox2LastIndexOfBug);

    // ES5 15.4.4.12
    // http://es5.github.com/#x15.4.4.12
    var spliceNoopReturnsEmptyArray = (function () {
        var a = [1, 2];
        var result = a.splice();
        return a.length === 2 && isArray(result) && result.length === 0;
    }());
    defineProperties(ArrayPrototype, {
        // Safari 5.0 bug where .splice() returns undefined
        splice: function splice(start, deleteCount) {
            if (arguments.length === 0) {
                return [];
            } else {
                return array_splice.apply(this, arguments);
            }
        }
    }, !spliceNoopReturnsEmptyArray);

    var spliceWorksWithEmptyObject = (function () {
        var obj = {};
        ArrayPrototype.splice.call(obj, 0, 0, 1);
        return obj.length === 1;
    }());
    defineProperties(ArrayPrototype, {
        splice: function splice(start, deleteCount) {
            if (arguments.length === 0) {
                return [];
            }
            var args = arguments;
            this.length = max(ES.ToInteger(this.length), 0);
            if (arguments.length > 0 && typeof deleteCount !== 'number') {
                args = arraySlice(arguments);
                if (args.length < 2) {
                    pushCall(args, this.length - start);
                } else {
                    args[1] = ES.ToInteger(deleteCount);
                }
            }
            return array_splice.apply(this, args);
        }
    }, !spliceWorksWithEmptyObject);
    var spliceWorksWithLargeSparseArrays = (function () {
        // Per https://github.com/es-shims/es5-shim/issues/295
        // Safari 7/8 breaks with sparse arrays of size 1e5 or greater
        var arr = new $Array(1e5);
        // note: the index MUST be 8 or larger or the test will false pass
        arr[8] = 'x';
        arr.splice(1, 1);
        // note: this test must be defined *after* the indexOf shim
        // per https://github.com/es-shims/es5-shim/issues/313
        return arr.indexOf('x') === 7;
    }());
    var spliceWorksWithSmallSparseArrays = (function () {
        // Per https://github.com/es-shims/es5-shim/issues/295
        // Opera 12.15 breaks on this, no idea why.
        var n = 256;
        var arr = [];
        arr[n] = 'a';
        arr.splice(n + 1, 0, 'b');
        return arr[n] === 'a';
    }());
    defineProperties(ArrayPrototype, {
        splice: function splice(start, deleteCount) {
            var O = ES.ToObject(this);
            var A = [];
            var len = ES.ToUint32(O.length);
            var relativeStart = ES.ToInteger(start);
            var actualStart = relativeStart < 0 ? max((len + relativeStart), 0) : min(relativeStart, len);
            var actualDeleteCount = min(max(ES.ToInteger(deleteCount), 0), len - actualStart);

            var k = 0;
            var from;
            while (k < actualDeleteCount) {
                from = $String(actualStart + k);
                if (owns(O, from)) {
                    A[k] = O[from];
                }
                k += 1;
            }

            var items = arraySlice(arguments, 2);
            var itemCount = items.length;
            var to;
            if (itemCount < actualDeleteCount) {
                k = actualStart;
                var maxK = len - actualDeleteCount;
                while (k < maxK) {
                    from = $String(k + actualDeleteCount);
                    to = $String(k + itemCount);
                    if (owns(O, from)) {
                        O[to] = O[from];
                    } else {
                        delete O[to];
                    }
                    k += 1;
                }
                k = len;
                var minK = len - actualDeleteCount + itemCount;
                while (k > minK) {
                    delete O[k - 1];
                    k -= 1;
                }
            } else if (itemCount > actualDeleteCount) {
                k = len - actualDeleteCount;
                while (k > actualStart) {
                    from = $String(k + actualDeleteCount - 1);
                    to = $String(k + itemCount - 1);
                    if (owns(O, from)) {
                        O[to] = O[from];
                    } else {
                        delete O[to];
                    }
                    k -= 1;
                }
            }
            k = actualStart;
            for (var i = 0; i < items.length; ++i) {
                O[k] = items[i];
                k += 1;
            }
            O.length = len - actualDeleteCount + itemCount;

            return A;
        }
    }, !spliceWorksWithLargeSparseArrays || !spliceWorksWithSmallSparseArrays);

    var originalJoin = ArrayPrototype.join;
    var hasStringJoinBug;
    try {
        hasStringJoinBug = Array.prototype.join.call('123', ',') !== '1,2,3';
    } catch (e) {
        hasStringJoinBug = true;
    }
    if (hasStringJoinBug) {
        defineProperties(ArrayPrototype, {
            join: function join(separator) {
                var sep = typeof separator === 'undefined' ? ',' : separator;
                return originalJoin.call(isString(this) ? strSplit(this, '') : this, sep);
            }
        }, hasStringJoinBug);
    }

    var hasJoinUndefinedBug = [1, 2].join(undefined) !== '1,2';
    if (hasJoinUndefinedBug) {
        defineProperties(ArrayPrototype, {
            join: function join(separator) {
                var sep = typeof separator === 'undefined' ? ',' : separator;
                return originalJoin.call(this, sep);
            }
        }, hasJoinUndefinedBug);
    }

    var pushShim = function push(item) {
        var O = ES.ToObject(this);
        var n = ES.ToUint32(O.length);
        var i = 0;
        while (i < arguments.length) {
            O[n + i] = arguments[i];
            i += 1;
        }
        O.length = n + i;
        return n + i;
    };

    var pushIsNotGeneric = (function () {
        var obj = {};
        var result = Array.prototype.push.call(obj, undefined);
        return result !== 1 || obj.length !== 1 || typeof obj[0] !== 'undefined' || !owns(obj, 0);
    }());
    defineProperties(ArrayPrototype, {
        push: function push(item) {
            if (isArray(this)) {
                return array_push.apply(this, arguments);
            }
            return pushShim.apply(this, arguments);
        }
    }, pushIsNotGeneric);

    // This fixes a very weird bug in Opera 10.6 when pushing `undefined
    var pushUndefinedIsWeird = (function () {
        var arr = [];
        var result = arr.push(undefined);
        return result !== 1 || arr.length !== 1 || typeof arr[0] !== 'undefined' || !owns(arr, 0);
    }());
    defineProperties(ArrayPrototype, { push: pushShim }, pushUndefinedIsWeird);

    // ES5 15.2.3.14
    // http://es5.github.io/#x15.4.4.10
    // Fix boxed string bug
    defineProperties(ArrayPrototype, {
        slice: function (start, end) {
            var arr = isString(this) ? strSplit(this, '') : this;
            return arraySliceApply(arr, arguments);
        }
    }, splitString);

    var sortIgnoresNonFunctions = (function () {
        try {
            [1, 2].sort(null);
            [1, 2].sort({});
            return true;
        } catch (e) {}
        return false;
    }());
    var sortThrowsOnRegex = (function () {
        // this is a problem in Firefox 4, in which `typeof /a/ === 'function'`
        try {
            [1, 2].sort(/a/);
            return false;
        } catch (e) {}
        return true;
    }());
    var sortIgnoresUndefined = (function () {
        // applies in IE 8, for one.
        try {
            [1, 2].sort(undefined);
            return true;
        } catch (e) {}
        return false;
    }());
    defineProperties(ArrayPrototype, {
        sort: function sort(compareFn) {
            if (typeof compareFn === 'undefined') {
                return arraySort(this);
            }
            if (!isCallable(compareFn)) {
                throw new TypeError('Array.prototype.sort callback must be a function');
            }
            return arraySort(this, compareFn);
        }
    }, sortIgnoresNonFunctions || !sortIgnoresUndefined || !sortThrowsOnRegex);

    //
    // Object
    // ======
    //

    // ES5 15.2.3.14
    // http://es5.github.com/#x15.2.3.14

    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = !isEnum({ 'toString': null }, 'toString');
    var hasProtoEnumBug = isEnum(function () {}, 'prototype');
    var hasStringEnumBug = !owns('x', '0');
    var equalsConstructorPrototype = function (o) {
        var ctor = o.constructor;
        return ctor && ctor.prototype === o;
    };
    var blacklistedKeys = {
        $window: true,
        $console: true,
        $parent: true,
        $self: true,
        $frame: true,
        $frames: true,
        $frameElement: true,
        $webkitIndexedDB: true,
        $webkitStorageInfo: true,
        $external: true
    };
    var hasAutomationEqualityBug = (function () {
        /* globals window */
        if (typeof window === 'undefined') {
            return false;
        }
        for (var k in window) {
            try {
                if (!blacklistedKeys['$' + k] && owns(window, k) && window[k] !== null && typeof window[k] === 'object') {
                    equalsConstructorPrototype(window[k]);
                }
            } catch (e) {
                return true;
            }
        }
        return false;
    }());
    var equalsConstructorPrototypeIfNotBuggy = function (object) {
        if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
            return equalsConstructorPrototype(object);
        }
        try {
            return equalsConstructorPrototype(object);
        } catch (e) {
            return false;
        }
    };
    var dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
    ];
    var dontEnumsLength = dontEnums.length;

    // taken directly from https://github.com/ljharb/is-arguments/blob/master/index.js
    // can be replaced with require('is-arguments') if we ever use a build process instead
    var isStandardArguments = function isArguments(value) {
        return toStr(value) === '[object Arguments]';
    };
    var isLegacyArguments = function isArguments(value) {
        return value !== null &&
            typeof value === 'object' &&
            typeof value.length === 'number' &&
            value.length >= 0 &&
            !isArray(value) &&
            isCallable(value.callee);
    };
    var isArguments = isStandardArguments(arguments) ? isStandardArguments : isLegacyArguments;

    defineProperties($Object, {
        keys: function keys(object) {
            var isFn = isCallable(object);
            var isArgs = isArguments(object);
            var isObject = object !== null && typeof object === 'object';
            var isStr = isObject && isString(object);

            if (!isObject && !isFn && !isArgs) {
                throw new TypeError('Object.keys called on a non-object');
            }

            var theKeys = [];
            var skipProto = hasProtoEnumBug && isFn;
            if ((isStr && hasStringEnumBug) || isArgs) {
                for (var i = 0; i < object.length; ++i) {
                    pushCall(theKeys, $String(i));
                }
            }

            if (!isArgs) {
                for (var name in object) {
                    if (!(skipProto && name === 'prototype') && owns(object, name)) {
                        pushCall(theKeys, $String(name));
                    }
                }
            }

            if (hasDontEnumBug) {
                var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
                for (var j = 0; j < dontEnumsLength; j++) {
                    var dontEnum = dontEnums[j];
                    if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                        pushCall(theKeys, dontEnum);
                    }
                }
            }
            return theKeys;
        }
    });

    var keysWorksWithArguments = $Object.keys && (function () {
        // Safari 5.0 bug
        return $Object.keys(arguments).length === 2;
    }(1, 2));
    var keysHasArgumentsLengthBug = $Object.keys && (function () {
        var argKeys = $Object.keys(arguments);
        return arguments.length !== 1 || argKeys.length !== 1 || argKeys[0] !== 1;
    }(1));
    var originalKeys = $Object.keys;
    defineProperties($Object, {
        keys: function keys(object) {
            if (isArguments(object)) {
                return originalKeys(arraySlice(object));
            } else {
                return originalKeys(object);
            }
        }
    }, !keysWorksWithArguments || keysHasArgumentsLengthBug);

    //
    // Date
    // ====
    //

    var hasNegativeMonthYearBug = new Date(-3509827329600292).getUTCMonth() !== 0;
    var aNegativeTestDate = new Date(-1509842289600292);
    var aPositiveTestDate = new Date(1449662400000);
    var hasToUTCStringFormatBug = aNegativeTestDate.toUTCString() !== 'Mon, 01 Jan -45875 11:59:59 GMT';
    var hasToDateStringFormatBug;
    var hasToStringFormatBug;
    var timeZoneOffset = aNegativeTestDate.getTimezoneOffset();
    if (timeZoneOffset < -720) {
        hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Tue Jan 02 -45875';
        hasToStringFormatBug = !(/^Thu Dec 10 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
    } else {
        hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Mon Jan 01 -45875';
        hasToStringFormatBug = !(/^Wed Dec 09 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
    }

    var originalGetFullYear = call.bind(Date.prototype.getFullYear);
    var originalGetMonth = call.bind(Date.prototype.getMonth);
    var originalGetDate = call.bind(Date.prototype.getDate);
    var originalGetUTCFullYear = call.bind(Date.prototype.getUTCFullYear);
    var originalGetUTCMonth = call.bind(Date.prototype.getUTCMonth);
    var originalGetUTCDate = call.bind(Date.prototype.getUTCDate);
    var originalGetUTCDay = call.bind(Date.prototype.getUTCDay);
    var originalGetUTCHours = call.bind(Date.prototype.getUTCHours);
    var originalGetUTCMinutes = call.bind(Date.prototype.getUTCMinutes);
    var originalGetUTCSeconds = call.bind(Date.prototype.getUTCSeconds);
    var originalGetUTCMilliseconds = call.bind(Date.prototype.getUTCMilliseconds);
    var dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var daysInMonth = function daysInMonth(month, year) {
        return originalGetDate(new Date(year, month, 0));
    };

    defineProperties(Date.prototype, {
        getFullYear: function getFullYear() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetFullYear(this);
            if (year < 0 && originalGetMonth(this) > 11) {
                return year + 1;
            }
            return year;
        },
        getMonth: function getMonth() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetFullYear(this);
            var month = originalGetMonth(this);
            if (year < 0 && month > 11) {
                return 0;
            }
            return month;
        },
        getDate: function getDate() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetFullYear(this);
            var month = originalGetMonth(this);
            var date = originalGetDate(this);
            if (year < 0 && month > 11) {
                if (month === 12) {
                    return date;
                }
                var days = daysInMonth(0, year + 1);
                return (days - date) + 1;
            }
            return date;
        },
        getUTCFullYear: function getUTCFullYear() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetUTCFullYear(this);
            if (year < 0 && originalGetUTCMonth(this) > 11) {
                return year + 1;
            }
            return year;
        },
        getUTCMonth: function getUTCMonth() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetUTCFullYear(this);
            var month = originalGetUTCMonth(this);
            if (year < 0 && month > 11) {
                return 0;
            }
            return month;
        },
        getUTCDate: function getUTCDate() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var year = originalGetUTCFullYear(this);
            var month = originalGetUTCMonth(this);
            var date = originalGetUTCDate(this);
            if (year < 0 && month > 11) {
                if (month === 12) {
                    return date;
                }
                var days = daysInMonth(0, year + 1);
                return (days - date) + 1;
            }
            return date;
        }
    }, hasNegativeMonthYearBug);

    defineProperties(Date.prototype, {
        toUTCString: function toUTCString() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var day = originalGetUTCDay(this);
            var date = originalGetUTCDate(this);
            var month = originalGetUTCMonth(this);
            var year = originalGetUTCFullYear(this);
            var hour = originalGetUTCHours(this);
            var minute = originalGetUTCMinutes(this);
            var second = originalGetUTCSeconds(this);
            return dayName[day] + ', ' +
                (date < 10 ? '0' + date : date) + ' ' +
                monthName[month] + ' ' +
                year + ' ' +
                (hour < 10 ? '0' + hour : hour) + ':' +
                (minute < 10 ? '0' + minute : minute) + ':' +
                (second < 10 ? '0' + second : second) + ' GMT';
        }
    }, hasNegativeMonthYearBug || hasToUTCStringFormatBug);

    // Opera 12 has `,`
    defineProperties(Date.prototype, {
        toDateString: function toDateString() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var day = this.getDay();
            var date = this.getDate();
            var month = this.getMonth();
            var year = this.getFullYear();
            return dayName[day] + ' ' +
                monthName[month] + ' ' +
                (date < 10 ? '0' + date : date) + ' ' +
                year;
        }
    }, hasNegativeMonthYearBug || hasToDateStringFormatBug);

    // can't use defineProperties here because of toString enumeration issue in IE <= 8
    if (hasNegativeMonthYearBug || hasToStringFormatBug) {
        Date.prototype.toString = function toString() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError('this is not a Date object.');
            }
            var day = this.getDay();
            var date = this.getDate();
            var month = this.getMonth();
            var year = this.getFullYear();
            var hour = this.getHours();
            var minute = this.getMinutes();
            var second = this.getSeconds();
            var timezoneOffset = this.getTimezoneOffset();
            var hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
            var minutesOffset = Math.floor(Math.abs(timezoneOffset) % 60);
            return dayName[day] + ' ' +
                monthName[month] + ' ' +
                (date < 10 ? '0' + date : date) + ' ' +
                year + ' ' +
                (hour < 10 ? '0' + hour : hour) + ':' +
                (minute < 10 ? '0' + minute : minute) + ':' +
                (second < 10 ? '0' + second : second) + ' GMT' +
                (timezoneOffset > 0 ? '-' : '+') +
                (hoursOffset < 10 ? '0' + hoursOffset : hoursOffset) +
                (minutesOffset < 10 ? '0' + minutesOffset : minutesOffset);
        };
        if (supportsDescriptors) {
            $Object.defineProperty(Date.prototype, 'toString', {
                configurable: true,
                enumerable: false,
                writable: true
            });
        }
    }

    // ES5 15.9.5.43
    // http://es5.github.com/#x15.9.5.43
    // This function returns a String value represent the instance in time
    // represented by this Date object. The format of the String is the Date Time
    // string format defined in 15.9.1.15. All fields are present in the String.
    // The time zone is always UTC, denoted by the suffix Z. If the time value of
    // this object is not a finite Number a RangeError exception is thrown.
    var negativeDate = -62198755200000;
    var negativeYearString = '-000001';
    var hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;
    var hasSafari51DateBug = Date.prototype.toISOString && new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z';

    var getTime = call.bind(Date.prototype.getTime);

    defineProperties(Date.prototype, {
        toISOString: function toISOString() {
            if (!isFinite(this) || !isFinite(getTime(this))) {
                // Adope Photoshop requires the second check.
                throw new RangeError('Date.prototype.toISOString called on non-finite value.');
            }

            var year = originalGetUTCFullYear(this);

            var month = originalGetUTCMonth(this);
            // see https://github.com/es-shims/es5-shim/issues/111
            year += Math.floor(month / 12);
            month = (month % 12 + 12) % 12;

            // the date time string format is specified in 15.9.1.15.
            var result = [month + 1, originalGetUTCDate(this), originalGetUTCHours(this), originalGetUTCMinutes(this), originalGetUTCSeconds(this)];
            year = (
                (year < 0 ? '-' : (year > 9999 ? '+' : '')) +
                strSlice('00000' + Math.abs(year), (0 <= year && year <= 9999) ? -4 : -6)
            );

            for (var i = 0; i < result.length; ++i) {
                // pad months, days, hours, minutes, and seconds to have two digits.
                result[i] = strSlice('00' + result[i], -2);
            }
            // pad milliseconds to have three digits.
            return (
                year + '-' + arraySlice(result, 0, 2).join('-') +
                'T' + arraySlice(result, 2).join(':') + '.' +
                strSlice('000' + originalGetUTCMilliseconds(this), -3) + 'Z'
            );
        }
    }, hasNegativeDateBug || hasSafari51DateBug);

    // ES5 15.9.5.44
    // http://es5.github.com/#x15.9.5.44
    // This function provides a String representation of a Date object for use by
    // JSON.stringify (15.12.3).
    var dateToJSONIsSupported = (function () {
        try {
            return Date.prototype.toJSON &&
                new Date(NaN).toJSON() === null &&
                new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
                Date.prototype.toJSON.call({ // generic
                    toISOString: function () { return true; }
                });
        } catch (e) {
            return false;
        }
    }());
    if (!dateToJSONIsSupported) {
        Date.prototype.toJSON = function toJSON(key) {
            // When the toJSON method is called with argument key, the following
            // steps are taken:

            // 1.  Let O be the result of calling ToObject, giving it the this
            // value as its argument.
            // 2. Let tv be ES.ToPrimitive(O, hint Number).
            var O = $Object(this);
            var tv = ES.ToPrimitive(O);
            // 3. If tv is a Number and is not finite, return null.
            if (typeof tv === 'number' && !isFinite(tv)) {
                return null;
            }
            // 4. Let toISO be the result of calling the [[Get]] internal method of
            // O with argument "toISOString".
            var toISO = O.toISOString;
            // 5. If IsCallable(toISO) is false, throw a TypeError exception.
            if (!isCallable(toISO)) {
                throw new TypeError('toISOString property is not callable');
            }
            // 6. Return the result of calling the [[Call]] internal method of
            //  toISO with O as the this value and an empty argument list.
            return toISO.call(O);

            // NOTE 1 The argument is ignored.

            // NOTE 2 The toJSON function is intentionally generic; it does not
            // require that its this value be a Date object. Therefore, it can be
            // transferred to other kinds of objects for use as a method. However,
            // it does require that any such object have a toISOString method. An
            // object is free to use the argument key to filter its
            // stringification.
        };
    }

    // ES5 15.9.4.2
    // http://es5.github.com/#x15.9.4.2
    // based on work shared by Daniel Friesen (dantman)
    // http://gist.github.com/303249
    var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
    var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
    var doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
    if (doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
        // XXX global assignment won't work in embeddings that use
        // an alternate object for the context.
        /* global Date: true */
        /* eslint-disable no-undef */
        var maxSafeUnsigned32Bit = Math.pow(2, 31) - 1;
        var hasSafariSignedIntBug = isActualNaN(new Date(1970, 0, 1, 0, 0, 0, maxSafeUnsigned32Bit + 1).getTime());
        /* eslint-disable no-implicit-globals */
        Date = (function (NativeDate) {
        /* eslint-enable no-implicit-globals */
        /* eslint-enable no-undef */
            // Date.length === 7
            var DateShim = function Date(Y, M, D, h, m, s, ms) {
                var length = arguments.length;
                var date;
                if (this instanceof NativeDate) {
                    var seconds = s;
                    var millis = ms;
                    if (hasSafariSignedIntBug && length >= 7 && ms > maxSafeUnsigned32Bit) {
                        // work around a Safari 8/9 bug where it treats the seconds as signed
                        var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                        var sToShift = Math.floor(msToShift / 1e3);
                        seconds += sToShift;
                        millis -= sToShift * 1e3;
                    }
                    date = length === 1 && $String(Y) === Y ? // isString(Y)
                        // We explicitly pass it through parse:
                        new NativeDate(DateShim.parse(Y)) :
                        // We have to manually make calls depending on argument
                        // length here
                        length >= 7 ? new NativeDate(Y, M, D, h, m, seconds, millis) :
                        length >= 6 ? new NativeDate(Y, M, D, h, m, seconds) :
                        length >= 5 ? new NativeDate(Y, M, D, h, m) :
                        length >= 4 ? new NativeDate(Y, M, D, h) :
                        length >= 3 ? new NativeDate(Y, M, D) :
                        length >= 2 ? new NativeDate(Y, M) :
                        length >= 1 ? new NativeDate(Y instanceof NativeDate ? +Y : Y) :
                                      new NativeDate();
                } else {
                    date = NativeDate.apply(this, arguments);
                }
                if (!isPrimitive(date)) {
                    // Prevent mixups with unfixed Date object
                    defineProperties(date, { constructor: DateShim }, true);
                }
                return date;
            };

            // 15.9.1.15 Date Time String Format.
            var isoDateExpression = new RegExp('^' +
                '(\\d{4}|[+-]\\d{6})' + // four-digit year capture or sign +
                                          // 6-digit extended year
                '(?:-(\\d{2})' + // optional month capture
                '(?:-(\\d{2})' + // optional day capture
                '(?:' + // capture hours:minutes:seconds.milliseconds
                    'T(\\d{2})' + // hours capture
                    ':(\\d{2})' + // minutes capture
                    '(?:' + // optional :seconds.milliseconds
                        ':(\\d{2})' + // seconds capture
                        '(?:(\\.\\d{1,}))?' + // milliseconds capture
                    ')?' +
                '(' + // capture UTC offset component
                    'Z|' + // UTC capture
                    '(?:' + // offset specifier +/-hours:minutes
                        '([-+])' + // sign capture
                        '(\\d{2})' + // hours offset capture
                        ':(\\d{2})' + // minutes offset capture
                    ')' +
                ')?)?)?)?' +
            '$');

            var months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

            var dayFromMonth = function dayFromMonth(year, month) {
                var t = month > 1 ? 1 : 0;
                return (
                    months[month] +
                    Math.floor((year - 1969 + t) / 4) -
                    Math.floor((year - 1901 + t) / 100) +
                    Math.floor((year - 1601 + t) / 400) +
                    365 * (year - 1970)
                );
            };

            var toUTC = function toUTC(t) {
                var s = 0;
                var ms = t;
                if (hasSafariSignedIntBug && ms > maxSafeUnsigned32Bit) {
                    // work around a Safari 8/9 bug where it treats the seconds as signed
                    var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                    var sToShift = Math.floor(msToShift / 1e3);
                    s += sToShift;
                    ms -= sToShift * 1e3;
                }
                return $Number(new NativeDate(1970, 0, 1, 0, 0, s, ms));
            };

            // Copy any custom methods a 3rd party library may have added
            for (var key in NativeDate) {
                if (owns(NativeDate, key)) {
                    DateShim[key] = NativeDate[key];
                }
            }

            // Copy "native" methods explicitly; they may be non-enumerable
            defineProperties(DateShim, {
                now: NativeDate.now,
                UTC: NativeDate.UTC
            }, true);
            DateShim.prototype = NativeDate.prototype;
            defineProperties(DateShim.prototype, {
                constructor: DateShim
            }, true);

            // Upgrade Date.parse to handle simplified ISO 8601 strings
            var parseShim = function parse(string) {
                var match = isoDateExpression.exec(string);
                if (match) {
                    // parse months, days, hours, minutes, seconds, and milliseconds
                    // provide default values if necessary
                    // parse the UTC offset component
                    var year = $Number(match[1]),
                        month = $Number(match[2] || 1) - 1,
                        day = $Number(match[3] || 1) - 1,
                        hour = $Number(match[4] || 0),
                        minute = $Number(match[5] || 0),
                        second = $Number(match[6] || 0),
                        millisecond = Math.floor($Number(match[7] || 0) * 1000),
                        // When time zone is missed, local offset should be used
                        // (ES 5.1 bug)
                        // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                        isLocalTime = Boolean(match[4] && !match[8]),
                        signOffset = match[9] === '-' ? 1 : -1,
                        hourOffset = $Number(match[10] || 0),
                        minuteOffset = $Number(match[11] || 0),
                        result;
                    var hasMinutesOrSecondsOrMilliseconds = minute > 0 || second > 0 || millisecond > 0;
                    if (
                        hour < (hasMinutesOrSecondsOrMilliseconds ? 24 : 25) &&
                        minute < 60 && second < 60 && millisecond < 1000 &&
                        month > -1 && month < 12 && hourOffset < 24 &&
                        minuteOffset < 60 && // detect invalid offsets
                        day > -1 &&
                        day < (dayFromMonth(year, month + 1) - dayFromMonth(year, month))
                    ) {
                        result = (
                            (dayFromMonth(year, month) + day) * 24 +
                            hour +
                            hourOffset * signOffset
                        ) * 60;
                        result = (
                            (result + minute + minuteOffset * signOffset) * 60 +
                            second
                        ) * 1000 + millisecond;
                        if (isLocalTime) {
                            result = toUTC(result);
                        }
                        if (-8.64e15 <= result && result <= 8.64e15) {
                            return result;
                        }
                    }
                    return NaN;
                }
                return NativeDate.parse.apply(this, arguments);
            };
            defineProperties(DateShim, { parse: parseShim });

            return DateShim;
        }(Date));
        /* global Date: false */
    }

    // ES5 15.9.4.4
    // http://es5.github.com/#x15.9.4.4
    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    //
    // Number
    // ======
    //

    // ES5.1 15.7.4.5
    // http://es5.github.com/#x15.7.4.5
    var hasToFixedBugs = NumberPrototype.toFixed && (
      (0.00008).toFixed(3) !== '0.000' ||
      (0.9).toFixed(0) !== '1' ||
      (1.255).toFixed(2) !== '1.25' ||
      (1000000000000000128).toFixed(0) !== '1000000000000000128'
    );

    var toFixedHelpers = {
        base: 1e7,
        size: 6,
        data: [0, 0, 0, 0, 0, 0],
        multiply: function multiply(n, c) {
            var i = -1;
            var c2 = c;
            while (++i < toFixedHelpers.size) {
                c2 += n * toFixedHelpers.data[i];
                toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
                c2 = Math.floor(c2 / toFixedHelpers.base);
            }
        },
        divide: function divide(n) {
            var i = toFixedHelpers.size;
            var c = 0;
            while (--i >= 0) {
                c += toFixedHelpers.data[i];
                toFixedHelpers.data[i] = Math.floor(c / n);
                c = (c % n) * toFixedHelpers.base;
            }
        },
        numToString: function numToString() {
            var i = toFixedHelpers.size;
            var s = '';
            while (--i >= 0) {
                if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
                    var t = $String(toFixedHelpers.data[i]);
                    if (s === '') {
                        s = t;
                    } else {
                        s += strSlice('0000000', 0, 7 - t.length) + t;
                    }
                }
            }
            return s;
        },
        pow: function pow(x, n, acc) {
            return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
        },
        log: function log(x) {
            var n = 0;
            var x2 = x;
            while (x2 >= 4096) {
                n += 12;
                x2 /= 4096;
            }
            while (x2 >= 2) {
                n += 1;
                x2 /= 2;
            }
            return n;
        }
    };

    var toFixedShim = function toFixed(fractionDigits) {
        var f, x, s, m, e, z, j, k;

        // Test for NaN and round fractionDigits down
        f = $Number(fractionDigits);
        f = isActualNaN(f) ? 0 : Math.floor(f);

        if (f < 0 || f > 20) {
            throw new RangeError('Number.toFixed called with invalid number of decimals');
        }

        x = $Number(this);

        if (isActualNaN(x)) {
            return 'NaN';
        }

        // If it is too big or small, return the string value of the number
        if (x <= -1e21 || x >= 1e21) {
            return $String(x);
        }

        s = '';

        if (x < 0) {
            s = '-';
            x = -x;
        }

        m = '0';

        if (x > 1e-21) {
            // 1e-21 < x < 1e21
            // -70 < log2(x) < 70
            e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
            z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
            z *= 0x10000000000000; // Math.pow(2, 52);
            e = 52 - e;

            // -18 < e < 122
            // x = z / 2 ^ e
            if (e > 0) {
                toFixedHelpers.multiply(0, z);
                j = f;

                while (j >= 7) {
                    toFixedHelpers.multiply(1e7, 0);
                    j -= 7;
                }

                toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
                j = e - 1;

                while (j >= 23) {
                    toFixedHelpers.divide(1 << 23);
                    j -= 23;
                }

                toFixedHelpers.divide(1 << j);
                toFixedHelpers.multiply(1, 1);
                toFixedHelpers.divide(2);
                m = toFixedHelpers.numToString();
            } else {
                toFixedHelpers.multiply(0, z);
                toFixedHelpers.multiply(1 << (-e), 0);
                m = toFixedHelpers.numToString() + strSlice('0.00000000000000000000', 2, 2 + f);
            }
        }

        if (f > 0) {
            k = m.length;

            if (k <= f) {
                m = s + strSlice('0.0000000000000000000', 0, f - k + 2) + m;
            } else {
                m = s + strSlice(m, 0, k - f) + '.' + strSlice(m, k - f);
            }
        } else {
            m = s + m;
        }

        return m;
    };
    defineProperties(NumberPrototype, { toFixed: toFixedShim }, hasToFixedBugs);

    var hasToPrecisionUndefinedBug = (function () {
        try {
            return 1.0.toPrecision(undefined) === '1';
        } catch (e) {
            return true;
        }
    }());
    var originalToPrecision = NumberPrototype.toPrecision;
    defineProperties(NumberPrototype, {
        toPrecision: function toPrecision(precision) {
            return typeof precision === 'undefined' ? originalToPrecision.call(this) : originalToPrecision.call(this, precision);
        }
    }, hasToPrecisionUndefinedBug);

    //
    // String
    // ======
    //

    // ES5 15.5.4.14
    // http://es5.github.com/#x15.5.4.14

    // [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
    // Many browsers do not split properly with regular expressions or they
    // do not perform the split correctly under obscure conditions.
    // See http://blog.stevenlevithan.com/archives/cross-browser-split
    // I've tested in many browsers and this seems to cover the deviant ones:
    //    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
    //    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
    //    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
    //       [undefined, "t", undefined, "e", ...]
    //    ''.split(/.?/) should be [], not [""]
    //    '.'.split(/()()/) should be ["."], not ["", "", "."]

    if (
        'ab'.split(/(?:ab)*/).length !== 2 ||
        '.'.split(/(.?)(.?)/).length !== 4 ||
        'tesst'.split(/(s)*/)[1] === 't' ||
        'test'.split(/(?:)/, -1).length !== 4 ||
        ''.split(/.?/).length ||
        '.'.split(/()()/).length > 1
    ) {
        (function () {
            var compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group
            var maxSafe32BitInt = Math.pow(2, 32) - 1;

            StringPrototype.split = function (separator, limit) {
                var string = String(this);
                if (typeof separator === 'undefined' && limit === 0) {
                    return [];
                }

                // If `separator` is not a regex, use native split
                if (!isRegex(separator)) {
                    return strSplit(this, separator, limit);
                }

                var output = [];
                var flags = (separator.ignoreCase ? 'i' : '') +
                            (separator.multiline ? 'm' : '') +
                            (separator.unicode ? 'u' : '') + // in ES6
                            (separator.sticky ? 'y' : ''), // Firefox 3+ and ES6
                    lastLastIndex = 0,
                    // Make `global` and avoid `lastIndex` issues by working with a copy
                    separator2, match, lastIndex, lastLength;
                var separatorCopy = new RegExp(separator.source, flags + 'g');
                if (!compliantExecNpcg) {
                    // Doesn't need flags gy, but they don't hurt
                    separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
                }
                /* Values for `limit`, per the spec:
                 * If undefined: 4294967295 // maxSafe32BitInt
                 * If 0, Infinity, or NaN: 0
                 * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
                 * If negative number: 4294967296 - Math.floor(Math.abs(limit))
                 * If other: Type-convert, then use the above rules
                 */
                var splitLimit = typeof limit === 'undefined' ? maxSafe32BitInt : ES.ToUint32(limit);
                match = separatorCopy.exec(string);
                while (match) {
                    // `separatorCopy.lastIndex` is not reliable cross-browser
                    lastIndex = match.index + match[0].length;
                    if (lastIndex > lastLastIndex) {
                        pushCall(output, strSlice(string, lastLastIndex, match.index));
                        // Fix browsers whose `exec` methods don't consistently return `undefined` for
                        // nonparticipating capturing groups
                        if (!compliantExecNpcg && match.length > 1) {
                            /* eslint-disable no-loop-func */
                            match[0].replace(separator2, function () {
                                for (var i = 1; i < arguments.length - 2; i++) {
                                    if (typeof arguments[i] === 'undefined') {
                                        match[i] = void 0;
                                    }
                                }
                            });
                            /* eslint-enable no-loop-func */
                        }
                        if (match.length > 1 && match.index < string.length) {
                            array_push.apply(output, arraySlice(match, 1));
                        }
                        lastLength = match[0].length;
                        lastLastIndex = lastIndex;
                        if (output.length >= splitLimit) {
                            break;
                        }
                    }
                    if (separatorCopy.lastIndex === match.index) {
                        separatorCopy.lastIndex++; // Avoid an infinite loop
                    }
                    match = separatorCopy.exec(string);
                }
                if (lastLastIndex === string.length) {
                    if (lastLength || !separatorCopy.test('')) {
                        pushCall(output, '');
                    }
                } else {
                    pushCall(output, strSlice(string, lastLastIndex));
                }
                return output.length > splitLimit ? arraySlice(output, 0, splitLimit) : output;
            };
        }());

    // [bugfix, chrome]
    // If separator is undefined, then the result array contains just one String,
    // which is the this value (converted to a String). If limit is not undefined,
    // then the output array is truncated so that it contains no more than limit
    // elements.
    // "0".split(undefined, 0) -> []
    } else if ('0'.split(void 0, 0).length) {
        StringPrototype.split = function split(separator, limit) {
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }
            return strSplit(this, separator, limit);
        };
    }

    var str_replace = StringPrototype.replace;
    var replaceReportsGroupsCorrectly = (function () {
        var groups = [];
        'x'.replace(/x(.)?/g, function (match, group) {
            pushCall(groups, group);
        });
        return groups.length === 1 && typeof groups[0] === 'undefined';
    }());

    if (!replaceReportsGroupsCorrectly) {
        StringPrototype.replace = function replace(searchValue, replaceValue) {
            var isFn = isCallable(replaceValue);
            var hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
            if (!isFn || !hasCapturingGroups) {
                return str_replace.call(this, searchValue, replaceValue);
            } else {
                var wrappedReplaceValue = function (match) {
                    var length = arguments.length;
                    var originalLastIndex = searchValue.lastIndex;
                    searchValue.lastIndex = 0;
                    var args = searchValue.exec(match) || [];
                    searchValue.lastIndex = originalLastIndex;
                    pushCall(args, arguments[length - 2], arguments[length - 1]);
                    return replaceValue.apply(this, args);
                };
                return str_replace.call(this, searchValue, wrappedReplaceValue);
            }
        };
    }

    // ECMA-262, 3rd B.2.3
    // Not an ECMAScript standard, although ECMAScript 3rd Edition has a
    // non-normative section suggesting uniform semantics and it should be
    // normalized across all browsers
    // [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
    var string_substr = StringPrototype.substr;
    var hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';
    defineProperties(StringPrototype, {
        substr: function substr(start, length) {
            var normalizedStart = start;
            if (start < 0) {
                normalizedStart = max(this.length + start, 0);
            }
            return string_substr.call(this, normalizedStart, length);
        }
    }, hasNegativeSubstrBug);

    // ES5 15.5.4.20
    // whitespace from: http://es5.github.io/#x15.5.4.20
    var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
        '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
        '\u2029\uFEFF';
    var zeroWidth = '\u200b';
    var wsRegexChars = '[' + ws + ']';
    var trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
    var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');
    var hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
    defineProperties(StringPrototype, {
        // http://blog.stevenlevithan.com/archives/faster-trim-javascript
        // http://perfectionkills.com/whitespace-deviations/
        trim: function trim() {
            if (typeof this === 'undefined' || this === null) {
                throw new TypeError("can't convert " + this + ' to object');
            }
            return $String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
        }
    }, hasTrimWhitespaceBug);
    var trim = call.bind(String.prototype.trim);

    var hasLastIndexBug = StringPrototype.lastIndexOf && 'abcあい'.lastIndexOf('あい', 2) !== -1;
    defineProperties(StringPrototype, {
        lastIndexOf: function lastIndexOf(searchString) {
            if (typeof this === 'undefined' || this === null) {
                throw new TypeError("can't convert " + this + ' to object');
            }
            var S = $String(this);
            var searchStr = $String(searchString);
            var numPos = arguments.length > 1 ? $Number(arguments[1]) : NaN;
            var pos = isActualNaN(numPos) ? Infinity : ES.ToInteger(numPos);
            var start = min(max(pos, 0), S.length);
            var searchLen = searchStr.length;
            var k = start + searchLen;
            while (k > 0) {
                k = max(0, k - searchLen);
                var index = strIndexOf(strSlice(S, k, start + searchLen), searchStr);
                if (index !== -1) {
                    return k + index;
                }
            }
            return -1;
        }
    }, hasLastIndexBug);

    var originalLastIndexOf = StringPrototype.lastIndexOf;
    defineProperties(StringPrototype, {
        lastIndexOf: function lastIndexOf(searchString) {
            return originalLastIndexOf.apply(this, arguments);
        }
    }, StringPrototype.lastIndexOf.length !== 1);

    // ES-5 15.1.2.2
    /* eslint-disable radix */
    if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
    /* eslint-enable radix */
        /* global parseInt: true */
        parseInt = (function (origParseInt) {
            var hexRegex = /^[\-+]?0[xX]/;
            return function parseInt(str, radix) {
                var string = trim(String(str));
                var defaultedRadix = $Number(radix) || (hexRegex.test(string) ? 16 : 10);
                return origParseInt(string, defaultedRadix);
            };
        }(parseInt));
    }

    // https://es5.github.io/#x15.1.2.3
    if (1 / parseFloat('-0') !== -Infinity) {
        /* global parseFloat: true */
        parseFloat = (function (origParseFloat) {
            return function parseFloat(string) {
                var inputString = trim(String(string));
                var result = origParseFloat(inputString);
                return result === 0 && strSlice(inputString, 0, 1) === '-' ? -0 : result;
            };
        }(parseFloat));
    }

    if (String(new RangeError('test')) !== 'RangeError: test') {
        var errorToStringShim = function toString() {
            if (typeof this === 'undefined' || this === null) {
                throw new TypeError("can't convert " + this + ' to object');
            }
            var name = this.name;
            if (typeof name === 'undefined') {
                name = 'Error';
            } else if (typeof name !== 'string') {
                name = $String(name);
            }
            var msg = this.message;
            if (typeof msg === 'undefined') {
                msg = '';
            } else if (typeof msg !== 'string') {
                msg = $String(msg);
            }
            if (!name) {
                return msg;
            }
            if (!msg) {
                return name;
            }
            return name + ': ' + msg;
        };
        // can't use defineProperties here because of toString enumeration issue in IE <= 8
        Error.prototype.toString = errorToStringShim;
    }

    if (supportsDescriptors) {
        var ensureNonEnumerable = function (obj, prop) {
            if (isEnum(obj, prop)) {
                var desc = Object.getOwnPropertyDescriptor(obj, prop);
                if (desc.configurable) {
                    desc.enumerable = false;
                    Object.defineProperty(obj, prop, desc);
                }
            }
        };
        ensureNonEnumerable(Error.prototype, 'message');
        if (Error.prototype.message !== '') {
            Error.prototype.message = '';
        }
        ensureNonEnumerable(Error.prototype, 'name');
    }

    if (String(/a/mig) !== '/a/gim') {
        var regexToString = function toString() {
            var str = '/' + this.source + '/';
            if (this.global) {
                str += 'g';
            }
            if (this.ignoreCase) {
                str += 'i';
            }
            if (this.multiline) {
                str += 'm';
            }
            return str;
        };
        // can't use defineProperties here because of toString enumeration issue in IE <= 8
        RegExp.prototype.toString = regexToString;
    }
}));

},{}],18:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],19:[function(require,module,exports){
(function (global){
"use strict";

/**
 * filesize
 *
 * @copyright 2016 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 3.3.0
 */
(function (global) {
	var b = /^(b|B)$/;
	var symbol = {
		iec: {
			bits: ["b", "Kib", "Mib", "Gib", "Tib", "Pib", "Eib", "Zib", "Yib"],
			bytes: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
		},
		jedec: {
			bits: ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"],
			bytes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		}
	};

	/**
  * filesize
  *
  * @method filesize
  * @param  {Mixed}   arg        String, Int or Float to transform
  * @param  {Object}  descriptor [Optional] Flags
  * @return {String}             Readable file size String
  */
	function filesize(arg) {
		var descriptor = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		var result = [],
		    val = 0,
		    e = void 0,
		    base = void 0,
		    bits = void 0,
		    ceil = void 0,
		    neg = void 0,
		    num = void 0,
		    output = void 0,
		    round = void 0,
		    unix = void 0,
		    spacer = void 0,
		    standard = void 0,
		    symbols = void 0;

		if (isNaN(arg)) {
			throw new Error("Invalid arguments");
		}

		bits = descriptor.bits === true;
		unix = descriptor.unix === true;
		base = descriptor.base || 2;
		round = descriptor.round !== undefined ? descriptor.round : unix ? 1 : 2;
		spacer = descriptor.spacer !== undefined ? descriptor.spacer : unix ? "" : " ";
		symbols = descriptor.symbols || descriptor.suffixes || {};
		standard = base === 2 ? descriptor.standard || "jedec" : "jedec";
		output = descriptor.output || "string";
		e = descriptor.exponent !== undefined ? descriptor.exponent : -1;
		num = Number(arg);
		neg = num < 0;
		ceil = base > 2 ? 1000 : 1024;

		// Flipping a negative number to determine the size
		if (neg) {
			num = -num;
		}

		// Zero is now a special case because bytes divide by 1
		if (num === 0) {
			result[0] = 0;
			result[1] = unix ? "" : !bits ? "B" : "b";
		} else {
			// Determining the exponent
			if (e === -1 || isNaN(e)) {
				e = Math.floor(Math.log(num) / Math.log(ceil));

				if (e < 0) {
					e = 0;
				}
			}

			// Exceeding supported length, time to reduce & multiply
			if (e > 8) {
				e = 8;
			}

			val = base === 2 ? num / Math.pow(2, e * 10) : num / Math.pow(1000, e);

			if (bits) {
				val = val * 8;

				if (val > ceil && e < 8) {
					val = val / ceil;
					e++;
				}
			}

			result[0] = Number(val.toFixed(e > 0 ? round : 0));
			result[1] = base === 10 && e === 1 ? bits ? "kb" : "kB" : symbol[standard][bits ? "bits" : "bytes"][e];

			if (unix) {
				result[1] = standard === "jedec" ? result[1].charAt(0) : e > 0 ? result[1].replace(/B$/, "") : result[1];

				if (b.test(result[1])) {
					result[0] = Math.floor(result[0]);
					result[1] = "";
				}
			}
		}

		// Decorating a 'diff'
		if (neg) {
			result[0] = -result[0];
		}

		// Applying custom symbol
		result[1] = symbols[result[1]] || result[1];

		// Returning Array, Object, or String (default)
		if (output === "array") {
			return result;
		}

		if (output === "exponent") {
			return e;
		}

		if (output === "object") {
			return { value: result[0], suffix: result[1], symbol: result[1] };
		}

		return result.join(spacer);
	}

	// CommonJS, AMD, script tag
	if (typeof exports !== "undefined") {
		module.exports = filesize;
	} else if (typeof define === "function" && define.amd) {
		define(function () {
			return filesize;
		});
	} else {
		global.filesize = filesize;
	}
})(typeof window !== "undefined" ? window : global);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var NODE_LIST_CLASSES = {
  '[object HTMLCollection]': true,
  '[object NodeList]': true,
  '[object RadioNodeList]': true
};

// .type values for elements which can appear in .elements and should be ignored
var IGNORED_ELEMENT_TYPES = {
  'button': true,
  'fieldset': true,
  // 'keygen': true,
  // 'output': true,
  'reset': true,
  'submit': true
};

var CHECKED_INPUT_TYPES = {
  'checkbox': true,
  'radio': true
};

var TRIM_RE = /^\s+|\s+$/g;

var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * @param {HTMLFormElement} form
 * @param {Object} options
 * @return {Object.<string,(string|Array.<string>)>} an object containing
 *   submittable value(s) held in the form's .elements collection, with
 *   properties named as per element names or ids.
 */
function getFormData(form) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? { trim: false } : arguments[1];

  if (!form) {
    throw new Error('A form is required by getFormData, was given form=' + form);
  }

  var data = {};
  var elementName = undefined;
  var elementNames = [];
  var elementNameLookup = {};

  // Get unique submittable element names for the form
  for (var i = 0, l = form.elements.length; i < l; i++) {
    var element = form.elements[i];
    if (IGNORED_ELEMENT_TYPES[element.type] || element.disabled) {
      continue;
    }
    elementName = element.name || element.id;
    if (elementName && !elementNameLookup[elementName]) {
      elementNames.push(elementName);
      elementNameLookup[elementName] = true;
    }
  }

  // Extract element data name-by-name for consistent handling of special cases
  // around elements which contain multiple inputs.
  for (var i = 0, l = elementNames.length; i < l; i++) {
    elementName = elementNames[i];
    var value = getNamedFormElementData(form, elementName, options);
    if (value != null) {
      data[elementName] = value;
    }
  }

  return data;
}

/**
 * @param {HTMLFormElement} form
 * @param {string} elementName
 * @param {Object} options
 * @return {(string|Array.<string>)} submittable value(s) in the form for a
 *   named element from its .elements collection, or null if there was no
 *   element with that name or the element had no submittable value(s).
 */
function getNamedFormElementData(form, elementName) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? { trim: false } : arguments[2];

  if (!form) {
    throw new Error('A form is required by getNamedFormElementData, was given form=' + form);
  }
  if (!elementName && toString.call(elementName) !== '[object String]') {
    throw new Error('A form element name is required by getNamedFormElementData, was given elementName=' + elementName);
  }

  var element = form.elements[elementName];
  if (!element || element.disabled) {
    return null;
  }

  if (!NODE_LIST_CLASSES[toString.call(element)]) {
    return getFormElementValue(element, options.trim);
  }

  // Deal with multiple form controls which have the same name
  var data = [];
  var allRadios = true;
  for (var i = 0, l = element.length; i < l; i++) {
    if (element[i].disabled) {
      continue;
    }
    if (allRadios && element[i].type !== 'radio') {
      allRadios = false;
    }
    var value = getFormElementValue(element[i], options.trim);
    if (value != null) {
      data = data.concat(value);
    }
  }

  // Special case for an element with multiple same-named inputs which were all
  // radio buttons: if there was a selected value, only return the value.
  if (allRadios && data.length === 1) {
    return data[0];
  }

  return data.length > 0 ? data : null;
}

/**
 * @param {HTMLElement} element a form element.
 * @param {booleam} trim should values for text entry inputs be trimmed?
 * @return {(string|Array.<string>|File|Array.<File>)} the element's submittable
 *   value(s), or null if it had none.
 */
function getFormElementValue(element, trim) {
  var value = null;
  var type = element.type;

  if (type === 'select-one') {
    if (element.options.length) {
      value = element.options[element.selectedIndex].value;
    }
    return value;
  }

  if (type === 'select-multiple') {
    value = [];
    for (var i = 0, l = element.options.length; i < l; i++) {
      if (element.options[i].selected) {
        value.push(element.options[i].value);
      }
    }
    if (value.length === 0) {
      value = null;
    }
    return value;
  }

  // If a file input doesn't have a files attribute, fall through to using its
  // value attribute.
  if (type === 'file' && 'files' in element) {
    if (element.multiple) {
      value = slice.call(element.files);
      if (value.length === 0) {
        value = null;
      }
    } else {
      // Should be null if not present, according to the spec
      value = element.files[0];
    }
    return value;
  }

  if (!CHECKED_INPUT_TYPES[type]) {
    value = trim ? element.value.replace(TRIM_RE, '') : element.value;
  } else if (element.checked) {
    value = element.value;
  }

  return value;
}

getFormData.getNamedFormElementData = getNamedFormElementData;

exports['default'] = getFormData;
module.exports = exports['default'];
},{}],21:[function(require,module,exports){
module.exports = shim

function shim (element, value) {
    if (value === undefined) {
        return element.style.display === 'none'
    }

    element.style.display = (value || null) && 'none'
}

},{}],22:[function(require,module,exports){
// HumanizeDuration.js - http://git.io/j0HgmQ

;(function () {
  var languages = {
    ar: {
      y: function (c) { return c === 1 ? 'سنة' : 'سنوات' },
      mo: function (c) { return c === 1 ? 'شهر' : 'أشهر' },
      w: function (c) { return c === 1 ? 'أسبوع' : 'أسابيع' },
      d: function (c) { return c === 1 ? 'يوم' : 'أيام' },
      h: function (c) { return c === 1 ? 'ساعة' : 'ساعات' },
      m: function (c) { return c === 1 ? 'دقيقة' : 'دقائق' },
      s: function (c) { return c === 1 ? 'ثانية' : 'ثواني' },
      ms: function (c) { return c === 1 ? 'جزء من الثانية' : 'أجزاء من الثانية' },
      decimal: ','
    },
    ca: {
      y: function (c) { return 'any' + (c !== 1 ? 's' : '') },
      mo: function (c) { return 'mes' + (c !== 1 ? 'os' : '') },
      w: function (c) { return 'setman' + (c !== 1 ? 'es' : 'a') },
      d: function (c) { return 'di' + (c !== 1 ? 'es' : 'a') },
      h: function (c) { return 'hor' + (c !== 1 ? 'es' : 'a') },
      m: function (c) { return 'minut' + (c !== 1 ? 's' : '') },
      s: function (c) { return 'segon' + (c !== 1 ? 's' : '') },
      ms: function (c) { return 'milisegon' + (c !== 1 ? 's' : '') },
      decimal: ','
    },
    cs: {
      y: function (c) { return ['rok', 'roku', 'roky', 'let'][getCzechForm(c)] },
      mo: function (c) { return ['měsíc', 'měsíce', 'měsíce', 'měsíců'][getCzechForm(c)] },
      w: function (c) { return ['týden', 'týdne', 'týdny', 'týdnů'][getCzechForm(c)] },
      d: function (c) { return ['den', 'dne', 'dny', 'dní'][getCzechForm(c)] },
      h: function (c) { return ['hodina', 'hodiny', 'hodiny', 'hodin'][getCzechForm(c)] },
      m: function (c) { return ['minuta', 'minuty', 'minuty', 'minut'][getCzechForm(c)] },
      s: function (c) { return ['sekunda', 'sekundy', 'sekundy', 'sekund'][getCzechForm(c)] },
      ms: function (c) { return ['milisekunda', 'milisekundy', 'milisekundy', 'milisekund'][getCzechForm(c)] },
      decimal: ','
    },
    da: {
      y: 'år',
      mo: function (c) { return 'måned' + (c !== 1 ? 'er' : '') },
      w: function (c) { return 'uge' + (c !== 1 ? 'r' : '') },
      d: function (c) { return 'dag' + (c !== 1 ? 'e' : '') },
      h: function (c) { return 'time' + (c !== 1 ? 'r' : '') },
      m: function (c) { return 'minut' + (c !== 1 ? 'ter' : '') },
      s: function (c) { return 'sekund' + (c !== 1 ? 'er' : '') },
      ms: function (c) { return 'millisekund' + (c !== 1 ? 'er' : '') },
      decimal: ','
    },
    de: {
      y: function (c) { return 'Jahr' + (c !== 1 ? 'e' : '') },
      mo: function (c) { return 'Monat' + (c !== 1 ? 'e' : '') },
      w: function (c) { return 'Woche' + (c !== 1 ? 'n' : '') },
      d: function (c) { return 'Tag' + (c !== 1 ? 'e' : '') },
      h: function (c) { return 'Stunde' + (c !== 1 ? 'n' : '') },
      m: function (c) { return 'Minute' + (c !== 1 ? 'n' : '') },
      s: function (c) { return 'Sekunde' + (c !== 1 ? 'n' : '') },
      ms: function (c) { return 'Millisekunde' + (c !== 1 ? 'n' : '') },
      decimal: ','
    },
    en: {
      y: function (c) { return 'year' + (c !== 1 ? 's' : '') },
      mo: function (c) { return 'month' + (c !== 1 ? 's' : '') },
      w: function (c) { return 'week' + (c !== 1 ? 's' : '') },
      d: function (c) { return 'day' + (c !== 1 ? 's' : '') },
      h: function (c) { return 'hour' + (c !== 1 ? 's' : '') },
      m: function (c) { return 'minute' + (c !== 1 ? 's' : '') },
      s: function (c) { return 'second' + (c !== 1 ? 's' : '') },
      ms: function (c) { return 'millisecond' + (c !== 1 ? 's' : '') },
      decimal: '.'
    },
    es: {
      y: function (c) { return 'año' + (c !== 1 ? 's' : '') },
      mo: function (c) { return 'mes' + (c !== 1 ? 'es' : '') },
      w: function (c) { return 'semana' + (c !== 1 ? 's' : '') },
      d: function (c) { return 'día' + (c !== 1 ? 's' : '') },
      h: function (c) { return 'hora' + (c !== 1 ? 's' : '') },
      m: function (c) { return 'minuto' + (c !== 1 ? 's' : '') },
      s: function (c) { return 'segundo' + (c !== 1 ? 's' : '') },
      ms: function (c) { return 'milisegundo' + (c !== 1 ? 's' : '') },
      decimal: ','
    },
    fi: {
      y: function (c) { return c === 1 ? 'vuosi' : 'vuotta' },
      mo: function (c) { return c === 1 ? 'kuukausi' : 'kuukautta' },
      w: function (c) { return 'viikko' + (c !== 1 ? 'a' : '') },
      d: function (c) { return 'päivä' + (c !== 1 ? 'ä' : '') },
      h: function (c) { return 'tunti' + (c !== 1 ? 'a' : '') },
      m: function (c) { return 'minuutti' + (c !== 1 ? 'a' : '') },
      s: function (c) { return 'sekunti' + (c !== 1 ? 'a' : '') },
      ms: function (c) { return 'millisekunti' + (c !== 1 ? 'a' : '') },
      decimal: ','
    },
    fr: {
      y: function (c) { return 'an' + (c !== 1 ? 's' : '') },
      mo: 'mois',
      w: function (c) { return 'semaine' + (c !== 1 ? 's' : '') },
      d: function (c) { return 'jour' + (c !== 1 ? 's' : '') },
      h: function (c) { return 'heure' + (c !== 1 ? 's' : '') },
      m: function (c) { return 'minute' + (c !== 1 ? 's' : '') },
      s: function (c) { return 'seconde' + (c !== 1 ? 's' : '') },
      ms: function (c) { return 'milliseconde' + (c !== 1 ? 's' : '') },
      decimal: ','
    },
    gr: {
      y: function (c) { return c === 1 ? 'χρόνος' : 'χρόνια' },
      mo: function (c) { return c === 1 ? 'μήνας' : 'μήνες' },
      w: function (c) { return c === 1 ? 'εβδομάδα' : 'εβδομάδες' },
      d: function (c) { return c === 1 ? 'μέρα' : 'μέρες' },
      h: function (c) { return c === 1 ? 'ώρα' : 'ώρες' },
      m: function (c) { return c === 1 ? 'λεπτό' : 'λεπτά' },
      s: function (c) { return c === 1 ? 'δευτερόλεπτο' : 'δευτερόλεπτα' },
      ms: function (c) { return c === 1 ? 'χιλιοστό του δευτερολέπτου' : 'χιλιοστά του δευτερολέπτου' },
      decimal: ','
    },
    hu: {
      y: 'év',
      mo: 'hónap',
      w: 'hét',
      d: 'nap',
      h: 'óra',
      m: 'perc',
      s: 'másodperc',
      ms: 'ezredmásodperc',
      decimal: ','
    },
    id: {
      y: 'tahun',
      mo: 'bulan',
      w: 'minggu',
      d: 'hari',
      h: 'jam',
      m: 'menit',
      s: 'detik',
      ms: 'milidetik',
      decimal: '.'
    },
    is: {
      y: 'ár',
      mo: function (c) { return 'mánuð' + (c !== 1 ? 'ir' : 'ur') },
      w: function (c) { return 'vik' + (c !== 1 ? 'ur' : 'a') },
      d: function (c) { return 'dag' + (c !== 1 ? 'ar' : 'ur') },
      h: function (c) { return 'klukkutím' + (c !== 1 ? 'ar' : 'i') },
      m: function (c) { return 'mínút' + (c !== 1 ? 'ur' : 'a') },
      s: function (c) { return 'sekúnd' + (c !== 1 ? 'ur' : 'a') },
      ms: function (c) { return 'millisekúnd' + (c !== 1 ? 'ur' : 'a') },
      decimal: '.'
    },
    it: {
      y: function (c) { return 'ann' + (c !== 1 ? 'i' : 'o') },
      mo: function (c) { return 'mes' + (c !== 1 ? 'i' : 'e') },
      w: function (c) { return 'settiman' + (c !== 1 ? 'e' : 'a') },
      d: function (c) { return 'giorn' + (c !== 1 ? 'i' : 'o') },
      h: function (c) { return 'or' + (c !== 1 ? 'e' : 'a') },
      m: function (c) { return 'minut' + (c !== 1 ? 'i' : 'o') },
      s: function (c) { return 'second' + (c !== 1 ? 'i' : 'o') },
      ms: function (c) { return 'millisecond' + (c !== 1 ? 'i' : 'o') },
      decimal: ','
    },
    ja: {
      y: '年',
      mo: '月',
      w: '週',
      d: '日',
      h: '時間',
      m: '分',
      s: '秒',
      ms: 'ミリ秒',
      decimal: '.'
    },
    ko: {
      y: '년',
      mo: '개월',
      w: '주일',
      d: '일',
      h: '시간',
      m: '분',
      s: '초',
      ms: '밀리 초',
      decimal: '.'
    },
    lt: {
      y: function (c) { return ((c % 10 === 0) || (c % 100 >= 10 && c % 100 <= 20)) ? 'metų' : 'metai' },
      mo: function (c) { return ['mėnuo', 'mėnesiai', 'mėnesių'][getLithuanianForm(c)] },
      w: function (c) { return ['savaitė', 'savaitės', 'savaičių'][getLithuanianForm(c)] },
      d: function (c) { return ['diena', 'dienos', 'dienų'][getLithuanianForm(c)] },
      h: function (c) { return ['valanda', 'valandos', 'valandų'][getLithuanianForm(c)] },
      m: function (c) { return ['minutė', 'minutės', 'minučių'][getLithuanianForm(c)] },
      s: function (c) { return ['sekundė', 'sekundės', 'sekundžių'][getLithuanianForm(c)] },
      ms: function (c) { return ['milisekundė', 'milisekundės', 'milisekundžių'][getLithuanianForm(c)] },
      decimal: ','
    },
    ms: {
      y: 'tahun',
      mo: 'bulan',
      w: 'minggu',
      d: 'hari',
      h: 'jam',
      m: 'minit',
      s: 'saat',
      ms: 'milisaat',
      decimal: '.'
    },
    nl: {
      y: 'jaar',
      mo: function (c) { return c === 1 ? 'maand' : 'maanden' },
      w: function (c) { return c === 1 ? 'week' : 'weken' },
      d: function (c) { return c === 1 ? 'dag' : 'dagen' },
      h: 'uur',
      m: function (c) { return c === 1 ? 'minuut' : 'minuten' },
      s: function (c) { return c === 1 ? 'seconde' : 'seconden' },
      ms: function (c) { return c === 1 ? 'milliseconde' : 'milliseconden' },
      decimal: ','
    },
    no: {
      y: 'år',
      mo: function (c) { return 'måned' + (c !== 1 ? 'er' : '') },
      w: function (c) { return 'uke' + (c !== 1 ? 'r' : '') },
      d: function (c) { return 'dag' + (c !== 1 ? 'er' : '') },
      h: function (c) { return 'time' + (c !== 1 ? 'r' : '') },
      m: function (c) { return 'minutt' + (c !== 1 ? 'er' : '') },
      s: function (c) { return 'sekund' + (c !== 1 ? 'er' : '') },
      ms: function (c) { return 'millisekund' + (c !== 1 ? 'er' : '') },
      decimal: ','
    },
    pl: {
      y: function (c) { return ['rok', 'roku', 'lata', 'lat'][getPolishForm(c)] },
      mo: function (c) { return ['miesiąc', 'miesiąca', 'miesiące', 'miesięcy'][getPolishForm(c)] },
      w: function (c) { return ['tydzień', 'tygodnia', 'tygodnie', 'tygodni'][getPolishForm(c)] },
      d: function (c) { return ['dzień', 'dnia', 'dni', 'dni'][getPolishForm(c)] },
      h: function (c) { return ['godzina', 'godziny', 'godziny', 'godzin'][getPolishForm(c)] },
      m: function (c) { return ['minuta', 'minuty', 'minuty', 'minut'][getPolishForm(c)] },
      s: function (c) { return ['sekunda', 'sekundy', 'sekundy', 'sekund'][getPolishForm(c)] },
      ms: function (c) { return ['milisekunda', 'milisekundy', 'milisekundy', 'milisekund'][getPolishForm(c)] },
      decimal: ','
    },
    pt: {
      y: function (c) { return 'ano' + (c !== 1 ? 's' : '') },
      mo: function (c) { return c !== 1 ? 'meses' : 'mês' },
      w: function (c) { return 'semana' + (c !== 1 ? 's' : '') },
      d: function (c) { return 'dia' + (c !== 1 ? 's' : '') },
      h: function (c) { return 'hora' + (c !== 1 ? 's' : '') },
      m: function (c) { return 'minuto' + (c !== 1 ? 's' : '') },
      s: function (c) { return 'segundo' + (c !== 1 ? 's' : '') },
      ms: function (c) { return 'milissegundo' + (c !== 1 ? 's' : '') },
      decimal: ','
    },
    ru: {
      y: function (c) { return ['лет', 'год', 'года'][getSlavicForm(c)] },
      mo: function (c) { return ['месяцев', 'месяц', 'месяца'][getSlavicForm(c)] },
      w: function (c) { return ['недель', 'неделя', 'недели'][getSlavicForm(c)] },
      d: function (c) { return ['дней', 'день', 'дня'][getSlavicForm(c)] },
      h: function (c) { return ['часов', 'час', 'часа'][getSlavicForm(c)] },
      m: function (c) { return ['минут', 'минута', 'минуты'][getSlavicForm(c)] },
      s: function (c) { return ['секунд', 'секунда', 'секунды'][getSlavicForm(c)] },
      ms: function (c) { return ['миллисекунд', 'миллисекунда', 'миллисекунды'][getSlavicForm(c)] },
      decimal: ','
    },
    uk: {
      y: function (c) { return ['років', 'рік', 'роки'][getSlavicForm(c)] },
      mo: function (c) { return ['місяців', 'місяць', 'місяці'][getSlavicForm(c)] },
      w: function (c) { return ['неділь', 'неділя', 'неділі'][getSlavicForm(c)] },
      d: function (c) { return ['днів', 'день', 'дні'][getSlavicForm(c)] },
      h: function (c) { return ['годин', 'година', 'години'][getSlavicForm(c)] },
      m: function (c) { return ['хвилин', 'хвилина', 'хвилини'][getSlavicForm(c)] },
      s: function (c) { return ['секунд', 'секунда', 'секунди'][getSlavicForm(c)] },
      ms: function (c) { return ['мілісекунд', 'мілісекунда', 'мілісекунди'][getSlavicForm(c)] },
      decimal: ','
    },
    sv: {
      y: 'år',
      mo: function (c) { return 'månad' + (c !== 1 ? 'er' : '') },
      w: function (c) { return 'veck' + (c !== 1 ? 'or' : 'a') },
      d: function (c) { return 'dag' + (c !== 1 ? 'ar' : '') },
      h: function (c) { return 'timm' + (c !== 1 ? 'ar' : 'e') },
      m: function (c) { return 'minut' + (c !== 1 ? 'er' : '') },
      s: function (c) { return 'sekund' + (c !== 1 ? 'er' : '') },
      ms: function (c) { return 'millisekund' + (c !== 1 ? 'er' : '') },
      decimal: ','
    },
    tr: {
      y: 'yıl',
      mo: 'ay',
      w: 'hafta',
      d: 'gün',
      h: 'saat',
      m: 'dakika',
      s: 'saniye',
      ms: 'milisaniye',
      decimal: ','
    },
    vi: {
      y: 'năm',
      mo: 'tháng',
      w: 'tuần',
      d: 'ngày',
      h: 'giờ',
      m: 'phút',
      s: 'giây',
      ms: 'mili giây',
      decimal: ','
    },
    zh_CN: {
      y: '年',
      mo: '个月',
      w: '周',
      d: '天',
      h: '小时',
      m: '分钟',
      s: '秒',
      ms: '毫秒',
      decimal: '.'
    },
    zh_TW: {
      y: '年',
      mo: '個月',
      w: '周',
      d: '天',
      h: '小時',
      m: '分鐘',
      s: '秒',
      ms: '毫秒',
      decimal: '.'
    }
  }

  // You can create a humanizer, which returns a function with default
  // parameters.
  function humanizer (passedOptions) {
    var result = function humanizer (ms, humanizerOptions) {
      var options = extend({}, result, humanizerOptions || {})
      return doHumanization(ms, options)
    }

    return extend(result, {
      language: 'en',
      delimiter: ', ',
      spacer: ' ',
      conjunction: '',
      serialComma: true,
      units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
      languages: {},
      round: false,
      unitMeasures: {
        y: 31557600000,
        mo: 2629800000,
        w: 604800000,
        d: 86400000,
        h: 3600000,
        m: 60000,
        s: 1000,
        ms: 1
      }
    }, passedOptions)
  }

  // The main function is just a wrapper around a default humanizer.
  var humanizeDuration = humanizer({})

  // doHumanization does the bulk of the work.
  function doHumanization (ms, options) {
    var i, len, piece

    // Make sure we have a positive number.
    // Has the nice sideffect of turning Number objects into primitives.
    ms = Math.abs(ms)

    var dictionary = options.languages[options.language] || languages[options.language]
    if (!dictionary) {
      throw new Error('No language ' + dictionary + '.')
    }

    var pieces = []

    // Start at the top and keep removing units, bit by bit.
    var unitName, unitMS, unitCount
    for (i = 0, len = options.units.length; i < len; i++) {
      unitName = options.units[i]
      unitMS = options.unitMeasures[unitName]

      // What's the number of full units we can fit?
      if (i + 1 === len) {
        unitCount = ms / unitMS
      } else {
        unitCount = Math.floor(ms / unitMS)
      }

      // Add the string.
      pieces.push({
        unitCount: unitCount,
        unitName: unitName
      })

      // Remove what we just figured out.
      ms -= unitCount * unitMS
    }

    var firstOccupiedUnitIndex = 0
    for (i = 0; i < pieces.length; i++) {
      if (pieces[i].unitCount) {
        firstOccupiedUnitIndex = i
        break
      }
    }

    if (options.round) {
      var ratioToLargerUnit, previousPiece
      for (i = pieces.length - 1; i >= 0; i--) {
        piece = pieces[i]
        piece.unitCount = Math.round(piece.unitCount)

        if (i === 0) { break }

        previousPiece = pieces[i - 1]

        ratioToLargerUnit = options.unitMeasures[previousPiece.unitName] / options.unitMeasures[piece.unitName]
        if ((piece.unitCount % ratioToLargerUnit) === 0 || (options.largest && ((options.largest - 1) < (i - firstOccupiedUnitIndex)))) {
          previousPiece.unitCount += piece.unitCount / ratioToLargerUnit
          piece.unitCount = 0
        }
      }
    }

    var result = []
    for (i = 0, pieces.length; i < len; i++) {
      piece = pieces[i]
      if (piece.unitCount) {
        result.push(render(piece.unitCount, piece.unitName, dictionary, options))
      }

      if (result.length === options.largest) { break }
    }

    if (result.length) {
      if (!options.conjunction || result.length === 1) {
        return result.join(options.delimiter)
      } else if (result.length === 2) {
        return result.join(options.conjunction)
      } else if (result.length > 2) {
        return result.slice(0, -1).join(options.delimiter) + (options.serialComma ? ',' : '') + options.conjunction + result.slice(-1)
      }
    } else {
      return render(0, options.units[options.units.length - 1], dictionary, options)
    }
  }

  function render (count, type, dictionary, options) {
    var decimal
    if (options.decimal === void 0) {
      decimal = dictionary.decimal
    } else {
      decimal = options.decimal
    }

    var countStr = count.toString().replace('.', decimal)

    var dictionaryValue = dictionary[type]
    var word
    if (typeof dictionaryValue === 'function') {
      word = dictionaryValue(count)
    } else {
      word = dictionaryValue
    }

    return countStr + options.spacer + word
  }

  function extend (destination) {
    var source
    for (var i = 1; i < arguments.length; i++) {
      source = arguments[i]
      for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
          destination[prop] = source[prop]
        }
      }
    }
    return destination
  }

  // Internal helper function for Czech language.
  function getCzechForm (c) {
    if (c === 1) {
      return 0
    } else if (Math.floor(c) !== c) {
      return 1
    } else if (c % 10 >= 2 && c % 10 <= 4 && c % 100 < 10) {
      return 2
    } else {
      return 3
    }
  }

  // Internal helper function for Polish language.
  function getPolishForm (c) {
    if (c === 1) {
      return 0
    } else if (Math.floor(c) !== c) {
      return 1
    } else if (c % 10 >= 2 && c % 10 <= 4 && !(c % 100 > 10 && c % 100 < 20)) {
      return 2
    } else {
      return 3
    }
  }

  // Internal helper function for Russian and Ukranian languages.
  function getSlavicForm (c) {
    if (Math.floor(c) !== c) {
      return 2
    } else if ((c % 100 >= 5 && c % 100 <= 20) || (c % 10 >= 5 && c % 10 <= 9) || c % 10 === 0) {
      return 0
    } else if (c % 10 === 1) {
      return 1
    } else if (c > 1) {
      return 2
    } else {
      return 0
    }
  }

  // Internal helper function for Lithuanian language.
  function getLithuanianForm (c) {
    if (c === 1 || (c % 10 === 1 && c % 100 > 20)) {
      return 0
    } else if (Math.floor(c) !== c || (c % 10 >= 2 && c % 100 > 20) || (c % 10 >= 2 && c % 100 < 10)) {
      return 1
    } else {
      return 2
    }
  }

  humanizeDuration.getSupportedLanguages = function getSupportedLanguages () {
    var result = []
    for (var language in languages) {
      if (languages.hasOwnProperty(language)) {
        result.push(language)
      }
    }
    return result
  }

  humanizeDuration.humanizer = humanizer

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return humanizeDuration
    })
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = humanizeDuration
  } else {
    this.humanizeDuration = humanizeDuration
  }
})();  // eslint-disable-line semi

},{}],23:[function(require,module,exports){
var split = require('browser-split')
var ClassList = require('class-list')

var w = typeof window === 'undefined' ? require('html-element') : window
var document = w.document
var Text = w.Text

function context () {

  var cleanupFuncs = []

  function h() {
    var args = [].slice.call(arguments), e = null
    function item (l) {
      var r
      function parseClass (string) {
        // Our minimal parser doesn’t understand escaping CSS special
        // characters like `#`. Don’t use them. More reading:
        // https://mathiasbynens.be/notes/css-escapes .

        var m = split(string, /([\.#]?[^\s#.]+)/)
        if(/^\.|#/.test(m[1]))
          e = document.createElement('div')
        forEach(m, function (v) {
          var s = v.substring(1,v.length)
          if(!v) return
          if(!e)
            e = document.createElement(v)
          else if (v[0] === '.')
            ClassList(e).add(s)
          else if (v[0] === '#')
            e.setAttribute('id', s)
        })
      }

      if(l == null)
        ;
      else if('string' === typeof l) {
        if(!e)
          parseClass(l)
        else
          e.appendChild(r = document.createTextNode(l))
      }
      else if('number' === typeof l
        || 'boolean' === typeof l
        || l instanceof Date
        || l instanceof RegExp ) {
          e.appendChild(r = document.createTextNode(l.toString()))
      }
      //there might be a better way to handle this...
      else if (isArray(l))
        forEach(l, item)
      else if(isNode(l))
        e.appendChild(r = l)
      else if(l instanceof Text)
        e.appendChild(r = l)
      else if ('object' === typeof l) {
        for (var k in l) {
          if('function' === typeof l[k]) {
            if(/^on\w+/.test(k)) {
              (function (k, l) { // capture k, l in the closure
                if (e.addEventListener){
                  e.addEventListener(k.substring(2), l[k], false)
                  cleanupFuncs.push(function(){
                    e.removeEventListener(k.substring(2), l[k], false)
                  })
                }else{
                  e.attachEvent(k, l[k])
                  cleanupFuncs.push(function(){
                    e.detachEvent(k, l[k])
                  })
                }
              })(k, l)
            } else {
              // observable
              e[k] = l[k]()
              cleanupFuncs.push(l[k](function (v) {
                e[k] = v
              }))
            }
          }
          else if(k === 'style') {
            if('string' === typeof l[k]) {
              e.style.cssText = l[k]
            }else{
              for (var s in l[k]) (function(s, v) {
                if('function' === typeof v) {
                  // observable
                  e.style.setProperty(s, v())
                  cleanupFuncs.push(v(function (val) {
                    e.style.setProperty(s, val)
                  }))
                } else
                  var match = l[k][s].match(/(.*)\W+!important\W*$/);
                  if (match) {
                    e.style.setProperty(s, match[1], 'important')
                  } else {
                    e.style.setProperty(s, l[k][s])
                  }
              })(s, l[k][s])
            }
          } else if(k === 'attrs') {
            for (var v in l[k]) {
              e.setAttribute(v, l[k][v])
            }
          }
          else if (k.substr(0, 5) === "data-") {
            e.setAttribute(k, l[k])
          } else {
            e[k] = l[k]
          }
        }
      } else if ('function' === typeof l) {
        //assume it's an observable!
        var v = l()
        e.appendChild(r = isNode(v) ? v : document.createTextNode(v))

        cleanupFuncs.push(l(function (v) {
          if(isNode(v) && r.parentElement)
            r.parentElement.replaceChild(v, r), r = v
          else
            r.textContent = v
        }))
      }

      return r
    }
    while(args.length)
      item(args.shift())

    return e
  }

  h.cleanup = function () {
    for (var i = 0; i < cleanupFuncs.length; i++){
      cleanupFuncs[i]()
    }
    cleanupFuncs.length = 0
  }

  return h
}

var h = module.exports = context()
h.context = context

function isNode (el) {
  return el && el.nodeName && el.nodeType
}

function forEach (arr, fn) {
  if (arr.forEach) return arr.forEach(fn)
  for (var i = 0; i < arr.length; i++) fn(arr[i], i)
}

function isArray (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]'
}



},{"browser-split":4,"class-list":8,"html-element":3}],24:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],25:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],26:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
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
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],27:[function(require,module,exports){
var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

var usage = 'insert-css: You need to provide a CSS string. Usage: insertCss(cssString[, options]).';

function insertCss(css, options) {
    options = options || {};

    if (css === undefined) {
        throw new Error(usage);
    }

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // strip potential UTF-8 BOM if css was read from a file
    if (css.charCodeAt(0) === 0xFEFF) { css = css.substr(1, css.length); }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
};

function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

module.exports = insertCss;
module.exports.insertCss = insertCss;

},{}],28:[function(require,module,exports){
/*! npm.im/intervalometer */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function intervalometer(cb, request, cancel, requestParameter) {
	var requestId;
	var previousLoopTime;
	function loop(now) {
		// must be requested before cb() because that might call .stop()
		requestId = request(loop, requestParameter);

		// called with "ms since last call". 0 on start()
		cb(now - (previousLoopTime || now));

		previousLoopTime = now;
	}
	return {
		start: function start() {
			if (!requestId) { // prevent double starts
				loop(0);
			}
		},
		stop: function stop() {
			cancel(requestId);
			requestId = null;
			previousLoopTime = 0;
		}
	};
}

function frameIntervalometer(cb) {
	return intervalometer(cb, requestAnimationFrame, cancelAnimationFrame);
}

function timerIntervalometer(cb, delay) {
	return intervalometer(cb, setTimeout, clearTimeout, delay);
}

exports.intervalometer = intervalometer;
exports.frameIntervalometer = frameIntervalometer;
exports.timerIntervalometer = timerIntervalometer;
},{}],29:[function(require,module,exports){
/*! npm.im/iphone-inline-video */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Symbol = _interopDefault(require('poor-mans-symbol'));
var intervalometer = require('intervalometer');

function preventEvent(element, eventName, toggleProperty, preventWithProperty) {
	function handler(e) {
		if (Boolean(element[toggleProperty]) === Boolean(preventWithProperty)) {
			e.stopImmediatePropagation();
			// console.log(eventName, 'prevented on', element);
		}
		delete element[toggleProperty];
	}
	element.addEventListener(eventName, handler, false);

	// Return handler to allow to disable the prevention. Usage:
	// const preventionHandler = preventEvent(el, 'click');
	// el.removeEventHandler('click', preventionHandler);
	return handler;
}

function proxyProperty(object, propertyName, sourceObject, copyFirst) {
	function get() {
		return sourceObject[propertyName];
	}
	function set(value) {
		sourceObject[propertyName] = value;
	}

	if (copyFirst) {
		set(object[propertyName]);
	}

	Object.defineProperty(object, propertyName, {get: get, set: set});
}

function proxyEvent(object, eventName, sourceObject) {
	sourceObject.addEventListener(eventName, function () { return object.dispatchEvent(new Event(eventName)); });
}

function dispatchEventAsync(element, type) {
	Promise.resolve().then(function () {
		element.dispatchEvent(new Event(type));
	});
}

// iOS 10 adds support for native inline playback + silent autoplay
var isWhitelisted = /iPhone|iPod/i.test(navigator.userAgent) && !matchMedia('(-webkit-video-playable-inline)').matches;

var ಠ = Symbol();
var ಠevent = Symbol();
var ಠplay = Symbol('nativeplay');
var ಠpause = Symbol('nativepause');

/**
 * UTILS
 */

function getAudioFromVideo(video) {
	var audio = new Audio();
	proxyEvent(video, 'play', audio);
	proxyEvent(video, 'playing', audio);
	proxyEvent(video, 'pause', audio);
	audio.crossOrigin = video.crossOrigin;

	// 'data:' causes audio.networkState > 0
	// which then allows to keep <audio> in a resumable playing state
	// i.e. once you set a real src it will keep playing if it was if .play() was called
	audio.src = video.src || video.currentSrc || 'data:';

	// if (audio.src === 'data:') {
	//   TODO: wait for video to be selected
	// }
	return audio;
}

var lastRequests = [];
var requestIndex = 0;
var lastTimeupdateEvent;

function setTime(video, time, rememberOnly) {
	// allow one timeupdate event every 200+ ms
	if ((lastTimeupdateEvent || 0) + 200 < Date.now()) {
		video[ಠevent] = true;
		lastTimeupdateEvent = Date.now();
	}
	if (!rememberOnly) {
		video.currentTime = time;
	}
	lastRequests[++requestIndex % 3] = time * 100 | 0 / 100;
}

function isPlayerEnded(player) {
	return player.driver.currentTime >= player.video.duration;
}

function update(timeDiff) {
	var player = this;
	// console.log('update', player.video.readyState, player.video.networkState, player.driver.readyState, player.driver.networkState, player.driver.paused);
	if (player.video.readyState >= player.video.HAVE_FUTURE_DATA) {
		if (!player.hasAudio) {
			player.driver.currentTime = player.video.currentTime + ((timeDiff * player.video.playbackRate) / 1000);
			if (player.video.loop && isPlayerEnded(player)) {
				player.driver.currentTime = 0;
			}
		}
		setTime(player.video, player.driver.currentTime);
	} else if (player.video.networkState === player.video.NETWORK_IDLE && !player.video.buffered.length) {
		// this should happen when the source is available but:
		// - it's potentially playing (.paused === false)
		// - it's not ready to play
		// - it's not loading
		// If it hasAudio, that will be loaded in the 'emptied' handler below
		player.video.load();
		// console.log('Will load');
	}

	// console.assert(player.video.currentTime === player.driver.currentTime, 'Video not updating!');

	if (player.video.ended) {
		delete player.video[ಠevent]; // allow timeupdate event
		player.video.pause(true);
	}
}

/**
 * METHODS
 */

function play() {
	// console.log('play');
	var video = this;
	var player = video[ಠ];

	// if it's fullscreen, use the native player
	if (video.webkitDisplayingFullscreen) {
		video[ಠplay]();
		return;
	}

	if (player.driver.src !== 'data:' && player.driver.src !== video.src) {
		// console.log('src changed on play', video.src);
		setTime(video, 0, true);
		player.driver.src = video.src;
	}

	if (!video.paused) {
		return;
	}
	player.paused = false;

	if (!video.buffered.length) {
		// .load() causes the emptied event
		// the alternative is .play()+.pause() but that triggers play/pause events, even worse
		// possibly the alternative is preventing this event only once
		video.load();
	}

	player.driver.play();
	player.updater.start();

	if (!player.hasAudio) {
		dispatchEventAsync(video, 'play');
		if (player.video.readyState >= player.video.HAVE_ENOUGH_DATA) {
			// console.log('onplay');
			dispatchEventAsync(video, 'playing');
		}
	}
}
function pause(forceEvents) {
	// console.log('pause');
	var video = this;
	var player = video[ಠ];

	player.driver.pause();
	player.updater.stop();

	// if it's fullscreen, the developer the native player.pause()
	// This is at the end of pause() because it also
	// needs to make sure that the simulation is paused
	if (video.webkitDisplayingFullscreen) {
		video[ಠpause]();
	}

	if (player.paused && !forceEvents) {
		return;
	}

	player.paused = true;
	if (!player.hasAudio) {
		dispatchEventAsync(video, 'pause');
	}
	if (video.ended) {
		video[ಠevent] = true;
		dispatchEventAsync(video, 'ended');
	}
}

/**
 * SETUP
 */

function addPlayer(video, hasAudio) {
	var player = video[ಠ] = {};
	player.paused = true; // track whether 'pause' events have been fired
	player.hasAudio = hasAudio;
	player.video = video;
	player.updater = intervalometer.frameIntervalometer(update.bind(player));

	if (hasAudio) {
		player.driver = getAudioFromVideo(video);
	} else {
		video.addEventListener('canplay', function () {
			if (!video.paused) {
				// console.log('oncanplay');
				dispatchEventAsync(video, 'playing');
			}
		});
		player.driver = {
			src: video.src || video.currentSrc || 'data:',
			muted: true,
			paused: true,
			pause: function () {
				player.driver.paused = true;
			},
			play: function () {
				player.driver.paused = false;
				// media automatically goes to 0 if .play() is called when it's done
				if (isPlayerEnded(player)) {
					setTime(video, 0);
				}
			},
			get ended() {
				return isPlayerEnded(player);
			}
		};
	}

	// .load() causes the emptied event
	video.addEventListener('emptied', function () {
		// console.log('driver src is', player.driver.src);
		var wasEmpty = !player.driver.src || player.driver.src === 'data:';
		if (player.driver.src && player.driver.src !== video.src) {
			// console.log('src changed to', video.src);
			setTime(video, 0, true);
			player.driver.src = video.src;
			// playing videos will only keep playing if no src was present when .play()’ed
			if (wasEmpty) {
				player.driver.play();
			} else {
				player.updater.stop();
			}
		}
	}, false);

	// stop programmatic player when OS takes over
	video.addEventListener('webkitbeginfullscreen', function () {
		if (!video.paused) {
			// make sure that the <audio> and the syncer/updater are stopped
			video.pause();

			// play video natively
			video[ಠplay]();
		} else if (hasAudio && !player.driver.buffered.length) {
			// if the first play is native,
			// the <audio> needs to be buffered manually
			// so when the fullscreen ends, it can be set to the same current time
			player.driver.load();
		}
	});
	if (hasAudio) {
		video.addEventListener('webkitendfullscreen', function () {
			// sync audio to new video position
			player.driver.currentTime = video.currentTime;
			// console.assert(player.driver.currentTime === video.currentTime, 'Audio not synced');
		});

		// allow seeking
		video.addEventListener('seeking', function () {
			if (lastRequests.indexOf(video.currentTime * 100 | 0 / 100) < 0) {
				// console.log('User-requested seeking');
				player.driver.currentTime = video.currentTime;
			}
		});
	}
}

function overloadAPI(video) {
	var player = video[ಠ];
	video[ಠplay] = video.play;
	video[ಠpause] = video.pause;
	video.play = play;
	video.pause = pause;
	proxyProperty(video, 'paused', player.driver);
	proxyProperty(video, 'muted', player.driver, true);
	proxyProperty(video, 'playbackRate', player.driver, true);
	proxyProperty(video, 'ended', player.driver);
	proxyProperty(video, 'loop', player.driver, true);
	preventEvent(video, 'seeking');
	preventEvent(video, 'seeked');
	preventEvent(video, 'timeupdate', ಠevent, false);
	preventEvent(video, 'ended', ಠevent, false); // prevent occasional native ended events
}

function enableInlineVideo(video, hasAudio, onlyWhitelisted) {
	if ( hasAudio === void 0 ) hasAudio = true;
	if ( onlyWhitelisted === void 0 ) onlyWhitelisted = true;

	if ((onlyWhitelisted && !isWhitelisted) || video[ಠ]) {
		return;
	}
	addPlayer(video, hasAudio);
	overloadAPI(video);
	video.classList.add('IIV');
	if (!hasAudio && video.autoplay) {
		video.play();
	}
	if (!/iPhone|iPod|iPad/.test(navigator.platform)) {
		console.warn('iphone-inline-video is not guaranteed to work in emulated environments');
	}
}

enableInlineVideo.isWhitelisted = isWhitelisted;

module.exports = enableInlineVideo;
},{"intervalometer":28,"poor-mans-symbol":41}],30:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],31:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":38}],32:[function(require,module,exports){
module.exports = isPowerOfTwo

function isPowerOfTwo(n) {
  return n !== 0 && (n & (n - 1)) === 0
}
},{}],33:[function(require,module,exports){
module.exports      = isTypedArray
isTypedArray.strict = isStrictTypedArray
isTypedArray.loose  = isLooseTypedArray

var toString = Object.prototype.toString
var names = {
    '[object Int8Array]': true
  , '[object Int16Array]': true
  , '[object Int32Array]': true
  , '[object Uint8Array]': true
  , '[object Uint8ClampedArray]': true
  , '[object Uint16Array]': true
  , '[object Uint32Array]': true
  , '[object Float32Array]': true
  , '[object Float64Array]': true
}

function isTypedArray(arr) {
  return (
       isStrictTypedArray(arr)
    || isLooseTypedArray(arr)
  )
}

function isStrictTypedArray(arr) {
  return (
       arr instanceof Int8Array
    || arr instanceof Int16Array
    || arr instanceof Int32Array
    || arr instanceof Uint8Array
    || arr instanceof Uint8ClampedArray
    || arr instanceof Uint16Array
    || arr instanceof Uint32Array
    || arr instanceof Float32Array
    || arr instanceof Float64Array
  )
}

function isLooseTypedArray(arr) {
  return names[toString.call(arr)]
}

},{}],34:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],35:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict";

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('keyMirror(...): Argument must be an object.');
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{}],36:[function(require,module,exports){

// Flat merge
module.exports = exports = function(host) {
	var donors = slice(arguments, 1);
	donors.forEach(function(donor) {
		Object.keys(donor).forEach(function(key) {
			host[key] = donor[key];
		});
	});
	return host;
};

// Flat, selective merge
exports.selective = function(keys, host) {
	var donors = slice(arguments, 1);
	donors.forEach(function(donor) {
		keys.forEach(function(key) {
			host[key] = donor[key];
		});
	});
	return host;
};

// Recursive merge
exports.recursive = function(host) {
	var donors = slice(arguments, 1);
	donors.forEach(function(donor) {
		Object.keys(donor).forEach(recurser(host, donor));
	});
	return host;
};

// Recursive, selective merge
exports.selective.recursive = function(keys, host) {
	var donors = slice(arguments, 1);
	donors.forEach(function(donor) {
		keys.forEach(recurser(host, donor));
	});
	return host;
};

// Helpers

function slice(arr, i) {
	return Array.prototype.slice.call(arr, i);
}

function isObj(value) {
	return !! (typeof value === 'object' && value);
}

function getType(value) {
	return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

function recurser(host, donor) {
	return function(key) {
		if (isObj(donor[key])) {
			if (isObj(host[key])) {
				exports.recursive(host[key], donor[key]);
			} else {
				var base = Array.isArray(donor[key]) ? [ ] : { };
				host[key] = exports.recursive(base, donor[key]);
			}
		} else {
			host[key] = donor[key];
		}
	};
}

/* End of file index.js */
/* Location: ./lib/index.js */

},{}],37:[function(require,module,exports){
'use strict';
var numberIsFinite = require('is-finite');

module.exports = Number.isInteger || function (x) {
	return numberIsFinite(x) && Math.floor(x) === x;
};

},{"is-finite":31}],38:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],39:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

},{"wrappy":73}],40:[function(require,module,exports){
exports.pause = function(ee, ms) {
  if (ee.paused) return;
  ee.paused = true;
  if (typeof ee._bufferedEvents === 'undefined') {
    ee._bufferedEvents = [];
  }
  
  ee._oldEmit = ee.emit;
  ee.emit = function() {
    ee._bufferedEvents.push(arguments);
  };

  if (ms) {
    setTimeout(function() { exports.resume(ee); }, ms);
  }
};

exports.resume = function(ee, ms) {
  if (!ee.paused) return;
  ee.paused = false;

  ee.emit = ee._oldEmit;
  for (var i = ee._bufferedEvents.length - 1; i >= 0; i--) {
    ee.emit.apply(ee, ee._bufferedEvents.pop());
  }

  if (ms) {
    setTimeout(function() { exports.pause(ee); }, ms);
  }
};


exports.createGroup = function() {
  var timers = [];
  var paused = false;
  var done = false;

  return {
    add: function(id) {
      if (typeof id.emit === 'undefined') {
        id.onDone(function() {
          timers.splice(timers.indexOf(id), 1);
          if (timers.length === 0) {
            done = true;
          }
        });
      }

      timers.push(id);
      return id;
    },

    setTimeout: function(fn, ms) {
      return this.add(exports.setTimeout(fn, ms));
    },

    setInterval: function(fn, ms) {
      return this.add(exports.setInterval(fn, ms));
    },

    pause: function(resumeIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.pause(id, resumeIn);
        } else {
          id.pause(resumeIn);
        }
      }
      paused = true;
    },

    resume: function(pauseIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.resume(id, pauseIn);
        } else {
          id.resume(pauseIn);
        }
      }
      paused = false;
    },

    clear: function() {
      for (var i = timers.length - 1; i >= 0; i--) {
        if (typeof timers[i].clear === 'function') {
          timers[i].clear();
        }
      }
    },

    isPaused: function() {
      return paused;
    },

    isDone: function() {
      return done;
    },
  
    timers: function() {
      return timers;
    }
  };
};

var timer = function(type, clear, fn, ms) {
  // allow fn and ms arguments to be switchabale
  // let the user decide the syntax
  if (typeof fn !== 'function') {
    var tmp = fn;
    fn = ms;
    ms = tmp;
  }

  var done = false;
  var countdownStart = Date.now();
  var nextTime = ms;
  var paused;
  var finished;
  var resumed;

  var wrapper = function() {
    countdownStart = Date.now();
    nextTime = ms;
    fn.apply();
    if (type === setTimeout) {
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    } else if (resumed) {
      resumed = false;
      id = setInterval(wrapper, ms);
    }
  };

  var id = type(wrapper, ms);

  return {
    pause: function(resumeIn) {
      if (done || paused) return;
      clear(id);
      paused = true;
      if (resumeIn) {
        setTimeout(this.resume, resumeIn);
      }
      return nextTime -= Date.now() - countdownStart;
    },

    resume: function(pauseIn) {
      if (done || !paused) return;
      paused = false;
      resumed = true;
      countdownStart = Date.now();
      if (pauseIn) {
        setTimeout(this.pause, pauseIn);
      }

      // calling setTimeout here and not type because
      // calling setInterval with the remaining time will continue to
      // call setInterval with that lessened time
      id = setTimeout(wrapper, nextTime);
    },

    next: function() {
      return nextTime - (paused ? 0 : Date.now() - countdownStart);
    },

    clear: function() {
      if (done) return;
      if (resumed) {
        clearTimeout(id);
      } else {
        clear(id);
      }
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    },

    isPaused: function() {
      return paused;
    },

    isDone: function() {
      return done;
    },

    onDone: function(fn) {
      finished = fn;
    }
  };
};

exports.setTimeout = function(fn, ms) {
  return timer(setTimeout, clearTimeout, fn, ms);
};

exports.setInterval = function(fn, ms) {
  return timer(setInterval, clearInterval, fn, ms);
};

},{}],41:[function(require,module,exports){
'use strict';

var index = typeof Symbol === 'undefined' ? function (description) {
	return '@' + (description || '@') + Math.random();
} : Symbol;

module.exports = index;
},{}],42:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

}).call(this,require('_process'))

},{"_process":43}],43:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
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

process.nextTick = function (fun) {
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
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],44:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

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
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":46,"./_stream_writable":48,"core-util-is":11,"inherits":26,"process-nextick-args":42}],45:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":47,"core-util-is":11,"inherits":26}],46:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var StringDecoder;

util.inherits(Readable, Stream);

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
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
  }
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

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
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = bufferShim.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
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
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
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
Readable.prototype.read = function (n) {
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
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
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
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
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
    processNextTick(maybeReadMore_, stream, state);
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
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
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

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

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
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
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
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
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

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
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
    processNextTick(resume_, stream, state);
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

Readable.prototype.pause = function () {
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
Readable.prototype.wrap = function (stream) {
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
Readable._fromList = fromList;

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
  var ret = bufferShim.allocUnsafe(n);
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
    processNextTick(endReadableNT, state, stream);
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
}).call(this,require('_process'))

},{"./_stream_duplex":44,"./internal/streams/BufferList":49,"_process":43,"buffer":6,"buffer-shims":5,"core-util-is":11,"events":18,"inherits":26,"isarray":34,"process-nextick-args":42,"string_decoder/":56,"util":3}],47:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

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

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

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

  // When the writable side finishes, then flush out anything remaining.
  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er, data) {
      done(stream, er, data);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
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
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
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
Transform.prototype._read = function (n) {
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

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data !== null && data !== undefined) stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":44,"core-util-is":11,"inherits":26}],48:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

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

  // drain event flag.
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

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
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
  } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = bufferShim.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
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
  if (sync) processNextTick(cb, er);else cb(er);

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
      asyncWrite(afterWrite, stream, state, finished, cb);
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

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
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
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
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
}).call(this,require('_process'))

},{"./_stream_duplex":44,"_process":43,"buffer":6,"buffer-shims":5,"core-util-is":11,"events":18,"inherits":26,"process-nextick-args":42,"util-deprecate":66}],49:[function(require,module,exports){
'use strict';

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

module.exports = BufferList;

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
  if (this.length === 0) return bufferShim.alloc(0);
  if (this.length === 1) return this.head.data;
  var ret = bufferShim.allocUnsafe(n >>> 0);
  var p = this.head;
  var i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};
},{"buffer":6,"buffer-shims":5}],50:[function(require,module,exports){
(function (process){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

if (!process.browser && process.env.READABLE_STREAM === 'disable' && Stream) {
  module.exports = Stream;
}

}).call(this,require('_process'))

},{"./lib/_stream_duplex.js":44,"./lib/_stream_passthrough.js":45,"./lib/_stream_readable.js":46,"./lib/_stream_transform.js":47,"./lib/_stream_writable.js":48,"_process":43}],51:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":47}],52:[function(require,module,exports){
'use strict';

var readystate = module.exports = require('./readystate')
  , win = (new Function('return this'))()
  , complete = 'complete'
  , root = true
  , doc = win.document
  , html = doc.documentElement;

//
// Bail out early if the document is already fully loaded. This means that this
// script is loaded after the onload event.
//
if (complete === doc.readyState) {
  return readystate.change(complete);
}

//
// Use feature detection to see what kind of browser environment we're dealing
// with. Old versions of Internet Explorer do not support the addEventListener
// interface so we can also safely assume that we need to fall back to polling.
//
var modern = !!doc.addEventListener
  , prefix = modern ? '' : 'on'
  , on = modern ? 'addEventListener' : 'attachEvent'
  , off = modern ? 'removeEventListener' : 'detachEvent';

if (!modern && 'function' === typeof html.doScroll) {
  try { root = !win.frameElement; }
  catch (e) {}

  if (root) (function polling() {
    try { html.doScroll('left'); }
    catch (e) { return setTimeout(polling, 50); }

    readystate.change('interactive');
  }());
}

/**
 * Handle the various of event listener calls.
 *
 * @param {Event} evt Simple DOM event.
 * @api private
 */
function change(evt) {
  evt = evt || win.event;

  if ('readystatechange' === evt.type) {
    readystate.change(doc.readyState);
    if (complete !== doc.readyState) return;
  }

  if ('load' === evt.type) readystate.change('complete');
  else readystate.change('interactive');

  //
  // House keeping, remove our assigned event listeners.
  //
  (evt.type === 'load' ? win : doc)[off](evt.type, change, false);
}

//
// Assign a shit load of event listeners so we can update our internal state.
//
doc[on](prefix +'DOMContentLoaded', change, false);
doc[on](prefix +'readystatechange', change, false);
win[on](prefix +'load', change, false);

},{"./readystate":53}],53:[function(require,module,exports){
'use strict';

/**
 * Generate a new prototype method which will the given function once the
 * desired state has been reached. The returned function accepts 2 arguments:
 *
 * - fn: The assigned function which needs to be called.
 * - context: Context/this value of the function we need to execute.
 *
 * @param {String} state The state we need to operate upon.
 * @returns {Function}
 * @api private
 */
function generate(state) {
  return function proxy(fn, context) {
    var rs = this;

    if (rs.is(state)) {
      setTimeout(function () {
        fn.call(context, rs.readyState);
      }, 0);
    } else {
      if (!rs._events[state]) rs._events[state] = [];
      rs._events[state].push({ fn: fn, context: context });
    }

    return rs;
  };
}

/**
 * RS (readyState) instance.
 *
 * @constructor
 * @api public
 */
function RS() {
  this.readyState = RS.UNKNOWN;
  this._events = {};
}

/**
 * The environment can be in different states. The following states are
 * generated:
 *
 * - ALL:         The I don't really give a fuck state.
 * - UNKNOWN:     We got an unknown readyState we should start listening for events.
 * - LOADING:     Environment is currently loading.
 * - INTERACTIVE: Environment is ready for modification.
 * - COMPLETE:    All resources have been loaded.
 *
 * Please note that the order of the `states` string/array is of vital
 * importance as it's used in the readyState check.
 *
 * @type {Number}
 * @private
 */
RS.states = 'ALL,UNKNOWN,LOADING,INTERACTIVE,COMPLETE'.split(',');

for (var s = 0, state; s < RS.states.length; s++) {
  state = RS.states[s];

  RS[state] = RS.prototype[state] = s;
  RS.prototype[state.toLowerCase()] = generate(state);
}

/**
 * A change in the environment has been detected so we need to change our
 * readyState and call assigned event listeners and those of the previous
 * states.
 *
 * @param {Number} state The new readyState that we detected.
 * @returns {RS}
 * @api private
 */
RS.prototype.change = function change(state) {
  state = this.clean(state, true);

  var j
    , name
    , i = 0
    , listener
    , rs = this
    , previously = rs.readyState;

  if (previously >= state) return rs;

  rs.readyState = state;

  for (; i < RS.states.length; i++) {
    if (i > state) break;
    name = RS.states[i];

    if (name in rs._events) {
      for (j = 0; j < rs._events[name].length; j++) {
        listener = rs._events[name][j];
        listener.fn.call(listener.context || rs, previously);
      }

      delete rs._events[name];
    }
  }

  return rs;
};

/**
 * Check if we're currently in a given readyState.
 *
 * @param {String|Number} state The required readyState.
 * @returns {Boolean} Indication if this state has been reached.
 * @api public
 */
RS.prototype.is = function is(state) {
  return this.readyState >= this.clean(state, true);
};

/**
 * Transform a state to a number or toUpperCase.
 *
 * @param {Mixed} state State to transform.
 * @param {Boolean} nr Change to number.
 * @returns {Mixed}
 * @api public
 */
RS.prototype.clean = function transform(state, nr) {
  var type = typeof state;

  if (nr) return 'number' !== type
  ? +RS[state.toUpperCase()] || 0
  : state;

  return ('number' === type ? RS.states[state] : state).toUpperCase();
};

//
// Expose the module.
//
module.exports = new RS();

},{}],54:[function(require,module,exports){
/**
 * request-frame - requestAnimationFrame & cancelAnimationFrame polyfill for optimal cross-browser development.
 * @version v1.5.3
 * @license MIT
 * Copyright Julien Etienne 2015 All Rights Reserved.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.requestFrame = factory());
}(this, (function () { 'use strict';

/**
 * @param  {String} type - request | cancel | native.
 * @return {Function} Timing function.
 */
function requestFrame(type) {
    // The only vendor prefixes required.
    var vendors = ['moz', 'webkit'];

    // Disassembled timing function abbreviations.
    var aF = 'AnimationFrame';
    var rqAF = 'Request' + aF;

    // Checks for firefox 4 - 10 function pair mismatch.
    var mozRAF = window.mozRequestAnimationFrame;
    var mozCAF = window.mozCancelAnimationFrame;
    var hasMozMismatch = mozRAF && !mozCAF;

    // Final assigned functions.
    var assignedRequestAnimationFrame;
    var assignedCancelAnimationFrame;

    // Initial time of the timing lapse.
    var previousTime = 0;

    var requestFrameMain;

    // Date.now polyfill, mainly for legacy IE versions.
    if (!Date.now) {
        Date.now = function () {
            return new Date().getTime();
        };
    }

    /**
     * hasIOS6RequestAnimationFrameBug.
     * @See {@Link https://gist.github.com/julienetie/86ac394ec41f1271ff0a}
     * - for Commentary.
     * @Copyright 2015 - Julien Etienne. 
     * @License: MIT.
     */
    function hasIOS6RequestAnimationFrameBug() {
        var webkitRAF = window.webkitRequestAnimationFrame;
        var rAF = window.requestAnimationFrame;

        // CSS/ Device with max for iOS6 Devices.
        var hasMobileDeviceWidth = screen.width <= 768 ? true : false;

        // Only supports webkit prefixed requestAnimtionFrane.
        var requiresWebkitprefix = !(webkitRAF && rAF);

        // iOS6 webkit browsers don't support performance now.
        var hasNoNavigationTiming = window.performance ? false : true;

        var iOS6Notice = 'setTimeout is being used as a substitiue for \n            requestAnimationFrame due to a bug within iOS 6 builds';

        var hasIOS6Bug = requiresWebkitprefix && hasMobileDeviceWidth && hasNoNavigationTiming;

        var bugCheckresults = function bugCheckresults(timingFnA, timingFnB, notice) {
            if (timingFnA || timingFnB) {
                console.warn(notice);
                return true;
            } else {
                return false;
            }
        };

        var displayResults = function displayResults(hasBug, hasBugNotice, webkitFn, nativeFn) {
            if (hasBug) {
                return bugCheckresults(webkitFn, nativeFn, hasBugNotice);
            } else {
                return false;
            }
        };

        return displayResults(hasIOS6Bug, iOS6Notice, webkitRAF, rAF);
    }

    /**
     * Native clearTimeout function.
     * @return {Function}
     */
    function clearTimeoutWithId(id) {
        clearTimeout(id);
    }

    /**
     * Based on a polyfill by Erik, introduced by Paul Irish & 
     * further improved by Darius Bacon.
     * @see  {@link http://www.paulirish.com/2011/
     * requestanimationframe-for-smart-animating}
     * @see  {@link https://github.com/darius/requestAnimationFrame/blob/
     * master/requestAnimationFrame.js}
     * @callback {Number} Timestamp.
     * @return {Function} setTimeout Function.
     */
    function setTimeoutWithTimestamp(callback) {
        var immediateTime = Date.now();
        var lapsedTime = Math.max(previousTime + 16, immediateTime);
        return setTimeout(function () {
            callback(previousTime = lapsedTime);
        }, lapsedTime - immediateTime);
    }

    /**
     * Queries the native function, prefixed function 
     * or use the setTimeoutWithTimestamp function.
     * @return {Function}
     */
    function queryRequestAnimationFrame() {
        if (Array.prototype.filter) {
            assignedRequestAnimationFrame = window['request' + aF] || window[vendors.filter(function (vendor) {
                if (window[vendor + rqAF] !== undefined) return vendor;
            }) + rqAF] || setTimeoutWithTimestamp;
        } else {
            return setTimeoutWithTimestamp;
        }
        if (!hasIOS6RequestAnimationFrameBug()) {
            return assignedRequestAnimationFrame;
        } else {
            return setTimeoutWithTimestamp;
        }
    }

    /**
     * Queries the native function, prefixed function 
     * or use the clearTimeoutWithId function.
     * @return {Function}
     */
    function queryCancelAnimationFrame() {
        var cancellationNames = [];
        if (Array.prototype.map) {
            vendors.map(function (vendor) {
                return ['Cancel', 'CancelRequest'].map(function (cancellationNamePrefix) {
                    cancellationNames.push(vendor + cancellationNamePrefix + aF);
                });
            });
        } else {
            return clearTimeoutWithId;
        }

        /**
         * Checks for the prefixed cancelAnimationFrame implementation.
         * @param  {Array} prefixedNames - An array of the prefixed names. 
         * @param  {Number} i - Iteration start point.
         * @return {Function} prefixed cancelAnimationFrame function.
         */
        function prefixedCancelAnimationFrame(prefixedNames, i) {
            var cancellationFunction = void 0;
            for (; i < prefixedNames.length; i++) {
                if (window[prefixedNames[i]]) {
                    cancellationFunction = window[prefixedNames[i]];
                    break;
                }
            }
            return cancellationFunction;
        }

        // Use truthly function
        assignedCancelAnimationFrame = window['cancel' + aF] || prefixedCancelAnimationFrame(cancellationNames, 0) || clearTimeoutWithId;

        // Check for iOS 6 bug
        if (!hasIOS6RequestAnimationFrameBug()) {
            return assignedCancelAnimationFrame;
        } else {
            return clearTimeoutWithId;
        }
    }

    function getRequestFn() {
        if (hasMozMismatch) {
            return setTimeoutWithTimestamp;
        } else {
            return queryRequestAnimationFrame();
        }
    }

    function getCancelFn() {
        return queryCancelAnimationFrame();
    }

    function setNativeFn() {
        if (hasMozMismatch) {
            window.requestAnimationFrame = setTimeoutWithTimestamp;
            window.cancelAnimationFrame = clearTimeoutWithId;
        } else {
            window.requestAnimationFrame = queryRequestAnimationFrame();
            window.cancelAnimationFrame = queryCancelAnimationFrame();
        }
    }

    /**
     * The type value "request" singles out firefox 4 - 10 and 
     * assigns the setTimeout function if plausible.
     */

    switch (type) {
        case 'request':
        case '':
            requestFrameMain = getRequestFn();
            break;

        case 'cancel':
            requestFrameMain = getCancelFn();
            break;

        case 'native':
            setNativeFn();
            break;
        default:
            throw new Error('RequestFrame parameter is not a type.');
    }
    return requestFrameMain;
}

return requestFrame;

})));

},{}],55:[function(require,module,exports){
module.exports = shift

function shift (stream) {
  var rs = stream._readableState
  if (!rs) return null
  return rs.objectMode ? stream.read() : stream.read(getStateLength(rs))
}

function getStateLength (state) {
  if (state.buffer.length) {
    // Since node 6.3.0 state.buffer is a BufferList not an array
    if (state.buffer.head) {
      return state.buffer.head.data.length
    }

    return state.buffer[0].length
  }

  return state.length
}

},{}],56:[function(require,module,exports){
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

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


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
var StringDecoder = exports.StringDecoder = function(encoding) {
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
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


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

},{"buffer":6}],57:[function(require,module,exports){
/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = require('emitter');
var RequestBase = require('./request-base');
var isObject = require('./is-object');
var isFunction = require('./is-function');
var ResponseBase = require('./response-base');

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function(method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only verison of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
      status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD'
      ? this._parseBody(this.text ? this.text : this.xhr.response)
      : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if(this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
        new_err.original = err;
        new_err.response = res;
        new_err.status = res.status;
      }
    } catch(e) {
      new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto',
    }
  }

  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options){
  if (this._data) {
    throw Error("superagent can't mix .send() and .attach()");
  }

  this._getFormData().append(field, file, options || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function(){
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */

Request.prototype._appendQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if (isFunction(this._sort)) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
}

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // querystring
  this._appendQueryString();

  this._setTimeouts();

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-function":58,"./is-object":59,"./request-base":60,"./response-base":61,"emitter":10}],58:[function(require,module,exports){
/**
 * Check if `fn` is a function.
 *
 * @param {Function} fn
 * @return {Boolean}
 * @api private
 */
var isObject = require('./is-object');

function isFunction(fn) {
  var tag = isObject(fn) ? Object.prototype.toString.call(fn) : '';
  return tag === '[object Function]';
}

module.exports = isFunction;

},{"./is-object":59}],59:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;

},{}],60:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  this._responseTimeout = 0;
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, read, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options){
  if (!options || 'object' !== typeof options) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  if ('undefined' !== typeof options.deadline) {
    this._timeout = options.deadline;
  }
  if ('undefined' !== typeof options.response) {
    this._responseTimeout = options.response;
  }
  return this;
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} reject
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

RequestBase.prototype.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
}

RequestBase.prototype.ok = function(cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function(res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function(){
  // This is browser-only functionality. Node side is no-op.
  this._withCredentials = true;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};


/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function(data){
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};


/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function(sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function(reason, timeout){
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function() {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self._timeoutError('Timeout of ', self._timeout);
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function(){
      self._timeoutError('Response timeout of ', self._responseTimeout);
    }, this._responseTimeout);
  }
}

},{"./is-object":59}],61:[function(require,module,exports){

/**
 * Module dependencies.
 */

var utils = require('./utils');

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function(field){
    return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function(header){
    // TODO: moar!
    // TODO: make this a util

    // content-type
    var ct = header['content-type'] || '';
    this.type = utils.type(ct);

    // params
    var params = utils.params(ct);
    for (var key in params) this[key] = params[key];

    this.links = {};

    // links
    try {
        if (header.link) {
            this.links = utils.parseLinks(header.link);
        }
    } catch (err) {
        // ignore
    }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = this.statusCode = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.redirect = 3 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = (4 == type || 5 == type)
        ? this.toError()
        : false;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.forbidden = 403 == status;
    this.notFound = 404 == status;
};

},{"./utils":62}],62:[function(require,module,exports){

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function(str){
  return str.split(/ *, */).reduce(function(obj, str){
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function(header, shouldStripCookie){
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  if (shouldStripCookie) {
    delete header['cookie'];
  }
  return header;
};

},{}],63:[function(require,module,exports){
(function (process){
var Transform = require('readable-stream/transform')
  , inherits  = require('util').inherits
  , xtend     = require('xtend')

function DestroyableTransform(opts) {
  Transform.call(this, opts)
  this._destroyed = false
}

inherits(DestroyableTransform, Transform)

DestroyableTransform.prototype.destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  
  var self = this
  process.nextTick(function() {
    if (err)
      self.emit('error', err)
    self.emit('close')
  })
}

// a noop _transform function
function noop (chunk, enc, callback) {
  callback(null, chunk)
}


// create a new export function, used by both the main export and
// the .ctor export, contains common logic for dealing with arguments
function through2 (construct) {
  return function (options, transform, flush) {
    if (typeof options == 'function') {
      flush     = transform
      transform = options
      options   = {}
    }

    if (typeof transform != 'function')
      transform = noop

    if (typeof flush != 'function')
      flush = null

    return construct(options, transform, flush)
  }
}


// main export, just make me a transform stream!
module.exports = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(options)

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})


// make me a reusable prototype that I can `new`, or implicitly `new`
// with a constructor call
module.exports.ctor = through2(function (options, transform, flush) {
  function Through2 (override) {
    if (!(this instanceof Through2))
      return new Through2(override)

    this.options = xtend(options, override)

    DestroyableTransform.call(this, this.options)
  }

  inherits(Through2, DestroyableTransform)

  Through2.prototype._transform = transform

  if (flush)
    Through2.prototype._flush = flush

  return Through2
})


module.exports.obj = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(xtend({ objectMode: true, highWaterMark: 16 }, options))

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})

}).call(this,require('_process'))

},{"_process":43,"readable-stream/transform":51,"util":69,"xtend":74}],64:[function(require,module,exports){
(function (Buffer){
/**
 * Convert a typed array to a Buffer without a copy
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install typedarray-to-buffer`
 */

var isTypedArray = require('is-typedarray').strict

module.exports = function typedarrayToBuffer (arr) {
  if (isTypedArray(arr)) {
    // To avoid a copy, use the typed array's underlying ArrayBuffer to back new Buffer
    var buf = new Buffer(arr.buffer)
    if (arr.byteLength !== arr.buffer.byteLength) {
      // Respect the "view", i.e. byteOffset and byteLength, without doing a copy
      buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength)
    }
    return buf
  } else {
    // Pass through all other types to the `Buffer` constructor
    return new Buffer(arr)
  }
}

}).call(this,require("buffer").Buffer)

},{"buffer":6,"is-typedarray":33}],65:[function(require,module,exports){
/**
 * UAParser.js v0.7.12
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.12',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var margedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    margedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    margedRegexes[i] = regexes[i];
                }
            }
            return margedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function () {

            var result, i = 0, j, k, p, q, matches, match, args = arguments;

            // loop through all regexes maps
            while (i < args.length && !matches) {

                var regex = args[i],       // even sequence (0,2,4,..)
                    props = args[i + 1];   // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof result === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        if (props.hasOwnProperty(p)){
                            q = props[p];
                            if (typeof q === OBJ_TYPE) {
                                result[q[0]] = undefined;
                            } else {
                                result[q] = undefined;
                            }
                        }
                    }
                }

                // try matching uastring with regexes
                j = k = 0;
                while (j < regex.length && !matches) {
                    matches = regex[j++].exec(this.getUA());
                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
            return result;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS
            ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
            ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /android.+samsungbrowser\/([\w\.]+)/i,
            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i,
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            /(qqbrowser)[\/\s]?([\w\.]+)/i
                                                                                // QQBrowser
            ], [NAME, VERSION], [

            /(uc\s?browser)[\/\s]?([\w\.]+)/i,
            /ucweb.+(ucbrowser)[\/\s]?([\w\.]+)/i,
            /juc.+(ucweb)[\/\s]?([\w\.]+)/i
                                                                                // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS
            ], [VERSION, [NAME, 'Facebook']], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /(?:sony)?(?:(?:(?:c|d)\d{4})|(?:so[-l].+))\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Phone'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /(nexus\s6p)/i                                                      // Huawei Nexus 6P
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w+)*/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w+)*/i                                                       // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w+)*/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i    // Xiaomi Mi
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [

            /android.+a000(1)\s+build/i                                         // OnePlus
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /\s(tablet)[;\/]/i,                                                 // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL]

            /*//////////////////////////
            // TODO: move to string map
            ////////////////////////////

            /(C6603)/i                                                          // Sony Xperia Z C6603
            ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
            /(C6903)/i                                                          // Sony Xperia Z 1
            ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
            ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
            ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
            ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G313HZ)/i                                                      // Samsung Galaxy V
            ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
            ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
            /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
            ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
            ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

            /(R1001)/i                                                          // Oppo R1001
            ], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [
            /(X9006)/i                                                          // Oppo Find 7a
            ], [[MODEL, 'Find 7a'], [VENDOR, 'Oppo'], [TYPE, MOBILE]], [
            /(R2001)/i                                                          // Oppo YOYO R2001
            ], [[MODEL, 'Yoyo R2001'], [VENDOR, 'Oppo'], [TYPE, MOBILE]], [
            /(R815)/i                                                           // Oppo Clover R815
            ], [[MODEL, 'Clover R815'], [VENDOR, 'Oppo'], [TYPE, MOBILE]], [
             /(U707)/i                                                          // Oppo Find Way S
            ], [[MODEL, 'Find Way S'], [VENDOR, 'Oppo'], [TYPE, MOBILE]], [

            /(T3C)/i                                                            // Advan Vandroid T3C
            ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
            ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
            ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

            /(V972M)/i                                                          // ZTE V972M
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

            /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
            ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
            /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
            ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

            /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
            ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

            /////////////
            // END TODO
            ///////////*/

        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                  // Haiku
            ], [NAME, VERSION],[

            /(ip[honead]+)(?:.*os\s([\w]+)*\slike\smac|;\sopera)/i              // iOS
            ], [[NAME, 'iOS'], [VERSION, /_/g, '.']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////


    var UAParser = function (uastring, extensions) {

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            var browser = mapper.rgx.apply(this, rgxmap.browser);
            browser.major = util.major(browser.version);
            return browser;
        };
        this.getCPU = function () {
            return mapper.rgx.apply(this, rgxmap.cpu);
        };
        this.getDevice = function () {
            return mapper.rgx.apply(this, rgxmap.device);
        };
        this.getEngine = function () {
            return mapper.rgx.apply(this, rgxmap.engine);
        };
        this.getOS = function () {
            return mapper.rgx.apply(this, rgxmap.os);
        };
        this.getResult = function() {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };


    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        } else {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window.jQuery || window.Zepto;
    if (typeof $ !== UNDEF_TYPE) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function() {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

},{}],66:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],67:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],68:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],69:[function(require,module,exports){
(function (process,global){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
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
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
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
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


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
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


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
      value.inspect !== exports.inspect &&
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
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
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
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

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
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":68,"_process":43,"inherits":67}],70:[function(require,module,exports){
'use strict';

// FUNCTIONS //

var isStr = Object.prototype.toString;


// IS FLOAT32ARRAY //

/**
* FUNCTION: isFloat32Array( value )
*	Validates if a value is a Float32Array.
*
* @param {*} value - value to validate
* @returns {Boolean} boolean indicating if a value is a Float32Array
*/
function isFloat32Array( value ) {
	return isStr.call( value ) === '[object Float32Array]';
} // end FUNCTION isFloat32Array()


// EXPORTS //

module.exports = isFloat32Array;

},{}],71:[function(require,module,exports){
(function (process,global,Buffer){
'use strict'

var through = require('through2')
var duplexify = require('duplexify')
var WS = require('ws')

module.exports = WebSocketStream

function WebSocketStream(target, protocols, options) {
  var stream, socket

  var isBrowser = process.title === 'browser'
  var isNative = !!global.WebSocket
  var socketWrite = isBrowser ? socketWriteBrowser : socketWriteNode
  var proxy = through.obj(socketWrite, socketEnd)

  if (protocols && !Array.isArray(protocols) && 'object' === typeof protocols) {
    // accept the "options" Object as the 2nd argument
    options = protocols
    protocols = null

    if (typeof options.protocol === 'string' || Array.isArray(options.protocol)) {
      protocols = options.protocol;
    }
  }

  if (!options) options = {}

  // browser only: sets the maximum socket buffer size before throttling
  var bufferSize = options.browserBufferSize || 1024 * 512

  // browser only: how long to wait when throttling
  var bufferTimeout = options.browserBufferTimeout || 1000

  // use existing WebSocket object that was passed in
  if (typeof target === 'object') {
    socket = target
  // otherwise make a new one
  } else {
    // special constructor treatment for native websockets in browsers, see
    // https://github.com/maxogden/websocket-stream/issues/82
    if (isNative && isBrowser) {
      socket = new WS(target, protocols)
    } else {
      socket = new WS(target, protocols, options)
    }

    socket.binaryType = 'arraybuffer'
  }

  // was already open when passed in
  if (socket.readyState === WS.OPEN) {
    stream = proxy
  } else {
    stream = duplexify.obj()
    socket.onopen = onopen
  }

  stream.socket = socket

  socket.onclose = onclose
  socket.onerror = onerror
  socket.onmessage = onmessage

  proxy.on('close', destroy)

  var coerceToBuffer = options.binary || options.binary === undefined

  function socketWriteNode(chunk, enc, next) {
    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = new Buffer(chunk, 'utf8')
    }
    socket.send(chunk, next)
  }

  function socketWriteBrowser(chunk, enc, next) {
    if (socket.bufferedAmount > bufferSize) {
      setTimeout(socketWriteBrowser, bufferTimeout, chunk, enc, next)
      return
    }

    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = new Buffer(chunk, 'utf8')
    }

    try {
      socket.send(chunk)
    } catch(err) {
      return next(err)
    }

    next()
  }

  function socketEnd(done) {
    socket.close()
    done()
  }

  function onopen() {
    stream.setReadable(proxy)
    stream.setWritable(proxy)
    stream.emit('connect')
  }

  function onclose() {
    stream.end()
    stream.destroy()
  }

  function onerror(err) {
    stream.destroy(err)
  }

  function onmessage(event) {
    var data = event.data
    if (data instanceof ArrayBuffer) data = new Buffer(new Uint8Array(data))
    else data = new Buffer(data)
    proxy.push(data)
  }

  function destroy() {
    socket.close()
  }

  return stream
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"_process":43,"buffer":6,"duplexify":15,"through2":63,"ws":72}],72:[function(require,module,exports){

var ws = null

if (typeof WebSocket !== 'undefined') {
  ws = WebSocket
} else if (typeof MozWebSocket !== 'undefined') {
  ws = MozWebSocket
} else {
  ws = window.WebSocket || window.MozWebSocket
}

module.exports = ws

},{}],73:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],74:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],75:[function(require,module,exports){
module.exports='@keyframes a{0%{opacity:.9}35%{opacity:.9}50%{opacity:.1}85%{opacity:.1}to{opacity:.9}}video::-webkit-media-controls-start-playback-button{display:none}.videomail .visuals{position:relative}.videomail .visuals video.replay{object-fit:scale-down}.videomail .replay,.videomail .userMedia{width:100%!important}.videomail .countdown,.videomail .pausedHeader,.videomail .pausedHint,.videomail .recordNote,.videomail .recordTimer{margin:0;height:auto}.videomail .countdown,.videomail .paused,.videomail .recordNote,.videomail .recordTimer,.videomail noscript{position:absolute}.videomail .countdown,.videomail .pausedHeader,.videomail .pausedHint,.videomail .recordNote,.videomail .recordTimer,.videomail noscript{font-weight:700}.videomail .countdown,.videomail .paused,.videomail noscript{width:100%;top:50%;transform:translateY(-50%)}.videomail .countdown,.videomail .pausedHeader,.videomail .pausedHint{text-align:center;text-shadow:0 0 2px #fff}.videomail .countdown,.videomail .pausedHeader{opacity:.85;font-size:440%}.videomail .pausedHint{font-size:150%}.videomail .recordNote,.videomail .recordTimer{right:.7em;background:hsla(0,0%,4%,.8);padding:.4em .4em .3em;transition:all 1s ease;color:#00d814;font-family:monospace;opacity:.9}.videomail .recordNote.near,.videomail .recordTimer.near{color:#eb9369}.videomail .recordNote.nigh,.videomail .recordTimer.nigh{color:#ea4b2a}.videomail .recordTimer{top:.7em}.videomail .recordNote{top:3.6em}.videomail .recordNote:before{content:"REC";animation:a 1s infinite}.videomail .notifier{overflow:hidden;box-sizing:border-box;height:100%}.videomail .radioGroup{display:block}.videomail video{margin-bottom:0}'
},{}],76:[function(require,module,exports){
var merge           = require('merge-recursive'),
    readystate      = require('readystate'),
    util            = require('util'),

    defaultOptions = require('./options'),
    Constants      = require('./constants'),
    Events         = require('./events'),
    CollectLogger  = require('./util/collectLogger'),
    EventEmitter   = require('./util/eventEmitter'),
    Container      = require('./wrappers/container'),
    OptionsWrapper = require('./wrappers/optionsWrapper'),
    Replay         = require('./wrappers/visuals/replay'),

    Browser         = require('./util/browser'),
    Resource        = require('./resource'),

    collectLogger,
    browser

function adjustOptions(options) {
    var localOptions = merge.recursive(defaultOptions, options || {})

    collectLogger = collectLogger || new CollectLogger(localOptions)

    localOptions.logger = collectLogger
    localOptions.debug  = localOptions.logger.debug

    OptionsWrapper.addFunctions(localOptions)

    return localOptions
}

function getBrowser(localOptions) {
    if (!browser)
        browser = new Browser(localOptions)

    return browser
}

var VideomailClient = function(options) {

    var localOptions = adjustOptions(options),
        container    = new Container(localOptions),
        replay

    EventEmitter.call(this, localOptions, 'VideomailClient')

    // expose all possible events
    this.events = Events

    function build() {
        readystate.interactive(function() {
            if (!container.isBuilt())
                container.build()
        })
    }

    this.show = function() {
        if (container.isBuilt())
            container.show()
        else
            this.once(Events.BUILT, container.show)
    }

    // automatically adds a <video> element inside the given parentElement and loads
    // it with the videomail
    this.replay = function(videomail, parentElement) {
        function buildReplay() {
            if (typeof parentElement === 'string')
                parentElement = document.getElementById(parentElement)

            // if there is none, use the automatically generated one
            if (!parentElement) {
                replay        = container.getReplay()
                parentElement = replay.getParentElement()
            } else {
                replay = new Replay(parentElement, localOptions)
                replay.build()
            }

            videomail = container.addPlayerDimensions(videomail, parentElement)

            if (videomail) {
                // slight delay needed to avoid HTTP 416 errors (request range unavailable)
                setTimeout(function() {
                    replay.setVideomail(videomail)

                    if (container.isOutsideElementOf(parentElement))
                        // replay element must be outside of the container
                        container.hideForm()
                    else
                        container.loadForm(videomail)

                    container.showReplayOnly()
                }, 150)
            }
        }

        readystate.interactive(buildReplay)
    }

    this.startOver = function() {
        replay && replay.hide()
        container.startOver()
    }

    this.unload = function(e) {
        container.unload(e)
    }

    this.hide = function() {
        container.hide()
    }

    this.get = function(key, cb) {
        new Resource(localOptions).get(key, function(err, videomail) {
            if (err)
                cb(err)
            else
                cb(null, container.addPlayerDimensions(videomail))
        })
    }

    this.canRecord = function() {
        return getBrowser(localOptions).canRecord()
    }

    // return true when a video has been recorded but is not sent yet
    this.isDirty = function() {
        return container.isDirty()
    }

    this.submit = function() {
        container.submit()
    }

    build()
}

util.inherits(VideomailClient, EventEmitter)

Object.keys(Constants.public).forEach(function(name) {
    VideomailClient[name] = Constants.public[name]
})

// just another convenient thing
VideomailClient.events = Events

module.exports = VideomailClient

},{"./constants":77,"./events":78,"./options":79,"./resource":80,"./util/browser":82,"./util/collectLogger":83,"./util/eventEmitter":84,"./wrappers/container":90,"./wrappers/optionsWrapper":93,"./wrappers/visuals/replay":102,"merge-recursive":36,"readystate":52,"util":69}],77:[function(require,module,exports){
// constants (changing these only break down functionality, so be careful)

module.exports = {
    SITE_NAME_LABEL:   'x-videomail-site-name',

    public: {
        ENC_TYPE_APP_JSON: 'application/json',
        ENC_TYPE_FORM:     'application/x-www-form-urlencoded'
    }
}

},{}],78:[function(require,module,exports){
var keymirror = require('keymirror')

module.exports = keymirror({
  BUILT:                null, // all dom elements are ready, are in the DOM
  FORM_READY:           null, // form is ready, available in the DOM
  LOADING_USER_MEDIA:   null, // asking for webcam access
  USER_MEDIA_READY:     null, // user media (= webcam) is ready, loaded
  CONNECTED:            null, // socket is connected to server
  COUNTDOWN:            null, // countdown for recording has started
  RECORDING:            null, // webcam is recording
  STOPPING:             null, // recording is being stopped (= preview)
  PROGRESS:             null, // start sending
  BEGIN_AUDIO_ENCODING: null, // encoding video
  BEGIN_VIDEO_ENCODING: null, // encoding video
  RESETTING:            null, // resetting everything to go back to initial state
  PAUSED:               null, // recording is being paused
  RESUMING:             null, // recording is resumed
  PREVIEW:              null, // video preview is set
  PREVIEW_SHOWN:        null, // video preview is shown
  REPLAY_SHOWN:         null, // submitted video is shown
  INVALID:              null, // form is invalid
  VALIDATING:           null, // form is being validated
  VALID:                null, // form is valid
  SUBMITTING:           null, // form is being submitted
  SUBMITTED:            null, // form has been successfully submitted
  ERROR:                null, // an error occured
  BLOCKING:             null, // something serious, most likely an error, is shown and blocks
  SENDING_FIRST_FRAME:  null, // emitted before the first frame is being computed
  FIRST_FRAME_SENT:     null, // emitted once when fist frame has been sent to server
  HIDE:                 null, // emitted when hidden
  NOTIFYING:            null, // notifies user about something (not blocking)
  ENABLING_AUDIO:       null, // about to enable audio
  DISABLING_AUDIO:      null, // about to disable audio
  LOADED_META_DATA:     null, // raised when webcam knows its dimensions
  EVENT_EMITTED:        null, // for debugging only, is emitted when an event is emitted lol,
  GOING_BACK   :        null  // going back, starting all over again
})

},{"keymirror":35}],79:[function(require,module,exports){
module.exports = {
    logger:          null,                   // define logging instance. leave null for default, console.
    logStackSize:    20,                     // limits the stack size of log outputs to collect
    verbose:         false,                  // set true to log more info
    baseUrl:         'https://videomail.io', // leave as it, permanent url to post videos
    socketUrl:       'wss://videomail.io',   // leave as it, permanent url to send frames
    siteName:        'videomail-client-demo',// Required for the API. If you change it, contact me
    cache:           true,                   // reduces GET queries when loading videos
    insertCss:       true,                   // inserts predefined CSS, see examples
    enablePause:     true,                   // enable pause/resume button
    enableAutoPause: true,                   // automatically pauses when window becomes inactive
    enableSpace:     true,                   // hitting space can pause recording
    disableSubmit:   false,                  // set this to true if you do not want to submit videos,
                                             // but just want to record and replay these temporarily
    enableAutoValidation: true,              // automatically validates all form inputs if any exist and
                                             // does not /enable disable submit button after recording
                                             // when something else seems invalid.

    enctype: 'application/json',             // enctype for the form submission. currently implemented are:
                                             // 'application/json' and 'application/x-www-form-urlencoded'

    // default CSS selectors you can alter, see examples
    selectors: {
        containerId:    'videomail',
        replayClass:    'replay',
        userMediaClass: 'userMedia',
        visualsClass:   'visuals',
        buttonClass:    null,                // can also be used as a default class for all buttons
        buttonsClass:   'buttons',

        recordButtonClass:      'record',
        pauseButtonClass:       'pause',
        resumeButtonClass:      'resume',
        previewButtonClass:     'preview',
        recordAgainButtonClass: 'recordAgain',
        submitButtonClass:      'submit',

        subjectInputName: 'subject',               // the form input name for subject
        fromInputName:    'from',                  // the form input name for the from email
        toInputName:      'to',                    // the form input name for the to email
        bodyInputName:    'body',                  // the form input name for the message (body)

        keyInputName:       'videomail_key',
        parentKeyInputName: 'videomail_parent_key',
        aliasInputName:     'videomail_alias',

        formId:         null,                    // automatically detects form if any
        submitButtonId: null                     // automatically detects submit button in the form
    },

    audio: {
        enabled:    false,      // set to true for experimential audio recording
        switch:     false,      // enables a switcher for audio recording (on/off)
        volume:     .30,        // must be between 0 .. 1 but 0.30 is recommeded to avoid
                                // distorting at the higher volume peaks
        bufferSize: 1024        // decides how often the audio is being sampled, must be a power of two.
                                // the higher the less traffic, but harder to adjust with rubberband
                                // to match with the video length on server side during encoding
    },

    video: {
        fps:          15,          // depends on your connection
        limitSeconds: 30,          // recording automatically stops after that limit
        countdown:    3,           // set it to 0 or false to disable it
        width:        'auto',      // or use an integer for exact pixels
        height:       'auto'       // or use an integer for exact pixels
    },

    image: {
        quality:    .35,
        types:      ['webp', 'jpeg']                // recommended settings to make most of all browsers
    },

    // alter these text for internationalisation
    text: {
        pausedHeader: 'Paused',
        pausedHint:   null,
        sending:      'Teleporting',
        encoding:     'Encoding',
        limitReached: 'Limit reached',
        buttons: {
            'record':       'Record video',
            'recordAgain':  'Record again',
            'resume':       'Resume',
            'pause':        'Pause',
            'preview':      'Preview'
        }
    },

    notifier: {
        entertain:         false,   // when true, user is entertained while waiting, see examples
        entertainClass:    'bg',
        entertainLimit:    6,
        entertainInterval: 9000
    },

    timeouts: {
        userMedia:    10e3,         // in milliseconds, increase if you want user give more time to enable webcam
        connection:   1e4,          // in seconds, increase if api is slow
        pingInterval: 45e3          // in milliseconds, keeps webstream (connection) alive when pausing
    },

    callbacks: {
        // a custom callback to tweak form data before posting to server
        // this is for advanced use only and shouldn't be used if possible
        adjustFormDataBeforePosting: null
    },

    defaults: {
        from:       null,   // define default FROM email address
        to:         null,   // define default TO email address
        subject:    null,   // define default subject line
        body:       null    // define default body content
    },

    // show errors inside the container?
    displayErrors: true,

    // true = all form inputs get disabled and disappear when browser can't record
    adjustFormOnBrowserError: false,

    // just for testing purposes to simulate browser agent handling
    fakeUaString: null
}

},{}],80:[function(require,module,exports){
var superagent = require('superagent'),
    Constants  = require('./constants'),
    CACHE_KEY  = 'alias'

module.exports = function(options) {

    var cache = {}

    function applyDefaultValue(videomail, name) {
        if (options.defaults[name] && !videomail[name])
            videomail[name] = options.defaults[name]

        return videomail
    }

    function applyDefaultValues(videomail) {
        if (options.defaults) {
            videomail = applyDefaultValue(videomail, 'from')
            videomail = applyDefaultValue(videomail, 'to')
            videomail = applyDefaultValue(videomail, 'subject')
            videomail = applyDefaultValue(videomail, 'body')
        }

        return videomail
    }

    function packError(err, res) {
        if (res && res.body && res.body.error) {
            // use the server generated text instead of the superagent's default text
            err = res.body.error

            if (!err.message && res.text)
                err.message = res.text
        }

        return err
    }

    function fetch(alias, cb) {
        superagent
            .get('/videomail/' + alias + '/snapshot')
            .set('Accept', 'application/json')
            .set(Constants.SITE_NAME_LABEL, options.siteName)
            .timeout(options.timeouts.connection)
            .end(function(err, res) {

                err = packError(err, res)

                if (err)
                    cb(err)
                else {
                    var videomail = res.body

                    if (options.cache)
                        cache[CACHE_KEY] = videomail

                    cb(null, videomail)
                }
            })
    }

    function write(method, videomail, identifier, cb) {

        if (!cb) {
            cb = identifier
            identifier = null
        }

        var url         = options.baseUrl + '/videomail/',
            queryParams = {},

            request

        if (identifier)
            url += identifier

        request = superagent(method, url)

        queryParams[Constants.SITE_NAME_LABEL] = options.siteName

        request
            .query(queryParams)
            .send(videomail)
            .timeout(options.timeout)
            .end(function(err, res) {

                err = packError(err, res)

                if (err)
                    cb(err)
                else {
                    if (options.cache && videomail[CACHE_KEY])
                        cache[videomail[CACHE_KEY]] = res.body.videomail

                    cb(null, res.body.videomail, res.body)
                }
            })
    }

    this.get = function(alias, cb) {
        if (options.cache && cache[alias])
            // keep all callbacks async
            setTimeout(function() {
                cb(null, cache[alias])
            }, 0)
        else
            fetch(alias, cb)
    }

    this.post = function(videomail, cb) {
        videomail = applyDefaultValues(videomail)

        if (options.callbacks.adjustFormDataBeforePosting) {
            options.callbacks.adjustFormDataBeforePosting(
                videomail,
                function(err, adjustedVideomail) {
                    if (err)
                        cb(err)
                    else
                        write('post', adjustedVideomail, cb)
                }
            )
        } else
            write('post', videomail, cb)
    }

    this.put = function(videomail, cb) {
        write('put', videomail, videomail.key, cb)
    }

    this.form = function(formData, url, cb) {

        var formType

        switch (options.enctype) {
            case Constants.public.ENC_TYPE_APP_JSON:
                formType = 'json'
                break
            case Constants.public.ENC_TYPE_FORM:
                formType = 'form'
                break
            default:
                // keep all callbacks async
                setTimeout(function () {
                    cb(new Error('Invalid enctype given: ' + options.enctype))
                }, 0)
        }

        if (formType) {
            superagent
                .post(url)
                .type(formType)
                .send(formData)
                .timeout(options.timeout)
                .end(function(err, res) {

                    err = packError(err, res)

                    if (err)
                        cb(err)
                    else
                        cb(null, res)
                })
        }
    }
}

},{"./constants":77,"superagent":57}],81:[function(require,module,exports){
var isPOT           = require('is-power-of-two'),
    AudioSample     = require('audio-sample'),

    VideomailError  = require('./videomailError'),

    CHANNELS = 1

module.exports = function(userMedia, options) {

    var scriptProcessor

    function getAudioContext() {
        // instantiate only once
        if (!window.audioContext) {
            var AudioContext = window.AudioContext || window.webkitAudioContext
            window.audioContext = new AudioContext
        }

        return window.audioContext
    }

    function onAudioProcess(e, cb) {
        if (!userMedia.isRecording() || userMedia.isPaused())
            return

        // Returns a Float32Array containing the PCM data associated with the channel,
        // defined by the channel parameter (with 0 representing the first channel)
        var float32Array = e.inputBuffer.getChannelData(0)

        cb(new AudioSample(float32Array))
    }

    this.init = function(localMediaStream) {

        // creates an audio node from the microphone incoming stream
        var volume     = getAudioContext().createGain(),
            channels   = CHANNELS,
            audioInput

        try {
            audioInput = getAudioContext().createMediaStreamSource(localMediaStream)
        } catch (exc) {
            throw VideomailError.create('Failed to access media for audio.', exc.toString(), options)
        }

        if (!isPOT(options.audio.bufferSize))
            throw VideomailError.create('Audio buffer size must be a power of two.', options)

        else if (!options.audio.volume || options.audio.volume > 1)
            throw VideomailError.create('Audio volume must be between zero and one.', options)

        volume.gain.value = options.audio.volume

        // Create a ScriptProcessorNode with the given bufferSize and
        // a single input and output channel
        scriptProcessor =
            getAudioContext().createScriptProcessor(
                options.audio.bufferSize,
                channels,
                channels
            )

        // connect stream to our scriptProcessor
        audioInput.connect(scriptProcessor)

        // connect our scriptProcessor to the previous destination
        scriptProcessor.connect(getAudioContext().destination)

        // connect volume
        audioInput.connect(volume)
        volume.connect(scriptProcessor)
    }

    this.record = function(cb) {
        options.debug('AudioRecorder: record()')

        scriptProcessor.onaudioprocess = function(e) {
            onAudioProcess(e, cb)
        }
    }

    this.stop = function() {
        options.debug('AudioRecorder: stop()')

        if (scriptProcessor)
            scriptProcessor.onaudioprocess = undefined
    }

    this.getSampleRate = function() {
        if (getAudioContext())
            return getAudioContext().sampleRate
        else
            return -1
    }
}

},{"./videomailError":88,"audio-sample":1,"is-power-of-two":32}],82:[function(require,module,exports){
var UAParser        = require('ua-parser-js'),
    defined         = require('defined'),
    VideomailError  = require('./videomailError')

module.exports = function(options) {

    options = options || {}

    var firefoxDownload  = 'http://www.mozilla.org/firefox/update/',
        edgeDownload     = 'https://www.microsoft.com/en-us/download/details.aspx?id=48126',
        chromeDownload   = 'http://www.google.com/chrome/',
        chromiumDownload = 'http://www.chromium.org/getting-involved/download-chromium',
        browseHappyLink  = 'http://browsehappy.com',
        ua               = defined(options.fakeUaString, (
                            typeof window !== 'undefined' &&
                            window.navigator &&
                            window.navigator.userAgent
                           ), ''),

        uaParser = new UAParser(ua).getResult(),

        isIOS         = uaParser.os.name === 'iOS',
        isChrome      = uaParser.browser.name === 'Chrome',
        isChromium    = uaParser.browser.name === 'Chromium',
        firefox       = uaParser.browser.name === 'Firefox',
        osVersion     = parseFloat(uaParser.os.version),
        isWindows     = uaParser.os.name === 'Windows',
        isEdge        = uaParser.browser.name === 'Edge' || (isWindows && osVersion >= 10),
        isIE          = /IE/.test(uaParser.browser.name),
        isSafari      = /Safari/.test(uaParser.browser.name),
        isOpera       = /Opera/.test(uaParser.browser.name),
        isAndroid     = /Android/.test(uaParser.os.name),
        chromeBased   = isChrome || isChromium,
        okBrowser     = chromeBased || firefox || isAndroid || isOpera || isEdge,

        self = this,

        videoType

    function getRecommendation() {
        var warning

        if (firefox)
            warning = 'Probably you need to <a href="' + firefoxDownload + '" target="_blank">' +
                      'upgrade Firefox</a> to fix this.'

        else if (isChrome)
            warning = 'Probably you need to <a href="' + chromeDownload + '" target="_blank">' +
                      'upgrade Chrome</a> to fix this.'

        else if (isChromium)
            warning = '<a href="' + chromiumDownload + '" target="_blank">' +
                      'Upgrade Chromium</a> to fix this.'

        else if (isIE)
            warning = 'Forget Internet Explorer!<br/>Better pick' +
                      ' <a href="' + chromeDownload + '" target="_blank">Chrome</a>,' +
                      ' <a href="' + firefoxDownload + '" target="_blank">Firefox</a>' +
                      ' or <a href="' + edgeDownload + '" target="_blank">Edge</a>.'

        else if (isSafari)
            warning = 'Safari has no webcam support yet.<br/>Better pick' +
                      ' <a href="' + chromeDownload + '" target="_blank">Chrome</a>' +
                      ' or <a href="' + firefoxDownload + '" target="_blank">Firefox</a>.'

        return warning
    }

    function getUserMediaWarning() {
        var warning

        if (isIOS)
            warning = 'On iPads/iPhones this feature is missing. ' +
                      'Here is <a href="http://caniuse.com/stream" target="_blank">' +
                      'evidence</a>.<br/><br/>For now, we recommend you to use a desktop computer or ' +
                      'an Android device.'

        else
            warning = getRecommendation()

        if (!warning) {
            if (self.isChromeBased() || self.isFirefox())
                warning = 'For that, your browser needs an <a href="' + browseHappyLink + '" target="_blank">upgrade</a>.'
            else
                warning = 'Hence we recommend you to use either ' +
                          '<a href="' + chromeDownload + '" target="_blank">Chrome</a>, ' +
                          '<a href="' + firefoxDownload + '" target="_blank">Firefox</a> or ' +
                          '<a href="' + edgeDownload + '" target="_blank">Edge</a> instead.'
        }

        warning = 'To access external webcams, your browser must support the ' +
                  '<a href="http://caniuse.com/#feat=stream" target="_blank">getUserMedia</a> feature.' +
                  '<br/><br/>' + warning

        return warning
    }

    function getPlaybackWarning() {
        var warning = getRecommendation()

        if (!warning)
            warning =   '<a href="' + browseHappyLink + '" target="_blank">Upgrading your browser</a> ' +
                        'might help.'

        return warning
    }

    function canPlayType(video, type) {
        var canPlayType

        if (video && video.canPlayType)
            canPlayType = video.canPlayType('video/' + type)

        return canPlayType
    }

    // just temporary
    this.canRecord = function() {
        var hasNavigator = typeof navigator !== 'undefined',
            canRecord = false

        if (hasNavigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            canRecord = true
        } else {
            var getUserMediaType = hasNavigator && typeof navigator.getUserMedia_

            canRecord = getUserMediaType == 'function'
        }

        return canRecord
    }

    this.checkRecordingCapabilities = function() {
        var err

        if (!okBrowser || !this.canRecord()) {
            err = VideomailError.create({
                message: 'Sorry, your browser has no webcam support',
            }, getUserMediaWarning(), options, true)
        }

        return err
    }

    this.checkPlaybackCapabilities = function(video) {
        var err,
            message

        if (!video)
            message = 'No HTML5 support for video tag!'

        else if (!this.getVideoType(video))
            message = 'No H264 nor webm support found.'

        if (message)
            err = VideomailError.create(message, getPlaybackWarning(), options)

        return err
    }

    this.checkBufferTypes = function() {
        var err

        if (typeof window === 'undefined' || typeof window.atob === 'undefined')
            err = VideomailError.create('atob is not supported', options)

        else if (typeof window.ArrayBuffer === 'undefined')
            err = VideomailError.create('ArrayBuffers are not supported', options)

        else if (typeof window.Uint8Array === 'undefined')
            err = VideomailError.create('Uint8Arrays are not supported', options)

        return err
    }

    this.getVideoType = function(video) {

        if (!videoType) {
            // there is a bug in canPlayType within chrome for mp4
            if (canPlayType(video, 'mp4') && !chromeBased)
                videoType = 'mp4'

            else if (canPlayType(video, 'webm'))
                videoType = 'webm'
        }

        return videoType
    }

    this.getNoAccessIssue = function() {
        var message = 'Cannot access webcam!',
            explanation

        if (this.isChromeBased())
            explanation = 'Click on the allow button to grant access to your webcam.'

        else if (this.isFirefox())
            explanation = 'Please share your webcam under Firefox.'

        else
            explanation = 'Your operating system does not let your browser access your webcam.'

        return VideomailError.create(message, explanation, options)
    }

    this.isChromeBased = function() {
        return chromeBased
    }

    this.isFirefox = function() {
        return firefox
    }

    this.isEdge = function() {
        return isEdge
    }
}

},{"./videomailError":88,"defined":13,"ua-parser-js":65}],83:[function(require,module,exports){
var util    = require('util'),
    Browser = require('./browser')

module.exports = function(localOptions) {

    localOptions = localOptions || {}

    var browser     = new Browser(localOptions),
        logger      = localOptions.logger || console,
        containerId = localOptions.selectors && localOptions.selectors.containerId || 'undefined container id',
        stack       = []

    function lifo(level, parameters) {
        var line = util.format.apply(util, parameters)

        if (stack.length > localOptions.logStackSize)
            stack.pop()

        stack.push('[' + level + '] ' +  line)

        return line
    }

    function addContainerId(firstArgument) {
        return '#' + containerId + ' > ' + firstArgument
    }

    // workaround: since we cannot overwrite console.log without having the correct file and line number
    // we'll use groupCollapsed() and trace() instead to get these.
    this.debug = function() {
        if (localOptions.verbose) {

            arguments[0] = addContainerId(arguments[0])

            var output = lifo('debug', arguments)

            if (browser.isFirefox()) {
                logger.debug(output)

            } else if (logger.groupCollapsed) {
                logger.groupCollapsed(output)
                logger.trace('Trace')
                logger.groupEnd()

            } else if (logger.debug) {
                logger.debug(output)

            } else {
                // last resort if everything else fails for any weird reasons
                console.log(output)
            }
        }
    }

    this.error = function() {
        arguments[0] = addContainerId(arguments[0])
        logger.error(lifo('error', arguments))
    }

    this.warn = function() {
        arguments[0] = addContainerId(arguments[0])
        logger.warn(lifo('warn', arguments))
    }

    this.getLines = function() {
        return stack
    }
}

},{"./browser":82,"util":69}],84:[function(require,module,exports){
var despot = require('despot'),

    VideomailError = require('./videomailError'),
    Events         = require('./../events')

// TODO: MAKE EVENT EMITTING IN DESPOT NOT GLOBAL BUT BY CONTAINER ID INSTEAD

module.exports = function(options, name) {

    this.emit = function(event) {

        var args = Array.prototype.slice.call(arguments, 0)

        if (!event)
            throw VideomailError.create('You cannot emit without an event.', options)

        // Automatically convert errors to videomail errors
        if (event === Events.ERROR) {
            var err = args[1]

            err = VideomailError.create(err, options)

            args[1] = err
        }

        if (options.debug)
            if (event != 'removeListener' && event != 'newListener') {
                var moreArguments

                if (args[1])
                    moreArguments = args.slice(1)

                if (moreArguments)
                    options.debug('%s emits: %s', name, event, moreArguments)
                else
                    options.debug('%s emits: %s', name, event)
            }

        var result = despot.emit.apply(despot, args)

        // Todo: have this emitted through a configuration because it is pretty noisy
        // if (event !== Events.EVENT_EMITTED)
        //     this.emit(Events.EVENT_EMITTED, event)

        return result
    }

    this.on = function(eventName, cb) {
        return despot.on(eventName, cb)
    }

    this.once = function(eventName, cb) {
        return despot.once(eventName, cb)
    }

    this.listeners = function(eventName) {
        return despot.listeners(eventName)
    }

    this.removeAllListeners = function() {
        despot.removeAllListeners()
    }
}

},{"./../events":78,"./videomailError":88,"despot":14}],85:[function(require,module,exports){
var filesize         = require('filesize'),
    humanizeDuration = require('humanize-duration')

module.exports = {
    filesize: function(bytes, round) {
        return filesize(bytes, {
            round: round
        })
    },

    toTime: function(t) {
        return humanizeDuration(t)
    }
}

},{"filesize":19,"humanize-duration":22}],86:[function(require,module,exports){
var DASH      = '- ',
    SEPARATOR = '<br/>' + DASH

function arrayToString(array) {
    if (array.length > 0) {
        var lines = []

        array.forEach(function(element) {
            if (element && element.toString)
                lines.push(element.toString())
        })

        return DASH + lines.join(SEPARATOR)
    }
}

function objectToString(object) {
    var propertyNames = Object.getOwnPropertyNames(object)

    if (propertyNames.length > 0) {
        var lines = []

        propertyNames.forEach(function(name) {
            if (object[name] && object[name].toString)
                lines.push(object[name].toString())
        })

        return DASH + lines.join(SEPARATOR)
    }
}

module.exports = function(anything) {
    if (anything === null)
        return 'null'

    else if (typeof anything === 'undefined')
        return 'undefined'

    else if (typeof anything === 'string')
        return anything

    else if (Array.isArray(anything))
        return arrayToString(anything)

    else if (typeof anything === 'object')
        return objectToString(anything)

    else
        return anything.toString()
}

},{}],87:[function(require,module,exports){
require('es5-shim')

module.exports = function(window, navigator) {

    if (typeof self !== "undefined")
        require('classlist.js')

    // https://github.com/julienetie/request-frame/issues/6
    window.screen = window.screen || {}

    // https://github.com/julienetie/request-frame
    require('request-frame')('native')

    // avoids warning "navigator.mozGetUserMedia has been replaced by navigator.mediaDevices.getUserMedia",
    // see https://github.com/binarykitchen/videomail-client/issues/79
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // do not shim
    } else {
        navigator.getUserMedia_ =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia
    }

    window.AudioContext = window.AudioContext || window.webkitAudioContext
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL

    var method,
        noop = function() {},
        methods = [
            'debug', 'groupCollapsed', 'groupEnd', 'error',
            'exception', 'info', 'log', 'trace', 'warn'
        ],
        length  = methods.length,
        console = (window.console = window.console || {})

    while (length--) {
        method = methods[length]

        if (!console[method]) console[method] = noop
    }
}

},{"classlist.js":9,"es5-shim":17,"request-frame":54}],88:[function(require,module,exports){
// https://github.com/tgriesser/create-error
var createError = require('create-error'),
    pretty      = require('./pretty'),

    VIDEOMAIL_ERR_NAME = 'Videomail Error'

var VideomailError = createError(Error, VIDEOMAIL_ERR_NAME, {
    'explanation': undefined,
    'logLines':    undefined
})

// static and public attribute of this class
VideomailError.PERMISSION_DENIED = 'PERMISSION_DENIED'
VideomailError.NOT_CONNECTED     = 'Not connected'
VideomailError.DOM_EXCEPTION     = 'DOMException'
VideomailError.STARTING_FAILED   = 'Starting video failed'

function stringify(anything) {
    if (anything) {
        if (typeof anything === 'string')
            return anything
        else if (Object.keys(anything).length > 0)
            return JSON.stringify(anything)
        else
            return anything.toString()
    } else
        return undefined
}

// static function to convert an error into a videomail error

VideomailError.create = function(err, explanation, options, isBrowserProblem) {
    if (err && err.name === VIDEOMAIL_ERR_NAME)
        return err

    if (!options && explanation) {
        options     = explanation
        explanation = undefined
    }

    options = options || {}

    // Require Browser here, not at the top of the file to avoid
    // recursion. Because the Browser class is requiring this file as well.
    var Browser = require('./browser'),
        browser = new Browser(options),

        errType,
        message,
        stack

    // whole code is ugly because all browsers behave so differently :(

    if (typeof(err) == 'object') {

        if (err.code == 1 && err.PERMISSION_DENIED == 1)
            errType = VideomailError.PERMISSION_DENIED

        else if (err.constructor && err.constructor.name == VideomailError.DOM_EXCEPTION)
            errType = VideomailError.DOM_EXCEPTION

        else if (err.message === VideomailError.STARTING_FAILED)
            errType = err.message

        else if (err.name)
            errType = err.name

        else if (err.type === 'error' && err.target.bufferedAmount === 0)
            errType = VideomailError.NOT_CONNECTED

    } else
        if (err === VideomailError.NOT_CONNECTED)
            errType = VideomailError.NOT_CONNECTED
        else
            errType = err

    if (err && err.stack)
        stack = err.stack

    switch (errType) {
        case 'NotFoundError':
        case 'NO_DEVICES_FOUND':
            message     = 'No webcam found'
            explanation = 'Your browser cannot find a webcam attached to your machine.'
            break

        case 'PermissionDismissedError':
            message     = 'Unknown permission!'
            explanation = 'Looks like you skipped the webcam permission dialogue.<br/>' +
                          'Please grant access next time the dialogue appears.'

            break

        case VideomailError.PERMISSION_DENIED:
        case 'PermissionDeniedError':
            message = 'Permission denied!'

            if (browser.isChromeBased() || browser.isFirefox() || browser.isEdge())
                explanation = 'Permission to access your webcam has been denied. ' +
                              'This can have two reasons:<br/>' +
                              'a) you blocked access to webcam; or<br/>' +
                              'b) your webcam is already in use.'
            break

        case 'HARDWARE_UNAVAILABLE':
            message     = 'Webcam is unavailable!'
            explanation = 'Maybe it is already busy in another window?'

            if (browser.isChromeBased())
                explanation += ' Or you have to allow access above?'
            break

        case VideomailError.NOT_CONNECTED:
            message     = 'Unable to transfer data'
            explanation = 'Unable to maintain a binary websocket to the server. Either the server or ' +
                          'your connection is down. Trying to reconnect every two seconds …'
            break

        case 'NO_VIDEO_FEED':
            message     = 'No video feed found!'
            explanation = 'Your webcam is already used in another browser.'
            break

        case VideomailError.STARTING_FAILED:
            message     = 'Starting video failed'
            explanation = 'Most likely this happens when the webam is already active in another browser.'
            break

        case 'DevicesNotFoundError':
            message     = 'Webcam is unavailable'
            explanation = 'Looks like another program has control over your webcam? Close it and come back.'
            break

        case VideomailError.DOM_EXCEPTION:
            message     = VideomailError.DOM_EXCEPTION
            explanation = stringify(err)
            break

        default:
            if (typeof err === 'string')
                message = err
            else {
                if (err && err.message)
                    message = stringify(err.message)

                if (err && err.explanation)
                    explanation = stringify(err.explanation)

                if (err && err.details) {
                    var details = pretty(err.details)

                    if (!explanation)
                        explanation = details
                    else
                        explanation += ';<br/>' + details
                }
            }

            // for weird, undefined cases
            if (!message) {
                message = errType

                if (!explanation)
                    explanation = stringify(err)

                if (message == explanation)
                    explanation = undefined
            }

            break
    }

    var logLines = null

    if (options.logger && options.logger.getLines)
        logLines = options.logger.getLines()

    if (stack) {
        message = new Error(message)
        message.stack = stack
    }

    var videomailError = new VideomailError(message, {
        explanation: explanation,
        logLines:    logLines
    })

    // add some public functions
    videomailError.isBrowserProblem = function() {
        return isBrowserProblem
    }

    return videomailError
}

module.exports = VideomailError

},{"./browser":82,"./pretty":86,"create-error":12}],89:[function(require,module,exports){
var util         = require('util'),
    h            = require('hyperscript'),
    hidden       = require('hidden'),

    Events       = require('./../events'),
    EventEmitter = require('./../util/eventEmitter')

var Buttons = function(container, options) {

    EventEmitter.call(this, options, 'Buttons')

    var self = this,

        buttonsElement,

        recordButton,
        pauseButton,
        resumeButton,
        previewButton,
        recordAgainButton,
        submitButton,

        audioOnRadioPair,
        audioOffRadioPair,

        built

    function hide(elements) {
        if (elements && !Array.isArray(elements)) {
            elements = [elements]
        }

        elements && elements.forEach(function(element) {
            hidden(element, true)
        })
    }

    function show(elements) {
        if (elements && !Array.isArray(elements)) {
            elements = [elements]
        }

        elements && elements.forEach(function(element) {
            hidden(element, false)
        })
    }

    function isShown(elements) {
        var isShown = elements && true

        if (elements && !Array.isArray(elements)) {
            elements = [elements]
        }

        elements && elements.forEach(function(element) {
            isShown = isShown && element && !hidden(element)
        })

        return isShown
    }

    function disable(elements) {
        if (elements && !Array.isArray(elements)) {
            elements = [elements]
        }

        elements && elements.forEach(function(element) {
            if (element.tagName == 'INPUT' || element.tagName == 'BUTTON')
                element.disabled = true
            else
                element.classList.add('disabled')
        })
    }

    function enable(elements) {
        if (elements && !Array.isArray(elements)) {
            elements = [elements]
        }

        elements && elements.forEach(function(element) {
            if (element.tagName == 'INPUT' || element.tagName == 'BUTTON')
                element.disabled = false
            else
                element.classList.remove('disabled')
        })
    }

    function adjustButton(buttonElement, show, type) {
        disable(buttonElement)

        buttonElement.type = type || 'button'

        !show && hide(buttonElement)

        return buttonElement
    }

    function replaceClickHandler(element, clickHandler) {

        var wrappedClickHandler = function(e) {
            e && e.preventDefault()
            clickHandler()
        }

        element.onclick = wrappedClickHandler
    }

    function makeRadioButtonPair(options) {
        var radioButtonElement,
            radioButtonGroup

        if (options.id)
            radioButtonElement = document.getElementById(options.id)

        if (!radioButtonElement) {

            radioButtonElement = h('input#' + options.id, {
                type:    'radio',
                name:    options.name,
                value:   options.value,
                checked: options.checked
            })

            radioButtonGroup = h('span.radioGroup', radioButtonElement, h('label', {
                'htmlFor': options.id
            }, options.label))

            // double check that submit button is already in the buttonsElement container
            if (submitButton && buttonsElement.contains(submitButton))
                buttonsElement.insertBefore(radioButtonGroup, submitButton)
            else
                buttonsElement.appendChild(radioButtonGroup)
        }

        if (options.changeHandler)
            radioButtonElement.onchange = options.changeHandler

        disable(radioButtonElement)

        return [radioButtonElement, radioButtonGroup]
    }

    function makeButton(buttonClass, text, clickHandler, show, id, type) {
        var buttonElement

        if (id)
            buttonElement = document.getElementById(id)
        else
            buttonElement = buttonsElement.querySelector('.' + buttonClass)

        if (!buttonElement) {
            if (options.selectors.buttonClass)
                buttonClass += '.' + options.selectors.buttonClass

            buttonElement = h('button.' + buttonClass)
            buttonElement = adjustButton(buttonElement, show, type)

            buttonElement.innerHTML = text

            // double check that submit button is already in the buttonsElement container
            if (submitButton && buttonsElement.contains(submitButton))
                buttonsElement.insertBefore(buttonElement, submitButton)
            else
                buttonsElement.appendChild(buttonElement)
        } else
            buttonElement = adjustButton(buttonElement, show, type)

        if (clickHandler)
            replaceClickHandler(buttonElement, clickHandler)

        return buttonElement
    }

    function buildButtons() {
        if (!options.disableSubmit) {
            if (!submitButton)
                submitButton = makeButton(
                    options.selectors.submitButtonClass,
                    'Submit',
                    null,
                    true,
                    options.selectors.submitButtonId,
                    'submit'
                )
            else
                disable(submitButton)

            // no need to listen to the submit event when it's already listened
            // within the form element class
            if (!container.hasForm() && submitButton)
                replaceClickHandler(submitButton, submit)
        }

        recordButton = makeButton(
            options.selectors.recordButtonClass,
            options.text.buttons.record,
            record,
            false
        )

        if (options.enablePause)
            pauseButton = makeButton(
                options.selectors.pauseButtonClass,
                options.text.buttons.pause,
                container.pause,
                false
            )

        if (options.enablePause)
            resumeButton = makeButton(
                options.selectors.resumeButtonClass,
                options.text.buttons.resume,
                container.resume,
                false
            )

        // show stop only when pause is enabled - looks better that way otherwise button
        // move left and right between record and stop (preview)
        previewButton = makeButton(
            options.selectors.previewButtonClass,
            options.text.buttons.preview,
            container.stop,
            false
        )

        recordAgainButton = makeButton(
            options.selectors.recordAgainButtonClass,
            options.text.buttons.recordAgain,
            recordAgain,
            false
        )

        if (options.audio && options.audio.switch) {
            audioOffRadioPair = makeRadioButtonPair({
                id:            'audioOffOption',
                name:          'audio',
                value:         'off',
                label:         'Audio Off',
                checked:       !options.isAudioEnabled(),
                changeHandler: function() {
                    container.disableAudio()
                }
            })

            audioOnRadioPair = makeRadioButtonPair({
                id:            'audioOnOption',
                name:          'audio',
                value:         'on',
                label:         'Audio On (Beta)',
                checked:       options.isAudioEnabled(),
                changeHandler: function() {
                    container.enableAudio()
                }
            })
        }
    }

    function onFormReady(options) {
        // no need to show record button when doing a record again
        if (!isShown(recordAgainButton)) {
            if (!options.paused)
                show(recordButton)
        }

        if (!options.paused) {
            disable(previewButton)
            hide(previewButton)
        }
    }

    function onGoingBack() {
        hide(recordAgainButton)
        show(recordButton)
    }

    function onReplayShown() {
        self.hide()
    }

    function onUserMediaReady(options) {
        onFormReady(options)

        if (isShown(recordButton))
            enable(recordButton)

        if (isShown(audioOnRadioPair))
            enable(audioOnRadioPair)

        if (isShown(audioOffRadioPair))
            enable(audioOffRadioPair)

        disable(submitButton)
    }

    function onResetting() {
        disable(submitButton)

        self.reset()
    }

    function onPreview() {
        hide(recordButton)
        hide(previewButton)
        disable(audioOnRadioPair)
        disable(audioOffRadioPair)

        show(recordAgainButton)
        enable(recordAgainButton)
    }

    this.enableSubmit = function() {
        enable(submitButton)
    }

    this.adjustButtonsForPause = function() {
        pauseButton && hide(pauseButton)
        show(resumeButton)
        enable(resumeButton)
        hide(recordButton)
        show(previewButton)
        enable(previewButton)
    }

    function onFirstFrameSent() {
        hide(recordButton)
        hide(recordAgainButton)

        if (pauseButton) {
            show(pauseButton)
            enable(pauseButton)
        }

        enable(previewButton)
        show(previewButton)
    }

    function onRecording(framesCount) {
        // it is possible to hide while recording, hence
        // check framesCount first (coming from recorder)
        if (framesCount > 1)
            onFirstFrameSent()
        else {
            disable(audioOffRadioPair)
            disable(audioOnRadioPair)
            disable(recordAgainButton)
            disable(recordButton)
        }
    }

    function onResuming() {
        hide(resumeButton)
        hide(recordButton)

        if (pauseButton) {
            enable(pauseButton)
            show(pauseButton)
        }
    }

    function onStopping() {
        disable(previewButton)
        hide(pauseButton)
        hide(resumeButton)
    }

    function onCountdown() {
        disable(recordButton)
        disable(audioOffRadioPair)
        disable(audioOnRadioPair)
    }

    function onSubmitting() {
        disable(submitButton)
        disable(recordAgainButton)
    }

    function onSubmitted() {
        disable(previewButton)
        disable(recordAgainButton)
        disable(recordButton)
        disable(submitButton)
    }

    function onInvalid() {
        if (options.enableAutoValidation)
            disable(submitButton)
    }

    function onValid() {
        if (options.enableAutoValidation)
            enable(submitButton)
    }

    function onHidden() {
        hide(recordButton)
        hide(previewButton)
        hide(recordAgainButton)
        hide(resumeButton)
    }

    function recordAgain() {
        disable(recordAgainButton)
        container.beginWaiting()
        container.recordAgain()
    }

    function submit() {
        container.submit()
    }

    function record() {
        disable(recordButton)
        container.record()
    }

    function initEvents() {
        self.on(Events.USER_MEDIA_READY, function(options) {
            onUserMediaReady(options)
        }).on(Events.PREVIEW, function() {
            onPreview()
        }).on(Events.PAUSED, function() {
            self.adjustButtonsForPause()
        }).on(Events.RECORDING, function(framesCount) {
            onRecording(framesCount)
        }).on(Events.FIRST_FRAME_SENT, function() {
            onFirstFrameSent()
        }).on(Events.RESUMING, function() {
            onResuming()
        }).on(Events.STOPPING, function() {
            onStopping()
        }).on(Events.COUNTDOWN, function() {
            onCountdown()
        }).on(Events.SUBMITTING, function() {
            onSubmitting()
        }).on(Events.RESETTING, function() {
            onResetting()
        }).on(Events.INVALID, function() {
            onInvalid()
        }).on(Events.VALID, function() {
            onValid()
        }).on(Events.SUBMITTED, function() {
            onSubmitted()
        }).on(Events.HIDE, function() {
            onHidden()
        }).on(Events.FORM_READY, function(options) {
            onFormReady(options)
        }).on(Events.REPLAY_SHOWN, function() {
            onReplayShown()
        }).on(Events.GOING_BACK, function() {
            onGoingBack()
        }).on(Events.ERROR, function(err) {
            // since https://github.com/binarykitchen/videomail-client/issues/60
            // we hide areas to make it easier for the user
            if (err.isBrowserProblem && err.isBrowserProblem() &&
                options.adjustFormOnBrowserError) {
                self.hide()
            }
        })
    }

    this.reset = function() {
        options.debug('Buttons: reset()')

        disable(pauseButton)
        disable(resumeButton)
        disable(recordButton)
        disable(previewButton)
        disable(recordAgainButton)
    }

    this.isRecordAgainButtonEnabled = function() {
        return !recordAgainButton.disabled
    }

    this.isRecordButtonEnabled = function() {
        return !recordButton.disabled
    }

    this.setSubmitButton = function(newSubmitButton) {
        submitButton = newSubmitButton
    }

    this.getSubmitButton = function() {
        return submitButton
    }

    this.build = function() {
        buttonsElement = container.querySelector('.' + options.selectors.buttonsClass)

        if (!buttonsElement) {
            buttonsElement = h('div.' + options.selectors.buttonsClass)

            container.appendChild(buttonsElement)
        }

        buildButtons()

        !built && initEvents()

        built = true
    }

    this.unload = function() {
        built = false
    }

    this.hide = function() {
        hide(buttonsElement)
    }

    this.show = function() {
        show(buttonsElement)
    }
}

util.inherits(Buttons, EventEmitter)

module.exports = Buttons

},{"./../events":78,"./../util/eventEmitter":84,"hidden":21,"hyperscript":23,"util":69}],90:[function(require,module,exports){
var insertCss      = require('insert-css'),
    merge          = require('merge-recursive'),
    hidden         = require('hidden'),
    util           = require('util'),

    Dimension      = require('./dimension'),
    Visuals        = require('./visuals'),
    Buttons        = require('./buttons'),
    Form           = require('./form'),

    Resource       = require('./../resource'),
    Events         = require('./../events'),

    EventEmitter   = require('./../util/eventEmitter'),
    VideomailError = require('./../util/videomailError'),
    css            = require('./../assets/css/main.min.css.js')

var Container = function(options) {

    EventEmitter.call(this, options, 'Container')

    var self  = this,

        visuals         = new Visuals(this, options),
        buttons         = new Buttons(this, options),
        resource        = new Resource(options),
        htmlElement     = document && document.querySelector && document.querySelector('html'),
        debug           = options.debug,
        hasError        = false,
        submitted       = false,
        lastValidation  = false,

        containerElement,
        built,
        form

    function prependDefaultCss() {
        insertCss(css, {prepend: true})
    }

    // since https://github.com/binarykitchen/videomail-client/issues/87
    function findParentFormElement() {
        return containerElement.closest('form')
    }

    function getFormElement() {
        var formElement

        if (containerElement.tagName === 'FORM')
            formElement = containerElement

        else if (options.selectors.formId)
            formElement = document.getElementById(options.selectors.formId)

        else
            formElement = findParentFormElement()

        return formElement
    }

    function buildForm() {
        var formElement = getFormElement()

        if (formElement) {
            form = new Form(self, formElement, options)

            var submitButton = form.findSubmitButton()
            submitButton && buttons.setSubmitButton(submitButton)

            form.build()
        }
    }

    function buildChildren() {
        if (!containerElement.classList)
            self.emit(Events.ERROR, new Error('Sorry, your browser is too old!'))
        else {
            containerElement.classList.add('videomail')

            buttons.build()
            visuals.build()
        }
    }

    function processError(err) {
        hasError = true

        if (err.stack)
            options.logger.error(err.stack)
        else
            options.logger.error(err)

        if (options.displayErrors)
            visuals.error(err)
        else
            visuals.reset()
    }

    function initEvents() {
        window.addEventListener('beforeunload', function(e) {
            self.unload(e)
        })

        if (options.enablePause && options.enableAutoPause)
            window.addEventListener('blur', function(e) {
                self.isRecording() && self.pause(e)
            })

        if (options.enableSpace)
            window.addEventListener('keypress', function(e) {
                var tagName = e.target.tagName

                if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {

                    var code = e.keyCode ? e.keyCode : e.which

                    if (code == 32) {
                        e.preventDefault()

                        if (options.enablePause)
                            visuals.pauseOrResume()
                        else
                            visuals.recordOrStop()
                    }
                }
            })

        // better to keep the one and only error listeners
        // at one spot, here, because unload() will do a removeAllListeners()
        self
            .on(Events.ERROR, function(err) {
                processError(err)
                unloadButKeepEventListeners(err)

                if (err.isBrowserProblem && err.isBrowserProblem())
                    removeDimensions()
            })
            .on(Events.LOADED_META_DATA, function() {
                correctDimensions()
            })
    }

    // this will just set the width but not the height because
    // it can be a form with more inputs elements
    function correctDimensions() {
        var width = visuals.getRecorderWidth(true);

        if (width < 1)
            throw VideomailError.create('Recorder width cannot be less than 1!')
        else
            containerElement.style.width = width + 'px'
    }

    function removeDimensions() {
        containerElement.style.width = 'auto'
    }

    function unloadButKeepEventListeners(e) {
        visuals.unload(e)
        buttons.unload()
        self.endWaiting()
    }

    function hideMySelf() {
        hidden(containerElement, true)
    }

    // fixes https://github.com/binarykitchen/videomail-client/issues/71
    function trimEmail(email) {
        return email.replace(/(^[,\s]+)|([,\s]+$)/g, '')
    }

    function submitVideomail(formData, method, cb) {
        var FORM_FIELDS = {
                'subject':      options.selectors.subjectInputName,
                'from':         options.selectors.fromInputName,
                'to':           options.selectors.toInputName,
                'body':         options.selectors.bodyInputName,
                'key':          options.selectors.keyInputName,
                'parentKey':    options.selectors.parentKeyInputName
            },
            videomailFormData = {}

        Object.keys(FORM_FIELDS).forEach(function(key) {
            if (formData.hasOwnProperty(FORM_FIELDS[key]))
                videomailFormData[key] = formData[FORM_FIELDS[key]]
        })

        if (videomailFormData['from'])
            videomailFormData['from'] = trimEmail(videomailFormData['from'])

        if (videomailFormData['to'])
            videomailFormData['to'] = trimEmail(videomailFormData['to'])

        // when method is undefined, treat it as a post
        if (isPost(method) || !method) {
            videomailFormData.avgFps         = visuals.getAvgFps()
            videomailFormData.recordingStats = visuals.getRecordingStats()
            videomailFormData.width          = visuals.getRecorderWidth()
            videomailFormData.height         = visuals.getRecorderHeight()

            if (options.isAudioEnabled())
                videomailFormData.sampleRate = visuals.getAudioSampleRate()

            resource.post(videomailFormData, cb)
        } else if (isPut(method))
            resource.put(videomailFormData, cb)
    }

    function submitForm(formData, videomailResponse, url, cb) {
        // avgFps is only for the videomail server
        delete formData.avgFps

        formData[options.selectors.aliasInputName] = videomailResponse.videomail.alias

        resource.form(formData, url, cb)
    }

    function finalizeSubmissions(err, method, videomail, response, formResponse) {
        self.endWaiting()

        if (err)
            self.emit(Events.ERROR, err)
        else {
            submitted = true

            // merge two json response bodies to fake as if it were only one request
            if (formResponse && formResponse.body)
                Object.keys(formResponse.body).forEach(function(key) {
                    response[key] = formResponse.body[key]
                })

            self.emit(
                Events.SUBMITTED,
                videomail,
                response
            )

            if (formResponse && formResponse.type === "text/html" && formResponse.text) {
                // server replied with HTML contents - display these
                document.body.innerHTML = formResponse.text

                // todo: figure out how to fire dom's onload event again
                // todo: or how to run all the scripts over again
            }
        }
    }

    this.addPlayerDimensions = function(videomail, element) {
        try {
            videomail.playerHeight = this.calculateHeight({
                responsive: true,
                videoWidth: videomail.width,
                ratio:      videomail.height / videomail.width
            }, element)

            videomail.playerWidth  = this.calculateWidth({
                responsive:  true,
                videoHeight: videomail.playerHeight,
                ratio:       videomail.height / videomail.width
            })

            return videomail
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    this.limitWidth = function(width) {
        return Dimension.limitWidth(containerElement, width)
    }

    this.limitHeight = function(height) {
        return Dimension.limitHeight(height)
    }

    this.calculateWidth = function(fnOptions) {
        return Dimension.calculateWidth(merge.recursive(options, fnOptions))
    }

    this.calculateHeight = function(fnOptions, element) {
        if (!element) {
            if (containerElement)
                element = containerElement
            else
                // better than nothing
                element = document.body
        }

        return Dimension.calculateHeight(element, merge.recursive(options, fnOptions))
    }

    this.areVisualsHidden = function() {
        return visuals.isHidden()
    }

    this.hasElement = function() {
        return !!containerElement
    }

    this.build = function() {
        try {
            containerElement = document.getElementById(options.selectors.containerId)

            // only build when a container element hast been found, otherwise
            // be silent and do nothing
            if (containerElement) {
                options.insertCss && prependDefaultCss()

                !built && initEvents()
                correctDimensions()
                buildForm()
                buildChildren()

                if (!hasError) {
                    built = true
                    self.emit(Events.BUILT)
                }
            }

        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    this.getSubmitButton = function() {
        return buttons.getSubmitButton()
    }

    this.querySelector = function(selector) {
        return containerElement.querySelector(selector)
    }

    this.beginWaiting = function() {
        htmlElement.classList && htmlElement.classList.add('wait')
    }

    this.endWaiting = function() {
        htmlElement.classList && htmlElement.classList.remove('wait')
    }

    this.appendChild = function(child) {
        containerElement.appendChild(child)
    }

    this.insertBefore = function(child, reference) {
        containerElement.insertBefore(child, reference)
    }

    this.unload = function(e) {
        try {
            unloadButKeepEventListeners(e)
            this.removeAllListeners()

            built = submitted = false
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    this.show = function() {
        if (containerElement) {
            hidden(containerElement, false)

            visuals.show()

            if (!hasError) {

                var paused = self.isPaused()

                if (paused) {
                    buttons.adjustButtonsForPause()
                }

                // since https://github.com/binarykitchen/videomail-client/issues/60
                // we hide areas to make it easier for the user
                buttons.show()

                if (self.isReplayShown())
                    self.emit(Events.PREVIEW)
                else {
                    self.emit(Events.FORM_READY, {paused: paused})
                    debug('Building stream connection to server ...')
                }
            }
        }
    }

    this.hide = function() {
        hasError = false

        this.isRecording() && this.pause()

        visuals.hide()

        if (submitted) {
            buttons.hide()
            hideMySelf()
        }
    }

    this.showReplayOnly = function() {
        hasError = false

        this.isRecording() && this.pause()

        visuals.showReplayOnly()

        submitted && buttons.hide()
    }

    this.isNotifying = function() {
        return visuals.isNotifying()
    }

    this.isPaused = function() {
        return visuals.isPaused()
    }

    this.pause = function() {
        visuals.pause()
    }

    this.startOver = function() {
        try {
            submitted = false
            form.show()
            visuals.back(this.show)
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    // this code needs a good rewrite :(
    this.validate = function(force) {
        var runValidation = true,
            valid

        if (!options.enableAutoValidation) {
            runValidation  = false
            lastValidation = true // needed so that it can be submitted anyway, see submit()
        } else if (force) {
            runValidation = force
        } else if (self.isNotifying()) {
            runValidation = false
        } else if (visuals.isConnected()) {
            runValidation = visuals.isUserMediaLoaded() || visuals.isReplayShown()
        } else if (visuals.isConnecting()) {
            runValidation = false
        }

        if (runValidation) {
            this.emit(Events.VALIDATING)

            var visualsValid = visuals.validate() && buttons.isRecordAgainButtonEnabled(),
                whyInvalid

            if (form) {
                valid = form.validate()

                if (valid) {
                    if (!this.areVisualsHidden() && !visualsValid) {

                        if (this.isReady() || this.isRecording() || this.isPaused() || this.isCountingDown())
                            valid = false

                        if (!valid)
                            whyInvalid = 'Video is not recorded'
                    }
                } else {
                    var invalidInput = form.getInvalidElement()

                    if (invalidInput) {
                        whyInvalid = 'Form input named ' + invalidInput.name + ' is invalid'
                    } else {
                        whyInvalid = 'Form input(s() are invalid'
                    }
                }
            } else
                valid = visualsValid

            if (valid)
                this.emit(Events.VALID)
            else
                this.emit(Events.INVALID, whyInvalid)

            lastValidation = valid
        }

        return valid
    }

    this.disableForm = function(buttonsToo) {
        form && form.disable(buttonsToo)
    }

    this.enableForm = function(buttonsToo) {
        form && form.enable(buttonsToo)
    }

    this.hasForm = function() {
        return !!form
    }

    this.isReady = function() {
        return buttons.isRecordButtonEnabled()
    }

    function isPost(method) {
        return method && method.toUpperCase() == 'POST'
    }

    function isPut(method) {
        return method && method.toUpperCase() == 'PUT'
    }

    this.submitAll = function(formData, method, url) {
        this.beginWaiting()
        this.disableForm(true)
        this.emit(Events.SUBMITTING)

        var post = isPost(method)

        // a closure so that we can access method
        var submitVideomailCallback = function(err1, videomail, videomailResponse) {
            if (err1) {
                finalizeSubmissions(err1, method, videomail, videomailResponse)

            } else if (post) {

                // for now, accept POSTs only which have an URL unlike null and
                // treat all other submissions as direct submissions

                if (!url || url === '')
                    url = document.baseURI // figure out URL automatically then

                submitForm(formData, videomailResponse, url, function(err2, formResponse) {
                    finalizeSubmissions(err2, method, videomail, videomailResponse, formResponse)
                })
            } else {
                // it's a direct submission
                finalizeSubmissions(null, method, videomail, videomailResponse)
            }
        }

        submitVideomail(formData, method, submitVideomailCallback)
    }

    this.isBuilt = function() {
        return built
    }

    this.isReplayShown = function() {
        return visuals.isReplayShown()
    }

    this.isDirty = function() {
        var isDirty = false

        if (!!form) {
            if (visuals.isRecorderUnloaded())
                isDirty = false
            else if (this.isReplayShown() || this.isPaused())
                isDirty = true
        }

        return isDirty
    }

    this.getReplay = function() {
        return visuals.getReplay()
    }

    this.isOutsideElementOf = function(element) {
        return element.parentNode != containerElement && element != containerElement
    }

    this.hideForm = function() {
        form.hide()
    }

    this.loadForm = function(videomail) {
        form.loadVideomail(videomail)
        this.validate()
    }

    this.enableAudio = function() {
        options.setAudioEnabled(true)
        this.emit(Events.ENABLING_AUDIO)
    }

    this.disableAudio = function() {
        options.setAudioEnabled(false)
        this.emit(Events.DISABLING_AUDIO)
    }

    this.submit = function () {
        lastValidation && form && form.doTheSubmit()
    }

    this.isCountingDown = visuals.isCountingDown.bind(visuals)
    this.isRecording    = visuals.isRecording.bind(visuals)
    this.record         = visuals.record.bind(visuals)
    this.resume         = visuals.resume.bind(visuals)
    this.stop           = visuals.stop.bind(visuals)
    this.recordAgain    = visuals.recordAgain.bind(visuals)
}

util.inherits(Container, EventEmitter)

module.exports = Container

},{"./../assets/css/main.min.css.js":75,"./../events":78,"./../resource":80,"./../util/eventEmitter":84,"./../util/videomailError":88,"./buttons":89,"./dimension":91,"./form":92,"./visuals":94,"hidden":21,"insert-css":27,"merge-recursive":36,"util":69}],91:[function(require,module,exports){
var numberIsInteger = require('number-is-integer');
    VideomailError  = require('./../util/videomailError')

function getOuterWidth(element) {
    var rect = element.getBoundingClientRect()
    return rect.right - rect.left
}

function figureMinHeight(height, options) {
    if (options.hasDefinedHeight()) {
        if (!height)
            height = options.video.height
        else
            height = Math.min(options.video.height, height)
    }

    if (numberIsInteger(height) && height < 1)
        throw VideomailError.create(
            'Got a video height less than 1 (' +
            height +
            ') while figuring out the minimum!'
        )

    // just return it, can be "auto"
    return height
}

module.exports = {

    limitWidth: function(element, width) {
        var outerWidth   = getOuterWidth(element)
        var limitedWidth = outerWidth > 0 && outerWidth < width ? outerWidth : width

        if (numberIsInteger(limitedWidth) && limitedWidth < 1)
            throw VideomailError.create('Limited width cannot be less than 1!')
        else
            return limitedWidth
    },

    // this is difficult to compute and is not entirely correct.
    // but good enough for now to ensure some stability.
    limitHeight: function(height) {
        if (numberIsInteger(height) && height < 1)
            throw VideomailError.create('Passed limit-height argument cannot be less than 1!')
        else {
            var limitedHeight = Math.min(
                height,
                document.body.scrollHeight,
                document.documentElement.clientHeight
            )

            if (limitedHeight < 1)
                throw VideomailError.create('Limited height cannot be less than 1!')
            else
                return limitedHeight
        }
    },

    calculateWidth: function(options) {
        var height = options.videoHeight || null,
            ratio  = options.ratio       || options.getRatio()

        height = figureMinHeight(height, options)

        if (options.responsive)
            height = this.limitHeight(height)

        if (numberIsInteger(height) && height < 1)
            throw new Error('Height cannot be smaller than 1 when calculating width.')
        else {
            var calculatedWidth = parseInt(height / ratio)

            if (calculatedWidth < 1)
                throw new Error('Calculated width cannot be smaller than 1!')
            else
                return calculatedWidth
        }
    },

    calculateHeight: function(element, options) {
        var width = options.videoWidth || null,
            ratio = options.ratio      || options.getRatio(),
            height

        if (options.hasDefinedWidth())
            width = options.video.width

        if (numberIsInteger(width) && width < 1)
            throw VideomailError.create('Unable to calculate height when width is less than 1.')
        else
            if (options.responsive)
                width = this.limitWidth(element, width)

            if (width)
                height = parseInt(width * ratio)

            if (numberIsInteger(height) && height < 1)
                throw VideomailError.create('Just calculated a height less than 1 which is wrong.')
            else
                return figureMinHeight(height, options)
    }
}

},{"./../util/videomailError":88,"number-is-integer":37}],92:[function(require,module,exports){
var h            = require('hyperscript'),
    util         = require('util'),
    hidden       = require('hidden'),
    getFormData  = require('get-form-data'),

    Events         = require('./../events'),
    EventEmitter   = require('./../util/eventEmitter'),
    VideomailError = require('./../util/videomailError')

var Form = function(container, formElement, options) {

    EventEmitter.call(this, options, 'Form')

    var self = this,

        disableContainerValidation,
        keyInput

    function getData() {
        return getFormData(formElement)
    }

    this.loadVideomail = function(videomail) {
        var limit = formElement.elements.length,
            input,
            name

        for (var i = 0; i < limit; i++) {
            input = formElement.elements[i]
            name  = input.name

            if (videomail[name])
                input.value = videomail[name]

            if (name == options.selectors.subjectInputName ||
                name == options.selectors.fromInputName ||
                name == options.selectors.bodyInputName)
                input.disabled = true
        }

        formElement.setAttribute('method', 'put')
    }

    function isNotButton(element) {
        return element.tagName !== 'BUTTON' && element.type !== 'submit'
    }

    function setDisabled(disabled, buttonsToo) {
        var limit = formElement.elements.length

        for (var i = 0; i < limit; i++) {
            if (buttonsToo || (!buttonsToo && isNotButton(formElement.elements[i])))
                formElement.elements[i].disabled = disabled
        }
    }

    function hideAllInputs() {
        var limit = formElement.elements.length

        for (var i = 0; i < limit; i++) {
            hidden(formElement.elements[i], true)
        }
    }

    function getInputElements() {
        return formElement.querySelectorAll('input, textarea')
    }

    function getSelectElements() {
        return formElement.querySelectorAll('select')
    }

    this.disable = function(buttonsToo) {
        setDisabled(true, buttonsToo)
    }

    this.enable = function(buttonsToo) {
        setDisabled(false, buttonsToo)
    }

    this.build = function() {
        if (options.enableAutoValidation) {
            var inputElements = getInputElements(),
                inputElement

            for (var i = 0, len = inputElements.length; i < len; i++) {
                inputElement = inputElements[i]

                if (inputElement.type == "radio") {
                    inputElement.addEventListener('change', function() {
                        container.validate()
                    })
                } else {
                    inputElement.addEventListener('input', function() {
                        container.validate()
                    })
                }

                // because of angular's digest cycle, validate again when it became invalid
                inputElement.addEventListener('invalid', function() {
                    if (!disableContainerValidation)
                        container.validate()
                })
            }

            var selectElements = getSelectElements()

            for (var i = 0, len = selectElements.length; i < len; i++) {
                selectElements[i].addEventListener('change', function() {
                    container.validate()
                })
            }
        }

        keyInput = formElement.querySelector('input[name="' + options.selectors.keyInputName + '"]')

        if (!keyInput) {
            keyInput = h('input', {
                name: options.selectors.keyInputName,
                type: 'hidden'
            })

            formElement.appendChild(keyInput)
        }

        this.on(Events.PREVIEW, function(videomailKey) {
            // beware that preview doesn't always come with a key, i.E.
            // container.show() can emit PREVIEW without a key when a replay already exists
            // (can happen when showing - hiding - showing videomail over again)

            // only emit error if key is missing AND the input has no key (value) yet
            if (!videomailKey && !keyInput.value)
                self.emit(Events.ERROR, VideomailError.create(
                    'Videomail key for preview is missing!'
                ))
            else if (videomailKey)
                keyInput.value = videomailKey
            // else
            // leave as it and use existing keyInput.value
        })

        // fixes https://github.com/binarykitchen/videomail-client/issues/91
        this.on(Events.GOING_BACK, function() {
            keyInput.value = null
        })

        this.on(Events.ERROR, function(err) {
            // since https://github.com/binarykitchen/videomail-client/issues/60
            // we hide areas to make it easier for the user to process an error
            // (= less distractions)
            if (err.isBrowserProblem && err.isBrowserProblem() &&
                options.adjustFormOnBrowserError) {
                hideAllInputs()
            }
        })

        this.on(Events.BUILT, function() {
            startListeningToSubmitEvents()
        })
    }

    function startListeningToSubmitEvents() {
        var submitButton = container.getSubmitButton()
        submitButton.addEventListener('click', self.doTheSubmit.bind(self))
    }

    this.doTheSubmit = function(e) {
        // when videomail-client is hidden, leave the form handling as it and
        // do not mess with it at all
        if (!container.areVisualsHidden()) {
            e && e.preventDefault()

            // only adjust submission when there is a container, otherwise
            // do nothing and leave as it for robustness
            if (container.hasElement()) {
                container.submitAll(
                    getData(),
                    formElement.getAttribute('method'),
                    formElement.getAttribute('action')
                )
            }

            return false // important to stop submission
        }
    }

    this.getInvalidElement = function() {
        var inputElements = getInputElements()

        for (var i = 0, len = inputElements.length; i < len; i++) {
            if (!inputElements[i].validity.valid)
                return inputElements[i]
        }

        var selectElements = getSelectElements()

        for (var i = 0, len = selectElements.length; i < len; i++) {
            if (!selectElements[i].validity.valid)
                return selectElements[i]
        }

        return null
    }

    this.validate = function() {
        // prevents endless validation loop
        disableContainerValidation = true

        var formIsValid = formElement.checkValidity()

        disableContainerValidation = false

        return formIsValid
    }

    this.findSubmitButton = function() {
        return formElement.querySelector("[type='submit']")
    }

    this.hide = function() {
        formElement && hidden(formElement, true)
    }

    this.show = function() {
        formElement && hidden(formElement, false)
    }
}

util.inherits(Form, EventEmitter)

module.exports = Form

},{"./../events":78,"./../util/eventEmitter":84,"./../util/videomailError":88,"get-form-data":20,"hidden":21,"hyperscript":23,"util":69}],93:[function(require,module,exports){
// enhances options with useful functions we can reuse everywhere

module.exports = {
    addFunctions: function(options) {

        var audioEnabled = options.audio && options.audio.enabled

        options.hasDefinedHeight = function() {
            return options.video.height && options.video.height != 'auto'
        }

        options.hasDefinedWidth = function() {
            return options.video.width && options.video.width != 'auto'
        }

        options.hasDefinedDimension = function() {
            return options.hasDefinedWidth() || options.hasDefinedHeight()
        }

        options.hasDefinedDimensions = function() {
            return options.hasDefinedWidth() && options.hasDefinedHeight()
        }

        options.getRatio = function() {
            var ratio = 1 // just a default one when no computations are possible

            if (options.hasDefinedDimensions())
                ratio = options.video.height / options.video.width

            return ratio
        }

        options.isAudioEnabled = function() {
            return audioEnabled
        }

        options.setAudioEnabled = function(enabled) {
            audioEnabled = enabled
        }
    }
}

},{}],94:[function(require,module,exports){
var util   = require('util'),
    h      = require('hyperscript'),
    hidden = require('hidden'),

    Replay          = require('./visuals/replay'),
    Recorder        = require('./visuals/recorder'),
    Notifier        = require('./visuals/notifier'),
    RecorderInsides = require('./visuals/inside/recorderInsides'),

    EventEmitter    = require('./../util/eventEmitter'),
    Events          = require('./../events')

var Visuals = function(container, options) {

    EventEmitter.call(this, options, 'Visuals')

    var self  = this,

        replay          = new Replay(this, options),
        recorder        = new Recorder(this, replay, options),
        recorderInsides = new RecorderInsides(this, options),

        notifier        = new Notifier(this, options),

        debug           = options.debug,

        visualsElement,
        built

    function buildNoScriptTag() {
        var noScriptElement = container.querySelector('noscript')

        if (!noScriptElement) {
            noScriptElement = h('noscript')
            noScriptElement.innerHTML = 'Please enable Javascript'

            visualsElement.appendChild(noScriptElement)
        }
    }

    function buildChildren() {
        debug('Visuals: buildChildren()')

        buildNoScriptTag()
        notifier.build()
        recorderInsides.build()
        replay.build()
    }

    function initEvents() {
        self
            .on(Events.USER_MEDIA_READY, function() {
                built = true
                self.endWaiting()
                container.enableForm(false)
            })
            .on(Events.PREVIEW, function() {
                self.endWaiting()
            })
            .on(Events.BLOCKING, function(blockingOptions) {
                if (blockingOptions.isBrowserProblem && !options.adjustFormOnBrowserError) {
                    // do nothing, user still can enter form inputs
                    // can be useful when you are on i.E. seeflow's contact page and
                    // still want to tick off the webcam option
                } else {
                    container.disableForm(true)
                }
            })
            .on(Events.PREVIEW_SHOWN, function() {
                container.validate(true)
            })
            .on(Events.LOADED_META_DATA, function() {
                correctDimensions()
            })
            .on(Events.ERROR, function(err) {
                if (err.isBrowserProblem && err.isBrowserProblem())
                    removeDimensions()
            })
    }

    function correctDimensions() {
        visualsElement.style.width  = self.getRecorderWidth(true) + 'px'
        visualsElement.style.height = self.getRecorderHeight(true) + 'px'
    }

    function removeDimensions() {
        visualsElement.style.width  = 'auto'
        visualsElement.style.height = 'auto'
    }

    function isRecordable() {
        return !self.isNotifying() && !replay.isShown() && !self.isCountingDown()
    }

    this.isCountingDown = function() {
        return recorderInsides.isCountingDown()
    }

    this.build = function() {
        visualsElement = container.querySelector('.' + options.selectors.visualsClass)

        if (!visualsElement) {
            visualsElement = h('div.' + options.selectors.visualsClass)

            var buttonsElement = container.querySelector('.' + options.selectors.buttonsClass)

            // make sure it's placed before the buttons
            if (buttonsElement)
                container.insertBefore(visualsElement, buttonsElement)
            else
                container.appendChild(visualsElement)
        }

        visualsElement.classList.add('visuals')
        hidden(visualsElement, true)

        correctDimensions()

        !built && initEvents()
        buildChildren()

        // needed for replay handling and container.isParentElementOf()
        self.parentNode = visualsElement.parentNode

        built = true
    }

    this.querySelector = function(selector) {
        return visualsElement && visualsElement.querySelector(selector)
    }

    this.appendChild = function(child) {
        visualsElement && visualsElement.appendChild(child)
    }

    this.removeChild = function(child) {
        visualsElement.removeChild(child)
    }

    this.reset = function() {
        this.endWaiting()
        recorder.reset()
    }

    this.beginWaiting = function() {
        container.beginWaiting()
    }

    this.endWaiting = function() {
        container.endWaiting()
    }

    this.stop = function(limitReached) {
        recorder.stop(limitReached)
        recorderInsides.hidePause()
    }

    this.back = function(cb) {
        replay.hide()
        notifier.hide()
        recorder.back(cb)
    }

    this.recordAgain = function() {
        this.back(function() {
            self.once(Events.USER_MEDIA_READY, function() {
                self.record()
            })
        })
    }

    this.unload = function(e) {
        try {
            recorder.unload(e)
            recorderInsides.unload(e)
            replay.unload(e)

            built = false
        } catch (exc) {
            this.emit(Events.ERROR, exc)
        }
    }

    this.isNotifying = function() {
        return notifier.isVisible()
    }

    this.isReplayShown = function() {
        return replay.isShown()
    }

    this.pause = function() {
        recorder.pause()
        recorderInsides.showPause()
    }

    this.resume = function() {
        recorder.resume()
        recorderInsides.hidePause()
    }

    this.pauseOrResume = function() {
        if (isRecordable.call(this)) {
            if (this.isRecording())
                this.pause()

            else if (recorder.isPaused())
                this.resume()

            else if (recorder.isReady())
                this.record()
        }
    }

    this.recordOrStop = function() {
        if (isRecordable()) {
            if (this.isRecording())
                this.stop()

            else if (recorder.isReady())
                this.record()
        }
    }

    this.record = function() {
        if (options.video.countdown) {
            this.emit(Events.COUNTDOWN)
            recorderInsides.startCountdown(recorder.record.bind(recorder))
        } else
            recorder.record()
    }

    this.getRecorder = function() {
        return recorder
    }

    this.getReplay = function() {
        return replay
    }

    this.validate = function() {
        return recorder.validate() && this.isReplayShown()
    }

    this.getAvgFps = function() {
        return recorder.getAvgFps()
    }

    this.getRecordingStats = function() {
        return recorder.getRecordingStats()
    }

    this.getAudioSampleRate = function() {
        return recorder.getAudioSampleRate()
    }

    this.isPaused = function() {
        return recorder.isPaused()
    }

    this.error = function(err) {
        notifier.error(err)
    }

    this.hide = function() {
        if (visualsElement) {
            hidden(visualsElement, true)
            this.emit(Events.HIDE)
        }
    }

    this.isHidden = function() {
        if (!built)
            return true
        else if (visualsElement)
            return hidden(visualsElement)
    }

    this.show = function() {
        !this.isReplayShown() && recorder.build()

        visualsElement && hidden(visualsElement, false)
    }

    this.showReplayOnly = function() {
        !this.isReplayShown() && replay.show()

        self.show()
        recorder.hide()
        notifier.hide()
    }

    this.isRecorderUnloaded = function() {
        return recorder.isUnloaded()
    }

    this.isConnecting = function() {
        return recorder.isConnecting()
    }

    this.getRecorderWidth = function(responsive) {
        return recorder.getRecorderWidth(responsive)
    }

    this.getRecorderHeight = function(responsive) {
        return recorder.getRecorderHeight(responsive)
    }

    this.limitWidth  = function(width) {
        return container.limitWidth(width)
    }

    this.limitHeight  = function(height) {
        return container.limitHeight(height)
    }

    this.calculateWidth  = function(options) {
        return container.calculateWidth(options)
    }

    this.calculateHeight  = function(options) {
        return container.calculateHeight(options)
    }

    this.getReplay = function() {
        return replay
    }

    this.getBoundingClientRect = function() {
        return visualsElement.getBoundingClientRect()
    }

    this.isReplayShown     = replay.isShown.bind(replay)
    this.hideReplay        = replay.hide.bind(replay)
    this.hideRecorder      = recorder.hide.bind(recorder)
    this.isRecording       = recorder.isRecording.bind(recorder)
    this.isUserMediaLoaded = recorder.isUserMediaLoaded.bind(recorder)
    this.isConnected       = recorder.isConnected.bind(recorder)
}

util.inherits(Visuals, EventEmitter)

module.exports = Visuals

},{"./../events":78,"./../util/eventEmitter":84,"./visuals/inside/recorderInsides":99,"./visuals/notifier":100,"./visuals/recorder":101,"./visuals/replay":102,"hidden":21,"hyperscript":23,"util":69}],95:[function(require,module,exports){
var h      = require('hyperscript'),
    hidden = require('hidden')

module.exports = function(visuals, options) {

    var self = this,

        countdownElement,
        intervalId,
        countdown

    function fire(cb) {
        self.unload()
        self.hide()

        // keep all callbacks async
        setTimeout(function() {
            cb()
        }, 0)
    }

    function countBackward(cb) {
        countdown--

        if (countdown < 1)
            fire(cb)
        else
            countdownElement.innerHTML = countdown
    }

    this.start = function(cb) {
        countdownElement.innerHTML = countdown = options.video.countdown

        this.show()

        intervalId = setInterval(countBackward.bind(this, cb), 1e3)
    }

    this.build = function() {
        countdownElement = visuals.querySelector('.countdown')

        if (!countdownElement) {
            countdownElement = h('p.countdown')

            this.hide()

            visuals.appendChild(countdownElement)
        } else
            this.hide()
    }

    this.show = function() {
        hidden(countdownElement, false)
    }

    this.isCountingDown = function() {
        return !!intervalId
    }

    this.unload = function() {
        clearInterval(intervalId)
        intervalId = null
    }

    this.hide = function() {
       hidden(countdownElement, true)
       this.unload()
    }
}

},{"hidden":21,"hyperscript":23}],96:[function(require,module,exports){
var h      = require('hyperscript'),
    hidden = require('hidden'),

    VideomailError  = require('./../../../../util/videomailError')

module.exports = function(visuals, options) {

    if (!options.text.pausedHeader)
        throw VideomailError.create('Paused header cannot be empty', options)

    var pausedBlockElement,
        pausedHeaderElement,
        pausedHintElement

    this.build = function() {
        pausedBlockElement  = visuals.querySelector('.paused')
        pausedHeaderElement = visuals.querySelector('.pausedHeader')
        pausedHintElement   = visuals.querySelector('.pausedHint')

        if (!pausedHeaderElement) {
            pausedBlockElement  = h('div.paused')
            pausedHeaderElement = h('p.pausedHeader')
            pausedHintElement   = h('p.pausedHint')

            this.hide()

            pausedHeaderElement.innerHTML = options.text.pausedHeader
            pausedHintElement.innerHTML   = options.text.pausedHint

            pausedBlockElement.appendChild(pausedHeaderElement)
            pausedBlockElement.appendChild(pausedHintElement)

            visuals.appendChild(pausedBlockElement)
        } else {
            this.hide()

            pausedHeaderElement.innerHTML = options.text.pausedHeader
            pausedHintElement.innerHTML   = options.text.pausedHint
        }
    }

    this.hide = function() {
        hidden(pausedBlockElement, true)
    }

    this.show = function() {
        hidden(pausedBlockElement, false)
    }
}

},{"./../../../../util/videomailError":88,"hidden":21,"hyperscript":23}],97:[function(require,module,exports){
var h      = require('hyperscript'),
    hidden = require('hidden')

module.exports = function(visuals) {

    var recordNoteElement

    this.build = function() {
        recordNoteElement = visuals.querySelector('.recordNote')

        if (!recordNoteElement) {
            recordNoteElement = h('p.recordNote')

            this.hide()

            visuals.appendChild(recordNoteElement)
        } else
            this.hide()
    }

    this.stop = function() {
        this.hide()
        recordNoteElement.classList.remove('near')
        recordNoteElement.classList.remove('nigh')
    }

    this.setNear = function() {
        recordNoteElement.classList.add('near')
    }

    this.setNigh = function() {
        recordNoteElement.classList.add('nigh')
    }

    this.hide = function() {
        hidden(recordNoteElement, true)
    }

    this.show = function() {
        hidden(recordNoteElement, false)
    }
}

},{"hidden":21,"hyperscript":23}],98:[function(require,module,exports){
var pauseable   = require('pauseable'),
    h           = require('hyperscript'),
    hidden      = require('hidden')

module.exports = function(visuals, recordNote, options) {

    var recordTimerElement,

        nearComputed    = false,
        endNighComputed = false,

        timer,
        countdown

    function pad(n) {
        return n < 10 ? '0' + n : n
    }

    function thresholdReached(secs, threshold) {
        return secs >= options.video.limitSeconds * threshold
    }

    function isNear(secs) {
        if (!nearComputed && thresholdReached(secs, .6)) {
            nearComputed = true
            return true
        } else
            return false
    }

    function endIsNigh(secs) {
        if (!endNighComputed && thresholdReached(secs, .8)) {
            endNighComputed = true
            return true
        } else
            return false
    }

    function setNear() {
        recordTimerElement.classList.add('near')
    }

    function setNigh() {
        recordTimerElement.classList.add('nigh')
    }

    function update(cb) {
        // stop any existing ones first
        timer && timer.clear()

        var mins = parseInt(countdown / 60, 10),
            secs = countdown - mins * 60

        if (!nearComputed || !endNighComputed) {
            var remainingSeconds = options.video.limitSeconds - countdown

            if (isNear(remainingSeconds)) {

                recordNote.setNear()
                setNear()

                options.debug('End is near, ' + countdown + ' seconds to go')

            } else if (endIsNigh(remainingSeconds)) {

                recordNote.setNigh()
                setNigh()

                options.debug('End is nigh, ' + countdown + ' seconds to go')
            }
        }

        recordTimerElement.innerHTML = mins + ':' + pad(secs)

        // do not use 1000 but few milliseconds less due to CPU usage
        timer = pauseable.setTimeout(function() {
            countdown--

            if (countdown < 0)
                cb(true)
            else
                update(cb)
        }, 990)
    }

    function hide() {
        hidden(recordTimerElement, true)
    }

    function show() {
        recordTimerElement.classList.remove('near')
        recordTimerElement.classList.remove('nigh')

        hidden(recordTimerElement, false)
    }

    function getSecondsRecorded() {
        return options.video.limitSeconds - countdown
    }

    this.start = function(cb) {
        countdown    = options.video.limitSeconds - 1
        nearComputed = endNighComputed = false

        show()
        recordNote.show()

        update(cb)
    }

    this.pause = function() {
        timer && timer.pause()
        recordNote.hide()
    }

    this.resume = function() {
        timer.resume()
        recordNote.show()
    }

    this.stop = function() {
        options.debug('Stopping record timer. Was recording for ' + getSecondsRecorded() + " seconds.")

        hide()
        timer && timer.clear()
        recordNote.stop()
    }

    this.build = function() {
        recordTimerElement = visuals.querySelector('.recordTimer')

        if (!recordTimerElement) {
            recordTimerElement = h('p.recordTimer')

            hide()

            visuals.appendChild(recordTimerElement)
        } else
            hide()
    }
}

},{"hidden":21,"hyperscript":23,"pauseable":40}],99:[function(require,module,exports){
var util         = require('util'),

    Events       = require('./../../../events'),
    EventEmitter = require('./../../../util/eventEmitter'),

    Countdown   = require('./recorder/countdown'),
    PausedNote  = require('./recorder/pausedNote'),
    RecordNote  = require('./recorder/recordNote'),
    RecordTimer = require('./recorder/recordTimer')

var RecorderInsides = function(visuals, options) {

    EventEmitter.call(this, options, 'RecorderInsides')

    var self = this,

        recordNote  = new RecordNote(visuals),
        recordTimer = new RecordTimer(visuals, recordNote, options),

        countdown,
        pausedNote,
        built

    if (options.video.countdown)
        countdown = new Countdown(visuals, options)

    if (options.enablePause)
        pausedNote = new PausedNote(visuals, options)

    function startRecording(cb) {
        recordTimer.start(cb)
    }

    function resumeRecording() {
        recordTimer.resume()
    }

    function stopRecording() {
        recordTimer.stop()
    }

    function pauseRecording() {
        recordTimer.pause()
    }

    function onResetting() {
        self.hidePause()
        self.hideCountdown()
        recordTimer.stop()
    }

    function initEvents() {
        self
            .on(Events.RECORDING, function() {
                startRecording(function(limitReached) {
                    visuals.stop(limitReached)
                })
            })
            .on(Events.RESUMING, function() {
                resumeRecording()
            })
            .on(Events.STOPPING, function() {
                stopRecording()
            })
            .on(Events.PAUSED, function() {
                pauseRecording()
            })
            .on(Events.RESETTING, onResetting)
            .on(Events.HIDE, function() {
                self.hideCountdown()
            })
    }

    this.build = function() {
        countdown && countdown.build()
        pausedNote&& pausedNote.build()

        recordNote.build()
        recordTimer.build()

        !built && initEvents()

        built = true
    }

    this.unload = function() {
        countdown && countdown.unload()

        built = false
    }

    this.showPause = function() {
        pausedNote && pausedNote.show()
    }

    this.hidePause = function() {
        pausedNote && pausedNote.hide()
    }

    this.hideCountdown = function() {
        countdown && countdown.hide()
    }

    this.startCountdown = function(cb) {
        countdown && countdown.start(cb)
    }

    this.isCountingDown = function() {
        return countdown && countdown.isCountingDown()
    }
}

util.inherits(RecorderInsides, EventEmitter)

module.exports = RecorderInsides

},{"./../../../events":78,"./../../../util/eventEmitter":84,"./recorder/countdown":95,"./recorder/pausedNote":96,"./recorder/recordNote":97,"./recorder/recordTimer":98,"util":69}],100:[function(require,module,exports){
var util           = require('util'),
    h              = require('hyperscript'),
    hidden         = require('hidden'),

    EventEmitter   = require('./../../util/eventEmitter'),
    Events         = require('./../../events')

var Notifier = function(visuals, options) {

    EventEmitter.call(this, options, 'Notifier')

    var self    = this,
        debug   = options && options.debug,

        notifyElement,
        messageElement,
        explanationElement,
        entertainTimeoutId,
        built

    function onStopping(limitReached) {
        var lead = ''

        visuals.beginWaiting()

        if (limitReached) {
            debug('Limit reached')
            lead += options.text.limitReached + '.<br/>'
        }

        lead += options.text.sending + ' …'

        self.notify(lead, null, {
            stillWait: true,
            entertain: options.notifier.entertain
        })
    }

    function onLoadingUserMedia() {
        self.notify('Loading webcam …')
    }

    function onProgress(frameProgress, sampleProgress) {
        var overallProgress

        if (options.isAudioEnabled()) {
            overallProgress = 'Video: ' + frameProgress

            if (sampleProgress)
                 overallProgress += ', Audio: ' + sampleProgress
        } else
            overallProgress = frameProgress

        self.setExplanation(overallProgress)
    }

    function onBeginVideoEncoding() {
        visuals.beginWaiting()

        var lead = options.text.encoding + ' …'

        self.notify(lead, null, {
            stillWait: true,
            entertain: options.notifier.entertain
        })

        hideExplanation()
    }

    function initEvents() {
        debug('Notifier: initEvents()')

        self
            .on(Events.LOADING_USER_MEDIA, function() {
                onLoadingUserMedia()
            })
            .on(Events.USER_MEDIA_READY, function() {
                self.hide()
            })
            .on(Events.LOADED_META_DATA, function() {
                correctDimensions()
            })
            .on(Events.PREVIEW, function() {
                self.hide()
            })
            .on(Events.STOPPING, function(limitReached) {
                onStopping(limitReached)
            })
            .on(Events.PROGRESS, function(frameProgress, sampleProgress) {
                onProgress(frameProgress, sampleProgress)
            })
            .on(Events.BEGIN_VIDEO_ENCODING, function() {
                onBeginVideoEncoding()
            })
    }

    function correctDimensions() {
        notifyElement.style.width  = visuals.getRecorderWidth(true) + 'px'
        notifyElement.style.height = visuals.getRecorderHeight(true) + 'px'
    }

    function removeDimensions() {
        notifyElement.style.width  = 'auto'
        notifyElement.style.height = 'auto'
    }

    function show() {
        notifyElement && hidden(notifyElement, false)
    }

    function runEntertainment() {
        if (options.notifier.entertain) {

            var randomBackgroundClass = Math.floor((Math.random() * options.notifier.entertainLimit) + 1)

            notifyElement.className =   'notifier entertain ' +
                                        options.notifier.entertainClass +
                                        randomBackgroundClass

            entertainTimeoutId = setTimeout(runEntertainment, options.notifier.entertainInterval)
        } else
            cancelEntertainment()
    }

    function cancelEntertainment() {
        if (notifyElement)
            notifyElement.className = 'notifier'

        clearInterval(entertainTimeoutId)
    }

    function setMessage(message, messageOptions) {
        var problem = messageOptions.problem ? messageOptions.problem : false

        if (messageElement)
            messageElement.innerHTML = (problem ? '&#x2639; ' : '') + message
        else
            options.logger.warn(
                'Unable to show following because messageElement is empty:',
                message
            )
    }

    this.error = function(err) {
        var message     = err.message ? err.message.toString() : err.toString(),
            explanation = err.explanation ? err.explanation.toString() : null

        if (!message)
            options.debug('Weird empty message generated for error', err)

        self.notify(message, explanation, {
            blocking:         true,
            problem:          true,
            isBrowserProblem: err.isBrowserProblem && err.isBrowserProblem()
        })
    }

    this.setExplanation = function(explanation) {

        if (!explanationElement) {
            explanationElement = h('p')

            if (notifyElement)
                notifyElement.appendChild(explanationElement)
            else
                options.logger.warn(
                    'Unable to show explanation because notifyElement is empty:',
                    explanation
                )
        }

        explanationElement.innerHTML = explanation
    }

    this.build = function() {
        notifyElement = visuals.querySelector('.notifier')

        if (!notifyElement) {
            notifyElement = h('.notifier') // defaults to div

            this.hide()

            visuals.appendChild(notifyElement)
        } else
            this.hide()

        !built && initEvents()

        built = true
    }

    function hideExplanation() {
      if (explanationElement)
          explanationElement.innerHTML = null
    }

    this.hide = function() {
        cancelEntertainment()

        if (notifyElement) {
            hidden(notifyElement, true)
            notifyElement.classList.remove('blocking')
        }

        if (messageElement)
            messageElement.innerHTML = null

        hideExplanation()
    }

    this.isVisible = function() {
        if (!built)
            return false
        else
            return notifyElement && !hidden(notifyElement)
    }

    this.notify = function(message, explanation, notifyOptions) {

        if (!notifyOptions)
            notifyOptions = {}

        var stillWait        = notifyOptions.stillWait ? notifyOptions.stillWait : false,
            entertain        = notifyOptions.entertain  ? notifyOptions.entertain  : false,
            blocking         = notifyOptions.blocking   ? notifyOptions.blocking   : false,
            isBrowserProblem = notifyOptions.isBrowserProblem ? notifyOptions.isBrowserProblem : false

        if (!entertain)
            cancelEntertainment()

        if (!messageElement && notifyElement) {
            messageElement = h('h2')

            if (explanationElement)
                notifyElement.insertBefore(messageElement, explanationElement)
            else
                notifyElement.appendChild(messageElement)
        }

        if (notifyElement)
            if (isBrowserProblem) {
                notifyElement.classList.add('browserProblem')
                removeDimensions()
            } else
                notifyElement.classList.remove('browserProblem')

        if (blocking) {
            notifyElement && notifyElement.classList.add('blocking')
            this.emit(Events.BLOCKING, notifyOptions)
        } else
            this.emit(Events.NOTIFYING, notifyOptions)

        visuals.hideReplay()
        visuals.hideRecorder()

        setMessage(message, notifyOptions)

        explanation && this.setExplanation(explanation)

        if (entertain)
            runEntertainment()

        show()

        !stillWait && visuals.endWaiting()
    }
}

util.inherits(Notifier, EventEmitter)

module.exports = Notifier

},{"./../../events":78,"./../../util/eventEmitter":84,"hidden":21,"hyperscript":23,"util":69}],101:[function(require,module,exports){
(function (Buffer){
var websocket    = require('websocket-stream'),
    Frame        = require('canvas-to-buffer'),
    util         = require('util'),
    h            = require('hyperscript'),
    hidden       = require('hidden'),

    UserMedia = require('./userMedia'),

    Events          = require('./../../events'),
    Constants       = require('./../../constants'),
    EventEmitter    = require('./../../util/eventEmitter'),
    Browser         = require('./../../util/browser'),
    Humanize        = require('./../../util/humanize'),
    VideomailError  = require('./../../util/videomailError')

var Recorder = function(visuals, replay, options) {

    EventEmitter.call(this, options, 'Recorder')

    // validate some options this class needs
    if (!options || !options.video || !options.video.fps)
        throw VideomailError.create('FPS must be defined', options)

    var self            = this,
        browser         = new Browser(options),

        wantedInterval  = 1e3 / options.video.fps,
        debug           = options.debug,

        samplesCount = 0,
        framesCount  = 0,

        recordingStats = {},

        confirmedFrameNumber = 0,
        confirmedSampleNumber = 0,

        recorderElement,
        userMedia,

        lastAnimationTimestamp,
        userMediaTimeout,
        retryTimeout,

        intervalSum,
        bytesSum,

        frameProgress,
        sampleProgress,

        canvas,
        ctx,
        rafId,

        userMediaLoaded,
        userMediaLoading,
        avgFps,
        submitting,
        unloaded,
        stopTime,
        stream,
        connecting,
        connected,
        blocking,
        built,
        key,

        pingInterval

    function sendPings() {
        pingInterval = window.setInterval(function() {
            writeStream(new Buffer(''))
        }, options.timeouts.pingInterval)
    }

    function stopPings() {
        clearInterval(pingInterval)
    }

    function onAudioSample(audioSample) {
        samplesCount++

        var audioBuffer = audioSample.toBuffer()

        // if (options.verbose) {
        //     debug(
        //         'Sample #' + samplesCount + ' (' + audioBuffer.length + ' bytes):'
        //     )
        // }

        writeStream(audioBuffer)
    }

    function onUserMediaReady() {
        try {
            debug('Recorder: onUserMediaReady()')

            userMediaLoading = blocking = unloaded = submitting = false
            userMediaLoaded = true

            show()
            self.emit(Events.USER_MEDIA_READY, {paused: self.isPaused()})
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    function clearRetryTimeout() {
        debug('Recorder: clearRetryTimeout()')

        retryTimeout && clearTimeout(retryTimeout)
        retryTimeout = null
    }

    function clearUserMediaTimeout() {
        if (userMediaTimeout) {
            debug('Recorder: clearUserMediaTimeout()')

            userMediaTimeout && clearTimeout(userMediaTimeout)
            userMediaTimeout = null
        }
    }

    function userMediaErrorCallback(err) {
        userMediaLoading = false

        clearUserMediaTimeout()

        var errorListeners = self.listeners(Events.ERROR)

        if (errorListeners.length) {
            self.emit(Events.ERROR, err)

            // retry after a while
            retryTimeout = setTimeout(initSocket, options.timeouts.userMedia)
        } else {
            debug('Recorder: no error listeners attached but throwing error', err)

            // weird situation, throw it since there are no error listeners
            throw err
        }
    }

    function showUserMedia() {
        return isNotifying() || !isHidden() || blocking
    }

    function getUserMediaCallback(localStream) {
        debug('Recorder: getUserMediaCallback()')

        if (showUserMedia()) {
            try {
                clearUserMediaTimeout()

                userMedia.init(
                    localStream,
                    onUserMediaReady.bind(self),
                    onAudioSample.bind(self),
                    function(err) {
                        self.emit(Events.ERROR, err)
                    }
                )
            } catch (exc) {
                self.emit(Events.ERROR, exc)
            }
        }
    }

    function loadGenuineUserMedia() {
        if (!navigator)
            throw new Error('Navigator is missing!')

        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // prefer the front camera (if one is available) over the rear one
            navigator.mediaDevices.getUserMedia({
                video: {facingMode: "user"},
                audio: options.isAudioEnabled()
            })
            .then(getUserMediaCallback)
            .catch(userMediaErrorCallback)
        } else {
            navigator.getUserMedia_({
                video: true,
                audio: options.isAudioEnabled()
            }, getUserMediaCallback, userMediaErrorCallback)
        }
    }

    function loadUserMedia() {

        if (userMediaLoaded) {
            debug('Recorder: skipping loadUserMedia() because it is already loaded')
            onUserMediaReady()
            return false
        } else if (userMediaLoading) {
            debug('Recorder: skipping loadUserMedia() because it is already asking for permission')
            return false
        }

        debug('Recorder: loadUserMedia()')

        self.emit(Events.LOADING_USER_MEDIA)

        try {
            userMediaTimeout = setTimeout(function() {
                if (!self.isReady())
                    self.emit(Events.ERROR, browser.getNoAccessIssue())
            }, options.timeouts.userMedia)

            userMediaLoading = true

            loadGenuineUserMedia()

        } catch (exc) {
            userMediaLoading = false

            var errorListeners = self.listeners(Events.ERROR)

            if (errorListeners.length)
                self.emit(Events.ERROR, exc)
            else {
                debug('Recorder: no error listeners attached but throwing exception', exc)
                throw exc // throw it further
            }
        }
    }

    function isHidden() {
        return !recorderElement || hidden(recorderElement)
    }

    function preview(args) {
        confirmedFrameNumber =
        confirmedSampleNumber =
        samplesCount =
        framesCount = 0

        sampleProgress =
        frameProgress = null

        key = args.key

        if (args.mp4)
            replay.setMp4Source(args.mp4 + Constants.SITE_NAME_LABEL + '/' + options.siteName)

        if (args.webm)
            replay.setWebMSource(args.webm + Constants.SITE_NAME_LABEL + '/' + options.siteName)

        self.hide()
        self.emit(Events.PREVIEW, key, self.getRecorderWidth(true), self.getRecorderHeight(true))

        if (options.debug) {
            var waitingTime = Date.now() - stopTime

            debug(
                'While recording, %s have been transferred and waiting time was %s',
                Humanize.filesize(bytesSum, 2),
                Humanize.toTime(waitingTime)
            )
        }
    }

    function calculateFrameProgress() {
        return (confirmedFrameNumber / (framesCount || 1) * 100).toFixed(2) + '%'
    }

    function calculateSampleProgress() {
        return (confirmedSampleNumber / (samplesCount || 1) * 100).toFixed(2) + '%'
    }

    function updateFrameProgress(args) {
        confirmedFrameNumber = args.frame ? args.frame : confirmedFrameNumber

        frameProgress = calculateFrameProgress()

        updateOverallProgress()
    }

    function updateSampleProgress(args) {
        confirmedSampleNumber = args.sample ? args.sample : confirmedSampleNumber

        sampleProgress = calculateSampleProgress()

        updateOverallProgress()
    }

    function updateOverallProgress() {
        // when progresses aren't initialized,
        // then do a first calculation to avoid `infinite` or `null` displays

        if (!frameProgress)
            frameProgress = calculateFrameProgress()

        if (!sampleProgress)
            sampleProgress = calculateSampleProgress()

        self.emit(
            Events.PROGRESS,
            frameProgress,
            sampleProgress
        )
    }

    function executeCommand(data) {
        try {
            var command = JSON.parse(data.toString()),
                result

            debug(
                'Server commanded: %s',
                command.command,
                command.args ? ', ' + JSON.stringify(command.args) : '',
                result       ? '= ' + result : ''
            )

            switch (command.command) {
                case 'ready':
                    if (!userMediaTimeout)
                        loadUserMedia()
                    break
                case 'preview':
                    preview(command.args)
                    break
                case 'error':
                    this.emit(Events.ERROR, VideomailError.create(
                        'Oh no, server error!',
                        command.args.err.toString() || '(No explanation given)',
                        options
                    ))
                    break
                case 'confirmFrame':
                    result = updateFrameProgress(command.args)
                    break
                case 'confirmSample':
                    result = updateSampleProgress(command.args)
                    break
                case 'beginAudioEncoding':
                    this.emit(Events.BEGIN_AUDIO_ENCODING)
                    break
                case 'beginVideoEncoding':
                    this.emit(Events.BEGIN_VIDEO_ENCODING)
                    break
                default:
                    this.emit(Events.ERROR, 'Unknown server command: ' + command.command)
                    break
            }
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    function writeStream(buffer) {
        if (stream) {
            if (stream.destroyed)
                self.emit(Events.ERROR, VideomailError.create(
                    'Already disconnected.',
                    'Sorry, the connection to the server has been destroyed. Please reload.',
                    options
                ))
            else
                stream.write(buffer)
        }
    }

    function writeCommand(command, args, cb) {
        if (!cb && args && args.constructor === Function) {
            cb   = args
            args = null
        }

        if (!connected) {
            debug('Reconnecting for the command', command, '…')

            initSocket(function() {
                writeCommand(command, args)
                cb && cb()
            })
        } else if (stream) {
            debug('$ %s', command, args ? JSON.stringify(args) : '')

            var command = {
                command:    command,
                args:       args
            }

            writeStream(new Buffer(JSON.stringify(command)))

            if (cb)
                // keep all callbacks async
                setTimeout(function() {
                    cb()
                }, 0)
        }
    }

    function isNotifying() {
        return visuals.isNotifying()
    }

    function initSocket(cb) {
        if (!connected) {

            connecting = true

            debug('Recorder: initialising web socket to %s', options.socketUrl)

            // https://github.com/maxogden/websocket-stream#binary-sockets

            // we use query parameters here because we cannot set custom headers in web sockets,
            // see https://github.com/websockets/ws/issues/467

            try {
                stream = websocket(
                    options.socketUrl +
                    '?' +
                    encodeURIComponent(Constants.SITE_NAME_LABEL) +
                    '=' +
                    encodeURIComponent(options.siteName)
                )
            } catch (exc) {
                connecting = connected = false

                var err = VideomailError.create(
                    'Failed to create websocket',
                    exc.toString(),
                    options
                )

                self.emit(Events.ERROR, err)
            }

            // useful for debugging streams

            // if (!stream.originalEmit)
            //     stream.originalEmit = stream.emit

            // stream.emit = function(type) {
            //     if (stream) {
            //         debug('Websocket stream emitted:', type)
            //         var args = Array.prototype.slice.call(arguments, 0)
            //         return stream.originalEmit.apply(stream, args)
            //     }
            // }

            if (stream) {

                stream.on('close', function(err) {
                    debug('x Stream has closed')

                    connecting = connected = false

                    if (err)
                        self.emit(Events.ERROR, err ? err : 'Unhandled websocket error')
                })

                stream.on('connect', function() {
                    if (!connected) {
                        connected = true
                        connecting = unloaded = false

                        self.emit(Events.CONNECTED)

                        debug('Asking for webcam permissons now.')

                        cb && cb()
                    }
                })

                stream.on('data', function(data) {
                    executeCommand.call(self, data)
                })

                stream.on('error', function(err) {
                    connecting = connected = false
                    self.emit(Events.ERROR, err)
                })
            }
        }
    }

    function disconnect() {
        if (connected) {
            debug('Recorder: disconnect()')

            if (submitting)
                // server will disconnect socket automatically after submitting
                connecting = connected = false

            else if (stream) {
                // force to disconnect socket right now to clean temp files on server
                stream.end()
                stream = undefined
            }
        }
    }

    function cancelAnimationFrame() {
        rafId && window.cancelAnimationFrame && window.cancelAnimationFrame(rafId)
        rafId = null
    }

    this.getAvgFps = function() {
        return avgFps
    }

    function getAvgInterval() {
        return (intervalSum / framesCount)
    }

    this.getRecordingStats = function() {
        return recordingStats
    }

    this.getAudioSampleRate = function() {
        return userMedia.getAudioSampleRate()
    }

    this.stop = function(limitReached) {
        debug('stop()')

        this.emit(Events.STOPPING, limitReached)

        stopTime = Date.now()

        var avgInterval = getAvgInterval()

        avgFps = 1000 / (intervalSum / framesCount)

        var args = {
            framesCount:    framesCount,
            videoType:      replay.getVideoType(),
            avgFps:         avgFps
        }

        if (options.isAudioEnabled()) {
            args.samplesCount = samplesCount
            args.sampleRate   = userMedia.getAudioSampleRate()
        }

        writeCommand('stop', args)

        // remember them before resetting
        recordingStats = {
            avgInterval:  getAvgInterval(),
            intervalSum:  intervalSum,
            framesCount:  framesCount,
            samplesCount: samplesCount,
            sampleRate:   self.getAudioSampleRate()
        }

        // beware, resetting will set framesCount to zero, so leave this here
        this.reset()
    }

    this.back = function(cb) {
        this.emit(Events.GOING_BACK)

        show()
        this.reset()

        writeCommand('back', cb)
    }

    function reInitialiseAudio() {
        clearUserMediaTimeout()

        // important to free memory
        userMedia && userMedia.stop()

        userMediaLoaded = key = canvas = ctx = null

        loadUserMedia()
    }

    this.unload = function(e) {
        if (!unloaded) {
            var cause

            if (e)
                cause = e.name || e.statusText || e.toString()

            debug('Recorder: unload()' + (cause ? ', cause: ' + cause : ''))

            this.reset()

            clearUserMediaTimeout()

            disconnect()

            unloaded = true

            built = false
        }
    }

    this.reset = function() {
        // no need to reset when already unloaded
        if (!unloaded) {
            debug('Recorder: reset()')

            this.emit(Events.RESETTING)

            cancelAnimationFrame()

            replay.reset()

            // important to free memory
            userMedia && userMedia.stop()

            userMediaLoaded = key = canvas = ctx = null
        }
    }

    this.validate = function() {
        return connected && framesCount > 0 && canvas === null
    }

    this.isReady = function() {
        return userMedia.isReady()
    }

    this.pause = function(e) {
        debug('pause()', e ? e : '<button press>')

        userMedia.pause()

        this.emit(Events.PAUSED)

        sendPings()
    }

    this.isPaused = function() {
        return userMedia && userMedia.isPaused()
    }

    this.resume = function() {
        debug('Recorder: resume()')

        stopPings()

        this.emit(Events.RESUMING)

        lastAnimationTimestamp = Date.now()
        userMedia.resume()
    }

    this.record = function() {
        if (unloaded)
            return false

        // reconnect when needed
        if (!connected) {
            debug('Recorder: reconnecting before recording ...')

            initSocket(function() {
                self.once(Events.USER_MEDIA_READY, self.record)
            })

            return false
        }

        try {
            canvas = userMedia.createCanvas()
        } catch (exc) {
            throw VideomailError.create('Failed to create canvas.', exc.toString(), options)
        }

        ctx = canvas.getContext('2d')

        if (!canvas.width)
            throw VideomailError.create('Canvas has an invalid width.', options)

        if (!canvas.height)
            throw VideomailError.create('Canvas has an invalid height.', options)

        avgFps   = null
        bytesSum = intervalSum = 0
        lastAnimationTimestamp = Date.now()

        var intervalThreshold = wantedInterval * .8, // allow ~ 20% below fps (can't be too strict)
            frame             = new Frame(canvas, options),

            interval,
            now,
            bufferLength,
            buffer

        function calcInterval(now) {
            return now - lastAnimationTimestamp
        }

        function draw() {
            try {
                rafId = window.requestAnimationFrame(draw)

                if (!self.isPaused()) {

                    now      = Date.now()
                    interval = calcInterval(now)

                    if (interval > intervalThreshold) {

                        // see: http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/
                        lastAnimationTimestamp = now - (interval % intervalThreshold)

                        if (framesCount === 0 && stream)
                            self.emit(Events.SENDING_FIRST_FRAME)

                        // ctx might become null when unloading
                        ctx && ctx.drawImage(
                            userMedia.getRawVisuals(),
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        )

                        buffer       = frame.toBuffer()
                        bufferLength = buffer.length

                        if (bufferLength < 1)
                            throw VideomailError.create('Failed to extract webcam data.', options)

                        // stream might become null while unloading
                        if (stream) {
                            framesCount++

                            writeStream(buffer)

                            if (framesCount === 1)
                                self.emit(Events.FIRST_FRAME_SENT)

                            bytesSum += bufferLength
                        }

                        // if (options.verbose) {
                        //     debug(
                        //         'Frame #' + framesCount + ' (' + bufferLength + ' bytes):',
                        //         interval + '/' + intervalThreshold + '/' + wantedInterval
                        //     )
                        // }

                        intervalSum += interval
                    }
                }
            } catch (exc) {
                self.emit(Events.ERROR, exc)
            }
        }

        debug('Recorder: record()')

        userMedia.record()
        self.emit(Events.RECORDING, framesCount)

        draw()
    }

    function buildElement() {
        recorderElement =  h('video.' + options.selectors.userMediaClass)
        visuals.appendChild(recorderElement)
    }

    function show() {
        recorderElement && hidden(recorderElement, false)
    }

    function correctDimensions() {
        if (options.hasDefinedWidth())
            recorderElement.width = self.getRecorderWidth(true)

        if (options.hasDefinedHeight())
            recorderElement.height = self.getRecorderHeight(true)
    }

    function initEvents() {
        self
            .on(Events.SUBMITTING, function() {
                submitting = true
            })
            .on(Events.SUBMITTED, function() {
                submitting = false
                self.unload()
            })
            .on(Events.BLOCKING, function() {
                blocking = true
                clearUserMediaTimeout()
            })
            .on(Events.HIDE, function() {
                self.hide()
            })
            .on(Events.LOADED_META_DATA, function() {
                correctDimensions()
            })
            .on(Events.DISABLING_AUDIO, function() {
                reInitialiseAudio()
            })
            .on(Events.ENABLING_AUDIO, function() {
                reInitialiseAudio()
            })
    }

    this.build = function() {
        var err = browser.checkRecordingCapabilities()

        if (!err)
            err = browser.checkBufferTypes()

        if (err)
            this.emit(Events.ERROR, err)

        else {
            recorderElement = visuals.querySelector('video.' + options.selectors.userMediaClass)

            if (!recorderElement)
                buildElement()

            correctDimensions()

            // prevent audio feedback, see
            // https://github.com/binarykitchen/videomail-client/issues/35
            recorderElement.muted = true

            if (!userMedia)
                userMedia = new UserMedia(this, options)

            show()

            if (!built) {
                initEvents()

                if (!connected)
                    initSocket()
                else
                    loadUserMedia()
            } else
                loadUserMedia()

            built = true
        }
    }

    this.isPaused = function() {
        return userMedia && userMedia.isPaused()
    }

    this.isRecording = function() {
        return !!rafId && !this.isPaused() && !isNotifying()
    }

    this.hide = function() {
        if (!isHidden()) {

            recorderElement && hidden(recorderElement, true)

            clearUserMediaTimeout()
            clearRetryTimeout()
        }
    }

    this.isUnloaded = function() {
        return unloaded
    }

    // these two return the true dimensions of the webcam area.
    // needed because on mobiles they might be different.

    this.getRecorderWidth = function(responsive) {
        if (userMedia)
            return userMedia.getRawWidth(responsive)

        else if (responsive && options.hasDefinedWidth())
            return this.limitWidth(options.video.width)
    }

    this.getRecorderHeight = function(responsive) {
        if (userMedia)
            return userMedia.getRawHeight(responsive)

        else if (responsive && options.hasDefinedHeight())
            return this.calculateHeight(responsive)
    }

    function getRatio() {
        var ratio

        if (userMedia)
            ratio = userMedia.getVideoHeight() / userMedia.getVideoWidth()
        else
            ratio = options.getRatio()

        return ratio
    }

    this.calculateWidth = function(responsive) {
        var videoHeight

        if (userMedia)
            videoHeight = userMedia.getVideoHeight()
        else if (recorderElement)
            videoHeight = recorderElement.videoHeight

        return visuals.calculateWidth({
            responsive:  responsive,
            ratio:       getRatio(),
            videoHeight: videoHeight
        })
    }

    this.calculateHeight = function(responsive) {
        var videoWidth

        if (userMedia)
            videoWidth = userMedia.getVideoWidth()
        else if (recorderElement)
            videoWidth = recorderElement.videoWidth

        return visuals.calculateHeight({
            responsive: responsive,
            ratio:      getRatio(),
            videoWidth: videoWidth
        })
    }

    this.getRawVisualUserMedia = function() {
        return recorderElement
    }

    this.isConnected = function() {
        return connected
    }

    this.isConnecting = function() {
        return connecting
    }

    this.limitWidth  = function(width) {
        return visuals.limitWidth(width)
    }

    this.limitHeight  = function(height) {
        return visuals.limitHeight(height)
    }

    this.isUserMediaLoaded = function() {
        return userMediaLoaded
    }
}

util.inherits(Recorder, EventEmitter)

module.exports = Recorder

}).call(this,require("buffer").Buffer)

},{"./../../constants":77,"./../../events":78,"./../../util/browser":82,"./../../util/eventEmitter":84,"./../../util/humanize":85,"./../../util/videomailError":88,"./userMedia":103,"buffer":6,"canvas-to-buffer":7,"hidden":21,"hyperscript":23,"util":69,"websocket-stream":71}],102:[function(require,module,exports){
var util   = require('util'),
    h      = require('hyperscript'),
    hidden = require('hidden'),

    Events          = require('./../../events'),
    Browser         = require('./../../util/browser'),
    EventEmitter    = require('./../../util/eventEmitter'),

    makeVideoPlayableInline

if ('undefined' != typeof navigator)
    makeVideoPlayableInline = require('iphone-inline-video')

var Replay = function(parentElement, options) {

    EventEmitter.call(this, options, 'Replay')

    var self    = this,
        browser = new Browser(options),

        built,
        replayElement,
        videomail

    function buildElement() {
        replayElement = h('video.' + options.selectors.replayClass)
        parentElement.appendChild(replayElement)
    }

    function isStandalone() {
        return parentElement.constructor.name === 'HTMLDivElement'
    }

    function copyAttributes(newVideomail) {
        var attributeContainer

        Object.keys(newVideomail).forEach(function(attribute) {
            attributeContainer = parentElement.querySelector('.' + attribute)

            if (attributeContainer)
                attributeContainer.innerHTML = newVideomail[attribute]
        })
    }

    function correctDimensions(options) {
        var width, height

        if (videomail && videomail.playerWidth)
            width = videomail.playerWidth
        else if (parentElement.calculateWidth)
            width = parentElement.calculateWidth(options)

        if (videomail && videomail.playerHeight)
            height = videomail.playerHeight
        else if (parentElement.calculateHeight)
            height = parentElement.calculateHeight(options)

        if (width > 0)
            replayElement.style.width = width  + 'px'
        else
            replayElement.style.width = 'auto'

        if (height > 0)
            replayElement.style.height = height + 'px'
        else
            replayElement.style.height = 'auto'
    }

    this.setVideomail = function(newVideomail) {
        videomail = newVideomail

        if (videomail.webm)
            this.setWebMSource(videomail.webm)

        if (videomail.mp4)
            this.setMp4Source(videomail.mp4)

        if (videomail.poster)
            replayElement.setAttribute('poster', videomail.poster)

        copyAttributes(newVideomail)

        this.show(videomail.width, videomail.height)
    }

    this.show = function(recorderWidth, recorderHeight) {
        correctDimensions({
            responsive:  true,
            // beware that recorderWidth and recorderHeight can be null sometimes
            videoWidth:  recorderWidth  || replayElement.videoWidth,
            videoHeight: recorderHeight || replayElement.videoHeight
        })

        hidden(replayElement, false)

        // parent element can be any object, be careful!
        if (parentElement) {
            if (parentElement.style)
                hidden(parentElement, false)
            else if (parentElement.show)
                parentElement.show()
        }

        // this must be called after setting the sources and when becoming visible
        // see https://github.com/bfred-it/iphone-inline-video/issues/16
        makeVideoPlayableInline && makeVideoPlayableInline(replayElement, options.isAudioEnabled())

        // this forces to actually fetch the videos from the server
        replayElement.load()

        if (!videomail)
            self.emit(Events.PREVIEW_SHOWN)
        else
            self.emit(Events.REPLAY_SHOWN)
    }

    this.build = function() {
        replayElement = parentElement.querySelector('video.' + options.selectors.replayClass)

        if (!replayElement)
            buildElement()

        this.hide()

        replayElement.setAttribute('autoplay', true)
        replayElement.setAttribute('autostart', true)
        replayElement.setAttribute('autobuffer', true)
        replayElement.setAttribute('controls', 'controls')
        replayElement.setAttribute('preload', 'auto')
        replayElement.setAttribute('webkit-playsinline', 'webkit-playsinline')

        if (!built) {
            if (!isStandalone()) {
                this.on(Events.PREVIEW, function(key, recorderWidth, recorderHeight) {
                    self.show(recorderWidth, recorderHeight)
                })
            }

            replayElement.addEventListener('touchstart', function(e) {
                e && e.preventDefault()

                if (this.paused)
                    play()
                else
                    pause()
            })

            replayElement.onclick = function(e) {
                e && e.preventDefault()

                if (this.paused)
                    play()
                else
                    pause()
            }
        }

        browser.checkPlaybackCapabilities(replayElement)

        built = true
    }

    this.unload = function() {
        built = false
    }

    this.getVideoSource = function(type) {
        var sources = replayElement.getElementsByTagName('source'),
            l       = sources.length,
            type    = 'video/' + type,
            source

        if (l) {
            var i

            for (i = 0; i < l && !source; i++) {
                if (sources[i].getAttribute('type') === type)
                    source = sources[i]
            }
        }

        return source
    }

    function setVideoSource(type, src) {
        var source = self.getVideoSource(type)
        var timestamp = Date.now()

        if (src)
            src += '?' +  timestamp

        if (!source) {
            if (src) {
                var source = h('source', {
                    src:  src,
                    type: 'video/' + type
                })

                replayElement.appendChild(source)
            }
        } else {
            if (src)
                source.setAttribute('src', src)
            else
                replayElement.removeChild(source)
        }
    }

    this.setMp4Source = function(src) {
        setVideoSource('mp4', src)
    }

    this.setWebMSource = function(src) {
        setVideoSource('webm', src)
    }

    this.getVideoType = function() {
        return browser.getVideoType(replayElement)
    }

    function pause(cb) {
        if (replayElement && replayElement.pause)
            replayElement.pause()

        cb && cb()
    }

    function play(cb) {
        if (replayElement && replayElement.play && replayElement.duration) {
            const p = replayElement.play()

            if (p && (typeof Promise !== 'undefined') && (p instanceof Promise)) {
                p.then(function() {
                    cb && cb()
                })
            } else
                cb && cb()
        } else
            cb && cb()
    }

    this.reset = function(cb) {
        // pause video to make sure it won't consume any memory
        pause(function() {
            if (replayElement) {
                self.setMp4Source(null)
                self.setWebMSource(null)
            }

            cb && cb()
        })
    }

    this.hide = function() {
        if (isStandalone())
            hidden(parentElement, true)
        else
            replayElement && hidden(replayElement, true)
    }

    this.isShown = function() {
        return replayElement && !hidden(replayElement)
    }

    this.getParentElement = function() {
        return parentElement
    }
}

util.inherits(Replay, EventEmitter)

module.exports = Replay

},{"./../../events":78,"./../../util/browser":82,"./../../util/eventEmitter":84,"hidden":21,"hyperscript":23,"iphone-inline-video":29,"util":69}],103:[function(require,module,exports){
var h = require('hyperscript'),

    AudioRecorder   = require('./../../util/audioRecorder'),
    VideomailError  = require('./../../util/videomailError'),
    EventEmitter    = require('./../../util/eventEmitter'),
    Events          = require('./../../events')

module.exports = function(recorder, options) {

    EventEmitter.call(this, options, 'UserMedia')

    var rawVisualUserMedia = recorder && recorder.getRawVisualUserMedia(),

        self   = this,
        paused = false,
        record = false,

        audioRecorder,
        currentVisualStream

    function attachMediaStream(stream) {
        currentVisualStream = stream

        if (typeof rawVisualUserMedia.srcObject !== 'undefined')
            rawVisualUserMedia.srcObject = stream

        else if (typeof rawVisualUserMedia.src !== 'undefined') {
            var URL = window.URL || window.webkitURL
            rawVisualUserMedia.src = URL.createObjectURL(stream) || stream

        } else
            console.error('Error attaching stream to element.')
    }

    function setVisualStream(localMediaStream) {
        if (localMediaStream)
            attachMediaStream(localMediaStream)
        else {
            rawVisualUserMedia.removeAttribute('srcObject')
            rawVisualUserMedia.removeAttribute('src')

            currentVisualStream = null
        }
    }

    function getVisualStream() {
        if (rawVisualUserMedia.mozSrcObject)
            return rawVisualUserMedia.mozSrcObject

        else if (rawVisualUserMedia.srcObject)
            return rawVisualUserMedia.srcObject

        else
            return currentVisualStream
    }

    function hasEnded() {
        if (rawVisualUserMedia.ended)
            return rawVisualUserMedia.ended
        else {
            var visualStream = getVisualStream()
            return visualStream && visualStream.ended
        }
    }

    function hasInvalidDimensions() {
        if ((rawVisualUserMedia.videoWidth && rawVisualUserMedia.videoWidth < 3) ||
            (rawVisualUserMedia.height && rawVisualUserMedia.height < 3)) {
            return true
        }
    }

    function getTracks(localMediaStream) {
        var tracks

        if (localMediaStream && localMediaStream.getTracks)
            tracks = localMediaStream.getTracks()

        return tracks
    }

    function getVideoTracks(localMediaStream) {
        var videoTracks

        if (localMediaStream && localMediaStream.getVideoTracks)
            videoTracks = localMediaStream.getVideoTracks()

        return videoTracks
    }

    function getFirstVideoTrack(localMediaStream) {
        var videoTracks = getVideoTracks(localMediaStream),
            videoTrack

        if (videoTracks && videoTracks[0])
            videoTrack = videoTracks[0]

        return videoTrack
    }

    this.init = function(localMediaStream, videoCallback, audioCallback, endedEarlyCallback) {

        this.stop(localMediaStream, true)

        var onPlayReached           = false,
            onLoadedMetaDataReached = false

        if (options && options.isAudioEnabled())
            audioRecorder = new AudioRecorder(this, options)

        function fireCallbacks() {
            if (onPlayReached && onLoadedMetaDataReached) {
                videoCallback()

                if (audioRecorder && audioCallback) {
                    try {
                        audioRecorder.init(localMediaStream)
                    } catch (exc) {
                        self.emit(Events.ERROR, exc)
                    }

                    self.on(Events.RECORDING, function() {
                        audioRecorder && audioRecorder.record(audioCallback)
                    })
                }
            }
        }

        function onPlay() {
            try {
                options.debug('UserMedia: onPlay()', 'audio =', options.isAudioEnabled())

                rawVisualUserMedia.removeEventListener &&
                rawVisualUserMedia.removeEventListener('play', onPlay)

                localMediaStream.removeEventListener &&
                localMediaStream.removeEventListener('ended', onPlay)

                if (hasEnded() || hasInvalidDimensions())
                    endedEarlyCallback(
                        VideomailError.create(
                            'Already busy',
                            'Probably another browser window is using your webcam?',
                            options
                        )
                    )
                else {
                    onPlayReached = true
                    fireCallbacks()
                }
            } catch (exc) {
                self.emit(Events.ERROR, exc)
            }
        }

        function onLoadedMetaData() {
            rawVisualUserMedia.removeEventListener &&
            rawVisualUserMedia.removeEventListener('loadedmetadata', onLoadedMetaData)

            if (!hasEnded() && !hasInvalidDimensions()) {
                options.debug('UserMedia: onLoadedMetaData()')

                self.emit(Events.LOADED_META_DATA)

                // for android devices, we cannot call play() unless meta data has been loaded!
                rawVisualUserMedia.play()

                onLoadedMetaDataReached = true
                fireCallbacks()
            }
        }

        // not really needed, just an useful listener for debugging
        function onCanPlayThrough() {
            rawVisualUserMedia.removeEventListener &&
            rawVisualUserMedia.removeEventListener('canplaythrough', onCanPlayThrough)

            options.debug('UserMedia: onCanPlayThrough()')

            if (hasInvalidDimensions()) {
                options.debug('UserMedia: still invalid')
            }
        }

        try {
            var videoTrack = getFirstVideoTrack(localMediaStream)

            if (!videoTrack)
                options.debug('UserMedia: detected (but no video tracks exist')
            else {
                var description

                if (videoTrack.label && videoTrack.label.length > 0)
                    description = videoTrack.label
                else
                    description = videoTrack.kind

                options.debug('UserMedia: detected', description ? description : '')
            }

            var heavyDebugging = false

            if (heavyDebugging) {
                // useful list of all available user media related events
                var EVENTS = [
                    'audioprocess',
                    'canplay',
                    'canplaythrough',
                    'durationchange',
                    'emptied',
                    'ended',
                    'loadeddata',
                    'loadedmetadata',
                    'MozAudioAvailable',
                    'pause',
                    'play',
                    'playing',
                    'ratechange',
                    'seeked',
                    'seeking',
                    'stalled',
                    'suspend',
                    'timeupdate',
                    'volumechange',
                    'waiting',
                    'complete'
                ]

                EVENTS.forEach(function(eventName) {
                    rawVisualUserMedia.addEventListener(eventName, function() {
                        console.log('userMedia event:', eventName)
                    }, false)
                })
            }

            rawVisualUserMedia.addEventListener('canplaythrough',  onCanPlayThrough)
            rawVisualUserMedia.addEventListener('loadedmetadata',  onLoadedMetaData)
            rawVisualUserMedia.addEventListener('play',            onPlay)

            setVisualStream(localMediaStream)

            rawVisualUserMedia.play()
        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    this.isReady = function() {
        return !!rawVisualUserMedia.src
    }

    this.stop = function(visualStream, aboutToInitialize) {
        try {
            // do not stop "too much" when going to initialize anyway
            if (!aboutToInitialize) {
                if (!visualStream)
                    visualStream = getVisualStream()

                var tracks = getTracks(visualStream)

                if (tracks)
                    tracks.forEach(function(track) {
                        track.stop()
                    })

                // will probably become obsolete in one year (after june 2017)
                visualStream && visualStream.stop && visualStream.stop()

                setVisualStream(null)

                audioRecorder && audioRecorder.stop()

                audioRecorder = null
            }

            paused = record = false

        } catch (exc) {
            self.emit(Events.ERROR, exc)
        }
    }

    this.createCanvas = function() {
        // it's important not to use the responsive flag here so that
        // the true pixels are being used for the image generation
        return h('canvas', {
            width:  this.getRawWidth(),
            height: this.getRawHeight()
        })
    }

    this.getVideoHeight = function() {
        return rawVisualUserMedia.videoHeight
    }

    this.getVideoWidth = function() {
        return rawVisualUserMedia.videoWidth
    }

    this.getRawWidth = function(responsive) {
        var rawWidth     = this.getVideoWidth(),
            widthDefined = options.hasDefinedWidth()

        if (widthDefined || options.hasDefinedHeight()) {
            if (!responsive && widthDefined)
                rawWidth = options.video.width
            else
                rawWidth = recorder.calculateWidth(responsive)
        }

        if (responsive)
            rawWidth = recorder.limitWidth(rawWidth)

        return rawWidth
    }

    this.getRawHeight = function(responsive) {
        var rawHeight

        if (options.hasDefinedDimension()) {
            rawHeight = recorder.calculateHeight(responsive)

            if (rawHeight < 1)
                throw VideomailError.create('Calculated raw height cannot be less than 1!')
        } else {
            rawHeight =  this.getVideoHeight()

            if (rawHeight < 1)
                throw VideomailError.create('Raw video height from DOM element cannot be less than 1!')
        }

        if (responsive)
            rawHeight = recorder.limitHeight(rawHeight)

        return rawHeight
    }

    this.getRawVisuals = function() {
        return rawVisualUserMedia
    }

    this.pause = function() {
        paused = true
    }

    this.isPaused = function() {
        return paused
    }

    this.resume = function() {
        paused = false
    }

    this.record = function() {
        record = true
    }

    this.isRecording = function() {
        return record
    }

    this.getAudioSampleRate = function() {
        if (audioRecorder)
            return audioRecorder.getSampleRate()
        else
            return -1
    }
}

},{"./../../events":78,"./../../util/audioRecorder":81,"./../../util/eventEmitter":84,"./../../util/videomailError":88,"hyperscript":23}],"videomail-client":[function(require,module,exports){
var standardize = require('./util/standardize'),
    Client = require('./client')

if (!navigator) {
    throw new Error('Navigator is missing!')

} else {
    // Ensures Videomail functionality is not broken on exotic browsers with shims.
    //
    // UMD (Universal Module Definition), inspired by https://github.com/es-shims/es5-shim
    ;(function(navigator) {
        standardize(this, navigator)

    }(navigator))
}

module.exports = Client

},{"./client":76,"./util/standardize":87}]},{},["videomail-client"])