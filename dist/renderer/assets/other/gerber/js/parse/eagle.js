(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.EagleXMLParser = factory();
	}
}(this, function () {

	function EagleXMLParser (board) {
        this.board = board;
	}

	EagleXMLParser.supports = function (text) {
		if (text.match (/\<\?xml/) && text.match (/\<eagle/)) return true;
	}

	EagleXMLParser.name = "eagle xml brd";

	var layerMaps = {
		"Front": "Top",
		"Back": "Bottom",
		//	"F.Cu": "Top",
		//	"B.Cu": "Bottom",
		//	"Inner1.Cu": "Inner1",
		//	"Inner2.Cu": "Inner2",
		"B.Adhes": "bGlue",
		"F.Adhes": "tGlue",
		"B.Paste": "bCream",
		"F.Paste": "tCream",
		"B.SilkS": "bNames",
		"F.SilkS": "tNames",
		"B.Mask": "bStop",
		"F.Mask": "tStop",
		"Dwgs.User": "tValues",
		//(41 Cmts.User user)
		//(42 Eco1.User user)
		//(43 Eco2.User user)
		"Edge.Cuts": "Dimension"
	};

	var eagleLayers = {
		"Top":     { "name": "Top",     "number": 1, "color": 4 },
		"Inner1":  { "name": "Inner1",  "number": 2, "color": 16 },
		"Inner2":  { "name": "Inner2",  "number": 3, "color": 16 },
		"Inner3":  { "name": "Inner3",  "number": 4, "color": 16 },
		"Inner4":  { "name": "Inner4",  "number": 5, "color": 16 },
		"Inner5":  { "name": "Inner5",  "number": 6, "color": 16 },
		"Inner6":  { "name": "Inner6",  "number": 7, "color": 16 },
		"Inner7":  { "name": "Inner7",  "number": 8, "color": 16 },
		"Inner8":  { "name": "Inner8",  "number": 9, "color": 16 },
		"Inner9":  { "name": "Inner9",  "number": 10, "color": 16 },
		"Inner10": { "name": "Inner10", "number": 11, "color": 16 },
		"Inner11": { "name": "Inner11", "number": 12, "color": 16 },
		"Inner12": { "name": "Inner12", "number": 13, "color": 16 },
		"Inner13": { "name": "Inner13", "number": 14, "color": 16 },
		"Inner14": { "name": "Inner14", "number": 15, "color": 16 },
		"Bottom":  { "name": "Bottom", "number": 16, "color": 1 },
		"Pads": { "name": "Pads", "number": 17, "color": 2 },
		"Vias": { "name": "Vias", "number": 18, "color": 2 },
		"Unrouted": { "name": "Unrouted", "number": 19, "color": 6 },
		"Dimension": { "name": "Dimension", "number": 20, "color": 15 },
		"tPlace": { "name": "tPlace", "number": 21, "color": 7 },
		"bPlace": { "name": "bPlace", "number": 22, "color": 7 },
		"tOrigins": { "name": "tOrigins", "number": 23, "color": 15 },
		"bOrigins": { "name": "bOrigins", "number": 24, "color": 15 },
		"tNames": { "name": "tNames", "number": 25, "color": 7 },
		"bNames": { "name": "bNames", "number": 26, "color": 7 },
		"tValues": { "name": "tValues", "number": 27, "color": 7 },
		"bValues": { "name": "bValues", "number": 28, "color": 7 },
		"tStop": { "name": "tStop", "number": 29, "color": 7 },
		"bStop": { "name": "bStop", "number": 30, "color": 7 },
		"tCream": { "name": "tCream", "number": 31, "color": 7 },
		"bCream": { "name": "bCream", "number": 32, "color": 7 },
		"tFinish": { "name": "tFinish", "number": 33, "color": 6 },
		"bFinish": { "name": "bFinish", "number": 34, "color": 6 },
		"tGlue": { "name": "tGlue", "number": 35, "color": 7 },
		"bGlue": { "name": "bGlue", "number": 36, "color": 7 },
		"tTest": { "name": "tTest", "number": 37, "color": 7 },
		"bTest": { "name": "bTest", "number": 38, "color": 7 },
		"tKeepout": { "name": "tKeepout", "number": 39, "color": 4 },
		"bKeepout": { "name": "bKeepout", "number": 40, "color": 1 },
		"tRestrict": { "name": "tRestrict", "number": 41, "color": 4 },
		"bRestrict": { "name": "bRestrict", "number": 42, "color": 1 },
		"vRestrict": { "name": "vRestrict", "number": 43, "color": 2 },
		"Drills": { "name": "Drills", "number": 44, "color": 7 },
		"Holes": { "name": "Holes", "number": 45, "color": 7 },
		"Milling": { "name": "Milling", "number": 46, "color": 3 },
		"Measures": { "name": "Measures", "number": 47, "color": 7 },
		"Document": { "name": "Document", "number": 48, "color": 7 },
		"Reference": { "name": "Reference", "number": 49, "color": 7 },
		"dxf": { "name": "dxf", "number": 50, "color": 7 },
		"tDocu": { "name": "tDocu", "number": 51, "color": 7 },
		"bDocu": { "name": "bDocu", "number": 52, "color": 7 },
		"tGND_GNDA": { "name": "tGND_GNDA", "number": 53, "color": 7 },
		"bGND_GNDA": { "name": "bGND_GNDA", "number": 54, "color": 1 },
		"wert": { "name": "wert", "number": 56, "color": 7 },
		"Nets": { "name": "Nets", "number": 91, "color": 2 },
		"Busses": { "name": "Busses", "number": 92, "color": 1 },
		"Pins": { "name": "Pins", "number": 93, "color": 2 },
		"Symbols": { "name": "Symbols", "number": 94, "color": 4 },
		"Names": { "name": "Names", "number": 95, "color": 7 },
		"Values": { "name": "Values", "number": 96, "color": 7 },
		"Info": { "name": "Info", "number": 97, "color": 7 },
		"Guide": { "name": "Guide", "number": 98, "color": 6 },
		"Muster": { "name": "Muster", "number": 100, "color": 7 },
		"Patch_Top": { "name": "Patch_Top", "number": 101, "color": 12 },
		"Vscore": { "name": "Vscore", "number": 102, "color": 7 },
		"fp3": { "name": "fp3", "number": 103, "color": 7 },
		"Name": { "name": "Name", "number": 104, "color": 7 },
		"Beschreib": { "name": "Beschreib", "number": 105, "color": 9 },
		"BGA-Top": { "name": "BGA-Top", "number": 106, "color": 4 },
		"BD-Top": { "name": "BD-Top", "number": 107, "color": 5 },
		"fp8": { "name": "fp8", "number": 108, "color": 7 },
		"fp9": { "name": "fp9", "number": 109, "color": 7 },
		"fp0": { "name": "fp0", "number": 110, "color": 7 },
		"Patch_BOT": { "name": "Patch_BOT", "number": 116, "color": 9 },
		"_tsilk": { "name": "_tsilk", "number": 121, "color": 7 },
		"_bsilk": { "name": "_bsilk", "number": 122, "color": 7 },
		"tTestmark": { "name": "tTestmark", "number": 123, "color": 7 },
		"bTestmark": { "name": "bTestmark", "number": 124, "color": 7 },
		"tAdjust": { "name": "tAdjust", "number": 131, "color": 7 },
		"bAdjust": { "name": "bAdjust", "number": 132, "color": 7 },
		"HeatSink": { "name": "HeatSink", "number": 151, "color": 7 },
		"200bmp": { "name": "200bmp", "number": 200, "color": 1 },
		"201bmp": { "name": "201bmp", "number": 201, "color": 2 },
		"202bmp": { "name": "202bmp", "number": 202, "color": 3 },
		"203bmp": { "name": "203bmp", "number": 203, "color": 4 },
		"204bmp": { "name": "204bmp", "number": 204, "color": 5 },
		"205bmp": { "name": "205bmp", "number": 205, "color": 6 },
		"206bmp": { "name": "206bmp", "number": 206, "color": 7 },
		"207bmp": { "name": "207bmp", "number": 207, "color": 8 },
		"208bmp": { "name": "208bmp", "number": 208, "color": 9 },
		"209bmp": { "name": "209bmp", "number": 209, "color": 7 },
		"210bmp": { "name": "210bmp", "number": 210, "color": 7 },
		"Descript": { "name": "Descript", "number": 250, "color": 3 },
		"SMDround": { "name": "SMDround", "number": 251, "color": 12 },
		"cooling": { "name": "cooling", "number": 254, "color": 7 }
	};

	EagleXMLParser.prototype.eagleLayer = function (layerName) {
		// eagle draw will replace layer info accordingly
		if (layerName === "*.Cu") layerName = "Front";
		if (layerName === "*.Mask") layerName = "F.Mask";
		if (!layerMaps[layerName]) return;
		return eagleLayers [layerMaps[layerName]];
	}

	EagleXMLParser.prototype.parse = function (text) {
		var parser = new DOMParser ();
		var boardXML = parser.parseFromString (text, "text/xml");
		this.parseDOM (boardXML)
	}

	EagleXMLParser.prototype.parseDOM = function(boardXML) {

		var board = this.board;
		// store by eagle name
		board.eagleLayersByName = {};
		// store by eagle number
		board.layersByNumber = {};

		var layers = boardXML.getElementsByTagName('layer');
		for (var layerIdx = 0; layerIdx < layers.length; layerIdx++) {
			var layerDict = this.parseLayer (layers[layerIdx]);
			board.eagleLayersByName[layerDict.name] = layerDict;
			board.layersByNumber[layerDict.number]  = layerDict;
		}

		board.elements = {};
		var elements = boardXML.getElementsByTagName('element');
		for (var elementIdx = 0; elementIdx < elements.length; elementIdx++) {
			var elemDict = this.parseElement (elements[elementIdx])
			board.elements[elemDict.name] = elemDict;
		}

		board.designRules = {};
		//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
		var rules = boardXML.getElementsByTagName('designrules');
		for (var ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
			var rule = rules[ruleIdx];

			var ruleParams = rule.getElementsByTagName('param');
			for (var ruleParamIdx = 0; ruleParamIdx < ruleParams.length; ruleParamIdx++) {
				var ruleParam = ruleParams[ruleParamIdx];
				var ruleParamVal = ruleParam.getAttribute ("value");
				var m;
				if (m = ruleParamVal.match (/^([\d\.]+)mil$/))
					ruleParamVal = parseFloat(m[1])*0.0254;
				board.designRules[ruleParam.getAttribute ("name")] = ruleParamVal;
			}
		}


		board.signalItems = {};
		//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
		var signals = boardXML.getElementsByTagName('signal');
		for (var sigIdx = 0; sigIdx < signals.length; sigIdx++) {
			var signal = signals[sigIdx];
			var name = signal.getAttribute('name');
			var signalLayers = {};
			board.signalItems[name] = signalLayers;

			var wires = signal.getElementsByTagName('wire');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wireDict = this.parseWire( wires[wireIdx] );
				var layer = wireDict.layer;
				if (!(signalLayers[layer])) signalLayers[layer] = {};
				var layerItems = signalLayers[layer];
				if (!(layerItems['wires'])) layerItems['wires'] = [];
				var layerWires = layerItems['wires'];
				layerWires.push(wireDict);
			}

			var vias = signal.getElementsByTagName('via');
			for (var viaIdx = 0; viaIdx < vias.length; viaIdx++) {
				var viaDict = this.parseVia(vias[viaIdx]);
				var layers = viaDict.layers;
				if (!(signalLayers[layers])) signalLayers[layers] = {};
				var layerItems = signalLayers[layers];
				if (!(layerItems['vias'])) layerItems['vias'] = [];
				var layerVias = layerItems['vias'];
				layerVias.push(viaDict);
			}

			var contacts = signal.getElementsByTagName('contactref');
			for (var contactIdx = 0; contactIdx < contacts.length; contactIdx++) {
				var contact = contacts[contactIdx];
				var elemName = contact.getAttribute('element');
				var padName = contact.getAttribute('pad');
				var elem = board.elements[elemName];
				if (elem) elem.padSignals[padName] = name;
			}
		}

		board.packagesByName = {};
		var packages = boardXML.getElementsByTagName('package');
		for (var packageIdx = 0; packageIdx < packages.length; packageIdx++) {
			var pkg = packages[packageIdx];
			var packageName = pkg.getAttribute('name');

			var descriptionEls = pkg.getElementsByTagName('description');
			if (descriptionEls && descriptionEls.length)
				var description = descriptionEls[0].textContent;

			var packageSmds = [];
			var smds = pkg.getElementsByTagName('smd');
			for (var smdIdx = 0; smdIdx < smds.length; smdIdx++) {
				var smd = smds[smdIdx];
				packageSmds.push(this.parseSmd(smd));
			}

			var packageRects = [];
			var rects = pkg.getElementsByTagName('rectangle');
			for (var rectIdx = 0; rectIdx < rects.length; rectIdx++) {
				var rect = rects[rectIdx];
				packageRects.push(this.parseRect(rect));
			}

			var packagePads = [];
			var pads = pkg.getElementsByTagName('pad');
			for (var padIdx = 0; padIdx < pads.length; padIdx++) {
				var pad = pads[padIdx];
				packagePads.push(this.parsePad(pad));
			}

			var packagePolys = [];
			var polys = pkg.getElementsByTagName('polygon');
			for (var polyIdx = 0; polyIdx < polys.length; polyIdx++) {
				var poly = polys[polyIdx];
				packagePolys.push (this.parsePoly (poly));
			}

			var packageWires = [];
			var wires = pkg.getElementsByTagName('wire');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wire = wires[wireIdx];
				var wireDict = this.parseWire(wire);
				packageWires.push(wireDict);
			}

			var wires = pkg.getElementsByTagName('circle');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wire = wires[wireIdx];
				var wireDict = this.parseCircle(wire);
				packageWires.push(wireDict);
			}

			var packageHoles = [];
			var holes = pkg.getElementsByTagName('hole');
			for (var holeIdx = 0; holeIdx < holes.length; holeIdx++) {
				var hole = holes[holeIdx];
				var holeDict = this.parseHole(hole);
				packageHoles.push(holeDict);
			}

			var bbox = this.board.calcBBox (packageWires);

			var packageTexts = [],
				texts        = pkg.getElementsByTagName('text');
			for (var textIdx = 0; textIdx < texts.length; textIdx++) {
				var text = texts[textIdx];
				packageTexts.push(this.parseText(text));
			}


			var packageDict = {
				smds:  packageSmds,
				wires: packageWires,
				texts: packageTexts,
				bbox:  bbox,
				pads:  packagePads,
				polys: packagePolys,
				holes: packageHoles,
				rects: packageRects,
				description: description
			};
			board.packagesByName[packageName] = packageDict;
		}

		board.plainWires = {};
		board.plainTexts = {};
		board.plainHoles = [];
		var plains = boardXML.getElementsByTagName('plain');	//Usually only one
		for (var plainIdx = 0; plainIdx < plains.length; plainIdx++) {
			var plain = plains[plainIdx],
				wires = plain.getElementsByTagName('wire'),
				texts = plain.getElementsByTagName('text'),
				holes = plain.getElementsByTagName('hole');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wire = wires[wireIdx],
					wireDict = this.parseWire(wire),
					layer = wireDict.layer;
				if (!board.plainWires[layer]) board.plainWires[layer] = [];
				board.plainWires[layer].push(wireDict);
			}

			for (var textIdx = 0; textIdx < texts.length; textIdx++) {
				var text = texts[textIdx],
					textDict = this.parseText(text),
					layer = textDict.layer;
				if (!board.plainTexts[layer]) board.plainTexts[layer] = [];
				board.plainTexts[layer].push(textDict);
			}

			for (var holeIdx = 0; holeIdx < holes.length; holeIdx++) {
				var hole = holes[holeIdx],
					holeDict = this.parseHole(hole);
				board.plainHoles.push(holeDict);
			}
		}
	}

	EagleXMLParser.prototype.parseSmd = function(smd) {
		var smdX  = parseFloat(smd.getAttribute('x')),
			smdY  = parseFloat(smd.getAttribute('y')),
			smdDX = parseFloat(smd.getAttribute('dx')),
			smdDY = parseFloat(smd.getAttribute('dy')),
			rot   = smd.getAttribute('rot') || "R0",
			roundness = parseInt (smd.getAttribute('roundness'));

		return {
			x1:    smdX-0.5*smdDX,
			y1:    smdY-0.5*smdDY,
			x2:    smdX+0.5*smdDX,
			y2:    smdY+0.5*smdDY,
			rot:   rot,
			roundness: roundness,
			name:  smd.getAttribute('name'),
			layer: smd.getAttribute('layer')
		};
	}

	EagleXMLParser.prototype.parseRect = function(rect) {
		return {
			'x1'   : parseFloat(rect.getAttribute('x1')),
			'y1'   : parseFloat(rect.getAttribute('y1')),
			'x2'   : parseFloat(rect.getAttribute('x2')),
			'y2'   : parseFloat(rect.getAttribute('y2')),
			'layer': rect.getAttribute('layer')};
	}


	EagleXMLParser.prototype.parsePoly = function(poly) {
		var width = parseFloat(poly.getAttribute('width'));
		var vertexes = [];
		[].slice.apply (poly.getElementsByTagName ('vertex')).forEach (function (vertexEl) {
			vertexes.push ({
				'x':parseFloat (vertexEl.getAttribute ('x')),
				'y':parseFloat (vertexEl.getAttribute ('y'))
			});
		});

		return {
			vertexes: vertexes,
			layer: poly.getAttribute('layer'),
			width: width
		};
	}


	EagleXMLParser.prototype.parsePad = function(pad) {
		var drill = parseFloat(pad.getAttribute('drill'));
		var diameter = parseFloat(pad.getAttribute('diameter'));
		// TODO: use proper measurements
		// designrules contains such parameters:
		// restring in pads and vias are defined in percent of the drill diameter
		// rvPadTop, rvPadInner, rvPadBottom — is a restring for top, inner and bottom layers
		// rlMinPadTop, rlMaxPadTop — min and max limits for top layer and so on

		if (isNaN (diameter)) diameter = drill * 1.5;
		var padRot = pad.getAttribute('rot') || "R0"
		return {
			x:     parseFloat(pad.getAttribute('x')),
			y:     parseFloat(pad.getAttribute('y')),
			drill: drill,
			name:  pad.getAttribute('name'),
			shape: pad.getAttribute('shape'),
			diameter: diameter,
			rot:   padRot
		};
	}

	EagleXMLParser.prototype.parseVia = function(via) {
		// TODO: use proper measurements
		// designrules contains such parameters:
		// restring in pads and vias are defined in percent of the drill diameter
		// rvViaOuter, rvViaInner — is a restring for top/bottom and inner layers
		// rlMinViaOuter, rlMaxViaOuter — min and max limits for top layer and so on

		// TODO: check for inner vias
		var drill = parseFloat(via.getAttribute('drill'));
		var viaType = 'Outer';
		var dr = this.board.designRules;
		var viaMult = parseFloat (dr['rvVia' + viaType]);
		var viaMax  = parseFloat (dr['rlMaxVia' + viaType]);
		var viaMin  = parseFloat (dr['rlMinVia' + viaType]);
		var viaRest = drill * viaMult;
		if (viaRest < viaMin) {
			viaRest = viaMin;
		} else if (viaRest > viaMax) {
			viaRest = viaMax;
		}

		return {
			x:        parseFloat(via.getAttribute('x')),
			y:        parseFloat(via.getAttribute('y')),
			drill:    drill,
			diameter: drill + viaRest*2,
			layers:   via.getAttribute('extent'),
			shape:    via.getAttribute('shape')
		};
	}

	EagleXMLParser.prototype.parseHole = function(hole) {
		return {
			'x':parseFloat(hole.getAttribute('x')),
			'y':parseFloat(hole.getAttribute('y')),
			'drill':parseFloat(hole.getAttribute('drill'))
		};
	}

	// special thanks to http://paulbourke.net/geometry/circlesphere/
	function circleCenter (x1, y1, x2, y2, angle) {

		/* dx and dy are the vertical and horizontal distances between
		* the circle centers.
		*/
		var dx = x2 - x1;
		var dy = y2 - y1;

		if (Math.abs(angle) === 180) {
			var cx = x1 + dx/2,
				cy = y1 + dy/2,
				angle1 = Math.atan2 (y1 - cy, cx - x1),
				angle2 = Math.atan2 (y2 - cy, cx - x2);
			return [cx, cy, angle1, Math.sqrt (dx*dx/4 + dy*dy/4)];
		}

		/* Determine the straight-line distance between the centers. */
		//d = sqrt((dy*dy) + (dx*dx));
		//d = hypot(dx,dy); // Suggested by Keith Briggs
		var d = Math.sqrt (dx*dx + dy*dy);

		var r = Math.abs (d / 2 / Math.sin (angle/180/2*Math.PI)),
			r0 = r,
			r1 = r;

		/* Check for solvability. */
		if (d > (r0 + r1)) {
			/* no solution. circles do not intersect. */
			console.log ("no solution. circles do not intersect", d, r0, r1);
			return;
		}

		if (d < Math.abs (r0 - r1)) {
			/* no solution. one circle is contained in the other */
			console.log ("no solution. one circle is contained in the other", d, r0, r1);
			return;
		}

		/* 'point 2' is the point where the line through the circle
		* intersection points crosses the line between the circle
		* centers.
		*/

		/* Determine the distance from point 0 to point 2. */
		var a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

		/* Determine the coordinates of point 2. */
		var x3 = x1 + (dx * a/d);
		var y3 = y1 + (dy * a/d);

		/* Determine the distance from point 2 to either of the
		* intersection points.
		*/
		var h = Math.sqrt((r0*r0) - (a*a));

		/* Now determine the offsets of the intersection points from
		* point 2.
		*/

		var rx = -dy * (h/d),
			ry = dx * (h/d);

		/* Determine the absolute intersection points. */
		var cx1 = x3 + rx,
			cy1 = y3 + ry,
			cx2 = x3 - rx,
			cy2 = y3 - ry,
			rad11 = Math.atan2 (y1 - cy1, cx1 - x1),
			rad12 = Math.atan2 (y2 - cy1, cx1 - x2),
			rad21 = Math.atan2 (y1 - cy2, cx2 - x1),
			rad22 = Math.atan2 (y2 - cy2, cx2 - x2),
			angle1 = (rad11 - rad12)/Math.PI*180,
			angle2 = (rad21 - rad22)/Math.PI*180,
			dAngle1 = (angle - angle1) % 360,
			dAngle2 = (angle - angle2) % 360;

		if (-0.0000001 < dAngle1 && dAngle1 < 0.0000001) {
			return [cx1, cy1, rad11, r];
		} else if (-0.0000001 < dAngle2 && dAngle2 < 0.0000001) {
			return [cx2, cy2, rad21, r];
		} else {
			console.log ("something wrong: angle:", angle, "angle1:", angle1, "dangle1", (-0.0000001 < dAngle1 || dAngle1 < 0.0000001), "angle2:", angle2, "dangle2:", (-0.0000001 < dAngle2 || dAngle2 < 0.0000001));
			return [cx2, cy2, rad21, r];
		}

		// return [cx1, cy1, cx2, cy2];
	}

	EagleXMLParser.prototype.parseWire = function(wire) {
		var width = parseFloat(wire.getAttribute('width'));
		if (width <= 0.0) width = this.minLineWidth;

		var layer = parseInt(wire.getAttribute('layer'));

		var x1 = parseFloat(wire.getAttribute('x1')),
			y1 = parseFloat(wire.getAttribute('y1')),
			x2 = parseFloat(wire.getAttribute('x2')),
			y2 = parseFloat(wire.getAttribute('y2'));

		var style = wire.getAttribute ("style");

		var curve = parseInt(wire.getAttribute('curve'));

		if (curve) {

			var center = circleCenter (x1, y1, x2, y2, curve);

			var angle = Math.PI * (curve/180);

			if (angle < 0) {
				center[2] += - angle;
				angle = - angle;
			}

			return {
				x: center[0],
				y: center[1],
				radius: center[3],
				start: Math.PI - center[2],
				angle: angle,
				curve: curve,
				width: width,
				layer: layer,
				style: style,
				cap: wire.getAttribute('cap'),
				rot: wire.getAttribute('rot') || "R0"
			}
		}

		return {
			x1: x1,
			y1: y1,
			x2: x2,
			y2: y2,
			style: style,
			width: width,
			layer: layer
		};

	}

	EagleXMLParser.prototype.parseCircle = function(wire) {
		var width = parseFloat(wire.getAttribute('width'));
		if (width <= 0.0) width = this.minLineWidth;

		var layer = parseInt(wire.getAttribute('layer'));

		var tagName = wire.tagName;

		return {
			x: parseFloat(wire.getAttribute ("x")),
			y: parseFloat(wire.getAttribute ("y")),
			radius: parseFloat(wire.getAttribute ("radius")),
			start: 0,
			angle: Math.PI * 2,
			curve: 360,
			width: width,
			layer: layer
		}
	}


	EagleXMLParser.prototype.parseText = function(text) {
		var content = text.textContent;
		if (!content) content = "";
		var textRot = text.getAttribute('rot') || "R0";
		var textAlign = text.getAttribute('align') || "",
			align,
			valign,
			textAngle = this.board.angleForRot (textRot);

		if (textAlign === "center") {
			align = "center";
			valign = "middle";
		} else {
			if (textAlign.match (/\-right$/)) {
				align = "right";
			} else if (textAlign.match (/\-left$/)) {
				align = "left";
			} else if (textAlign.match (/\-center$/)) {
				align = "center";
			}
			if (textAlign.match (/^top\-/)) {
				valign = "top";
			} else if (textAlign.match (/^bottom\-/)) {
				valign = "bottom";
			} else if (textAlign.match (/^center\-/)) {
				valign = "middle";
			}
		}

		return {
			x:       parseFloat(text.getAttribute('x')),
			y:       parseFloat(text.getAttribute('y')),
			size:    parseFloat(text.getAttribute('size')),
			layer:   parseInt(text.getAttribute('layer')),
			ratio:   parseInt(text.getAttribute('ratio')),
			interlinear: parseInt(text.getAttribute('distance')) || 50,
			align:   align,
			valign:  valign,
			rot:     textRot,
			flipText: ((textAngle.degrees > 90) && (textAngle.degrees <=270)),
			font:    text.getAttribute('font'),
			content: content
		};
	}

	EagleXMLParser.prototype.parseElement = function(elem) {
		var elemRot    = elem.getAttribute('rot') || "R0",
			elemMatrix = this.board.matrixForRot(elemRot);

		var attribs = {},
			elemAngle = this.board.angleForRot (elemRot),
			flipText = (elemAngle.degrees >= 90) && (elemAngle.degrees <= 270),
			elemAttribs = elem.getElementsByTagName('attribute');

		for (var attribIdx = 0; attribIdx < elemAttribs.length; attribIdx++) {

			var elemAttrib = elemAttribs[attribIdx],
				attribDict = {},
				name = elemAttrib.getAttribute('name');

			if (name) {
				attribDict.name = name;
				if (elemAttrib.getAttribute('x'))     { attribDict.x = parseFloat(elemAttrib.getAttribute('x')); }
				if (elemAttrib.getAttribute('y'))     { attribDict.y = parseFloat(elemAttrib.getAttribute('y')); }
				if (elemAttrib.getAttribute('size'))  { attribDict.size = parseFloat(elemAttrib.getAttribute('size')); }
				if (elemAttrib.getAttribute('layer')) { attribDict.layer = parseInt(elemAttrib.getAttribute('layer')); }
				attribDict.font = elemAttrib.getAttribute('font');

				var rot = elemAttrib.getAttribute('rot');
				if (!rot) { rot = "R0"; }
				var attribAngle = this.board.angleForRot (rot);
				attribDict.flipText = (attribAngle.degrees >= 90) && (attribAngle.degrees <= 270);
				attribDict.rot = rot;
				attribDict.display = elemAttrib.getAttribute('display');
				attribs[name] = attribDict;
			}
		}
		return {
			'pkg'   : elem.getAttribute('package'),
			'name'      : elem.getAttribute('name'),
			'value'     : elem.getAttribute('value'),
			'x'         : parseFloat(elem.getAttribute('x')),
			'y'         : parseFloat(elem.getAttribute('y')),
			'rot'       : elemRot,
			'matrix'    : elemMatrix,
			'mirror'    : elemRot.indexOf('M') == 0,
			'flipText'  : flipText,
			'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
			'attributes': attribs,
			'padSignals': {}			//to be filled later
		};
	};

	EagleXMLParser.prototype.parseLayer = function(layer) {
		return {'name'  : layer.getAttribute('name'),
				'number': parseInt(layer.getAttribute('number')),
				'color' : parseInt(layer.getAttribute('color'))};
	}


//	if (typeof process !== "undefined") {
//		var ex = new EagleXMLParser ();
//		var fs = require ("fs");
//		ex.parse (fs.readFileSync (process.argv[2]));
//	}

	return EagleXMLParser;

}));
