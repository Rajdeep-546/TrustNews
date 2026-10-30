import React, { useEffect, useRef, useState } from 'react';

export interface CloudBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  dim?: number; // 0.0 (bright) to 1.0 (very dark/dimmed), default 0.65
  speed?: number; // drift speed multiplier, default 0.6
  colorTint?: 'cyan-blue' | 'twilight' | 'monochrome' | 'aurora';
  blurLevel?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
}

const VERTEX_SHADER_SRC = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dim;
uniform int u_tint; // 0: cyan-blue, 1: twilight, 2: monochrome, 3: aurora

// Hash & Noise algorithms for realistic procedural volumetric clouds
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 5-Octave Fractional Brownian Motion (fBm)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.52), sin(0.52), -sin(0.52), cos(0.52));
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = rot * p * 2.05 + shift;
    a *= 0.48;
  }
  return v;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  st.x *= aspect;

  // Gentle horizontal wind drift + subtle vertical billow + mouse parallax
  vec2 wind = vec2(u_time * 0.035, u_time * 0.012);
  vec2 mouseOffset = (u_mouse - 0.5) * 0.08;
  vec2 p = st * 2.2 + wind + mouseOffset;

  // Multi-tier turbulence mapping
  float q = fbm(p);
  vec2 r = vec2(
    fbm(p + q + vec2(1.7, 9.2) + 0.12 * u_time),
    fbm(p + q + vec2(8.3, 2.8) + 0.10 * u_time)
  );
  float f = fbm(p + r * 1.2);

  // Palette configurations
  vec3 bgCol = vec3(0.015, 0.02, 0.04); // deep space black
  vec3 cloudLow = vec3(0.03, 0.08, 0.18);
  vec3 cloudMid = vec3(0.08, 0.28, 0.48);
  vec3 cloudHigh = vec3(0.25, 0.58, 0.82);

  if (u_tint == 1) { // twilight (indigo/purple)
    cloudLow = vec3(0.08, 0.04, 0.16);
    cloudMid = vec3(0.24, 0.12, 0.38);
    cloudHigh = vec3(0.48, 0.28, 0.72);
  } else if (u_tint == 2) { // monochrome (sleek slate)
    cloudLow = vec3(0.05, 0.06, 0.08);
    cloudMid = vec3(0.18, 0.20, 0.24);
    cloudHigh = vec3(0.45, 0.48, 0.54);
  } else if (u_tint == 3) { // aurora (emerald/cyan)
    cloudLow = vec3(0.02, 0.10, 0.08);
    cloudMid = vec3(0.06, 0.32, 0.24);
    cloudHigh = vec3(0.18, 0.65, 0.52);
  }

  // Smooth color mixing across density octaves
  vec3 col = mix(bgCol, cloudLow, clamp(f * f * 2.0, 0.0, 1.0));
  col = mix(col, cloudMid, clamp(pow(q, 1.5) * 0.9, 0.0, 1.0));
  col = mix(col, cloudHigh, clamp(pow(r.x, 2.4) * 0.8, 0.0, 1.0));

  // Natural spherical vignette & soft edge dissipation
  vec2 normUV = gl_FragCoord.xy / u_resolution.xy;
  float dist = length(normUV - vec2(0.5, 0.5));
  float vignette = smoothstep(1.15, 0.25, dist);

  // Apply user-controlled dim factor (preserving vibrant subtle glows in highlights)
  float dimMultiplier = clamp(1.0 - (u_dim * 0.75), 0.1, 1.0);
  col *= vignette * dimMultiplier;

  // Add subtle star/grain dust in background depth
  float grain = hash(normUV * 800.0 + fract(u_time * 0.5)) * 0.025;
  col += vec3(grain) * (1.0 - u_dim * 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`;

export const CloudBackground: React.FC<CloudBackgroundProps> = ({
  className = '',
  children,
  dim = 0.68,
  speed = 0.6,
  colorTint = 'cyan-blue',
  blurLevel = 'md',
  interactive = true,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const animFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Mouse move handler for subtle parallax sliding effect
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // WebGL Initialization & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Compile Vertex Shader
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vShader) return;
    gl.shaderSource(vShader, VERTEX_SHADER_SRC);
    gl.compileShader(vShader);

    // Compile Fragment Shader
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fShader) return;
    gl.shaderSource(fShader, FRAGMENT_SHADER_SRC);
    gl.compileShader(fShader);

    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      console.warn('CloudBackground shader error:', gl.getShaderInfoLog(fShader));
      setWebglSupported(false);
      return;
    }

    // Link Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    // Full-screen quad geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uDim = gl.getUniformLocation(program, 'u_dim');
    const uTint = gl.getUniformLocation(program, 'u_tint');

    let tintVal = 0;
    if (colorTint === 'twilight') tintVal = 1;
    else if (colorTint === 'monochrome') tintVal = 2;
    else if (colorTint === 'aurora') tintVal = 3;

    let targetWidth = 0;
    let targetHeight = 0;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5x for silky smooth GPU performance
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (w !== targetWidth || h !== targetHeight) {
        targetWidth = w;
        targetHeight = h;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    let active = true;

    const render = () => {
      if (!active) return;

      const elapsed = ((Date.now() - startTimeRef.current) / 1000) * speed;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uDim, dim);
      gl.uniform1i(uTint, tintVal);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(buffer);
    };
  }, [dim, speed, colorTint]);

  // Blur class mapping
  const blurClasses = {
    none: '',
    sm: 'backdrop-blur-xs',
    md: 'backdrop-blur-sm',
    lg: 'backdrop-blur-md',
  }[blurLevel];

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic WebGL Shader Canvas for Procedural Sliding Clouds */}
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none object-cover transition-opacity duration-1000"
        />
      ) : (
        /* Fallback 2D animated CSS radial cloud blobs if WebGL is unavailable */
        <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none bg-neutral-950 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-900/40 to-black animate-pulse" />
          <div className="absolute top-1/4 -right-1/4 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl animate-bounce" />
        </div>
      )}

      {/* Atmospheric Dimming, Sliding Blur & Vignette Overlays */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none ${blurClasses} bg-gradient-to-b from-black/20 via-black/40 to-black/85`}
      />

      {/* Subtle Bottom Fade to seamlessly blend into subsequent sections */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"
      />

      {/* Optional Inset Content */}
      {children && (
        <div className="relative z-10 w-full">
          {children}
        </div>
      )}
    </div>
  );
};

export default CloudBackground;
