// Script to convert headshot to square and generate Tauri icons
import sharp from 'sharp';
import { readFile } from 'fs/promises';

const inputPath = '../../images/Henrypicture.jpg';
const outputPath = 'src-tauri/icons/icon-square.png';

try {
  console.log('📷 Processing image...');
  
  // Read image metadata to get dimensions
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.log(`Original size: ${metadata.width}x${metadata.height}`);
  
  // Calculate square crop (center crop)
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);
  
  // Crop to square and resize to 1024x1024 (recommended for Tauri icons)
  await image
    .extract({ left, top, width: size, height: size })
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Created square icon: ${outputPath}`);
  console.log('📦 Now generating Tauri icons...');
  console.log('Run: pnpm tauri icon src-tauri/icons/icon-square.png');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
