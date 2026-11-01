# 🦂 Mecha Scorpion — 3-Segment Arachnid Gait

A real-time **procedural mecha scorpion** rendered entirely on HTML5 Canvas 2D — no sprites, no models, no animation files, no libraries. Every leg, joint and step is computed from math each frame.

Move your mouse → the scorpion crawls toward your cursor with a true **alternating arachnid gait**.  
Click → pincers snap shut and the tail stings venom sparks.

![demo](demo.gif) <!-- thêm GIF demo vào repo -->

## ✨ Features

- **8 true 3-segment legs** — coxa→femur→tibia→tarsus claw chain, each solved with inverse kinematics
- **Alternating arachnid crawl** — legs step in phase-shifted pairs, with grounded foot anchoring
- **Footstep anchoring** — feet stay planted until body drifts past a stride threshold, then step arcs with 3D lift shadow
- **48-vertebrae carapace spine** solved with **FABRIK** IK
- **Articulated pincers** (pedipalps) that snap open/shut on click
- **Segmented venom stinger** — glowing red aculeus that strikes forward on click
- **Spark particle system** — venom burst physics with decay
- **Zero dependencies** — pure vanilla JS, ~500 lines
- **60 FPS** via `requestAnimationFrame`, auto-resize

## 🧠 How it works

| Component | Technique |
|---|---|
| Spine (48 segments) | FABRIK — each vertebra drags parent to fixed segment length |
| Legs (8 × 3 segments) | Analytic IK per leg — 2-bone solve for femur/tibia + offset ankle for tarsus |
| Gait | Footstep anchoring + phase-shifted pairs (odd/even) for alternating crawl |
| Pincers | Rigid transform + quadratic-curve claws with `flare`-driven jaw angle |
| Stinger | Rigid transform on tail tip + `flare`-driven strike length |
| Sparks | Particle pool — `vx, vy, life, decay, size` per frame |

## 🚀 Run it

```bash
git clone https://github.com/<you>/mecha-scorpion
cd mecha-scorpion
# just open index.html — no build step
