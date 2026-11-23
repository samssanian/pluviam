import { DisasterScene } from '../data/disasterScenes';
import { LocationConfig, TimePalette } from '../types/rain';
import { drawSkyAndCelestial, renderLocationScene } from './sceneRenderer';

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawPersonSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  waving = false,
  timeSec = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(0, -24, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(0, -19);
  ctx.lineTo(0, -7);
  ctx.stroke();

  // Legs
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(-4, 4);
  ctx.moveTo(0, -7);
  ctx.lineTo(4, 4);
  ctx.stroke();

  // Arms
  ctx.lineWidth = 2.6;
  if (waving) {
    const wave = Math.sin(timeSec * 6 + x) * 4;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(-8, -26 + wave);
    ctx.moveTo(0, -17);
    ctx.lineTo(8, -27 - wave);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(-6, -9);
    ctx.moveTo(0, -17);
    ctx.lineTo(6, -9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRedCrossEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  pulse = 1
) {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2.2 * pulse);
  glow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
  glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  const arm = size * 0.55;
  const thick = size * 0.22;
  ctx.fillRect(-thick / 2, -arm, thick, arm * 2);
  ctx.fillRect(-arm, -thick / 2, arm * 2, thick);
  ctx.restore();
}

export function renderDisasterScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: DisasterScene,
  location: LocationConfig,
  palette: TimePalette,
  timeSec: number,
  windNorm: number,
  intensityNorm: number,
  lightningFlash: number,
  isMini = false
) {
  const rand = seededRand(scene.number * 997 + 31);
  const cloudDarkness = scene.hasSunrise
    ? 0.08
    : scene.severity === 'Catastrophic'
      ? 0.78
      : scene.severity === 'Severe'
        ? 0.6
        : 0.35;

  // 1. Sky & Celestial base
  drawSkyAndCelestial(ctx, w, h, palette, cloudDarkness, lightningFlash);

  // Special Sunrise glow for Scene 65
  if (scene.hasSunrise) {
    const sunGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    sunGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.35)');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0.12)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    const sunOrb = ctx.createRadialGradient(w * 0.5, h * 0.45, 4, w * 0.5, h * 0.45, Math.min(w, h) * 0.42);
    sunOrb.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
    sunOrb.addColorStop(0.25, 'rgba(253, 186, 116, 0.55)');
    sunOrb.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunOrb;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.45, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // Acid rain toxic chartreuse tint for scene 30
  if (scene.id === 'acid-corrosion') {
    ctx.fillStyle = 'rgba(132, 204, 22, 0.14)';
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Render base location or specialized aerial/hospital silhouette
  if (scene.id === 'aerial-flooded-city') {
    // High altitude grid of flooded city rooftops
    ctx.fillStyle = '#091324';
    ctx.fillRect(0, 0, w, h);
    const cols = isMini ? 6 : 12;
    const rows = isMini ? 4 : 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = (c + 0.18) * (w / cols) + rand() * 8;
        const by = h * 0.24 + r * (h * 0.11) + rand() * 6;
        const bw = (w / cols) * 0.58;
        const bh = h * 0.075;
        ctx.fillStyle = '#13223b';
        ctx.fillRect(bx, by, bw, bh);
        if (rand() > 0.72) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
          ctx.fillRect(bx + 3, by + 3, 4, 3);
        }
      }
    }
  } else {
    renderLocationScene(ctx, w, h, location, palette, timeSec, windNorm, lightningFlash, isMini);
  }

  // Blackout darkening for city-blackout
  if (scene.id === 'city-blackout') {
    ctx.fillStyle = 'rgba(2, 6, 18, 0.62)';
    ctx.fillRect(0, 0, w, h);
  }

  // 3. Water Surface Depth (Rising flood plane)
  const waterTopY = h * (1 - scene.waterDepth);
  const waveAmp = isMini ? 2.5 : 4.5 + intensityNorm * 4;

  // Floodwater base gradient
  const isMuddy = scene.id === 'muddy-current' || scene.id === 'sewage-overflow' || scene.hasLandslide;
  const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, h);
  if (isMuddy) {
    waterGrad.addColorStop(0, 'rgba(68, 52, 36, 0.86)');
    waterGrad.addColorStop(1, 'rgba(28, 22, 16, 0.96)');
  } else if (scene.hasSunrise) {
    waterGrad.addColorStop(0, 'rgba(245, 158, 11, 0.42)');
    waterGrad.addColorStop(0.4, 'rgba(30, 58, 95, 0.82)');
    waterGrad.addColorStop(1, 'rgba(12, 24, 48, 0.95)');
  } else {
    waterGrad.addColorStop(0, 'rgba(24, 48, 78, 0.78)');
    waterGrad.addColorStop(0.5, 'rgba(13, 28, 52, 0.9)');
    waterGrad.addColorStop(1, 'rgba(5, 13, 28, 0.97)');
  }

  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += Math.max(8, w / 28)) {
    const wy = waterTopY + Math.sin(x * 0.025 + timeSec * (2.6 + windNorm * 1.4)) * waveAmp;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = waterGrad;
  ctx.fill();

  // Flowing current streaks on water surface
  ctx.strokeStyle = scene.hasSunrise ? 'rgba(254, 243, 199, 0.25)' : 'rgba(186, 230, 253, 0.2)';
  ctx.lineWidth = isMini ? 1 : 1.5;
  const streakCount = isMini ? 6 : 16;
  for (let i = 0; i < streakCount; i++) {
    const sy = waterTopY + 8 + ((i * 23) % Math.max(18, h - waterTopY - 12));
    const speed = (28 + (i % 4) * 18) * (scene.id === 'flash-flood-wall' || scene.id === 'muddy-current' ? 2.2 : 1);
    const sx = ((rand() * w + timeSec * speed) % (w + 80)) - 40;
    const slen = (18 + rand() * 35) * (isMini ? 0.55 : 1);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + slen, sy + Math.sin(timeSec * 2 + i) * 1.5);
    ctx.stroke();
  }

  // 4. Scene-Specific Structural / Environmental Elements
  const scale = isMini ? 0.56 : 1;

  // Landslide mud wedge
  if (scene.hasLandslide) {
    ctx.fillStyle = 'rgba(72, 48, 30, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25);
    ctx.quadraticCurveTo(w * 0.35, h * 0.55, w * 0.72, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rolling boulders
    ctx.fillStyle = '#291d14';
    for (let b = 0; b < (isMini ? 5 : 10); b++) {
      const bx = w * (0.1 + (b * 0.06)) + Math.sin(timeSec * 3 + b) * 5;
      const by = h * (0.45 + b * 0.05);
      ctx.beginPath();
      ctx.arc(bx, by, (6 + (b % 3) * 4) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Collapsed or cracked structures (Bridge, Wall, Crane, Tree, Sinkhole)
  if (scene.id === 'bridge-submerged') {
    ctx.fillStyle = '#1e293b';
    // Left deck tilted down
    ctx.save();
    ctx.translate(w * 0.12, waterTopY - 12 * scale);
    ctx.rotate(0.18);
    ctx.fillRect(0, 0, w * 0.34, 14 * scale);
    ctx.restore();
    // Right deck tilted opposite
    ctx.save();
    ctx.translate(w * 0.88, waterTopY - 14 * scale);
    ctx.rotate(-0.22);
    ctx.fillRect(-w * 0.32, 0, w * 0.32, 14 * scale);
    ctx.restore();
  }

  if (scene.id === 'road-sinkhole') {
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, waterTopY + 12 * scale, w * 0.18, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (scene.id === 'tree-uprooted') {
    ctx.save();
    ctx.translate(w * 0.22, waterTopY + 4);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, -8 * scale, w * 0.45, 12 * scale);
    ctx.beginPath();
    ctx.arc(w * 0.44, -6 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (scene.id === 'crane-toppling') {
    ctx.save();
    ctx.translate(w * 0.55, waterTopY);
    ctx.rotate(0.45 + Math.sin(timeSec * 0.8) * 0.03);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(-8 * scale, -h * 0.55, 16 * scale, h * 0.55);
    ctx.beginPath();
    ctx.moveTo(-40 * scale, -h * 0.52);
    ctx.lineTo(80 * scale, -h * 0.52);
    ctx.stroke();
    ctx.restore();
  }

  // Rooftop survivors & Village underwater
  if (scene.id === 'village-underwater' || scene.id === 'rooftop-stranded' || scene.hasSunrise) {
    const roofs = [
      { x: w * 0.25, rw: 90 * scale, rh: 38 * scale },
      { x: w * 0.58, rw: 110 * scale, rh: 44 * scale },
      { x: w * 0.82, rw: 76 * scale, rh: 32 * scale },
    ];
    roofs.forEach((rf, idx) => {
      const ry = waterTopY + 8 * scale;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(rf.x - rf.rw / 2, ry);
      ctx.lineTo(rf.x, ry - rf.rh);
      ctx.lineTo(rf.x + rf.rw / 2, ry);
      ctx.closePath();
      ctx.fill();

      if (scene.id === 'rooftop-stranded' && idx < 2) {
        drawPersonSilhouette(ctx, rf.x - 8 * scale, ry - rf.rh * 0.65, scale * 0.85, '#f8fafc', true, timeSec);
        drawPersonSilhouette(ctx, rf.x + 10 * scale, ry - rf.rh * 0.55, scale * 0.72, '#e2e8f0', true, timeSec + 1);
      } else if (scene.hasSunrise && idx === 1) {
        drawPersonSilhouette(ctx, rf.x, ry - rf.rh * 0.75, scale * 0.85, '#fef3c7', false, timeSec);
      }
    });
  }

  // Boats (Rescue boat, Market boat, Medical boat)
  if (scene.hasBoat) {
    const bx = w * 0.45 + Math.sin(timeSec * 0.9) * (isMini ? 14 : 34);
    const by = waterTopY + 18 * scale + Math.sin(timeSec * 2.8) * 3;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.sin(timeSec * 2.2) * 0.04);
    ctx.fillStyle = scene.isHealth ? '#f8fafc' : '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-42 * scale, -8 * scale);
    ctx.lineTo(44 * scale, -8 * scale);
    ctx.lineTo(30 * scale, 10 * scale);
    ctx.lineTo(-30 * scale, 10 * scale);
    ctx.closePath();
    ctx.fill();

    // Occupants
    drawPersonSilhouette(ctx, -12 * scale, -8 * scale, scale * 0.75, '#0f172a', false);
    drawPersonSilhouette(ctx, 12 * scale, -8 * scale, scale * 0.75, '#0f172a', false);

    if (scene.isHealth) {
      drawRedCrossEmblem(ctx, 0, -2 * scale, 9 * scale, 1);
    }

    // Torch / Searchlight beam
    if (scene.hasSiren || scene.id === 'night-torch-rescue') {
      const beam = ctx.createLinearGradient(25 * scale, -18 * scale, 180 * scale, 10 * scale);
      beam.addColorStop(0, 'rgba(254, 249, 195, 0.72)');
      beam.addColorStop(1, 'rgba(254, 249, 195, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(25 * scale, -18 * scale);
      ctx.lineTo(185 * scale, -42 * scale);
      ctx.lineTo(185 * scale, 22 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Health / Clinic Tents & Red Cross Visuals (Scenes 32-48)
  if (scene.isHealth) {
    const pulse = 0.9 + Math.sin(timeSec * 4.5) * 0.14;
    if (!scene.hasBoat) {
      // Relief / Medical Clinic Tent silhouette on elevated plinth
      const tx = w * 0.5;
      const ty = waterTopY - 4 * scale;
      const tw = 175 * scale;
      const th = 72 * scale;

      // Elevated dry deck
      ctx.fillStyle = '#334155';
      ctx.fillRect(tx - tw * 0.62, ty - 6 * scale, tw * 1.24, 10 * scale);

      // Warm interior glow
      const tentGlow = ctx.createRadialGradient(tx, ty - th * 0.4, 5, tx, ty - th * 0.4, tw * 0.75);
      tentGlow.addColorStop(0, 'rgba(254, 243, 199, 0.75)');
      tentGlow.addColorStop(0.5, 'rgba(248, 113, 113, 0.25)');
      tentGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tentGlow;
      ctx.fillRect(tx - tw, ty - th * 1.4, tw * 2, th * 1.6);

      // Tent body
      ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2, ty - 6 * scale);
      ctx.lineTo(tx - tw * 0.42, ty - th * 0.68);
      ctx.lineTo(tx, ty - th);
      ctx.lineTo(tx + tw * 0.42, ty - th * 0.68);
      ctx.lineTo(tx + tw / 2, ty - 6 * scale);
      ctx.closePath();
      ctx.fill();

      // Red Cross Emblem on tent canopy
      drawRedCrossEmblem(ctx, tx, ty - th * 0.52, 16 * scale, pulse);

      // Silhouettes waiting or medics
      if (scene.id === 'diarrhea-queue' || scene.id === 'vaccine-queue' || scene.id === 'waterborne-camp') {
        for (let p = -3; p <= -1; p++) {
          drawPersonSilhouette(ctx, tx - tw * 0.48 + p * 22 * scale, ty - 6 * scale, scale * 0.78, '#0f172a');
        }
      }
    }

    // Mosquito Fogging Cloud & specks
    if (scene.hasFogging) {
      const fogCount = isMini ? 5 : 12;
      for (let f = 0; f < fogCount; f++) {
        const fx = ((f * 68 + timeSec * 42) % (w + 120)) - 60;
        const fy = waterTopY - 22 * scale + Math.sin(timeSec * 2 + f) * 14 * scale;
        const fr = (38 + (f % 3) * 18) * scale;
        const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, fr);
        fg.addColorStop(0, 'rgba(226, 232, 240, 0.42)');
        fg.addColorStop(1, 'rgba(226, 232, 240, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      // Tiny mosquito specks
      ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
      for (let m = 0; m < (isMini ? 8 : 20); m++) {
        const mx = (rand() * w + Math.sin(timeSec * 5 + m) * 18) % w;
        const my = waterTopY - 10 - rand() * 75 * scale;
        ctx.fillRect(mx, my, 2, 2);
      }
    }

    // Biohazard warning stakes for leptospirosis & markers
    if (scene.id === 'leptospirosis-warning' || scene.id === 'contaminated-water-markers' || scene.id === 'sanitation-breach-warning') {
      const flags = [w * 0.28, w * 0.52, w * 0.74];
      flags.forEach((fx) => {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, waterTopY + 12 * scale);
        ctx.lineTo(fx, waterTopY - 34 * scale);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(fx, waterTopY - 34 * scale);
        ctx.lineTo(fx + 22 * scale, waterTopY - 25 * scale);
        ctx.lineTo(fx, waterTopY - 16 * scale);
        ctx.closePath();
        ctx.fill();
      });
    }
  }

  // 6. Sparks / Transformer Arcs
  if (scene.hasSparks) {
    const poleX = w * 0.72;
    const poleTop = waterTopY - 115 * scale;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(poleX, waterTopY + 20 * scale);
    ctx.lineTo(poleX, poleTop);
    ctx.stroke();

    // Crossbar
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(poleX - 24 * scale, poleTop + 12 * scale);
    ctx.lineTo(poleX + 24 * scale, poleTop + 12 * scale);
    ctx.stroke();

    // Animated blue-white electrical spark burst
    const flashOn = Math.sin(timeSec * 19) > -0.25;
    if (flashOn) {
      const sx = poleX + (scene.id === 'pole-wires-water' ? 10 * scale : -12 * scale);
      const sy = scene.id === 'pole-wires-water' ? waterTopY : poleTop + 14 * scale;
      const sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, 48 * scale);
      sg.addColorStop(0, 'rgba(224, 242, 254, 0.98)');
      sg.addColorStop(0.35, 'rgba(56, 189, 248, 0.7)');
      sg.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, 48 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.6;
      for (let sp = 0; sp < 5; sp++) {
        const ang = (timeSec * 11 + sp * 1.3) % (Math.PI * 2);
        const len = (14 + (sp % 3) * 12) * scale;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
  }

  // 7. Fire Glow & Flickering Flames
  if (scene.hasFire) {
    const fx = w * 0.42;
    const fy = waterTopY - 4 * scale;
    const fg = ctx.createRadialGradient(fx, fy - 20 * scale, 4, fx, fy - 20 * scale, 95 * scale);
    fg.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
    fg.addColorStop(0.35, 'rgba(249, 115, 22, 0.75)');
    fg.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy - 20 * scale, 95 * scale, 0, Math.PI * 2);
    ctx.fill();

    for (let fl = 0; fl < 6; fl++) {
      const foff = (fl - 2.5) * 11 * scale;
      const fh = (26 + Math.sin(timeSec * 12 + fl * 1.9) * 12) * scale;
      ctx.fillStyle = fl % 2 === 0 ? 'rgba(251, 146, 60, 0.88)' : 'rgba(254, 240, 138, 0.9)';
      ctx.beginPath();
      ctx.moveTo(fx + foff - 8 * scale, fy);
      ctx.quadraticCurveTo(fx + foff, fy - fh, fx + foff + 8 * scale, fy);
      ctx.fill();
    }
  }

  // 8. Underground Gas Bubbles / Vapor Haze
  if (scene.hasGas) {
    const bubbles = isMini ? 10 : 24;
    for (let b = 0; b < bubbles; b++) {
      const bx = w * 0.2 + ((b * 37) % (w * 0.6));
      const cycle = ((timeSec * 0.8 + b * 0.23) % 1);
      const by = h - cycle * (h - waterTopY + 40 * scale);
      const br = (3 + (b % 4) * 1.8) * scale;
      ctx.strokeStyle = scene.id === 'acid-corrosion' ? 'rgba(163, 230, 53, 0.65)' : 'rgba(167, 243, 208, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 9. Emergency Siren Strobe (Red & Blue reflection)
  if (scene.hasSiren) {
    const isRed = Math.sin(timeSec * 9) > 0;
    const sx = w * 0.28;
    const sy = waterTopY - 22 * scale;
    const strobe = ctx.createRadialGradient(sx, sy, 2, sx, sy, 90 * scale);
    strobe.addColorStop(0, isRed ? 'rgba(239, 68, 68, 0.72)' : 'rgba(56, 189, 248, 0.72)');
    strobe.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = strobe;
    ctx.beginPath();
    ctx.arc(sx, sy, 90 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 10. Human & Animal Specific Motifs (Scenes 49-65)
  if (scene.id === 'wading-chest-deep' || scene.id === 'family-evacuation' || scene.id === 'injured-carried') {
    const baseX = w * 0.45;
    drawPersonSilhouette(ctx, baseX - 24 * scale, waterTopY + 12 * scale, scale, '#0f172a');
    drawPersonSilhouette(ctx, baseX + 12 * scale, waterTopY + 14 * scale, scale * 0.9, '#1e293b');
    // Dry bundle overhead
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(baseX - 24 * scale, waterTopY - 22 * scale, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (scene.id === 'stray-pets-debris' || scene.id === 'cattle-trapped') {
    // Floating timber raft / earthen mound
    const mx = w * 0.5;
    const my = waterTopY + 10 * scale + Math.sin(timeSec * 2) * 2;
    ctx.fillStyle = scene.id === 'cattle-trapped' ? '#451a03' : '#78350f';
    ctx.beginPath();
    ctx.ellipse(mx, my, 58 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Small animal silhouette shapes on top
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(mx - 18 * scale, my - 18 * scale, 18 * scale, 10 * scale);
    ctx.beginPath();
    ctx.arc(mx - 18 * scale, my - 20 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(mx + 8 * scale, my - 14 * scale, 12 * scale, 7 * scale);
  }

  if (scene.id === 'aftermath-lantern') {
    const lx = w * 0.5;
    const ly = waterTopY - 12 * scale;
    const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 85 * scale);
    lg.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
    lg.addColorStop(0.4, 'rgba(245, 158, 11, 0.45)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 85 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(lx - 4 * scale, ly - 6 * scale, 8 * scale, 12 * scale);
  }

  if (scene.hasCandles) {
    const count = isMini ? 6 : 14;
    for (let c = 0; c < count; c++) {
      const cx = (w * 0.12) + ((c * w * 0.068 + timeSec * 10) % (w * 0.78));
      const cy = waterTopY + 12 * scale + (c % 4) * 14 * scale + Math.sin(timeSec * 2 + c) * 2;
      const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 20 * scale);
      cg.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      cg.addColorStop(0.45, 'rgba(251, 146, 60, 0.45)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(cx - 1.5, cy - 3, 3, 5);
    }
  }
}
