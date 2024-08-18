// ----------------- Movement Listener -----------------
let keys = {
    w : false,
    a : false,
    s : false,
    d : false,
    r : false,
    ArrowLeft: false,
    ArrowRight: false
}

let moveSpeed = 0.05;
let turnSpeed = degToRad(0.6);

// ----------------- Keyboard Listeners -----------------
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// ----------------- Touch Listeners -----------------
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

// ----------------- Camera Movement -----------------
function updateCameraPosition() {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];

    // Reset camera position if the 'r' key or the corresponding gamepad button is pressed
    if (keys['r'] || (gp && gp.buttons[0].pressed)) {
        m4.copy(initialCameraPosition, cameraPosition); // Reset camera
        return; // Skip further processing this frame
    }

    // Handle Keyboard Input for movement and rotation
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
    if (keys['ArrowLeft']) {
        m4.yRotate(cameraPosition, turnSpeed, cameraPosition); // Yaw left
    }
    if (keys['ArrowRight']) {
        m4.yRotate(cameraPosition, -turnSpeed, cameraPosition); // Yaw right
    }

    // Handle Gamepad Input
    if (gp) {
        // Left stick axes for movement
        const leftStickX = gp.axes[0];
        const leftStickY = gp.axes[1];

        // Gamepad movement
        if (Math.abs(leftStickY) > 0.1) { // Deadzone check
            const forward = [0, 0, leftStickY * moveSpeed];
            m4.translate(cameraPosition, ...forward, cameraPosition);
        }
        if (Math.abs(leftStickX) > 0.1) {
            const strafe = [leftStickX * moveSpeed, 0, 0];
            m4.translate(cameraPosition, ...strafe, cameraPosition);
        }

        // Gamepad rotation (Yaw only)
        const rightStickX = gp.axes[2];
        if (Math.abs(rightStickX) > 0.1) {
            m4.yRotate(cameraPosition, -rightStickX * turnSpeed, cameraPosition); // Yaw left/right
        }
    }
}