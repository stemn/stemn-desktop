import webGerberConstants from './constants/webGerberConstants.js';
import ViewEEPCB from './viewee.js';
import initGerberParser from './parse/gerber.js';
//import THR51 from './three.min.js';
import ObjectControls from './ObjectControls.js';
import RenderGerber from './render/gerber.js';

import 'javascript-detect-element-resize'; // addResizeListener && removeResizeListener

export default () => {
  var wG = {};

  // Defined after init
  wG.parser = undefined;
  wG.domParent = undefined;

  wG.constants = {
    ppmm         : 40,  // Pixels per mm.
    maxTexSize   : 4096,
    minTexSize   : 256, // Largest possible texture size.
    pcbFileTypes : ['pcb', 'brd', 'kicad_pcb'],

    geometry     : {
      boardThickness: 1.54
    },
    materials    : {
      board: {shininess: 80, ambient: 0x333333, specular: 0xcccccc, color: 0x255005}
    },
  };

  wG.index = {
    BOTTOM   : 1,
    TOP      : 2,
    BOTH     : 3,

    BOARD    : 0,
    COPPER   : 1,
    SOLDER   : 2,
    PASTE    : 3,
    SILK     : 4,
    OUTLINE  : 5
  };

  wG.isFlipped = false;

  wG.utils = {
    isPcb      : isPcb,
  };

  wG.boards    = {
    bottom     : {},
    top        : {},
    makeBoard  : makeBoard,
    clearBoard : clearBoard
  };

  wG.init        = init;           // function(layers, domParent, globalInstances)
  wG.parse       = parse;
  wG.destroy     = destroy;
  wG.flip        = flip;
  wG.render      = render;
  wG.renderLayer = renderLayer;
  wG.center      = center;


  /////////////////

  function parse(layer){
    var parser;
    if(wG.utils.isPcb(layer.name)){
      parser = new ViewEEPCB();
      wG.parser = parser;
      return parser.findParser(layer.data);
    }
    else{
      parser = new initGerberParser();
      return parser.parse(layer.data, layer.name);
    }
  }

  function flip(flipStatus){
    wG.isFlipped = flipStatus;
    wG.boardControls.object.useQuaternion = true;
    var flipArray = wG.isFlipped ? {x: 0, y: 0, z: 1, w: 0} : {x: 0, y: 0, z: 0, w: 1};
    _.extend(wG.boardControls.object.quaternion, flipArray);
  }

  function reposition(){
    wG.center();
    wG.boardControls.screen.width = window.innerWidth;
    wG.boardControls.screen.height = window.innerHeight;
    wG.boardControls.radius = (window.innerWidth + window.innerHeight) / 4;
  }

  function destroy(){
    window.removeResizeListener(wG.domParent, reposition);
    if(wG.domParent){
      while (wG.domParent.hasChildNodes()) {
        wG.domParent.removeChild(wG.domParent.lastChild);
      }
    }
    // jackson's code from http://stackoverflow.com/questions/21453309/how-can-i-destroy-THR51js-scene
    cancelAnimationFrame(this.id);// Stop the animation
    wG.scene = null;
    wG.projector = null;
    wG.camera = null;
    wG.controls = null;
    wG.destroyed = true;
  }

  function center(){
    if(wG.renderer && wG.camera && wG.boardControls){
      wG.renderer.setSize(wG.domParent.offsetWidth, wG.domParent.offsetHeight);
      wG.camera.aspect = wG.domParent.offsetWidth / wG.domParent.offsetHeight;
      wG.camera.updateProjectionMatrix();
      wG.boardControls.object.useQuaternion = true;
      var flipArray = wG.isFlipped ? {x: 0, y: 0, z: 1, w: 0} : {x: 0, y: 0, z: 0, w: 1};
      _.extend(wG.boardControls.object.quaternion, flipArray)
    }
  }

  function init(layers, domParent, globalInstances) {
    wG.domParent = domParent;
    wG.layers = layers;
    wG.limits = _.reduce(wG.layers, function(bound, layer) {
      return {
        minX : bound.minX < layer.bounds.minX ? bound.minX : layer.bounds.minX,
        minY : bound.minY < layer.bounds.minY ? bound.minY : layer.bounds.minY,
        maxX : bound.maxX > layer.bounds.maxX ? bound.maxX : layer.bounds.maxX,
        maxY : bound.maxY > layer.bounds.maxY ? bound.maxY : layer.bounds.maxY,
      };
    }, {});

    _.forEach(wG.layers, function(layer){
        layer.enabled = true;
    });

    wG.boards.width  = wG.limits.maxX - wG.limits.minX;
    wG.boards.height = wG.limits.maxY - wG.limits.minY;

    var has3D = true;
    try {
        wG.renderer = new THR51.WebGLRenderer({antialias: true});
        //wG.constants.ppmm = 20;
        wG.renderer.sortObjects = false;
    } catch(e) {
        console.error('Got WebGL error, falling back to 2D canvas.');
        has3D = false;
        wG.constants.ppmm = 20;
        wG.renderer = new THR51.CanvasRenderer({antialias: true});
    }

    wG.scene  = new THR51.Scene();
    wG.camera = new THR51.PerspectiveCamera(40);
    wG.camera.up.set(0, 0, -1);
    wG.scene.add(wG.camera);

    // Ambient light.
    var ambientLight = new THR51.AmbientLight(0xcccccc);
    wG.scene.add(ambientLight);

    // Sun light.
    if(has3D) {
        var sunLight = new THR51.SpotLight(0xcccccc, .3);
        sunLight.position.set(0, 150000, 0);
        wG.scene.add(sunLight);
    }

    // Board.
    var Material = has3D ? THR51.MeshPhongMaterial : THR51.MeshBasicMaterial;
    wG.boards.bottom.canvas = wG.boards.makeBoard(wG.boards.width, wG.boards.height);
    wG.boards.top.canvas    = wG.boards.makeBoard(wG.boards.width, wG.boards.height, true);
    wG.boards.bottom.texture = new THR51.Texture(wG.boards.bottom.canvas);
    wG.boards.top.texture    = new THR51.Texture(wG.boards.top.canvas);
    wG.boards.clearBoard(wG.boards.bottom.canvas);
    wG.boards.clearBoard(wG.boards.top.canvas);
    wG.boards.bottom.texture.needsUpdate = true, wG.boards.top.texture.needsUpdate = true;
    var materials = [
        null,
        null,
        new Material({shininess: 80, ambient: 0xaaaaaa, specular: 0xcccccc, map: wG.boards.top.texture}),
        new Material({shininess: 80, ambient: 0xaaaaaa, specular: 0xcccccc, map: wG.boards.bottom.texture}),
        null,
        null
    ];
    if(!has3D){
        materials[2].overdraw = true, materials[3].overdraw = true;
    }
    wG.board = new THR51.Mesh(new THR51.CubeGeometry(wG.boards.width, wG.constants.geometry.boardThickness, wG.boards.height, has3D ? 1 : Math.ceil(wG.boards.width / 3), 1, has3D ? 1 : Math.ceil(wG.boards.height / 3), materials, {px: 0, nx: 0, pz: 0, nz: 0}), new THR51.MeshFaceMaterial());
    wG.board.position.y = -100;

    if(has3D){
        wG.scene.add(wG.board);
    }

    // Add the sides.
    var boardSides = new THR51.CubeGeometry(wG.boards.width, wG.constants.geometry.boardThickness, wG.boards.height, 1, 1, 1, undefined, {py: 0, ny: 0});
    var boardMaterial = new Material(wG.constants.materials.board);
    //boardSides.computeVertexNormals();
    boardSides = new THR51.Mesh(boardSides, boardMaterial);
    wG.board.add(boardSides);

    // Create all the holes.
    drillHoles(boardMaterial);

    if(!has3D){
        wG.scene.add(wG.board);
    }

    wG.camera.lookAt(wG.board.position);
    wG.boardControls        = new ObjectControls(wG.board, wG.renderer.domElement, globalInstances);
    wG.boardControls.camera = wG.camera;
    wG.boardControls.eye    = wG.camera.position.clone().subSelf(wG.board.position);

    // Resize handler.
    window.addResizeListener(wG.domParent, reposition);
    setTimeout(reposition, 1);

    // Add element to DOM
    domParent.appendChild(wG.renderer.domElement);

    // Sort by type, but after listing them.
    wG.layers.sort(function(a, b) {
        return (a.type || 10) - (b.type || 10);
    });

    wG.repaint = 0;
    // Renders the scene (and repaints all the textures that need repainting.
    wG.render();
  }

  function drillHoles(boardMaterial){
    var holeMaterial = boardMaterial.clone();
    holeMaterial.side = THR51.BackSide;
    if(wG.layers[0].isGerber){
      _.forEach(wG.layers, function(layer){
        if(layer.type == wG.index.BOARD){
          _.forEach(layer.cmds, function(cmd){
            var r    = layer.scale*layer.shapes[cmd[1]][1]/2;
            var hole = new THR51.CylinderGeometry(r, r, wG.constants.geometry.boardThickness, 32, 0, true);
            //hole.computeVertexNormals();
            hole = new THR51.Mesh(hole, holeMaterial);
            hole.position.x = (cmd[2]*layer.scale-wG.limits.minX)-wG.boards.width/2;
            hole.position.z = wG.boards.height/2-(cmd[3]*layer.scale-wG.limits.minY);
            wG.board.add(hole);
          });
        }
      });
    }
    else {
      // Else this is a pcb file - we drill the plainHoles
      _.forEach(wG.layers[0].plainHoles, function(cmd){
        var r    = cmd.drill/2;
        var hole = new THR51.CylinderGeometry(r, r, wG.constants.geometry.boardThickness, 32, 0, true);
        //hole.computeVertexNormals();
        hole = new THR51.Mesh(hole, holeMaterial);
        hole.position.x = cmd.x - wG.boards.width/2;
        hole.position.z = wG.boards.height/2- cmd.y;
        wG.board.add(hole);
      });
    }
  }

  function render() {
    // jackson's hack to stop rendering after destroying canvas. PROBABLY BAD AS MEMORY IS LEFT AROUND
    if (wG.destroyed) return;
    requestAnimationFrame(render);
    if(wG.repaint !== null) {
      if(wG.callbacks && wG.callbacks.renderStart){
        wG.callbacks.renderStart()
      }
      if(wG.repaint === 0){
        wG.boards.clearBoard(wG.boards.bottom.canvas);
        wG.boards.clearBoard(wG.boards.top.canvas);
        wG.repaint++;
      }
      else {
        // Skip any disabled layers.
        while(wG.repaint <= wG.layers.length && !wG.layers[wG.repaint-1].enabled)
          wG.repaint++;

        if(wG.repaint <= wG.layers.length) { // wG.repaint a layer.
          if(wG.layers[wG.repaint-1].side == wG.index.TOP){
            wG.renderLayer(wG.boards.top.canvas, wG.layers[wG.repaint-1], wG.limits);
          }
          else if(wG.layers[wG.repaint-1].side == wG.index.BOTTOM){
            wG.renderLayer(wG.boards.bottom.canvas, wG.layers[wG.repaint-1], wG.limits);
          }
          else if(wG.layers[wG.repaint-1].side == wG.index.BOTH){
            wG.renderLayer(wG.boards.top.canvas, wG.layers[wG.repaint-1], wG.limits);
            wG.renderLayer(wG.boards.bottom.canvas, wG.layers[wG.repaint-1], wG.limits);
          }
        }

        // Are we finished repainting?
        if(wG.repaint > wG.layers.length){
          wG.repaint = null;
          wG.boards.bottom.texture.needsUpdate = true;
          wG.boards.top.texture.needsUpdate = true;
          if(wG.callbacks && wG.callbacks.renderComplete){
            wG.callbacks.renderComplete()
          }
        }
        else
          wG.repaint++;
      }
    }
    wG.boardControls.update();
    wG.renderer.render(wG.scene, wG.camera);
  };

  function renderLayer(canvas, board, limits) {
    if(!board.canvas) {
      board.canvas = document.createElement('canvas');
      board.canvas.width = canvas.width;
      board.canvas.height = canvas.height;
      if(board.isGerber){
        RenderGerber.renderLayer(board.canvas, board, limits);
      }
      else{
        board.render(canvas);
      }
    }
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = board.type ? 'source-over' : 'destination-out';
    if(canvas.inverted){
      ctx.setTransform(1, 0, 0,-1, 0, canvas.height);
    }
    else{
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    ctx.drawImage(board.canvas, 0, 0);
  };


  // Creates a 2D canvas that is a board side texture, for the given width and height.
  function makeBoard(w, h, inverted) {
    var canvas = document.createElement('canvas');
    //canvas.width = w*wG.constants.ppmm, canvas.height = h*wG.constants.ppmm;
    /*var maxSize = Math.max(w*wG.constants.ppmm, h*wG.constants.ppmm) >> 1, size = 1;
    while(size < maxSize && size < wG.constants.maxTexSize)
        size <<= 1;*/
    canvas.width = texSize(w*wG.constants.ppmm);
    canvas.height = texSize(h*wG.constants.ppmm);

    // Don't allow mipmapping for stretched textures.
    var stretch = canvas.width/canvas.height;
    if(stretch > 4)
      canvas.width--;
    else if(stretch < .25)
      canvas.height--;
//        canvas.invertedY = invertedY;
  canvas.inverted = inverted;

    // Debugging: adds canvas to the page.
    /*canvas.className = 'layer';
    document.body.appendChild(canvas);*/
    return canvas;
  }

  // Clears a 2D canvas that is a board side texture.
  function clearBoard(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = webGerberConstants.colors.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  // Returns true if the filetype is that of a pcb/brd
  function isPcb(fileName){
    var nameSplit = fileName.split('.');
    return wG.constants.pcbFileTypes.indexOf(nameSplit[nameSplit.length-1]) != -1
  }



  // Internal Functions ------------------------------------------------------------------

  // Finds the closest power of two to the given size of a texture (needed for mipmapping).
  function texSize(x) {
    x = Math.min(Math.max(x, wG.constants.minTexSize), wG.constants.maxTexSize);
    var r = 1;
    while(r < x)
      r <<= 1;
    return r;
  }

  return wG
}
