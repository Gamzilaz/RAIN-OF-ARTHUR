import createCanvas from "./create-canvas";

export function generateDropAlpha(): HTMLCanvasElement {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d")!;
  
  // Clear to transparent
  ctx.clearRect(0, 0, 64, 64);
  
  // Radial gradient matching droplet density falloff
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.15, "rgba(255, 255, 255, 0.95)");
  grad.addColorStop(0.4, "rgba(255, 255, 255, 0.7)");
  grad.addColorStop(0.7, "rgba(255, 255, 255, 0.25)");
  grad.addColorStop(0.9, "rgba(255, 255, 255, 0.05)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

export function generateDropColor(): HTMLCanvasElement {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(64, 64);
  const data = imgData.data;
  
  const cx = 32;
  const cy = 32;
  const rMax = 30;
  
  for (let py = 0; py < 64; py++) {
    for (let px = 0; px < 64; px++) {
      const idx = (py * 64 + px) * 4;
      
      const dx = (px - cx) / rMax;
      const dy = (py - cy) / rMax;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= 1.0) {
        // Circle interior: spherical droplet hemisphere normal vector
        const dz = Math.sqrt(1.0 - distSq);
        
        // Normal vectors: nx, ny in [-1, 1], nz in [0, 1]
        const nx = dx;
        const ny = dy;
        const nz = dz;
        
        // Red = y normal (dy direction), Green = x normal (dx direction), Blue = thickness
        const redVal = Math.floor((ny * 0.5 + 0.5) * 255);
        const greenVal = Math.floor((nx * 0.5 + 0.5) * 255);
        const blueVal = Math.floor(nz * 255);
        
        data[idx] = redVal;     // R
        data[idx + 1] = greenVal; // G
        data[idx + 2] = blueVal;  // B
        data[idx + 3] = 255;      // A
      } else {
        // Outside circular droplet radius: neutral flat normal state
        data[idx] = 128;     // R (midpoint)
        data[idx + 1] = 128; // G (midpoint)
        data[idx + 2] = 0;   // B (no height)
        data[idx + 3] = 255; // A
      }
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateDropShine(): HTMLCanvasElement {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d")!;
  
  ctx.clearRect(0, 0, 64, 64);
  
  // Specular water drops highlights (window shape shine glow)
  const grad1 = ctx.createRadialGradient(24, 24, 0, 24, 24, 10);
  grad1.addColorStop(0, "rgba(255, 255, 255, 0.70)");
  grad1.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
  grad1.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(24, 24, 10, 0, Math.PI * 2);
  ctx.fill();
  
  const grad2 = ctx.createRadialGradient(42, 42, 0, 42, 42, 5);
  grad2.addColorStop(0, "rgba(255, 255, 255, 0.35)");
  grad2.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(42, 42, 5, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}
