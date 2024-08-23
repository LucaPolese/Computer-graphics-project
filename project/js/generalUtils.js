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
// Show the loading modal
function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    modal.classList.remove('opacity-0'); // Ensure the modal is visible
    modal.classList.add('opacity-75'); // Set opacity to make it semi-transparent
    modal.style.visibility = 'visible'; // Ensure the modal is visible
}

// Hide the loading modal
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    modal.classList.remove('opacity-75'); // Remove semi-transparent effect
    modal.classList.add('opacity-0'); // Set opacity to 0 to hide the modal
    setTimeout(() => {
        modal.style.visibility = 'hidden'; // Ensure the modal is not clickable
    }, 300); // Match this with your CSS transition duration
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

// ----------- Drop-down menu for controls -----------
document.getElementById("controlsHeader").addEventListener("click", function() {
    var controlsContent = document.getElementById("controlsContent");
    var controlsMessage = document.getElementById("controlsMessage");

    // Toggle visibility of the controls content
    if (controlsContent.classList.contains("hidden")) {
        controlsContent.classList.remove("hidden");
        setTimeout(() => {
            controlsContent.classList.remove("opacity-0");
            controlsContent.classList.add("opacity-100");
        }, 20); // Small timeout to allow the transition to apply
    } else {
        controlsContent.classList.add("opacity-0");
        controlsContent.classList.remove("opacity-100");
        setTimeout(() => {
            controlsContent.classList.add("hidden");
        }, 10); // Matches the duration of the transition
    }
    
    // Hide the message when the content is visible
    controlsMessage.classList.toggle("hidden");
});
