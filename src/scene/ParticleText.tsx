import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { POP3 } from "../lib/config";
import { scrollState } from "../lib/scrollState";

/**
 * 触ると動く粒子の「AI」文字（参考サイトの粒子ペンギンの代替）。
 * 文字をオフスクリーン Canvas に描画→不透明ピクセルをサンプルしてポイントクラウド化。
 * ポインタ/タッチが近づくと粒子が反発して散り、離すとスプリングで元の文字へ戻る。
 * 常時わずかに揺らぎ（アイドル）、ヒーロー以外ではフェードアウト。
 */
interface Props {
  text?: string;
  position?: [number, number, number];
  /** 文字の横幅（ワールド単位）。 */
  width?: number;
  dense: boolean;
  reducedMotion: boolean;
}

/** 文字を Canvas に描いて不透明ピクセル座標をサンプル → 中央化した base 配置を返す。 */
function sampleText(text: string, step: number, width: number) {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `700 240px "Space Grotesk", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2);

  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) {
        // 横幅で正規化（アスペクト維持）→ ワールド単位へ。
        const nx = (x - W / 2) / W;
        const ny = -(y - H / 2) / W;
        pts.push(nx * width, ny * width, (Math.random() - 0.5) * 0.03);
      }
    }
  }
  return new Float32Array(pts);
}

export default function ParticleText({
  text = "AI",
  position = [1.2, 0, 1.7],
  width = 2.6,
  dense,
  reducedMotion,
}: Props) {
  const points = useRef<THREE.Points>(null!);
  const mat = useRef<THREE.PointsMaterial>(null!);
  const { camera, pointer } = useThree();

  // フォント読み込み後にサンプルし直す（Space Grotesk の字形で安定させる）。
  const [base, setBase] = useState<Float32Array | null>(null);
  useEffect(() => {
    let alive = true;
    const build = () => {
      if (!alive) return;
      setBase(sampleText(text, dense ? 5 : 8, width));
    };
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(build);
    } else {
      build();
    }
    return () => {
      alive = false;
    };
  }, [text, dense, width]);

  // 現在位置 / 速度 / 色を base から初期化。
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

  // ポインタ→文字平面の交点（ローカル座標）と、操作の強さ（停止/離すと減衰）。
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), -position[2]),
    [position]
  );
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const hit = useRef(new THREE.Vector3());
  const lastPointer = useRef(new THREE.Vector2(999, 999));
  const strength = useRef(0);

  useFrame((state, delta) => {
    if (!sim || !points.current || !mat.current) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    // ヒーローでのみ濃く、スクロールでフェード。
    const targetOpacity = Math.max(0, 1 - scrollState.offset * 6);
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, targetOpacity, 0.08);
    points.current.visible = mat.current.opacity > 0.01;
    if (!points.current.visible) return;

    // ポインタが動いていれば操作強度を上げ、止まる/離すと減衰（タッチ後も自然に戻る）。
    const moved =
      Math.abs(pointer.x - lastPointer.current.x) +
        Math.abs(pointer.y - lastPointer.current.y) >
      0.0005;
    lastPointer.current.set(pointer.x, pointer.y);
    strength.current = reducedMotion
      ? 0
      : moved
      ? 1
      : strength.current * 0.92;

    // ポインタの文字平面上の位置（ローカル）。
    ray.setFromCamera(pointer as THREE.Vector2, camera);
    const got = ray.ray.intersectPlane(plane, hit.current);
    const mx = got ? hit.current.x - position[0] : 9999;
    const my = got ? hit.current.y - position[1] : 9999;

    const { n, cur, vel } = sim;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    const R = 0.55;
    const R2 = R * R;
    const spring = 26; // 戻る強さ
    const damp = 6; // 減衰
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      let ax = 0;
      let ay = 0;
      let az = 0;

      // 反発（ポインタ近傍）。
      if (strength.current > 0.01) {
        const dx = cur[ix] - mx;
        const dy = cur[ix + 1] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 0.0001;
          const f = (1 - d / R) * 60 * strength.current;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
          az += (0.4 - d) * 6 * strength.current; // 少し手前へ
        }
      }

      // base へのスプリング＋アイドル揺らぎ。
      const idle = reducedMotion ? 0 : 0.012;
      const bx = base![ix] + Math.sin(t * 0.8 + i) * idle;
      const by = base![ix + 1] + Math.cos(t * 0.7 + i * 1.3) * idle;
      const bz = base![ix + 2] + Math.sin(t * 0.6 + i * 0.7) * idle * 2;
      ax += (bx - cur[ix]) * spring;
      ay += (by - cur[ix + 1]) * spring;
      az += (bz - cur[ix + 2]) * spring;

      // 積分（半陰的）。
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
        size={dense ? 0.02 : 0.026}
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
