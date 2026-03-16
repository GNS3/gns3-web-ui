"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _int = require("./util/int.js");
var Log = _interopRequireWildcard(require("./util/logging.js"));
var _strings = require("./util/strings.js");
var _browser = require("./util/browser.js");
var _element = require("./util/element.js");
var _events = require("./util/events.js");
var _eventtarget = _interopRequireDefault(require("./util/eventtarget.js"));
var _display = _interopRequireDefault(require("./display.js"));
var _inflator = _interopRequireDefault(require("./inflator.js"));
var _deflator = _interopRequireDefault(require("./deflator.js"));
var _keyboard = _interopRequireDefault(require("./input/keyboard.js"));
var _gesturehandler = _interopRequireDefault(require("./input/gesturehandler.js"));
var _cursor = _interopRequireDefault(require("./util/cursor.js"));
var _websock = _interopRequireDefault(require("./websock.js"));
var _des = _interopRequireDefault(require("./des.js"));
var _keysym = _interopRequireDefault(require("./input/keysym.js"));
var _xtscancodes = _interopRequireDefault(require("./input/xtscancodes.js"));
var _encodings = require("./encodings.js");
var _ra = _interopRequireDefault(require("./ra2.js"));
var _md = require("./util/md5.js");
var _raw = _interopRequireDefault(require("./decoders/raw.js"));
var _copyrect = _interopRequireDefault(require("./decoders/copyrect.js"));
var _rre = _interopRequireDefault(require("./decoders/rre.js"));
var _hextile = _interopRequireDefault(require("./decoders/hextile.js"));
var _tight = _interopRequireDefault(require("./decoders/tight.js"));
var _tightpng = _interopRequireDefault(require("./decoders/tightpng.js"));
var _zrle = _interopRequireDefault(require("./decoders/zrle.js"));
var _jpeg = _interopRequireDefault(require("./decoders/jpeg.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
// How many seconds to wait for a disconnect to finish
var DISCONNECT_TIMEOUT = 3;
var DEFAULT_BACKGROUND = 'rgb(40, 40, 40)';

// Minimum wait (ms) between two mouse moves
var MOUSE_MOVE_DELAY = 17;

// Wheel thresholds
var WHEEL_STEP = 50; // Pixels needed for one step
var WHEEL_LINE_HEIGHT = 19; // Assumed pixels for one line step

// Gesture thresholds
var GESTURE_ZOOMSENS = 75;
var GESTURE_SCRLSENS = 50;
var DOUBLE_TAP_TIMEOUT = 1000;
var DOUBLE_TAP_THRESHOLD = 50;

// Security types
var securityTypeNone = 1;
var securityTypeVNCAuth = 2;
var securityTypeRA2ne = 6;
var securityTypeTight = 16;
var securityTypeVeNCrypt = 19;
var securityTypeXVP = 22;
var securityTypeARD = 30;
var securityTypeMSLogonII = 113;

// Special Tight security types
var securityTypeUnixLogon = 129;

// VeNCrypt security types
var securityTypePlain = 256;

// Extended clipboard pseudo-encoding formats
var extendedClipboardFormatText = 1;
/*eslint-disable no-unused-vars */
var extendedClipboardFormatRtf = 1 << 1;
var extendedClipboardFormatHtml = 1 << 2;
var extendedClipboardFormatDib = 1 << 3;
var extendedClipboardFormatFiles = 1 << 4;
/*eslint-enable */

// Extended clipboard pseudo-encoding actions
var extendedClipboardActionCaps = 1 << 24;
var extendedClipboardActionRequest = 1 << 25;
var extendedClipboardActionPeek = 1 << 26;
var extendedClipboardActionNotify = 1 << 27;
var extendedClipboardActionProvide = 1 << 28;
var RFB = /*#__PURE__*/function (_EventTargetMixin) {
  _inherits(RFB, _EventTargetMixin);
  var _super = _createSuper(RFB);
  function RFB(target, urlOrChannel, options) {
    var _this;
    _classCallCheck(this, RFB);
    if (!target) {
      throw new Error("Must specify target");
    }
    if (!urlOrChannel) {
      throw new Error("Must specify URL, WebSocket or RTCDataChannel");
    }

    // We rely on modern APIs which might not be available in an
    // insecure context
    if (!window.isSecureContext) {
      Log.Error("noVNC requires a secure context (TLS). Expect crashes!");
    }
    _this = _super.call(this);
    _this._target = target;
    if (typeof urlOrChannel === "string") {
      _this._url = urlOrChannel;
    } else {
      _this._url = null;
      _this._rawChannel = urlOrChannel;
    }

    // Connection details
    options = options || {};
    _this._rfbCredentials = options.credentials || {};
    _this._shared = 'shared' in options ? !!options.shared : true;
    _this._repeaterID = options.repeaterID || '';
    _this._wsProtocols = options.wsProtocols || [];

    // Internal state
    _this._rfbConnectionState = '';
    _this._rfbInitState = '';
    _this._rfbAuthScheme = -1;
    _this._rfbCleanDisconnect = true;
    _this._rfbRSAAESAuthenticationState = null;

    // Server capabilities
    _this._rfbVersion = 0;
    _this._rfbMaxVersion = 3.8;
    _this._rfbTightVNC = false;
    _this._rfbVeNCryptState = 0;
    _this._rfbXvpVer = 0;
    _this._fbWidth = 0;
    _this._fbHeight = 0;
    _this._fbName = "";
    _this._capabilities = {
      power: false
    };
    _this._supportsFence = false;
    _this._supportsContinuousUpdates = false;
    _this._enabledContinuousUpdates = false;
    _this._supportsSetDesktopSize = false;
    _this._screenID = 0;
    _this._screenFlags = 0;
    _this._qemuExtKeyEventSupported = false;
    _this._clipboardText = null;
    _this._clipboardServerCapabilitiesActions = {};
    _this._clipboardServerCapabilitiesFormats = {};

    // Internal objects
    _this._sock = null; // Websock object
    _this._display = null; // Display object
    _this._flushing = false; // Display flushing state
    _this._keyboard = null; // Keyboard input handler object
    _this._gestures = null; // Gesture input handler object
    _this._resizeObserver = null; // Resize observer object

    // Timers
    _this._disconnTimer = null; // disconnection timer
    _this._resizeTimeout = null; // resize rate limiting
    _this._mouseMoveTimer = null;

    // Decoder states
    _this._decoders = {};
    _this._FBU = {
      rects: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      encoding: null
    };

    // Mouse state
    _this._mousePos = {};
    _this._mouseButtonMask = 0;
    _this._mouseLastMoveTime = 0;
    _this._viewportDragging = false;
    _this._viewportDragPos = {};
    _this._viewportHasMoved = false;
    _this._accumulatedWheelDeltaX = 0;
    _this._accumulatedWheelDeltaY = 0;

    // Gesture state
    _this._gestureLastTapTime = null;
    _this._gestureFirstDoubleTapEv = null;
    _this._gestureLastMagnitudeX = 0;
    _this._gestureLastMagnitudeY = 0;

    // Bound event handlers
    _this._eventHandlers = {
      focusCanvas: _this._focusCanvas.bind(_assertThisInitialized(_this)),
      handleResize: _this._handleResize.bind(_assertThisInitialized(_this)),
      handleMouse: _this._handleMouse.bind(_assertThisInitialized(_this)),
      handleWheel: _this._handleWheel.bind(_assertThisInitialized(_this)),
      handleGesture: _this._handleGesture.bind(_assertThisInitialized(_this)),
      handleRSAAESCredentialsRequired: _this._handleRSAAESCredentialsRequired.bind(_assertThisInitialized(_this)),
      handleRSAAESServerVerification: _this._handleRSAAESServerVerification.bind(_assertThisInitialized(_this))
    };

    // main setup
    Log.Debug(">> RFB.constructor");

    // Create DOM elements
    _this._screen = document.createElement('div');
    _this._screen.style.display = 'flex';
    _this._screen.style.width = '100%';
    _this._screen.style.height = '100%';
    _this._screen.style.overflow = 'auto';
    _this._screen.style.background = DEFAULT_BACKGROUND;
    _this._canvas = document.createElement('canvas');
    _this._canvas.style.margin = 'auto';
    // Some browsers add an outline on focus
    _this._canvas.style.outline = 'none';
    _this._canvas.width = 0;
    _this._canvas.height = 0;
    _this._canvas.tabIndex = -1;
    _this._screen.appendChild(_this._canvas);

    // Cursor
    _this._cursor = new _cursor["default"]();

    // XXX: TightVNC 2.8.11 sends no cursor at all until Windows changes
    // it. Result: no cursor at all until a window border or an edit field
    // is hit blindly. But there are also VNC servers that draw the cursor
    // in the framebuffer and don't send the empty local cursor. There is
    // no way to satisfy both sides.
    //
    // The spec is unclear on this "initial cursor" issue. Many other
    // viewers (TigerVNC, RealVNC, Remmina) display an arrow as the
    // initial cursor instead.
    _this._cursorImage = RFB.cursors.none;

    // populate decoder array with objects
    _this._decoders[_encodings.encodings.encodingRaw] = new _raw["default"]();
    _this._decoders[_encodings.encodings.encodingCopyRect] = new _copyrect["default"]();
    _this._decoders[_encodings.encodings.encodingRRE] = new _rre["default"]();
    _this._decoders[_encodings.encodings.encodingHextile] = new _hextile["default"]();
    _this._decoders[_encodings.encodings.encodingTight] = new _tight["default"]();
    _this._decoders[_encodings.encodings.encodingTightPNG] = new _tightpng["default"]();
    _this._decoders[_encodings.encodings.encodingZRLE] = new _zrle["default"]();
    _this._decoders[_encodings.encodings.encodingJPEG] = new _jpeg["default"]();

    // NB: nothing that needs explicit teardown should be done
    // before this point, since this can throw an exception
    try {
      _this._display = new _display["default"](_this._canvas);
    } catch (exc) {
      Log.Error("Display exception: " + exc);
      throw exc;
    }
    _this._display.onflush = _this._onFlush.bind(_assertThisInitialized(_this));
    _this._keyboard = new _keyboard["default"](_this._canvas);
    _this._keyboard.onkeyevent = _this._handleKeyEvent.bind(_assertThisInitialized(_this));
    _this._gestures = new _gesturehandler["default"]();
    _this._sock = new _websock["default"]();
    _this._sock.on('open', _this._socketOpen.bind(_assertThisInitialized(_this)));
    _this._sock.on('close', _this._socketClose.bind(_assertThisInitialized(_this)));
    _this._sock.on('message', _this._handleMessage.bind(_assertThisInitialized(_this)));
    _this._sock.on('error', _this._socketError.bind(_assertThisInitialized(_this)));
    _this._expectedClientWidth = null;
    _this._expectedClientHeight = null;
    _this._resizeObserver = new ResizeObserver(_this._eventHandlers.handleResize);

    // All prepared, kick off the connection
    _this._updateConnectionState('connecting');
    Log.Debug("<< RFB.constructor");

    // ===== PROPERTIES =====

    _this.dragViewport = false;
    _this.focusOnClick = true;
    _this._viewOnly = false;
    _this._clipViewport = false;
    _this._clippingViewport = false;
    _this._scaleViewport = false;
    _this._resizeSession = false;
    _this._showDotCursor = false;
    if (options.showDotCursor !== undefined) {
      Log.Warn("Specifying showDotCursor as a RFB constructor argument is deprecated");
      _this._showDotCursor = options.showDotCursor;
    }
    _this._qualityLevel = 6;
    _this._compressionLevel = 2;
    return _this;
  }

  // ===== PROPERTIES =====
  _createClass(RFB, [{
    key: "viewOnly",
    get: function get() {
      return this._viewOnly;
    },
    set: function set(viewOnly) {
      this._viewOnly = viewOnly;
      if (this._rfbConnectionState === "connecting" || this._rfbConnectionState === "connected") {
        if (viewOnly) {
          this._keyboard.ungrab();
        } else {
          this._keyboard.grab();
        }
      }
    }
  }, {
    key: "capabilities",
    get: function get() {
      return this._capabilities;
    }
  }, {
    key: "clippingViewport",
    get: function get() {
      return this._clippingViewport;
    }
  }, {
    key: "_setClippingViewport",
    value: function _setClippingViewport(on) {
      if (on === this._clippingViewport) {
        return;
      }
      this._clippingViewport = on;
      this.dispatchEvent(new CustomEvent("clippingviewport", {
        detail: this._clippingViewport
      }));
    }
  }, {
    key: "touchButton",
    get: function get() {
      return 0;
    },
    set: function set(button) {
      Log.Warn("Using old API!");
    }
  }, {
    key: "clipViewport",
    get: function get() {
      return this._clipViewport;
    },
    set: function set(viewport) {
      this._clipViewport = viewport;
      this._updateClip();
    }
  }, {
    key: "scaleViewport",
    get: function get() {
      return this._scaleViewport;
    },
    set: function set(scale) {
      this._scaleViewport = scale;
      // Scaling trumps clipping, so we may need to adjust
      // clipping when enabling or disabling scaling
      if (scale && this._clipViewport) {
        this._updateClip();
      }
      this._updateScale();
      if (!scale && this._clipViewport) {
        this._updateClip();
      }
    }
  }, {
    key: "resizeSession",
    get: function get() {
      return this._resizeSession;
    },
    set: function set(resize) {
      this._resizeSession = resize;
      if (resize) {
        this._requestRemoteResize();
      }
    }
  }, {
    key: "showDotCursor",
    get: function get() {
      return this._showDotCursor;
    },
    set: function set(show) {
      this._showDotCursor = show;
      this._refreshCursor();
    }
  }, {
    key: "background",
    get: function get() {
      return this._screen.style.background;
    },
    set: function set(cssValue) {
      this._screen.style.background = cssValue;
    }
  }, {
    key: "qualityLevel",
    get: function get() {
      return this._qualityLevel;
    },
    set: function set(qualityLevel) {
      if (!Number.isInteger(qualityLevel) || qualityLevel < 0 || qualityLevel > 9) {
        Log.Error("qualityLevel must be an integer between 0 and 9");
        return;
      }
      if (this._qualityLevel === qualityLevel) {
        return;
      }
      this._qualityLevel = qualityLevel;
      if (this._rfbConnectionState === 'connected') {
        this._sendEncodings();
      }
    }
  }, {
    key: "compressionLevel",
    get: function get() {
      return this._compressionLevel;
    },
    set: function set(compressionLevel) {
      if (!Number.isInteger(compressionLevel) || compressionLevel < 0 || compressionLevel > 9) {
        Log.Error("compressionLevel must be an integer between 0 and 9");
        return;
      }
      if (this._compressionLevel === compressionLevel) {
        return;
      }
      this._compressionLevel = compressionLevel;
      if (this._rfbConnectionState === 'connected') {
        this._sendEncodings();
      }
    }

    // ===== PUBLIC METHODS =====
  }, {
    key: "disconnect",
    value: function disconnect() {
      this._updateConnectionState('disconnecting');
      this._sock.off('error');
      this._sock.off('message');
      this._sock.off('open');
      if (this._rfbRSAAESAuthenticationState !== null) {
        this._rfbRSAAESAuthenticationState.disconnect();
      }
    }
  }, {
    key: "approveServer",
    value: function approveServer() {
      if (this._rfbRSAAESAuthenticationState !== null) {
        this._rfbRSAAESAuthenticationState.approveServer();
      }
    }
  }, {
    key: "sendCredentials",
    value: function sendCredentials(creds) {
      this._rfbCredentials = creds;
      this._resumeAuthentication();
    }
  }, {
    key: "sendCtrlAltDel",
    value: function sendCtrlAltDel() {
      if (this._rfbConnectionState !== 'connected' || this._viewOnly) {
        return;
      }
      Log.Info("Sending Ctrl-Alt-Del");
      this.sendKey(_keysym["default"].XK_Control_L, "ControlLeft", true);
      this.sendKey(_keysym["default"].XK_Alt_L, "AltLeft", true);
      this.sendKey(_keysym["default"].XK_Delete, "Delete", true);
      this.sendKey(_keysym["default"].XK_Delete, "Delete", false);
      this.sendKey(_keysym["default"].XK_Alt_L, "AltLeft", false);
      this.sendKey(_keysym["default"].XK_Control_L, "ControlLeft", false);
    }
  }, {
    key: "machineShutdown",
    value: function machineShutdown() {
      this._xvpOp(1, 2);
    }
  }, {
    key: "machineReboot",
    value: function machineReboot() {
      this._xvpOp(1, 3);
    }
  }, {
    key: "machineReset",
    value: function machineReset() {
      this._xvpOp(1, 4);
    }

    // Send a key press. If 'down' is not specified then send a down key
    // followed by an up key.
  }, {
    key: "sendKey",
    value: function sendKey(keysym, code, down) {
      if (this._rfbConnectionState !== 'connected' || this._viewOnly) {
        return;
      }
      if (down === undefined) {
        this.sendKey(keysym, code, true);
        this.sendKey(keysym, code, false);
        return;
      }
      var scancode = _xtscancodes["default"][code];
      if (this._qemuExtKeyEventSupported && scancode) {
        // 0 is NoSymbol
        keysym = keysym || 0;
        Log.Info("Sending key (" + (down ? "down" : "up") + "): keysym " + keysym + ", scancode " + scancode);
        RFB.messages.QEMUExtendedKeyEvent(this._sock, keysym, down, scancode);
      } else {
        if (!keysym) {
          return;
        }
        Log.Info("Sending keysym (" + (down ? "down" : "up") + "): " + keysym);
        RFB.messages.keyEvent(this._sock, keysym, down ? 1 : 0);
      }
    }
  }, {
    key: "focus",
    value: function focus(options) {
      this._canvas.focus(options);
    }
  }, {
    key: "blur",
    value: function blur() {
      this._canvas.blur();
    }
  }, {
    key: "clipboardPasteFrom",
    value: function clipboardPasteFrom(text) {
      if (this._rfbConnectionState !== 'connected' || this._viewOnly) {
        return;
      }
      if (this._clipboardServerCapabilitiesFormats[extendedClipboardFormatText] && this._clipboardServerCapabilitiesActions[extendedClipboardActionNotify]) {
        this._clipboardText = text;
        RFB.messages.extendedClipboardNotify(this._sock, [extendedClipboardFormatText]);
      } else {
        var length, i;
        var data;
        length = 0;
        // eslint-disable-next-line no-unused-vars
        var _iterator = _createForOfIteratorHelper(text),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var codePoint = _step.value;
            length++;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        data = new Uint8Array(length);
        i = 0;
        var _iterator2 = _createForOfIteratorHelper(text),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _codePoint = _step2.value;
            var code = _codePoint.codePointAt(0);

            /* Only ISO 8859-1 is supported */
            if (code > 0xff) {
              code = 0x3f; // '?'
            }

            data[i++] = code;
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        RFB.messages.clientCutText(this._sock, data);
      }
    }
  }, {
    key: "getImageData",
    value: function getImageData() {
      return this._display.getImageData();
    }
  }, {
    key: "toDataURL",
    value: function toDataURL(type, encoderOptions) {
      return this._display.toDataURL(type, encoderOptions);
    }
  }, {
    key: "toBlob",
    value: function toBlob(callback, type, quality) {
      return this._display.toBlob(callback, type, quality);
    }

    // ===== PRIVATE METHODS =====
  }, {
    key: "_connect",
    value: function _connect() {
      Log.Debug(">> RFB.connect");
      if (this._url) {
        Log.Info("connecting to ".concat(this._url));
        this._sock.open(this._url, this._wsProtocols);
      } else {
        Log.Info("attaching ".concat(this._rawChannel, " to Websock"));
        this._sock.attach(this._rawChannel);
        if (this._sock.readyState === 'closed') {
          throw Error("Cannot use already closed WebSocket/RTCDataChannel");
        }
        if (this._sock.readyState === 'open') {
          // FIXME: _socketOpen() can in theory call _fail(), which
          //        isn't allowed this early, but I'm not sure that can
          //        happen without a bug messing up our state variables
          this._socketOpen();
        }
      }

      // Make our elements part of the page
      this._target.appendChild(this._screen);
      this._gestures.attach(this._canvas);
      this._cursor.attach(this._canvas);
      this._refreshCursor();

      // Monitor size changes of the screen element
      this._resizeObserver.observe(this._screen);

      // Always grab focus on some kind of click event
      this._canvas.addEventListener("mousedown", this._eventHandlers.focusCanvas);
      this._canvas.addEventListener("touchstart", this._eventHandlers.focusCanvas);

      // Mouse events
      this._canvas.addEventListener('mousedown', this._eventHandlers.handleMouse);
      this._canvas.addEventListener('mouseup', this._eventHandlers.handleMouse);
      this._canvas.addEventListener('mousemove', this._eventHandlers.handleMouse);
      // Prevent middle-click pasting (see handler for why we bind to document)
      this._canvas.addEventListener('click', this._eventHandlers.handleMouse);
      // preventDefault() on mousedown doesn't stop this event for some
      // reason so we have to explicitly block it
      this._canvas.addEventListener('contextmenu', this._eventHandlers.handleMouse);

      // Wheel events
      this._canvas.addEventListener("wheel", this._eventHandlers.handleWheel);

      // Gesture events
      this._canvas.addEventListener("gesturestart", this._eventHandlers.handleGesture);
      this._canvas.addEventListener("gesturemove", this._eventHandlers.handleGesture);
      this._canvas.addEventListener("gestureend", this._eventHandlers.handleGesture);
      Log.Debug("<< RFB.connect");
    }
  }, {
    key: "_disconnect",
    value: function _disconnect() {
      Log.Debug(">> RFB.disconnect");
      this._cursor.detach();
      this._canvas.removeEventListener("gesturestart", this._eventHandlers.handleGesture);
      this._canvas.removeEventListener("gesturemove", this._eventHandlers.handleGesture);
      this._canvas.removeEventListener("gestureend", this._eventHandlers.handleGesture);
      this._canvas.removeEventListener("wheel", this._eventHandlers.handleWheel);
      this._canvas.removeEventListener('mousedown', this._eventHandlers.handleMouse);
      this._canvas.removeEventListener('mouseup', this._eventHandlers.handleMouse);
      this._canvas.removeEventListener('mousemove', this._eventHandlers.handleMouse);
      this._canvas.removeEventListener('click', this._eventHandlers.handleMouse);
      this._canvas.removeEventListener('contextmenu', this._eventHandlers.handleMouse);
      this._canvas.removeEventListener("mousedown", this._eventHandlers.focusCanvas);
      this._canvas.removeEventListener("touchstart", this._eventHandlers.focusCanvas);
      this._resizeObserver.disconnect();
      this._keyboard.ungrab();
      this._gestures.detach();
      this._sock.close();
      try {
        this._target.removeChild(this._screen);
      } catch (e) {
        if (e.name === 'NotFoundError') {
          // Some cases where the initial connection fails
          // can disconnect before the _screen is created
        } else {
          throw e;
        }
      }
      clearTimeout(this._resizeTimeout);
      clearTimeout(this._mouseMoveTimer);
      Log.Debug("<< RFB.disconnect");
    }
  }, {
    key: "_socketOpen",
    value: function _socketOpen() {
      if (this._rfbConnectionState === 'connecting' && this._rfbInitState === '') {
        this._rfbInitState = 'ProtocolVersion';
        Log.Debug("Starting VNC handshake");
      } else {
        this._fail("Unexpected server connection while " + this._rfbConnectionState);
      }
    }
  }, {
    key: "_socketClose",
    value: function _socketClose(e) {
      Log.Debug("WebSocket on-close event");
      var msg = "";
      if (e.code) {
        msg = "(code: " + e.code;
        if (e.reason) {
          msg += ", reason: " + e.reason;
        }
        msg += ")";
      }
      switch (this._rfbConnectionState) {
        case 'connecting':
          this._fail("Connection closed " + msg);
          break;
        case 'connected':
          // Handle disconnects that were initiated server-side
          this._updateConnectionState('disconnecting');
          this._updateConnectionState('disconnected');
          break;
        case 'disconnecting':
          // Normal disconnection path
          this._updateConnectionState('disconnected');
          break;
        case 'disconnected':
          this._fail("Unexpected server disconnect " + "when already disconnected " + msg);
          break;
        default:
          this._fail("Unexpected server disconnect before connecting " + msg);
          break;
      }
      this._sock.off('close');
      // Delete reference to raw channel to allow cleanup.
      this._rawChannel = null;
    }
  }, {
    key: "_socketError",
    value: function _socketError(e) {
      Log.Warn("WebSocket on-error event");
    }
  }, {
    key: "_focusCanvas",
    value: function _focusCanvas(event) {
      if (!this.focusOnClick) {
        return;
      }
      this.focus({
        preventScroll: true
      });
    }
  }, {
    key: "_setDesktopName",
    value: function _setDesktopName(name) {
      this._fbName = name;
      this.dispatchEvent(new CustomEvent("desktopname", {
        detail: {
          name: this._fbName
        }
      }));
    }
  }, {
    key: "_saveExpectedClientSize",
    value: function _saveExpectedClientSize() {
      this._expectedClientWidth = this._screen.clientWidth;
      this._expectedClientHeight = this._screen.clientHeight;
    }
  }, {
    key: "_currentClientSize",
    value: function _currentClientSize() {
      return [this._screen.clientWidth, this._screen.clientHeight];
    }
  }, {
    key: "_clientHasExpectedSize",
    value: function _clientHasExpectedSize() {
      var _this$_currentClientS = this._currentClientSize(),
        _this$_currentClientS2 = _slicedToArray(_this$_currentClientS, 2),
        currentWidth = _this$_currentClientS2[0],
        currentHeight = _this$_currentClientS2[1];
      return currentWidth == this._expectedClientWidth && currentHeight == this._expectedClientHeight;
    }
  }, {
    key: "_handleResize",
    value: function _handleResize() {
      var _this2 = this;
      // Don't change anything if the client size is already as expected
      if (this._clientHasExpectedSize()) {
        return;
      }
      // If the window resized then our screen element might have
      // as well. Update the viewport dimensions.
      window.requestAnimationFrame(function () {
        _this2._updateClip();
        _this2._updateScale();
      });
      if (this._resizeSession) {
        // Request changing the resolution of the remote display to
        // the size of the local browser viewport.

        // In order to not send multiple requests before the browser-resize
        // is finished we wait 0.5 seconds before sending the request.
        clearTimeout(this._resizeTimeout);
        this._resizeTimeout = setTimeout(this._requestRemoteResize.bind(this), 500);
      }
    }

    // Update state of clipping in Display object, and make sure the
    // configured viewport matches the current screen size
  }, {
    key: "_updateClip",
    value: function _updateClip() {
      var curClip = this._display.clipViewport;
      var newClip = this._clipViewport;
      if (this._scaleViewport) {
        // Disable viewport clipping if we are scaling
        newClip = false;
      }
      if (curClip !== newClip) {
        this._display.clipViewport = newClip;
      }
      if (newClip) {
        // When clipping is enabled, the screen is limited to
        // the size of the container.
        var size = this._screenSize();
        this._display.viewportChangeSize(size.w, size.h);
        this._fixScrollbars();
        this._setClippingViewport(size.w < this._display.width || size.h < this._display.height);
      } else {
        this._setClippingViewport(false);
      }

      // When changing clipping we might show or hide scrollbars.
      // This causes the expected client dimensions to change.
      if (curClip !== newClip) {
        this._saveExpectedClientSize();
      }
    }
  }, {
    key: "_updateScale",
    value: function _updateScale() {
      if (!this._scaleViewport) {
        this._display.scale = 1.0;
      } else {
        var size = this._screenSize();
        this._display.autoscale(size.w, size.h);
      }
      this._fixScrollbars();
    }

    // Requests a change of remote desktop size. This message is an extension
    // and may only be sent if we have received an ExtendedDesktopSize message
  }, {
    key: "_requestRemoteResize",
    value: function _requestRemoteResize() {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = null;
      if (!this._resizeSession || this._viewOnly || !this._supportsSetDesktopSize) {
        return;
      }
      var size = this._screenSize();
      RFB.messages.setDesktopSize(this._sock, Math.floor(size.w), Math.floor(size.h), this._screenID, this._screenFlags);
      Log.Debug('Requested new desktop size: ' + size.w + 'x' + size.h);
    }

    // Gets the the size of the available screen
  }, {
    key: "_screenSize",
    value: function _screenSize() {
      var r = this._screen.getBoundingClientRect();
      return {
        w: r.width,
        h: r.height
      };
    }
  }, {
    key: "_fixScrollbars",
    value: function _fixScrollbars() {
      // This is a hack because Safari on macOS screws up the calculation
      // for when scrollbars are needed. We get scrollbars when making the
      // browser smaller, despite remote resize being enabled. So to fix it
      // we temporarily toggle them off and on.
      var orig = this._screen.style.overflow;
      this._screen.style.overflow = 'hidden';
      // Force Safari to recalculate the layout by asking for
      // an element's dimensions
      this._screen.getBoundingClientRect();
      this._screen.style.overflow = orig;
    }

    /*
     * Connection states:
     *   connecting
     *   connected
     *   disconnecting
     *   disconnected - permanent state
     */
  }, {
    key: "_updateConnectionState",
    value: function _updateConnectionState(state) {
      var _this3 = this;
      var oldstate = this._rfbConnectionState;
      if (state === oldstate) {
        Log.Debug("Already in state '" + state + "', ignoring");
        return;
      }

      // The 'disconnected' state is permanent for each RFB object
      if (oldstate === 'disconnected') {
        Log.Error("Tried changing state of a disconnected RFB object");
        return;
      }

      // Ensure proper transitions before doing anything
      switch (state) {
        case 'connected':
          if (oldstate !== 'connecting') {
            Log.Error("Bad transition to connected state, " + "previous connection state: " + oldstate);
            return;
          }
          break;
        case 'disconnected':
          if (oldstate !== 'disconnecting') {
            Log.Error("Bad transition to disconnected state, " + "previous connection state: " + oldstate);
            return;
          }
          break;
        case 'connecting':
          if (oldstate !== '') {
            Log.Error("Bad transition to connecting state, " + "previous connection state: " + oldstate);
            return;
          }
          break;
        case 'disconnecting':
          if (oldstate !== 'connected' && oldstate !== 'connecting') {
            Log.Error("Bad transition to disconnecting state, " + "previous connection state: " + oldstate);
            return;
          }
          break;
        default:
          Log.Error("Unknown connection state: " + state);
          return;
      }

      // State change actions

      this._rfbConnectionState = state;
      Log.Debug("New state '" + state + "', was '" + oldstate + "'.");
      if (this._disconnTimer && state !== 'disconnecting') {
        Log.Debug("Clearing disconnect timer");
        clearTimeout(this._disconnTimer);
        this._disconnTimer = null;

        // make sure we don't get a double event
        this._sock.off('close');
      }
      switch (state) {
        case 'connecting':
          this._connect();
          break;
        case 'connected':
          this.dispatchEvent(new CustomEvent("connect", {
            detail: {}
          }));
          break;
        case 'disconnecting':
          this._disconnect();
          this._disconnTimer = setTimeout(function () {
            Log.Error("Disconnection timed out.");
            _this3._updateConnectionState('disconnected');
          }, DISCONNECT_TIMEOUT * 1000);
          break;
        case 'disconnected':
          this.dispatchEvent(new CustomEvent("disconnect", {
            detail: {
              clean: this._rfbCleanDisconnect
            }
          }));
          break;
      }
    }

    /* Print errors and disconnect
     *
     * The parameter 'details' is used for information that
     * should be logged but not sent to the user interface.
     */
  }, {
    key: "_fail",
    value: function _fail(details) {
      switch (this._rfbConnectionState) {
        case 'disconnecting':
          Log.Error("Failed when disconnecting: " + details);
          break;
        case 'connected':
          Log.Error("Failed while connected: " + details);
          break;
        case 'connecting':
          Log.Error("Failed when connecting: " + details);
          break;
        default:
          Log.Error("RFB failure: " + details);
          break;
      }
      this._rfbCleanDisconnect = false; //This is sent to the UI

      // Transition to disconnected without waiting for socket to close
      this._updateConnectionState('disconnecting');
      this._updateConnectionState('disconnected');
      return false;
    }
  }, {
    key: "_setCapability",
    value: function _setCapability(cap, val) {
      this._capabilities[cap] = val;
      this.dispatchEvent(new CustomEvent("capabilities", {
        detail: {
          capabilities: this._capabilities
        }
      }));
    }
  }, {
    key: "_handleMessage",
    value: function _handleMessage() {
      if (this._sock.rQlen === 0) {
        Log.Warn("handleMessage called on an empty receive queue");
        return;
      }
      switch (this._rfbConnectionState) {
        case 'disconnected':
          Log.Error("Got data while disconnected");
          break;
        case 'connected':
          while (true) {
            if (this._flushing) {
              break;
            }
            if (!this._normalMsg()) {
              break;
            }
            if (this._sock.rQlen === 0) {
              break;
            }
          }
          break;
        case 'connecting':
          while (this._rfbConnectionState === 'connecting') {
            if (!this._initMsg()) {
              break;
            }
          }
          break;
        default:
          Log.Error("Got data while in an invalid state");
          break;
      }
    }
  }, {
    key: "_handleKeyEvent",
    value: function _handleKeyEvent(keysym, code, down) {
      this.sendKey(keysym, code, down);
    }
  }, {
    key: "_handleMouse",
    value: function _handleMouse(ev) {
      /*
       * We don't check connection status or viewOnly here as the
       * mouse events might be used to control the viewport
       */

      if (ev.type === 'click') {
        /*
         * Note: This is only needed for the 'click' event as it fails
         *       to fire properly for the target element so we have
         *       to listen on the document element instead.
         */
        if (ev.target !== this._canvas) {
          return;
        }
      }

      // FIXME: if we're in view-only and not dragging,
      //        should we stop events?
      ev.stopPropagation();
      ev.preventDefault();
      if (ev.type === 'click' || ev.type === 'contextmenu') {
        return;
      }
      var pos = (0, _element.clientToElement)(ev.clientX, ev.clientY, this._canvas);
      switch (ev.type) {
        case 'mousedown':
          (0, _events.setCapture)(this._canvas);
          this._handleMouseButton(pos.x, pos.y, true, 1 << ev.button);
          break;
        case 'mouseup':
          this._handleMouseButton(pos.x, pos.y, false, 1 << ev.button);
          break;
        case 'mousemove':
          this._handleMouseMove(pos.x, pos.y);
          break;
      }
    }
  }, {
    key: "_handleMouseButton",
    value: function _handleMouseButton(x, y, down, bmask) {
      if (this.dragViewport) {
        if (down && !this._viewportDragging) {
          this._viewportDragging = true;
          this._viewportDragPos = {
            'x': x,
            'y': y
          };
          this._viewportHasMoved = false;

          // Skip sending mouse events
          return;
        } else {
          this._viewportDragging = false;

          // If we actually performed a drag then we are done
          // here and should not send any mouse events
          if (this._viewportHasMoved) {
            return;
          }

          // Otherwise we treat this as a mouse click event.
          // Send the button down event here, as the button up
          // event is sent at the end of this function.
          this._sendMouse(x, y, bmask);
        }
      }

      // Flush waiting move event first
      if (this._mouseMoveTimer !== null) {
        clearTimeout(this._mouseMoveTimer);
        this._mouseMoveTimer = null;
        this._sendMouse(x, y, this._mouseButtonMask);
      }
      if (down) {
        this._mouseButtonMask |= bmask;
      } else {
        this._mouseButtonMask &= ~bmask;
      }
      this._sendMouse(x, y, this._mouseButtonMask);
    }
  }, {
    key: "_handleMouseMove",
    value: function _handleMouseMove(x, y) {
      var _this4 = this;
      if (this._viewportDragging) {
        var deltaX = this._viewportDragPos.x - x;
        var deltaY = this._viewportDragPos.y - y;
        if (this._viewportHasMoved || Math.abs(deltaX) > _browser.dragThreshold || Math.abs(deltaY) > _browser.dragThreshold) {
          this._viewportHasMoved = true;
          this._viewportDragPos = {
            'x': x,
            'y': y
          };
          this._display.viewportChangePos(deltaX, deltaY);
        }

        // Skip sending mouse events
        return;
      }
      this._mousePos = {
        'x': x,
        'y': y
      };

      // Limit many mouse move events to one every MOUSE_MOVE_DELAY ms
      if (this._mouseMoveTimer == null) {
        var timeSinceLastMove = Date.now() - this._mouseLastMoveTime;
        if (timeSinceLastMove > MOUSE_MOVE_DELAY) {
          this._sendMouse(x, y, this._mouseButtonMask);
          this._mouseLastMoveTime = Date.now();
        } else {
          // Too soon since the latest move, wait the remaining time
          this._mouseMoveTimer = setTimeout(function () {
            _this4._handleDelayedMouseMove();
          }, MOUSE_MOVE_DELAY - timeSinceLastMove);
        }
      }
    }
  }, {
    key: "_handleDelayedMouseMove",
    value: function _handleDelayedMouseMove() {
      this._mouseMoveTimer = null;
      this._sendMouse(this._mousePos.x, this._mousePos.y, this._mouseButtonMask);
      this._mouseLastMoveTime = Date.now();
    }
  }, {
    key: "_sendMouse",
    value: function _sendMouse(x, y, mask) {
      if (this._rfbConnectionState !== 'connected') {
        return;
      }
      if (this._viewOnly) {
        return;
      } // View only, skip mouse events

      RFB.messages.pointerEvent(this._sock, this._display.absX(x), this._display.absY(y), mask);
    }
  }, {
    key: "_handleWheel",
    value: function _handleWheel(ev) {
      if (this._rfbConnectionState !== 'connected') {
        return;
      }
      if (this._viewOnly) {
        return;
      } // View only, skip mouse events

      ev.stopPropagation();
      ev.preventDefault();
      var pos = (0, _element.clientToElement)(ev.clientX, ev.clientY, this._canvas);
      var dX = ev.deltaX;
      var dY = ev.deltaY;

      // Pixel units unless it's non-zero.
      // Note that if deltamode is line or page won't matter since we aren't
      // sending the mouse wheel delta to the server anyway.
      // The difference between pixel and line can be important however since
      // we have a threshold that can be smaller than the line height.
      if (ev.deltaMode !== 0) {
        dX *= WHEEL_LINE_HEIGHT;
        dY *= WHEEL_LINE_HEIGHT;
      }

      // Mouse wheel events are sent in steps over VNC. This means that the VNC
      // protocol can't handle a wheel event with specific distance or speed.
      // Therefor, if we get a lot of small mouse wheel events we combine them.
      this._accumulatedWheelDeltaX += dX;
      this._accumulatedWheelDeltaY += dY;

      // Generate a mouse wheel step event when the accumulated delta
      // for one of the axes is large enough.
      if (Math.abs(this._accumulatedWheelDeltaX) >= WHEEL_STEP) {
        if (this._accumulatedWheelDeltaX < 0) {
          this._handleMouseButton(pos.x, pos.y, true, 1 << 5);
          this._handleMouseButton(pos.x, pos.y, false, 1 << 5);
        } else if (this._accumulatedWheelDeltaX > 0) {
          this._handleMouseButton(pos.x, pos.y, true, 1 << 6);
          this._handleMouseButton(pos.x, pos.y, false, 1 << 6);
        }
        this._accumulatedWheelDeltaX = 0;
      }
      if (Math.abs(this._accumulatedWheelDeltaY) >= WHEEL_STEP) {
        if (this._accumulatedWheelDeltaY < 0) {
          this._handleMouseButton(pos.x, pos.y, true, 1 << 3);
          this._handleMouseButton(pos.x, pos.y, false, 1 << 3);
        } else if (this._accumulatedWheelDeltaY > 0) {
          this._handleMouseButton(pos.x, pos.y, true, 1 << 4);
          this._handleMouseButton(pos.x, pos.y, false, 1 << 4);
        }
        this._accumulatedWheelDeltaY = 0;
      }
    }
  }, {
    key: "_fakeMouseMove",
    value: function _fakeMouseMove(ev, elementX, elementY) {
      this._handleMouseMove(elementX, elementY);
      this._cursor.move(ev.detail.clientX, ev.detail.clientY);
    }
  }, {
    key: "_handleTapEvent",
    value: function _handleTapEvent(ev, bmask) {
      var pos = (0, _element.clientToElement)(ev.detail.clientX, ev.detail.clientY, this._canvas);

      // If the user quickly taps multiple times we assume they meant to
      // hit the same spot, so slightly adjust coordinates

      if (this._gestureLastTapTime !== null && Date.now() - this._gestureLastTapTime < DOUBLE_TAP_TIMEOUT && this._gestureFirstDoubleTapEv.detail.type === ev.detail.type) {
        var dx = this._gestureFirstDoubleTapEv.detail.clientX - ev.detail.clientX;
        var dy = this._gestureFirstDoubleTapEv.detail.clientY - ev.detail.clientY;
        var distance = Math.hypot(dx, dy);
        if (distance < DOUBLE_TAP_THRESHOLD) {
          pos = (0, _element.clientToElement)(this._gestureFirstDoubleTapEv.detail.clientX, this._gestureFirstDoubleTapEv.detail.clientY, this._canvas);
        } else {
          this._gestureFirstDoubleTapEv = ev;
        }
      } else {
        this._gestureFirstDoubleTapEv = ev;
      }
      this._gestureLastTapTime = Date.now();
      this._fakeMouseMove(this._gestureFirstDoubleTapEv, pos.x, pos.y);
      this._handleMouseButton(pos.x, pos.y, true, bmask);
      this._handleMouseButton(pos.x, pos.y, false, bmask);
    }
  }, {
    key: "_handleGesture",
    value: function _handleGesture(ev) {
      var magnitude;
      var pos = (0, _element.clientToElement)(ev.detail.clientX, ev.detail.clientY, this._canvas);
      switch (ev.type) {
        case 'gesturestart':
          switch (ev.detail.type) {
            case 'onetap':
              this._handleTapEvent(ev, 0x1);
              break;
            case 'twotap':
              this._handleTapEvent(ev, 0x4);
              break;
            case 'threetap':
              this._handleTapEvent(ev, 0x2);
              break;
            case 'drag':
              this._fakeMouseMove(ev, pos.x, pos.y);
              this._handleMouseButton(pos.x, pos.y, true, 0x1);
              break;
            case 'longpress':
              this._fakeMouseMove(ev, pos.x, pos.y);
              this._handleMouseButton(pos.x, pos.y, true, 0x4);
              break;
            case 'twodrag':
              this._gestureLastMagnitudeX = ev.detail.magnitudeX;
              this._gestureLastMagnitudeY = ev.detail.magnitudeY;
              this._fakeMouseMove(ev, pos.x, pos.y);
              break;
            case 'pinch':
              this._gestureLastMagnitudeX = Math.hypot(ev.detail.magnitudeX, ev.detail.magnitudeY);
              this._fakeMouseMove(ev, pos.x, pos.y);
              break;
          }
          break;
        case 'gesturemove':
          switch (ev.detail.type) {
            case 'onetap':
            case 'twotap':
            case 'threetap':
              break;
            case 'drag':
            case 'longpress':
              this._fakeMouseMove(ev, pos.x, pos.y);
              break;
            case 'twodrag':
              // Always scroll in the same position.
              // We don't know if the mouse was moved so we need to move it
              // every update.
              this._fakeMouseMove(ev, pos.x, pos.y);
              while (ev.detail.magnitudeY - this._gestureLastMagnitudeY > GESTURE_SCRLSENS) {
                this._handleMouseButton(pos.x, pos.y, true, 0x8);
                this._handleMouseButton(pos.x, pos.y, false, 0x8);
                this._gestureLastMagnitudeY += GESTURE_SCRLSENS;
              }
              while (ev.detail.magnitudeY - this._gestureLastMagnitudeY < -GESTURE_SCRLSENS) {
                this._handleMouseButton(pos.x, pos.y, true, 0x10);
                this._handleMouseButton(pos.x, pos.y, false, 0x10);
                this._gestureLastMagnitudeY -= GESTURE_SCRLSENS;
              }
              while (ev.detail.magnitudeX - this._gestureLastMagnitudeX > GESTURE_SCRLSENS) {
                this._handleMouseButton(pos.x, pos.y, true, 0x20);
                this._handleMouseButton(pos.x, pos.y, false, 0x20);
                this._gestureLastMagnitudeX += GESTURE_SCRLSENS;
              }
              while (ev.detail.magnitudeX - this._gestureLastMagnitudeX < -GESTURE_SCRLSENS) {
                this._handleMouseButton(pos.x, pos.y, true, 0x40);
                this._handleMouseButton(pos.x, pos.y, false, 0x40);
                this._gestureLastMagnitudeX -= GESTURE_SCRLSENS;
              }
              break;
            case 'pinch':
              // Always scroll in the same position.
              // We don't know if the mouse was moved so we need to move it
              // every update.
              this._fakeMouseMove(ev, pos.x, pos.y);
              magnitude = Math.hypot(ev.detail.magnitudeX, ev.detail.magnitudeY);
              if (Math.abs(magnitude - this._gestureLastMagnitudeX) > GESTURE_ZOOMSENS) {
                this._handleKeyEvent(_keysym["default"].XK_Control_L, "ControlLeft", true);
                while (magnitude - this._gestureLastMagnitudeX > GESTURE_ZOOMSENS) {
                  this._handleMouseButton(pos.x, pos.y, true, 0x8);
                  this._handleMouseButton(pos.x, pos.y, false, 0x8);
                  this._gestureLastMagnitudeX += GESTURE_ZOOMSENS;
                }
                while (magnitude - this._gestureLastMagnitudeX < -GESTURE_ZOOMSENS) {
                  this._handleMouseButton(pos.x, pos.y, true, 0x10);
                  this._handleMouseButton(pos.x, pos.y, false, 0x10);
                  this._gestureLastMagnitudeX -= GESTURE_ZOOMSENS;
                }
              }
              this._handleKeyEvent(_keysym["default"].XK_Control_L, "ControlLeft", false);
              break;
          }
          break;
        case 'gestureend':
          switch (ev.detail.type) {
            case 'onetap':
            case 'twotap':
            case 'threetap':
            case 'pinch':
            case 'twodrag':
              break;
            case 'drag':
              this._fakeMouseMove(ev, pos.x, pos.y);
              this._handleMouseButton(pos.x, pos.y, false, 0x1);
              break;
            case 'longpress':
              this._fakeMouseMove(ev, pos.x, pos.y);
              this._handleMouseButton(pos.x, pos.y, false, 0x4);
              break;
          }
          break;
      }
    }

    // Message Handlers
  }, {
    key: "_negotiateProtocolVersion",
    value: function _negotiateProtocolVersion() {
      if (this._sock.rQwait("version", 12)) {
        return false;
      }
      var sversion = this._sock.rQshiftStr(12).substr(4, 7);
      Log.Info("Server ProtocolVersion: " + sversion);
      var isRepeater = 0;
      switch (sversion) {
        case "000.000":
          // UltraVNC repeater
          isRepeater = 1;
          break;
        case "003.003":
        case "003.006":
          // UltraVNC
          this._rfbVersion = 3.3;
          break;
        case "003.007":
          this._rfbVersion = 3.7;
          break;
        case "003.008":
        case "003.889": // Apple Remote Desktop
        case "004.000": // Intel AMT KVM
        case "004.001": // RealVNC 4.6
        case "005.000":
          // RealVNC 5.3
          this._rfbVersion = 3.8;
          break;
        default:
          return this._fail("Invalid server version " + sversion);
      }
      if (isRepeater) {
        var repeaterID = "ID:" + this._repeaterID;
        while (repeaterID.length < 250) {
          repeaterID += "\0";
        }
        this._sock.sendString(repeaterID);
        return true;
      }
      if (this._rfbVersion > this._rfbMaxVersion) {
        this._rfbVersion = this._rfbMaxVersion;
      }
      var cversion = "00" + parseInt(this._rfbVersion, 10) + ".00" + this._rfbVersion * 10 % 10;
      this._sock.sendString("RFB " + cversion + "\n");
      Log.Debug('Sent ProtocolVersion: ' + cversion);
      this._rfbInitState = 'Security';
    }
  }, {
    key: "_isSupportedSecurityType",
    value: function _isSupportedSecurityType(type) {
      var clientTypes = [securityTypeNone, securityTypeVNCAuth, securityTypeRA2ne, securityTypeTight, securityTypeVeNCrypt, securityTypeXVP, securityTypeARD, securityTypeMSLogonII, securityTypePlain];
      return clientTypes.includes(type);
    }
  }, {
    key: "_negotiateSecurity",
    value: function _negotiateSecurity() {
      if (this._rfbVersion >= 3.7) {
        // Server sends supported list, client decides
        var numTypes = this._sock.rQshift8();
        if (this._sock.rQwait("security type", numTypes, 1)) {
          return false;
        }
        if (numTypes === 0) {
          this._rfbInitState = "SecurityReason";
          this._securityContext = "no security types";
          this._securityStatus = 1;
          return true;
        }
        var types = this._sock.rQshiftBytes(numTypes);
        Log.Debug("Server security types: " + types);

        // Look for a matching security type in the order that the
        // server prefers
        this._rfbAuthScheme = -1;
        var _iterator3 = _createForOfIteratorHelper(types),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var type = _step3.value;
            if (this._isSupportedSecurityType(type)) {
              this._rfbAuthScheme = type;
              break;
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        if (this._rfbAuthScheme === -1) {
          return this._fail("Unsupported security types (types: " + types + ")");
        }
        this._sock.send([this._rfbAuthScheme]);
      } else {
        // Server decides
        if (this._sock.rQwait("security scheme", 4)) {
          return false;
        }
        this._rfbAuthScheme = this._sock.rQshift32();
        if (this._rfbAuthScheme == 0) {
          this._rfbInitState = "SecurityReason";
          this._securityContext = "authentication scheme";
          this._securityStatus = 1;
          return true;
        }
      }
      this._rfbInitState = 'Authentication';
      Log.Debug('Authenticating using scheme: ' + this._rfbAuthScheme);
      return true;
    }
  }, {
    key: "_handleSecurityReason",
    value: function _handleSecurityReason() {
      if (this._sock.rQwait("reason length", 4)) {
        return false;
      }
      var strlen = this._sock.rQshift32();
      var reason = "";
      if (strlen > 0) {
        if (this._sock.rQwait("reason", strlen, 4)) {
          return false;
        }
        reason = this._sock.rQshiftStr(strlen);
      }
      if (reason !== "") {
        this.dispatchEvent(new CustomEvent("securityfailure", {
          detail: {
            status: this._securityStatus,
            reason: reason
          }
        }));
        return this._fail("Security negotiation failed on " + this._securityContext + " (reason: " + reason + ")");
      } else {
        this.dispatchEvent(new CustomEvent("securityfailure", {
          detail: {
            status: this._securityStatus
          }
        }));
        return this._fail("Security negotiation failed on " + this._securityContext);
      }
    }

    // authentication
  }, {
    key: "_negotiateXvpAuth",
    value: function _negotiateXvpAuth() {
      if (this._rfbCredentials.username === undefined || this._rfbCredentials.password === undefined || this._rfbCredentials.target === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["username", "password", "target"]
          }
        }));
        return false;
      }
      var xvpAuthStr = String.fromCharCode(this._rfbCredentials.username.length) + String.fromCharCode(this._rfbCredentials.target.length) + this._rfbCredentials.username + this._rfbCredentials.target;
      this._sock.sendString(xvpAuthStr);
      this._rfbAuthScheme = securityTypeVNCAuth;
      return this._negotiateAuthentication();
    }

    // VeNCrypt authentication, currently only supports version 0.2 and only Plain subtype
  }, {
    key: "_negotiateVeNCryptAuth",
    value: function _negotiateVeNCryptAuth() {
      // waiting for VeNCrypt version
      if (this._rfbVeNCryptState == 0) {
        if (this._sock.rQwait("vencrypt version", 2)) {
          return false;
        }
        var major = this._sock.rQshift8();
        var minor = this._sock.rQshift8();
        if (!(major == 0 && minor == 2)) {
          return this._fail("Unsupported VeNCrypt version " + major + "." + minor);
        }
        this._sock.send([0, 2]);
        this._rfbVeNCryptState = 1;
      }

      // waiting for ACK
      if (this._rfbVeNCryptState == 1) {
        if (this._sock.rQwait("vencrypt ack", 1)) {
          return false;
        }
        var res = this._sock.rQshift8();
        if (res != 0) {
          return this._fail("VeNCrypt failure " + res);
        }
        this._rfbVeNCryptState = 2;
      }
      // must fall through here (i.e. no "else if"), beacause we may have already received
      // the subtypes length and won't be called again

      if (this._rfbVeNCryptState == 2) {
        // waiting for subtypes length
        if (this._sock.rQwait("vencrypt subtypes length", 1)) {
          return false;
        }
        var subtypesLength = this._sock.rQshift8();
        if (subtypesLength < 1) {
          return this._fail("VeNCrypt subtypes empty");
        }
        this._rfbVeNCryptSubtypesLength = subtypesLength;
        this._rfbVeNCryptState = 3;
      }

      // waiting for subtypes list
      if (this._rfbVeNCryptState == 3) {
        if (this._sock.rQwait("vencrypt subtypes", 4 * this._rfbVeNCryptSubtypesLength)) {
          return false;
        }
        var subtypes = [];
        for (var i = 0; i < this._rfbVeNCryptSubtypesLength; i++) {
          subtypes.push(this._sock.rQshift32());
        }

        // Look for a matching security type in the order that the
        // server prefers
        this._rfbAuthScheme = -1;
        for (var _i2 = 0, _subtypes = subtypes; _i2 < _subtypes.length; _i2++) {
          var type = _subtypes[_i2];
          // Avoid getting in to a loop
          if (type === securityTypeVeNCrypt) {
            continue;
          }
          if (this._isSupportedSecurityType(type)) {
            this._rfbAuthScheme = type;
            break;
          }
        }
        if (this._rfbAuthScheme === -1) {
          return this._fail("Unsupported security types (types: " + subtypes + ")");
        }
        this._sock.send([this._rfbAuthScheme >> 24, this._rfbAuthScheme >> 16, this._rfbAuthScheme >> 8, this._rfbAuthScheme]);
        this._rfbVeNCryptState == 4;
        return true;
      }
    }
  }, {
    key: "_negotiatePlainAuth",
    value: function _negotiatePlainAuth() {
      if (this._rfbCredentials.username === undefined || this._rfbCredentials.password === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["username", "password"]
          }
        }));
        return false;
      }
      var user = (0, _strings.encodeUTF8)(this._rfbCredentials.username);
      var pass = (0, _strings.encodeUTF8)(this._rfbCredentials.password);
      this._sock.send([user.length >> 24 & 0xFF, user.length >> 16 & 0xFF, user.length >> 8 & 0xFF, user.length & 0xFF]);
      this._sock.send([pass.length >> 24 & 0xFF, pass.length >> 16 & 0xFF, pass.length >> 8 & 0xFF, pass.length & 0xFF]);
      this._sock.sendString(user);
      this._sock.sendString(pass);
      this._rfbInitState = "SecurityResult";
      return true;
    }
  }, {
    key: "_negotiateStdVNCAuth",
    value: function _negotiateStdVNCAuth() {
      if (this._sock.rQwait("auth challenge", 16)) {
        return false;
      }
      if (this._rfbCredentials.password === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["password"]
          }
        }));
        return false;
      }

      // TODO(directxman12): make genDES not require an Array
      var challenge = Array.prototype.slice.call(this._sock.rQshiftBytes(16));
      var response = RFB.genDES(this._rfbCredentials.password, challenge);
      this._sock.send(response);
      this._rfbInitState = "SecurityResult";
      return true;
    }
  }, {
    key: "_negotiateARDAuth",
    value: function _negotiateARDAuth() {
      if (this._rfbCredentials.username === undefined || this._rfbCredentials.password === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["username", "password"]
          }
        }));
        return false;
      }
      if (this._rfbCredentials.ardPublicKey != undefined && this._rfbCredentials.ardCredentials != undefined) {
        // if the async web crypto is done return the results
        this._sock.send(this._rfbCredentials.ardCredentials);
        this._sock.send(this._rfbCredentials.ardPublicKey);
        this._rfbCredentials.ardCredentials = null;
        this._rfbCredentials.ardPublicKey = null;
        this._rfbInitState = "SecurityResult";
        return true;
      }
      if (this._sock.rQwait("read ard", 4)) {
        return false;
      }
      var generator = this._sock.rQshiftBytes(2); // DH base generator value

      var keyLength = this._sock.rQshift16();
      if (this._sock.rQwait("read ard keylength", keyLength * 2, 4)) {
        return false;
      }

      // read the server values
      var prime = this._sock.rQshiftBytes(keyLength); // predetermined prime modulus
      var serverPublicKey = this._sock.rQshiftBytes(keyLength); // other party's public key

      var clientPrivateKey = window.crypto.getRandomValues(new Uint8Array(keyLength));
      var padding = Array.from(window.crypto.getRandomValues(new Uint8Array(64)), function (_byte) {
        return String.fromCharCode(65 + _byte % 26);
      }).join('');
      this._negotiateARDAuthAsync(generator, keyLength, prime, serverPublicKey, clientPrivateKey, padding);
      return false;
    }
  }, {
    key: "_modPow",
    value: function _modPow(base, exponent, modulus) {
      var baseHex = "0x" + Array.from(base, function (_byte2) {
        return ('0' + (_byte2 & 0xFF).toString(16)).slice(-2);
      }).join('');
      var exponentHex = "0x" + Array.from(exponent, function (_byte3) {
        return ('0' + (_byte3 & 0xFF).toString(16)).slice(-2);
      }).join('');
      var modulusHex = "0x" + Array.from(modulus, function (_byte4) {
        return ('0' + (_byte4 & 0xFF).toString(16)).slice(-2);
      }).join('');
      var b = BigInt(baseHex);
      var e = BigInt(exponentHex);
      var m = BigInt(modulusHex);
      var r = 1n;
      b = b % m;
      while (e > 0) {
        if (e % 2n === 1n) {
          r = r * b % m;
        }
        e = e / 2n;
        b = b * b % m;
      }
      var hexResult = r.toString(16);
      while (hexResult.length / 2 < exponent.length || hexResult.length % 2 != 0) {
        hexResult = "0" + hexResult;
      }
      var bytesResult = [];
      for (var c = 0; c < hexResult.length; c += 2) {
        bytesResult.push(parseInt(hexResult.substr(c, 2), 16));
      }
      return bytesResult;
    }
  }, {
    key: "_aesEcbEncrypt",
    value: function () {
      var _aesEcbEncrypt2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(string, key) {
        var keyString, aesKey, data, i, encrypted, _i3, block, encryptedBlock;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              // perform AES-ECB blocks
              keyString = Array.from(key, function (_byte5) {
                return String.fromCharCode(_byte5);
              }).join('');
              _context.next = 3;
              return window.crypto.subtle.importKey("raw", (0, _md.MD5)(keyString), {
                name: "AES-CBC"
              }, false, ["encrypt"]);
            case 3:
              aesKey = _context.sent;
              data = new Uint8Array(string.length);
              for (i = 0; i < string.length; ++i) {
                data[i] = string.charCodeAt(i);
              }
              encrypted = new Uint8Array(data.length);
              _i3 = 0;
            case 8:
              if (!(_i3 < data.length)) {
                _context.next = 17;
                break;
              }
              block = data.slice(_i3, _i3 + 16);
              _context.next = 12;
              return window.crypto.subtle.encrypt({
                name: "AES-CBC",
                iv: block
              }, aesKey, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
            case 12:
              encryptedBlock = _context.sent;
              encrypted.set(new Uint8Array(encryptedBlock).slice(0, 16), _i3);
            case 14:
              _i3 += 16;
              _context.next = 8;
              break;
            case 17:
              return _context.abrupt("return", encrypted);
            case 18:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      function _aesEcbEncrypt(_x2, _x3) {
        return _aesEcbEncrypt2.apply(this, arguments);
      }
      return _aesEcbEncrypt;
    }()
  }, {
    key: "_negotiateARDAuthAsync",
    value: function () {
      var _negotiateARDAuthAsync2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(generator, keyLength, prime, serverPublicKey, clientPrivateKey, padding) {
        var clientPublicKey, sharedKey, username, password, paddedUsername, paddedPassword, credentials, encrypted;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              // calculate the DH keys
              clientPublicKey = this._modPow(generator, clientPrivateKey, prime);
              sharedKey = this._modPow(serverPublicKey, clientPrivateKey, prime);
              username = (0, _strings.encodeUTF8)(this._rfbCredentials.username).substring(0, 63);
              password = (0, _strings.encodeUTF8)(this._rfbCredentials.password).substring(0, 63);
              paddedUsername = username + '\0' + padding.substring(0, 63);
              paddedPassword = password + '\0' + padding.substring(0, 63);
              credentials = paddedUsername.substring(0, 64) + paddedPassword.substring(0, 64);
              _context2.next = 9;
              return this._aesEcbEncrypt(credentials, sharedKey);
            case 9:
              encrypted = _context2.sent;
              this._rfbCredentials.ardCredentials = encrypted;
              this._rfbCredentials.ardPublicKey = clientPublicKey;
              this._resumeAuthentication();
            case 13:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function _negotiateARDAuthAsync(_x4, _x5, _x6, _x7, _x8, _x9) {
        return _negotiateARDAuthAsync2.apply(this, arguments);
      }
      return _negotiateARDAuthAsync;
    }()
  }, {
    key: "_negotiateTightUnixAuth",
    value: function _negotiateTightUnixAuth() {
      if (this._rfbCredentials.username === undefined || this._rfbCredentials.password === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["username", "password"]
          }
        }));
        return false;
      }
      this._sock.send([0, 0, 0, this._rfbCredentials.username.length]);
      this._sock.send([0, 0, 0, this._rfbCredentials.password.length]);
      this._sock.sendString(this._rfbCredentials.username);
      this._sock.sendString(this._rfbCredentials.password);
      this._rfbInitState = "SecurityResult";
      return true;
    }
  }, {
    key: "_negotiateTightTunnels",
    value: function _negotiateTightTunnels(numTunnels) {
      var clientSupportedTunnelTypes = {
        0: {
          vendor: 'TGHT',
          signature: 'NOTUNNEL'
        }
      };
      var serverSupportedTunnelTypes = {};
      // receive tunnel capabilities
      for (var i = 0; i < numTunnels; i++) {
        var capCode = this._sock.rQshift32();
        var capVendor = this._sock.rQshiftStr(4);
        var capSignature = this._sock.rQshiftStr(8);
        serverSupportedTunnelTypes[capCode] = {
          vendor: capVendor,
          signature: capSignature
        };
      }
      Log.Debug("Server Tight tunnel types: " + serverSupportedTunnelTypes);

      // Siemens touch panels have a VNC server that supports NOTUNNEL,
      // but forgets to advertise it. Try to detect such servers by
      // looking for their custom tunnel type.
      if (serverSupportedTunnelTypes[1] && serverSupportedTunnelTypes[1].vendor === "SICR" && serverSupportedTunnelTypes[1].signature === "SCHANNEL") {
        Log.Debug("Detected Siemens server. Assuming NOTUNNEL support.");
        serverSupportedTunnelTypes[0] = {
          vendor: 'TGHT',
          signature: 'NOTUNNEL'
        };
      }

      // choose the notunnel type
      if (serverSupportedTunnelTypes[0]) {
        if (serverSupportedTunnelTypes[0].vendor != clientSupportedTunnelTypes[0].vendor || serverSupportedTunnelTypes[0].signature != clientSupportedTunnelTypes[0].signature) {
          return this._fail("Client's tunnel type had the incorrect " + "vendor or signature");
        }
        Log.Debug("Selected tunnel type: " + clientSupportedTunnelTypes[0]);
        this._sock.send([0, 0, 0, 0]); // use NOTUNNEL
        return false; // wait until we receive the sub auth count to continue
      } else {
        return this._fail("Server wanted tunnels, but doesn't support " + "the notunnel type");
      }
    }
  }, {
    key: "_negotiateTightAuth",
    value: function _negotiateTightAuth() {
      if (!this._rfbTightVNC) {
        // first pass, do the tunnel negotiation
        if (this._sock.rQwait("num tunnels", 4)) {
          return false;
        }
        var numTunnels = this._sock.rQshift32();
        if (numTunnels > 0 && this._sock.rQwait("tunnel capabilities", 16 * numTunnels, 4)) {
          return false;
        }
        this._rfbTightVNC = true;
        if (numTunnels > 0) {
          this._negotiateTightTunnels(numTunnels);
          return false; // wait until we receive the sub auth to continue
        }
      }

      // second pass, do the sub-auth negotiation
      if (this._sock.rQwait("sub auth count", 4)) {
        return false;
      }
      var subAuthCount = this._sock.rQshift32();
      if (subAuthCount === 0) {
        // empty sub-auth list received means 'no auth' subtype selected
        this._rfbInitState = 'SecurityResult';
        return true;
      }
      if (this._sock.rQwait("sub auth capabilities", 16 * subAuthCount, 4)) {
        return false;
      }
      var clientSupportedTypes = {
        'STDVNOAUTH__': 1,
        'STDVVNCAUTH_': 2,
        'TGHTULGNAUTH': 129
      };
      var serverSupportedTypes = [];
      for (var i = 0; i < subAuthCount; i++) {
        this._sock.rQshift32(); // capNum
        var capabilities = this._sock.rQshiftStr(12);
        serverSupportedTypes.push(capabilities);
      }
      Log.Debug("Server Tight authentication types: " + serverSupportedTypes);
      for (var authType in clientSupportedTypes) {
        if (serverSupportedTypes.indexOf(authType) != -1) {
          this._sock.send([0, 0, 0, clientSupportedTypes[authType]]);
          Log.Debug("Selected authentication type: " + authType);
          switch (authType) {
            case 'STDVNOAUTH__':
              // no auth
              this._rfbInitState = 'SecurityResult';
              return true;
            case 'STDVVNCAUTH_':
              this._rfbAuthScheme = securityTypeVNCAuth;
              return true;
            case 'TGHTULGNAUTH':
              this._rfbAuthScheme = securityTypeUnixLogon;
              return true;
            default:
              return this._fail("Unsupported tiny auth scheme " + "(scheme: " + authType + ")");
          }
        }
      }
      return this._fail("No supported sub-auth types!");
    }
  }, {
    key: "_handleRSAAESCredentialsRequired",
    value: function _handleRSAAESCredentialsRequired(event) {
      this.dispatchEvent(event);
    }
  }, {
    key: "_handleRSAAESServerVerification",
    value: function _handleRSAAESServerVerification(event) {
      this.dispatchEvent(event);
    }
  }, {
    key: "_negotiateRA2neAuth",
    value: function _negotiateRA2neAuth() {
      var _this5 = this;
      if (this._rfbRSAAESAuthenticationState === null) {
        this._rfbRSAAESAuthenticationState = new _ra["default"](this._sock, function () {
          return _this5._rfbCredentials;
        });
        this._rfbRSAAESAuthenticationState.addEventListener("serververification", this._eventHandlers.handleRSAAESServerVerification);
        this._rfbRSAAESAuthenticationState.addEventListener("credentialsrequired", this._eventHandlers.handleRSAAESCredentialsRequired);
      }
      this._rfbRSAAESAuthenticationState.checkInternalEvents();
      if (!this._rfbRSAAESAuthenticationState.hasStarted) {
        this._rfbRSAAESAuthenticationState.negotiateRA2neAuthAsync()["catch"](function (e) {
          if (e.message !== "disconnect normally") {
            _this5._fail(e.message);
          }
        }).then(function () {
          _this5.dispatchEvent(new CustomEvent('securityresult'));
          _this5._rfbInitState = "SecurityResult";
          return true;
        })["finally"](function () {
          _this5._rfbRSAAESAuthenticationState.removeEventListener("serververification", _this5._eventHandlers.handleRSAAESServerVerification);
          _this5._rfbRSAAESAuthenticationState.removeEventListener("credentialsrequired", _this5._eventHandlers.handleRSAAESCredentialsRequired);
          _this5._rfbRSAAESAuthenticationState = null;
        });
      }
      return false;
    }
  }, {
    key: "_negotiateMSLogonIIAuth",
    value: function _negotiateMSLogonIIAuth() {
      if (this._sock.rQwait("mslogonii dh param", 24)) {
        return false;
      }
      if (this._rfbCredentials.username === undefined || this._rfbCredentials.password === undefined) {
        this.dispatchEvent(new CustomEvent("credentialsrequired", {
          detail: {
            types: ["username", "password"]
          }
        }));
        return false;
      }
      var g = this._sock.rQshiftBytes(8);
      var p = this._sock.rQshiftBytes(8);
      var A = this._sock.rQshiftBytes(8);
      var b = window.crypto.getRandomValues(new Uint8Array(8));
      var B = new Uint8Array(this._modPow(g, b, p));
      var secret = new Uint8Array(this._modPow(A, b, p));
      var des = new _des["default"](secret);
      var username = (0, _strings.encodeUTF8)(this._rfbCredentials.username).substring(0, 255);
      var password = (0, _strings.encodeUTF8)(this._rfbCredentials.password).substring(0, 63);
      var usernameBytes = new Uint8Array(256);
      var passwordBytes = new Uint8Array(64);
      window.crypto.getRandomValues(usernameBytes);
      window.crypto.getRandomValues(passwordBytes);
      for (var i = 0; i < username.length; i++) {
        usernameBytes[i] = username.charCodeAt(i);
      }
      usernameBytes[username.length] = 0;
      for (var _i4 = 0; _i4 < password.length; _i4++) {
        passwordBytes[_i4] = password.charCodeAt(_i4);
      }
      passwordBytes[password.length] = 0;
      var x = new Uint8Array(secret);
      for (var _i5 = 0; _i5 < 32; _i5++) {
        for (var j = 0; j < 8; j++) {
          x[j] ^= usernameBytes[_i5 * 8 + j];
        }
        x = des.enc8(x);
        usernameBytes.set(x, _i5 * 8);
      }
      x = new Uint8Array(secret);
      for (var _i6 = 0; _i6 < 8; _i6++) {
        for (var _j = 0; _j < 8; _j++) {
          x[_j] ^= passwordBytes[_i6 * 8 + _j];
        }
        x = des.enc8(x);
        passwordBytes.set(x, _i6 * 8);
      }
      this._sock.send(B);
      this._sock.send(usernameBytes);
      this._sock.send(passwordBytes);
      this._rfbInitState = "SecurityResult";
      return true;
    }
  }, {
    key: "_negotiateAuthentication",
    value: function _negotiateAuthentication() {
      switch (this._rfbAuthScheme) {
        case securityTypeNone:
          this._rfbInitState = 'SecurityResult';
          return true;
        case securityTypeXVP:
          return this._negotiateXvpAuth();
        case securityTypeARD:
          return this._negotiateARDAuth();
        case securityTypeVNCAuth:
          return this._negotiateStdVNCAuth();
        case securityTypeTight:
          return this._negotiateTightAuth();
        case securityTypeVeNCrypt:
          return this._negotiateVeNCryptAuth();
        case securityTypePlain:
          return this._negotiatePlainAuth();
        case securityTypeUnixLogon:
          return this._negotiateTightUnixAuth();
        case securityTypeRA2ne:
          return this._negotiateRA2neAuth();
        case securityTypeMSLogonII:
          return this._negotiateMSLogonIIAuth();
        default:
          return this._fail("Unsupported auth scheme (scheme: " + this._rfbAuthScheme + ")");
      }
    }
  }, {
    key: "_handleSecurityResult",
    value: function _handleSecurityResult() {
      // There is no security choice, and hence no security result
      // until RFB 3.7
      if (this._rfbVersion < 3.7) {
        this._rfbInitState = 'ClientInitialisation';
        return true;
      }
      if (this._sock.rQwait('VNC auth response ', 4)) {
        return false;
      }
      var status = this._sock.rQshift32();
      if (status === 0) {
        // OK
        this._rfbInitState = 'ClientInitialisation';
        Log.Debug('Authentication OK');
        return true;
      } else {
        if (this._rfbVersion >= 3.8) {
          this._rfbInitState = "SecurityReason";
          this._securityContext = "security result";
          this._securityStatus = status;
          return true;
        } else {
          this.dispatchEvent(new CustomEvent("securityfailure", {
            detail: {
              status: status
            }
          }));
          return this._fail("Security handshake failed");
        }
      }
    }
  }, {
    key: "_negotiateServerInit",
    value: function _negotiateServerInit() {
      if (this._sock.rQwait("server initialization", 24)) {
        return false;
      }

      /* Screen size */
      var width = this._sock.rQshift16();
      var height = this._sock.rQshift16();

      /* PIXEL_FORMAT */
      var bpp = this._sock.rQshift8();
      var depth = this._sock.rQshift8();
      var bigEndian = this._sock.rQshift8();
      var trueColor = this._sock.rQshift8();
      var redMax = this._sock.rQshift16();
      var greenMax = this._sock.rQshift16();
      var blueMax = this._sock.rQshift16();
      var redShift = this._sock.rQshift8();
      var greenShift = this._sock.rQshift8();
      var blueShift = this._sock.rQshift8();
      this._sock.rQskipBytes(3); // padding

      // NB(directxman12): we don't want to call any callbacks or print messages until
      //                   *after* we're past the point where we could backtrack

      /* Connection name/title */
      var nameLength = this._sock.rQshift32();
      if (this._sock.rQwait('server init name', nameLength, 24)) {
        return false;
      }
      var name = this._sock.rQshiftStr(nameLength);
      name = (0, _strings.decodeUTF8)(name, true);
      if (this._rfbTightVNC) {
        if (this._sock.rQwait('TightVNC extended server init header', 8, 24 + nameLength)) {
          return false;
        }
        // In TightVNC mode, ServerInit message is extended
        var numServerMessages = this._sock.rQshift16();
        var numClientMessages = this._sock.rQshift16();
        var numEncodings = this._sock.rQshift16();
        this._sock.rQskipBytes(2); // padding

        var totalMessagesLength = (numServerMessages + numClientMessages + numEncodings) * 16;
        if (this._sock.rQwait('TightVNC extended server init header', totalMessagesLength, 32 + nameLength)) {
          return false;
        }

        // we don't actually do anything with the capability information that TIGHT sends,
        // so we just skip the all of this.

        // TIGHT server message capabilities
        this._sock.rQskipBytes(16 * numServerMessages);

        // TIGHT client message capabilities
        this._sock.rQskipBytes(16 * numClientMessages);

        // TIGHT encoding capabilities
        this._sock.rQskipBytes(16 * numEncodings);
      }

      // NB(directxman12): these are down here so that we don't run them multiple times
      //                   if we backtrack
      Log.Info("Screen: " + width + "x" + height + ", bpp: " + bpp + ", depth: " + depth + ", bigEndian: " + bigEndian + ", trueColor: " + trueColor + ", redMax: " + redMax + ", greenMax: " + greenMax + ", blueMax: " + blueMax + ", redShift: " + redShift + ", greenShift: " + greenShift + ", blueShift: " + blueShift);

      // we're past the point where we could backtrack, so it's safe to call this
      this._setDesktopName(name);
      this._resize(width, height);
      if (!this._viewOnly) {
        this._keyboard.grab();
      }
      this._fbDepth = 24;
      if (this._fbName === "Intel(r) AMT KVM") {
        Log.Warn("Intel AMT KVM only supports 8/16 bit depths. Using low color mode.");
        this._fbDepth = 8;
      }
      RFB.messages.pixelFormat(this._sock, this._fbDepth, true);
      this._sendEncodings();
      RFB.messages.fbUpdateRequest(this._sock, false, 0, 0, this._fbWidth, this._fbHeight);
      this._updateConnectionState('connected');
      return true;
    }
  }, {
    key: "_sendEncodings",
    value: function _sendEncodings() {
      var encs = [];

      // In preference order
      encs.push(_encodings.encodings.encodingCopyRect);
      // Only supported with full depth support
      if (this._fbDepth == 24) {
        encs.push(_encodings.encodings.encodingTight);
        encs.push(_encodings.encodings.encodingTightPNG);
        encs.push(_encodings.encodings.encodingZRLE);
        encs.push(_encodings.encodings.encodingJPEG);
        encs.push(_encodings.encodings.encodingHextile);
        encs.push(_encodings.encodings.encodingRRE);
      }
      encs.push(_encodings.encodings.encodingRaw);

      // Psuedo-encoding settings
      encs.push(_encodings.encodings.pseudoEncodingQualityLevel0 + this._qualityLevel);
      encs.push(_encodings.encodings.pseudoEncodingCompressLevel0 + this._compressionLevel);
      encs.push(_encodings.encodings.pseudoEncodingDesktopSize);
      encs.push(_encodings.encodings.pseudoEncodingLastRect);
      encs.push(_encodings.encodings.pseudoEncodingQEMUExtendedKeyEvent);
      encs.push(_encodings.encodings.pseudoEncodingExtendedDesktopSize);
      encs.push(_encodings.encodings.pseudoEncodingXvp);
      encs.push(_encodings.encodings.pseudoEncodingFence);
      encs.push(_encodings.encodings.pseudoEncodingContinuousUpdates);
      encs.push(_encodings.encodings.pseudoEncodingDesktopName);
      encs.push(_encodings.encodings.pseudoEncodingExtendedClipboard);
      if (this._fbDepth == 24) {
        encs.push(_encodings.encodings.pseudoEncodingVMwareCursor);
        encs.push(_encodings.encodings.pseudoEncodingCursor);
      }
      RFB.messages.clientEncodings(this._sock, encs);
    }

    /* RFB protocol initialization states:
     *   ProtocolVersion
     *   Security
     *   Authentication
     *   SecurityResult
     *   ClientInitialization - not triggered by server message
     *   ServerInitialization
     */
  }, {
    key: "_initMsg",
    value: function _initMsg() {
      switch (this._rfbInitState) {
        case 'ProtocolVersion':
          return this._negotiateProtocolVersion();
        case 'Security':
          return this._negotiateSecurity();
        case 'Authentication':
          return this._negotiateAuthentication();
        case 'SecurityResult':
          return this._handleSecurityResult();
        case 'SecurityReason':
          return this._handleSecurityReason();
        case 'ClientInitialisation':
          this._sock.send([this._shared ? 1 : 0]); // ClientInitialisation
          this._rfbInitState = 'ServerInitialisation';
          return true;
        case 'ServerInitialisation':
          return this._negotiateServerInit();
        default:
          return this._fail("Unknown init state (state: " + this._rfbInitState + ")");
      }
    }

    // Resume authentication handshake after it was paused for some
    // reason, e.g. waiting for a password from the user
  }, {
    key: "_resumeAuthentication",
    value: function _resumeAuthentication() {
      // We use setTimeout() so it's run in its own context, just like
      // it originally did via the WebSocket's event handler
      setTimeout(this._initMsg.bind(this), 0);
    }
  }, {
    key: "_handleSetColourMapMsg",
    value: function _handleSetColourMapMsg() {
      Log.Debug("SetColorMapEntries");
      return this._fail("Unexpected SetColorMapEntries message");
    }
  }, {
    key: "_handleServerCutText",
    value: function _handleServerCutText() {
      Log.Debug("ServerCutText");
      if (this._sock.rQwait("ServerCutText header", 7, 1)) {
        return false;
      }
      this._sock.rQskipBytes(3); // Padding

      var length = this._sock.rQshift32();
      length = (0, _int.toSigned32bit)(length);
      if (this._sock.rQwait("ServerCutText content", Math.abs(length), 8)) {
        return false;
      }
      if (length >= 0) {
        //Standard msg
        var text = this._sock.rQshiftStr(length);
        if (this._viewOnly) {
          return true;
        }
        this.dispatchEvent(new CustomEvent("clipboard", {
          detail: {
            text: text
          }
        }));
      } else {
        //Extended msg.
        length = Math.abs(length);
        var flags = this._sock.rQshift32();
        var formats = flags & 0x0000FFFF;
        var actions = flags & 0xFF000000;
        var isCaps = !!(actions & extendedClipboardActionCaps);
        if (isCaps) {
          this._clipboardServerCapabilitiesFormats = {};
          this._clipboardServerCapabilitiesActions = {};

          // Update our server capabilities for Formats
          for (var i = 0; i <= 15; i++) {
            var index = 1 << i;

            // Check if format flag is set.
            if (formats & index) {
              this._clipboardServerCapabilitiesFormats[index] = true;
              // We don't send unsolicited clipboard, so we
              // ignore the size
              this._sock.rQshift32();
            }
          }

          // Update our server capabilities for Actions
          for (var _i7 = 24; _i7 <= 31; _i7++) {
            var _index = 1 << _i7;
            this._clipboardServerCapabilitiesActions[_index] = !!(actions & _index);
          }

          /*  Caps handling done, send caps with the clients
              capabilities set as a response */
          var clientActions = [extendedClipboardActionCaps, extendedClipboardActionRequest, extendedClipboardActionPeek, extendedClipboardActionNotify, extendedClipboardActionProvide];
          RFB.messages.extendedClipboardCaps(this._sock, clientActions, {
            extendedClipboardFormatText: 0
          });
        } else if (actions === extendedClipboardActionRequest) {
          if (this._viewOnly) {
            return true;
          }

          // Check if server has told us it can handle Provide and there is clipboard data to send.
          if (this._clipboardText != null && this._clipboardServerCapabilitiesActions[extendedClipboardActionProvide]) {
            if (formats & extendedClipboardFormatText) {
              RFB.messages.extendedClipboardProvide(this._sock, [extendedClipboardFormatText], [this._clipboardText]);
            }
          }
        } else if (actions === extendedClipboardActionPeek) {
          if (this._viewOnly) {
            return true;
          }
          if (this._clipboardServerCapabilitiesActions[extendedClipboardActionNotify]) {
            if (this._clipboardText != null) {
              RFB.messages.extendedClipboardNotify(this._sock, [extendedClipboardFormatText]);
            } else {
              RFB.messages.extendedClipboardNotify(this._sock, []);
            }
          }
        } else if (actions === extendedClipboardActionNotify) {
          if (this._viewOnly) {
            return true;
          }
          if (this._clipboardServerCapabilitiesActions[extendedClipboardActionRequest]) {
            if (formats & extendedClipboardFormatText) {
              RFB.messages.extendedClipboardRequest(this._sock, [extendedClipboardFormatText]);
            }
          }
        } else if (actions === extendedClipboardActionProvide) {
          if (this._viewOnly) {
            return true;
          }
          if (!(formats & extendedClipboardFormatText)) {
            return true;
          }
          // Ignore what we had in our clipboard client side.
          this._clipboardText = null;

          // FIXME: Should probably verify that this data was actually requested
          var zlibStream = this._sock.rQshiftBytes(length - 4);
          var streamInflator = new _inflator["default"]();
          var textData = null;
          streamInflator.setInput(zlibStream);
          for (var _i8 = 0; _i8 <= 15; _i8++) {
            var format = 1 << _i8;
            if (formats & format) {
              var size = 0x00;
              var sizeArray = streamInflator.inflate(4);
              size |= sizeArray[0] << 24;
              size |= sizeArray[1] << 16;
              size |= sizeArray[2] << 8;
              size |= sizeArray[3];
              var chunk = streamInflator.inflate(size);
              if (format === extendedClipboardFormatText) {
                textData = chunk;
              }
            }
          }
          streamInflator.setInput(null);
          if (textData !== null) {
            var tmpText = "";
            for (var _i9 = 0; _i9 < textData.length; _i9++) {
              tmpText += String.fromCharCode(textData[_i9]);
            }
            textData = tmpText;
            textData = (0, _strings.decodeUTF8)(textData);
            if (textData.length > 0 && "\0" === textData.charAt(textData.length - 1)) {
              textData = textData.slice(0, -1);
            }
            textData = textData.replace("\r\n", "\n");
            this.dispatchEvent(new CustomEvent("clipboard", {
              detail: {
                text: textData
              }
            }));
          }
        } else {
          return this._fail("Unexpected action in extended clipboard message: " + actions);
        }
      }
      return true;
    }
  }, {
    key: "_handleServerFenceMsg",
    value: function _handleServerFenceMsg() {
      if (this._sock.rQwait("ServerFence header", 8, 1)) {
        return false;
      }
      this._sock.rQskipBytes(3); // Padding
      var flags = this._sock.rQshift32();
      var length = this._sock.rQshift8();
      if (this._sock.rQwait("ServerFence payload", length, 9)) {
        return false;
      }
      if (length > 64) {
        Log.Warn("Bad payload length (" + length + ") in fence response");
        length = 64;
      }
      var payload = this._sock.rQshiftStr(length);
      this._supportsFence = true;

      /*
       * Fence flags
       *
       *  (1<<0)  - BlockBefore
       *  (1<<1)  - BlockAfter
       *  (1<<2)  - SyncNext
       *  (1<<31) - Request
       */

      if (!(flags & 1 << 31)) {
        return this._fail("Unexpected fence response");
      }

      // Filter out unsupported flags
      // FIXME: support syncNext
      flags &= 1 << 0 | 1 << 1;

      // BlockBefore and BlockAfter are automatically handled by
      // the fact that we process each incoming message
      // synchronuosly.
      RFB.messages.clientFence(this._sock, flags, payload);
      return true;
    }
  }, {
    key: "_handleXvpMsg",
    value: function _handleXvpMsg() {
      if (this._sock.rQwait("XVP version and message", 3, 1)) {
        return false;
      }
      this._sock.rQskipBytes(1); // Padding
      var xvpVer = this._sock.rQshift8();
      var xvpMsg = this._sock.rQshift8();
      switch (xvpMsg) {
        case 0:
          // XVP_FAIL
          Log.Error("XVP Operation Failed");
          break;
        case 1:
          // XVP_INIT
          this._rfbXvpVer = xvpVer;
          Log.Info("XVP extensions enabled (version " + this._rfbXvpVer + ")");
          this._setCapability("power", true);
          break;
        default:
          this._fail("Illegal server XVP message (msg: " + xvpMsg + ")");
          break;
      }
      return true;
    }
  }, {
    key: "_normalMsg",
    value: function _normalMsg() {
      var msgType;
      if (this._FBU.rects > 0) {
        msgType = 0;
      } else {
        msgType = this._sock.rQshift8();
      }
      var first, ret;
      switch (msgType) {
        case 0:
          // FramebufferUpdate
          ret = this._framebufferUpdate();
          if (ret && !this._enabledContinuousUpdates) {
            RFB.messages.fbUpdateRequest(this._sock, true, 0, 0, this._fbWidth, this._fbHeight);
          }
          return ret;
        case 1:
          // SetColorMapEntries
          return this._handleSetColourMapMsg();
        case 2:
          // Bell
          Log.Debug("Bell");
          this.dispatchEvent(new CustomEvent("bell", {
            detail: {}
          }));
          return true;
        case 3:
          // ServerCutText
          return this._handleServerCutText();
        case 150:
          // EndOfContinuousUpdates
          first = !this._supportsContinuousUpdates;
          this._supportsContinuousUpdates = true;
          this._enabledContinuousUpdates = false;
          if (first) {
            this._enabledContinuousUpdates = true;
            this._updateContinuousUpdates();
            Log.Info("Enabling continuous updates.");
          } else {
            // FIXME: We need to send a framebufferupdaterequest here
            // if we add support for turning off continuous updates
          }
          return true;
        case 248:
          // ServerFence
          return this._handleServerFenceMsg();
        case 250:
          // XVP
          return this._handleXvpMsg();
        default:
          this._fail("Unexpected server message (type " + msgType + ")");
          Log.Debug("sock.rQslice(0, 30): " + this._sock.rQslice(0, 30));
          return true;
      }
    }
  }, {
    key: "_onFlush",
    value: function _onFlush() {
      this._flushing = false;
      // Resume processing
      if (this._sock.rQlen > 0) {
        this._handleMessage();
      }
    }
  }, {
    key: "_framebufferUpdate",
    value: function _framebufferUpdate() {
      if (this._FBU.rects === 0) {
        if (this._sock.rQwait("FBU header", 3, 1)) {
          return false;
        }
        this._sock.rQskipBytes(1); // Padding
        this._FBU.rects = this._sock.rQshift16();

        // Make sure the previous frame is fully rendered first
        // to avoid building up an excessive queue
        if (this._display.pending()) {
          this._flushing = true;
          this._display.flush();
          return false;
        }
      }
      while (this._FBU.rects > 0) {
        if (this._FBU.encoding === null) {
          if (this._sock.rQwait("rect header", 12)) {
            return false;
          }
          /* New FramebufferUpdate */

          var hdr = this._sock.rQshiftBytes(12);
          this._FBU.x = (hdr[0] << 8) + hdr[1];
          this._FBU.y = (hdr[2] << 8) + hdr[3];
          this._FBU.width = (hdr[4] << 8) + hdr[5];
          this._FBU.height = (hdr[6] << 8) + hdr[7];
          this._FBU.encoding = parseInt((hdr[8] << 24) + (hdr[9] << 16) + (hdr[10] << 8) + hdr[11], 10);
        }
        if (!this._handleRect()) {
          return false;
        }
        this._FBU.rects--;
        this._FBU.encoding = null;
      }
      this._display.flip();
      return true; // We finished this FBU
    }
  }, {
    key: "_handleRect",
    value: function _handleRect() {
      switch (this._FBU.encoding) {
        case _encodings.encodings.pseudoEncodingLastRect:
          this._FBU.rects = 1; // Will be decreased when we return
          return true;
        case _encodings.encodings.pseudoEncodingVMwareCursor:
          return this._handleVMwareCursor();
        case _encodings.encodings.pseudoEncodingCursor:
          return this._handleCursor();
        case _encodings.encodings.pseudoEncodingQEMUExtendedKeyEvent:
          this._qemuExtKeyEventSupported = true;
          return true;
        case _encodings.encodings.pseudoEncodingDesktopName:
          return this._handleDesktopName();
        case _encodings.encodings.pseudoEncodingDesktopSize:
          this._resize(this._FBU.width, this._FBU.height);
          return true;
        case _encodings.encodings.pseudoEncodingExtendedDesktopSize:
          return this._handleExtendedDesktopSize();
        default:
          return this._handleDataRect();
      }
    }
  }, {
    key: "_handleVMwareCursor",
    value: function _handleVMwareCursor() {
      var hotx = this._FBU.x; // hotspot-x
      var hoty = this._FBU.y; // hotspot-y
      var w = this._FBU.width;
      var h = this._FBU.height;
      if (this._sock.rQwait("VMware cursor encoding", 1)) {
        return false;
      }
      var cursorType = this._sock.rQshift8();
      this._sock.rQshift8(); //Padding

      var rgba;
      var bytesPerPixel = 4;

      //Classic cursor
      if (cursorType == 0) {
        //Used to filter away unimportant bits.
        //OR is used for correct conversion in js.
        var PIXEL_MASK = 0xffffff00 | 0;
        rgba = new Array(w * h * bytesPerPixel);
        if (this._sock.rQwait("VMware cursor classic encoding", w * h * bytesPerPixel * 2, 2)) {
          return false;
        }
        var andMask = new Array(w * h);
        for (var pixel = 0; pixel < w * h; pixel++) {
          andMask[pixel] = this._sock.rQshift32();
        }
        var xorMask = new Array(w * h);
        for (var _pixel = 0; _pixel < w * h; _pixel++) {
          xorMask[_pixel] = this._sock.rQshift32();
        }
        for (var _pixel2 = 0; _pixel2 < w * h; _pixel2++) {
          if (andMask[_pixel2] == 0) {
            //Fully opaque pixel
            var bgr = xorMask[_pixel2];
            var r = bgr >> 8 & 0xff;
            var g = bgr >> 16 & 0xff;
            var b = bgr >> 24 & 0xff;
            rgba[_pixel2 * bytesPerPixel] = r; //r
            rgba[_pixel2 * bytesPerPixel + 1] = g; //g
            rgba[_pixel2 * bytesPerPixel + 2] = b; //b
            rgba[_pixel2 * bytesPerPixel + 3] = 0xff; //a
          } else if ((andMask[_pixel2] & PIXEL_MASK) == PIXEL_MASK) {
            //Only screen value matters, no mouse colouring
            if (xorMask[_pixel2] == 0) {
              //Transparent pixel
              rgba[_pixel2 * bytesPerPixel] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 1] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 2] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 3] = 0x00;
            } else if ((xorMask[_pixel2] & PIXEL_MASK) == PIXEL_MASK) {
              //Inverted pixel, not supported in browsers.
              //Fully opaque instead.
              rgba[_pixel2 * bytesPerPixel] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 1] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 2] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 3] = 0xff;
            } else {
              //Unhandled xorMask
              rgba[_pixel2 * bytesPerPixel] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 1] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 2] = 0x00;
              rgba[_pixel2 * bytesPerPixel + 3] = 0xff;
            }
          } else {
            //Unhandled andMask
            rgba[_pixel2 * bytesPerPixel] = 0x00;
            rgba[_pixel2 * bytesPerPixel + 1] = 0x00;
            rgba[_pixel2 * bytesPerPixel + 2] = 0x00;
            rgba[_pixel2 * bytesPerPixel + 3] = 0xff;
          }
        }

        //Alpha cursor.
      } else if (cursorType == 1) {
        if (this._sock.rQwait("VMware cursor alpha encoding", w * h * 4, 2)) {
          return false;
        }
        rgba = new Array(w * h * bytesPerPixel);
        for (var _pixel3 = 0; _pixel3 < w * h; _pixel3++) {
          var data = this._sock.rQshift32();
          rgba[_pixel3 * 4] = data >> 24 & 0xff; //r
          rgba[_pixel3 * 4 + 1] = data >> 16 & 0xff; //g
          rgba[_pixel3 * 4 + 2] = data >> 8 & 0xff; //b
          rgba[_pixel3 * 4 + 3] = data & 0xff; //a
        }
      } else {
        Log.Warn("The given cursor type is not supported: " + cursorType + " given.");
        return false;
      }
      this._updateCursor(rgba, hotx, hoty, w, h);
      return true;
    }
  }, {
    key: "_handleCursor",
    value: function _handleCursor() {
      var hotx = this._FBU.x; // hotspot-x
      var hoty = this._FBU.y; // hotspot-y
      var w = this._FBU.width;
      var h = this._FBU.height;
      var pixelslength = w * h * 4;
      var masklength = Math.ceil(w / 8) * h;
      var bytes = pixelslength + masklength;
      if (this._sock.rQwait("cursor encoding", bytes)) {
        return false;
      }

      // Decode from BGRX pixels + bit mask to RGBA
      var pixels = this._sock.rQshiftBytes(pixelslength);
      var mask = this._sock.rQshiftBytes(masklength);
      var rgba = new Uint8Array(w * h * 4);
      var pixIdx = 0;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var maskIdx = y * Math.ceil(w / 8) + Math.floor(x / 8);
          var alpha = mask[maskIdx] << x % 8 & 0x80 ? 255 : 0;
          rgba[pixIdx] = pixels[pixIdx + 2];
          rgba[pixIdx + 1] = pixels[pixIdx + 1];
          rgba[pixIdx + 2] = pixels[pixIdx];
          rgba[pixIdx + 3] = alpha;
          pixIdx += 4;
        }
      }
      this._updateCursor(rgba, hotx, hoty, w, h);
      return true;
    }
  }, {
    key: "_handleDesktopName",
    value: function _handleDesktopName() {
      if (this._sock.rQwait("DesktopName", 4)) {
        return false;
      }
      var length = this._sock.rQshift32();
      if (this._sock.rQwait("DesktopName", length, 4)) {
        return false;
      }
      var name = this._sock.rQshiftStr(length);
      name = (0, _strings.decodeUTF8)(name, true);
      this._setDesktopName(name);
      return true;
    }
  }, {
    key: "_handleExtendedDesktopSize",
    value: function _handleExtendedDesktopSize() {
      if (this._sock.rQwait("ExtendedDesktopSize", 4)) {
        return false;
      }
      var numberOfScreens = this._sock.rQpeek8();
      var bytes = 4 + numberOfScreens * 16;
      if (this._sock.rQwait("ExtendedDesktopSize", bytes)) {
        return false;
      }
      var firstUpdate = !this._supportsSetDesktopSize;
      this._supportsSetDesktopSize = true;

      // Normally we only apply the current resize mode after a
      // window resize event. However there is no such trigger on the
      // initial connect. And we don't know if the server supports
      // resizing until we've gotten here.
      if (firstUpdate) {
        this._requestRemoteResize();
      }
      this._sock.rQskipBytes(1); // number-of-screens
      this._sock.rQskipBytes(3); // padding

      for (var i = 0; i < numberOfScreens; i += 1) {
        // Save the id and flags of the first screen
        if (i === 0) {
          this._screenID = this._sock.rQshiftBytes(4); // id
          this._sock.rQskipBytes(2); // x-position
          this._sock.rQskipBytes(2); // y-position
          this._sock.rQskipBytes(2); // width
          this._sock.rQskipBytes(2); // height
          this._screenFlags = this._sock.rQshiftBytes(4); // flags
        } else {
          this._sock.rQskipBytes(16);
        }
      }

      /*
       * The x-position indicates the reason for the change:
       *
       *  0 - server resized on its own
       *  1 - this client requested the resize
       *  2 - another client requested the resize
       */

      // We need to handle errors when we requested the resize.
      if (this._FBU.x === 1 && this._FBU.y !== 0) {
        var msg = "";
        // The y-position indicates the status code from the server
        switch (this._FBU.y) {
          case 1:
            msg = "Resize is administratively prohibited";
            break;
          case 2:
            msg = "Out of resources";
            break;
          case 3:
            msg = "Invalid screen layout";
            break;
          default:
            msg = "Unknown reason";
            break;
        }
        Log.Warn("Server did not accept the resize request: " + msg);
      } else {
        this._resize(this._FBU.width, this._FBU.height);
      }
      return true;
    }
  }, {
    key: "_handleDataRect",
    value: function _handleDataRect() {
      var decoder = this._decoders[this._FBU.encoding];
      if (!decoder) {
        this._fail("Unsupported encoding (encoding: " + this._FBU.encoding + ")");
        return false;
      }
      try {
        return decoder.decodeRect(this._FBU.x, this._FBU.y, this._FBU.width, this._FBU.height, this._sock, this._display, this._fbDepth);
      } catch (err) {
        this._fail("Error decoding rect: " + err);
        return false;
      }
    }
  }, {
    key: "_updateContinuousUpdates",
    value: function _updateContinuousUpdates() {
      if (!this._enabledContinuousUpdates) {
        return;
      }
      RFB.messages.enableContinuousUpdates(this._sock, true, 0, 0, this._fbWidth, this._fbHeight);
    }
  }, {
    key: "_resize",
    value: function _resize(width, height) {
      this._fbWidth = width;
      this._fbHeight = height;
      this._display.resize(this._fbWidth, this._fbHeight);

      // Adjust the visible viewport based on the new dimensions
      this._updateClip();
      this._updateScale();
      this._updateContinuousUpdates();

      // Keep this size until browser client size changes
      this._saveExpectedClientSize();
    }
  }, {
    key: "_xvpOp",
    value: function _xvpOp(ver, op) {
      if (this._rfbXvpVer < ver) {
        return;
      }
      Log.Info("Sending XVP operation " + op + " (version " + ver + ")");
      RFB.messages.xvpOp(this._sock, ver, op);
    }
  }, {
    key: "_updateCursor",
    value: function _updateCursor(rgba, hotx, hoty, w, h) {
      this._cursorImage = {
        rgbaPixels: rgba,
        hotx: hotx,
        hoty: hoty,
        w: w,
        h: h
      };
      this._refreshCursor();
    }
  }, {
    key: "_shouldShowDotCursor",
    value: function _shouldShowDotCursor() {
      // Called when this._cursorImage is updated
      if (!this._showDotCursor) {
        // User does not want to see the dot, so...
        return false;
      }

      // The dot should not be shown if the cursor is already visible,
      // i.e. contains at least one not-fully-transparent pixel.
      // So iterate through all alpha bytes in rgba and stop at the
      // first non-zero.
      for (var i = 3; i < this._cursorImage.rgbaPixels.length; i += 4) {
        if (this._cursorImage.rgbaPixels[i]) {
          return false;
        }
      }

      // At this point, we know that the cursor is fully transparent, and
      // the user wants to see the dot instead of this.
      return true;
    }
  }, {
    key: "_refreshCursor",
    value: function _refreshCursor() {
      if (this._rfbConnectionState !== "connecting" && this._rfbConnectionState !== "connected") {
        return;
      }
      var image = this._shouldShowDotCursor() ? RFB.cursors.dot : this._cursorImage;
      this._cursor.change(image.rgbaPixels, image.hotx, image.hoty, image.w, image.h);
    }
  }], [{
    key: "genDES",
    value: function genDES(password, challenge) {
      var passwordChars = password.split('').map(function (c) {
        return c.charCodeAt(0);
      });
      return new _des["default"](passwordChars).encrypt(challenge);
    }
  }]);
  return RFB;
}(_eventtarget["default"]); // Class Methods
exports["default"] = RFB;
RFB.messages = {
  keyEvent: function keyEvent(sock, keysym, down) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 4; // msg-type
    buff[offset + 1] = down;
    buff[offset + 2] = 0;
    buff[offset + 3] = 0;
    buff[offset + 4] = keysym >> 24;
    buff[offset + 5] = keysym >> 16;
    buff[offset + 6] = keysym >> 8;
    buff[offset + 7] = keysym;
    sock._sQlen += 8;
    sock.flush();
  },
  QEMUExtendedKeyEvent: function QEMUExtendedKeyEvent(sock, keysym, down, keycode) {
    function getRFBkeycode(xtScanCode) {
      var upperByte = keycode >> 8;
      var lowerByte = keycode & 0x00ff;
      if (upperByte === 0xe0 && lowerByte < 0x7f) {
        return lowerByte | 0x80;
      }
      return xtScanCode;
    }
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 255; // msg-type
    buff[offset + 1] = 0; // sub msg-type

    buff[offset + 2] = down >> 8;
    buff[offset + 3] = down;
    buff[offset + 4] = keysym >> 24;
    buff[offset + 5] = keysym >> 16;
    buff[offset + 6] = keysym >> 8;
    buff[offset + 7] = keysym;
    var RFBkeycode = getRFBkeycode(keycode);
    buff[offset + 8] = RFBkeycode >> 24;
    buff[offset + 9] = RFBkeycode >> 16;
    buff[offset + 10] = RFBkeycode >> 8;
    buff[offset + 11] = RFBkeycode;
    sock._sQlen += 12;
    sock.flush();
  },
  pointerEvent: function pointerEvent(sock, x, y, mask) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 5; // msg-type

    buff[offset + 1] = mask;
    buff[offset + 2] = x >> 8;
    buff[offset + 3] = x;
    buff[offset + 4] = y >> 8;
    buff[offset + 5] = y;
    sock._sQlen += 6;
    sock.flush();
  },
  // Used to build Notify and Request data.
  _buildExtendedClipboardFlags: function _buildExtendedClipboardFlags(actions, formats) {
    var data = new Uint8Array(4);
    var formatFlag = 0x00000000;
    var actionFlag = 0x00000000;
    for (var i = 0; i < actions.length; i++) {
      actionFlag |= actions[i];
    }
    for (var _i10 = 0; _i10 < formats.length; _i10++) {
      formatFlag |= formats[_i10];
    }
    data[0] = actionFlag >> 24; // Actions
    data[1] = 0x00; // Reserved
    data[2] = 0x00; // Reserved
    data[3] = formatFlag; // Formats

    return data;
  },
  extendedClipboardProvide: function extendedClipboardProvide(sock, formats, inData) {
    // Deflate incomming data and their sizes
    var deflator = new _deflator["default"]();
    var dataToDeflate = [];
    for (var i = 0; i < formats.length; i++) {
      // We only support the format Text at this time
      if (formats[i] != extendedClipboardFormatText) {
        throw new Error("Unsupported extended clipboard format for Provide message.");
      }

      // Change lone \r or \n into \r\n as defined in rfbproto
      inData[i] = inData[i].replace(/\r\n|\r|\n/gm, "\r\n");

      // Check if it already has \0
      var text = (0, _strings.encodeUTF8)(inData[i] + "\0");
      dataToDeflate.push(text.length >> 24 & 0xFF, text.length >> 16 & 0xFF, text.length >> 8 & 0xFF, text.length & 0xFF);
      for (var j = 0; j < text.length; j++) {
        dataToDeflate.push(text.charCodeAt(j));
      }
    }
    var deflatedData = deflator.deflate(new Uint8Array(dataToDeflate));

    // Build data  to send
    var data = new Uint8Array(4 + deflatedData.length);
    data.set(RFB.messages._buildExtendedClipboardFlags([extendedClipboardActionProvide], formats));
    data.set(deflatedData, 4);
    RFB.messages.clientCutText(sock, data, true);
  },
  extendedClipboardNotify: function extendedClipboardNotify(sock, formats) {
    var flags = RFB.messages._buildExtendedClipboardFlags([extendedClipboardActionNotify], formats);
    RFB.messages.clientCutText(sock, flags, true);
  },
  extendedClipboardRequest: function extendedClipboardRequest(sock, formats) {
    var flags = RFB.messages._buildExtendedClipboardFlags([extendedClipboardActionRequest], formats);
    RFB.messages.clientCutText(sock, flags, true);
  },
  extendedClipboardCaps: function extendedClipboardCaps(sock, actions, formats) {
    var formatKeys = Object.keys(formats);
    var data = new Uint8Array(4 + 4 * formatKeys.length);
    formatKeys.map(function (x) {
      return parseInt(x);
    });
    formatKeys.sort(function (a, b) {
      return a - b;
    });
    data.set(RFB.messages._buildExtendedClipboardFlags(actions, []));
    var loopOffset = 4;
    for (var i = 0; i < formatKeys.length; i++) {
      data[loopOffset] = formats[formatKeys[i]] >> 24;
      data[loopOffset + 1] = formats[formatKeys[i]] >> 16;
      data[loopOffset + 2] = formats[formatKeys[i]] >> 8;
      data[loopOffset + 3] = formats[formatKeys[i]] >> 0;
      loopOffset += 4;
      data[3] |= 1 << formatKeys[i]; // Update our format flags
    }

    RFB.messages.clientCutText(sock, data, true);
  },
  clientCutText: function clientCutText(sock, data) {
    var extended = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 6; // msg-type

    buff[offset + 1] = 0; // padding
    buff[offset + 2] = 0; // padding
    buff[offset + 3] = 0; // padding

    var length;
    if (extended) {
      length = (0, _int.toUnsigned32bit)(-data.length);
    } else {
      length = data.length;
    }
    buff[offset + 4] = length >> 24;
    buff[offset + 5] = length >> 16;
    buff[offset + 6] = length >> 8;
    buff[offset + 7] = length;
    sock._sQlen += 8;

    // We have to keep track of from where in the data we begin creating the
    // buffer for the flush in the next iteration.
    var dataOffset = 0;
    var remaining = data.length;
    while (remaining > 0) {
      var flushSize = Math.min(remaining, sock._sQbufferSize - sock._sQlen);
      for (var i = 0; i < flushSize; i++) {
        buff[sock._sQlen + i] = data[dataOffset + i];
      }
      sock._sQlen += flushSize;
      sock.flush();
      remaining -= flushSize;
      dataOffset += flushSize;
    }
  },
  setDesktopSize: function setDesktopSize(sock, width, height, id, flags) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 251; // msg-type
    buff[offset + 1] = 0; // padding
    buff[offset + 2] = width >> 8; // width
    buff[offset + 3] = width;
    buff[offset + 4] = height >> 8; // height
    buff[offset + 5] = height;
    buff[offset + 6] = 1; // number-of-screens
    buff[offset + 7] = 0; // padding

    // screen array
    buff[offset + 8] = id >> 24; // id
    buff[offset + 9] = id >> 16;
    buff[offset + 10] = id >> 8;
    buff[offset + 11] = id;
    buff[offset + 12] = 0; // x-position
    buff[offset + 13] = 0;
    buff[offset + 14] = 0; // y-position
    buff[offset + 15] = 0;
    buff[offset + 16] = width >> 8; // width
    buff[offset + 17] = width;
    buff[offset + 18] = height >> 8; // height
    buff[offset + 19] = height;
    buff[offset + 20] = flags >> 24; // flags
    buff[offset + 21] = flags >> 16;
    buff[offset + 22] = flags >> 8;
    buff[offset + 23] = flags;
    sock._sQlen += 24;
    sock.flush();
  },
  clientFence: function clientFence(sock, flags, payload) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 248; // msg-type

    buff[offset + 1] = 0; // padding
    buff[offset + 2] = 0; // padding
    buff[offset + 3] = 0; // padding

    buff[offset + 4] = flags >> 24; // flags
    buff[offset + 5] = flags >> 16;
    buff[offset + 6] = flags >> 8;
    buff[offset + 7] = flags;
    var n = payload.length;
    buff[offset + 8] = n; // length

    for (var i = 0; i < n; i++) {
      buff[offset + 9 + i] = payload.charCodeAt(i);
    }
    sock._sQlen += 9 + n;
    sock.flush();
  },
  enableContinuousUpdates: function enableContinuousUpdates(sock, enable, x, y, width, height) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 150; // msg-type
    buff[offset + 1] = enable; // enable-flag

    buff[offset + 2] = x >> 8; // x
    buff[offset + 3] = x;
    buff[offset + 4] = y >> 8; // y
    buff[offset + 5] = y;
    buff[offset + 6] = width >> 8; // width
    buff[offset + 7] = width;
    buff[offset + 8] = height >> 8; // height
    buff[offset + 9] = height;
    sock._sQlen += 10;
    sock.flush();
  },
  pixelFormat: function pixelFormat(sock, depth, trueColor) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    var bpp;
    if (depth > 16) {
      bpp = 32;
    } else if (depth > 8) {
      bpp = 16;
    } else {
      bpp = 8;
    }
    var bits = Math.floor(depth / 3);
    buff[offset] = 0; // msg-type

    buff[offset + 1] = 0; // padding
    buff[offset + 2] = 0; // padding
    buff[offset + 3] = 0; // padding

    buff[offset + 4] = bpp; // bits-per-pixel
    buff[offset + 5] = depth; // depth
    buff[offset + 6] = 0; // little-endian
    buff[offset + 7] = trueColor ? 1 : 0; // true-color

    buff[offset + 8] = 0; // red-max
    buff[offset + 9] = (1 << bits) - 1; // red-max

    buff[offset + 10] = 0; // green-max
    buff[offset + 11] = (1 << bits) - 1; // green-max

    buff[offset + 12] = 0; // blue-max
    buff[offset + 13] = (1 << bits) - 1; // blue-max

    buff[offset + 14] = bits * 0; // red-shift
    buff[offset + 15] = bits * 1; // green-shift
    buff[offset + 16] = bits * 2; // blue-shift

    buff[offset + 17] = 0; // padding
    buff[offset + 18] = 0; // padding
    buff[offset + 19] = 0; // padding

    sock._sQlen += 20;
    sock.flush();
  },
  clientEncodings: function clientEncodings(sock, encodings) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 2; // msg-type
    buff[offset + 1] = 0; // padding

    buff[offset + 2] = encodings.length >> 8;
    buff[offset + 3] = encodings.length;
    var j = offset + 4;
    for (var i = 0; i < encodings.length; i++) {
      var enc = encodings[i];
      buff[j] = enc >> 24;
      buff[j + 1] = enc >> 16;
      buff[j + 2] = enc >> 8;
      buff[j + 3] = enc;
      j += 4;
    }
    sock._sQlen += j - offset;
    sock.flush();
  },
  fbUpdateRequest: function fbUpdateRequest(sock, incremental, x, y, w, h) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    if (typeof x === "undefined") {
      x = 0;
    }
    if (typeof y === "undefined") {
      y = 0;
    }
    buff[offset] = 3; // msg-type
    buff[offset + 1] = incremental ? 1 : 0;
    buff[offset + 2] = x >> 8 & 0xFF;
    buff[offset + 3] = x & 0xFF;
    buff[offset + 4] = y >> 8 & 0xFF;
    buff[offset + 5] = y & 0xFF;
    buff[offset + 6] = w >> 8 & 0xFF;
    buff[offset + 7] = w & 0xFF;
    buff[offset + 8] = h >> 8 & 0xFF;
    buff[offset + 9] = h & 0xFF;
    sock._sQlen += 10;
    sock.flush();
  },
  xvpOp: function xvpOp(sock, ver, op) {
    var buff = sock._sQ;
    var offset = sock._sQlen;
    buff[offset] = 250; // msg-type
    buff[offset + 1] = 0; // padding

    buff[offset + 2] = ver;
    buff[offset + 3] = op;
    sock._sQlen += 4;
    sock.flush();
  }
};
RFB.cursors = {
  none: {
    rgbaPixels: new Uint8Array(),
    w: 0,
    h: 0,
    hotx: 0,
    hoty: 0
  },
  dot: {
    /* eslint-disable indent */
    rgbaPixels: new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255]),
    /* eslint-enable indent */
    w: 3,
    h: 3,
    hotx: 1,
    hoty: 1
  }
};