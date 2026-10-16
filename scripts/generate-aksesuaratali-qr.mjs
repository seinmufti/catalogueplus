import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = "https://www.nordlyssolutions.com/catalogueplus/aksesuaratali";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = path.join(root, "public", "aksesuarat-ali-logo.png");
const outPath = path.join(root, "public", "aksesuarat-ali-catalogue-qr.png");

const size = 1200;
const qrBuffer = await QRCode.toBuffer(url, {
  errorCorrectionLevel: "H",
  type: "png",
  width: size,
  margin: 2,
  color: { dark: "#111111", light: "#ffffff" },
});

const logoSize = Math.round(size * 0.22);
const logoPad = Math.round(size * 0.025);
const logo = await sharp(logoPath)
  .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({
    top: logoPad,
    bottom: logoPad,
    left: logoPad,
    right: logoPad,
    background: "#ffffff",
  })
  .png()
  .toBuffer();

await sharp(qrBuffer)
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(outPath);

console.log(outPath);
