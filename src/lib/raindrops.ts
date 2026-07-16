import createCanvas from "./create-canvas";
import { random, chance, times } from "./random";

export interface DropType {
  x: number;
  y: number;
  r: number;
  spreadX: number;
  spreadY: number;
  momentum: number;
  momentumX: number;
  lastSpawn: number;
  nextSpawn: number;
  parent: DropType | null;
  isNew: boolean;
  killed: boolean;
  shrink: number;
  evapFactor: number;
}

export function createDefaultDrop(overrides: Partial<DropType> = {}): DropType {
  return {
    x: 0,
    y: 0,
    r: 0,
    spreadX: 0,
    spreadY: 0,
    momentum: 0,
    momentumX: 0,
    lastSpawn: 0,
    nextSpawn: 0,
    parent: null,
    isNew: true,
    killed: false,
    shrink: 0,
    evapFactor: random(0.2, 1.8),
    ...overrides
  };
}

export interface RaindropsOptions {
  minR: number;
  maxR: number;
  maxDrops: number;
  rainChance: number;
  rainLimit: number;
  dropletsRate: number;
  dropletsSize: [number, number];
  dropletsCleaningRadiusMultiplier: number;
  raining: boolean;
  globalTimeScale: number;
  trailRate: number;
  autoShrink: boolean;
  evaporationRate?: number;
  spawnArea: [number, number];
  trailScaleRange: [number, number];
  collisionRadius: number;
  collisionRadiusIncrease: number;
  dropFallMultiplier: number;
  collisionBoostMultiplier: number;
  collisionBoost: number;
  windVelocity: number;
  [key: string]: any;
}

export const defaultOptions: RaindropsOptions = {
  minR: 10,
  maxR: 40,
  maxDrops: 900,
  rainChance: 0.3,
  rainLimit: 3,
  dropletsRate: 50,
  dropletsSize: [2, 4],
  dropletsCleaningRadiusMultiplier: 0.43,
  raining: true,
  globalTimeScale: 1,
  trailRate: 1,
  autoShrink: true,
  evaporationRate: 0,
  spawnArea: [-0.1, 0.95],
  trailScaleRange: [0.2, 0.5],
  collisionRadius: 0.65,
  collisionRadiusIncrease: 0.01,
  dropFallMultiplier: 1,
  collisionBoostMultiplier: 0.05,
  collisionBoost: 1,
  windVelocity: 0,
};

const dropSize = 64;

export default class Raindrops {
  public width: number;
  public height: number;
  public scale: number;
  public dropAlpha: HTMLCanvasElement | HTMLImageElement;
  public dropColor: HTMLCanvasElement | HTMLImageElement;
  public options: RaindropsOptions;

  public canvas!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;
  public droplets!: HTMLCanvasElement;
  public dropletsCtx!: CanvasRenderingContext2D;
  public dropletsCounter: number = 0;
  public dropletsPixelDensity: number = 1;

