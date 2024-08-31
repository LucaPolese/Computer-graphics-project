// Function to check if a value is a power of 2.
// This is crucial because WebGL requires textures to be power-of-2 dimensions 
// if you want to use certain features like mipmaps or specific wrapping modes (REPEAT or MIRRORED_REPEAT).
function isPowerOf2(value) {
    return (value & (value - 1)) === 0; // A number is a power of 2 if its binary representation contains exactly one '1'.
}

// Function to create a 1x1 pixel texture. This is useful as a placeholder 
// while the actual texture is loading or when a texture isn't strictly necessary.
function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();  // Create a new WebGL texture object.
    gl.bindTexture(gl.TEXTURE_2D, texture);  // Bind the texture to the TEXTURE_2D target for further operations.
    
    // Define a 1x1 pixel texture with the provided RGBA color (from the 'pixel' array).
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel));  
    
    return texture;  // Return the created texture object.
}

// Function to create a texture from an image URL. Handles both the creation of a placeholder 
// and the asynchronous loading and application of the actual image.
function createTexture(gl, url) {
    // Initially, create a 1x1 texture filled with a default color (light blue) as a placeholder.
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);

    // Create a new Image object to load the actual texture image.
    const image = new Image();
    image.src = url;  // Set the image source to the provided URL.
    
    // Set up an event listener that triggers when the image has fully loaded.
    image.addEventListener('load', function () {
        // Bind the texture again, as operations will be performed on it.
        gl.bindTexture(gl.TEXTURE_2D, texture);  
        
        // Flip the Y-axis of the image data so that it matches WebGL's coordinate system.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  
        
        // Upload the image data to the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  

        // Check if the image dimensions are powers of 2, which is required for certain WebGL features.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // If the dimensions are powers of 2, generate mipmaps for more efficient texture scaling.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // If not, set the texture's wrapping to CLAMP_TO_EDGE and use LINEAR filtering.
            // This is because non-power-of-2 textures cannot use mipmaps or REPEAT wrapping mode.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });

    // Return the texture object, initially as a 1x1 texture, but it will be updated once the image loads.
    return texture;
}

// Utility function to create an iterator for indexed geometry.
// An index buffer allows for the re-use of vertices by storing references instead of duplicating data.
// This function creates an iterator that goes through these indices.
function makeIndexIterator(indices) {
    let ndx = 0;  // Initialize the index to start at the first element.
    
    // Function that returns the current index value and then increments the index.
    const fn = () => indices[ndx++];  
    
    // Method to reset the iterator back to the start of the index buffer.
    fn.reset = () => { ndx = 0; };  
    
    // Store the total number of elements (indices) in the index buffer.
    fn.numElements = indices.length;  
    
    return fn;  // Return the iterator function.
}

// Utility function to create an iterator for unindexed geometry.
// For geometry that doesn't use an index buffer, this function provides a way to iterate through vertex positions directly.
function makeUnindexedIterator(positions) {
    let ndx = 0;  // Initialize the index to start at the first vertex.
    
    // Function that returns the current vertex index and then increments it.
    const fn = () => ndx++;  
    
    // Method to reset the iterator back to the start.
    fn.reset = () => { ndx = 0; };  
    
    // Store the total number of vertices, calculated by dividing the total number of position components by 3 (x, y, z).
    fn.numElements = positions.length / 3;  
    
    return fn;  // Return the iterator function.
}

// Function to subtract two 2D vectors. This is often used in texture coordinate calculations, 
// such as when determining how much to move in texture space between vertices.
const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);

// Function to generate tangent vectors needed for normal mapping.
// Tangent vectors are crucial for correctly applying normal maps, which provide detailed surface lighting effects.
function generateTangents(position, texcoord, indices) {
    // Determine whether to use an indexed iterator or an unindexed one, depending on whether 'indices' is provided.
    const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
    
    // Calculate the total number of faces (triangles) based on the number of elements.
    const numFaceVerts = getNextIndex.numElements;
    const numFaces = numFaceVerts / 3;

    const tangents = [];  // Initialize an array to store the calculated tangent vectors.

    // Iterate over each face (triangle) to calculate tangents.
    for (let i = 0; i < numFaces; ++i) {
        // Get the indices of the three vertices that make up this triangle.
        const n1 = getNextIndex();  
        const n2 = getNextIndex();  
        const n3 = getNextIndex();  

        // Extract the positions of the three vertices.
        const p1 = position.slice(n1 * 3, n1 * 3 + 3);
        const p2 = position.slice(n2 * 3, n2 * 3 + 3);
        const p3 = position.slice(n3 * 3, n3 * 3 + 3);

        // Extract the texture coordinates of the three vertices.
        const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
        const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
        const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

        // Calculate the vectors representing the edges of the triangle in 3D space.
        const dp12 = m4.subtractVectors(p2, p1);
        const dp13 = m4.subtractVectors(p3, p1);

        // Calculate the difference in texture coordinates along those edges.
        const duv12 = subtractVector2(uv2, uv1);
        const duv13 = subtractVector2(uv3, uv1);

        // Calculate the tangent vector using a formula that combines the position and texture coordinate differences.
        // This formula derives from the partial derivatives of the texture mapping.
        const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
        
        // If the calculation is valid, compute the tangent vector.
        const tangent = Number.isFinite(f)
            ? m4.normalize(m4.scaleVector(m4.subtractVectors(
                m4.scaleVector(dp12, duv13[1]),
                m4.scaleVector(dp13, duv12[1]),
            ), f))
            : [1, 0, 0];  // If the calculation fails, use a default tangent vector [1, 0, 0].

        // Store the same tangent vector for all three vertices of the triangle.
        tangents.push(...tangent, ...tangent, ...tangent);
    }

    return tangents;  // Return the array of calculated tangent vectors.
}

// ----------------- Normal Mapping -----------------
// Boolean flag to track whether normal mapping is enabled.
let normalMappingEnabled = false;

// Event listener for enabling/disabling normal mapping based on a checkbox input.
// This updates the 'normalMappingEnabled' flag to control whether the normal map is applied during rendering.
document.getElementById('normalMap').addEventListener('change', (event) => {
    normalMappingEnabled = event.target.checked;  // Update the flag based on the checkbox state.
});

// ----------------- Transparency -------------------
// Boolean flag to track whether transparency is enabled.
let transparencyEnabled = false;

// Event listener for enabling/disabling transparency based on a checkbox input.
// This updates the 'transparencyEnabled' flag and configures WebGL's blending settings accordingly.
document.getElementById('transparency').addEventListener('change', (event) => {
    transparencyEnabled = event.target.checked;  // Update the flag based on the checkbox state.
    
    if (transparencyEnabled) {
        // If transparency is enabled, enable blending and set the blend function.
        // This blend function combines the source color (from the fragment shader) with the destination color 
        // (from the framebuffer) using the source alpha value.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
        // If transparency is disabled, turn off blending.
        gl.disable(gl.BLEND);
    }
});

// ----------------- Reflections --------------------
// Boolean flag to track whether reflections are enabled.
let reflectionsEnabled = false;

// Event listener for enabling/disabling reflections based on a checkbox input.
// This updates the 'reflectionsEnabled' flag to control whether reflection effects are applied during rendering.
document.getElementById('reflections').addEventListener('change', (event) => {
    reflectionsEnabled = event.target.checked;  // Update the flag based on the checkbox state.
});