(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.GEDAParser = factory();
	}
}(this, function () {

	// documentation: http://wiki.geda-project.org/geda:pcb-quick_reference

	function gEDAParser (board) {
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

	gEDAParser.supports = function (text) {
		if (text.match (/FileVersion\[/im)) return true;
	}

	gEDAParser.name = "geda pcb";


	var layerMaps = {
		"top": "Top",
		"bottom": "Bottom",
		"front": "Top",
		"back": "Bottom",
		"solder": "Top",
		"component": "Bottom",
		//	"Inner1.Cu": "Inner1",
		//	"Inner2.Cu": "Inner2",
		"B.Adhes": "bGlue",
		"F.Adhes": "tGlue",
		"B.Paste": "bCream",
		"F.Paste": "tCream",
		"silk": "tPlace",
		// "F.SilkS": "tNames",
		"B.Mask": "bStop",
		"F.Mask": "tStop",
		"Dwgs.User": "tValues",
		//(41 Cmts.User user)
		//(42 Eco1.User user)
		//(43 Eco2.User user)
		"outline": "Dimension"
	};

	// We need to add layer assignment.
	// By default we need to render only layers explicitly marked as visible
	// or assigned to production layers:
	// Top Silkscreen, Top Soldermask, Top Copper,
	// Drill/Outline, Internal layers,
	// Bottom Copper, Bottom Soldermask, Bottom Silkscreen

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

	gEDAParser.prototype.eagleLayer = function (layerName) {
		// eagle draw will replace layer info accordingly
		if (layerName === "*.Cu") layerName = "Front";
		if (layerName === "*.Mask") layerName = "F.Mask";
		if (!layerMaps[layerName]) return;
		return eagleLayers [layerMaps[layerName]];
	}

	gEDAParser.prototype.parse = function (text) {

		text = text.toString();

		this.layerGroups = {top: [], bottom: [], other: []};

		text.split(/[\r\n]+/g).forEach (this.parseChunk, this);

		this.cmdCb = function (cmd, context) {

		}
	}

	/************************** Helper functions ****************************/

	// http://pcb.geda-project.org/pcb-cvs/pcb.html#Object-Flags
	function parseFlags (flagString, context) {
		var flags = {};

		if (!flagString.match (/0x\d+/i)) {
			flagString.split (',').forEach (function (flag) {flags[flag] = true});
			return flags;
		}
		var flagInt = parseInt (flagString);
		if (flagInt & 0x0001) flags.pin = true; // If set, this object is a pin. This flag is for internal use only.
		if (flagInt & 0x0002) flags.via = true; // Likewise, for vias.
		if (flagInt & 0x0004) flags.found = true; // If set, this object has been found by FindConnection().
		if (flagInt & 0x0008 && (context === 'pin' || context === 'via'))
			flags.hole = true; // For pins and vias, this flag means that the pin or via is a hole without a copper annulus.
		if (flagInt & 0x0008 && context === 'pad')
			flags.nopaste = true; // For pads, set to prevent a solderpaste stencil opening for the pad. Primarily used for pads used as fiducials.
		if (flagInt & 0x0010 && context === 'line')
			flags.nopaste = true; // If set for a line, indicates that this line is a rat line instead of a copper trace.
		if (flagInt & 0x0010 && (context === 'pin' || context === 'pad'))
			flags.pininpoly = true; // For pins and pads, this flag is used internally to indicate that the pin or pad overlaps a polygon on some layer.
		if (flagInt & 0x0010 && context === 'poly')
			flags.clearpoly = true; // For polygons, this flag means that pins and vias will normally clear these polygons (thus, thermals are required for electrical connection). When clear, polygons will solidly connect to pins and vias.
		if (flagInt & 0x0010 && context === 'element')
			flags.hidename = true; // For elements, when set the name of the element is hidden.
		if (flagInt & 0x0020 && context === 'element')
			flags.showname = true; // For elements, when set the names of pins are shown.
		if (flagInt & 0x0020 && (context === 'line' || context === 'arc'))
			flags.clearline = true; // For lines and arcs, the line/arc will clear polygons instead of connecting to them.
		if (flagInt & 0x0020 && context === 'poly')
			flags.fullpoly = true; // For polygons, the full polygon is drawn (i.e. all parts instead of only the biggest one).
		if (flagInt & 0x0040)
			flags.selected = true; // Set when the object is selected.
		if (flagInt & 0x0080 && (context === 'element' || context === 'pad'))
			flags.onsolder = true; // For elements and pads, indicates that they are on the solder/top side.
		if (flagInt & 0x0080 && (context === 'line' || context === 'via'))
			flags.auto = true; // For lines and vias, indicates that these were created by the autorouter.
		if (flagInt & 0x0100 && (context === 'pin' || context === 'pad'))
			flags.square = true; // For pins and pads, indicates a square (vs round) pin/pad.
		if (flagInt & 0x0200 && context === 'line')
			flags.rubberend = true; // For lines, used internally for rubber band moves.
		if (flagInt & 0x0200 && (context === 'pin' || context === 'pad' || context === 'via'))
			flags.warn = true; // For pins, vias, and pads, set to indicate a warning.
		/**/if (flagInt & 0x0400 && (context === 'pin' || context === 'via'))
			flags.usetherm = true; // Obsolete, indicates that pins/vias should be drawn with thermal fingers.
		/**/if (flagInt & 0x0400 && context === 'line')
			flags.silk = true; // Obsolete, old files used this to indicate lines drawn on silk.
		if (flagInt & 0x0800 && (context === 'pin' || context === 'via'))
			flags.octagon = true; // For pins and pads, indicates a square (vs round) pin/pad.
		if (flagInt & 0x1000)
			flags.drc = true; // Set for objects that fail DRC.
		if (flagInt & 0x2000)
			flags.lock = true; // Set for locked objects.
		if (flagInt & 0x4000 && (context === 'pin' || context === 'pad'))
			flags.edge2 = true; // For pads, indicates that the second point is closer to the edge. For pins, indicates that the pin is closer to a horizontal edge and thus pinout text should be vertical.
		if (flagInt & 0x8000)
			flags.marker = true; // Marker used internally to avoid revisiting an object.
		if (flagInt & 0x10000)
			flags.connected = true; // If set, this object has been as physically connected by FindConnection().

		return flags;
	}

	/*
		A special note about units: Older versions of pcb used mils (1/1000 inch) as the base unit;
		a value of 500 in the file meant half an inch. Newer versions uses a "high resolution" syntax,
		where the base unit is 1/100 of a mil (0.000010 inch); a value of 500 in the file means 5 mils.
		As a general rule, the variants of each entry listed below which use square brackets
		are the high resolution formats and use the 1/100 mil units, and the ones with parentheses
		are the older variants and use 1 mil units. Note that when multiple variants are listed,
		the most recent (and most preferred) format is the first listed.
	*/
	function parseNumeric (val, old) {
		var m;
		if (m = val.match (/(.*)mm$/)) {
			return parseFloat (m[1]);
		} else if ((m = val.match (/(.*)mil$/)) || old) {
			return parseFloat (val)*25.4/1000;
		} else {
			return parseFloat (val)*25.4/100000;
		}

	}

	function parseTokens (string) {
		var stringCtx = null;
		var token = null;
		var tokens = [];
		// console.log (string);
		for (var i = 0; i < string.length; i++) {
			var c = string[i];
			if (c === '"' || c === "'") {
				if (stringCtx === c) {
					stringCtx = null;
					// empty string
					if (token === null) token = "";
				} else if (!stringCtx) {
					stringCtx = c;
				} else {
					token = token === null ? c : token + c;
				}
			} else if (c === " " && stringCtx === null) {
				tokens.push (token);
				token = null
			} else {
				token = token === null ? c : token + c;
			}
		}

		if (token !== null) tokens.push (token);

		// console.log (tokens);

		return tokens;
	}

	function parseAttrsXYThicknessNameFlags (cmd) {
		var pos = {
			x: parseNumeric (cmd.args.shift (), !cmd.square),
			y: parseNumeric (cmd.args.shift (), !cmd.square),
		};

		var thickness = parseNumeric (cmd.args.shift (), !cmd.square);

		var flags = parseFlags (cmd.args.pop ());
		var name  = cmd.args.pop ();

		cmd.attrs = {
			x: pos.x,
			y: pos.y,
			thickness: thickness,
			name: name,
			flags: flags
		};
	}


	gEDAParser.prototype.parseChunk = function (chunk, idx) {
		if (chunk.charAt (0) === '#' || chunk.trim().length === 0)
			return;

		var polyPointRx  = /\[([^\]]+)\s+([^\]]+)\]/;
		var polyPointRxG = new RegExp(polyPointRx.source, "g");

		var m = chunk.match (/^\s*(\w+)(?:\s*\[(.*)\]|\((.*)\))$/);
		if (m) {
			// pass previous command
			if (this.context.length === 0) {
				this.cmd && this.cmdDone (this.cmd);
			}

			this.cmd = {name: m[1], args: parseTokens (m[2] || m[3]), children: [], square: m[2] ? true : false};

			if (this.context.length !== 0) {
				this.context[this.context.length-1].children.push (this.cmd);
			}

		} else if (chunk.match (/^\s*\($/)) {
			this.args = false;

			if (!this.cmd) console.log ('empty cmd at ' + idx);
			this.context.push(this.cmd);
		} else if (chunk.match (/^\s*Hole\s*\($/) && this.cmd.name === "Polygon") {

			this.cmd._hole = [];

		} else if ((m = chunk.match (polyPointRxG)) && this.cmd.name === "Polygon") {

			var pointsType = this.cmd._hole ? '_hole' : 'vertexes';

			this.cmd[pointsType] = this.cmd[pointsType] || [];

			m.forEach (function (pointCoords) {
				var point = pointCoords.match (polyPointRx);
				this.cmd[pointsType].push ({
					x: point[1],
					y: point[2]
				});
			}, this);


		} else if (chunk.match (/^\s*\)$/)) {

			// special case for polygon points
			if (this.cmd.name === "Polygon" && this.cmd._hole) {
				this.cmd.hole = this.cmd._hole;
				delete this.cmd._hole;
				return;
			}

			if (this.context.length === 0) {
				// TODO: this.parseCompleted ();
				return;
			}

			this.cmd = this.context[this.context.length-1];

			this.context.pop();

			// this.cmdDone (this.cmd);


		} else {
			console.error ("cannot parse line %d", idx, chunk);
		}
	}



	/************************** Entity parsing methods ****************************/

	gEDAParser.prototype.parseLine = function (cmd) {
		// ElementLine [X1 Y1 X2 Y2 Thickness]
		// ElementLine (X1 Y1 X2 Y2 Thickness)

		// Line [X1 Y1 X2 Y2 Thickness Clearance SFlags]
		// Line (X1 Y1 X2 Y2 Thickness Clearance NFlags)
		// Line (X1 Y1 X2 Y2 Thickness NFlags)

		var pos = {
			x1: parseNumeric (cmd.args.shift (), !cmd.square),
			y1: parseNumeric (cmd.args.shift (), !cmd.square),
			x2: parseNumeric (cmd.args.shift (), !cmd.square),
			y2: parseNumeric (cmd.args.shift (), !cmd.square),
		};

		var thickness = parseNumeric (cmd.args.shift (), !cmd.square);

		if (cmd.name === 'Line') {
			var flags = parseFlags (cmd.args.pop ());
			if (cmd.args.length) {
				var clearance = parseNumeric (cmd.args.shift (), !cmd.square);
			}
		}

		var line = {
			x1: pos.x1,
			y1: pos.y1,
			x2: pos.x2,
			y2: pos.y2,
			width: thickness,
			// layer: cmd.attrs.layer[0]
		};

		return line;

	}

	gEDAParser.prototype.parseArc = function (cmd) {
		// Arc [X Y Width Height Thickness Clearance StartAngle DeltaAngle SFlags]
		// Arc (X Y Width Height Thickness Clearance StartAngle DeltaAngle NFlags)
		// Arc (X Y Width Height Thickness StartAngle DeltaAngle NFlags)
		//
		// ElementArc [X Y Width Height StartAngle DeltaAngle Thickness]
		// ElementArc (X Y Width Height StartAngle DeltaAngle Thickness)

		var pos = {
			x: parseNumeric (cmd.args.shift (), !cmd.square),
			y: parseNumeric (cmd.args.shift (), !cmd.square),
			width:  parseNumeric (cmd.args.shift (), !cmd.square),
			height: parseNumeric (cmd.args.shift (), !cmd.square),
		};

		if (cmd.name === 'ElementArc') {
			var thickness = parseNumeric (cmd.args.pop (), !cmd.square);
		} else if (cmd.name === 'Arc') {
			var flags = parseFlags (cmd.args.pop ());
			var thickness = parseNumeric (cmd.args.shift (), !cmd.square);
		}

		var deltaAngle = cmd.args.pop ();
		var startAngle = cmd.args.pop ();

		if (cmd.name === 'Arc' && cmd.args.length) {
			var clearance = parseNumeric (cmd.args.shift (), !cmd.square);
		}

		var arc = {
			x: pos.x,
			y: pos.y,
			width: thickness,
			// layer: line.layer,
			curve: deltaAngle - startAngle,
			angle: deltaAngle / 180.0 * Math.PI,
			//angle: Math.PI * (this.start + this.sweep) / 180.0,
			radius: pos.width, // Math.sqrt (dx * dx + dy * dy),
			// TODO: why to add Math.PI?
			start: startAngle / 180.0 * Math.PI,
		};

		return arc;
	}


	gEDAParser.prototype.parseText = function (cmd, angle) {
		// Text [X Y Direction Scale "String" SFlags]
		// Text (X Y Direction Scale "String" NFlags)
		// Text (X Y Direction "String" NFlags)

		var direction = cmd.args[2];

		// TODO: refactor
		parseAttrsXYThicknessNameFlags (cmd);

		delete cmd.attrs.thickness;

		var content = cmd.attrs.name;
		delete cmd.attrs.name;

		var text = {
			x: cmd.attrs.x,
			y: cmd.attrs.y,
			font: "vector",
			size: 1,
			rot: "R" + (({"0": 0, "1": 270, "2": 90, "3": 180})[direction]),
			_mirror: cmd.attrs.flags.onsolder,
			// layer: cmd.attrs.layer[0],
			content: content,
		};

		// text.content = text.content.replace (/\\n/g, "\n");
		if (cmd.args.indexOf ("hide") > -1)
			text.display = "off";

		return text;
	}

	gEDAParser.prototype.parseVia = function (cmd) {

		// Via [X Y Thickness Clearance Mask Drill "Name" SFlags]
		// Via (X Y Thickness Clearance Mask Drill "Name" NFlags)
		// Via (X Y Thickness Clearance Drill "Name" NFlags)
		// Via (X Y Thickness Drill "Name" NFlags)
		// Via (X Y Thickness "Name" NFlags)

		// coordinates of center, relative to the element's mark

		parseAttrsXYThicknessNameFlags (cmd);

		if (cmd.args.length) var drill     = parseNumeric (cmd.args.pop (), !cmd.square);
		if (cmd.args.length) var clearance = parseNumeric (cmd.args.shift (), !cmd.square);
		if (cmd.args.length) var mask      = parseNumeric (cmd.args.shift (), !cmd.square);

		var shape = cmd.attrs.flags.octagon ? "octagon" : "circle";

		var via = {
			x: cmd.attrs.x,
			y: cmd.attrs.y,
			drill: drill,
			shape: shape,
			diameter: cmd.attrs.thickness,
			layers: this.eagleLayer ('top').number + '-' + this.eagleLayer ('bottom').number
		};

		if (cmd.attrs.flags.hole) console.log (via);

		return via;
	}

	// http://pcb.geda-project.org/pcb-cvs/pcb.html#Pin-syntax
	gEDAParser.prototype.parsePad = function (cmd) {

		//Pin [rX rY Thickness Clearance Mask Drill "Name" "Number" SFlags]
		//Pin (rX rY Thickness Clearance Mask Drill "Name" "Number" NFlags)
		//Pin (aX aY Thickness Drill "Name" "Number" NFlags)
		//Pin (aX aY Thickness Drill "Name" NFlags)
		//Pin (aX aY Thickness "Name" NFlags)


		// coordinates of center, relative to the element's mark
		parseAttrsXYThicknessNameFlags (cmd);

		if (cmd.args.length === 1) {
			var drill = parseNumeric (cmd.args.pop (), !cmd.square);
		}

		var name = cmd.attrs.name;

		if (cmd.args.length) {
			var number = name;
			var name = cmd.args.pop ();

			var drill = parseNumeric (cmd.args.pop (), !cmd.square);
		}

		if (cmd.args.length) {
			var clearance = parseNumeric (cmd.args.shift (), !cmd.square);
			var mask      = parseNumeric (cmd.args.shift (), !cmd.square);
		} else {
			// TODO
			var absoluteCoords = true;
		}

		var shape = "circle";

		shape = cmd.attrs.flags.square  ? "square"  : shape;
		shape = cmd.attrs.flags.octagon ? "octagon" : shape;

		return {
			x: cmd.attrs.x,
			y: cmd.attrs.y,
			name: name,
			// type: type,
			shape: shape,
			// layers: cmd.attrs.layers,
			// net: net,
			// drill can be ['<drill>'], or ['<shape=oval?>', '<drill>', '<drill-length>']
			drill: drill,
			diameter: cmd.attrs.thickness,
			// drillLength: cmd.attrs.drill ? parseFloat(cmd.attrs.drill[2]) : null,
		}
	}


	// http://pcb.geda-project.org/pcb-cvs/pcb.html#Pad-syntax
	gEDAParser.prototype.parseSmd = function (cmd) {

		//Pad [rX1 rY1 rX2 rY2 Thickness Clearance Mask "Name" "Number" SFlags]
		//Pad (rX1 rY1 rX2 rY2 Thickness Clearance Mask "Name" "Number" NFlags)
		//Pad (aX1 aY1 aX2 aY2 Thickness "Name" "Number" NFlags)
		//Pad (aX1 aY1 aX2 aY2 Thickness "Name" NFlags)

		var pos = {
			x1: parseNumeric (cmd.args.shift (), !cmd.square),
			y1: parseNumeric (cmd.args.shift (), !cmd.square),
			x2: parseNumeric (cmd.args.shift (), !cmd.square),
			y2: parseNumeric (cmd.args.shift (), !cmd.square),
		};

		var flags = parseFlags (cmd.args.pop ());
		var name  = cmd.args.pop ();

		var thickness = parseNumeric (cmd.args.shift (), !cmd.square);

		if (cmd.args.length) {
			var number = name;
			var name = cmd.args.pop ();
		}

		if (cmd.args.length) {
			var clearance = parseNumeric (cmd.args.shift (), !cmd.square);
			var mask      = parseNumeric (cmd.args.shift (), !cmd.square);
		} else {
			// TODO
			var absoluteCoords = true;
		}

		var shape = "square";

		// TODO: ?
		// To make a square or round pad, specify the same coordinate twice.
		if (pos.x1 === pos.x2 && pos.y1 === pos.y2) {
			shape = flags.square ? "square" : "circle";
		}

		return {
			x1: pos.x1 - thickness/2,
			y1: pos.y1 - thickness/2,
			x2: pos.x2 + thickness/2,
			y2: pos.y2 + thickness/2,
			//rot: rot,
			rot: "R0", // those seems already rotated
			name: name,
			//type: type,
			roundness: flags.square ? 0 : 100,
			//layers: cmd.attrs.layers,
			//net: net
		}
	}


	gEDAParser.prototype.parseElement = function (cmd) {

		// http://pcb.geda-project.org/pcb-cvs/pcb.html#Element-syntax
		// Element [element_flags, description, pcb_name, value, mark_x, mark_y, text_x, text_y, text_direction, text_scale, text_flags]

		//Element [SFlags "Desc" "Name" "Value" MX MY TX TY TDir TScale TSFlags] (
		//Element (NFlags "Desc" "Name" "Value" MX MY TX TY TDir TScale TNFlags) (
		//Element (NFlags "Desc" "Name" "Value" TX TY TDir TScale TNFlags) (
		//Element (NFlags "Desc" "Name" TX TY TDir TScale TNFlags) (
		//Element ("Desc" "Name" TX TY TDir TScale TNFlags) (

		// last element is always TextFlags

		var textFlags = parseFlags (cmd.args.pop ());
		var textScale = cmd.args.pop ();
		var textDir   = cmd.args.pop ();

		var textPos = {
			y: parseNumeric (cmd.args.pop (), !cmd.square),
			x: parseNumeric (cmd.args.pop (), !cmd.square)
		};

		if (cmd.args.length > 2) {
			var flags = parseFlags (cmd.args.shift());
		}

		var desc = cmd.args.shift();
		var name = cmd.args.shift();

		if (cmd.args.length > 0) {
			var value = cmd.args.shift();
		}

		if (cmd.args.length > 0) {
			var markPos = {
				y: parseNumeric (cmd.args.pop (), !cmd.square),
				x: parseNumeric (cmd.args.pop (), !cmd.square)
			};
		}

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
			'x'         : markPos.x,
			'y'         : markPos.y,
			name        : name,
			value       : value,
			'pkg'       : pkg,
			rot         : "R0",
			// mirror      : flags.onsolder,
			//		'matrix'    : elemMatrix,
			//		'mirror'    : elemRot.indexOf('M') == 0,
			//		'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
			'smashed': true,
			'absText': false,
			'attributes': {}, // TODO: add text nodes to the attributes
			'padSignals': {},			//to be filled later,
			'metadata': {}
		};

		pkg.description = desc;

		//var rotate = parseFloat (cmd.attrs.at[2]) || 0;
		//el.rot = "R" + (-rotate); // WHY?

		// text x: cmd.attrs[6], y: cmd.attrs[7]

		cmd.children.forEach (function (child) {
			if (child.name === 'Attribute') {
				el.metadata[child.args[0]] = child.args[1];
			} else if (child.name === 'Pad') {
				var smd = this.parseSmd (child);

				// smd layer is not defined now. we need to add it
				smd.layer = this.eagleLayer (flags.onsolder ? 'component' : 'solder').number;

				pkg.smds.push (smd);

			} else if (child.name === 'Pin') {
				var pad = this.parsePad (child);
				pkg.pads.push (pad);

			} else if (child.name === 'Text') {
				var text = this.parseText (child);
				text.layer = this.eagleLayer ('silk').number;
				pkg.texts.push (text);

			} else if (child.name === 'ElementLine') {
				var line = this.parseLine (child);
				line.layer = this.eagleLayer ('silk').number;
				pkg.wires.push (line);
			} else if (child.name === 'ElementArc') {
				var arc = this.parseArc (child);
				arc.layer = this.eagleLayer ('silk').number;
				pkg.wires.push (arc);
			} else {
				console.warn ("Element's child %s not supported yet", child.name, child);
			}
		}, this);

		el.matrix = this.board.matrixForRot (el.rot);

		var bbox = this.board.calcBBox (pkg.wires);
		pkg.bbox = bbox;

		return el;

		// TODO: add name and value and render it

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

	}


	gEDAParser.prototype.cmdDone = function () {
		var contextPath = this.context.map (function (cmd) {return cmd.name}).join (">");
		// console.log (contextPath, this.cmd);

		// layer groups
		if (this.cmd.name === "Groups") {

			var groups = this.cmd.args[0].split (':');
			groups.forEach (function (group) {

				var layers = group.split (',');

				if (layers.indexOf ('c') >= 0) {
					this.layerGroups.bottom = layers;
				} else if (layers.indexOf ('s') >= 0) {
					this.layerGroups.top = layers;
				} else {
					this.layerGroups.other = this.layerGroups.other.concat (layers);
				}
			}, this);
		}

		// layers
		if (this.cmd.name === "Layer") {

			var layerId   = parseInt (this.cmd.args[0]);
			var layerName = this.cmd.args[1];

			var isTopLayer    = layerName === 'solder'    || layerName === 'top';
			var isBottomLayer = layerName === 'component' || layerName === 'bottom';

			var isSignalLayer = false;

			if (this.layerGroups.top.indexOf ("" + layerId) >= 0) {
				console.log ('layer', layerName, '#'+layerId, 'belongs to the top group');
				isSignalLayer = true;
			} else if (this.layerGroups.bottom.indexOf ("" + layerId) >= 0) {
				console.log ('layer', layerName, '#'+layerId, 'belongs to the bottom group');
				isSignalLayer = true;
			} else {
				console.log ('layer', layerName, '#'+layerId, 'belongs to the other group');
			}

			var eagleLayer = this.eagleLayer (layerName.toLowerCase());

			if (!eagleLayer) {
				console.log ('<<<<<<<<<<<<<<<<< Layer %d %s is skipped >>>>>>>>>>>>>>>>>>>>>>>', layerId, layerName);
				return;
			}

			// TODO: make a parser interface for this
			this.board.eagleLayersByName[eagleLayer.name] = eagleLayer;

			this.cmd.children.forEach (function (child) {

				if (child.name === '') {

//				} else if (child.name === 'Attribute') {
//					el.metadata[child.args[0]] = child.args[1];
//				} else if (child.name === 'Pad') {
//					var pad = this.parsePad (child);
//					pkg.pads.push (pad);
//				} else if (child.name === 'Pin') {
//					var pin = this.parsePin (child);
//					// pkg.pads.push (pad); // WTF?
//
				} else if (child.name === 'Line') {
					var line = this.parseLine (child);

					// var netNum = this.cmd.attrs.net;
					// var netName = this.netByNumber[netNum].name;
					// net name is not stored in file for signal wires
					var netName = "undefined";
					// console.log (this.cmd, line, netName);

					if (!this.board.signalItems[netName]) this.board.signalItems[netName] = {};
					var signalLayerItems = this.board.signalItems[netName];


					if (isSignalLayer) {
						if (!signalLayerItems[eagleLayer.number])
							signalLayerItems[eagleLayer.number] = {wires: [], vias: []};
						signalLayerItems[eagleLayer.number].wires.push (line);
					} else {
						if (!this.board.plainWires[eagleLayer.number])
							this.board.plainWires[eagleLayer.number] = [];
						this.board.plainWires[eagleLayer.number].push (line);
					}
				} else if (child.name === "Text") {
					var text = this.parseText (child);
					text.layer = eagleLayer.number;

					if (!this.board.plainTexts[eagleLayer.number]) this.board.plainTexts[eagleLayer.number] = [];
					this.board.plainTexts[eagleLayer.number].push (text);
				} else {
					console.warn ('!!!!!!!!!!!!!!!! UNPROCESSED !!!!!!!!!!!!!!', child);
				}

			}, this);

			return;

			console.log (this.cmd);

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
		if (this.cmd.name === "Line") {
			console.log (this.cmd);
			var line = this.parseLine (this.cmd);

			var eagleLayerNumber = this.eagleLayer (line.layer).number;
			if (!this.board.plainWires[eagleLayerNumber]) this.board.plainWires[eagleLayerNumber] = [];
			this.board.plainWires[eagleLayerNumber].push (line);

			// var eagleLayerNumber = this.eagleLayer (text.layer).number;
			// console.log (this.cmd, text, this.cmd.attrs.effects, eagleLayerNumber);
			// if (!this.board.plainTexts[eagleLayerNumber]) this.board.plainTexts[eagleLayerNumber] = [];
			// this.board.plainTexts[eagleLayerNumber].push (text);
		}
		if (this.cmd.name === "gr_line" || this.cmd.name === "gr_arc") {
			var line = this.parseLine (this.cmd);
			// console.log (this.cmd, line);
			var eagleLayerNumber = this.eagleLayer (line.layer).number;
			if (!this.board.plainWires[eagleLayerNumber]) this.board.plainWires[eagleLayerNumber] = [];
			this.board.plainWires[eagleLayerNumber].push (line);
		}

		if (this.cmd.name === "Via") {
			var via = this.parseVia (this.cmd);

			// net name is not stored in file for signal wires
			var netName = "undefined";
			// console.log (this.cmd, line, netName);

			if (!this.board.signalItems[netName]) this.board.signalItems[netName] = {};
			var signalLayerItems = this.board.signalItems[netName];

			if (!signalLayerItems[via.layers])
				signalLayerItems[via.layers] = {wires: [], vias: []};
			signalLayerItems[via.layers].vias.push (via);

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

		// console.log (this.cmd);

		if (this.cmd.name === "Element") {
			var el = this.parseElement (this.cmd);
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


	if (typeof process !== "undefined") {
		var gp = new gEDAParser ({matrixForRot: function () {}, calcBBox: function () {}});
		var fs = require ("fs");
		gp.parse (fs.readFileSync (process.argv[2]));
	}

	return gEDAParser;

}));
