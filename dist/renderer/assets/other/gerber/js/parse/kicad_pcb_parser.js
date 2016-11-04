(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.KicadNewParser = factory();
	}
}(this, function () {

function KicadNewParser (board) {
    board = board || {};
	this.context = [];
	this.chunk = ""; // TODO: use a node compatible Buffers

	this.cmd = null;
	this.context = [];
	this.args = false;
	this.stringContext = false;
	this.token = "";

	this.netByNumber = {};
	this.netByName   = {};
	this.netClass    = {};

	// store by eagle name
	board.eagleLayersByName = {};
	// store by eagle number
	board.layersByNumber = {};

	board.elements = {};

	board.signalItems = {};

	board.packagesByName = {};

	board.plainWires = {};
	board.plainTexts = {};

	board.coordYFlip = true;

	this.board = board;
}

KicadNewParser.supports = function (text) {
	if (text.match (/\(kicad_pcb/)) return true;
}

KicadNewParser.name = "kicad kicad_pcb";


var layerMaps = {
	"Front": "Top",
	"Back": "Bottom",
	"F.Cu": "Top",
	"B.Cu": "Bottom",
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
	"F.CrtYd": "tKeepout",
	"B.CrtYd": "bKeepout",
	"F.Fab": "tPlace",
	"B.Fab": "bPlace",
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

KicadNewParser.prototype.eagleLayer = function (layerName) {
	// eagle draw will replace layer info accordingly
	if (layerName === "*.Cu") layerName = "Front";
	if (layerName === "*.Mask") layerName = "F.Mask";
	if (!layerMaps[layerName]) {
		console.warn ('Unknown layer %s, skipping', layerName);
		return {};
	}
	return eagleLayers [layerMaps[layerName]];
}

KicadNewParser.prototype.parse = function (text) {

	text = text.toString();

	text.split(/[\r\n]+/g).forEach (this.parseChunk, this);

	this.cmdCb = function (cmd, context) {

	}
}

KicadNewParser.prototype.parseChunk = function (chunk) {
	this.chunk += chunk;

	this.chunk.split (/[\s]/).forEach (function (token) {
		//if ()
	}, this);
}

KicadNewParser.prototype.parseChunk = function (chunk) {
	var str = chunk.toString();
	var l = str.length;

	for (var i = 0; i<l; i++) {
		var c = str[i];

		if (c === '"') {
			this.stringContext = !this.stringContext;
			continue;
		}

		if (this.stringContext) {
			this.token += c;
			continue;
		}

		if (c === '(') {
			this.args = false;

			if (!this.cmd) {
				this.cmd = {name: "", args: []};
			} else {
				var newCmd = {name: "", args: []};
				this.cmd.args.push (newCmd);
				this.cmd = newCmd;
			}

			this.context.push(this.cmd);
		} else if (c === ')') {

			this.handleToken();

			if (this.context.length === 1) {
				// TODO: this.parseCompleted ();
				return;
			}

			this.context.pop();

			this.cmdDone (this.cmd);

			this.cmd = this.context[this.context.length-1];

		} else if (c === ' ') {
			this.handleToken();
		} else {
			this.token += c;
		}
	}
}

KicadNewParser.prototype.handleToken = function () {
	var trimmed = this.token.trim();

	if (!this.args) {
		this.args = true;
		this.cmd.name = this.token;
	} else if (trimmed) {
		this.cmd.args.push (trimmed);
	}
	this.token = "";
}

var alwaysArray = "fp_text fp_circle fp_line pad".split (" ");

KicadNewParser.prototype.extractAttrs = function (args) {
	var attrs = {};
	var attrCount = {};
	args.forEach (function (arg) {
		if (!arg.name) {
			return;
		}

		if (arg.name in attrs) {
			if (attrCount[arg.name] === 1) {
				attrs[arg.name] = [attrs[arg.name], arg.args];
				attrCount[arg.name] = 2;
			} else {
				attrs[arg.name].push (arg.args);
			}
		} else if (alwaysArray.indexOf (arg.name) > -1) {
			attrs[arg.name] = [arg.args];
			attrCount[arg.name] = 2;
		} else {
			attrs[arg.name] = arg.args;
			attrCount[arg.name] = 1;
		}

	}, this);
	return attrs;
}

KicadNewParser.prototype.spliceArgs = function (args) {
	var spliced = [];
	args.forEach (function (arg) {
		if (!arg.name) {
			spliced.push (arg);
		}
	}, this);
	return spliced;
}

KicadNewParser.prototype.parseLine = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);
	var line = {
		x1: parseFloat (cmd.attrs.start[0]),
		y1: parseFloat (cmd.attrs.start[1]),
		x2: parseFloat (cmd.attrs.end[0]),
		y2: parseFloat (cmd.attrs.end[1]),
		width: parseFloat (cmd.attrs.width[0]),
		layer: cmd.attrs.layer[0]
	};
	if (cmd.name === "gr_arc") {
		var angle = parseFloat (cmd.attrs.angle[0])/180 * Math.PI;
		var dx = line.x1 - line.x2,
			dy = line.y1 - line.y2;
		var arc = {
			x: line.x1,
			y: line.y1,
			width: line.width,
			layer: line.layer,
			curve: angle,
			angle: angle,
			radius: Math.sqrt (dx * dx + dy * dy),
			// TODO: why to add Math.PI?
			start: Math.PI + Math.atan2 (dy, dx)
		};
		return arc;
	}
	return line;
}

KicadNewParser.prototype.parseText = function (cmd, angle) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);

	// semantics, oh my: font size contained in effects/font/size
	var effects = cmd.attrs.effects;
	cmd.attrs.effects = {};
	effects.forEach (function (eff) {
		if (eff.name === "font") {
			cmd.attrs.effects[eff.name] = this.extractAttrs (eff.args);
		} else {
			cmd.attrs.effects[eff.name] = eff.args;
		}
	}, this);
	var text = {
		x: parseFloat (cmd.attrs.at[0]),
		y: parseFloat (cmd.attrs.at[1]),
		font: "vector",
		layer: cmd.attrs.layer[0],
		content: cmd.name === "gr_text" ? cmd.args[0] : cmd.args[1]
	};

	text.content = text.content.replace (/\\n/g, "\n");

	text.size = 1;
	// TODO: size has two children, do something if those don't match
	if (cmd.attrs.effects.font && cmd.attrs.effects.font.size)
		text.size = parseFloat (cmd.attrs.effects.font.size[0]);

	var rotate = parseFloat (cmd.attrs.at[2]) || 0;
	// TODO:
	//text.rot = "R" + (rotate - (angle || 0));
	text.rot = "R" + rotate;
	if (rotate >= 90 && rotate <= 270) {
		text.flipText = true;
	}

	if (cmd.args.indexOf ("hide") > -1)
		text.display = "off";

	var justify = {};
	(cmd.attrs.effects.justify || []).forEach (function (justKey) {
		justify[justKey] = true;
	});
	if (justify.mirror)
		text.rot = "M"+text.rot;
	if (justify.right) {
		text.align = "right"
	} else if (justify.left) {
		text.align = "left";
	} else {
		text.align = "center";
	}

	text.valign = "middle";

	// TODO: effects.attrs.thickness
	// TODO: rotated text?

	return text;
}

