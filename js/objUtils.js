// Function to handle and parse the arguments of texture maps.
function parseMapArgs(unparsedArgs) {
    // TODO: Handle advanced parsing options for maps.
    return unparsedArgs; // Simply return the unparsed arguments for now.
}

// Function to parse the content of an MTL (Material Template Library) file.
function parseMTL(text) {
    const materials = {}; // Object to store defined materials.
    let material; // Temporary variable for the current material.

    /*
    Mapping of material properties:
    Ns(parts): specular shininess
    Ka(parts): ambient color
    Kd(parts): diffuse color 
    Ks(parts): specular color
    Ke(parts): emissive color
    map_Kd(parts, unparsedArgs): diffuse texture map
    map_Ns(parts, unparsedArgs): specular texture map
    map_Bump(parts, unparsedArgs): bump (normal) map
    Ni(parts): index of refraction
    d(parts): dissolve (opacity)
    illum(parts): illumination model
    */
    const keywords = {
        // Starts a new material
        newmtl(parts, unparsedArgs) {
            material = {}; // Create a new material object.
            materials[unparsedArgs] = material; // Save the material with the specified name.
        },
        // Sets the specular shininess.
        Ns(parts) { material.shininess = parseFloat(parts[0]); },
        // Sets the ambient color.
        Ka(parts) { material.ambient = parts.map(parseFloat); },
        // Sets the diffuse color.
        Kd(parts) { material.diffuse = parts.map(parseFloat); },
        // Sets the specular color.
        Ks(parts) { material.specular = parts.map(parseFloat); },
        // Sets the emissive color.
        Ke(parts) { material.emissive = parts.map(parseFloat); },
        // Associates a diffuse texture map.
        map_Kd(parts, unparsedArgs)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
        // Associates a specular texture map.
        map_Ns(parts, unparsedArgs)   { material.specularMap = parseMapArgs(unparsedArgs); },
        // Associates a bump map.
        map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
        // Sets the index of refraction.
        Ni(parts)     { material.opticalDensity = parseFloat(parts[0]); },
        // Sets the material's opacity.
        d(parts)      { material.opacity        = parseFloat(parts[0]); },
        // Sets the illumination model.
        illum(parts)  { material.illum          = parseInt(parts[0]); }
    };

    // Regular expression to extract keywords and arguments from each line.
    const keywordRE = /(\w*)(?: )*(.*)/;
    // Split the text into lines.
    const lines = text.split('\n');
    // Loop through all the lines.
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim(); // Remove whitespace.
        if (line === '' || line.startsWith('#')) {
            continue; // Skip empty lines or comments.
        }
        const m = keywordRE.exec(line); // Apply the regular expression.
        if (!m) {
            continue; // Skip if there is no match.
        }
        const [, keyword, unparsedArgs] = m; // Extract the keyword and unparsed arguments.
        const parts = line.split(/\s+/).slice(1); // Extract the parsed arguments.
        const handler = keywords[keyword]; // Find the handler for the keyword.
        if (!handler) {
            continue; // Skip if the keyword is not handled.
        }
        handler(parts, unparsedArgs); // Execute the handler with the arguments.
    }

    return materials; // Return all parsed materials.
}

