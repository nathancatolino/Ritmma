/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Anatomical Router:
 * Clinical pathway generator for musculoskeletal irradiations and anatomical labeling.
 * Calculates true physiological nerve and myofascial tracts (radiculopathies, dermatomes, digital rays)
 * instead of Euclidean straight lines, ensuring the path naturally stays inside anatomical silhouettes.
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Returns a clinically accurate anatomical name for any coordinate on an asset silhouette.
 */
export function getAnatomicalLabelForCoord(asset: string, x: number, y: number): string {
  if (asset === 'corpo-anterior') {
    if (y < 75) return 'Cabeça / Fronte';
    if (y < 135) return 'Face / Mandíbula';
    if (y < 175) return 'Pescoço / Cervical anterior';
    if (y < 280) {
      if (x < 170) return 'Ombro direito';
      if (x > 310) return 'Ombro esquerdo';
      return 'Tórax / Peito';
    }
    if (y < 390) {
      if (x < 140) return 'Braço direito';
      if (x > 340) return 'Braço esquerdo';
      return 'Tórax inferior / Epigástrio';
    }
    if (y < 460) {
      if (x < 110) return 'Cotovelo direito';
      if (x > 370) return 'Cotovelo esquerdo';
      return 'Abdômen';
    }
    if (y < 540) {
      if (x < 90) return 'Antebraço / Punho direito';
      if (x > 390) return 'Antebraço / Punho esquerdo';
      if (x < 215) return 'Quadril / Fossa ilíaca direita';
      if (x > 265) return 'Quadril / Fossa ilíaca esquerda';
      return 'Pelve / Hipogástrio';
    }
    if (y < 600) {
      if (x < 80) return 'Mão direita';
      if (x > 400) return 'Mão esquerda';
      return x < 240 ? 'Coxa direita proximal' : 'Coxa esquerda proximal';
    }
    if (y < 690) {
      return x < 240 ? 'Coxa direita anterior' : 'Coxa esquerda anterior';
    }
    if (y < 760) {
      return x < 240 ? 'Joelho direito' : 'Joelho esquerdo';
    }
    if (y < 890) {
      return x < 240 ? 'Perna / Canela direita' : 'Perna / Canela esquerda';
    }
    return x < 240 ? 'Tornozelo / Pé direito' : 'Tornozelo / Pé esquerdo';
  }

  if (asset === 'corpo-posterior') {
    if (y < 140) return 'Nuca / Occipital';
    if (y < 210) return 'Coluna cervical';
    if (y < 350) {
      if (x > 380) return 'Ombro / Escápula direita';
      if (x < 190) return 'Ombro / Escápula esquerda';
      return 'Coluna torácica / Dorso';
    }
    if (y < 450) {
      if (x > 430) return 'Braço direito posterior';
      if (x < 140) return 'Braço esquerdo posterior';
      return 'Dorso / Transição toracolombar';
    }
    if (y < 560) {
      if (x > 470) return 'Cotovelo direito posterior';
      if (x < 100) return 'Cotovelo esquerdo posterior';
      return 'Coluna lombar';
    }
    if (y < 680) {
      if (x > 500) return 'Punho / Mão direita';
      if (x < 70) return 'Punho / Mão esquerda';
      return x > 285 ? 'Glúteo direito / Sacroilíaca' : 'Glúteo esquerdo / Sacroilíaca';
    }
    if (y < 810) {
      return x > 285 ? 'Coxa direita posterior' : 'Coxa esquerda posterior';
    }
    if (y < 890) {
      return x > 285 ? 'Joelho posterior / Fossa poplítea D' : 'Joelho posterior / Fossa poplítea E';
    }
    if (y < 1010) {
      return x > 285 ? 'Panturrilha direita' : 'Panturrilha esquerda';
    }
    return x > 285 ? 'Tendão de Aquiles / Calcanhar D' : 'Tendão de Aquiles / Calcanhar E';
  }

  if (asset === 'mao-direita') {
    if (y > 310) return 'Punho direito (dorso)';
    if (y > 210) return 'Dorso da mão direita';
    if (x > 210) return 'Polegar direito';
    if (x > 165) return 'Indicador direito';
    if (x > 110) return 'Médio direito';
    if (x > 65) return 'Anelar direito';
    return 'Mínimo direito';
  }

  if (asset === 'mao-esquerda') {
    if (y > 310) return 'Punho esquerdo (dorso)';
    if (y > 210) return 'Dorso da mão esquerda';
    if (x < 70) return 'Polegar esquerdo';
    if (x < 115) return 'Indicador esquerdo';
    if (x < 170) return 'Médio esquerdo';
    if (x < 215) return 'Anelar esquerdo';
    return 'Mínimo esquerdo';
  }

  if (asset === 'pe-direito') {
    if (y > 360) return 'Tornozelo / Calcanhar direito';
    if (y > 180) return 'Dorso do pé direito';
    if (x > 100) return 'Hálux / 1º dedo (pé D)';
    return 'Dedos laterais (pé D)';
  }

  if (asset === 'pe-esquerdo') {
    if (y > 360) return 'Tornozelo / Calcanhar esquerdo';
    if (y > 180) return 'Dorso do pé esquerdo';
    if (x < 140) return 'Hálux / 1º dedo (pé E)';
    return 'Dedos laterais (pé E)';
  }

  return asset;
}

