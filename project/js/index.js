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

    const assets = [
        './resources/assets/911/911.obj',
        './resources/assets/banner/Banner.obj',
        './resources/assets/bus/Bus.obj',
        './resources/assets/firehydrant/FireHydrant.obj',
        './resources/assets/gasstation/GasStation.obj',
        './resources/assets/motel/Motel.obj',
        './resources/assets/parkinglot/ParkingLot.obj',
        './resources/assets/road/Road.obj',
        './resources/assets/sign/Sign.obj',
        './resources/assets/transporter/Transporter.obj',
        './resources/assets/tree/Trees.obj'
    ];

    // Simulate loading all models
    const models = await Promise.all(assets.map(async url => {
        const model = await loadObj(gl, url);
        return model;
    }));

    hideLoadingModal();

    function render() {
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
                    u_color: [material.diffuse[0], material.diffuse[1], material.diffuse[2], material.opacity]
                }, material);
                webglUtils.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Assume models are loaded and ready to render
        models.forEach(renderModel);

        requestAnimationFrame(render); // Continue the render loop
    }

    requestAnimationFrame(render); // Start the render loop
}

main();