// Function to parse the content of an OBJ file.
function parseOBJ(text) {
    // Initialize lists for positions, textures, normals, and colors.
    const objPositions = [[0, 0, 0]]; // Vertex positions.
    const objTexcoords = [[0, 0]]; // Texture coordinates.
    const objNormals = [[0, 0, 0]]; // Vertex normals.
    const objColors = [[0, 0, 0]]; // Vertex colors.

    // Vertex data is organized in the same order as the `f` indices.
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
        objColors,
    ];

    // Initialize empty arrays for WebGL data, corresponding to `f`.
    let webglVertexData = [
        [],   // positions
        [],   // texture coordinates
        [],   // normals
        [],   // colors
    ];

    const materialLibs = []; // Array to store material libraries.
    const geometries = []; // Array to store parsed geometries.
    let geometry; // Temporary variable for the current geometry.
    let groups = ['default']; // Vertex groups.
    let material = 'default'; // Current material.
    let object = 'default'; // Current object.

    const noop = () => { }; // Empty function for keywords that do nothing.

    // Create a new geometry if the current one contains data.
    function newGeometry() {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    // Set a new geometry if one has not been created.
    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
                color,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry); // Add the geometry to the list of geometries.
        }
    }

    // Add a vertex to the current geometry's data.
    function addVertex(vert) {
        const ptn = vert.split('/'); // Split the vertex into position, texture, and normal.
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return; // Skip if there is no data.
            }
            const objIndex = parseInt(objIndexStr); // Convert the index to an integer.
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length); // Calculate the index.
            webglVertexData[i].push(...objVertexData[i][index]); // Add the data to the WebGL buffer.
            // If it's the position index (i === 0) and we have colors, copy the colors to the WebGL buffer.
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    // Keywords for parsing an OBJ file and associating them with respective functions.
    const keywords = {
        // Keyword for defining a vertex.
        v(parts) {
            // If there are more than 3 values, they are vertex colors.
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        // Keyword for defining a normal.
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        // Keyword for defining texture coordinates.
        vt(parts) {
            objTexcoords.push(parts.map(parseFloat));
        },
        // Keyword for defining a face (a group of vertices).
        f(parts) {
            setGeometry(); // Ensure there is a current geometry.
            const numTriangles = parts.length - 2; // Calculate the number of triangles.
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]); // Add the first vertex of the triangle.
                addVertex(parts[tri + 1]); // Add the second vertex of the triangle.
                addVertex(parts[tri + 2]); // Add the third vertex of the triangle.
            }
        },
        // Keyword to ignore smoothing groups.
        s: noop,
        // Keyword to specify a material library.
        mtllib(parts, unparsedArgs) {
            materialLibs.push(unparsedArgs); // Add the material library.
        },
        // Keyword to use a material.
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs; // Set the current material.
            newGeometry(); // Start a new geometry.
        },
        // Keyword to specify a group of vertices.
        g(parts) {
            groups = parts; // Set the current groups.
            newGeometry(); // Start a new geometry.
        },
        // Keyword to specify an object.
        o(parts, unparsedArgs) {
            object = unparsedArgs; // Set the current object.
            newGeometry(); // Start a new geometry.
        },
    };

    // Regular expression to extract keywords and arguments.
    const keywordRE = /(\w*)(?: )*(.*)/;
    // Split the text into lines.
    const lines = text.split('\n');
    // Loop through all the lines.
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim(); // Remove whitespace.
        if (line === '' || line.startsWith('#')) {
            continue; // Skip empty lines or comments.
        }
        const m = keywordRE.exec(line); // Apply the regular expression.
        if (!m) {
            continue; // Skip if there is no match.
        }
        const [, keyword, unparsedArgs] = m; // Extract the keyword and unparsed arguments.
        const parts = line.split(/\s+/).slice(1); // Extract the parsed arguments.
        const handler = keywords[keyword]; // Find the handler for the keyword.
        if (!handler) {
            continue; // Skip if the keyword is not handled.
        }
        handler(parts, unparsedArgs); // Execute the handler with the arguments.
    }

    // Remove any empty arrays in the geometry data.
    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0)
        );
    }

    return {
        geometries, // Return the parsed geometries.
        materialLibs, // Return the material libraries.
    };
}

// Function to set up default textures in a WebGL context.
function setUpDefaultTexture(gl) {
    textures = {
        defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]), // Default white texture.
        defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]), // Default normal map.
    };

    // Default material with basic properties.
    defaultMaterial = {
        diffuse: [1, 1, 1], // Default diffuse color (white).
        diffuseMap: textures.defaultWhite, // Default diffuse texture map.
        normalMap: textures.defaultNormal, // Default normal map.
        ambient: [0, 0, 0], // Default ambient color (black).
        specular: [1, 1, 1], // Default specular color (white).
        specularMap: textures.defaultWhite, // Default specular texture map.
        shininess: 400, // High specular shininess.
        opacity: 1, // Fully opaque.
    };
}

