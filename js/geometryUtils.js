// ----------------- Movement Listener -----------------

// Object to track the state of keys for movement controls.
// 'true' means the key is currently pressed, 'false' means it is not.
let keys = {
    w : false,            // Move forward
    a : false,            // Move left
    s : false,            // Move backward
    d : false,            // Move right
    r : false,            // Reset camera position
    ArrowLeft: false,     // Rotate left
    ArrowRight: false     // Rotate right
};

// Speed settings for different types of movement.
let moveSpeed = 0.05;               // Speed of movement (forward, backward, strafing)
let turnSpeed = degToRad(0.6);      // Speed of rotation (turning left/right)
let zoomSpeed = 1.2;                // Speed of zooming in/out (when using the mouse wheel)

// Variables to manage mouse interaction for camera rotation.
let isMouseDown = false;            // Tracks if the mouse button is held down
let lastMouseX = 0;                 // Last known X position of the mouse during movement
let isInteractingWithSlider = false; // Tracks if the user is interacting with a slider (e.g., range input)

// ----------------- Keyboard Listeners -----------------

// Event listener for keydown events to update the `keys` object when a key is pressed.
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

// Event listener for keyup events to update the `keys` object when a key is released.
window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// ----------------- Touch Listeners -----------------

// Function to add touch event listeners to buttons for mobile/touchscreen devices.
// The `key` parameter corresponds to a key/button in the `keys` object.
function addTouchListeners(key) {
    const button = document.getElementById(key); // Get the button element by ID
    if (button) {
        // When the touch starts, set the corresponding key in the `keys` object to true.
        button.addEventListener('touchstart', () => {
            keys[key] = true;
        });
        // When the touch ends, set the corresponding key in the `keys` object to false.
        button.addEventListener('touchend', () => {
            keys[key] = false;
        });
    }
}

// Apply touch listeners to each key/button in the `keys` object.
for (const key in keys) {
    addTouchListeners(key);
}

// ----------------- Mouse Listeners -----------------

// Event listener for mouse down events to start camera rotation.
window.addEventListener('mousedown', (event) => {
    // Check if the mouse is interacting with a slider (e.g., range input).
    if (event.target.tagName === 'INPUT' && event.target.type === 'range') {
        isInteractingWithSlider = true; // Flag to avoid rotating the camera when adjusting a slider
    } else if (!isInteractingWithMenu) { // Assuming `isInteractingWithMenu` is defined elsewhere
        isMouseDown = true;            // Indicate that the mouse is being held down
        lastMouseX = event.clientX;    // Record the initial X position of the mouse
    }
});

// Event listener for mouse up events to stop camera rotation.
window.addEventListener('mouseup', () => {
    if (!isInteractingWithMenu){
        isMouseDown = false;           // Indicate that the mouse button is released
        isInteractingWithSlider = false; // Reset the slider interaction flag
    }
});

// Event listener for mouse move events to rotate the camera.
window.addEventListener('mousemove', (event) => {
    // Rotate the camera only if the mouse is down and not interacting with a slider.
    if (isMouseDown && !isInteractingWithSlider) {
        const deltaX = event.clientX - lastMouseX; // Calculate the change in X position
        lastMouseX = event.clientX;                // Update the last known X position

        // Calculate the amount of rotation based on the mouse movement and turn speed.
        const rotationAmount = deltaX * turnSpeed * 0.1;
        m4.yRotate(cameraPosition, -rotationAmount, cameraPosition); // Apply rotation to the camera
    }
});

// ----------------- Wheel Zooming Listener -----------------

// Event listener for mouse wheel events to handle zooming.
window.addEventListener('wheel', (event) => {
    // Zoom only if not interacting with a slider or menu.
    if (!isInteractingWithMenu && !isInteractingWithSlider) {
        const zoomDirection = event.deltaY > 0 ? 1 : -1; // Determine zoom in/out based on wheel direction
        const zoomAmount = zoomSpeed * zoomDirection;   // Calculate the zoom amount

        // Define the forward direction vector for zooming.
        const forward = [0, 0, zoomAmount];

        // Temporary variable to store the new camera position after zooming.
        const newPosition = [...cameraPosition];
        m4.translate(newPosition, ...forward, newPosition); // Translate the camera along the forward vector

        // Check if the new position is within the road boundaries before applying it.
        if (isWithinRoadBoundaries(newPosition)) {
            m4.copy(newPosition, cameraPosition); // Update the camera position
        }
    }
});

// ----------------- Camera Movement -----------------

// Object to store the boundaries of the road, initialized with extreme values.
let roadBoundaries = {
    minX: Infinity,   // Minimum X boundary
    minZ: Infinity,   // Minimum Z boundary
    maxX: -Infinity,  // Maximum X boundary
    maxZ: -Infinity   // Maximum Z boundary
};

