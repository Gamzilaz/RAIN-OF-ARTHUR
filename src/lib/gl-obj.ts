import * as WebGL from "./webgl";

export default class GL {
  public canvas!: HTMLCanvasElement;
  public gl!: WebGLRenderingContext;
  public program!: WebGLProgram;
  public width!: number;
  public height!: number;

  constructor(
    canvas: HTMLCanvasElement,
    options: WebGLContextAttributes,
    vert: string,
    frag: string
  ) {
    this.init(canvas, options, vert, frag);
  }

  private init(
    canvas: HTMLCanvasElement,
    options: WebGLContextAttributes,
    vert: string,
    frag: string
  ): void {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    
    const context = WebGL.getContext(canvas, options);
    if (!context) {
      throw new Error("Unable to obtain WebGL Context.");
    }
    this.gl = context;
    
    const program = this.createProgram(vert, frag);
    if (!program) {
      throw new Error("Compilation/linkage of WebGL shaders failed.");
    }
    this.program = program;
    this.useProgram(program);
  }

  public createProgram(vert: string, frag: string): WebGLProgram | null {
    return WebGL.createProgram(this.gl, vert, frag);
  }

  public useProgram(program: WebGLProgram): void {
    this.program = program;
    this.gl.useProgram(program);
  }

  public createTexture(source: TexImageSource | null, i: number): WebGLTexture | null {
    return WebGL.createTexture(this.gl, source, i);
  }

  public createUniform(type: string, name: string, ...v: any[]): void {
    WebGL.createUniform(this.gl, this.program, type, name, ...v);
  }

  public activeTexture(i: number): void {
    WebGL.activeTexture(this.gl, i);
  }

  public updateTexture(source: TexImageSource): void {
    WebGL.updateTexture(this.gl, source);
  }

  public draw(): void {
    WebGL.setRectangle(this.gl, -1, -1, 2, 2);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
