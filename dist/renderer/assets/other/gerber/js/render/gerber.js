var RenderGerber = {};

RenderGerber.renderLayer = renderLayer; // function(canvas, g, limits)

RenderGerber.index = {
    BOTTOM   : 1,
    TOP      : 2,
    BOARD    : 0,
    COPPER   : 1,
    SOLDER   : 2,
    PASTE    : 3,
    SILK     : 4,
    OUTLINE  : 5
};

RenderGerber.colors = [];
RenderGerber.colors[RenderGerber.index.BOARD]  = '#0e2c0e';//'#203020';//'#255005';
RenderGerber.colors[RenderGerber.index.COPPER] = '#b87333';//'#c0b030'
RenderGerber.colors[RenderGerber.index.SOLDER] = 'rgba(94, 152, 6, .5)';//'rgba(37, 80, 5, .7)';
RenderGerber.colors[RenderGerber.index.PASTE]  = '#e6e8fa';
RenderGerber.colors[RenderGerber.index.SILK]   = '#ffffff';


export default RenderGerber;

///////////////////////////////////////////////

function renderLayer(canvas, g, limits){
    var ctx = canvas.getContext('2d');

    var color = 'black';
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color, ctx.strokeStyle = color;

    var scaleX = canvas.width / (limits.maxX-limits.minX) * g.scale, scaleY = canvas.height / (limits.maxY-limits.minY) * g.scale;
    var scaleMax = Math.max(scaleX, scaleY);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    var prevX = 0, prevY = 0, minX = limits.minX/g.scale, minY = limits.minY/g.scale;


    _.forEach(g.cmds, function(cmd){
        var mode = (cmd[0] >> 2), op = cmd[0] & 3;
        if(mode == 16) { // Switch layer polarity.
            ctx.globalCompositeOperation = cmd[1] ? 'destination-out' : 'source-over';
        }
        var x = cmd[2]-minX, y = cmd[3]-minY;
        if(mode & 8) { // Outline fill mode.
            mode &= ~8;
            if(op == 0) { // Start/End Outline fill mode.
                if(cmd[1])
                    ctx.beginPath(), ctx.moveTo(prevX, prevY);
                else
                    ctx.fill();
            }
            if(op == 2) // Fill.
                ctx.fill(), ctx.beginPath(), ctx.moveTo(x, y);
            else if(op == 1) { // Draw.
                if(mode == 1 || mode == 5) // Linear Interpolation.
                    ctx.lineTo(x, y);
                else if(mode == 2 || mode == 3) // Single quadrant Circular Interpolation.
                    console.log('(FILL) Failed to single quadrant '+(mode==3?'CCW':'CW'), cmd, s);
                else if(mode == 6 || mode == 7) { // Multi quadrant Circular Interpolation.
                    var ox = cmd[4], oy = cmd[5], cx = prevX+ox, cy = prevY+oy;
                    ctx.arc(cx, cy, Math.sqrt(ox*ox+oy*oy), Math.atan2(-oy, -ox), Math.atan2(y-cy, x-cx), mode == 6);
                } else
                    console.log(mode);
            } else
                console.log(mode, op);
            prevX = x, prevY = y;
        }

        var s = g.shapes[cmd[1]];
        if(!s) {
            console.log(cmd, s);
        }
        if(op != 2) {
            if(op == 3) { // Expose.
                if(s[0] == 'C'){
                    ctx.beginPath();
                    ctx.arc(x, y, s[1]/2, 0, Math.PI*2);
                    ctx.fill();
                }
                else if(s[0] == 'R'){
                    ctx.beginPath();
                    ctx.rect(x-s[1]/2, y-s[2]/2, s[1], s[2]);
                    ctx.fill();
                }
                else if(s[0] == 'O') {
                    ctx.beginPath(), ctx.moveTo(x, y - s[2] / 2);
                    ctx.bezierCurveTo(x + s[1] / 2, y - s[2] / 2, x + s[1] / 2, y + s[2] / 2, x, y + s[2] / 2);
                    ctx.bezierCurveTo(x - s[1] / 2, y + s[2] / 2, x - s[1] / 2, y - s[2] / 2, x, y - s[2] / 2);
                    ctx.fill();
                } else if(s[0] == 'M') { // Aperture Macro.
                    for(var j = 0; j < s[1].length; j++) {
                        var m = s[1][j];
                        if((m[0] == 2 || m[0] == 20) && m[1]) { // Line.
                            ctx.lineWidth = m[2];
                            ctx.lineCap = 'square';
                            ctx.beginPath();
                            ctx.moveTo(x+m[3], y+m[4]), ctx.lineTo(x+m[5], y+m[6]);
                            ctx.stroke();
                        } else if(m[0] == 21 && m[1]) { // Rectangle.
                            ctx.beginPath(), ctx.rect(x+m[4]-m[2]/2, y+m[5]-m[3]/2, m[2], m[3]), ctx.fill();
                        } else if(m[0] == 4 && m[1]) { // Outline.
                            ctx.beginPath();
                            ctx.moveTo(m[3], m[4]);
                            for(var k = 1; k < m[2]; k++)
                                ctx.lineTo(m[3+k*2], m[4+k*2]);
                            ctx.fill();
                        } else if(m[0] == 5 && m[1]) { // Polygon (regular).
                            var nSides = m[2], cx = x+m[3], cy = y+m[4], r = m[5]/2;
                            ctx.beginPath();
                            var step = 2 * Math.PI / nSides, angle = m[6] * Math.PI / 180;
                            ctx.moveTo(cx +  r * Math.cos(angle), cy +  r *  Math.sin(angle));
                            for(var k = 0; k < nSides; k++) {
                                angle += step;
                                ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
                            }
                            ctx.fill();
                        } else {
                            console.log('Failed to macro', m, cmd, s);
                            ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                            ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                            ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                            ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                            ctx.fillStyle = color;
                        }
                    }
                } else {
                    console.log('Failed to expose', cmd, s);
                    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                    ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                    ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                    ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                    ctx.fillStyle = color;
                }
            }
            else if(op == 1) { // Draw.
                if(s[0] == 'C') {
                    if(!s[1]) {
                        prevX = x, prevY = y;
                    }

                    //HACK Copper lines get some extra thickness.
                    if(g.type == RenderGerber.index.COPPER)
                        ctx.lineWidth = Math.ceil(s[1]*scaleMax/3+.01)/scaleMax*3;
                    else
                        ctx.lineWidth = s[1];
                    ctx.lineCap = 'round';
                    if(mode == 1 || mode == 5) { // Linear Interpolation.
                        ctx.beginPath();
                        ctx.moveTo(prevX, prevY), ctx.lineTo(x, y);
                        ctx.stroke();
                    } else if(mode == 2 || mode == 3) { // Single quadrant Circular Interpolation.
                        console.log('Failed to single quadrant '+(mode==3?'CCW':'CW'), cmd, s);
                        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                        ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                        ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                        ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                        ctx.fillStyle = color;
                    } else if(mode == 6 || mode == 7) { // Multi quadrant Circular Interpolation.
                        var ox = cmd[4], oy = cmd[5], cx = prevX+ox, cy = prevY+oy;
                        ctx.beginPath();
                        ctx.arc(cx, cy, Math.sqrt(ox*ox+oy*oy), Math.atan2(-oy, -ox), Math.atan2(y-cy, x-cx), mode == 6);
                        ctx.stroke();
                    } else {
                        console.log('Failed to draw with circle', cmd, s);
                        ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                        ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                        ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                        ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                        ctx.fillStyle = color;
                    }
                } else {
                    console.log('Failed to draw', cmd, s);
                    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                    ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                    ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                    ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                    ctx.fillStyle = color;
                }
            }
            else {
                console.log('Failed to '+mode+' '+type, cmd, s);
                ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                ctx.beginPath(), ctx.arc(x, y, .5, 0, Math.PI*2), ctx.fill();
                ctx.fillStyle = 'rgba(255, 0, 0, .2)';
                ctx.beginPath(), ctx.arc(x, y, 1.5, 0, Math.PI*2), ctx.fill();
                ctx.fillStyle = color;
            }
        }
        prevX = x, prevY = y;
    });

    // Color the canvas.
    ctx.fillStyle = g.type ? RenderGerber.colors[g.type] : 'black';
    ctx.globalCompositeOperation = g.type == RenderGerber.index.SOLDER ? 'source-out' : 'source-in';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
