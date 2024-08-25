"use strict";
let gl = getWebGLContext();

// Initialize the camera position 
let initialCameraPosition = m4.translation(0, 1, 7); 
let cameraPosition = m4.copy(initialCameraPosition);

// Initialize the light direction with default values
let lightDirection = m4.normalize([0, 1, 0]);

// Function to update the light direction based on slider values
function updateLightDirection() {
    const x = parseInt(document.getElementById('lightX').value);
    const y = parseInt(document.getElementById('lightY').value);
    const z = parseInt(document.getElementById('lightZ').value);
    lightDirection = m4.normalize([x, y, z]);

    // Update the span elements with the current slider values
    document.getElementById('lightXValue').textContent = x;
    document.getElementById('lightYValue').textContent = y;
    document.getElementById('lightZValue').textContent = z;
}

// Add event listeners to the sliders to update the light direction
document.getElementById('lightX').addEventListener('input', updateLightDirection);
document.getElementById('lightY').addEventListener('input', updateLightDirection);
document.getElementById('lightZ').addEventListener('input', updateLightDirection);

// Main WebGL rendering loop
async function main() {
    if (!gl) {
        return;
    }

    showLoadingModal();

    setUpDefaultTexture(gl);

    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader, fragmentShader]);

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

    hideLoadingModal();

    function render(time) {
        updateCameraPosition();

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const zNear = 0.1;
        const zFar = 2000;
        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // The view matrix is the inverse of the camera matrix
        const viewMatrix = m4.inverse(cameraPosition);

        const sharedUniforms = {
            u_lightDirection: lightDirection,
            u_view: viewMatrix,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
            u_normalMappingEnabled: normalMappingEnabled ? 1 : 0,
            u_specularMappingEnabled: reflectionsEnabled ? 1 : 0,
            diffuse: [1.0, 1.0, 1.0],
            ambient: [1.0, 1.0, 1.0],
            emissive: [1.0, 1.0, 1.0],
            specular: [1.0, 1.0, 1.0],
        };

        gl.useProgram(meshProgramInfo.program);

        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world = m4.identity();
        u_world = m4.yRotate(u_world, degToRad(90));

        // Render the models
        function renderModel(model) {
            for (const { bufferInfo, material } of model.parts) {
                webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
                webglUtils.setUniforms(meshProgramInfo, { 
                    u_world,
                }, material);
                webglUtils.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Assume models are loaded and ready to render
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

        requestAnimationFrame(render); // Continue the render loop
    }

    requestAnimationFrame(render); // Start the render loop
}

main();