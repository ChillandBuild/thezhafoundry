'use client';

import { useEffect, useRef } from 'react';

// domain-warped fbm mapped onto the brand heat ramp — liquid copper in the
// crucible under foundry night, a warm mirage under foundry daylight
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_light;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 2.2;
  float t = u_time * 0.055;

  vec2 q = vec2(fbm(p + t * 0.7), fbm(p + vec2(5.2, 1.3) - t * 0.4));
  vec2 r = vec2(
    fbm(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.35),
    fbm(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.25)
  );
  float f = fbm(p + 2.4 * r);

  vec3 carbon = vec3(0.078, 0.066, 0.062);
  vec3 deep   = vec3(0.549, 0.227, 0.055);
  vec3 copper = vec3(0.878, 0.471, 0.188);
  vec3 hot    = vec3(1.0, 0.698, 0.369);
  vec3 pale   = vec3(1.0, 0.769, 0.420);

  vec3 c = mix(carbon, deep, smoothstep(0.15, 0.50, f));
  c = mix(c, copper, smoothstep(0.45, 0.72, f));
  c = mix(c, hot, smoothstep(0.68, 0.88, f));
  c = mix(c, pale, smoothstep(0.86, 1.0, f));

  vec3 day = vec3(0.949, 0.929, 0.894);
  vec3 cl = mix(day, copper, smoothstep(0.25, 0.95, f) * 0.55);
  cl = mix(cl, deep, smoothstep(0.75, 1.0, f) * 0.35);
  c = mix(c, cl, u_light);

  float alpha = mix(smoothstep(0.20, 0.75, f), smoothstep(0.35, 0.90, f) * 0.8, u_light);
  gl_FragColor = vec4(c, alpha);
}
`;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const DPR_CAP = 1.5;
const RENDER_SCALE = 0.6; // shader runs under-resolution; fbm is soft anyway

function isLightTheme(): boolean {
  const explicit = document.documentElement.dataset.theme;
  if (explicit) return explicit === 'light';
  return !window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function MoltenField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return; // static CSS hero remains the fallback

    let raf = 0;
    let program: WebGLProgram | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uLight: WebGLUniformLocation | null = null;
    let light = isLightTheme() ? 1 : 0;
    let lightTarget = light;
    let visible = true;
    const start = performance.now();

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const setup = () => {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      uRes = gl.getUniformLocation(program, 'u_res');
      uTime = gl.getUniformLocation(program, 'u_time');
      uLight = gl.getUniformLocation(program, 'u_light');
      return true;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP) * RENDER_SCALE;
      canvas.width = Math.max(1, Math.round(canvas.offsetWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.offsetHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const frame = () => {
      if (!visible || !program) return;
      light += (lightTarget - light) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform1f(uLight, light);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };

    const play = () => {
      cancelAnimationFrame(raf);
      if (visible && program) raf = requestAnimationFrame(frame);
    };

    if (!setup()) return;
    resize();
    play();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      play();
    });
    io.observe(canvas);

    const onVisibility = () => {
      visible = !document.hidden;
      play();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const themeObserver = new MutationObserver(() => {
      lightTarget = isLightTheme() ? 1 : 0;
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      lightTarget = isLightTheme() ? 1 : 0;
    };
    scheme.addEventListener('change', onScheme);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
    };
    const onRestored = () => {
      if (setup()) {
        resize();
        play();
      }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      scheme.removeEventListener('change', onScheme);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, []);

  return <canvas ref={ref} className="molten-field" aria-hidden="true" />;
}
