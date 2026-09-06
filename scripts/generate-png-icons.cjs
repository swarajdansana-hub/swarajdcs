const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  // RGBA buffer with filter byte at start of each line
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.45 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep emerald background
      let r = 6;
      let g = 78;
      let b = 59;
      let a = 255;

      // Inner milk droplet / can representation
      if (dist < radius) {
        // Milk can / emblem shape
        const canWidth = radius * 0.55;
        const canTop = cy - radius * 0.65;
        const canBottom = cy + radius * 0.65;

        if (Math.abs(dx) < canWidth && y > canTop && y < canBottom) {
          // White milk can body
          r = 245;
          g = 248;
          b = 250;
          
          // Center green droplet badge
          const dropDx = dx;
          const dropDy = y - (cy + radius * 0.1);
          const dropDist = Math.sqrt(dropDx * dropDx + dropDy * dropDy);
          if (dropDist < radius * 0.22) {
            r = 16;
            g = 185;
            b = 129; // bright emerald
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate 192x192, 512x512, 512x512 maskable, and 180x180 apple-touch-icon
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), generatePNG(192));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), generatePNG(512));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), generatePNG(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePNG(180));

console.log('Successfully generated PWA and Apple touch icons in /public!');
