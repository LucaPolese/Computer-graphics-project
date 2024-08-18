// ----------------- Movement Listener -----------------
let keys = {
    w : false,
    a : false,
    s : false,
    d : false,
    r : false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
}

let moveSpeed = 0.1;
let turnSpeed = degToRad(0.5);

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Function to add touch event listeners to buttons
function addTouchListeners(key) {
    const button = document.getElementById(key);
    if (button) {
        button.addEventListener('touchstart', () => {
            keys[key] = true;
        });
        button.addEventListener('touchend', () => {
            keys[key] = false;
        });
    }
}

// Apply touch listeners to each key/button based on the keys object
for (const key in keys) {
    addTouchListeners(key);
}

function updateCameraPosition() {
    if (keys['w']) {
        const forward = [0, 0, -moveSpeed];
        m4.translate(cameraPosition, ...forward, cameraPosition);
    }
    if (keys['s']) {
        const backward = [0, 0, moveSpeed];
        m4.translate(cameraPosition, ...backward, cameraPosition);
    }
    if (keys['a']) {
        const left = [-moveSpeed, 0, 0];
        m4.translate(cameraPosition, ...left, cameraPosition);
    }
    if (keys['d']) {
        const right = [moveSpeed, 0, 0];
        m4.translate(cameraPosition, ...right, cameraPosition);
    }
    if (keys['ArrowUp']) {
        m4.xRotate(cameraPosition, turnSpeed, cameraPosition); // Pitch up
    }
    if (keys['ArrowDown']) {
        m4.xRotate(cameraPosition, -turnSpeed, cameraPosition); // Pitch down
    }
    if (keys['ArrowLeft']) {
        m4.yRotate(cameraPosition, turnSpeed, cameraPosition); // Yaw left
    }
    if (keys['ArrowRight']) {
        m4.yRotate(cameraPosition, -turnSpeed, cameraPosition); // Yaw right
    }
    if (keys['r']){
        m4.copy(initialCameraPosition, cameraPosition); // Reset camera
    }
}