KicadNewParser.prototype.parseVia = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);
	var net = cmd.attrs.net[0];
	var viaDrill = this.netClass[this.netByNumber[net].className].via_drill;
	var via = {
		x: parseFloat (cmd.attrs.at[0]),
		y: parseFloat (cmd.attrs.at[1]),
		drill: viaDrill,
		//drill: parseFloat (cmd.attrs.size[0]),
		layers: cmd.attrs.layers
		// shape?
	};
	return via;
}

KicadNewParser.prototype.parseCircle = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);

	var x   = parseFloat (cmd.attrs.center[0]);
	var y   = parseFloat (cmd.attrs.center[1]);
	var x1  = parseFloat (cmd.attrs.end[0]);
	var y1  = parseFloat (cmd.attrs.end[1]);

	var dx = x1 - x,
		dy = y1 - y,
		radius = Math.sqrt (dx * dx + dy * dy);

	var circle = {
		x: x,
		y: y,
		radius: radius,
		start: 0,
		angle: 2*Math.PI,
		curve: 360,
		width: cmd.attrs.width[0],
		layer: cmd.attrs.layer[0]
	};
	return circle;
}


KicadNewParser.prototype.parsePad = function (cmd, angle) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);
	var net;
	if (cmd.attrs.net) net = cmd.attrs.net[0];
	var x   = parseFloat (cmd.attrs.at[0]);
	var y   = parseFloat (cmd.attrs.at[1]);
	// what the f*** ???
	var rot = "R" + ((parseFloat (cmd.attrs.at[2]) || 0) - (angle || 0));
	var w   = parseFloat (cmd.attrs.size[0]);
	var h   = parseFloat (cmd.attrs.size[1]);

	var name  = cmd.args[0];
	var type  = cmd.args[1];
	var shape = cmd.args[2];
	if (name === "np_thru_hole" || name === "smd") {
		shape = cmd.args[1];
		type  = cmd.args[0];
		name  = undefined;
	}

	if (type === "smd") {return {
		x1: x - w/2,
		y1: y - h/2,
		x2: x + w/2,
		y2: y + h/2,
		rot: rot,
		//rot: "R0", // those seems already rotated
		name: name,
		type: type,
		shape: shape,
		layers: cmd.attrs.layers,
		net: net
	}} else if (type === "thru_hole" || type === "np_thru_hole") {return {
		x: x,
		y: y,
		name: name,
		type: type,
		shape: shape === 'rect' ? 'square' : shape,
		layers: cmd.attrs.layers,
		net: net,
		// drill can be ['<drill>'], or ['<shape=oval?>', '<drill>', '<drill-length>']
		drill: cmd.attrs.drill ? (parseFloat(cmd.attrs.drill[0]) || parseFloat(cmd.attrs.drill[1])) : w,
		diameter: w,
		drillLength: cmd.attrs.drill ? parseFloat(cmd.attrs.drill[2]) : null,
	}}

	console.warn ('pad type %s is not supported', type, cmd);
	return {};
}

