function degToRad(deg){
    return deg * Math.PI / 180;
}

function radToDeg(r) {
    return r * 180 / Math.PI;
}

function getWebGLContext(canvasSelector) {
    /** @type {HTMLCanvasElement} */
    let canvas = document.querySelector(canvasSelector);
    let gl = canvas.getContext("webgl");
    if (!gl) {
        return null;
    }
    return gl;
}
    