"use strict";

function main() {
	// Obtain a WebGL context from the canvas element
	/** @type {HTMLCanvasElement} */
	var canvas = document.querySelector("#canvas");
	var gl = canvas.getContext("webgl");
	if (!gl) {
		return; // If WebGL is not available, exit the function
	}

	// Initialize the GLSL program using the vertex and fragment shaders
	var program = webglUtils.createProgramFromScripts(gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);

	// Get the location of the attribute for vertex positions in the shader
	var positionLocation = gl.getAttribLocation(program, "a_position");

	// Get the locations of uniform variables in the shader
	var skyboxLocation = gl.getUniformLocation(program, "u_skybox");
	var viewDirectionProjectionInverseLocation = gl.getUniformLocation(program, "u_viewDirectionProjectionInverse");

	// Create a buffer to store vertex positions
	var positionBuffer = gl.createBuffer();
	// Bind the buffer to the ARRAY_BUFFER binding point
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Load position data into the buffer to define the geometry (a quad)
	setGeometry(gl);

	// Create a texture object for the skybox
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture); // Bind the texture to the TEXTURE_CUBE_MAP target

	// Define an array with information about the 6 faces of the cubemap (skybox)
	const faceInfos = [
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			url: 'resources/skybox/px.png', // Positive X face
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			url: 'resources/skybox/nx.png', // Negative X face
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			url: 'resources/skybox/py.png', // Positive Y face
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			url: 'resources/skybox/ny.png', // Negative Y face
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			url: 'resources/skybox/pz.png', // Positive Z face
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			url: 'resources/skybox/nz.png', // Negative Z face
		},
	];

	// Iterate over each face of the cubemap and configure the texture
	faceInfos.forEach((faceInfo) => {
		const { target, url } = faceInfo;

		// Set up an empty texture for each face
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1024;
		const height = 1024;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

		// Load the image for each face asynchronously
		const image = new Image();
		image.src = url;
		image.addEventListener('load', function () {
			// Once the image is loaded, bind the texture and upload the image data to the corresponding face
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
			gl.texImage2D(target, level, internalFormat, format, type, image);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP); // Generate mipmaps for the texture
		});
	});

	// Generate mipmaps for the entire cubemap (important for filtering)
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	// Set texture parameters for filtering when minifying the texture
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

	// Helper function to convert degrees to radians
	function degToRad(d) {
		return d * Math.PI / 180;
	}

	// Set the field of view for the camera in radians
	var fieldOfViewRadians = degToRad(60);
	var cameraYRotationRadians = degToRad(0); // Initial camera rotation around the Y-axis

	var spinCamera = true; // Variable to control camera rotation
	// Capture the initial time for animation purposes
	var then = 0;

	// Start the render loop
	requestAnimationFrame(drawScene);

	// Function to render the scene
	function drawScene(time) {
		// Convert time to seconds
		time *= 0.001;
		// Compute the time difference from the last frame
		var deltaTime = time - then;
		// Store the current time for the next frame
		then = time;

		// Resize the canvas to match the display size
		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		// Set the WebGL viewport to cover the entire canvas
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// Enable face culling and depth testing
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// Clear the canvas and the depth buffer
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Use the GLSL program (shaders)
		gl.useProgram(program);

		// Enable the attribute for vertex positions
		gl.enableVertexAttribArray(positionLocation);

		// Bind the position buffer again
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

		// Describe how to pull data from the buffer
		var size = 2;          // 2 components per vertex (x, y)
		var type = gl.FLOAT;   // 32-bit floats
		var normalize = false; // No normalization
		var stride = 0;        // Move forward by size * sizeof(type) each iteration
		var offset = 0;        // Start at the beginning of the buffer
		gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

		// Compute the projection matrix
		var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

		// Set the camera's position to orbit around the origin
		var target = [0, 0, 0]; // The point the camera is looking at
		var up = [0, 1, 0];     // The up direction for the camera
		// Compute the camera's matrix using the lookAt function
		var cameraMatrix = m4.lookAt(cameraPosition, target, up);

		// Compute the view matrix as the inverse of the camera matrix
		var viewMatrix = m4.inverse(cameraMatrix);

		// Remove translation from the view matrix to focus on direction only
		viewMatrix[12] = 0;
		viewMatrix[13] = 0;
		viewMatrix[14] = 0;

		// Compute the view direction projection matrix
		var viewDirectionProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
		// Compute the inverse of the view direction projection matrix
		var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

		// Set the uniform variable in the shader with the inverse matrix
		gl.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, viewDirectionProjectionInverseMatrix);

		// Tell the shader to use texture unit 0 for the skybox
		gl.uniform1i(skyboxLocation, 0);

		// Set the depth function to allow the skybox to render at the farthest depth (1.0)
		gl.depthFunc(gl.LEQUAL);

		// Draw the skybox geometry (a quad)
		gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);

		// Request the next frame to continue the render loop
		requestAnimationFrame(drawScene);
	}
}

// Function to fill the buffer with vertex positions defining a quad
function setGeometry(gl) {
	var positions = new Float32Array(
		[
			-1, -1, // Bottom left corner
			1, -1,  // Bottom right corner
			-1, 1, // Top left corner
			-1, 1, // Top left corner
			1, -1,  // Bottom right corner
			1, 1,  // Top right corner
		]);
	// Upload the positions to the GPU
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Start the WebGL rendering process by calling the main function
main();