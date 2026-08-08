/**
 * Single source of truth for drawing the standard knitting symbols on a node-canvas
 * 2D context. Parameterized by size/color/stroke/pad so the same vector art can be
 * used both to (a) generate the crisp 64px PNG icons and (b) synthesize an augmented
 * training dataset (jittered color/stroke/scale/rotation/noise) for the recognizer.
 */
import type { CanvasRenderingContext2D } from "canvas";

export type DrawOpts = {
  size: number;
  color: string;
  stroke: number;
  pad: number;
};

type Ctx = CanvasRenderingContext2D;

function line(ctx: Ctx, o: DrawOpts, x1: number, y1: number, x2: number, y2: number, w = o.stroke) {
  ctx.strokeStyle = o.color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function text(ctx: Ctx, o: DrawOpts, s: string) {
  ctx.fillStyle = o.color;
  ctx.font = `bold ${Math.floor(o.size * 0.45)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, o.size / 2, o.size / 2 + 2);
}

const DRAWINGS: Record<string, (ctx: Ctx, o: DrawOpts) => void> = {
  knit: (ctx, o) => line(ctx, o, o.size / 2, o.pad, o.size / 2, o.size - o.pad),
  purl: (ctx, o) => line(ctx, o, o.pad, o.size / 2, o.size - o.pad, o.size / 2),
  "yarn-over": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, o.size / 2 - o.pad, 0, Math.PI * 2);
    ctx.stroke();
  },
  "purl-in-yarn-over": (ctx, o) => {
    const r = o.size / 2 - o.pad;
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = o.color + "33";
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, r, 0, Math.PI);
    ctx.lineTo(o.size / 2 + r, o.size / 2);
    ctx.fill();
  },
  "cross-purl": (ctx, o) => {
    const r = o.size / 2 - o.pad - 2;
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, o, o.size / 2 - r + 2, o.size / 2, o.size / 2 + r - 2, o.size / 2, o.stroke - 0.5);
  },
  "cross-knit": (ctx, o) => {
    const r = o.size / 2 - o.pad - 2;
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, o, o.size / 2, o.size / 2 - r + 2, o.size / 2, o.size / 2 + r - 2, o.stroke - 0.5);
  },
  "k2tog-left": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.size - o.pad, o.pad + 4);
    ctx.lineTo(o.pad + 4, o.size / 2);
    ctx.lineTo(o.size - o.pad, o.size - o.pad - 4);
    ctx.stroke();
  },
  "k2tog-right": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.pad, o.pad + 4);
    ctx.lineTo(o.size - o.pad - 4, o.size / 2);
    ctx.lineTo(o.pad, o.size - o.pad - 4);
    ctx.stroke();
  },
  "p2tog-left": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke - 0.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.size - o.pad - 4, o.pad + 6);
    ctx.lineTo(o.pad + 8, o.size / 2);
    ctx.lineTo(o.size - o.pad - 4, o.size - o.pad - 6);
    ctx.stroke();
    line(ctx, o, o.pad + 2, o.pad + 4, o.pad + 2, o.size - o.pad - 4, o.stroke - 0.5);
  },
  "p2tog-right": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke - 0.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.pad + 4, o.pad + 6);
    ctx.lineTo(o.size - o.pad - 8, o.size / 2);
    ctx.lineTo(o.pad + 4, o.size - o.pad - 6);
    ctx.stroke();
    line(ctx, o, o.size - o.pad - 2, o.pad + 4, o.size - o.pad - 2, o.size - o.pad - 4, o.stroke - 0.5);
  },
  k3tog: (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.size / 2, o.pad + 2);
    ctx.lineTo(o.pad + 2, o.size - o.pad);
    ctx.lineTo(o.size - o.pad - 2, o.size - o.pad);
    ctx.closePath();
    ctx.stroke();
  },
  p3tog: (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.size / 2, o.size - o.pad - 2);
    ctx.lineTo(o.pad + 2, o.pad + 2);
    ctx.lineTo(o.size - o.pad - 2, o.pad + 2);
    ctx.closePath();
    ctx.stroke();
  },
  "slip-back": (ctx, o) => {
    ctx.fillStyle = o.color + "B3";
    ctx.beginPath();
    ctx.moveTo(o.pad + 2, o.size / 2);
    ctx.lineTo(o.size - o.pad - 2, o.pad + 4);
    ctx.lineTo(o.size - o.pad - 2, o.size - o.pad - 4);
    ctx.closePath();
    ctx.fill();
  },
  "slip-front": (ctx, o) => {
    ctx.strokeStyle = o.color;
    ctx.lineWidth = o.stroke;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.size / 2, o.size - o.pad - 2);
    ctx.lineTo(o.pad + 4, o.pad + 4);
    ctx.lineTo(o.size - o.pad - 4, o.pad + 4);
    ctx.closePath();
    ctx.stroke();
    line(ctx, o, o.size / 2, o.pad + 4, o.size / 2, o.size - o.pad - 2, o.stroke - 1);
  },
  "two-from-one": (ctx, o) => text(ctx, o, "2/"),
  "three-from-one": (ctx, o) => text(ctx, o, "3/"),
  "four-from-one": (ctx, o) => text(ctx, o, "4/"),
  "four-together": (ctx, o) => text(ctx, o, "4\\"),
  "five-from-one": (ctx, o) => text(ctx, o, "5/"),
  "five-together": (ctx, o) => text(ctx, o, "5\\"),
  "five-knit": (ctx, o) => {
    const gap = (o.size - o.pad * 2) / 4;
    for (let i = 0; i < 5; i++) {
      const x = o.pad + gap * i;
      line(ctx, o, x, o.pad, x, o.size - o.pad, o.stroke - 0.5);
    }
  },
  wrap: (ctx, o) => {
    line(ctx, o, o.pad + 4, o.pad + 4, o.size - o.pad - 4, o.size - o.pad - 4);
    line(ctx, o, o.size - o.pad - 4, o.pad + 4, o.pad + 4, o.size - o.pad - 4);
  },
  bobble: (ctx, o) => {
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, o.size / 2 - o.pad - 2, 0, Math.PI * 2);
    ctx.fill();
  },
  empty: (ctx, o) => {
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(o.size / 2, o.size / 2, Math.max(3, o.size * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }
};

/** Symbol ids covered by the drawings (the single-cell standard set). */
export const DRAWING_IDS: string[] = Object.keys(DRAWINGS);

export function drawSymbol(ctx: Ctx, id: string, opts: DrawOpts): boolean {
  const fn = DRAWINGS[id];
  if (!fn) return false;
  fn(ctx, opts);
  return true;
}
