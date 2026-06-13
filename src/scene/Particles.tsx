import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "../lib/config";

/**
 * 奥行きのある雪粒子 / ダスト。
 * 箱状の領域にランダム配置し、毎フレームわずかに手前(+z)へ流す → 端で奥へラップ。
 * fog と合わせて「霧の中をゆっくり流れる粒子」を作る。additive で淡く光らせる。
 */
interface Props {
  count: number;
  reducedMotion: boolean;
}

const RANGE = { x: 26, y: 16, z: 30 };

export default function Particles({ count, reducedMotion }: Props) {
  const points = useRef<THREE.Points>(null!);

  // 初期位置とドリフト速度（粒子ごとに微妙に変える）。
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * RANGE.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * RANGE.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE.z;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const half = RANGE.z * 0.5;
    for (let i = 0; i < count; i++) {
      // 手前へドリフト。
      arr[i * 3 + 2] += speeds[i] * delta * 0.8;
      // 横方向にゆらぎ（雪が漂う感じ）。
      arr[i * 3 + 0] += Math.sin(t * 0.3 + i) * delta * 0.04;
      // カメラ手前を抜けたら奥へ戻す。
      if (arr[i * 3 + 2] > half) arr[i * 3 + 2] = -half;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* 白地では加算合成だと粒子が見えないため通常合成。淡い青紫グレーで霧の塵に。 */}
      <pointsMaterial
        size={0.03}
        sizeAttenuation
        color={PALETTE.panelLight}
        transparent
        opacity={0.4}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
