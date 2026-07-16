export interface ImageSrcConfig {
  name: string;
  src: string;
  img?: HTMLImageElement;
}

export function loadImage(
  src: string | ImageSrcConfig,
  i: number,
  onLoad?: (img: HTMLImageElement, idx: number) => void
): Promise<ImageSrcConfig> {
  return new Promise((resolve) => {
    let config: ImageSrcConfig;
    if (typeof src === "string") {
      config = {
        name: "image" + i,
        src,
      };
    } else {
      config = src;
    }

    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed for WebGL cross-origin textures
    config.img = img;
    img.addEventListener("load", () => {
      if (typeof onLoad === "function") {
        onLoad(img, i);
      }
      resolve(config);
    });
    img.src = config.src;
  });
}

export function loadImages(
  images: Array<string | ImageSrcConfig>,
  onLoad?: (img: HTMLImageElement, idx: number) => void
): Promise<ImageSrcConfig[]> {
  return Promise.all(
    images.map((src, i) => loadImage(src, i, onLoad))
  );
}

export default function ImageLoader(
  images: Array<string | ImageSrcConfig>,
  onLoad?: (img: HTMLImageElement, idx: number) => void
): Promise<Record<string, { img: HTMLImageElement; src: string }>> {
  return new Promise((resolve) => {
    loadImages(images, onLoad).then((loadedImages) => {
      const r: Record<string, { img: HTMLImageElement; src: string }> = {};
      loadedImages.forEach((curImage) => {
        if (curImage.img) {
          r[curImage.name] = {
            img: curImage.img,
            src: curImage.src,
          };
        }
      });
      resolve(r);
    });
  });
}
