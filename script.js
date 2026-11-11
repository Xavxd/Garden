const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
canvas.width = windowWidth;
canvas.height = windowHeight;
ctx.imageSmoothingEnabled = false;

let skyHeight = canvas.height * 0.7;
let groundHeight = canvas.height * 0.3;
const pSize = 4;

// Control del tiempo (0 = Noche, 0.25 = Amanecer, 0.5 = Día, 0.75 = Atardecer)
let timeProgress = 0.0;
const timeSpeed = 60.0005;

// Estrellas estáticas
let stars = [];
function generateStars() {
  stars = [];
  const numStars = Math.floor((canvas.width * skyHeight) / 1500);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * (skyHeight - 20)),
      size: Math.random() > 0.8 ? pSize : pSize / 2,
      alphaBase: Math.random() * 0.7 + 0.3
    });
  }
}

// Nubes
const clouds = [
  { x: canvas.width * 0.10, y: skyHeight * 0.15, speed: 0.2, scale: 6 },
  { x: canvas.width * 0.50, y: skyHeight * 0.30, speed: 0.3, scale: 5.5 },
  { x: canvas.width * 0.70, y: skyHeight * 0.10, speed: 0.15, scale: 4.5 }
];

// --- SPRITES Y CAPA ESTÁTICA DE PRADERA (PASTO + FLORES) ---
let staticLayerCanvas = document.createElement('canvas');
let staticLayerCtx = staticLayerCanvas.getContext('2d');

function createPixelFlowerSprite(petalColor, centerColor, size) {
  const fCanvas = document.createElement('canvas');
  const fCtx = fCanvas.getContext('2d');
  fCtx.imageSmoothingEnabled = false;

  const widthPixels = 7;
  const heightPixels = 5;
  fCanvas.width = widthPixels * size;
  fCanvas.height = heightPixels * size;

  const gC = '#14521a'; 
  const pC = petalColor; 
  const cC = centerColor; 

  const flowerMap = [
    [0, 0, 3, 3, 3, 0, 0],
    [0, 3, 3, 4, 3, 3, 0],
    [3, 3, 4, 4, 4, 3, 3],
    [0, 3, 3, 4, 3, 3, 0],
    [0, 0, 1, 1, 1, 0, 0]
  ];

  const colorTable = { 1: gC, 3: pC, 4: cC };

  for (let r = 0; r < flowerMap.length; r++) {
    for (let c = 0; c < flowerMap[r].length; c++) {
      const colorCode = flowerMap[r][c];
      if (colorCode > 0) {
        fCtx.fillStyle = colorTable[colorCode];
        fCtx.fillRect(c * size, r * size, size, size);
      }
    }
  }
  return fCanvas;
}

function renderStaticGround() {
  staticLayerCanvas.width = canvas.width;
  staticLayerCanvas.height = groundHeight;
  staticLayerCtx.imageSmoothingEnabled = false;

  // 1. Base del suelo
  staticLayerCtx.fillStyle = '#062811';
  staticLayerCtx.fillRect(0, 0, staticLayerCanvas.width, groundHeight);

  // 2. Textura de pasto
  const grassPalette = ['#0b3b17', '#14521a', '#228b22', '#32cd32', '#76c442'];
  const numGrass = Math.floor((staticLayerCanvas.width / pSize) * 10);
  for (let i = 0; i < numGrass; i++) {
    staticLayerCtx.fillStyle = grassPalette[Math.floor(Math.random() * grassPalette.length)];
    const x = Math.floor(Math.random() * (staticLayerCanvas.width / pSize)) * pSize;
    const y = Math.floor(Math.random() * (groundHeight / pSize)) * pSize;
    const h = Math.floor(Math.random() * 4) * pSize + pSize;
    staticLayerCtx.fillRect(x, y, pSize, h);
  }

  // 3. Generar flores
  const flowerPink = createPixelFlowerSprite('#e866b1', '#ffd900', pSize * 2);
  const flowerBlue = createPixelFlowerSprite('#a3dae4', '#ffd900', pSize * 2);

  const cols = Math.floor(staticLayerCanvas.width / 40); 
  const rows = 3;  
  const cellWidth = staticLayerCanvas.width / cols;
  const cellHeight = groundHeight / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.4) {
        const offsetX = Math.random() * Math.max(0, cellWidth - flowerPink.width);
        const offsetY = Math.random() * Math.max(0, cellHeight - flowerPink.height);

        const x = (c * cellWidth) + offsetX;
        const y = (r * cellHeight) + offsetY;

        const sprite = Math.random() > 0.5 ? flowerPink : flowerBlue;
        staticLayerCtx.drawImage(sprite, x, y);
      }
    }
  }
}

