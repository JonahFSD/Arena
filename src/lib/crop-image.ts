import type { Area } from "react-easy-crop";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.src = url;
  });
}

/** Renders the cropped region to a JPEG data URL (max edge length `maxPx`). */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxPx = 512
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const { width: cw, height: ch } = pixelCrop;
  const scale = Math.min(maxPx / cw, maxPx / ch, 1);
  const outW = Math.max(1, Math.round(cw * scale));
  const outH = Math.max(1, Math.round(ch * scale));

  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}
