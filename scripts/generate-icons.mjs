import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

// Read the SVG file
const svgBuffer = readFileSync(join(publicDir, 'openai_logo.svg'));

// Icon sizes to generate
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192-maskable.png', padding: 20 },
  { size: 512, name: 'icon-512-maskable.png', padding: 50 },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
];

console.log('Generating PWA icons...\n');

async function generateIcons() {
  for (const { size, name, padding = 0 } of sizes) {
    try {
      const outputPath = join(publicDir, name);

      if (padding > 0) {
        // For maskable icons, add padding
        await sharp(svgBuffer)
          .resize(size - (padding * 2), size - (padding * 2))
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 156, g: 39, b: 176, alpha: 1 } // #9c27b0
          })
          .png()
          .toFile(outputPath);
      } else {
        // Regular icons
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);
      }

      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✓ Icon generation complete!');
}

generateIcons().catch(console.error);