/**
 * Converts a sequence of 2D waypoints into a continuous Catmull-Rom cubic Bézier SVG path.
 */
export function pointsToSmoothSpline(points: Point2D[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`;
  
  if (points.length === 2) {
    const [p0, p1] = points;
    // Slight physiological curve to avoid robotic straight look
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const midX = (p0.x + p1.x) / 2 - dy * 0.035;
    const midY = (p0.y + p1.y) / 2 + dx * 0.035;
    return `M ${Math.round(p0.x)} ${Math.round(p0.y)} Q ${Math.round(midX)} ${Math.round(midY)} ${Math.round(p1.x)} ${Math.round(p1.y)}`;
  }

  let d = `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${Math.round(p2.x)} ${Math.round(p2.y)}`;
  }
  return d;
}

/**
 * Generates an anatomically routed path for radiation between origin `from` and destination `to`.
 */
export function getAnatomicalIrradiationPath(
  asset: string,
  from: Point2D,
  to: Point2D
): string {
  const intermediateWaypoints: Point2D[] = [];

  if (asset === 'corpo-posterior') {
    // Width: 551, Height: 1139. Midline spine: ~285.
    // Patient right is screen right (x > 285), patient left is screen left (x < 285)

    const isFromAxialLower = from.y >= 380 && from.y <= 630 && Math.abs(from.x - 285) < 85;
    const isToRightLeg = to.y > 620 && to.x >= 285;
    const isToLeftLeg = to.y > 620 && to.x < 285;

    // Sciatic nerve / Lumbosacral radiculopathy down the leg (e.g. L4/L5/S1)
    if (isFromAxialLower && isToRightLeg) {
      if (to.y > 590) intermediateWaypoints.push({ x: 335, y: 630 }); // Glúteo / Piriforme
      if (to.y > 710) intermediateWaypoints.push({ x: 340, y: 740 }); // Coxa posterior
      if (to.y > 810) intermediateWaypoints.push({ x: 345, y: 840 }); // Fossa poplítea
      if (to.y > 900) intermediateWaypoints.push({ x: 340, y: 930 }); // Panturrilha
      if (to.y > 1010) intermediateWaypoints.push({ x: 345, y: 1040 }); // Tendão de Aquiles
    } else if (isFromAxialLower && isToLeftLeg) {
      if (to.y > 590) intermediateWaypoints.push({ x: 235, y: 630 });
      if (to.y > 710) intermediateWaypoints.push({ x: 230, y: 740 });
      if (to.y > 810) intermediateWaypoints.push({ x: 225, y: 840 });
      if (to.y > 900) intermediateWaypoints.push({ x: 230, y: 930 });
      if (to.y > 1010) intermediateWaypoints.push({ x: 225, y: 1040 });
    }
    // Cervicobrachial radiculopathy (Cervical / Upper thoracic to arm)
    else if (from.y >= 130 && from.y <= 360 && Math.abs(from.x - 285) < 85) {
      const isToRightArm = to.x > 360;
      const isToLeftArm = to.x < 210;
      if (isToRightArm) {
        intermediateWaypoints.push({ x: 420, y: 290 }); // Cintura escapular
        if (to.y > 360) intermediateWaypoints.push({ x: 460, y: 390 }); // Braço
        if (to.y > 460) intermediateWaypoints.push({ x: 490, y: 490 }); // Cotovelo
        if (to.y > 550) intermediateWaypoints.push({ x: 515, y: 580 }); // Antebraço
        if (to.y > 630) intermediateWaypoints.push({ x: 535, y: 640 }); // Punho
      } else if (isToLeftArm) {
        intermediateWaypoints.push({ x: 150, y: 290 });
        if (to.y > 360) intermediateWaypoints.push({ x: 110, y: 390 });
        if (to.y > 460) intermediateWaypoints.push({ x: 80, y: 490 });
        if (to.y > 550) intermediateWaypoints.push({ x: 55, y: 580 });
        if (to.y > 630) intermediateWaypoints.push({ x: 35, y: 640 });
      }
    }
    // Head / Occipital radiation
    else if (from.y >= 140 && from.y <= 240 && to.y < 140) {
      intermediateWaypoints.push({ x: (from.x + 285) / 2, y: 130 });
    }
    // Along same limb (e.g. gluteus to foot or thigh to calf)
    else if (Math.abs(from.y - to.y) > 140) {
      if (from.x >= 285 && to.x >= 285 && from.y >= 580 && to.y >= 580) {
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        const pts = [
          { y: 630, x: 335 },
          { y: 740, x: 340 },
          { y: 840, x: 345 },
          { y: 930, x: 340 },
          { y: 1040, x: 345 }
        ];
        pts.forEach(p => {
          if (p.y > minY + 35 && p.y < maxY - 35) {
            intermediateWaypoints.push(p);
          }
        });
      } else if (from.x < 285 && to.x < 285 && from.y >= 580 && to.y >= 580) {
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        const pts = [
          { y: 630, x: 235 },
          { y: 740, x: 230 },
          { y: 840, x: 225 },
          { y: 930, x: 230 },
          { y: 1040, x: 225 }
        ];
        pts.forEach(p => {
          if (p.y > minY + 35 && p.y < maxY - 35) {
            intermediateWaypoints.push(p);
          }
        });
      }
    }
  } else if (asset === 'corpo-anterior') {
    // Width: 479, Height: 984. Midline: ~240.
    // Screen left is patient's right (x < 240), screen right is patient's left (x > 240)

    // Neck to upper limb
    if (from.y >= 120 && from.y <= 240 && Math.abs(from.x - 240) < 65) {
      if (to.x < 180) { // Braço direito do paciente (lado esquerdo da tela)
        intermediateWaypoints.push({ x: 135, y: 220 });
        if (to.y > 280) intermediateWaypoints.push({ x: 110, y: 300 });
        if (to.y > 360) intermediateWaypoints.push({ x: 95, y: 380 });
        if (to.y > 430) intermediateWaypoints.push({ x: 70, y: 450 });
        if (to.y > 500) intermediateWaypoints.push({ x: 50, y: 520 });
      } else if (to.x > 300) { // Braço esquerdo do paciente (lado direito da tela)
        intermediateWaypoints.push({ x: 345, y: 220 });
        if (to.y > 280) intermediateWaypoints.push({ x: 370, y: 300 });
        if (to.y > 360) intermediateWaypoints.push({ x: 385, y: 380 });
        if (to.y > 430) intermediateWaypoints.push({ x: 410, y: 450 });
        if (to.y > 500) intermediateWaypoints.push({ x: 430, y: 520 });
      }
    }
    // Groin / Hip to lower limb
    else if (from.y >= 440 && from.y <= 580) {
      if (to.x < 240 && to.y > 580) { // Perna direita
        intermediateWaypoints.push({ x: 190, y: 600 });
        if (to.y > 690) intermediateWaypoints.push({ x: 195, y: 710 });
        if (to.y > 790) intermediateWaypoints.push({ x: 195, y: 810 });
        if (to.y > 890) intermediateWaypoints.push({ x: 185, y: 910 });
      } else if (to.x >= 240 && to.y > 580) { // Perna esquerda
        intermediateWaypoints.push({ x: 290, y: 600 });
        if (to.y > 690) intermediateWaypoints.push({ x: 285, y: 710 });
        if (to.y > 790) intermediateWaypoints.push({ x: 285, y: 810 });
        if (to.y > 890) intermediateWaypoints.push({ x: 295, y: 910 });
      }
    }
  }

  // Ensure intermediate waypoints preserve directionality from origin to destination
  if (from.y < to.y) {
    intermediateWaypoints.sort((a, b) => a.y - b.y);
  } else {
    intermediateWaypoints.sort((a, b) => b.y - a.y);
  }

  const allPoints: Point2D[] = [from, ...intermediateWaypoints, to];
  return pointsToSmoothSpline(allPoints);
}
