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

// ----------------- Loading Modal -----------------
function showLoadingModal() {
    document.getElementById('loadingModal').style.display = 'block';
}

function hideLoadingModal() {
    document.getElementById('loadingModal').style.display = 'none';
}

// ----------------- Hamburger Menu ----------------- 
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
const menuClose = document.getElementById('menuClose');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('translate-x-full');
});

menuClose.addEventListener('click', () => {
    menu.classList.add('translate-x-full');
});