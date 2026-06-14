import * as THREE from "three";
import { PALETTE } from "../lib/config";

/**
 * 中央オブジェクトの足元に置く円形ペデスタル（同心円リング＋薄いディスク）。
 * 参考サイトの「氷のドーム内の台座」を再現し、浮遊する構造体に“設置面”を与える。
 * 白地で視認できるよう、リングは淡いクールグレー〜ブランド青の極細ラインにする。
 */
const RINGS = [
  { r: 1.0, op: 0.5, color: PALETTE.blue },
  { r: 1.7, op: 0.32, color: PALETTE.textLow },
  { r: 2.5, op: 0.22, color: PALETTE.textLow },
  { r: 3.4, op: 0.14, color: PALETTE.textLow },
];

export default function Pedestal({
  position = [1.2, -1.85, 0],
}: {
  position?: [number, number, number];
}) {
  return (
    // 対象の真下に水平配置（XZ 平面）。
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 床のごく薄いディスク（中心を少し締めて“台座”に見せる）。 */}
      <mesh>
        <circleGeometry args={[3.6, 72]} />
        <meshBasicMaterial
          color={PALETTE.bgBottom}
          transparent
          opacity={0.18}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 同心円リング（極細）。 */}
      {RINGS.map((ring, i) => (
        <mesh key={i}>
          <ringGeometry args={[ring.r - 0.008, ring.r, 120]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.op}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
