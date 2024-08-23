const vertexShader = `
// Define an attribute variable for the position of each vertex.
attribute vec4 a_position;

// Define an attribute variable for the normal vector of each vertex.
attribute vec3 a_normal;

// Define an attribute variable for the tangent vector of each vertex.
attribute vec3 a_tangent;

// Define an attribute variable for the texture coordinates of each vertex. 
attribute vec2 a_texcoord;

// Define an attribute variable for the color of each vertex. 
attribute vec4 a_color;


// Define a uniform variable for the projection matrix.
uniform mat4 u_projection;

// Define a uniform variable for the view matrix.
uniform mat4 u_view;

// Define a uniform variable for the world transformation matrix.
uniform mat4 u_world;

// Define a uniform variable for the camera position in world space.
uniform vec3 u_viewWorldPosition;


// Define a varying variable to pass the normal vector from the vertex shader to the fragment shader.
varying vec3 v_normal;

// Define a varying variable to pass the tangent vector from the vertex shader to the fragment shader. This will be used for lighting calculations in tangent space.
varying vec3 v_tangent;

// Define a varying variable to pass the vector from the surface to the view position (camera) from the vertex shader to the fragment shader. This will be used for calculating view-dependent effects like specular highlights.
varying vec3 v_surfaceToView;

// Define a varying variable to pass the texture coordinates from the vertex shader to the fragment shader. This is used for texture mapping in the fragment shader.
varying vec2 v_texcoord;

// Define a varying variable to pass the vertex color from the vertex shader to the fragment shader.
// This allows the fragment shader to access the per-vertex color interpolated across the surface.
varying vec4 v_color;


void main() {
    // Compute the position of the vertex in world space by multiplying the world matrix by the position attribute.
    vec4 worldPosition = u_world * a_position;
    
    // Compute the final position of the vertex in clip space by multiplying the projection matrix, view matrix, and world position.
    gl_Position = u_projection * u_view * worldPosition;

    // Compute the vector from the surface to the view (camera) position in world space. This represents the difference between the camera position and the world position of the vertex.
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;

    // This is used to transform normals and tangents from model space to world space.
    mat3 normalMat = mat3(u_world);
    
    // Transform the normal vector from model space to world space, then normalize it.
    v_normal = normalize(normalMat * a_normal);

    // Transform the tangent vector from model space to world space, then normalize it.
    v_tangent = normalize(normalMat * a_tangent);

    // Pass the texture coordinates to the fragment shader without modification.
    // These coordinates will be used to map the texture onto the surface.
    v_texcoord = a_texcoord;

    // Pass the vertex color to the fragment shader without modification.
    // The color will be interpolated across the surface for smooth shading.
    v_color = a_color;
}`;