// Function to calculate the boundaries of the road based on OBJ file data.
// The OBJ file data is expected to contain vertex positions.
async function calculateObjBoundaries(objData) {
    // Split the OBJ file data by lines.
    const lines = objData.split('\n');

    // Loop through each line of the OBJ file.
    lines.forEach(line => {
        line = line.trim(); // Remove any extra spaces

        // Check if the line defines a vertex position (starts with 'v ').
        if (line.startsWith('v ')) {
            const [_, xStr, __ , zStr] = line.split(/\s+/); // Extract X and Z coordinates
            const x = parseFloat(xStr); // Convert X coordinate to a number
            const z = parseFloat(zStr); // Convert Z coordinate to a number

            // Update the road boundaries based on the extracted coordinates.
            if (x < roadBoundaries.minX) roadBoundaries.minX = x;
            if (x > roadBoundaries.maxX) roadBoundaries.maxX = x;
            if (z < roadBoundaries.minZ) roadBoundaries.minZ = z;
            if (z > roadBoundaries.maxZ) roadBoundaries.maxZ = z;
        }
    });
}

// Function to check if the camera position is within the defined road boundaries.
// Returns true if within boundaries, false otherwise.
function isWithinRoadBoundaries(position) {
    let userPosition = {
        x : position[12], // X coordinate of the camera position
        y : position[13], // Y coordinate of the camera position
        z : position[14]  // Z coordinate of the camera position
    }
    return (
        userPosition.x >= roadBoundaries.minX+1 && userPosition.x <= roadBoundaries.maxX-1 &&
        userPosition.z >= roadBoundaries.minZ && userPosition.z <= roadBoundaries.maxZ
    );
}

// Function to update the camera position based on user input (keyboard, mouse, gamepad).
function updateCameraPosition() {
    const gamepads = navigator.getGamepads(); // Retrieve connected gamepads
    const gp = gamepads[0]; // Assume the first gamepad is used

    // Temporary variable to store the proposed new camera position.
    let newPosition = [...cameraPosition];

    // Reset the camera position if the 'r' key or corresponding gamepad button is pressed.
    if (keys['r'] || (gp && gp.buttons[0].pressed)) {
        m4.copy(initialCameraPosition, cameraPosition); // Reset camera to initial position
    
        // Reset the light direction sliders and display elements to their initial values.
        document.getElementById('lightX').value = 0;
        document.getElementById('lightY').value = 1;
        document.getElementById('lightZ').value = 0;
        document.getElementById('lightXValue').textContent = 0;
        document.getElementById('lightYValue').textContent = 1;
        document.getElementById('lightZValue').textContent = 0;
        
        updateLightDirection(); // Function to apply the updated light direction
        return; // Skip further processing this frame
    }

    // Handle keyboard input for movement and rotation.
    if (keys['w']) { // Move forward
        const forward = [0, 0, -moveSpeed];
        m4.translate(newPosition, ...forward, newPosition);
    }
    if (keys['s']) { // Move backward
        const backward = [0, 0, moveSpeed];
        m4.translate(newPosition, ...backward, newPosition);
    }
    if (keys['a']) { // Move left (strafe)
        const left = [-moveSpeed, 0, 0];
        m4.translate(newPosition, ...left, newPosition);
    }
    if (keys['d']) { // Move right (strafe)
        const right = [moveSpeed, 0, 0];
        m4.translate(newPosition, ...right, newPosition);
    }
    if (keys['ArrowLeft']) { // Rotate left (yaw)
        m4.yRotate(newPosition, turnSpeed, newPosition);
    }
    if (keys['ArrowRight']) { // Rotate right (yaw)
        m4.yRotate(newPosition, -turnSpeed, newPosition);
    }

    // Handle gamepad input for movement and rotation.
    if (gp) {
        // Left stick controls for movement.
        const leftStickX = gp.axes[0]; // Horizontal axis (left/right)
        const leftStickY = gp.axes[1]; // Vertical axis (forward/backward)

        // Move forward/backward based on the vertical axis of the left stick.
        if (Math.abs(leftStickY) > 0.1) { // Deadzone check to prevent accidental movement
            const forward = [0, 0, leftStickY * moveSpeed];
            m4.translate(newPosition, ...forward, newPosition);
        }
        // Strafe left/right based on the horizontal axis of the left stick.
        if (Math.abs(leftStickX) > 0.1) {
            const strafe = [leftStickX * moveSpeed, 0, 0];
            m4.translate(newPosition, ...strafe, newPosition);
        }

        // Right stick controls for rotation (yaw).
        const rightStickX = gp.axes[2]; // Horizontal axis (left/right yaw)
        if (Math.abs(rightStickX) > 0.1) {
            m4.yRotate(newPosition, -rightStickX * turnSpeed, newPosition); // Apply yaw rotation
        }
    }

    // Ensure the new camera position is within the road boundaries before applying it.
    if (isWithinRoadBoundaries(newPosition)) {
        m4.copy(newPosition, cameraPosition); // Update the camera position
    }
}
