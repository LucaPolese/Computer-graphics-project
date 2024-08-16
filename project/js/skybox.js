"use strict";

function main() {

    let gl = getWebGLContext("#canvas");
    if (!gl) { 
        return;
    }

    // Initialize GLSL program
    let program = webglUtils.createProgramFromScripts(gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);

    // Locate where vertex data is required.
    let positionLocation = gl.getAttribLocation(program, "a_position");

    // Locate uniforms
    let skyboxLocation = gl.getUniformLocation(program, "u_skybox");
    let viewDirectionProjectionInverseLocation =
        gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");

    // Create a buffer for position data
    let positionBuffer = gl.createBuffer();
    // Bind the buffer to ARRAY_BUFFER (similar to ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Load positions into the buffer
    setGeometry(gl);

    // Create a texture
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: 'resources/skybox/px.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: 'resources/skybox/nx.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: 'resources/skybox/py.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: 'resources/skybox/ny.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: 'resources/skybox/pz.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: 'resources/skybox/nz.png',
        },
    ];

    faceInfos.forEach((faceInfo) => {
        const { target, url } = faceInfo;

        // Upload the canvas to the respective cubemap face
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1024;
        const height = 1024;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // Configure each face to be immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Load an image asynchronously
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function () {
            // Copy the loaded image to the texture
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    let fieldOfViewRadians = degToRad(60);

    requestAnimationFrame(drawScene);

    // Render the scene
    function drawScene() {

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Specify how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the program (pair of shaders)
        gl.useProgram(program);

        // Enable the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Specify how to pull data out of the positionBuffer (ARRAY_BUFFER)
        let size = 2;          // 2 components per iteration
        let type = gl.FLOAT;   // data is 32bit floats
        let normalize = false; // do not normalize the data
        let stride = 0;        // move forward size * sizeof(type) each iteration
        let offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        // Set the camera position to circle 2 units from origin, looking at the origin
        let cameraPosition = cameraPositionMain
        let target = [0, 0, 0];
        let up = [0, 1, 0];
        // Compute the camera's matrix using lookAt
        let cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Derive a view matrix from the camera matrix
        let viewMatrix = m4.inverse(cameraMatrix);

        // Remove the translation component from the view matrix as we only care about direction
        viewMatrix[12] = 0;
        viewMatrix[13] = 0;
        viewMatrix[14] = 0;

        let viewDirectionProjectionMatrix =
            m4.multiply(projectionMatrix, viewMatrix);
        let viewDirectionProjectionInverseMatrix =
            m4.inverse(viewDirectionProjectionMatrix);

        // Set the uniform variables
        gl.uniformMatrix4fv(
            viewDirectionProjectionInverseLocation, false,
            viewDirectionProjectionInverseMatrix);

        // Instruct the shader to use texture unit 0 for u_skybox
        gl.uniform1i(skyboxLocation, 0);

        // Allow the quad to pass the depth test at 1.0
        gl.depthFunc(gl.LEQUAL);

        // Render the geometry
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with values defining a quad
function setGeometry(gl) {
    let positions = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

main();