// --- INTERPOLACIÓN DE COLOR PARA EL CIELO ---
function hexToRgb(hex) {
  let bigint = parseInt(hex.replace('#', ''), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function lerpColor(color1, color2, factor) {
  let c1 = hexToRgb(color1);
  let c2 = hexToRgb(color2);
  let r = c1.r + factor * (c2.r - c1.r);
  let g = c1.g + factor * (c2.g - c1.g);
  let b = c1.b + factor * (c2.b - c1.b);
  return rgbToHex(r, g, b);
}

function getSkyColors(t) {
  let topColor, bottomColor;

  if (t < 0.2) {
    topColor = '#0a0a16';
    bottomColor = '#1b1b3a';
  } else if (t >= 0.2 && t < 0.3) {
    let f = (t - 0.2) / 0.1;
    topColor = lerpColor('#1b1b3a', '#283c86', f);
    bottomColor = lerpColor('#1b1b3a', '#f9d423', f);
  } else if (t >= 0.3 && t < 0.6) {
    topColor = '#2980b9';
    bottomColor = '#6dd5fa';
  } else if (t >= 0.6 && t < 0.75) {
    let f = (t - 0.6) / 0.15;
    topColor = lerpColor('#2980b9', '#41295a', f);
    bottomColor = lerpColor('#6dd5fa', '#ff7e5f', f);
  } else if (t >= 0.75 && t < 0.85) {
    let f = (t - 0.75) / 0.1;
    topColor = lerpColor('#41295a', '#0a0a16', f);
    bottomColor = lerpColor('#ff7e5f', '#0a0a16', f);
  } else {
    topColor = '#0a0a16';
    bottomColor = '#0a0a16';
  }

  return { top: topColor, bottom: bottomColor };
}

// --- RENDERING AUXILIAR DE ELEMENTOS EN CANVAS ---
function drawPixelCloud(context, cx, cy, pixelSize) {
  const cloudMap = [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
  ];
  const colors = { 1: '#d8e1f5', 2: '#8b9fc7' };
  for (let r = 0; r < cloudMap.length; r++) {
    for (let c = 0; c < cloudMap[r].length; c++) {
      const code = cloudMap[r][c];
      if (code > 0) {
        context.fillStyle = colors[code];
        context.fillRect(Math.floor(cx + (c * pixelSize)), Math.floor(cy + (r * pixelSize)), pixelSize, pixelSize);
      }
    }
  }
}

function drawPixelMoon(context, cx, cy, radiusInPixels, pixelSize) {
  context.fillStyle = '#fffdf0';
  for (let y = -radiusInPixels; y <= radiusInPixels; y++) {
    for (let x = -radiusInPixels; x <= radiusInPixels; x++) {
      const distOuter = Math.sqrt(x * x + y * y);
      const distInner = Math.sqrt((x - radiusInPixels * 0.4) ** 2 + (y - radiusInPixels * 0.1) ** 2);
      if (distOuter <= radiusInPixels && distInner > radiusInPixels * 0.7) {
        context.fillRect(cx + (x * pixelSize), cy + (y * pixelSize), pixelSize, pixelSize);
      }
    }
  }
}

// --- BUCLE PRINCIPAL ---
function animate() {
  timeProgress = (timeProgress + timeSpeed) % 1.0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Dibujar Degradado del Cielo
  const colors = getSkyColors(timeProgress);
  const cieloGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
  cieloGradient.addColorStop(0.0, colors.top);
  cieloGradient.addColorStop(1.0, colors.bottom);
  ctx.fillStyle = cieloGradient;
  ctx.fillRect(0, 0, canvas.width, skyHeight);

  // 2. Estrellas
  let starAlphaFactor = 0;
  if (timeProgress < 0.2) {
    starAlphaFactor = 1.0 - (timeProgress / 0.2);
  } else if (timeProgress > 0.8) {
    starAlphaFactor = (timeProgress - 0.8) / 0.2;
  }

  if (starAlphaFactor > 0) {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
      ctx.globalAlpha = star.alphaBase * starAlphaFactor;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1.0;
  }

  // 3. Sol y Luna
  const sunAngle = timeProgress * Math.PI * 2;
  const sunX = canvas.width / 2 + Math.cos(sunAngle - Math.PI/2) * (canvas.width * 0.45);
  const sunY = skyHeight / 2 - Math.sin(sunAngle - Math.PI/2) * (skyHeight * 0.6);

  if (sunY < skyHeight + 50) {
   drawDetailedPixelSun(ctx, sunX, sunY, pSize);
  }

  const moonAngle = sunAngle + Math.PI;
  const moonX = canvas.width / 2 + Math.cos(moonAngle - Math.PI/2) * (canvas.width * 0.45);
  const moonY = skyHeight / 2 - Math.sin(moonAngle - Math.PI/2) * (skyHeight * 0.6);

  if (moonY < skyHeight + 50) {
    drawPixelMoon(ctx, moonX, moonY, 10, 3);
  }

  // 4. Nubes
  let cloudAlpha = (timeProgress > 0.25 && timeProgress < 0.75) ? 0.8 : 0.5;
  ctx.globalAlpha = cloudAlpha;
  clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x > canvas.width + 100) cloud.x = -150;
    drawPixelCloud(ctx, cloud.x, cloud.y, cloud.scale);
  });
  ctx.globalAlpha = 1.0;

  // 5. Dibujar la capa estática del Suelo (Pasto + Flores)
  ctx.drawImage(staticLayerCanvas, 0, skyHeight);

  requestAnimationFrame(animate);
}

