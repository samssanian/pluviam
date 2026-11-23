import { LocationConfig, TimePalette } from '../types/rain';

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function drawSkyAndCelestial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: TimePalette,
  cloudDarkness: number,
  lightningFlash: number
) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.85);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(0.55, palette.skyMid);
  skyGrad.addColorStop(1, palette.skyHorizon);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Overcast storm darkening
  if (cloudDarkness > 0.05) {
    ctx.fillStyle = `rgba(8, 14, 28, ${cloudDarkness * 0.56})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Celestial body (sun / moon)
  const cx = palette.celestialType === 'high-sun' ? w * 0.55 : palette.celestialType === 'golden-sun' ? w * 0.72 : w * 0.78;
  const cy = palette.celestialType === 'high-sun' ? h * 0.16 : palette.celestialType === 'golden-sun' ? h * 0.42 : h * 0.22;
  const baseRadius = Math.min(w, h) * (palette.celestialType === 'moon' ? 0.045 : 0.065);
  const visibility = Math.max(0.12, 1 - cloudDarkness * 0.88);

  ctx.save();
  ctx.globalAlpha = visibility;
  const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 5.2);
  glowGrad.addColorStop(0, palette.celestialColor);
  glowGrad.addColorStop(0.28, palette.celestialGlow);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.celestialColor;
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lightning ambient sky illumination
  if (lightningFlash > 0.01) {
    ctx.fillStyle = `rgba(218, 232, 255, ${lightningFlash * 0.52})`;
    ctx.fillRect(0, 0, w, h);
  }
}

export function renderLocationScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  location: LocationConfig,
  palette: TimePalette,
  timeSec: number,
  wind: number,
  lightningFlash: number,
  isMini = false
) {
  const groundY = h * location.groundLevel;
  const isNight = palette.id === 'night';
  const isAfternoon = palette.id === 'afternoon';
  const warmGlowAlpha = isNight ? 0.92 : isAfternoon ? 0.62 : 0.18;
  const sway = Math.sin(timeSec * 1.4) * (4 + Math.abs(wind) * 14) + wind * 12;
  const rand = seededRand(hashString(location.id));

  // Silhouette tone helper based on time mode
  const farTone = isNight
    ? 'rgba(14, 24, 46, 0.88)'
    : isAfternoon
      ? 'rgba(78, 52, 74, 0.62)'
      : 'rgba(64, 96, 128, 0.52)';
  const midTone = isNight
    ? 'rgba(8, 15, 32, 0.95)'
    : isAfternoon
      ? 'rgba(48, 34, 54, 0.85)'
      : 'rgba(34, 58, 82, 0.78)';
  const nearTone = isNight
    ? '#050a18'
    : isAfternoon
      ? '#211828'
      : '#162838';

  const drawGlowOrb = (x: number, y: number, r: number, color: string, alpha: number) => {
    if (alpha <= 0.03) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.35, color.replace('1)', '0.45)').replace('rgb(', 'rgba('));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Helper: Draw Pine Tree
  const drawPine = (x: number, baseY: number, height: number, color: string, swayAmt = 0) => {
    ctx.fillStyle = color;
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const tierY = baseY - (height * (t * 0.2));
      const tierH = height * (0.42 - t * 0.04);
      const tierW = height * (0.28 - t * 0.045);
      const tipX = x + swayAmt * ((t + 1) / tiers);
      ctx.beginPath();
      ctx.moveTo(tipX, tierY - tierH);
      ctx.lineTo(x - tierW, tierY);
      ctx.lineTo(x + tierW, tierY);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Helper: Draw Mountain Range
  const drawMountains = (baseY: number, maxH: number, peaks: number, color: string, seedOffset: number) => {
    const r = seededRand(hashString(location.id) + seedOffset);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY - r() * maxH * 0.4);
    for (let i = 1; i <= peaks; i++) {
      const px = (w / peaks) * i;
      const py = baseY - (0.25 + r() * 0.75) * maxH;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };

  // ------------------------------------------------------------------
  // 26 DISTINCT PROCEDURAL LOCATIONS
  // ------------------------------------------------------------------
  switch (location.id) {
    case 'dense-forest': {
      drawMountains(groundY, h * 0.25, 6, farTone, 1);
      const count = isMini ? 14 : 26;
      for (let i = 0; i < count; i++) {
        const px = (i / (count - 1)) * w + (rand() - 0.5) * 30;
        const ph = h * (0.24 + rand() * 0.28);
        drawPine(px, groundY + 6, ph, i % 2 === 0 ? midTone : nearTone, sway * 0.4);
      }
      break;
    }

    case 'rainforest': {
      drawMountains(groundY, h * 0.22, 5, farTone, 2);
      // Tall tropical trunks & broad canopy silhouettes
      const trunks = isMini ? 8 : 16;
      for (let i = 0; i < trunks; i++) {
        const tx = (i / (trunks - 1)) * w + (rand() - 0.5) * 35;
        const th = h * (0.34 + rand() * 0.26);
        const topX = tx + sway * 0.35;
        ctx.fillStyle = i % 2 === 0 ? midTone : nearTone;
        ctx.fillRect(tx - 4, groundY - th, 8, th + 10);
        // Canopy crown
        ctx.beginPath();
        ctx.ellipse(topX, groundY - th, w * 0.08, h * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(topX - w * 0.04, groundY - th + h * 0.03, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'bamboo-forest': {
      const stalks = isMini ? 16 : 36;
      for (let i = 0; i < stalks; i++) {
        const bx = (i / stalks) * w + rand() * 24;
        const depth = rand();
        const bw = 3 + depth * 5;
        const bend = sway * (0.4 + depth * 0.8);
        ctx.strokeStyle = depth > 0.5 ? nearTone : midTone;
        ctx.lineWidth = bw;
        ctx.beginPath();
        ctx.moveTo(bx, groundY + 8);
        ctx.quadraticCurveTo(bx + bend * 0.5, groundY - h * 0.4, bx + bend, -10);
        ctx.stroke();

        // Bamboo nodes
        if (!isMini && depth > 0.4) {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          for (let seg = 1; seg <= 5; seg++) {
            const sy = groundY - seg * (h * 0.14);
            const sx = bx + bend * (seg / 6);
            ctx.beginPath();
            ctx.moveTo(sx - bw, sy);
            ctx.lineTo(sx + bw, sy);
            ctx.stroke();
          }
        }
      }
      // Stone lantern on right
      const lx = w * 0.78;
      ctx.fillStyle = nearTone;
      ctx.fillRect(lx - 6, groundY - 38, 12, 38);
      ctx.fillRect(lx - 14, groundY - 48, 28, 10);
      ctx.beginPath();
      ctx.moveTo(lx - 18, groundY - 48);
      ctx.lineTo(lx, groundY - 62);
      ctx.lineTo(lx + 18, groundY - 48);
      ctx.fill();
      drawGlowOrb(lx, groundY - 42, 46, 'rgba(255, 200, 110, 1)', warmGlowAlpha);
      break;
    }

    case 'village': {
      drawMountains(groundY, h * 0.28, 5, farTone, 4);
      const cottages = isMini ? 4 : 7;
      for (let i = 0; i < cottages; i++) {
        const cx = w * (0.1 + i * (0.8 / cottages)) + (rand() - 0.5) * 20;
        const cw = w * (0.075 + rand() * 0.03);
        const ch = h * (0.09 + rand() * 0.05);
        ctx.fillStyle = i % 2 === 0 ? nearTone : midTone;
        ctx.fillRect(cx - cw / 2, groundY - ch, cw, ch);
        // Pitched roof
        ctx.beginPath();
        ctx.moveTo(cx - cw * 0.65, groundY - ch);
        ctx.lineTo(cx, groundY - ch - ch * 0.65);
        ctx.lineTo(cx + cw * 0.65, groundY - ch);
        ctx.closePath();
        ctx.fill();
        // Warm window
        if (warmGlowAlpha > 0.1) {
          ctx.fillStyle = `rgba(255, 205, 115, ${warmGlowAlpha})`;
          ctx.fillRect(cx - cw * 0.16, groundY - ch * 0.65, cw * 0.32, ch * 0.32);
          drawGlowOrb(cx, groundY - ch * 0.5, 42, 'rgba(255, 185, 90, 1)', warmGlowAlpha * 0.55);
        }
      }
      break;
    }

    case 'rice-field-village': {
      drawMountains(groundY - h * 0.06, h * 0.24, 6, farTone, 5);
      // Terraced steps
      for (let t = 0; t < 4; t++) {
        const ty = groundY - t * (h * 0.035);
        ctx.fillStyle = t % 2 === 0 ? midTone : farTone;
        ctx.fillRect(0, ty, w, 4);
      }
      // Stilted hut
      const hx = w * 0.28;
      ctx.fillStyle = nearTone;
      ctx.fillRect(hx - 26, groundY - 46, 4, 46);
      ctx.fillRect(hx + 22, groundY - 46, 4, 46);
      ctx.fillRect(hx - 34, groundY - 76, 68, 32);
      ctx.beginPath();
      ctx.moveTo(hx - 48, groundY - 76);
      ctx.lineTo(hx, groundY - 108);
      ctx.lineTo(hx + 48, groundY - 76);
      ctx.fill();
      if (warmGlowAlpha > 0.15) {
        ctx.fillStyle = `rgba(255, 200, 100, ${warmGlowAlpha})`;
        ctx.fillRect(hx - 10, groundY - 66, 20, 14);
        drawGlowOrb(hx, groundY - 60, 56, 'rgba(255, 180, 80, 1)', warmGlowAlpha * 0.5);
      }
      break;
    }

    case 'small-town': {
      const buildings = isMini ? 7 : 12;
      for (let i = 0; i < buildings; i++) {
        const bw = w / buildings;
        const bx = i * bw;
        const bh = h * (0.14 + rand() * 0.14);
        ctx.fillStyle = i % 2 === 0 ? nearTone : midTone;
        ctx.fillRect(bx + 2, groundY - bh, bw - 3, bh);
        // Clock tower on index 3
        if (i === Math.floor(buildings * 0.35)) {
          ctx.fillRect(bx + bw * 0.2, groundY - bh - h * 0.12, bw * 0.6, h * 0.12);
          ctx.beginPath();
          ctx.moveTo(bx + bw * 0.15, groundY - bh - h * 0.12);
          ctx.lineTo(bx + bw * 0.5, groundY - bh - h * 0.2);
          ctx.lineTo(bx + bw * 0.85, groundY - bh - h * 0.12);
          ctx.fill();
          drawGlowOrb(bx + bw * 0.5, groundY - bh - h * 0.06, 22, 'rgba(255, 225, 160, 1)', warmGlowAlpha);
        }
        // Storefront lights
        if (warmGlowAlpha > 0.1) {
          ctx.fillStyle = `rgba(255, 210, 130, ${warmGlowAlpha * 0.8})`;
          ctx.fillRect(bx + bw * 0.2, groundY - 26, bw * 0.6, 18);
        }
      }
      break;
    }

    case 'old-town-bazaar': {
      // Stone archways & awnings
      const arches = isMini ? 4 : 7;
      const aw = w / arches;
      ctx.fillStyle = midTone;
      ctx.fillRect(0, groundY - h * 0.32, w, h * 0.32);
      for (let i = 0; i < arches; i++) {
        const ax = i * aw + aw * 0.5;
        ctx.fillStyle = nearTone;
        ctx.fillRect(i * aw, groundY - h * 0.28, aw * 0.16, h * 0.28);
        // Glowing interior arch
        ctx.fillStyle = isNight ? 'rgba(255, 168, 76, 0.22)' : 'rgba(255, 200, 140, 0.18)';
        ctx.beginPath();
        ctx.arc(ax, groundY - h * 0.13, aw * 0.32, Math.PI, 0);
        ctx.lineTo(ax + aw * 0.32, groundY);
        ctx.lineTo(ax - aw * 0.32, groundY);
        ctx.closePath();
        ctx.fill();
        // Hanging lantern
        drawGlowOrb(ax, groundY - h * 0.18, 34, 'rgba(255, 175, 85, 1)', warmGlowAlpha);
      }
      break;
    }

    case 'modern-city': {
      const towers = isMini ? 10 : 20;
      for (let i = 0; i < towers; i++) {
        const tw = w / towers;
        const tx = i * tw;
        const th = h * (0.22 + rand() * 0.42);
        const depth = i % 3;
        ctx.fillStyle = depth === 0 ? farTone : depth === 1 ? midTone : nearTone;
        ctx.fillRect(tx, groundY - th, tw * 0.92, th);
        // Lit office windows
        if (!isMini && (isNight || isAfternoon)) {
          ctx.fillStyle = isNight ? 'rgba(186, 230, 253, 0.35)' : 'rgba(255, 214, 153, 0.32)';
          const rows = Math.floor(th / 16);
          for (let r = 1; r < rows; r++) {
            for (let c = 0; c < 3; c++) {
              if (rand() > 0.48) {
                ctx.fillRect(tx + 6 + c * (tw * 0.25), groundY - th + r * 14, tw * 0.16, 6);
              }
            }
          }
        }
      }
      break;
    }

    case 'neon-cyber-city': {
      const towers = isMini ? 9 : 18;
      const neonColors = ['rgba(232, 121, 249, 1)', 'rgba(34, 211, 238, 1)', 'rgba(244, 63, 94, 1)', 'rgba(56, 189, 248, 1)'];
      for (let i = 0; i < towers; i++) {
        const tw = w / towers;
        const tx = i * tw;
        const th = h * (0.28 + rand() * 0.44);
        ctx.fillStyle = i % 2 === 0 ? nearTone : midTone;
        ctx.fillRect(tx, groundY - th, tw * 0.9, th);
        const nc = neonColors[i % neonColors.length];
        const neonAlpha = isNight ? 0.9 : isAfternoon ? 0.65 : 0.45;
        // Vertical neon sign strip
        ctx.fillStyle = nc.replace('1)', `${neonAlpha})`);
        ctx.fillRect(tx + tw * 0.15, groundY - th * 0.72, 4, th * 0.35);
        // Horizontal billboard
        if (i % 3 === 0) {
          ctx.fillRect(tx + 4, groundY - th * 0.4, tw * 0.7, 8);
        }
        drawGlowOrb(tx + tw * 0.4, groundY - th * 0.45, 58, nc, neonAlpha * 0.45);
      }
      break;
    }

    case 'japanese-alley': {
      // Narrow framing buildings left & right with vanishing alley center
      ctx.fillStyle = nearTone;
      ctx.fillRect(0, 0, w * 0.26, groundY);
      ctx.fillRect(w * 0.74, 0, w * 0.26, groundY);
      ctx.fillStyle = midTone;
      ctx.fillRect(w * 0.26, h * 0.28, w * 0.14, groundY - h * 0.28);
      ctx.fillRect(w * 0.6, h * 0.28, w * 0.14, groundY - h * 0.28);

      // Hanging paper chochin lanterns
      const lanterns = [
        [w * 0.25, h * 0.42],
        [w * 0.75, h * 0.42],
        [w * 0.38, h * 0.52],
        [w * 0.62, h * 0.52],
      ];
      for (const [lx, ly] of lanterns) {
        drawGlowOrb(lx, ly, 55, 'rgba(251, 113, 133, 1)', isNight ? 0.85 : 0.45);
        ctx.fillStyle = 'rgba(255, 110, 130, 0.9)';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Cyan sign on right
      drawGlowOrb(w * 0.78, h * 0.6, 55, 'rgba(34, 211, 238, 1)', isNight ? 0.65 : 0.3);
      break;
    }

    case 'mountain-valley': {
      drawMountains(groundY, h * 0.44, 7, farTone, 11);
      drawMountains(groundY, h * 0.3, 5, midTone, 22);
      drawMountains(groundY + 12, h * 0.16, 4, nearTone, 33);
      break;
    }

    case 'waterfall-canyon': {
      // Left & right steep basalt cliffs
      ctx.fillStyle = nearTone;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w * 0.38, h * 0.3);
      ctx.lineTo(w * 0.32, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, h * 0.22);
      ctx.lineTo(w * 0.62, h * 0.32);
      ctx.lineTo(w * 0.68, groundY);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Cascading animated waterfall ribbons in center
      const wfX = w * 0.42;
      const wfW = w * 0.16;
      const wfGrad = ctx.createLinearGradient(0, h * 0.3, 0, groundY);
      wfGrad.addColorStop(0, 'rgba(186, 230, 253, 0.55)');
      wfGrad.addColorStop(1, 'rgba(224, 242, 254, 0.85)');
      ctx.fillStyle = wfGrad;
      ctx.fillRect(wfX, h * 0.3, wfW, groundY - h * 0.3);

      // Animated white streaks inside waterfall
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      for (let s = 0; s < (isMini ? 4 : 8); s++) {
        const sx = wfX + ((s + 0.5) / (isMini ? 4 : 8)) * wfW;
        const offset = ((timeSec * 160 + s * 45) % (groundY - h * 0.3));
        ctx.beginPath();
        ctx.moveTo(sx, h * 0.3 + offset * 0.3);
        ctx.lineTo(sx, Math.min(groundY, h * 0.3 + offset + 35));
        ctx.stroke();
      }
      break;
    }

    case 'lakeside': {
      drawMountains(groundY, h * 0.24, 6, farTone, 13);
      for (let i = 0; i < (isMini ? 8 : 16); i++) {
        drawPine(w * (0.04 + i * 0.06), groundY + 4, h * (0.1 + rand() * 0.1), midTone, sway * 0.2);
      }
      // Wooden dock extending from lower left
      ctx.fillStyle = nearTone;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.88);
      ctx.lineTo(w * 0.36, groundY + 14);
      ctx.lineTo(w * 0.4, groundY + 18);
      ctx.lineTo(w * 0.08, h * 0.96);
      ctx.closePath();
      ctx.fill();
      drawGlowOrb(w * 0.36, groundY + 6, 42, 'rgba(255, 195, 105, 1)', warmGlowAlpha);
      break;
    }

    case 'river-bank': {
      drawMountains(groundY, h * 0.18, 5, farTone, 14);
      // Weeping willows on left & right banks
      const drawWillow = (wx: number, wy: number, size: number) => {
        ctx.fillStyle = nearTone;
        ctx.fillRect(wx - 5, wy - size * 0.7, 10, size * 0.7);
        ctx.beginPath();
        ctx.arc(wx, wy - size * 0.75, size * 0.42, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = nearTone;
        ctx.lineWidth = 2;
        for (let b = -4; b <= 4; b++) {
          ctx.beginPath();
          ctx.moveTo(wx + b * (size * 0.09), wy - size * 0.72);
          ctx.quadraticCurveTo(
            wx + b * (size * 0.1) + sway * 0.5,
            wy - size * 0.35,
            wx + b * (size * 0.11) + sway,
            wy - size * 0.05
          );
          ctx.stroke();
        }
      };
      drawWillow(w * 0.16, groundY + 10, h * 0.32);
      drawWillow(w * 0.84, groundY + 6, h * 0.26);
      break;
    }

    case 'beach': {
      // Distant sea horizon & rolling surf lines
      ctx.fillStyle = farTone;
      ctx.fillRect(0, groundY - 6, w, 10);
      // Sweeping wet sand curve
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 2.5;
      const waveShift = Math.sin(timeSec * 1.1) * 10;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 14 + waveShift * 0.4);
      ctx.bezierCurveTo(w * 0.3, groundY + 6 + waveShift, w * 0.7, groundY + 24 - waveShift, w, groundY + 12);
      ctx.stroke();
      break;
    }

    case 'harbor-lighthouse': {
      // Rocky headland + tall striped lighthouse on right
      const lhx = w * 0.76;
      ctx.fillStyle = nearTone;
      ctx.beginPath();
      ctx.moveTo(w * 0.58, groundY + 10);
      ctx.lineTo(w * 0.72, groundY - 24);
      ctx.lineTo(w, groundY - 18);
      ctx.lineTo(w, groundY + 15);
      ctx.closePath();
      ctx.fill();

      // Tower
      ctx.beginPath();
      ctx.moveTo(lhx - 16, groundY - 20);
      ctx.lineTo(lhx - 9, groundY - h * 0.32);
      ctx.lineTo(lhx + 9, groundY - h * 0.32);
      ctx.lineTo(lhx + 16, groundY - 20);
      ctx.closePath();
      ctx.fill();

      // Lantern room + sweeping light beam
      const lampY = groundY - h * 0.34;
      const beamAngle = Math.sin(timeSec * 0.65) * 0.32 - 0.1;
      ctx.save();
      ctx.translate(lhx, lampY);
      ctx.rotate(beamAngle);
      const beamGrad = ctx.createLinearGradient(0, 0, -w * 0.65, 0);
      beamGrad.addColorStop(0, `rgba(254, 240, 138, ${isNight ? 0.42 : 0.16})`);
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-w * 0.65, -h * 0.14);
      ctx.lineTo(-w * 0.65, h * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawGlowOrb(lhx, lampY, 36, 'rgba(254, 240, 138, 1)', isNight ? 0.95 : 0.5);
      break;
    }

    case 'desert-oasis': {
      // Rolling sand dunes
      ctx.fillStyle = farTone;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(w * 0.28, groundY - h * 0.16, w * 0.6, groundY - h * 0.04);
      ctx.quadraticCurveTo(w * 0.85, groundY - h * 0.18, w, groundY - h * 0.06);
      ctx.lineTo(w, groundY + 10);
      ctx.lineTo(0, groundY + 10);
      ctx.fill();

      // Date palms curving over spring
      const drawPalm = (px: number, py: number, lean: number, ph: number) => {
        ctx.strokeStyle = nearTone;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const topX = px + lean + sway * 0.5;
        const topY = py - ph;
        ctx.quadraticCurveTo(px + lean * 0.3, py - ph * 0.5, topX, topY);
        ctx.stroke();

        ctx.fillStyle = nearTone;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + sway * 0.01;
          ctx.beginPath();
          ctx.ellipse(topX + Math.cos(ang) * 24, topY + Math.sin(ang) * 14, 28, 6, ang, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawPalm(w * 0.24, groundY + 4, 28, h * 0.28);
      drawPalm(w * 0.34, groundY + 6, -18, h * 0.22);
      break;
    }

    case 'autumn-street': {
      // Maple trees in amber/rust + iron streetlamps
      const lamps = isMini ? 2 : 4;
      for (let i = 0; i < (isMini ? 5 : 9); i++) {
        const tx = w * (0.08 + i * 0.11);
        const th = h * (0.2 + rand() * 0.12);
        ctx.fillStyle = nearTone;
        ctx.fillRect(tx - 4, groundY - th, 8, th);
        ctx.fillStyle = isNight ? 'rgba(124, 45, 18, 0.72)' : 'rgba(194, 65, 12, 0.75)';
        ctx.beginPath();
        ctx.arc(tx + sway * 0.2, groundY - th, th * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let l = 0; l < lamps; l++) {
        const lx = w * ((l + 0.5) / lamps);
        ctx.fillStyle = nearTone;
        ctx.fillRect(lx - 2, groundY - h * 0.22, 4, h * 0.22);
        drawGlowOrb(lx, groundY - h * 0.22, 50, 'rgba(255, 185, 95, 1)', warmGlowAlpha);
      }
      break;
    }

    case 'snow-village': {
      drawMountains(groundY, h * 0.28, 6, farTone, 19);
      for (let i = 0; i < (isMini ? 4 : 6); i++) {
        const cx = w * (0.12 + i * 0.15);
        const cw = w * 0.08;
        const ch = h * 0.11;
        ctx.fillStyle = nearTone;
        ctx.fillRect(cx - cw / 2, groundY - ch, cw, ch);
        // Snow-capped roof
        ctx.fillStyle = 'rgba(226, 240, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(cx - cw * 0.7, groundY - ch);
        ctx.lineTo(cx, groundY - ch - ch * 0.7);
        ctx.lineTo(cx + cw * 0.7, groundY - ch);
        ctx.closePath();
        ctx.fill();
        drawGlowOrb(cx, groundY - ch * 0.5, 42, 'rgba(255, 200, 110, 1)', warmGlowAlpha);
      }
      break;
    }

    case 'temple-courtyard': {
      // Multi-tiered curved pagoda roof silhouette
      const px = w * 0.5;
      ctx.fillStyle = nearTone;
      for (let tier = 0; tier < 3; tier++) {
        const ty = groundY - h * (0.1 + tier * 0.1);
        const tw = w * (0.28 - tier * 0.06);
        ctx.fillRect(px - tw * 0.55, ty, tw * 1.1, h * 0.1);
        ctx.beginPath();
        ctx.moveTo(px - tw * 0.9, ty + 4);
        ctx.quadraticCurveTo(px, ty - h * 0.06, px + tw * 0.9, ty + 4);
        ctx.lineTo(px + tw * 0.6, ty + 14);
        ctx.lineTo(px - tw * 0.6, ty + 14);
        ctx.closePath();
        ctx.fill();
      }
      drawGlowOrb(px - w * 0.12, groundY - 26, 44, 'rgba(255, 165, 95, 1)', warmGlowAlpha);
      drawGlowOrb(px + w * 0.12, groundY - 26, 44, 'rgba(255, 165, 95, 1)', warmGlowAlpha);
      break;
    }

    case 'castle-bridge': {
      drawMountains(groundY - h * 0.08, h * 0.28, 5, farTone, 21);
      // Citadel towers on left
      ctx.fillStyle = midTone;
      ctx.fillRect(w * 0.08, groundY - h * 0.34, w * 0.12, h * 0.34);
      ctx.fillRect(w * 0.22, groundY - h * 0.26, w * 0.09, h * 0.26);
      // Arched bridge across midground
      ctx.fillStyle = nearTone;
      ctx.fillRect(0, groundY - h * 0.14, w, h * 0.05);
      const arches = 4;
      for (let a = 0; a < arches; a++) {
        const ax = (w / arches) * (a + 0.5);
        ctx.fillRect(ax - w * 0.025, groundY - h * 0.1, w * 0.05, h * 0.11);
        drawGlowOrb(ax, groundY - h * 0.16, 32, 'rgba(255, 195, 110, 1)', warmGlowAlpha * 0.8);
      }
      break;
    }

    case 'train-station': {
      // Platform canopy rafters & distant train headlamp
      ctx.fillStyle = nearTone;
      ctx.fillRect(0, h * 0.26, w * 0.45, 12);
      ctx.fillRect(w * 0.12, h * 0.26, 8, groundY - h * 0.26);
      ctx.fillRect(w * 0.36, h * 0.26, 8, groundY - h * 0.26);
      // Perspective rails
      ctx.strokeStyle = 'rgba(180, 210, 240, 0.32)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.65, groundY);
      ctx.lineTo(w * 0.52, groundY - h * 0.04);
      ctx.moveTo(w * 0.85, groundY);
      ctx.lineTo(w * 0.58, groundY - h * 0.04);
      ctx.stroke();
      // Signal & platform glow
      drawGlowOrb(w * 0.24, h * 0.32, 60, 'rgba(224, 242, 254, 1)', isNight ? 0.78 : 0.3);
      drawGlowOrb(w * 0.56, groundY - h * 0.08, 42, 'rgba(56, 189, 248, 1)', 0.75);
      break;
    }

    case 'rooftop-cafe': {
      // Distant skyline behind cafe terrace
      for (let i = 0; i < (isMini ? 8 : 14); i++) {
        const bw = w / (isMini ? 8 : 14);
        ctx.fillStyle = farTone;
        ctx.fillRect(i * bw, groundY - h * (0.12 + rand() * 0.18), bw * 0.85, h * 0.3);
      }
      // Left cafe awning & bistro string lights
      ctx.fillStyle = nearTone;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      ctx.lineTo(w * 0.44, h * 0.42);
      ctx.lineTo(0, h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(w * 0.38, h * 0.42, 6, groundY - h * 0.42);
      // String light bulbs across upper frame
      const bulbs = isMini ? 5 : 9;
      for (let b = 0; b < bulbs; b++) {
        const bx = w * (0.42 + (b / bulbs) * 0.55);
        const by = h * 0.42 + Math.sin((b / bulbs) * Math.PI) * 28;
        drawGlowOrb(bx, by, 30, 'rgba(253, 210, 125, 1)', warmGlowAlpha);
      }
      break;
    }

    case 'bus-stop': {
      // Illuminated glass shelter on left
      const sx = w * 0.18;
      const sw = w * 0.34;
      const sh = h * 0.3;
      ctx.fillStyle = nearTone;
      ctx.fillRect(sx, groundY - sh, sw, 8);
      ctx.fillRect(sx + 6, groundY - sh, 6, sh);
      ctx.fillRect(sx + sw - 12, groundY - sh, 6, sh);
      // Warm backlit ad panel
      ctx.fillStyle = isNight ? 'rgba(186, 230, 253, 0.35)' : 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(sx + sw - 42, groundY - sh + 16, 26, sh - 26);
      drawGlowOrb(sx + sw * 0.5, groundY - sh + 18, 85, 'rgba(186, 230, 253, 1)', isNight ? 0.72 : 0.26);
      break;
    }

    case 'park-garden': {
      // Wrought-iron gazebo & soft rounded garden shrubs
      const gx = w * 0.52;
      ctx.fillStyle = midTone;
      for (let s = 0; s < 8; s++) {
        ctx.beginPath();
        ctx.arc(w * (0.06 + s * 0.13), groundY, 26 + rand() * 24, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = nearTone;
      ctx.fillRect(gx - 38, groundY - h * 0.22, 4, h * 0.22);
      ctx.fillRect(gx + 34, groundY - h * 0.22, 4, h * 0.22);
      ctx.beginPath();
      ctx.arc(gx, groundY - h * 0.22, 48, Math.PI, 0);
      ctx.fill();
      drawGlowOrb(gx, groundY - h * 0.18, 45, 'rgba(255, 210, 130, 1)', warmGlowAlpha);
      break;
    }

    case 'countryside-road':
    default: {
      drawMountains(groundY, h * 0.18, 5, farTone, 26);
      // Timber fence posts on left & right
      ctx.fillStyle = nearTone;
      for (let p = 0; p < (isMini ? 4 : 8); p++) {
        const px = w * (0.05 + p * 0.045);
        ctx.fillRect(px, groundY - 22, 3, 24);
      }
      ctx.fillRect(w * 0.04, groundY - 14, w * 0.34, 2);
      break;
    }
  }

  // Horizon volumetric mist band
  const mistGrad = ctx.createLinearGradient(0, groundY - h * 0.14, 0, groundY + 12);
  mistGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mistGrad.addColorStop(0.65, palette.fogColor);
  mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, groundY - h * 0.14, w, h * 0.16);

  // Ground / Wet Reflective Surface
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
  groundGrad.addColorStop(0, location.hasWaterSurface ? palette.waterTint : palette.groundTint);
  groundGrad.addColorStop(0.35, palette.groundTint);
  groundGrad.addColorStop(1, '#020611');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, w, h - groundY);

  // Subtle horizon reflection sheen
  if (location.reflectionStrength > 0.3) {
    const sheenAlpha = location.reflectionStrength * (isNight ? 0.32 : 0.26);
    const sheen = ctx.createLinearGradient(0, groundY, 0, h);
    sheen.addColorStop(0, palette.waterTint);
    sheen.addColorStop(0.45, `rgba(255,255,255,${sheenAlpha * 0.28})`);
    sheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Neon / lantern vertical mirror streaks on wet pavement
    if ((location.hasNeonLights || location.hasWarmLanterns) && !isMini) {
      const cols = location.hasNeonLights
        ? ['rgba(232, 121, 249, 0.22)', 'rgba(34, 211, 238, 0.22)', 'rgba(251, 146, 60, 0.2)']
        : ['rgba(255, 195, 105, 0.22)'];
      for (let i = 0; i < 7; i++) {
        const rx = w * (0.12 + i * 0.13);
        const rw = 10 + (i % 3) * 8;
        const rh = (h - groundY) * (0.45 + (i % 2) * 0.3);
        const wobble = Math.sin(timeSec * 3 + i) * 3;
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(rx + wobble, groundY + 4, rw, rh);
      }
    }
  }
}
