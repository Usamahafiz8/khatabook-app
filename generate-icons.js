const svg2img = require('svg2img');
const fs = require('fs');
const path = require('path');

const svgFile = path.join(__dirname, 'app_icon_source.svg');

// Android icon sizes needed
const sizes = [
  // mdpi - baseline 160dpi
  { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'mipmap-mdpi/ic_launcher_round.png', size: 48 },
  
  // hdpi - 240dpi
  { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'mipmap-hdpi/ic_launcher_round.png', size: 72 },
  
  // xhdpi - 320dpi
  { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  
  // xxhdpi - 480dpi
  { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  
  // xxxhdpi - 640dpi
  { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { name: 'mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
];

const basePath = path.join(__dirname, 'android/app/src/main/res');

// Read SVG file
const svgContent = fs.readFileSync(svgFile, 'utf-8');

console.log('Generating app icons...');

sizes.forEach((config) => {
  const outputPath = path.join(basePath, config.name);
  const outputDir = path.dirname(outputPath);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Convert SVG to PNG
  svg2img(svgFile, {
    filename: outputPath,
    width: config.size,
    height: config.size,
  }, function(error) {
    if (error) {
      console.error(`Error generating ${config.name}:`, error);
    } else {
      console.log(`✓ Generated ${config.name} (${config.size}x${config.size})`);
    }
  });
});

console.log('\nIcon generation complete!');