// --- INICIALIZACIÓN Y EVENTOS ---
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  skyHeight = canvas.height * 0.7;
  groundHeight = canvas.height * 0.3;
  ctx.imageSmoothingEnabled = false;

  generateStars();
  renderStaticGround();
});

// --- NUEVA FUNCIÓN AUXILIAR PARA EL SOL DETALLADO ---
// cx, cy: Centro del sol. pixelSize: Tamaño de cada bloque.
function drawDetailedPixelSun(context, cx, cy, pixelSize) {
  // 1. Matriz para el cuerpo central del Sol (el círculo)
  // 1 = Color del cuerpo del sol
  const sunBodyMap = [
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
  ];

  const bodyColor = '#fcd424'; // Color amarillo principal
  const rayColor = '#f09c24';  // Color naranja para los rayos

  // Dibujar el cuerpo central
  context.fillStyle = bodyColor;
  // Calculamos la esquina superior izquierda de la matriz para centrarla en cx, cy
  const bodyOffsetX = cx - (sunBodyMap[0].length * pixelSize) / 2;
  const bodyOffsetY = cy - (sunBodyMap.length * pixelSize) / 2;

  for (let r = 0; r < sunBodyMap.length; r++) {
    for (let c = 0; c < sunBodyMap[r].length; c++) {
      if (sunBodyMap[r][c] === 1) {
        context.fillRect(
          Math.floor(bodyOffsetX + (c * pixelSize)),
          Math.floor(bodyOffsetY + (r * pixelSize)),
          pixelSize, pixelSize
        );
      }
    }
  }

  // 2. Dibujar los 8 rayos alrededor
  // Cada rayo es un bloque de 2x2.
  // Los colocamos matemáticamente usando seno y coseno.
  const numRays = 8;
  const rayRadius = (sunBodyMap.length / 2) * pixelSize + pixelSize * 2.5; // Distancia desde el centro

  context.fillStyle = rayColor;
  for (let i = 0; i < numRays; i++) {
    // Calculamos el ángulo para cada rayo (separados 45 grados)
    const angle = (i / numRays) * Math.PI * 2;
    // Posición del centro del rayo
    const rx = cx + Math.cos(angle) * rayRadius;
    const ry = cy + Math.sin(angle) * rayRadius;

    // Dibujar el bloque de 2x2 centrado en rx, ry
    const rayOffsetX = rx - pixelSize;
    const rayOffsetY = ry - pixelSize;
    
    // Matriz implícita de 2x2 para el rayo
    for (let rr = 0; rr < 2; rr++) {
        for (let rc = 0; rc < 2; rc++) {
            context.fillRect(
                Math.floor(rayOffsetX + rc * pixelSize),
                Math.floor(rayOffsetY + rr * pixelSize),
                pixelSize, pixelSize
            );
        }
    }
  }
}

generateStars();
renderStaticGround();
animate();