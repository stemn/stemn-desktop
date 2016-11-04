'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _reactDom = require('react-dom');

var _utils = require('./utils');

var _platform = require('./platform');

var createElement = function createElement(x) {
  return _platform.isClient ? document.createElement(x) : _utils.noop;
};

var bodyAppendElement = function bodyAppendElement(x) {
  return _platform.isClient ? document.body.appendChild(x) : _utils.noop;
};

var bodyRemoveElement = function bodyRemoveElement(x) {
  return _platform.isClient ? document.body.removeChild(x) : _utils.noop;
};

var ReactLayerMixin = function ReactLayerMixin() {
  return {
    componentWillMount: function componentWillMount() {
      this.targetBounds = null;
      /* Create a DOM node for mounting the React Layer. */
      this.layerContainerNode = createElement('div');
    },
    componentDidMount: function componentDidMount() {
      /* Mount the mount. */
      bodyAppendElement(this.layerContainerNode);
      this._layerRender();
    },
    componentDidUpdate: function componentDidUpdate() {
      this._layerRender();
    },
    componentWillUnmount: function componentWillUnmount() {
      this._layerUnrender();
      /* Unmount the mount. */
      bodyRemoveElement(this.layerContainerNode);
    },
    _layerRender: function _layerRender() {
      var layerReactEl = this.renderLayer();
      if (!layerReactEl) {
        this.layerReactComponent = null;
        (0, _reactDom.render)(_react.DOM.noscript(), this.layerContainerNode);
      } else {
        this.layerReactComponent = (0, _reactDom.render)(layerReactEl, this.layerContainerNode);
      }
    },
    _layerUnrender: function _layerUnrender() {
      if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode);
      (0, _reactDom.unmountComponentAtNode)(this.layerContainerNode);
    }
  };
};

// renderLayer() {
//   Must be implemented by consumer.
// }
exports.default = ReactLayerMixin;
