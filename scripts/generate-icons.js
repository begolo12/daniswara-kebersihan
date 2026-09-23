import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw image data with 1 byte filter per scanline
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Background gradient: Blue (#2563eb to #1d4ed8)
      const grad = y / height;
      let r = Math.round(37 * (1 - grad) + 29 * grad);
      let g = Math.round(99 * (1 - grad) + 78 * grad);
      let b = Math.round(235 * (1 - grad) + 216 * grad);
      let a = 255;

      // Inner card drawing:
      // Clipboard rectangle in center
      const pad = isMaskable ? width * 0.22 : width * 0.16;
      const cardX1 = pad;
      const cardX2 = width - pad;
      const cardY1 = pad + (isMaskable ? 0 : 5);
      const cardY2 = height - pad;

      if (x >= cardX1 && x <= cardX2 && y >= cardY1 && y <= cardY2) {
        // white card body
        r = 255; g = 255; b = 255;

        // Clipboard top clip
        const clipW = (cardX2 - cardX1) * 0.36;
        const clipX1 = cx - clipW / 2;
        const clipX2 = cx + clipW / 2;
        const clipH = (cardY2 - cardY1) * 0.12;

        if (x >= clipX1 && x <= clipX2 && y <= cardY1 + clipH) {
          r = 30; g = 64; b = 175; // deep blue clip
        } else {
          // Checkmark line 1
          const checkY1 = cardY1 + (cardY2 - cardY1) * 0.35;
          const checkY2 = cardY1 + (cardY2 - cardY1) * 0.55;
          const checkY3 = cardY1 + (cardY2 - cardY1) * 0.75;
          
          const iconLeft = cardX1 + (cardX2 - cardX1) * 0.15;
          const lineLeft = cardX1 + (cardX2 - cardX1) * 0.32;
          const lineRight = cardX2 - (cardX2 - cardX1) * 0.15;

          // Lines
          if (x >= lineLeft && x <= lineRight) {
            if (Math.abs(y - checkY1) < width * 0.015) { r = 100; g = 116; b = 139; }
            if (Math.abs(y - checkY2) < width * 0.015) { r = 100; g = 116; b = 139; }
            if (Math.abs(y - checkY3) < width * 0.015) { r = 16; g = 185; b = 129; } // green
          }

          // Green check mark box at row 3
          if (Math.abs(x - iconLeft) < width * 0.04 && Math.abs(y - checkY3) < width * 0.04) {
            r = 16; g = 185; b = 129; // emerald 500
          }
          // Blue check mark box at row 1
          if (Math.abs(x - iconLeft) < width * 0.04 && Math.abs(y - checkY1) < width * 0.04) {
            r = 37; g = 99; b = 235; // blue
          }
          // Blue check mark box at row 2
          if (Math.abs(x - iconLeft) < width * 0.04 && Math.abs(y - checkY2) < width * 0.04) {
            r = 37; g = 99; b = 235; // blue
          }
        }
      }

      // Sparkle near top right
      const spX = width * 0.82;
      const spY = height * 0.18;
      const distSp = Math.sqrt((x - spX)**2 + (y - spY)**2);
      if (distSp < width * 0.05) {
        r = 254; g = 240; b = 138; // yellow sparkle
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Generate files
const pwa192 = generatePNG(192, 192, false);
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = generatePNG(512, 512, false);
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const pwaMaskable = generatePNG(512, 512, true);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable);

const appleTouch = generatePNG(180, 180, false);
fs.writeFileSync('public/apple-touch-icon.png', appleTouch);

// Copy 192 as favicon.ico
fs.writeFileSync('public/favicon.ico', pwa192);

console.log('Successfully generated all PWA icons!');
