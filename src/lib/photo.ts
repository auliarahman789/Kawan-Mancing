function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => rej(new Error("Foto tidak bisa dibaca"));
    img.src = url;
  });
}

/** Kecilkan ke maks 1280px + JPEG, turunkan kualitas sampai <= ~350 KB. Menghapus EXIF (GPS/kamera) demi privasi. */
export async function compress(file: Blob, max = 1280, target = 350_000): Promise<Blob> {
  const img = await loadImage(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const enc = (q: number) =>
    new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal kompres foto"))), "image/jpeg", q));
  let q = 0.8;
  let out = await enc(q);
  while (out.size > target && q > 0.5) { q -= 0.1; out = await enc(q); }
  return out;
}

export async function sha256(blob: Blob): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** dHash 64-bit (string "0101..."): tahan terhadap kompres ulang / resize. */
export async function dhash(blob: Blob): Promise<string> {
  const img = await loadImage(blob);
  const c = document.createElement("canvas");
  c.width = 9; c.height = 8;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, 9, 8);
  const d = ctx.getImageData(0, 0, 9, 8).data;
  const g = (x: number, y: number) => { const i = (y * 9 + x) * 4; return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; };
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += g(x, y) > g(x + 1, y) ? "1" : "0";
  return bits;
}

export const getPosition = () =>
  new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, () => rej(new Error("Aktifkan GPS/lokasi untuk menyimpan tangkapan")), {
      enableHighAccuracy: true, timeout: 15000,
    }));
