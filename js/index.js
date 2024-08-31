"use strict";

// Get the WebGL rendering context from the canvas element
let gl = getWebGLContext();

// Initialize the camera position with a default translation
let initialCameraPosition = m4.translation(0, 1, 7); 
let cameraPosition = m4.copy(initialCameraPosition); // Copy the initial position to the current camera position

// Initialize the light direction with default values pointing upwards along the y-axis
let lightDirection = m4.normalize([0, 1, 0]);

// Function to update the light direction based on slider values from the UI
function updateLightDirection() {
    // Get the slider values for x, y, z components of the light direction
    const x = parseInt(document.getElementById('lightX').value);
    const y = parseInt(document.getElementById('lightY').value);
    const z = parseInt(document.getElementById('lightZ').value);

    // Normalize the light direction vector with the new slider values
    lightDirection = m4.normalize([x, y, z]);

    // Update the corresponding span elements to display the current slider values
    document.getElementById('lightXValue').textContent = x;
    document.getElementById('lightYValue').textContent = y;
    document.getElementById('lightZValue').textContent = z;
}

// Add event listeners to the sliders to update the light direction whenever they are adjusted
document.getElementById('lightX').addEventListener('input', updateLightDirection);
document.getElementById('lightY').addEventListener('input', updateLightDirection);
document.getElementById('lightZ').addEventListener('input', updateLightDirection);

// Main WebGL rendering loop
async function main() {
    if (!gl) {
        return; // Exit if WebGL is not supported or the context is unavailable
    }

    showLoadingModal(); // Show a loading modal while assets are being loaded

    setUpDefaultTexture(gl); // Set up default textures (e.g., white and normal textures)

    // Create a WebGL program from the vertex and fragment shaders
    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader, fragmentShader]);

    // Load the 3D models asynchronously from their respective OBJ files
    const obj_911 = './resources/assets/911/911.obj';
    var model_911 = await loadObj(gl, obj_911);

    const obj_banner = './resources/assets/banner/Banner.obj';
    var model_banner = await loadObj(gl, obj_banner);

    const obj_firehydrant = './resources/assets/firehydrant/FireHydrant.obj';
    var model_firehydrant = await loadObj(gl, obj_firehydrant);

    const obj_gasstation = './resources/assets/gasstation/GasStation.obj';
    var model_gasstation = await loadObj(gl, obj_gasstation);

    const obj_motel = './resources/assets/motel/Motel.obj';
    var model_motel = await loadObj(gl, obj_motel);

    const obj_parkinglot = './resources/assets/parkinglot/ParkingLot.obj';
    var model_parkinglot = await loadObj(gl, obj_parkinglot);

    const obj_road = './resources/assets/road/Road.obj';
    var model_road = await loadObj(gl, obj_road);

    const obj_sign = './resources/assets/sign/Sign.obj';
    var model_sign = await loadObj(gl, obj_sign);

    const obj_transporter = './resources/assets/transporter/Transporter.obj';
    var model_transporter = await loadObj(gl, obj_transporter);

    const obj_tree = './resources/assets/tree/Trees.obj';
    var model_tree = await loadObj(gl, obj_tree);

    const obj_bus = './resources/assets/bus/Bus.obj';
    var model_bus = await loadObj(gl, obj_bus);

    hideLoadingModal(); // Hide the loading modal after all models have been loaded

    // Function to render the scene, called recursively by requestAnimationFrame
    function render(time) {
        updateCameraPosition(); // Update the camera position if necessary

        webglUtils.resizeCanvasToDisplaySize(gl.canvas); // Resize the canvas to match the display size
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set the viewport to cover the entire canvas
        gl.enable(gl.DEPTH_TEST); // Enable depth testing for correct 3D rendering

        // Define perspective projection parameters
        const zNear = 0.1;
        const zFar = 2000;
        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // Calculate the view matrix as the inverse of the camera position matrix
        const viewMatrix = m4.inverse(cameraPosition);

        // Set shared uniforms for all models
        const sharedUniforms = {
            u_lightDirection: lightDirection, // Set the light direction
            u_view: viewMatrix, // Set the view matrix
            u_projection: projection, // Set the projection matrix
            u_viewWorldPosition: cameraPosition, // Pass the camera position
            u_normalMappingEnabled: normalMappingEnabled ? 1 : 0, // Enable or disable normal mapping
            u_specularMappingEnabled: reflectionsEnabled ? 1 : 0, // Enable or disable specular mapping
            diffuse: [1.0, 1.0, 1.0], // Default diffuse color
            ambient: [1.0, 1.0, 1.0], // Default ambient color
            emissive: [1.0, 1.0, 1.0], // Default emissive color
            specular: [1.0, 1.0, 1.0], // Default specular color
        };

        // Use the WebGL program for rendering the mesh
        gl.useProgram(meshProgramInfo.program);

        // Apply the shared uniforms to the program
        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        // Define the world matrix, starting with an identity matrix
        let u_world = m4.identity();
        u_world = m4.yRotate(u_world, degToRad(90)); // Rotate the world matrix 90 degrees around the y-axis

        // Function to render a given 3D model
        function renderModel(model) {
            for (const { bufferInfo, material } of model.parts) {
                // Set up the WebGL buffers and attributes for the current part of the model
                webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
                // Set the world matrix and material-specific uniforms
                webglUtils.setUniforms(meshProgramInfo, { 
                    u_world,
                }, material);
                // Draw the current part of the model
                webglUtils.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Render all the loaded models in the scene
        renderModel(model_911);
        renderModel(model_banner);
        renderModel(model_firehydrant);
        renderModel(model_gasstation);
        renderModel(model_motel);
        renderModel(model_parkinglot);
        renderModel(model_road);
        renderModel(model_sign);
        renderModel(model_transporter);
        renderModel(model_tree);
        renderModel(model_bus);

        // Request the next frame to continue the render loop
        requestAnimationFrame(render);
    }

    // Start the render loop
    requestAnimationFrame(render);
}

// Call the main function to start the WebGL rendering process
main();