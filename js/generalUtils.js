// ----------------- Utility Functions ----------------- 

/**
 * Convert degrees to radians.
 * @param {number} deg - Angle in degrees.
 * @returns {number} - Angle in radians.
 */
function degToRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees.
 * @param {number} r - Angle in radians.
 * @returns {number} - Angle in degrees.
 */
function radToDeg(r) {
    return r * 180 / Math.PI;
}

// ----------------- WebGL Context ----------------- 

/**
 * Get the WebGL rendering context from a canvas element.
 * @returns {WebGLRenderingContext|null} - The WebGL context or null if the context could not be created.
 */
function getWebGLContext() {
    /** @type {HTMLCanvasElement} */
    let canvas = document.querySelector("canvas"); // Select the first canvas element on the page.
    let gl = canvas.getContext("webgl"); // Try to get the WebGL rendering context.
    if (!gl) {
        return null; // If WebGL context could not be created, return null.
    }
    return gl; // Return the WebGL context.
}

// ----------------- Loading Modal ----------------- 

/**
 * Show the loading modal by making it visible and semi-transparent.
 */
function showLoadingModal() {
    const modal = document.getElementById('loadingModal'); // Get the modal element by ID.
    modal.classList.remove('opacity-0'); // Remove the class that sets opacity to 0 (hidden).
    modal.classList.add('opacity-75'); // Add the class that sets opacity to 75 (semi-transparent).
    modal.style.visibility = 'visible'; // Ensure the modal is visible.
}

/**
 * Hide the loading modal by making it invisible and fully transparent.
 */
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal'); // Get the modal element by ID.
    modal.classList.remove('opacity-75'); // Remove the class that sets opacity to 75 (semi-transparent).
    modal.classList.add('opacity-0'); // Add the class that sets opacity to 0 (hidden).
    setTimeout(() => {
        modal.style.visibility = 'hidden'; // After a short delay, set visibility to hidden to ensure the modal is not clickable.
    }, 300); // Delay matches the CSS transition duration.
}

// ----------------- Hamburger Menu ----------------- 

const menuToggle = document.getElementById('menuToggle'); // Get the menu toggle button by ID.
const menu = document.getElementById('menu'); // Get the menu element by ID.
const menuClose = document.getElementById('menuClose'); // Get the menu close button by ID.

let isInteractingWithMenu = false; // Track whether the user is interacting with the menu (e.g., scrolling).

/**
 * Toggle the visibility of the menu when the menu toggle button is clicked.
 */
menuToggle.addEventListener('click', () => {
    menu.classList.toggle('translate-x-full'); // Toggle the menu's position with the 'translate-x-full' class.
    isInteractingWithMenu = true; // Set the flag to indicate user interaction with the menu.
});

/**
 * Hide the menu when the menu close button is clicked.
 */
menuClose.addEventListener('click', () => {
    menu.classList.add('translate-x-full'); // Add the class to hide the menu.
    isInteractingWithMenu = false; // Reset the interaction flag.
});

// ----------- Drop-down menu for controls ----------- 

/**
 * Toggle the visibility of the controls content when the controls header is clicked.
 */
document.getElementById("controlsHeader").addEventListener("click", function() {
    var controlsContent = document.getElementById("controlsContent"); // Get the controls content element by ID.
    
    // Toggle visibility of the controls content.
    if (controlsContent.classList.contains("hidden")) {
        controlsContent.classList.remove("hidden"); // Remove the 'hidden' class to show the content.
        setTimeout(() => {
            controlsContent.classList.remove("opacity-0"); // Remove the class that sets opacity to 0 (hidden).
            controlsContent.classList.add("opacity-100"); // Add the class that sets opacity to 100 (fully visible).
        }, 20); // Small timeout to allow transition effect.
    } else {
        controlsContent.classList.add("opacity-0"); // Add the class to hide content with fade effect.
        controlsContent.classList.remove("opacity-100"); // Remove the class that sets opacity to 100.
        setTimeout(() => {
            controlsContent.classList.add("hidden"); // After a short delay, add the 'hidden' class to fully hide the content.
        }, 10); // Delay matches the CSS transition duration.
    }
});

// ----------------- Mobile Listeners ----------------- 

/**
 * Add touch event listeners to all buttons to prevent default behavior and handle touch actions.
 */
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchstart', function(e) {
        // Check if the event is cancelable before preventing default.
        if (e.cancelable) {
            e.preventDefault(); // Prevents default behavior like zooming and text selection on touch.
        }
        // Additional logic for handling touch start event can be added here.
    });

    button.addEventListener('touchend', function(e) {
        // Check if the event is cancelable before preventing default.
        if (e.cancelable) {
            e.preventDefault(); // Prevents default behavior on touch end.
        }
        // Additional logic for handling touch end event can be added here.
    });
});
