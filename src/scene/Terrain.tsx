import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE } from "../lib/config";

/**
 * 遠景の抽象的な山脈 / 地形レイヤー。
 * 平面の上辺だけをノイズで持ち上げてギザギザの稜線シルエットを作り、
 * 奥行き違いで複数枚重ねる。scene.fog がこれらを霧へ溶かし、奥行きの霞を出す。
 * カメラがスクロールで動くと相対的に「奥へ流れる」ように見える。
 */

/** 1 枚の稜線レイヤーのジオメトリを生成。 */
function makeRidge(width: number, height: number, seg: number, seed: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, seg, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0) {
      const x = pos.getX(i);
      // 複数周波数の sin を重ねて自然な稜線に。
      const n =
        Math.sin(x * 0.35 + seed) * 0.5 +
        Math.sin(x * 0.9 + seed * 2.3) * 0.25 +
        Math.sin(x * 1.9 + seed * 5.1) * 0.12;
      pos.setY(i, y + n * height * 0.5);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

interface LayerProps {
  z: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  seed: number;
}

function RidgeLayer({ z, width, height, color, opacity, seed }: LayerProps) {
  const geo = useMemo(() => makeRidge(width, height, 60, seed), [width, height, seed]);
  return (
    <mesh geometry={geo} position={[0, -2.2, z]}>
      {/* fog の影響を受ける basic マテリアルでシルエットだけ見せる。 */}
      <meshBasicMaterial color={color} transparent opacity={opacity} fog depthWrite={false} />
    </mesh>
  );
}

export default function Terrain() {
  return (
    <group>
      {/* 白地に映える淡いクールグレーの稜線。手前ほど少し濃く、奥は霧色へ。 */}
      <RidgeLayer z={-9} width={40} height={5} color={PALETTE.textLow} opacity={0.32} seed={1.0} />
      <RidgeLayer z={-15} width={56} height={7} color={PALETTE.bgBottom} opacity={0.34} seed={3.7} />
      <RidgeLayer z={-22} width={72} height={9} color={PALETTE.fog} opacity={0.45} seed={6.2} />
    </group>
  );
}
