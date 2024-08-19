// ----------------- Movement Listener -----------------
let keys = {
    w : false,
    a : false,
    s : false,
    d : false,
    r : false,
    ArrowLeft: false,
    ArrowRight: false
};

let moveSpeed = 0.05;
let turnSpeed = degToRad(0.6);
let zoomSpeed = 1.2; // Adjust this value to change zoom speed

let isMouseDown = false;
let lastMouseX = 0;
let isInteractingWithSlider = false; // Track slider interaction

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

// ----------------- Mouse Listeners -----------------
window.addEventListener('mousedown', (event) => {
    // Check if the click is on a slider
    if (event.target.tagName === 'INPUT' && event.target.type === 'range') {
        isInteractingWithSlider = true;
    } else {
        isMouseDown = true;
        lastMouseX = event.clientX;
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
    isInteractingWithSlider = false;
});

window.addEventListener('mousemove', (event) => {
    // Only rotate the camera if the mouse is down and not interacting with a slider
    if (isMouseDown && !isInteractingWithSlider) {
        const deltaX = event.clientX - lastMouseX;
        lastMouseX = event.clientX;

        // Adjust the turnSpeed based on mouse movement
        const rotationAmount = deltaX * turnSpeed * 0.1;
        m4.yRotate(cameraPosition, -rotationAmount, cameraPosition);
    }
});

// ----------------- Wheel Zooming Listener -----------------
window.addEventListener('wheel', (event) => {
    // Only zoom if not interacting with a slider
    if (!isInteractingWithSlider) {
        const zoomDirection = event.deltaY > 0 ? 1 : -1;
        const zoomAmount = zoomSpeed * zoomDirection;

        // Calculate the forward direction
        const forward = [0, 0, zoomAmount];

        // Translate the camera position along the forward direction
        m4.translate(cameraPosition, ...forward, cameraPosition);
    }
});

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