'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientOnly = exports.noop = exports.equalRecords = exports.find = exports.arrayify = exports.assign = undefined;

var _polyfill = require('object.assign/polyfill');

var _polyfill2 = _interopRequireDefault(_polyfill);

var _platform = require('./platform');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assign = (0, _polyfill2.default)();

var arrayify = function arrayify(x) {
  return Array.isArray(x) ? x : [x];
};

var find = function find(f, xs) {
  return xs.reduce(function (b, x) {
    return b ? b : f(x) ? x : null;
  }, null);
};

var equalRecords = function equalRecords(o1, o2) {
  for (var key in o1) {
    if (o1[key] !== o2[key]) return false;
  }return true;
};

var noop = function noop() {
  return undefined;
};

var clientOnly = function clientOnly(f) {
  return _platform.isClient ? f : noop;
};

exports.default = {
  assign: assign,
  arrayify: arrayify,
  find: find,
  equalRecords: equalRecords,
  noop: noop,
  clientOnly: clientOnly
};
exports.assign = assign;
exports.arrayify = arrayify;
exports.find = find;
exports.equalRecords = equalRecords;
exports.noop = noop;
exports.clientOnly = clientOnly;
