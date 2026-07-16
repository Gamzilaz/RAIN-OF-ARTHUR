export function getContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes = {}): WebGLRenderingContext | null {
  const contexts = ["webgl", "experimental-webgl"];
  let context: WebGLRenderingContext | null = null;

  contexts.some(name => {
    try {
      context = canvas.getContext(name, options) as WebGLRenderingContext | null;
    } catch (e) {}
    return context != null;
  });

  if (context == null) {
    document.body.classList.add("no-webgl");
  }

  return context;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexScript: string,
  fragScript: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, vertexScript, gl.VERTEX_SHADER);
  const fragShader = createShader(gl, fragScript, gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);

  gl.linkProgram(program);

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const lastError = gl.getProgramInfoLog(program);
    console.error("Error in program linking: " + lastError);
    gl.deleteProgram(program);
    return null;
  }

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0
    ]),
    gl.STATIC_DRAW
  );
  if (texCoordLocation !== -1) {
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }

  // Create a buffer for the position of the rectangle corners.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  if (positionLocation !== -1) {
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  }

  return program;
}

export function createShader(
  gl: WebGLRenderingContext,
  script: string,
  type: number
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, script);
  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!compiled) {
    const lastError = gl.getShaderInfoLog(shader);
    console.error("Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createTexture(
  gl: WebGLRenderingContext,
  source: TexImageSource | null,
  i: number
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  activeTexture(gl, i);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (source == null) {
    return texture;
  } else {
    updateTexture(gl, source);
  }

  return texture;
}

export function createUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  type: string,
  name: string,
  ...args: any[]
): void {
  const location = gl.getUniformLocation(program, "u_" + name);
  if (location === null) return;
  
  const methodName = ("uniform" + type) as keyof WebGLRenderingContext;
  if (typeof gl[methodName] === "function") {
    (gl[methodName] as Function)(location, ...args);
  }
}

export function activeTexture(gl: WebGLRenderingContext, i: number): void {
  const enumVal = (gl as any)["TEXTURE" + i];
  if (typeof enumVal === "number") {
    gl.activeTexture(enumVal);
  }
}

export function updateTexture(gl: WebGLRenderingContext, source: TexImageSource): void {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

export function setRectangle(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2
    ]),
    gl.STATIC_DRAW
  );
}
