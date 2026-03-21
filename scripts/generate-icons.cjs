const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// UNIBUS 앱 아이콘 SVG (버스 + 텍스트)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#1e3a8a"/>

  <!-- Bus body -->
  <rect x="96" y="160" width="320" height="200" rx="24" fill="white"/>

  <!-- Bus roof accent -->
  <rect x="112" y="145" width="288" height="30" rx="12" fill="#3b82f6"/>

  <!-- Windows row -->
  <rect x="116" y="180" width="70" height="50" rx="8" fill="#bfdbfe"/>
  <rect x="206" y="180" width="70" height="50" rx="8" fill="#bfdbfe"/>
  <rect x="296" y="180" width="70" height="50" rx="8" fill="#bfdbfe"/>

  <!-- Door -->
  <rect x="210" y="250" width="92" height="80" rx="8" fill="#dbeafe"/>
  <line x1="256" y1="255" x2="256" y2="325" stroke="#93c5fd" stroke-width="3"/>

  <!-- Wheels -->
  <circle cx="160" cy="360" r="36" fill="#1e3a8a"/>
  <circle cx="160" cy="360" r="20" fill="#93c5fd"/>
  <circle cx="352" cy="360" r="36" fill="#1e3a8a"/>
  <circle cx="352" cy="360" r="20" fill="#93c5fd"/>

  <!-- Undercarriage -->
  <rect x="96" y="330" width="320" height="30" rx="0" fill="white"/>

  <!-- Headlight -->
  <rect x="96" y="240" width="16" height="32" rx="4" fill="#fef08a"/>
  <rect x="400" y="240" width="16" height="32" rx="4" fill="#fef08a"/>

  <!-- UNIBUS text -->
  <text x="256" y="460" font-family="Arial Black, sans-serif" font-size="56" font-weight="900"
    fill="white" text-anchor="middle" letter-spacing="2">UNIBUS</text>
</svg>
`;

// Maskable icon SVG (아이콘 영역이 더 작게 - safe zone)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#1e3a8a"/>

  <!-- Bus body (smaller for safe zone) -->
  <rect x="116" y="175" width="280" height="175" rx="20" fill="white"/>
  <rect x="130" y="162" width="252" height="26" rx="10" fill="#3b82f6"/>

  <!-- Windows -->
  <rect x="132" y="194" width="62" height="44" rx="7" fill="#bfdbfe"/>
  <rect x="216" y="194" width="62" height="44" rx="7" fill="#bfdbfe"/>
  <rect x="300" y="194" width="62" height="44" rx="7" fill="#bfdbfe"/>

  <!-- Door -->
  <rect x="220" y="260" width="72" height="68" rx="7" fill="#dbeafe"/>
  <line x1="256" y1="265" x2="256" y2="323" stroke="#93c5fd" stroke-width="2.5"/>

  <!-- Wheels -->
  <circle cx="172" cy="350" r="30" fill="#1e3a8a"/>
  <circle cx="172" cy="350" r="17" fill="#93c5fd"/>
  <circle cx="340" cy="350" r="30" fill="#1e3a8a"/>
  <circle cx="340" cy="350" r="17" fill="#93c5fd"/>
  <rect x="116" y="325" width="280" height="25" rx="0" fill="white"/>

  <!-- Headlights -->
  <rect x="116" y="248" width="14" height="28" rx="3" fill="#fef08a"/>
  <rect x="382" y="248" width="14" height="28" rx="3" fill="#fef08a"/>

  <text x="256" y="430" font-family="Arial Black, sans-serif" font-size="46" font-weight="900"
    fill="white" text-anchor="middle" letter-spacing="2">UNIBUS</text>
</svg>
`;

const publicDir = path.resolve(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 UNIBUS 앱 아이콘 생성 중...');

  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `pwa-${size}x${size}.png`));
    console.log(`  ✅ pwa-${size}x${size}.png`);
  }

  // Maskable icon (512x512)
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512-maskable.png'));
  console.log('  ✅ pwa-512x512-maskable.png');

  // Apple touch icon (180x180)
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  ✅ apple-touch-icon.png (180x180)');

  // Favicon (32x32)
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('  ✅ favicon.png (32x32)');

  console.log('🚌 아이콘 생성 완료!');
}

generateIcons().catch(console.error);