KicadNewParser.prototype.parseModule = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	cmd.args  = this.spliceArgs   (cmd.args);

	var pkg = {
		smds: [],
		wires: [],
		texts: [],
		// bbox
		pads: [],
		// description
		polys: [],
		holes: []
	};

	var el = {
		'x'         : parseFloat (cmd.attrs.at[0]),
		'y'         : parseFloat (cmd.attrs.at[1]),
		'pkg'       : pkg,
//		'matrix'    : elemMatrix,
//		'mirror'    : elemRot.indexOf('M') == 0,
//		'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
		'smashed': true,
		'absText': false,
		'attributes': {},
		'padSignals': {}			//to be filled later
	};

	if ("descr" in cmd.attrs) {
		pkg.description = cmd.attrs.descr[0];
	}

	var rotate = parseFloat (cmd.attrs.at[2]) || 0;
	el.rot = "R" + (-rotate); // WHY?

	cmd.attrs.fp_text.forEach (function (txtCmd) {
		var txt = this.parseText ({name: "fp_text", args: txtCmd}, rotate);
		txt.type = txtCmd[0];
		txt.layer = this.eagleLayer (txt.layer).number;
		if (txt.type === "reference") {
			txt.name = "NAME";
			el.name = txt.content;
			el.attributes.name = txt;
			txt.font = "vector";
		} else if (txt.type === "value") {
			txt.name = "VALUE";
			el.value = txt.content;
			el.attributes.value = txt;
			txt.font = "vector";
		} else {
			console.warn ("text type '%s' not processed:", txt.type, txt);
		}
	}, this);

	if (cmd.attrs.fp_line) cmd.attrs.fp_line.forEach (function (lineCmd) {
		var line = this.parseLine ({name: "fp_line", args: lineCmd});
		line.layer = this.eagleLayer (line.layer).number;
		pkg.wires.push (line);
	}, this);

	var bbox = this.board.calcBBox (pkg.wires);
	pkg.bbox = bbox;

	if (cmd.attrs.fp_circle) cmd.attrs.fp_circle.forEach (function (arcCmd) {
		var line = this.parseCircle ({name: "fp_circle", args: arcCmd});
		line.layer = this.eagleLayer (line.layer).number;
		pkg.wires.push (line);
	}, this);

	if (cmd.attrs.pad) cmd.attrs.pad.forEach (function (padCmd) {
		var pad = this.parsePad ({name: "pad", args: padCmd}, rotate);

		pad.layer = this.eagleLayer (pad.layers ? pad.layers[0] : cmd.attrs.layer[0]).number;

		if (pad.type === "smd") {
			pkg.smds.push (pad);
		} else if (pad.type === "thru_hole") {
			// TODO: support shapes
			pkg.pads.push (pad);
		} else if (pad.type === "np_thru_hole") {
			// TODO: support shapes
			pkg.pads.push (pad);
		} else {
			console.warn ("pad not processed:", pad);
		}
	}, this);


	// TODO: recheck
	if (cmd.attrs.layer[0] === "Back" || cmd.attrs.layer[0] === "B.Cu") {
		// el.rot = "M"+el.rot;
	}

	el.matrix = this.board.matrixForRot (el.rot);

	return el;

	var net = cmd.attrs.net[0];
	var viaDrill = this.netClass[this.netByNumber[net].className].via_drill;
	var via = {
		x: parseFloat (cmd.attrs.at[0]),
		y: parseFloat (cmd.attrs.at[1]),
		drill: viaDrill,
		//drill: parseFloat (cmd.attrs.size[0]),
		layers: cmd.attrs.layers
		// shape?
	};
	return via;
}