  public drops!: DropType[];
  public dropsGfx!: HTMLCanvasElement[];
  public clearDropletsGfx!: HTMLCanvasElement;
  public textureCleaningIterations: number = 0;
  public lastRender: number | null = null;
  private animId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(
    width: number,
    height: number,
    scale: number,
    dropAlpha: HTMLCanvasElement | HTMLImageElement,
    dropColor: HTMLCanvasElement | HTMLImageElement,
    options: Partial<RaindropsOptions> = {}
  ) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.dropAlpha = dropAlpha;
    this.dropColor = dropColor;
    this.options = Object.assign({}, defaultOptions, options);
    this.init();
  }

  private init(): void {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d")!;

    this.droplets = createCanvas(
      this.width * this.dropletsPixelDensity,
      this.height * this.dropletsPixelDensity
    );
    this.dropletsCtx = this.droplets.getContext("2d")!;

    this.drops = [];
    this.dropsGfx = [];

    this.renderDropsGfx();
    this.update();
  }

  public get deltaR(): number {
    const diff = this.options.maxR - this.options.minR;
    return diff <= 0 ? 1 : diff; // Prevents division by zero or negative delta
  }

  public get area(): number {
    return (this.width * this.height) / this.scale;
  }

  public get areaMultiplier(): number {
    return Math.sqrt(this.area / (1024 * 768));
  }

  public drawDroplet(x: number, y: number, r: number): void {
    const drop = createDefaultDrop({
      x: x * this.dropletsPixelDensity,
      y: y * this.dropletsPixelDensity,
      r: r * this.dropletsPixelDensity,
    });
    this.drawDrop(this.dropletsCtx, drop);
  }

  private renderDropsGfx(): void {
    const dropBuffer = createCanvas(dropSize, dropSize);
    const dropBufferCtx = dropBuffer.getContext("2d")!;
    
    this.dropsGfx = Array.from({ length: 255 }).map((_, i) => {
      const drop = createCanvas(dropSize, dropSize);
      const dropCtx = drop.getContext("2d")!;

      dropBufferCtx.clearRect(0, 0, dropSize, dropSize);

      // Draw color normal map
      dropBufferCtx.globalCompositeOperation = "source-over";
      dropBufferCtx.drawImage(this.dropColor, 0, 0, dropSize, dropSize);

      // Blue overlay, representing relative depth
      dropBufferCtx.globalCompositeOperation = "screen";
      dropBufferCtx.fillStyle = `rgba(0, 0, ${i}, 1)`;
      dropBufferCtx.fillRect(0, 0, dropSize, dropSize);

      // Apply alpha mask
      dropCtx.globalCompositeOperation = "source-over";
      dropCtx.drawImage(this.dropAlpha, 0, 0, dropSize, dropSize);

      dropCtx.globalCompositeOperation = "source-in";
      dropCtx.drawImage(dropBuffer, 0, 0, dropSize, dropSize);
      
      return drop;
    });

    // Create a circular brush to clean out background droplets as a drop glides
    this.clearDropletsGfx = createCanvas(128, 128);
    const clearDropletsCtx = this.clearDropletsGfx.getContext("2d")!;
    clearDropletsCtx.fillStyle = "#000";
    clearDropletsCtx.beginPath();
    clearDropletsCtx.arc(64, 64, 64, 0, Math.PI * 2);
    clearDropletsCtx.fill();
  }

  public drawDrop(ctx: CanvasRenderingContext2D, drop: DropType): void {
    if (this.dropsGfx.length > 0) {
      const x = drop.x;
      const y = drop.y;
      const r = drop.r;
      const spreadX = drop.spreadX;
      const spreadY = drop.spreadY;

      const scaleX = 1;
      const scaleY = 1.5;

      let d = Math.max(0, Math.min(1, ((r - this.options.minR) / this.deltaR) * 0.9));
      d *= 1 / ((drop.spreadX + drop.spreadY) * 0.5 + 1);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      const dIndex = Math.floor(d * (this.dropsGfx.length - 1));
      ctx.drawImage(
        this.dropsGfx[dIndex],
        (x - r * scaleX * (spreadX + 1)) * this.scale,
        (y - r * scaleY * (spreadY + 1)) * this.scale,
        r * 2 * scaleX * (spreadX + 1) * this.scale,
        r * 2 * scaleY * (spreadY + 1) * this.scale
      );
    }
  }

  public clearDroplets(x: number, y: number, r: number = 30): void {
    const ctx = this.dropletsCtx;
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(
      this.clearDropletsGfx,
      (x - r) * this.dropletsPixelDensity * this.scale,
      (y - r) * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale,
      r * 2 * this.dropletsPixelDensity * this.scale * 1.5
    );
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  public createDrop(options: Partial<DropType>): DropType | null {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) return null;
    return createDefaultDrop(options);
  }

  public addDrop(drop: DropType | null): boolean {
    if (drop === null) return false;
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) return false;
    this.drops.push(drop);
    return true;
  }

  public updateRain(timeScale: number): DropType[] {
    const rainDrops: DropType[] = [];
    if (this.options.raining) {
      const limit = this.options.rainLimit * timeScale * this.areaMultiplier;
      let count = 0;
      while (chance(this.options.rainChance * timeScale * this.areaMultiplier) && count < limit) {
        count++;
        const radiusMin = Math.min(this.options.minR, this.options.maxR);
        const radiusMax = Math.max(this.options.minR, this.options.maxR);
        const r = random(radiusMin, radiusMax, (n) => {
          return Math.pow(n, 3);
        });
        const rainDrop = this.createDrop({
          x: random(this.width / this.scale),
          y: random(
            (this.height / this.scale) * this.options.spawnArea[0],
            (this.height / this.scale) * this.options.spawnArea[1]
          ),
          r: r,
          momentum: 1 + (r - this.options.minR) * 0.1 + random(2),
          spreadX: 1.5,
          spreadY: 1.5,
        });
        if (rainDrop != null) {
          rainDrops.push(rainDrop);
        }
      }
    }
    return rainDrops;
  }

  public clearDrops(): void {
    this.drops.forEach((drop) => {
      setTimeout(() => {
        // Slow natural evaporation (approximately 5-10 seconds to fully clear)
        drop.shrink = 0.015 + random(0.03);
      }, random(3000));
    });
    this.clearTexture();
  }

  public clearTexture(): void {
    this.textureCleaningIterations = 50;
  }

  public updateDroplets(timeScale: number): void {
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= 1 * timeScale;
      this.dropletsCtx.globalCompositeOperation = "destination-out";
      this.dropletsCtx.fillStyle = "rgba(0,0,0," + 0.05 * timeScale + ")";
      this.dropletsCtx.fillRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity
      );
    }
    const currentEvapRate = this.options.evaporationRate || 0;
    if (currentEvapRate > 0 || !this.options.raining) {
      const baseAlpha = (!this.options.raining ? 0.001 : 0);
      const targetAlpha = ((0.0005 * currentEvapRate) + baseAlpha) * timeScale;
      // Probabilistic erasure for alphas below the 8-bit precision threshold (~0.004)
      if (Math.random() < targetAlpha / 0.01) {
        this.dropletsCtx.globalCompositeOperation = "destination-out";
        this.dropletsCtx.fillStyle = "rgba(0,0,0,0.01)";
        this.dropletsCtx.fillRect(
          0,
          0,
          this.width * this.dropletsPixelDensity,
          this.height * this.dropletsPixelDensity
        );
      }
    }
    if (this.options.raining) {
      this.dropletsCounter += this.options.dropletsRate * timeScale * this.areaMultiplier;
      times(this.dropletsCounter, () => {
        this.dropletsCounter--;
        this.drawDroplet(
          random(this.width / this.scale),
          random(this.height / this.scale),
          random(this.options.dropletsSize[0], this.options.dropletsSize[1], (n) => {
            return n * n;
          })
        );
      });
    }
    this.ctx.drawImage(this.droplets, 0, 0, this.width, this.height);
  }

  public updateDrops(timeScale: number): void {
    let newDrops: DropType[] = [];

    this.updateDroplets(timeScale);
    const rainDrops = this.updateRain(timeScale);
    newDrops = newDrops.concat(rainDrops);

    // Sort drops top-to-bottom for painter's drawing order consistency
    this.drops.sort((a, b) => {
      const va = a.y * (this.width / this.scale) + a.x;
      const vb = b.y * (this.width / this.scale) + b.x;
      return va > vb ? 1 : va === vb ? 0 : -1;
    });

    this.drops.forEach((drop, i) => {
      if (!drop.killed) {
        // Drop creeping gravity down simulation
        if (
          chance(
            (drop.r - this.options.minR) *
              (0.1 / this.deltaR) *
              timeScale *
              this.options.dropFallMultiplier
          )
        ) {
          drop.momentum += random((drop.r / this.options.maxR) * 4);
        }
        // Auto shrinking clean up
        if (this.options.autoShrink) {
          const shrinkRate = (drop.r <= this.options.minR + 2 ? 0.05 : 0.015) * (drop.evapFactor || 1);
          drop.shrink += shrinkRate * timeScale;
        }

        // Custom continuous evaporation for all active drops
        const baseEvap = this.options.autoShrink ? 0.001 : 0.0002;
        // Apply evaporation smoothly if rate > 0 OR if not raining (drying mode)
        if ((this.options.evaporationRate && this.options.evaporationRate > 0) || !this.options.raining) {
          const evapFactor = drop.evapFactor || 1;
          const currentEvapRate = ((this.options.evaporationRate || 0.1) * 0.003 + baseEvap) * evapFactor;
          
          // Shrink asymptotically for softer disappearance, and linearly for final removal
          drop.r -= currentEvapRate * timeScale * (drop.r * 0.15 + 0.05); 
        }

        drop.r -= drop.shrink * timeScale;
        if (drop.r <= 0) drop.killed = true;

        // Leave trailing trail drops behind
        if (this.options.raining) {
          drop.lastSpawn += drop.momentum * timeScale * this.options.trailRate;
          if (drop.lastSpawn > drop.nextSpawn) {
            const tempDx = drop.momentumX + (drop.momentum * this.options.windVelocity * 1.2);
            const tempDy = drop.momentum;
            const velLength = Math.max(1.0, Math.sqrt(tempDx * tempDx + tempDy * tempDy));
            const nx = tempDx / velLength;
            const ny = tempDy / velLength;

            const trailDrop = this.createDrop({
              x: drop.x - (nx * drop.r * 0.8) + random(-drop.r, drop.r) * 0.1,
              y: drop.y - (ny * drop.r * 0.8),
              r: drop.r * random(this.options.trailScaleRange[0], this.options.trailScaleRange[1]),
              spreadY: drop.momentum * 0.1,
              parent: drop,
            });

            if (trailDrop != null) {
              newDrops.push(trailDrop);
              drop.r *= Math.pow(0.97, timeScale);
              drop.lastSpawn = 0;
              drop.nextSpawn =
                random(this.options.minR, this.options.maxR) -
                drop.momentum * 2 * this.options.trailRate +
                (this.options.maxR - drop.r);
            }
          }
        }

        // Normalize stretch/spread over time
        drop.spreadX *= Math.pow(0.4, timeScale);
        drop.spreadY *= Math.pow(0.7, timeScale);

        // Update position based on momentum
        const moved = drop.momentum > 0 || Math.abs(drop.momentumX) > 0;
        if (moved && !drop.killed) {
          drop.y += drop.momentum * this.options.globalTimeScale;
          drop.x += (drop.momentumX + (drop.momentum * this.options.windVelocity * 1.2)) * this.options.globalTimeScale; 
          if (drop.y > this.height / this.scale + drop.r) {
            drop.killed = true;
          }
          if (drop.x > this.width / this.scale + drop.r || drop.x < -drop.r) {
            drop.killed = true;
          }
        }

        // Collision cascading sweeps
        const checkCollision = (moved || drop.isNew) && !drop.killed;
        drop.isNew = false;

        if (checkCollision) {
          this.drops.slice(i + 1, i + 70).forEach((drop2) => {
            if (
              drop !== drop2 &&
              drop.r > drop2.r &&
              drop.parent !== drop2 &&
              drop2.parent !== drop &&
              !drop2.killed
            ) {
              const dx = drop2.x - drop.x;
              const dy = drop2.y - drop.y;
              const d = Math.sqrt(dx * dx + dy * dy);

              const collisionThreshold =
                (drop.r + drop2.r) *
                (this.options.collisionRadius +
                  drop.momentum * this.options.collisionRadiusIncrease * timeScale);

              if (d < collisionThreshold) {
                const pi = Math.PI;
                const r1 = drop.r;
                const r2 = drop2.r;
                const a1 = pi * (r1 * r1);
                const a2 = pi * (r2 * r2);
                let targetR = Math.sqrt((a1 + a2 * 0.8) / pi);
                if (targetR > this.options.maxR) {
                  targetR = this.options.maxR;
                }
                drop.r = targetR;
                drop.momentumX += dx * 0.1;
                drop.spreadX = 0;
                drop.spreadY = 0;
                drop2.killed = true;
                drop.momentum = Math.max(
                  drop2.momentum,
                  Math.min(
                    40,
                    drop.momentum +
                      targetR * this.options.collisionBoostMultiplier +
                      this.options.collisionBoost
                  )
                );
              }
            }
          });
        }

        // Slowdown friction momentum
        drop.momentum -= Math.max(1, this.options.minR * 0.5 - drop.momentum) * 0.1 * timeScale;
        if (drop.momentum < 0) drop.momentum = 0;
        drop.momentumX *= Math.pow(0.7, timeScale);

        if (!drop.killed) {
          newDrops.push(drop);
          if (moved && this.options.dropletsRate > 0) {
            this.clearDroplets(
              drop.x,
              drop.y,
              drop.r * this.options.dropletsCleaningRadiusMultiplier
            );
          }
          this.drawDrop(this.ctx, drop);
        }
      }
    });

    this.drops = newDrops;
  }

  public update(): void {
    if (this.isDestroyed) return;
    this.clearCanvas();

    const now = Date.now();
    if (this.lastRender === null) this.lastRender = now;
    const deltaT = now - this.lastRender;
    let timeScale = deltaT / ((1 / 60) * 1000);
    if (timeScale > 1.1) timeScale = 1.1;
    timeScale *= this.options.globalTimeScale;
    this.lastRender = now;

    this.updateDrops(timeScale);

    this.animId = requestAnimationFrame(this.update.bind(this));
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
  }
}
