/**
 * BESPOKE MECHA SCORPION RIG
 * 8 True 3-Segment Ground-Crawling Legs (Alternating Arachnid Crawl)
 * 48-Vertebrae Carapace Spine & Articulated Venom Stinger
 * Smooth 60FPS Procedural Canvas Simulation
 */
(function initScorpionStandalone() {
  const canvas = document.getElementById('creature-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fpsEl = document.getElementById('canvas-fps');
  const coordsEl = document.getElementById('hud-coords');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  // Visual Theme Colors
  const dStroke  = '#00F0FF';
  const dFill    = '#080C14';
  const dShadow  = '#00F0FF';
  const dStinger = '#FF3366';

  // Mouse & Target Physics
  let mouse = { x: width * 0.5, y: height * 0.5 };
  let target = { x: mouse.x, y: mouse.y };
  let clickFlare = 0; // Triggered on mousedown (0 to 1)

  // Sparks Particle Pool
  const sparkParticles = [];

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (coordsEl) {
      coordsEl.textContent = `TARGET: ${Math.round(mouse.x)}, ${Math.round(mouse.y)}`;
    }
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    clickFlare = 1.0;
    // Spawn venom sparks from stinger
    const tailTip = spine[NUM_VERTEBRAE - 1];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 5 + Math.random() * 12;
      sparkParticles.push({
        x: tailTip.x,
        y: tailTip.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 5,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.035,
        color: Math.random() > 0.4 ? '#FF3366' : '#F59E0B'
      });
    }
  });

  // 48-Segment Vertebrae Spine Chain
  const NUM_VERTEBRAE = 48;
  const SEGMENT_LENGTH = 15;
  const spine = [];
  for (let i = 0; i < NUM_VERTEBRAE; i++) {
    spine.push({
      x: mouse.x - i * SEGMENT_LENGTH,
      y: mouse.y,
      angle: 0
    });
  }

  // 2D Segment angle solver (FABRIK Inverse Kinematics)
  function solve2DSegment(p1, p2, length) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const angle = Math.atan2(dy, dx);
    p2.x = p1.x - Math.cos(angle) * length;
    p2.y = p1.y - Math.sin(angle) * length;
    return angle;
  }

  // Scorpion 8 True 3-Segment Ground-Crawling Legs (Alternating Arachnid Crawl)
  const scorpionLegs = [];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const pair = Math.floor(i / 2);
    scorpionLegs.push({
      seg: 4 + pair * 3,
      side: side,
      pair: pair,
      l1: 42 + pair * 4,    // Khúc 1: Co-femur (42 - 54px)
      l2: 52 + pair * 5,    // Khúc 2: Tibia (52 - 67px)
      l3: 32 + pair * 3,    // Khúc 3: Tarsus claw (32 - 41px)
      plantFoot: { x: 0, y: 0 },
      targetFoot: { x: 0, y: 0 },
      isMoving: false,
      stepT: 0
    });
  }

  scorpionLegs.forEach((leg) => {
    const v = spine[leg.seg];
    const reach = 100 + leg.pair * 16;
    leg.plantFoot.x = leg.targetFoot.x = v.x + leg.side * reach;
    leg.plantFoot.y = leg.targetFoot.y = v.y + (leg.pair - 1.5) * 28;
  });

  // FPS Meter
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;

  // Main Render Loop
  function render(now) {
    requestAnimationFrame(render);

    const delta = (now - lastTime) / 1000;
    lastTime = now;
    frameCount++;
    fpsTimer += delta;

    if (fpsTimer >= 1.0) {
      if (fpsEl) fpsEl.textContent = frameCount + " FPS";
      frameCount = 0;
      fpsTimer = 0;
    }

    // Velocity & Smooth Lerp toward cursor
    const prevTargetX = target.x;
    const prevTargetY = target.y;

    target.x += (mouse.x - target.x) * 0.055;
    target.y += (mouse.y - target.y) * 0.055;

    const speed = Math.hypot(target.x - prevTargetX, target.y - prevTargetY);

    if (clickFlare > 0.01) clickFlare *= 0.94;
    else clickFlare = 0;

    ctx.clearRect(0, 0, width, height);

    // Update Spine using Inverse Kinematics
    spine[0].x = target.x;
    spine[0].y = target.y;
    spine[0].angle = Math.atan2(mouse.y - spine[0].y, mouse.x - spine[0].x);

    for (let i = 1; i < NUM_VERTEBRAE; i++) {
      const parent = spine[i - 1];
      const child = spine[i];
      child.angle = solve2DSegment(parent, child, SEGMENT_LENGTH);
    }

    drawMechaScorpion(ctx, now, speed);
    renderSparks(ctx);
  }

  // Draw Scorpion
  function drawMechaScorpion(ctx, now, speed) {
    // --- STEP A: 8 TRUE 3-SEGMENT GROUND-CRAWLING LEGS ---
    const pairOffsets = [-0.35, -0.1, 0.15, 0.45];
    scorpionLegs.forEach((leg) => {
      const rootSeg = spine[leg.seg];
      const normalAngle = rootSeg.angle + leg.side * Math.PI * 0.5;
      const coxaX = rootSeg.x + Math.cos(normalAngle) * 16;
      const coxaY = rootSeg.y + Math.sin(normalAngle) * 16;

      const reachDist = 105 + leg.pair * 16;
      const longitudinalOffset = (leg.pair - 1.5) * 28;
      const spreadAngle = normalAngle + leg.side * pairOffsets[leg.pair];

      const idealX = coxaX + Math.cos(spreadAngle) * reachDist + Math.cos(rootSeg.angle) * longitudinalOffset;
      const idealY = coxaY + Math.sin(spreadAngle) * reachDist + Math.sin(rootSeg.angle) * longitudinalOffset;

      const footDist = Math.hypot(idealX - leg.plantFoot.x, idealY - leg.plantFoot.y);

      // Trigger realistic step when body moves far from anchored footstep
      if (footDist > 48 && !leg.isMoving) {
        leg.isMoving = true;
        leg.stepT = 0;
        const stride = Math.max(38, Math.min(85, speed * 4.2));
        leg.targetFoot.x = idealX + Math.cos(rootSeg.angle) * stride;
        leg.targetFoot.y = idealY + Math.sin(rootSeg.angle) * stride;
      }

      let currentFootX = leg.plantFoot.x;
      let currentFootY = leg.plantFoot.y;
      let stepLift = 0;

      if (leg.isMoving) {
        leg.stepT += 0.14; // Crawling step speed
        const t = Math.min(1, leg.stepT);
        const smoothT = t * t * (3 - 2 * t);

        currentFootX = leg.plantFoot.x + (leg.targetFoot.x - leg.plantFoot.x) * smoothT;
        currentFootY = leg.plantFoot.y + (leg.targetFoot.y - leg.plantFoot.y) * smoothT;

        // 3D Stepping Arc (High knee lift & forward foot arc)
        stepLift = Math.sin(t * Math.PI) * (22 + Math.min(15, speed * 1.5));

        if (t >= 1) {
          leg.isMoving = false;
          leg.plantFoot.x = leg.targetFoot.x;
          leg.plantFoot.y = leg.targetFoot.y;
          currentFootX = leg.plantFoot.x;
          currentFootY = leg.plantFoot.y;
        }
      }

      // --- 3 DISTINCT ARTICULATED MOVING SEGMENTS ---
      const totalReach = leg.l1 + leg.l2;
      const dx = currentFootX - coxaX;
      const dy = currentFootY - coxaY;
      const dist = Math.min(Math.hypot(dx, dy), totalReach - 4);
      const baseDir = Math.atan2(dy, dx);

      // Solve Joint 1 (High Knee)
      const cosAngle1 = (leg.l1 * leg.l1 + dist * dist - leg.l2 * leg.l2) / (2 * leg.l1 * dist);
      const clampedCos1 = Math.max(-1, Math.min(1, cosAngle1));
      const kneeAngle = baseDir - leg.side * (Math.acos(clampedCos1) + (stepLift > 0 ? 0.22 : 0));

      const kneeX = coxaX + Math.cos(kneeAngle) * leg.l1;
      const kneeY = coxaY + Math.sin(kneeAngle) * leg.l1;

      // Solve Joint 2 (Ankle Joint above Ground Contact)
      const toFootAngle = Math.atan2(currentFootY - kneeY, currentFootX - kneeX);
      const ankleAngle = toFootAngle - leg.side * 0.26;
      const ankleX = kneeX + Math.cos(ankleAngle) * (leg.l2 * 0.72);
      const ankleY = kneeY + Math.sin(ankleAngle) * (leg.l2 * 0.72);

      const clawTipX = currentFootX;
      const clawTipY = currentFootY;

      ctx.save();

      // Shadow under lifting foot
      if (stepLift > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(clawTipX, clawTipY + stepLift * 0.4, 6 + stepLift * 0.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = dStroke;
      ctx.fillStyle = dFill;
      ctx.lineWidth = 2.4;

      // --- Draw Khúc 1: Co-Femur (Coxa -> High Knee) ---
      ctx.beginPath();
      ctx.moveTo(coxaX, coxaY);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();

      // Knee Joint Cap (Articulated High Knee)
      ctx.beginPath();
      ctx.arc(kneeX, kneeY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(kneeX, kneeY, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // --- Draw Khúc 2: Tibia (Knee -> Ankle) ---
      ctx.fillStyle = dFill;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(ankleX, ankleY);
      ctx.stroke();

      // Ankle Joint Cap
      ctx.beginPath();
      ctx.arc(ankleX, ankleY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // --- Draw Khúc 3: Tarsus / Foot Claw (Ankle -> Ground Claw Tip) ---
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = dStroke;
      ctx.beginPath();
      ctx.moveTo(ankleX, ankleY);
      ctx.quadraticCurveTo(ankleX + leg.side * 8, (ankleY + clawTipY) * 0.5 - 2, clawTipX, clawTipY);
      ctx.stroke();

      // Ground Grip Contact Point
      ctx.fillStyle = leg.isMoving ? '#FFFFFF' : '#00F0FF';
      ctx.shadowColor = dShadow;
      ctx.shadowBlur = leg.isMoving ? 10 : 4;
      ctx.beginPath();
      ctx.arc(clawTipX, clawTipY, leg.isMoving ? 3.0 : 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // --- STEP B: INTERLOCKING V-SHAPED CARAPACE PLATES ---
    for (let i = NUM_VERTEBRAE - 1; i >= 1; i--) {
      const v = spine[i];
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      ctx.fillStyle = dFill;
      ctx.strokeStyle = i > 30 ? dStinger : dStroke;
      ctx.lineWidth = 1.6;

      if (i <= 14) {
        // Prosoma & Mesosoma
        const w = 26 - i * 0.9;
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(0, w);
        ctx.lineTo(-7, w * 0.85);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, -w * 0.85);
        ctx.lineTo(0, -w);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Metasoma (Arching Tail Ring Vertebrae)
        const tw = Math.max(5, 12 - (i - 14) * 0.25);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(0, tw);
        ctx.lineTo(-6, tw * 0.7);
        ctx.lineTo(-6, -tw * 0.7);
        ctx.lineTo(0, -tw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- STEP C: HEAVY ARTICULATED PINCERS (PEDIPALPS) ---
    const head = spine[0];
    drawScorpionPincer(ctx, head, head.angle + 0.7, 1, clickFlare);
    drawScorpionPincer(ctx, head, head.angle - 0.7, -1, clickFlare);

    // --- STEP D: OVERHEAD SEGMENTED STINGER TAIL TIP ---
    const tailTip = spine[NUM_VERTEBRAE - 1];
    ctx.save();
    ctx.translate(tailTip.x, tailTip.y);
    ctx.rotate(tailTip.angle);

    // Stinger Bulb
    ctx.fillStyle = clickFlare > 0 ? '#FFFFFF' : '#FF3366';
    ctx.shadowColor = '#FF3366';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Curved Venom Aculeus (Strikes forward on click)
    const strikeL = 26 + clickFlare * 18;
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(strikeL * 0.5, -12, strikeL, 2);
    ctx.stroke();

    ctx.restore();
  }

  // Pincers / Claws
  function drawScorpionPincer(ctx, root, angle, side, flare) {
    const l1 = 55;
    const l2 = 45;

    const j1x = root.x + Math.cos(angle) * l1;
    const j1y = root.y + Math.sin(angle) * l1;

    const forearmAngle = angle + side * 0.5;
    const handX = j1x + Math.cos(forearmAngle) * l2;
    const handY = j1y + Math.sin(forearmAngle) * l2;

    ctx.save();
    ctx.strokeStyle = dStroke;
    ctx.fillStyle = dFill;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(root.x, root.y);
    ctx.lineTo(j1x, j1y);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Heavy Pincer Claws (Snap shut on click)
    ctx.translate(handX, handY);
    ctx.rotate(forearmAngle);

    const jawA = 0.45 - flare * 0.35;

    // Upper claw
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, -18 * (1 + jawA), 36, -6);
    ctx.lineTo(24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower claw
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, 18 * (1 + jawA), 36, 6);
    ctx.lineTo(24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Sparks Particles
  function renderSparks(ctx) {
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const p = sparkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= p.decay;

      if (p.life <= 0) {
        sparkParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  requestAnimationFrame(render);
})();
