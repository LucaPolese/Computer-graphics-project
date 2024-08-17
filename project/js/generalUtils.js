function degToRad(deg){
    return deg * Math.PI / 180;
}

function radToDeg(r) {
    return r * 180 / Math.PI;
}

function getWebGLContext() {
    /** @type {HTMLCanvasElement} */
    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        return null;
    }
    return gl;
}
    