KicadNewParser.prototype.cmdDone = function () {
	var contextPath = this.context.map (function (cmd) {return cmd.name}).join (">");
	// console.log (contextPath, this.cmd);

	if (contextPath !== "kicad_pcb") {
		return;
	}

	// layers
	if (this.cmd.name === "layers") {

		var signalLayers = [];
		this.cmd.args.forEach (function (layer) {
			var layerId = parseInt (layer.name);
			if (layer.args[1] === 'signal')
				signalLayers[layerId] = true;
		});

		var maxSignalLayer = signalLayers.length - 1;

		this.cmd.args.forEach (function (layer) {

			// Layer names can be changed
			//console.log (layer);
			var layerId = parseInt (layer.name);
			var layerName = layer.args[0]; // F.Cu, B.Cu and so on
			var layerType = layer.args[1]; // user, signal, mixed
			var layerShow = layer.args[2] === 'hide' ? false : true; // 'hide' or nothin

			var eagleLayer = this.eagleLayer (layerName);

			if (!eagleLayer && layerId >= 0 && layerId <= 31) {
				if (layerId === 0) {
					layerMaps[layerName] = "Top";
					eagleLayer = this.eagleLayer ("Front");
				} else if (layerId === maxSignalLayer) {
					layerMaps[layerName] = "Bottom";
					eagleLayer = this.eagleLayer ("Back");
				} else if (layerId > 0 && layerId < maxSignalLayer) {
					layerMaps[layerName] = "Inner" + (layerId + 1);
					eagleLayer = this.eagleLayer ("Inner" + (layerId + 1));
				} else if (!eagleLayer) {
					console.warn ("(Maybe unknown layer) We currently not supporting parsing files with more than 16 signal layers, but found layer with id = %d", layerId, layer.args[0]);
				}
			}

			if (!eagleLayer) return;

			// TODO: make a parser interface for this
			this.board.eagleLayersByName[eagleLayer.name] = eagleLayer;
			this.board.layersByNumber[eagleLayer.number]  = eagleLayer;
		}, this);
		// console.log (this.cmd, line);
	}

	// nets
	if (this.cmd.name === "net") {
		var net = {number: this.cmd.args[0], name: this.cmd.args[1]};
		this.netByName[net.name] = this.netByNumber[net.number] = {name: net.name};
	}

	if (this.cmd.name === "net_class") {
		var className = this.cmd.args[0],
			classDesc = this.cmd.args[1];

		var netClass = {
			className: className,
			classDesc: classDesc
		};

		for (var i = 2; i < this.cmd.args.length; i++) {
			var netCmd = this.cmd.args[i];
			if (netCmd.name.match (/u?via_(?:dia|drill)/)) {
				netClass[netCmd.name] = parseFloat (netCmd.args[0]);
			} else if (netCmd.name === "add_net") {
				this.netByName[netCmd.args[0]].className = className;
			}
		}

		this.netClass[className] = netClass;
	}


	// regular wires
	if (this.cmd.name === "gr_line" || this.cmd.name === "gr_arc") {
		var line = this.parseLine (this.cmd);
		// console.log (this.cmd, line);
		var eagleLayerNumber = this.eagleLayer (line.layer).number;
		if (!this.board.plainWires[eagleLayerNumber]) this.board.plainWires[eagleLayerNumber] = [];
		this.board.plainWires[eagleLayerNumber].push (line);
	}

	// signal wires
	if (this.cmd.name === "segment" || this.cmd.name === "via") {
		var entity;
		var entType;
		if (this.cmd.name === "segment") {
			entity = this.parseLine (this.cmd);
			entType = "wires";
		} else {
			entity = this.parseVia (this.cmd);
			entType = "vias";
		}
		var netNum = this.cmd.attrs.net;
		var netName = this.netByNumber[netNum].name;
		// console.log (this.cmd, line, netName);
		if (!this.board.signalItems[netName]) this.board.signalItems[netName] = {};
		var signalLayerItems = this.board.signalItems[netName];
		var eagleLayerNumber;
		if (entity.layers) {
			eagleLayerNumber = entity.layers.map (function (layer) {
				return this.eagleLayer (layer).number;
			}, this).join ("-");
		} else {
			eagleLayerNumber = this.eagleLayer (entity.layer).number;
		}

		if (netNum) {
			if (!signalLayerItems[eagleLayerNumber])
				signalLayerItems[eagleLayerNumber] = {wires: [], vias: []};
			signalLayerItems[eagleLayerNumber][entType].push (entity);
		} else {
			if (!this.board.plainWires[eagleLayerNumber])
				this.board.plainWires[eagleLayerNumber] = [];
			this.board.plainWires[eagleLayerNumber].push (entity);
		}

	}

	if (this.cmd.name === "gr_circle") {
		var circle = this.parseCircle (this.cmd);
		var eagleLayerNumber = this.eagleLayer (circle.layer).number;
		// console.log (this.cmd, text, this.cmd.attrs.effects, eagleLayerNumber);
		if (!this.board.plainWires[eagleLayerNumber]) this.board.plainWires[eagleLayerNumber] = [];
		this.board.plainWires[eagleLayerNumber].push (circle);
	}

	if (this.cmd.name === "gr_text") {
		var text = this.parseText (this.cmd);
		var eagleLayerNumber = this.eagleLayer (text.layer).number;
		// console.log (this.cmd, text, this.cmd.attrs.effects, eagleLayerNumber);
		if (!this.board.plainTexts[eagleLayerNumber]) this.board.plainTexts[eagleLayerNumber] = [];
		this.board.plainTexts[eagleLayerNumber].push (text);
	}


	if (this.cmd.name === "module") {
		var el = this.parseModule (this.cmd);
		this.board.elements[Object.keys (this.board.elements).length] = el;
		// var eagleLayerNumber = this.eagleLayer (text.layer).number;
		// console.log (this.cmd, text, this.cmd.attrs.effects, eagleLayerNumber);
		// if (!this.board.plainTexts[eagleLayerNumber]) this.board.plainTexts[eagleLayerNumber] = [];
		// this.board.plainTexts[eagleLayerNumber].push (text);
	}

	return;

	if (contextPath === "kicad_pcb>segment") {

	}
	if (contextPath === "kicad_pcb>module") {

	}
	if (contextPath === "kicad_pcb>zone") {

	}
}


//if (typeof process !== "undefined") {
//	var kp = new KicadNewParser ();
//	var fs = require ("fs");
//	kp.parse (fs.readFileSync (process.argv[2]));
//}

return KicadNewParser;

}));
