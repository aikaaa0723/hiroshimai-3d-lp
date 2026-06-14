import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, POP3_GLOW } from "../lib/config";
import { scrollState } from "../lib/scrollState";

/**
 * ポータルリング（参考スクショの「氷ブロックが連なった発光リング」）。
 * コア(z0)と AI 空間(z-24)の間 z-10 に置き、カメラはこの穴を通過してワープする。
 * 構成: 内側に強発光のトーラス(Bloom で白く光る縁) ＋ 外周に氷ブロック(角丸箱)を環状配置。
 * 接近/通過(scrollState.warp)で発光が増し、ゆっくり自転する。
 */
const SEG = 14; // 氷ブロックの数
const RADIUS = 3.0;

interface Props {
  reducedMotion: boolean;
}

export default function PortalRing({ reducedMotion }: Props) {
  const group = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.MeshBasicMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);

  // 氷ブロックの配置（環状・各ブロックは接線方向）。
  const blocks = useMemo(() => {
    const arr: { pos: THREE.Vector3; rotZ: number; size: [number, number, number]; ci: number }[] = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const x = Math.cos(a) * RADIUS;
      const y = Math.sin(a) * RADIUS;
      arr.push({
        pos: new THREE.Vector3(x, y, 0),
        rotZ: a + Math.PI / 2, // 接線方向へ
        size: [1.25, 0.55, 0.55],
        ci: i % POP3_GLOW.length,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    if (!reducedMotion) group.current.rotation.z = t * 0.08;
    // 接近/通過で発光を強める。
    if (glow.current) glow.current.opacity = 0.7 + scrollState.warp * 0.3;
    if (light.current) light.current.intensity = 2 + scrollState.warp * 8;
    group.current.scale.setScalar(1 + scrollState.warp * 0.04 * Math.sin(t * 20));
  });

  return (
    <group ref={group} position={[1.2, 0, -12]}>
      {/* 内側の発光トーラス（Bloom が拾って白く光る縁）。 */}
      <mesh>
        <torusGeometry args={[RADIUS, 0.12, 16, 96]} />
        <meshBasicMaterial ref={glow} color={PALETTE.glow} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {/* 外周の氷ブロック群。 */}
      {blocks.map((b, i) => (
        <group key={i} position={b.pos} rotation={[0, 0, b.rotZ]}>
          <RoundedBox args={b.size} radius={0.06} smoothness={2}>
            <meshStandardMaterial
              color={PALETTE.panelLight}
              roughness={0.4}
              metalness={0.4}
              emissive={POP3_GLOW[b.ci]}
              emissiveIntensity={0.25}
            />
          </RoundedBox>
        </group>
      ))}
      {/* リング中心からの光。通過時に強く明滅。 */}
      <pointLight ref={light} color={PALETTE.glow} distance={12} decay={2} intensity={2} />
    </group>
  );
}
