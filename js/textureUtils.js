// Function to check if a value is a power of 2.
// This is useful for determining if textures can use mipmaps and specific wrapping modes.
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

// Function to create a 1x1 pixel texture. This is useful for creating a placeholder texture
// that can be replaced later when the actual image has loaded.
function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();  // Create a new texture object.
    gl.bindTexture(gl.TEXTURE_2D, texture);  // Bind the texture so we can perform operations on it.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(pixel));  // Define the texture as a 1x1 pixel image with the provided color.
    return texture;  // Return the created texture object.
}

// Function to create a texture from an image URL. This function handles both synchronous 
// placeholder texture creation and asynchronous image loading.
function createTexture(gl, url) {
    // Start with a 1x1 blue pixel texture as a placeholder.
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);

    // Create an image object to load the actual image.
    const image = new Image();
    image.src = url;  // Set the source of the image to the provided URL.
    
    // Once the image has loaded, copy it to the WebGL texture.
    image.addEventListener('load', function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);  // Bind the texture so we can perform operations on it.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // Flip the image's Y-axis to match WebGL's coordinate system.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  // Upload the image to the texture.

        // Check if the image dimensions are powers of 2.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // If both dimensions are powers of 2, generate mipmaps for efficient texture scaling.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // If not, disable mipmaps and set the wrapping mode to clamp to edge.
            // This is necessary because non-power-of-2 textures have more restrictions.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });

    // Return the texture object (initially a 1x1 texture, but later replaced with the loaded image).
    return texture;
}

// Utility function to create an iterator for indexed geometry.
// This allows us to iterate through index buffers, which is useful for rendering and computing tangents.
function makeIndexIterator(indices) {
    let ndx = 0;
    const fn = () => indices[ndx++];  // Function to return the current index and increment.
    fn.reset = () => { ndx = 0; };  // Reset the iterator to start from the beginning.
    fn.numElements = indices.length;  // Store the total number of indices.
    return fn;
}

// Utility function to create an iterator for unindexed geometry.
// This is useful for iterating over vertices directly when no index buffer is used.
function makeUnindexedIterator(positions) {
    let ndx = 0;
    const fn = () => ndx++;  // Function to return the current vertex index and increment.
    fn.reset = () => { ndx = 0; };  // Reset the iterator to start from the beginning.
    fn.numElements = positions.length / 3;  // Store the total number of vertices.
    return fn;
}

// Subtracts two 2D vectors. This is used to calculate the difference between texture coordinates.
const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);

// Function to generate tangent vectors for normal mapping.
// Tangents are required for normal mapping to correctly interpret the normal map textures.
function generateTangents(position, texcoord, indices) {
    // Choose the appropriate iterator based on whether indices are provided.
    const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
    const numFaceVerts = getNextIndex.numElements;
    const numFaces = numFaceVerts / 3;  // Calculate the number of faces (triangles).

    const tangents = [];  // Array to hold the computed tangent vectors.
    for (let i = 0; i < numFaces; ++i) {
        const n1 = getNextIndex();  // Get the vertex index for the first vertex of the triangle.
        const n2 = getNextIndex();  // Get the vertex index for the second vertex of the triangle.
        const n3 = getNextIndex();  // Get the vertex index for the third vertex of the triangle.

        // Get the positions of the three vertices that make up the triangle.
        const p1 = position.slice(n1 * 3, n1 * 3 + 3);
        const p2 = position.slice(n2 * 3, n2 * 3 + 3);
        const p3 = position.slice(n3 * 3, n3 * 3 + 3);

        // Get the texture coordinates of the three vertices.
        const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
        const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
        const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

        // Compute the edge vectors of the triangle in 3D space.
        const dp12 = m4.subtractVectors(p2, p1);
        const dp13 = m4.subtractVectors(p3, p1);

        // Compute the difference in texture coordinates.
        const duv12 = subtractVector2(uv2, uv1);
        const duv13 = subtractVector2(uv3, uv1);

        // Compute the tangent vector using the formula based on texture coordinates and positions.
        const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
        const tangent = Number.isFinite(f)
            ? m4.normalize(m4.scaleVector(m4.subtractVectors(
                m4.scaleVector(dp12, duv13[1]),
                m4.scaleVector(dp13, duv12[1]),
            ), f))
            : [1, 0, 0];  // If the tangent calculation fails, use a default tangent.

        // Store the tangent for all three vertices of the triangle.
        tangents.push(...tangent, ...tangent, ...tangent);
    }

    return tangents;  // Return the array of computed tangents.
}

// ----------------- Normal Mapping -----------------
// Boolean flag to track whether normal mapping is enabled.
let normalMappingEnabled = false;

// Event listener for enabling/disabling normal mapping based on a checkbox.
document.getElementById('normalMap').addEventListener('change', (event) => {
    normalMappingEnabled = event.target.checked;
});

// ----------------- Transparency -------------------
// Boolean flag to track whether transparency is enabled.
let transparencyEnabled = false;

// Event listener for enabling/disabling transparency based on a checkbox.
document.getElementById('transparency').addEventListener('change', (event) => {
    transparencyEnabled = event.target.checked;
    if (transparencyEnabled) {
        // If transparency is enabled, enable blending and set the blend function.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
        // If transparency is disabled, disable blending.
        gl.disable(gl.BLEND);
    }
});

// ----------------- Reflections --------------------
// Boolean flag to track whether reflections are enabled.
let reflectionsEnabled = false;

// Event listener for enabling/disabling reflections based on a checkbox.
document.getElementById('reflections').addEventListener('change', (event) => {
    reflectionsEnabled = event.target.checked;
});