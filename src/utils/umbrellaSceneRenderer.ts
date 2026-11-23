import { TimePalette } from '../types/rain';
import { UmbrellaLocation } from '../data/umbrellaLocations';

export type WalkerKind =
  | 'calm-black'
  | 'couple-clear'
  | 'child-yellow'
  | 'businessman-rush'
  | 'elder-cane'
  | 'woman-saree'
  | 'gust-flip'
  | 'closing-shop'
  | 'spinning-playful'
  | 'waiting-signal'
  | 'bump-apology'
  | 'doorway-umbrella';

export interface WalkerEntity {
  id: number;
  kind: WalkerKind;
  x: number;
  baseYOffset: number; // depth offset on sidewalk
  dir: 1 | -1;
  speed: number;
  scale: number;
  umbrellaColor: string;
  coatColor: string;
  phase: number;
  // Special interaction state
  gustFlipTimer: number; // >0 means umbrella inverted inside-out
  apologyTimer: number; // >0 means paused bowing after bump
  closingProgress: number; // 0 open -> 1 closed
  waitTapPhase: number;
  dripAccum: number;
  stepAccum: number;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function drawUmbrellaLocationBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  loc: UmbrellaLocation,
  palette: TimePalette,
  timeSec: number,
  wind: number,
  isMini = false
) {
  const groundY = h * loc.groundLevel;
  const isNight = palette.id === 'night';
  const isAfternoon = palette.id === 'afternoon';
  const warmAlpha = isNight ? 0.9 : isAfternoon ? 0.6 : 0.22;
  const rand = seededRand(hashStr(loc.id));

  const farCol = isNight ? 'rgba(13, 21, 42, 0.9)' : isAfternoon ? 'rgba(72, 48, 70, 0.65)' : 'rgba(68, 98, 128, 0.52)';
  const midCol = isNight ? 'rgba(8, 14, 30, 0.96)' : isAfternoon ? 'rgba(46, 32, 52, 0.86)' : 'rgba(38, 60, 82, 0.78)';
  const nearCol = isNight ? '#050914' : isAfternoon ? '#221728' : '#182a3a';

  const glow = (x: number, y: number, r: number, col: string, a: number) => {
    if (a <= 0.04) return;
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Location-specific architectural & scenic backdrop
  switch (loc.id) {
    case 'old-town-bazaar':
    case 'market-street': {
      ctx.fillStyle = midCol;
      ctx.fillRect(0, groundY - h * 0.34, w, h * 0.34);
      const stalls = isMini ? 4 : 7;
      const sw = w / stalls;
      for (let i = 0; i < stalls; i++) {
        ctx.fillStyle = nearCol;
        ctx.fillRect(i * sw, groundY - h * 0.26, sw * 0.14, h * 0.26);
        // Striped stall awning
        ctx.fillStyle = i % 2 === 0 ? 'rgba(180, 83, 9, 0.65)' : 'rgba(153, 27, 27, 0.65)';
        ctx.beginPath();
        ctx.moveTo(i * sw, groundY - h * 0.2);
        ctx.lineTo((i + 0.92) * sw, groundY - h * 0.15);
        ctx.lineTo((i + 0.92) * sw, groundY - h * 0.22);
        ctx.closePath();
        ctx.fill();
        glow((i + 0.5) * sw, groundY - h * 0.17, 45, 'rgba(255, 195, 100, 1)', warmAlpha);
      }
      break;
    }

    case 'japanese-alley':
    case 'narrow-balcony-lane': {
      ctx.fillStyle = nearCol;
      ctx.fillRect(0, 0, w * 0.2, groundY);
      ctx.fillRect(w * 0.8, 0, w * 0.2, groundY);
      ctx.fillStyle = midCol;
      ctx.fillRect(w * 0.2, h * 0.22, w * 0.14, groundY - h * 0.22);
      ctx.fillRect(w * 0.66, h * 0.22, w * 0.14, groundY - h * 0.22);
      if (loc.id === 'narrow-balcony-lane') {
        // Iron balconies
        ctx.fillStyle = nearCol;
        ctx.fillRect(w * 0.14, h * 0.36, w * 0.14, 12);
        ctx.fillRect(w * 0.72, h * 0.42, w * 0.14, 12);
      } else {
        // Paper lanterns
        glow(w * 0.22, h * 0.45, 52, 'rgba(251, 113, 133, 1)', warmAlpha);
        glow(w * 0.78, h * 0.45, 52, 'rgba(251, 113, 133, 1)', warmAlpha);
      }
      break;
    }

    case 'neon-cyber-city':
    case 'modern-city-crossing': {
      const towers = isMini ? 8 : 16;
      const neonCols = ['rgba(34, 211, 238, 1)', 'rgba(232, 121, 249, 1)', 'rgba(244, 63, 94, 1)'];
      for (let i = 0; i < towers; i++) {
        const tw = w / towers;
        const th = h * (0.26 + rand() * 0.42);
        ctx.fillStyle = i % 2 === 0 ? nearCol : midCol;
        ctx.fillRect(i * tw, groundY - th, tw * 0.9, th);
        if (loc.id === 'neon-cyber-city') {
          const nc = neonCols[i % neonCols.length];
          ctx.fillStyle = nc.replace('1)', `${isNight ? 0.85 : 0.45})`);
          ctx.fillRect(i * tw + 4, groundY - th * 0.68, 4, th * 0.36);
          glow(i * tw + tw * 0.4, groundY - th * 0.5, 48, nc, isNight ? 0.42 : 0.16);
        }
      }
      // Traffic / crossing signal post
      const sx = w * 0.78;
      ctx.fillStyle = nearCol;
      ctx.fillRect(sx - 3, groundY - h * 0.26, 6, h * 0.26);
      ctx.fillRect(sx - 10, groundY - h * 0.28, 20, 32);
      const signalGreen = Math.sin(timeSec * 0.4) > 0;
      glow(sx, groundY - h * 0.25, 28, signalGreen ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)', 0.9);
      break;
    }

    case 'train-station-platform':
    case 'metro-entrance-stairs': {
      ctx.fillStyle = nearCol;
      ctx.fillRect(0, h * 0.24, w, 12);
      for (let p = 0; p < 4; p++) {
        ctx.fillRect(w * (0.14 + p * 0.24), h * 0.24, 8, groundY - h * 0.24);
        glow(w * (0.14 + p * 0.24), h * 0.3, 55, 'rgba(224, 242, 254, 1)', isNight ? 0.72 : 0.25);
      }
      if (loc.id === 'metro-entrance-stairs') {
        // Subway steps descending on right
        for (let st = 0; st < 6; st++) {
          ctx.fillStyle = midCol;
          ctx.fillRect(w * 0.72 + st * 10, groundY - 6 + st * 5, w * 0.25, 6);
        }
        glow(w * 0.74, groundY - h * 0.22, 48, 'rgba(56, 189, 248, 1)', 0.75);
      }
      break;
    }

    case 'temple-courtyard':
    case 'college-campus': {
      ctx.fillStyle = midCol;
      ctx.fillRect(w * 0.15, groundY - h * 0.24, w * 0.7, h * 0.24);
      ctx.fillStyle = nearCol;
      // Curved temple roof or campus pediment
      ctx.beginPath();
      ctx.moveTo(w * 0.1, groundY - h * 0.24);
      ctx.quadraticCurveTo(w * 0.5, groundY - h * 0.38, w * 0.9, groundY - h * 0.24);
      ctx.closePath();
      ctx.fill();
      glow(w * 0.3, groundY - 38, 42, 'rgba(255, 185, 95, 1)', warmAlpha);
      glow(w * 0.7, groundY - 38, 42, 'rgba(255, 185, 95, 1)', warmAlpha);
      break;
    }

    case 'lakeside-promenade':
    case 'stone-bridge':
    case 'harbour-dock':
    case 'beach-boardwalk': {
      ctx.fillStyle = farCol;
      ctx.fillRect(0, groundY - h * 0.08, w, h * 0.08);
      // Stone/wooden railing
      ctx.fillStyle = nearCol;
      ctx.fillRect(0, groundY - 26, w, 4);
      for (let b = 0; b < (isMini ? 8 : 16); b++) {
        ctx.fillRect((w / (isMini ? 8 : 16)) * b, groundY - 26, 4, 26);
      }
      if (loc.id === 'harbour-dock') {
        // Boat masts
        ctx.strokeStyle = midCol;
        ctx.lineWidth = 2;
        for (let m = 0; m < 3; m++) {
          const mx = w * (0.2 + m * 0.28);
          ctx.beginPath();
          ctx.moveTo(mx, groundY - 24);
          ctx.lineTo(mx + Math.sin(timeSec + m) * 4, groundY - h * 0.28);
          ctx.stroke();
        }
      }
      glow(w * 0.25, groundY - 48, 44, 'rgba(255, 200, 110, 1)', warmAlpha);
      glow(w * 0.75, groundY - 48, 44, 'rgba(255, 200, 110, 1)', warmAlpha);
      break;
    }

    case 'park-garden-lane':
    case 'autumn-street':
    case 'rice-field-path': {
      const sway = Math.sin(timeSec * 1.4) * (4 + Math.abs(wind) * 10);
      for (let t = 0; t < (isMini ? 5 : 9); t++) {
        const tx = w * (0.06 + t * 0.11);
        const th = h * (0.18 + rand() * 0.14);
        ctx.fillStyle = nearCol;
        ctx.fillRect(tx - 4, groundY - th, 8, th);
        ctx.fillStyle =
          loc.id === 'autumn-street'
            ? isNight
              ? 'rgba(154, 52, 18, 0.78)'
              : 'rgba(217, 119, 6, 0.78)'
            : midCol;
        ctx.beginPath();
        ctx.arc(tx + sway * 0.3, groundY - th, th * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
      glow(w * 0.35, groundY - h * 0.2, 44, 'rgba(255, 195, 105, 1)', warmAlpha);
      glow(w * 0.72, groundY - h * 0.2, 44, 'rgba(255, 195, 105, 1)', warmAlpha);
      break;
    }

    case 'tea-stall-roadside':
    case 'rooftop-cafe':
    case 'village-mud-road':
    case 'snow-village-lane':
    case 'mountain-village-steps':
    default: {
      // Cozy cottages / roadside tea stall with warm doorway glow
      for (let c = 0; c < (isMini ? 3 : 5); c++) {
        const cx = w * (0.12 + c * 0.21);
        const cw = w * 0.14;
        const ch = h * (0.14 + (c % 2) * 0.06);
        const stepY = loc.hasSteps ? -c * 10 : 0;
        ctx.fillStyle = c % 2 === 0 ? nearCol : midCol;
        ctx.fillRect(cx, groundY - ch + stepY, cw, ch - stepY);
        // Roof
        ctx.fillStyle = loc.id === 'snow-village-lane' ? 'rgba(226, 240, 255, 0.85)' : nearCol;
        ctx.beginPath();
        ctx.moveTo(cx - 10, groundY - ch + stepY);
        ctx.lineTo(cx + cw / 2, groundY - ch - 26 + stepY);
        ctx.lineTo(cx + cw + 10, groundY - ch + stepY);
        ctx.closePath();
        ctx.fill();
        // Warm doorway / window
        if (warmAlpha > 0.12) {
          ctx.fillStyle = `rgba(255, 200, 115, ${warmAlpha})`;
          ctx.fillRect(cx + cw * 0.32, groundY - 38 + stepY, cw * 0.36, 38 - stepY);
          glow(cx + cw * 0.5, groundY - 26 + stepY, 55, 'rgba(255, 185, 95, 1)', warmAlpha * 0.65);
        }
      }
      break;
    }
  }

  // Wet Walkway / Reflective Street Surface
  const gGrad = ctx.createLinearGradient(0, groundY, 0, h);
  gGrad.addColorStop(0, loc.hasWater ? palette.waterTint : palette.groundTint);
  gGrad.addColorStop(0.45, palette.groundTint);
  gGrad.addColorStop(1, '#020611');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, groundY, w, h - groundY);

  // Subtle wet road sheen
  const sheen = ctx.createLinearGradient(0, groundY, 0, h);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, groundY, w, h - groundY);
}

export function drawWalkerCharacter(
  ctx: CanvasRenderingContext2D,
  walker: WalkerEntity,
  groundY: number,
  timeSec: number,
  wind: number,
  isNight: boolean,
  isNoon: boolean,
  isAfternoon: boolean
) {
  const footY = groundY + walker.baseYOffset;
  const s = walker.scale;
  const isWaiting = walker.kind === 'waiting-signal' || walker.kind === 'doorway-umbrella' || walker.apologyTimer > 0;
  const stride = isWaiting ? 0 : Math.sin(timeSec * (walker.speed * 0.11) + walker.phase);
  const bob = isWaiting ? 0 : Math.abs(stride) * 2.5 * s;

  // Umbrella reflection on wet ground beneath walker
  ctx.save();
  ctx.translate(walker.x, footY + 6 * s);
  ctx.scale(1, -0.38);
  ctx.globalAlpha = isNight ? 0.34 : 0.22;
  if (walker.kind !== 'doorway-umbrella') {
    ctx.fillStyle = walker.coatColor;
    ctx.fillRect(-5 * s, 0, 10 * s, 32 * s);
  }
  ctx.fillStyle = walker.umbrellaColor;
  ctx.beginPath();
  ctx.arc(0, 48 * s, 26 * s * (1 - walker.closingProgress * 0.75), Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Sharp Noon / Long Afternoon Ground Shadow
  if (isNoon || isAfternoon) {
    ctx.save();
    ctx.fillStyle = isNoon ? 'rgba(2, 6, 23, 0.34)' : 'rgba(15, 10, 22, 0.28)';
    ctx.beginPath();
    ctx.ellipse(
      walker.x + (isAfternoon ? -18 * s : 0),
      footY + 2 * s,
      (isAfternoon ? 28 : 18) * s,
      4.5 * s,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(walker.x, footY - bob);

  // Special case: Umbrella left open by a doorway, dripping steadily
  if (walker.kind === 'doorway-umbrella') {
    ctx.save();
    ctx.rotate(0.28);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -34 * s);
    ctx.stroke();

    ctx.fillStyle = walker.umbrellaColor;
    ctx.beginPath();
    ctx.arc(0, -34 * s, 22 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    return;
  }

  const drawHumanSilhouette = (offsetX: number, heightScale: number, coatCol: string, isChild = false, isElder = false, isSaree = false) => {
    const hs = s * heightScale;
    ctx.save();
    ctx.translate(offsetX, 0);

    // Legs walk cycle
    const legSwing = isWaiting ? 0 : stride * 9 * hs;
    const tapOffset = walker.kind === 'waiting-signal' ? Math.abs(Math.sin(timeSec * 5.5)) * 3 * hs : 0;

    ctx.strokeStyle = coatCol;
    ctx.lineWidth = (isChild ? 3.2 : 4.2) * hs;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2 * hs, -16 * hs);
    ctx.lineTo(-2 * hs - legSwing, 0);
    ctx.moveTo(2 * hs, -16 * hs);
    ctx.lineTo(2 * hs + legSwing, -tapOffset);
    ctx.stroke();

    // Torso / Coat / Saree
    const flutter = wind * 6 * hs + Math.sin(timeSec * 4 + walker.phase) * 1.5;
    ctx.fillStyle = coatCol;
    ctx.beginPath();
    if (isSaree) {
      // Flowing saree drape
      ctx.moveTo(-6 * hs, -36 * hs);
      ctx.lineTo(6 * hs, -36 * hs);
      ctx.lineTo(10 * hs + flutter * 0.5, -2 * hs);
      ctx.lineTo(-9 * hs + flutter * 0.3, -2 * hs);
    } else {
      ctx.moveTo(-5.5 * hs, -36 * hs);
      ctx.lineTo(5.5 * hs, -36 * hs);
      ctx.lineTo(8 * hs + flutter * 0.4, -14 * hs);
      ctx.lineTo(-7 * hs + flutter * 0.3, -14 * hs);
    }
    ctx.closePath();
    ctx.fill();

    // Head (bows slightly if apologizing or elder)
    const headTilt = walker.apologyTimer > 0 ? 4 * walker.dir : isElder ? 2.5 * walker.dir : 0;
    ctx.beginPath();
    ctx.arc(headTilt * hs, -42 * hs, (isChild ? 4.8 : 5.2) * hs, 0, Math.PI * 2);
    ctx.fill();

    // Wooden cane for elder
    if (isElder) {
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2 * hs;
      ctx.beginPath();
      ctx.moveTo(7 * walker.dir * hs, -22 * hs);
      ctx.lineTo(11 * walker.dir * hs, 0);
      ctx.stroke();
    }

    ctx.restore();
  };

  if (walker.kind === 'couple-clear') {
    drawHumanSilhouette(-7 * s, 0.98, '#1e293b');
    drawHumanSilhouette(7 * s, 0.93, '#334155');
  } else if (walker.kind === 'child-yellow') {
    drawHumanSilhouette(0, 0.68, '#facc15', true);
  } else if (walker.kind === 'elder-cane') {
    drawHumanSilhouette(0, 0.94, walker.coatColor, false, true);
  } else if (walker.kind === 'woman-saree') {
    drawHumanSilhouette(0, 0.96, walker.coatColor, false, false, true);
  } else {
    drawHumanSilhouette(0, 1.0, walker.coatColor);
  }

  // Umbrella Canopy + Wind Tilt + Spin + Gust Flip
  const isChild = walker.kind === 'child-yellow';
  const umbBaseY = (isChild ? -36 : -50) * s;
  const umbRadius = (isChild ? 18 : walker.kind === 'couple-clear' ? 30 : 25) * s;
  const rushTilt = walker.kind === 'businessman-rush' ? 0.28 * walker.dir : 0;
  const windTilt = wind * 0.32 + rushTilt;
  const spinWobble = walker.kind === 'spinning-playful' ? Math.sin(timeSec * 9) * 0.16 : 0;
  const closedScale = 1 - walker.closingProgress * 0.78;

  ctx.save();
  ctx.translate(0, umbBaseY + 18 * s);
  ctx.rotate(windTilt + spinWobble);

  // Umbrella shaft
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -22 * s);
  ctx.stroke();

  // Canopy (flips inside out if gustFlipTimer > 0!)
  const flipped = walker.gustFlipTimer > 0;
  ctx.fillStyle = walker.umbrellaColor;
  ctx.beginPath();
  if (flipped) {
    // Inverted V / U cup catching wind
    ctx.arc(0, -28 * s, umbRadius * 0.95, 0.15, Math.PI - 0.15, false);
  } else {
    ctx.ellipse(0, -20 * s, umbRadius * closedScale, umbRadius * 0.56, 0, Math.PI, 0);
  }
  ctx.closePath();
  ctx.fill();

  // Specular highlight / rib line on canopy
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();

  // Spinning playful droplet arc
  if (walker.kind === 'spinning-playful' && !flipped) {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
    for (let d = 0; d < 6; d++) {
      const ang = timeSec * 8 + d * 1.05;
      const dx = Math.cos(ang) * (umbRadius * 1.15);
      const dy = -18 * s + Math.sin(ang) * 7 * s;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  ctx.restore();
}
