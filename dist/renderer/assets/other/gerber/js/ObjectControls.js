/**
 * @author Eberhard Graether / http://egraether.com/
 * @note Edited by eddyb to provide object-centered controls instead of camera-centered.
 */

export default ObjectControls;

function ObjectControls ( object, domElement, globalInstances) {

    THR51.EventTarget.call( this );

    var _this = this,
    STATE = { NONE : -1, ROTATE : 0, ZOOM : 1, PAN : 2 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;

    this.screen = { width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0 };
    this.radius = ( this.screen.width + this.screen.height ) / 4;

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    this.mouseState = STATE.NONE;

    // internals

    var lastPosition = new THR51.Vector3();

    var _keyPressed = false,

    //_eye = new THR51.Vector3(),

    _rotateStart = new THR51.Vector3(),
    _rotateEnd = new THR51.Vector3(),

    _zoomStart = new THR51.Vector2(),
    _zoomEnd = new THR51.Vector2(),

    _panStart = new THR51.Vector2(),
    _panEnd = new THR51.Vector2();


    // methods

    this.handleEvent = function ( event ) {
        if ( typeof this[ event.type ] == 'function' ) {
            this[ event.type ]( event );
        }

    };

    this.getMouseOnScreen = function ( clientX, clientY ) {

        return new THR51.Vector2(
            ( clientX - _this.screen.offsetLeft ) / _this.radius * 0.5,
            ( clientY - _this.screen.offsetTop ) / _this.radius * 0.5
        );

    };

    this.getMouseProjectionOnBall = function ( clientX, clientY ) {

        var mouseOnBall = new THR51.Vector3(
            ( clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft ) / _this.radius,
            ( _this.screen.height * 0.5 + _this.screen.offsetTop - clientY ) / _this.radius,
            0.0
        );

        var length = mouseOnBall.length();

        if ( length > 1.0 ) {

            mouseOnBall.normalize();

        } else {

            mouseOnBall.z = Math.sqrt( 1.0 - length * length );

        }

        var projection = _this.camera.up.clone().setLength( mouseOnBall.y );
        projection.addSelf( _this.camera.up.clone().crossSelf( _this.eye ).setLength( mouseOnBall.x ) );
        projection.addSelf( _this.eye.clone().setLength( mouseOnBall.z ) );

        return projection;//(new THR51.Quaternion).setFromEuler(_this.object.rotation.clone()/*.negate()*/).multiplyVector3(projection);

    };

    this.rotateCamera = function () {
        var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );
        if ( angle ) {
            var axis = ( new THR51.Vector3() ).cross( _rotateStart, _rotateEnd ).normalize();
            angle *= _this.rotateSpeed;

            if ( _this.staticMoving )
                _rotateStart = _rotateEnd;
            else {
                _rotateStart.multiplyScalar(1 - _this.dynamicDampingFactor).addSelf(_rotateEnd.clone().multiplyScalar(_this.dynamicDampingFactor));
                //var quaternion = new THR51.Quaternion();
                //quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
                //quaternion.multiplyVector3( _rotateStart );
            }

            _this.object.useQuaternion = true;
            _this.object.quaternion.clone().inverse().multiplyVector3(axis);
            _this.object.quaternion.multiplySelf((new THR51.Quaternion).setFromAxisAngle(axis, angle));

            // Apply to all global instances
            _.forEach(globalInstances, function(instance){
                instance.boardControls.object.useQuaternion = true;
                instance.boardControls.object.quaternion = _this.object.quaternion;
            })

        }

    };


    this.zoomCamera = function () {
        var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;
        if ( factor !== 1.0 && factor > 0.0 ) {
            _.forEach(globalInstances, function(instance){
                instance.boardControls.object.position.y *= factor;
            })
            if ( _this.staticMoving ){
                _zoomStart = _zoomEnd;
            }
            else{
                _zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;
            }
        }

    };

    this.panCamera = function () {
        var mouseChange = _panEnd.clone().subSelf( _panStart );
        if ( mouseChange.x || mouseChange.y ) {
            mouseChange.multiplyScalar( Math.abs(_this.object.position.y) * _this.panSpeed );
            var pan = _this.eye.clone().crossSelf( _this.camera.up ).setLength( mouseChange.x );
            pan.addSelf( _this.camera.up.clone().setLength( mouseChange.y ) );
            var panAbs = _this.object.position.subSelf( pan );

            // Apply to all global instances
            _.forEach(globalInstances, function(instance){
                instance.boardControls.object.position = panAbs;
            })

            if ( _this.staticMoving ){
                _panStart = _panEnd;
            }
            else{
                _panStart.addSelf( mouseChange.sub( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );
            }
        }
    };

    this.update = function () {
        if ( !_this.noRotate )
            _this.rotateCamera();
        if ( !_this.noZoom )
            _this.zoomCamera();
        if ( !_this.noPan )
            _this.panCamera();
    };

    // listeners

    function keydown( event ) {

        if ( ! _this.enabled ) return;

        if ( _this.mouseState !== STATE.NONE ) {

            return;

        } else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

            _this.mouseState = STATE.ROTATE;

        } else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

            _this.mouseState = STATE.ZOOM;

        } else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

            _this.mouseState = STATE.PAN;

        }

        if ( _this.mouseState !== STATE.NONE ) {

            _keyPressed = true;

        }

    };

    function keyup( event ) {

        if ( ! _this.enabled ) return;

        if ( _this.mouseState !== STATE.NONE ) {

            _this.mouseState = STATE.NONE;

        }

    };

    function mousedown( event ) {
        if ( ! _this.enabled ) return;


        event.preventDefault();
        event.stopPropagation();

        if ( _this.mouseState === STATE.NONE ) {

            // Globalise mouse state
            _.forEach(globalInstances, function(instance){
                instance.boardControls.mouseState = event.button
            })

            _this.mouseState = event.button;

            if ( _this.mouseState === STATE.ROTATE && !_this.noRotate ) {

                _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

            } else if ( _this.mouseState === STATE.ZOOM && !_this.noZoom ) {

                _zoomStart = _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

            } else if ( !_this.noPan ) {

                _panStart = _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

            }

        }

    };

    function mousemove( event ) {

        if ( ! _this.enabled ) return;

        if ( _keyPressed ) {

            _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );
            _zoomStart = _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );
            _panStart = _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

            _keyPressed = false;

        }

        if ( _this.mouseState === STATE.NONE ) {

            return;

        } else if ( _this.mouseState === STATE.ROTATE && !_this.noRotate ) {

            _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

        } else if ( _this.mouseState === STATE.ZOOM && !_this.noZoom ) {

            _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

        } else if ( _this.mouseState === STATE.PAN && !_this.noPan ) {

            _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

        }

    };

    function mouseup( event ) {
        if ( ! _this.enabled ) return;

        // Globalise mouse state
        _.forEach(globalInstances, function(instance){
            instance.boardControls.mouseState = STATE.NONE
        })

        event.preventDefault();
        event.stopPropagation();
        _this.mouseState = STATE.NONE;

    };

    function mousewheel(event) {
        var amount = 5; // parameter
        // get wheel direction
        var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) : event.detail);
        d = amount * ((d > 0) ? -1 : 1);
        var scrollPosition = _this.object.position.y + d < -1 ? _this.object.position.y + d : -1;
        _.forEach(globalInstances, function(instance){
            instance.boardControls.object.position.y = scrollPosition;

        })
    }

    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousemove', mousemove, false );
    this.domElement.addEventListener( 'mousedown', mousedown, false );
    this.domElement.addEventListener( 'mouseup', mouseup, false );
    this.domElement.addEventListener('DOMMouseScroll', mousewheel, false);
    this.domElement.addEventListener('mousewheel', mousewheel, false);

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );
};
