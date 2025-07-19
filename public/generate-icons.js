// Simple script to create PNG icons from SVG
const fs = require('fs');

// Create a better quality PNG icon using Canvas API simulation
const createPngIcon = (size, filename) => {
  // Create a simple PNG header for a solid colored icon
  // This is a basic approach - in production you'd use proper SVG to PNG conversion
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2E5A87;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2B3E54;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="url(#gradient)" stroke="#1e293b" stroke-width="4"/>
      
      <!-- Chat bubble -->
      <path d="M${size*0.3} ${size*0.35} C${size*0.3} ${size*0.25}, ${size*0.4} ${size*0.2}, ${size*0.5} ${size*0.2} L${size*0.7} ${size*0.2} C${size*0.8} ${size*0.2}, ${size*0.9} ${size*0.25}, ${size*0.9} ${size*0.35} L${size*0.9} ${size*0.5} C${size*0.9} ${size*0.6}, ${size*0.8} ${size*0.65}, ${size*0.7} ${size*0.65} L${size*0.55} ${size*0.65} L${size*0.45} ${size*0.75} L${size*0.5} ${size*0.65} L${size*0.5} ${size*0.65} C${size*0.4} ${size*0.65}, ${size*0.3} ${size*0.6}, ${size*0.3} ${size*0.5} Z" fill="white" opacity="0.9"/>
      
      <!-- Lock icon -->
      <rect x="${size*0.42}" y="${size*0.38}" width="${size*0.16}" height="${size*0.12}" rx="2" fill="#2E5A87"/>
      <path d="M${size*0.45} ${size*0.38} C${size*0.45} ${size*0.34}, ${size*0.47} ${size*0.32}, ${size*0.5} ${size*0.32} C${size*0.53} ${size*0.32}, ${size*0.55} ${size*0.34}, ${size*0.55} ${size*0.38}" stroke="#2E5A87" stroke-width="2" fill="none"/>
    </svg>
  `;
  
  // For now, we'll use the SVG directly as the icon
  // In a real production app, you'd convert this to PNG using a proper library
  fs.writeFileSync(filename, canvas);
  console.log(`Generated ${filename} (${size}x${size})`);
};

// Generate icons
createPngIcon(192, 'icon-192-generated.svg');
createPngIcon(512, 'icon-512-generated.svg');

console.log('Icon generation complete!');