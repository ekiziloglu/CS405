/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, true);

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		this.normBuffer = gl.createBuffer();
		this.lightingEnabled = false;
		this.ambientIntensity = 0.1;

		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
		this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos');
		this.specularIntensity = 0.5;

		this.texture1 = null;
		this.texture2 = null;
		this.useSecondTextureLoc = gl.getUniformLocation(this.prog, 'useSecondTexture');
		this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor');
		this.tex2Loc = gl.getUniformLocation(this.prog, 'tex2');
		this.blendFactor = 0.5;
		
	}

	setSpecularIntensity(intensity) {
		this.specularIntensity = intensity;
		gl.useProgram(this.prog);
		gl.uniform1f(this.specularIntensityLoc, intensity);
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 0.0);
		if (this.texture1) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture1);
		}
		if (this.texture2) {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.texture2);
		}
		gl.uniform3f(this.viewPosLoc, 0, 0, 5);
	 
		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, isSecondTexture = false) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img
		);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
		if (!isSecondTexture) {
			this.texture1 = texture;
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(gl.getUniformLocation(this.prog, 'tex'), 0);
		} else {
			this.texture2 = texture;
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(this.tex2Loc, 1);
		}
	}

	enableLighting(show) {
	
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.lightingEnabled = show;
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightingLoc, show);
	}
	
	setAmbientLight(ambient) {

		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.ambientIntensity = ambient;
		gl.useProgram(this.prog);
		gl.uniform1f(this.ambientLoc, ambient);
	}

	setBlendFactor(factor) {
		this.blendFactor = Math.max(0, Math.min(1, factor));
		gl.useProgram(this.prog);
		gl.uniform1f(this.blendFactorLoc, this.blendFactor);
	}
	
	enableSecondTexture(enable) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.useSecondTextureLoc, enable);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
        v_texCoord = texCoord;
        v_normal = normal;
        v_position = pos;
        gl_Position = mvp * vec4(pos, 1);
    }`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */

const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform bool useSecondTexture;
    uniform sampler2D tex;
    uniform sampler2D tex2;
    uniform float blendFactor;
    uniform vec3 color;
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;
    uniform vec3 viewPos;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
        // Her durumda texture'ı al
        vec4 texColor1 = texture2D(tex, v_texCoord);
        vec4 texColor2 = texture2D(tex2, v_texCoord);
        vec4 texColor = mix(texColor1, texColor2, useSecondTexture ? blendFactor : 0.0);

        if (!showTex) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            return;
        }

        if (!enableLighting) {
            gl_FragColor = texColor;
            return;
        }

        // Lighting hesaplamaları
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(lightPos - v_position);
        
        // Ambient component
        vec3 ambientColor = ambient * texColor.rgb;
        
        // Diffuse component
        float diffuseFactor = max(dot(normal, lightDir), 0.0);
        vec3 diffuseColor = diffuseFactor * texColor.rgb;
        
        // Specular component
        vec3 viewDir = normalize(viewPos - v_position);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specularColor = specularIntensity * spec * vec3(1.0);
        
        gl_FragColor = vec4(ambientColor + diffuseColor + specularColor, 1.0);
    }
`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////