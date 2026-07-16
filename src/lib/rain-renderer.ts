import GL from "./gl-obj";
import createCanvas from "./create-canvas";

// Vite native raw imports for compiled-in shader files
import vertShader from "../shaders/Simple.vert?raw";
import fragShader from "../shaders/Water.frag?raw";

export interface RainRendererOptions {
  renderShadow: boolean;
  minRefraction: number;
  maxRefraction: number;
  brightness: number;
  alphaMultiply: number;
  alphaSubtract: number;
  parallaxBg: number;
  parallaxFg: number;
  flashColor?: [number, number, number];
  flashPos?: [number, number];
  [key: string]: any;
}

export const defaultRendererOptions: RainRendererOptions = {
  renderShadow: false,
  minRefraction: 256,
  maxRefraction: 512,
  brightness: 1,
  alphaMultiply: 20,
  alphaSubtract: 5,
  parallaxBg: 5,
  parallaxFg: 20,
  flashColor: [0.0, 0.0, 0.0],
  flashPos: [0.5, 0.0],
};

export default class RainRenderer {
  public canvas: HTMLCanvasElement;
  public canvasLiquid: HTMLCanvasElement;
  public imageShine: HTMLCanvasElement | HTMLImageElement | null;
  public imageFg: HTMLCanvasElement | HTMLImageElement;
  public imageBg: HTMLCanvasElement | HTMLImageElement;
  public options: RainRendererOptions;

  public gl!: GL;
  public programWater!: WebGLProgram;
  public textures!: Array<{ name: string; img: HTMLCanvasElement | HTMLImageElement }>;
  
  public parallaxX: number = 0;
  public parallaxY: number = 0;
  public width: number;
  public height: number;

  private animId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    canvasLiquid: HTMLCanvasElement,
    imageFg: HTMLCanvasElement | HTMLImageElement,
    imageBg: HTMLCanvasElement | HTMLImageElement,
    imageShine: HTMLCanvasElement | HTMLImageElement | null = null,
    options: Partial<RainRendererOptions> = {}
  ) {
    this.canvas = canvas;
    this.canvasLiquid = canvasLiquid;
    this.imageFg = imageFg;
    this.imageBg = imageBg;
    this.imageShine = imageShine;
    this.options = Object.assign({}, defaultRendererOptions, options);
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.init();
  }

  private init(): void {
    this.gl = new GL(this.canvas, { alpha: false }, vertShader, fragShader);
    this.programWater = this.gl.program;

    const gl = this.gl;
    gl.createUniform("2f", "resolution", this.width, this.height);
    
    const bgWidth = (this.imageBg as HTMLImageElement).width || 1024;
    const bgHeight = (this.imageBg as HTMLImageElement).height || 768;
    gl.createUniform("1f", "textureRatio", bgWidth / bgHeight);
    
    gl.createUniform("1i", "renderShine", this.imageShine === null ? 0 : 1);
    gl.createUniform("1i", "renderShadow", this.options.renderShadow ? 1 : 0);
    gl.createUniform("1f", "minRefraction", this.options.minRefraction);
    gl.createUniform(
      "1f",
      "refractionDelta",
      this.options.maxRefraction - this.options.minRefraction
    );
    gl.createUniform("1f", "brightness", this.options.brightness);
    gl.createUniform("1f", "alphaMultiply", this.options.alphaMultiply);
    gl.createUniform("1f", "alphaSubtract", this.options.alphaSubtract);
    gl.createUniform("1f", "parallaxBg", this.options.parallaxBg);
    gl.createUniform("1f", "parallaxFg", this.options.parallaxFg);

    const flashColor = this.options.flashColor || [0.0, 0.0, 0.0];
    gl.createUniform("3f", "flashColor", flashColor[0], flashColor[1], flashColor[2]);

    const flashPos = this.options.flashPos || [0.5, 0.0];
    gl.createUniform("2f", "flashPos", flashPos[0], flashPos[1]);

    // activeTexture(0) binds the dynamic liquid canvas map
    gl.createTexture(null, 0);
    gl.createUniform("1i", "waterMap", 0);

    this.textures = [
      {
        name: "textureShine",
        img: this.imageShine === null ? createCanvas(2, 2) : this.imageShine,
      },
      { name: "textureFg", img: this.imageFg },
      { name: "textureBg", img: this.imageBg },
    ];

    this.textures.forEach((texture, i) => {
      gl.createTexture(texture.img, i + 1);
      gl.createUniform("1i", texture.name, i + 1);
    });

    this.draw();
  }

  public draw(): void {
    if (this.isDestroyed) return;

    this.gl.useProgram(this.programWater);
    this.gl.createUniform("2f", "parallax", this.parallaxX, this.parallaxY);
    this.updateTexture();
    this.gl.draw();

    this.animId = requestAnimationFrame(this.draw.bind(this));
  }

  public updateTextures(): void {
    this.textures.forEach((texture, i) => {
      this.gl.activeTexture(i + 1);
      this.gl.updateTexture(texture.img);
    });
  }

  public updateTexture(): void {
    this.gl.activeTexture(0);
    this.gl.updateTexture(this.canvasLiquid);
  }

  public updateOptions(newOptions: Partial<RainRendererOptions>): void {
    this.options = Object.assign({}, this.options, newOptions);
    const gl = this.gl;
    if (gl && gl.program) {
      gl.useProgram(this.programWater);
      gl.createUniform("1i", "renderShadow", this.options.renderShadow ? 1 : 0);
      gl.createUniform("1f", "minRefraction", this.options.minRefraction);
      gl.createUniform(
        "1f",
        "refractionDelta",
        this.options.maxRefraction - this.options.minRefraction
      );
      gl.createUniform("1f", "brightness", this.options.brightness);
      gl.createUniform("1f", "alphaMultiply", this.options.alphaMultiply);
      gl.createUniform("1f", "alphaSubtract", this.options.alphaSubtract);
      gl.createUniform("1f", "parallaxBg", this.options.parallaxBg);
      gl.createUniform("1f", "parallaxFg", this.options.parallaxFg);
      const flashColor = this.options.flashColor || [0.0, 0.0, 0.0];
      gl.createUniform("3f", "flashColor", flashColor[0], flashColor[1], flashColor[2]);
      
      const flashPos = this.options.flashPos || [0.5, 0.0];
      gl.createUniform("2f", "flashPos", flashPos[0], flashPos[1]);
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
  }
}