const fragmentShader = `
// Set the precision for floating-point calculations to high precision.
// This helps ensure accurate calculations.
precision highp float;

// The normal vector interpolated across the surface of the polygon.
varying vec3 v_normal;

// The tangent vector interpolated across the surface of the polygon.
// It is used to create the tangent space matrix.
varying vec3 v_tangent;

// The vector from the surface to the view (camera) position interpolated across the surface.
varying vec3 v_surfaceToView;

// The texture coordinates interpolated across the surface of the polygon.
// These are used to sample the various textures.
varying vec2 v_texcoord;

// The color interpolated across the surface of the polygon.
// This color comes from the vertex shader and may be combined with the diffuse color.
varying vec4 v_color;

// The base color of the diffuse reflection of the material.
uniform vec3 diffuse;

// A texture sampler for the diffuse texture map.
// This is used to modulate the base color of the material with a texture.
uniform sampler2D diffuseMap;

// The ambient color of the material, representing the color in shadowed areas.
uniform vec3 ambient;

// The emissive color of the material, representing self-illumination.
uniform vec3 emissive;

// The color of the specular reflection of the material.
uniform vec3 specular;

// A texture sampler for the specular map.
// This modulates the specular reflection across the surface.
uniform sampler2D specularMap;

// The shininess factor of the material.
// This controls the size and intensity of specular highlights.
uniform float shininess;

// A texture sampler for the normal map.
// This provides surface detail by modifying the surface normal at each pixel.
uniform sampler2D normalMap;

// The opacity of the material.
// This controls the transparency of the material.
uniform float opacity;

// The direction of the light source in world space.
uniform vec3 u_lightDirection;

// The ambient light color in the scene.
uniform vec3 u_ambientLight;

// A flag to enable or disable different types of mapping.
uniform int u_normalMappingEnabled;
uniform int u_specularMappingEnabled;

// The main function, where the shader's computation begins for each fragment.
void main () {
    // Normalize the interpolated normal vector to ensure it has a length of 1.
    // The gl_FrontFacing variable indicates whether the fragment is on the front-facing side of the polygon.
    // If the fragment is on the back-facing side, the normal is inverted to ensure correct lighting.
    vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );

    if(u_normalMappingEnabled == 1){
        // Normalize the interpolated tangent vector to ensure it has a length of 1.
        // The same front-facing check is applied to the tangent to maintain consistency with the normal.
        vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );

        // Calculate the bitangent vector by taking the cross product of the normal and tangent vectors.
        // The bitangent is perpendicular to both the normal and tangent, completing the TBN matrix.
        vec3 bitangent = normalize(cross(normal, tangent));

        // Create a 3x3 TBN (Tangent, Bitangent, Normal) matrix using the tangent, bitangent, and normal vectors.
        // This matrix transforms vectors from tangent space to world space.
        mat3 tbn = mat3(tangent, bitangent, normal);

        // Sample the normal map at the given texture coordinates to get the normal vector in tangent space.
        // The normal map's RGB values are in the range [0, 1], so we scale them to [-1, 1] by multiplying by 2 and subtracting 1.
        normal = texture2D(normalMap, v_texcoord).rgb * 2.0 - 1.0;

        // Transform the sampled normal from tangent space to world space using the TBN matrix.
        // The result is the final normal vector used for lighting calculations.
        normal = normalize(tbn * normal);
    }

    // Calculate the diffuse lighting. The dot product between the light direction and the normal gives the intensity of the light.
    // This value is remapped from the range [-1, 1] to [0, 1] by multiplying by 0.5 and adding 0.5.
    float fakeLight = dot(u_lightDirection, normal) * 0.5 + 0.5;

    // Declare the variables before the conditionals
    vec3 effectiveDiffuse = diffuse * texture2D(diffuseMap, v_texcoord).rgb * v_color.rgb;
    vec3 effectiveSpecular = vec3(0.0);
    float effectiveOpacity = opacity * texture2D(diffuseMap, v_texcoord).a * v_color.a;
    float specularLight = 0.0;

    if(u_specularMappingEnabled == 1){
        // Normalize the surface-to-view direction vector to ensure it has a length of 1. This vector points from the fragment to the camera.
        vec3 surfaceToViewDirection = normalize(v_surfaceToView);

        // Calculate the half-vector between the light direction and the surface-to-view direction.
        // https://learnopengl.com/Advanced-Lighting/Advanced-Lighting
        vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

        // Calculate the specular lighting. The dot product between the normal and the half-vector gives the intensity of the specular highlight.
        // This value is clamped to the range [0, 1].
        specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

        // Sample the specular map at the given texture coordinates to get the specular color.
        // The specular map modulates the base specular color, allowing for variations across the surface.
        vec4 specularMapColor = texture2D(specularMap, v_texcoord);

        // Calculate the effective specular color by multiplying the base specular color with the specular map color.
        effectiveSpecular = specular * specularMapColor.rgb;
    }

    // Calculate the final fragment color (gl_FragColor).
    // The emissive color is added first, as it represents self-illumination and is independent of lighting.
    // The ambient color is multiplied by the ambient light color and added to the emissive color.
    // The effective diffuse color is multiplied by the diffuse lighting factor (fakeLight) and added.
    // The effective specular color is multiplied by the specular highlight intensity raised to the power of shininess and added.
    // The final color is output as a vec4, with the alpha channel set to the effective opacity.
    gl_FragColor = vec4(
        emissive +                             // Add emissive color
        ambient * u_ambientLight +             // Add ambient light contribution
        effectiveDiffuse * fakeLight +         // Add diffuse light contribution
        effectiveSpecular * pow(specularLight, shininess),  // Add specular light contribution
        effectiveOpacity);                     // Set the fragment's opacity
}`;