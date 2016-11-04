import EagleXMLParser from './parse/eagle.js';
import KicadNewParser from './parse/kicad_pcb_parser.js';
import ViewEECanvasRenderer from './render/viewee-canvas.js';

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(function () {
            return factory();
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.ViewEE = factory();
    }
}(this, function () {
    function ViewEE() {
        this.visibleLayers = {};
        this.visibleLayers[ViewEE.LayerId.BOTTOM_COPPER] = true;
        this.visibleLayers[ViewEE.LayerId.BOTTOM_SILKSCREEN] = true;
        this.visibleLayers[ViewEE.LayerId.BOTTOM_DOCUMENTATION] = true;
        this.visibleLayers[ViewEE.LayerId.DIM_BOARD] = true;
        this.visibleLayers[ViewEE.LayerId.TOP_COPPER] = true;
        this.visibleLayers[ViewEE.LayerId.TOP_SILKSCREEN] = true;
        this.visibleLayers[ViewEE.LayerId.TOP_DOCUMENTATION] = true;
        this.visibleLayers[ViewEE.LayerId.VIAS] = true;
        this.visibleLayers[ViewEE.LayerId.OUTLINE] = true;

        this.renderLayerOrder = [];
        this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_DOCUMENTATION);
        this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_SILKSCREEN);
        this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_COPPER);
        this.renderLayerOrder.push(ViewEE.LayerId.DIM_BOARD);
        this.renderLayerOrder.push(ViewEE.LayerId.OUTLINE);
        this.renderLayerOrder.push(ViewEE.LayerId.TOP_COPPER);
        this.renderLayerOrder.push(ViewEE.LayerId.VIAS);
        this.renderLayerOrder.push(ViewEE.LayerId.TOP_SILKSCREEN);
        this.renderLayerOrder.push(ViewEE.LayerId.TOP_DOCUMENTATION);

        this.reverseRenderLayerOrder = [];
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_DOCUMENTATION);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_SILKSCREEN);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_COPPER);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.DIM_BOARD);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.OUTLINE);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_COPPER);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.VIAS);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_SILKSCREEN);
        this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_DOCUMENTATION);

        this.layerRenderFunctions = {};

        this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_COPPER] = function (renderer, board, ctx) {
            renderer.drawSignalWires(board.eagleLayersByName['Bottom'], ctx);
            renderer.drawElements(board.eagleLayersByName['Bottom'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['Bottom'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_SILKSCREEN] = function (renderer, board, ctx) {
            renderer.drawElements(board.eagleLayersByName['bNames'], ctx);
            renderer.drawElements(board.eagleLayersByName['bValues'], ctx);
            renderer.drawElements(board.eagleLayersByName['bPlace'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['bNames'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['bValues'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['bPlace'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['bNames'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['bValues'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['bPlace'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_DOCUMENTATION] = function (renderer, board, ctx) {
            renderer.drawElements(board.eagleLayersByName['bKeepout'], ctx);
            renderer.drawElements(board.eagleLayersByName['bDocu'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['bKeepout'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['bDocu'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.TOP_COPPER] = function (renderer, board, ctx) {
            renderer.drawSignalWires(board.eagleLayersByName['Top'], ctx);
            renderer.drawElements(board.eagleLayersByName['Top'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['Top'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.TOP_SILKSCREEN] = function (renderer, board, ctx) {
            renderer.drawElements(board.eagleLayersByName['tNames'], ctx);
            renderer.drawElements(board.eagleLayersByName['tValues'], ctx);
            renderer.drawElements(board.eagleLayersByName['tPlace'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['tNames'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['tValues'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['tPlace'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['tNames'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['tValues'], ctx);
            renderer.drawPlainWires(board.eagleLayersByName['tPlace'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.TOP_DOCUMENTATION] = function (renderer, board, ctx) {
            renderer.drawElements(board.eagleLayersByName['tKeepout'], ctx);
            renderer.drawElements(board.eagleLayersByName['tDocu'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['tKeepout'], ctx);
            renderer.drawPlainTexts(board.eagleLayersByName['tDocu'], ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.DIM_BOARD] = function (renderer, board, ctx) {
            renderer.dimCanvas(board.dimBoardAlpha, ctx);
        }

        this.layerRenderFunctions[ViewEE.LayerId.VIAS] = function (renderer, board, ctx) {
            renderer.drawSignalVias('1-16', ctx, board.viaPadColor());
        }

        this.layerRenderFunctions[ViewEE.LayerId.OUTLINE] = function (renderer, board, ctx) {
            renderer._drawShapeFromWires(board.eagleLayersByName['Dimension'], ctx);
            renderer.drawPlainHoles(board.eagleLayersByName['Dimension'], ctx);
        }

        this.render = render;
        this.draw = draw;
        this.redraw = redraw;
        this.initRenderer = initRenderer;
        this.calculateBounds = calculateBounds;
        this.scaleToFit = scaleToFit;
        this.setScale = setScale;

        this.layerColor = layerColor;
        this.mirrorLayer = mirrorLayer;

        this.angleForRot = angleForRot;
        this.matrixForRot = matrixForRot;

        this.viaPadColor = viaPadColor;
        this.colorPalette = [
            [127, 127, 127],
            [35, 35, 141],
            [35, 141, 35],
            [35, 141, 141],
            [141, 35, 35],
            [141, 35, 141],
            [141, 141, 35],
            [141, 141, 141],
            [39, 39, 39],
            [0, 0, 180],
            [0, 180, 0],
            [0, 180, 180],
            [180, 0, 0],
            [180, 0, 180],
            [180, 180, 0],
            [63, 63, 63],
        ];
    }

    // -----------------------
    // --- ENUMS, DEFAULTS ---
    // -----------------------

    ViewEE.LayerId = {
        'BOTTOM_COPPER': 1,
        'BOTTOM_SILKSCREEN': 2,
        'BOTTOM_DOCUMENTATION': 3,
        'DIM_BOARD': 4,
        'TOP_COPPER': 5,
        'TOP_SILKSCREEN': 6,
        'TOP_DOCUMENTATION': 7,
        'VIAS': 8,
        'OUTLINE': 9
    }

    ViewEE.LARGE_NUMBER = 99999;

    ViewEE.warnings = {};

    ViewEE.prototype.scale = 1;
    ViewEE.prototype.minScale = 0.1;
    ViewEE.prototype.maxScale = 10;
    ViewEE.prototype.minLineWidth = 0.05;
    ViewEE.prototype.boardFlipped = false;
    ViewEE.prototype.dimBoardAlpha = 0.7;

    // -------------------------
    // --- GENERIC ACCESSORS ---
    // -------------------------

    function scaleToFit(a) {
        var fitElement = this.canvas;
        var fitWidth = fitElement.width,
            fitHeight = fitElement.height,
            scaleX = fitWidth / this.nativeSize[0],
            scaleY = fitHeight / this.nativeSize[1],
            scale = Math.min(scaleX, scaleY);

        this.baseScale = scale;
        this.minScale = scale / 10;
        this.maxScale = scale * 10;
        this.setScale(1);
    }

    /** sets the scale factor, triggers resizing and redrawing */
    function setScale(scale, noResize) {
        // console.log (scale, this.scale, this.baseScale);
        console.time && console.time('scale');

        this.scale = scale // * (this.scale || 1);

        var fitElement = this.scaleToFitSelector ? document.querySelector(this.scaleToFitSelector) : this.canvas;
        if (!fitElement) {
            return;
        }
        var fitWidth = fitElement.offsetWidth,
            fitHeight = fitElement.offsetHeight;

        var scrollX = (fitElement.scrollLeft + fitElement.clientWidth / 2) / fitElement.scrollWidth;
        var scrollY = (fitElement.scrollTop + fitElement.clientHeight / 2) / fitElement.scrollHeight;


        // console.log ('scroll amount: %s, position: %s, width: %s', scrollX, fitElement.scrollLeft, fitElement.scrollWidth);

        if ('svg' in this) {
            // this.svg.setAttributeNS (null, 'width', scale * this.baseScale * this.nativeSize[0]);
            // this.svg.setAttributeNS (null, 'height', scale * this.baseScale * this.nativeSize[1]);

            this.svg.style.width = scale * this.baseScale * this.nativeSize[0] + "px"; // fitElement.offsetWidth //
            this.svg.style.height = scale * this.baseScale * this.nativeSize[1] + "px"; // fitElement.offsetHeight //

        } else if ('canvas' in this) {

            var canvas = this.canvas;
            var context = canvas.getContext('2d'),
                devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio =
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1,
                ratio = devicePixelRatio / backingStoreRatio;

            if (!noResize) {
                canvas.width = scale * this.baseScale * this.nativeSize[0] * ratio;
                canvas.height = scale * this.baseScale * this.nativeSize[1] * ratio;

                canvas.style.width = scale * this.baseScale * this.nativeSize[0] + "px";
                canvas.style.height = scale * this.baseScale * this.nativeSize[1] + "px";
            }

            this.canvasWidth = scale * this.baseScale * this.nativeSize[0] * ratio;
            this.canvasHeight = scale * this.baseScale * this.nativeSize[0] * ratio;

            this.ratio = ratio;

        }
        fitElement.scrollLeft = scrollX * fitElement.scrollWidth - fitElement.clientWidth / 2;
        fitElement.scrollTop = scrollY * fitElement.scrollHeight - fitElement.clientHeight / 2;
        this.redraw();
    }


    function draw() {
        if (!this.renderer) this.initRenderer();
        this.renderer.draw();
        // Stemn Change - Add a Draw callback!
        if (this.drawCallback) {
            this.drawCallback();
        }
    }

    function redraw() {
        if (!this.renderer) this.initRenderer();
        this.renderer.redraw();
    }

    function initRenderer() {
        this.renderer = new ViewEECanvasRenderer(this);
    }

    // ---------------
    // --- PARSERS ---
    // ---------------

    ViewEE.parsers = [];

    if (EagleXMLParser) {
        ViewEE.parsers.push(EagleXMLParser);
    }

    if (KicadNewParser) {
        ViewEE.parsers.push(KicadNewParser);
    }

//    if ("AltiumParser" in window) {
//        ViewEE.parsers.push(window.AltiumParser);
//    }
//
//    if ("GEDAParser" in window) {
//        ViewEE.parsers.push(window.GEDAParser);
//    }

    ViewEE.prototype.findParser = function (text) {
        var board = {};
        var parserFound = ViewEE.parsers.some(function (parser) {
            if (!parser) return;
            if (parser.supports(text)) {
                var timerLabel = 'parsing using ' + parser.name;
                var parser = new parser(this);
                parser.parse(text);
                var bounds = this.calculateBounds();
                board = this;
                board.bounds = {
                    minX: bounds[0],
                    minY: bounds[1],
                    maxX: bounds[2],
                    maxY: bounds[3],
                }
                board.type = 'pcb';

                this.nativeBounds = bounds;
                this.nativeSize = [this.nativeBounds[2] - this.nativeBounds[0], this.nativeBounds[3] - this.nativeBounds[1]];

                return true;
            }
        }, this);

        if (!parserFound){
            board.error = 'Cannot find parser for selected file';
        }

        return board;
    }

    function render(canvas, side) {
        this.canvas = canvas;
        this.scaleToFit();
        this.draw();

    //        var ctx = canvas.getContext('2d');
    //
    //        ctx.globalCompositeOperation = 'xor';
    //        ctx.beginPath();
    //        ctx.fillStyle = 'black'
    //        ctx.rect(100,100,100,100);
    //        ctx.fill();

    }


    // --------------------
    // --- COMMON UTILS ---
    // --------------------

    ViewEE.prototype.calcBBox = function (wires) {
        var bbox = [
        ViewEE.LARGE_NUMBER,
        ViewEE.LARGE_NUMBER,
        -ViewEE.LARGE_NUMBER,
        -ViewEE.LARGE_NUMBER
    ];
        wires.forEach(function (wireDict) {
            if (wireDict.x1 < bbox[0]) {
                bbox[0] = wireDict.x1;
            }
            if (wireDict.x1 > bbox[2]) {
                bbox[2] = wireDict.x1;
            }
            if (wireDict.y1 < bbox[1]) {
                bbox[1] = wireDict.y1;
            }
            if (wireDict.y1 > bbox[3]) {
                bbox[3] = wireDict.y1;
            }
            if (wireDict.x2 < bbox[0]) {
                bbox[0] = wireDict.x2;
            }
            if (wireDict.x2 > bbox[2]) {
                bbox[2] = wireDict.x2;
            }
            if (wireDict.y2 < bbox[1]) {
                bbox[1] = wireDict.y2;
            }
            if (wireDict.y2 > bbox[3]) {
                bbox[3] = wireDict.y2;
            }
        });
        if ((bbox[0] >= bbox[2]) || (bbox[1] >= bbox[3])) {
            bbox = null;
        }

        return bbox;
    }

    function layerColor (colorIdx) {
        var rgb = this.colorPalette[colorIdx];
        if (!rgb) {
            console.warn("color %s not defined, using default color", colorIdx, this.colorPalette[0]);
            rgb = this.colorPalette[colorIdx] = this.colorPalette[0];
        }
        return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }

    ViewEE.prototype.highlightColor = function (colorIdx) {
        var rgb = this.colorPalette[colorIdx];
        if (!rgb) {
            console.warn("color %s not defined, using default color", colorIdx, this.colorPalette[0]);
            rgb = this.colorPalette[colorIdx] = this.colorPalette[0];
        }
        return 'rgb(' + (rgb[0] + 50) + ',' + (rgb[1] + 50) + ',' + (rgb[2] + 50) + ')';
    }

    function viaPadColor() {
        return "#0b0";
    }

    function angleForRot(rot) {
        if (!rot) return {
            degrees: 0
        };
        var spin = (rot.indexOf('S') >= 0), // TODO: spin rotate
            flipped = (rot.indexOf('M') >= 0),
            degrees = parseFloat(rot.split('R')[1]);
        return {
            spin: spin,
            flipped: flipped,
            degrees: degrees
        };
    }

    function matrixForRot(rot) {
        var angle = this.angleForRot(rot);
        var spin = angle.spin, // TODO: spin rotate
            flipped = angle.flipped,
            degrees = angle.degrees,
            rad = degrees * Math.PI / 180.0,
            flipSign = flipped ? -1 : 1,
            matrix = [
            flipSign * Math.cos(rad),
            flipSign * -Math.sin(rad),
            Math.sin(rad),
            Math.cos(rad)
        ];
        return matrix;
    }

    function mirrorLayer(layerIdx) {
        if (layerIdx == 1) {
            return 16;
        } else if (layerIdx == 16) {
            return 1;
        }
        var name = this.layersByNumber[layerIdx].name,
            prefix = name.substring(0, 1);
        if (prefix == 't') {
            var mirrorName = 'b' + name.substring(1),
                mirrorLayer = this.eagleLayersByName[mirrorName];
            if (mirrorLayer) {
                return mirrorLayer.number;
            }
        } else if (prefix == 'b') {
            var mirrorName = 't' + name.substring(1),
                mirrorLayer = this.eagleLayersByName[mirrorName];
            if (mirrorLayer) {
                return mirrorLayer.number;
            }
        }
        return layerIdx;
    }

    function max() {
        var args = [].slice.call(arguments);
        return Math.max.apply(Math, args.filter(function (val) {
            return !isNaN(val);
        }));
    }

    function min() {
        var args = [].slice.call(arguments);
        return Math.min.apply(Math, args.filter(function (val) {
            return !isNaN(val);
        }));
    }

    function calculateBounds() {
        var minX = ViewEE.LARGE_NUMBER,
            minY = ViewEE.LARGE_NUMBER,
            maxX = -ViewEE.LARGE_NUMBER,
            maxY = -ViewEE.LARGE_NUMBER;
        //Plain elements
        for (var layerKey in this.plainWires) {
            var lines = this.plainWires[layerKey];
            for (var lineKey in lines) {
                var line = lines[lineKey],
                    x1 = line.x1,
                    x2 = line.x2,
                    y1 = line.y1,
                    y2 = line.y2,
                    width = line.width || this.minLineWidth;
                minX = min(minX, x1 - width, x1 + width, x2 - width, x2 + width);
                maxX = max(maxX, x1 - width, x1 + width, x2 - width, x2 + width);
                minY = min(minY, y1 - width, y1 + width, y2 - width, y2 + width);
                maxY = max(maxY, y1 - width, y1 + width, y2 - width, y2 + width);
            }
        }

        for (var netName in this.signalItems) {
            for (var layerKey in this.signalItems[netName]) {
                var lines = this.signalItems[netName][layerKey].wires;
                for (var lineKey in lines) {
                    var line = lines[lineKey],
                        x1 = line.x1,
                        x2 = line.x2,
                        y1 = line.y1,
                        y2 = line.y2,
                        width = line.width || this.minLineWidth;
                    minX = min(minX, x1 - width, x1 + width, x2 - width, x2 + width);
                    maxX = max(maxX, x1 - width, x1 + width, x2 - width, x2 + width);
                    minY = min(minY, y1 - width, y1 + width, y2 - width, y2 + width);
                    maxY = max(maxY, y1 - width, y1 + width, y2 - width, y2 + width);
                }
            }
        }

        //Elements
        for (var elemKey in this.elements) {
            var elem = this.elements[elemKey];
            var pkg = typeof elem.pkg === "string" ? this.packagesByName[elem.pkg] : elem.pkg;
            var rotMat = elem.matrix;
            for (var smdIdx in pkg.smds) {
                var smd = pkg.smds[smdIdx],
                    x1 = elem.x + rotMat[0] * smd.x1 + rotMat[1] * smd.y1,
                    y1 = elem.y + rotMat[2] * smd.x1 + rotMat[3] * smd.y1,
                    x2 = elem.x + rotMat[0] * smd.x2 + rotMat[1] * smd.y2,
                    y2 = elem.y + rotMat[2] * smd.x2 + rotMat[3] * smd.y2;
                minX = min(minX, x1, x2);
                maxX = max(maxX, x1, x2);
                minY = min(minY, y1, y2);
                maxY = max(maxY, y1, y2);
            }
            for (var wireIdx in pkg.wires) {
                var wire = pkg.wires[wireIdx],
                    x1 = elem.x + rotMat[0] * wire.x1 + rotMat[1] * wire.y1,
                    y1 = elem.y + rotMat[2] * wire.x1 + rotMat[3] * wire.y1,
                    x2 = elem.x + rotMat[0] * wire.x2 + rotMat[1] * wire.y2,
                    y2 = elem.y + rotMat[2] * wire.x2 + rotMat[3] * wire.y2,
                    width = wire.width || this.minLineWidth;
                minX = min(minX, x1 - width, x1 + width, x2 - width, x2 + width);
                maxX = max(maxX, x1 - width, x1 + width, x2 - width, x2 + width);
                minY = min(minY, y1 - width, y1 + width, y2 - width, y2 + width);
                maxY = max(maxY, y1 - width, y1 + width, y2 - width, y2 + width);
            }
        }
        return [minX, minY, maxX, maxY];
    }

    return ViewEE;
}));