// Function to get the extents of a series of positions.
function getExtents(positions) {
    const min = positions.slice(0, 3); // Initial minimum extents.
    const max = positions.slice(0, 3); // Initial maximum extents.
    for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
            const v = positions[i + j]; // Current value.
            min[j] = Math.min(v, min[j]); // Update the minimum.
            max[j] = Math.max(v, max[j]); // Update the maximum.
        }
    }
    return {min, max}; // Return the extents.
}

// Function to get the extents of all geometries.
function getGeometriesExtents(geometries) {
    return geometries.reduce(({min, max}, {data}) => {
        const minMax = getExtents(data.position); // Get the extents of a geometry.
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)), // Update the global minimum.
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)), // Update the global maximum.
        };
    }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY), // Initialize the minimum with positive infinity values.
        max: Array(3).fill(Number.NEGATIVE_INFINITY), // Initialize the maximum with negative infinity values.
    });
}

// Async function to load and process an OBJ file in a WebGL context.
async function loadObj(gl, objHref) {
    const response = await fetch(objHref); // Fetch the OBJ file.
    const text = await response.text(); // Get the text of the OBJ file.
    if (objHref.endsWith("Road.obj")) { calculateObjBoundaries(text) }; // Optional function to calculate the boundaries of a specific object.
    const obj = parseOBJ(text); // Parse the OBJ file.
    const baseHref = new URL(objHref, window.location.href); // Base URL to resolve relative paths.

    // Load material libraries associated with the OBJ file.
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href; // Resolve the MTL file path.
        const response = await fetch(matHref); // Fetch the MTL file.
        return await response.text(); // Get the text of the MTL file.
    }));
    const materials = parseMTL(matTexts.join('\n')); // Parse the materials.

    // Load textures associated with the materials.
    for (const material of Object.values(materials)) {
        Object.entries(material)
            .filter(([key]) => key.endsWith('Map')) // Filter keys that end with 'Map' (texture map).
            .forEach(([key, filename]) => {
                let texture = textures[filename]; // Retrieve the texture if already loaded.
                if (!texture) {
                    const textureHref = new URL(filename, baseHref).href; // Resolve the texture path.
                    texture = createTexture(gl, textureHref); // Create the texture.
                    textures[filename] = texture; // Store the texture.
                }
                material[key] = texture; // Associate the texture with the material.
            });
    }

    // Hack to visualize the specular map: lower the shininess and modify the specular color.
    Object.values(materials).forEach(m => {
        m.shininess = 25;
        m.specular = [3, 2, 1]; // Exaggerated specular color to highlight the specular map.
    });

    // Create the renderable parts with WebGL buffers and materials.
    const parts = obj.geometries.map(({ material, data }) => {
        // Because data is just named arrays like this
        //
        // {
        //   position: [...],
        //   texcoord: [...],
        //   normal: [...],
        // }
        //
        // and because those names match the attributes in our vertex
        // shader we can pass it directly into `createBufferInfoFromArrays`
        // from the article "less code more fun".

        if (data.color) {
            if (data.position.length === data.color.length) {
                data.color = { numComponents: 3, data: data.color }; // Configure vertex colors.
            }
        } else {
            data.color = { value: [1, 1, 1, 1] }; // Default color is white if there are no vertex colors.
        }

        // Generate tangents if there are data to do so.
        if (data.texcoord && data.normal) {
            data.tangent = generateTangents(data.position, data.texcoord); // Generate tangents.
        } else {
            data.tangent = { value: [1, 0, 0] }; // Default tangent.
        }

        // Ensure there are texture coordinates.
        if (!data.texcoord) {
            data.texcoord = { value: [0, 0] };
        }

        // Ensure there are normals.
        if (!data.normal) {
            data.normal = { value: [0, 0, 1] };
        }

        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data); // Create buffer info from the data.

        return {
            material: {
                ...defaultMaterial,
                ...materials[material],
            }, // Associate the material.
            bufferInfo, // Store the buffer info.
        };
    });

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);

    return {parts, objOffset} // Return the renderable parts.
}