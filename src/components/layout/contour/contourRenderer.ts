import { CONTOUR_FRAG, CONTOUR_UNIFORMS, CONTOUR_VERT, type ContourUniform } from './contourShader';

/** Colours and shape of the field: the "lime torch" variant. */
export const CONTOUR = {
  bg: '#151816', // = --color-bg, so the canvas edge is invisible
  line: '#2a3126',
  glow: '#bde66a', // --color-accent
  /** Contour steps across the noise range: more = denser lines. */
  bands: 5,
  /** How far the cursor pushes the field. */
  warp: 0.15,
  /** Torch radius and strength, in viewport heights. */
  glowR: 0.28,
  glowAmt: 0.85,
  /** Line half-width in CSS pixels. */
  thick: 1.1,
  /** Render resolution cap (as on landonorris.com); touch screens render at 1. */
  maxDpr: 1.25,
  touchDpr: 1,
} as const;

export interface ContourFrame {
  time: number;
  /** Cursor in height-normalised coordinates, origin bottom-left. */
  mouseX: number;
  mouseY: number;
  /** 0..1: how fast the cursor is moving. */
  pace: number;
  /** 0..1: the lime torch (0 on touch screens and under reduced motion). */
  glow: number;
}

export interface ContourRenderer {
  resize: () => void;
  draw: (f: ContourFrame) => void;
  dispose: () => void;
}

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error('contour: could not create shader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`contour: ${gl.getShaderInfoLog(s) ?? 'compile failed'}`);
  return s;
}

/** Returns null when WebGL or derivatives are missing: the page then stays plain graphite. */
export function createContourRenderer(canvas: HTMLCanvasElement): ContourRenderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  const vert = compile(gl, gl.VERTEX_SHADER, CONTOUR_VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, CONTOUR_FRAG);
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // one triangle that covers the screen
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = Object.fromEntries(CONTOUR_UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<ContourUniform, WebGLUniformLocation | null>;
  gl.uniform3fv(u.uBg, hex(CONTOUR.bg));
  gl.uniform3fv(u.uLine, hex(CONTOUR.line));
  gl.uniform3fv(u.uGlow, hex(CONTOUR.glow));
  gl.uniform1f(u.uBands, CONTOUR.bands);
  gl.uniform1f(u.uWarp, CONTOUR.warp);
  gl.uniform1f(u.uGlowR, CONTOUR.glowR);

  let dpr = 1;
  const resize = () => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    dpr = Math.min(window.devicePixelRatio || 1, fine ? CONTOUR.maxDpr : CONTOUR.touchDpr);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uThick, CONTOUR.thick * dpr);
  };
  resize();

  return {
    resize,
    draw: (f) => {
      gl.uniform1f(u.uTime, f.time);
      gl.uniform2f(u.uMouse, f.mouseX, f.mouseY);
      gl.uniform1f(u.uPace, f.pace);
      gl.uniform1f(u.uGlowAmt, CONTOUR.glowAmt * f.glow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    // not loseContext(): a remount (React strict mode) gets the same canvas back and needs a live context
    dispose: () => {
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buffer);
    },
  };
}
