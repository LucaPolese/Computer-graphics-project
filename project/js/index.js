"use strict";
let gl = getWebGLContext();
let initialCameraPosition = m4.translation(-0.5, 1, 8); // Initial camera position at Y = 1
let cameraPosition = m4.copy(initialCameraPosition);

function showLoadingModal() {
    document.getElementById('loadingModal').style.display = 'block';
}

function hideLoadingModal() {
    document.getElementById('loadingModal').style.display = 'none';
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percentage + '%';
    progressText.textContent = percentage + '%';
}

async function loadModel(url, index, total) {
    const model = await loadObj(gl, url);
    updateProgressBar(Math.round(((index + 1) / total) * 100));
    return model;
}

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

    const models = await Promise.all(assets.map((url, index) => loadModel(url, index, assets.length)));

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
            u_lightDirection: m4.normalize([0, 1, 0]), // Light pointing downwards from above
            u_view: viewMatrix,
            u_projection: projection,
            u_viewWorldPosition: [-0.5, 1, 8]
        };

        gl.useProgram(meshProgramInfo.program);

        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world = m4.identity();
        u_world = m4.yRotate(u_world, degToRad(90));

        // Render the models
        function renderModel(model) {

            for (const { bufferInfo, material } of model.parts) {
                webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
                webglUtils.setUniforms(meshProgramInfo, { u_world }, material);
                webglUtils.drawBufferInfo(gl, bufferInfo);
            }
        }

        models.forEach(renderModel);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();