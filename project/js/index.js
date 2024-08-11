"use strict";
var gl, canvas;
var shaderProgram;
var cameraPositionMain = m4.identity();

function init(){
    canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl');

    if(!canvas || !gl){
        console.log(`Stato caricamento: \n\tcanvas:\t${canvas} \n\twebgl:\t${gl}`);
        return;
    }  

    shaderProgram = webglUtils.createProgramFromScripts(gl, ["vertex-shader", "fragment-shader"]);
    gl.useProgram(shaderProgram);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

try{
    init();
}catch(e){
    console.log(e);
}