import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { POP3 } from "../lib/config";
import { scrollState } from "../lib/scrollState";

/**
 * 触ると動く粒子の「AI」文字（最深部 AI 空間の主役。参考の粒子ペンギン代替）。
 * 文字をオフスクリーン Canvas に描画→不透明ピクセルをサンプルし、Z 方向に厚みを持たせて
 * 立体的なポイントクラウドにする。ゆっくり Y 回転して 3D 感を出し、
 * ポインタ/タッチが近づくと粒子が反発して散り、離すとスプリングで文字へ戻る。
 * 回転に追従させるため、ポインタ位置は worldToLocal でローカル空間に変換して判定する。
 */
interface Props {
  text?: string;
  position?: [number, number, number];
  /** 文字の横幅（ワールド単位・実寸正規化）。 */
  width?: number;
  /** 面の厚み（ワールド単位）。 */
  thickness?: number;
  /** 側面文字の奥行きスケール（横方向 → Z へ）。 */
  sideScale?: number;
  dense: boolean;
  reducedMotion: boolean;
}

/**
 * 文字をサンプルし、実寸(bbox)で targetWidth に正規化したうえで、
 * 「前面に読める AI(A)」と「側面に読める AI(B)」の2枚を直交配置してクロスにする。
 * → 正面(-Z)からは A が、側面(±X)からは B が「AI」として読める。回転しても読める。
 */
function sampleText(
  text: string,
  step: number,
  targetWidth: number,
  thickness: number,
  sideScale: number
) {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `700 300px "Space Grotesk", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);

  const data = ctx.getImageData(0, 0, W, H).data;
  // 1) 不透明ピクセルを集めて bbox を取る。
  const px: number[] = [];
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) {
        px.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  // 2) 実寸を targetWidth へ正規化。
  const scale = targetWidth / Math.max(1, maxX - minX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pts: number[] = [];
  let k = 0;
  for (let i = 0; i < px.length; i += 2) {
    const sx = (px[i] - cx) * scale; // 文字の横（ワールド）
    const sy = -(px[i + 1] - cy) * scale; // 文字の縦（ワールド）
    // A: 前面に読める（XY 平面、Z に薄い厚み）。常に生成（正面が主役）。
    pts.push(sx, sy, (Math.random() - 0.5) * thickness);
    // B: 側面に読める（横 → Z にマップ、X に薄い厚み）。
    //    正面中央にノイズの縦帯が出るのを避けるため、約 40% に間引く。
    if (k % 5 < 2) pts.push((Math.random() - 0.5) * thickness, sy, sx * sideScale);
    k++;
  }
  return new Float32Array(pts);
}

export default function ParticleText({
  text = "AI",
  position = [1.2, 0, -30],
  width = 3.6,
  thickness = 0.4,
  sideScale = 0.55,
  dense,
  reducedMotion,
}: Props) {
  const points = useRef<THREE.Points>(null!);
  const mat = useRef<THREE.PointsMaterial>(null!);
  const { camera, pointer } = useThree();

  const [base, setBase] = useState<Float32Array | null>(null);
  useEffect(() => {
    let alive = true;
    const build = () => {
      if (alive) setBase(sampleText(text, dense ? 2 : 4, width, thickness, sideScale));
    };
    if ((document as any).fonts?.ready) (document as any).fonts.ready.then(build);
    else build();
    return () => {
      alive = false;
    };
  }, [text, dense, width, thickness, sideScale]);

  const sim = useMemo(() => {
    if (!base) return null;
    const n = base.length / 3;
    const cur = new Float32Array(base);
    const vel = new Float32Array(base.length);
    const colors = new Float32Array(base.length);
    const cols = POP3.map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const c = cols[i % cols.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { n, cur, vel, colors };
  }, [base]);

  // 作業用ベクトル。
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const lastPointer = useRef(new THREE.Vector2(999, 999));
  const strength = useRef(0);

  useFrame((state, delta) => {
    if (!sim || !points.current || !mat.current) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    // 終盤(AI 空間)で出現。
    const targetOpacity = THREE.MathUtils.smoothstep(scrollState.offset, 0.84, 0.96);
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, targetOpacity, 0.1);
    points.current.visible = mat.current.opacity > 0.01;
    if (!points.current.visible) return;

    // 正面を主に見せつつ、時々ゆっくり振り向いて 3D（と側面の AI）を見せる。
    // sin^3 で中央(正面=0)に長く留まり、周期的に ±80°付近まで振れる。
    if (!reducedMotion) {
      const s = Math.sin(t * 0.3);
      points.current.rotation.y = s * s * s * 1.4;
      points.current.rotation.x = Math.sin(t * 0.15) * 0.05;
    }
    points.current.updateMatrixWorld();

    // ポインタ→（カメラに正対する平面）→ローカル座標へ変換（回転に追従）。
    points.current.getWorldPosition(worldPos);
    camera.getWorldDirection(camDir);
    plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), worldPos);
    ray.setFromCamera(pointer as THREE.Vector2, camera);
    const got = ray.ray.intersectPlane(plane, hit);
    let mlx = 9999;
    let mly = 9999;
    if (got) {
      const local = points.current.worldToLocal(hit.clone());
      mlx = local.x;
      mly = local.y;
    }

    // 操作強度（静止/離すと減衰）。
    const moved =
      Math.abs(pointer.x - lastPointer.current.x) +
        Math.abs(pointer.y - lastPointer.current.y) >
      0.0005;
    lastPointer.current.set(pointer.x, pointer.y);
    strength.current = reducedMotion ? 0 : moved ? 1 : strength.current * 0.92;

    const { n, cur, vel } = sim;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    const R = 1.4;
    const R2 = R * R;
    const spring = 22;
    const damp = 5.5;
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      let ax = 0;
      let ay = 0;
      let az = 0;

      if (strength.current > 0.01) {
        const dx = cur[ix] - mlx;
        const dy = cur[ix + 1] - mly;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 0.0001;
          const f = (1 - d / R) * 90 * strength.current;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
          az += (Math.random() - 0.5) * f * 0.6; // 奥行きにも散らす
        }
      }

      const idle = reducedMotion ? 0 : 0.015;
      const bx = base![ix] + Math.sin(t * 0.8 + i) * idle;
      const by = base![ix + 1] + Math.cos(t * 0.7 + i * 1.3) * idle;
      const bz = base![ix + 2] + Math.sin(t * 0.6 + i * 0.7) * idle;
      ax += (bx - cur[ix]) * spring;
      ay += (by - cur[ix + 1]) * spring;
      az += (bz - cur[ix + 2]) * spring;

      vel[ix] = (vel[ix] + ax * dt) * (1 - damp * dt);
      vel[ix + 1] = (vel[ix + 1] + ay * dt) * (1 - damp * dt);
      vel[ix + 2] = (vel[ix + 2] + az * dt) * (1 - damp * dt);
      cur[ix] += vel[ix] * dt;
      cur[ix + 1] += vel[ix + 1] * dt;
      cur[ix + 2] += vel[ix + 2] * dt;

      arr[ix] = cur[ix];
      arr[ix + 1] = cur[ix + 1];
      arr[ix + 2] = cur[ix + 2];
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!sim || !base) return null;

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(base), 3]} />
        <bufferAttribute attach="attributes-color" args={[sim.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={dense ? 0.032 : 0.04}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
