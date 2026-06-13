import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { POP3 } from "../lib/config";
import type { PanelData } from "../lib/panels";

/**
 * 浮遊ブロックに接続する HUD: 細いリードライン + ラベル。
 * ラベルは企画書(Part A)の Values / Operating Principles / サービス / 中心概念から採り、
 * 浮遊モジュール＝HiroshimAI を構成する要素、という見立てにする（飾りの番号ではなく意味を持たせる）。
 * 親（パネル group）のローカル座標で描くので、+Z がパネルの外向き（法線）方向になる。
 */

// 企画書由来のブランド語彙。en（モノスペース見出し）＋ jp（補足）＋ cat（分類コード）。
const LABELS: { en: string; jp: string; cat: string }[] = [
  // Operating Principles（勝ち方の技術）
  { en: "SPEED", jp: "スピード", cat: "PRINCIPLE" },
  { en: "VOLUME", jp: "圧倒的量", cat: "PRINCIPLE" },
  { en: "QUALITY", jp: "クオリティ", cat: "PRINCIPLE" },
  { en: "CREATE", jp: "創造", cat: "PRINCIPLE" },
  { en: "SINCERITY", jp: "誠実", cat: "PRINCIPLE" },
  // Values（人格の土台）
  { en: "SUNAO", jp: "素直", cat: "VALUE" },
  { en: "KANSHA", jp: "感謝", cat: "VALUE" },
  { en: "JISEKI", jp: "自責", cat: "VALUE" },
  // 中心概念 / サービス
  { en: "IMPLEMENT", jp: "実装", cat: "CORE" },
  { en: "EMBED", jp: "定着", cat: "CORE" },
  { en: "ALONGSIDE", jp: "伴走", cat: "CORE" },
  { en: "ADVISORY", jp: "AI顧問", cat: "SERVICE" },
  { en: "TRAINING", jp: "AI研修", cat: "SERVICE" },
  { en: "BUILD", jp: "AI開発", cat: "SERVICE" },
];

interface Props {
  data: PanelData;
  reducedMotion: boolean;
}

export default function HudLabel({ data, reducedMotion }: Props) {
  const dot = useRef<THREE.Mesh>(null!);

  // 3原色を離散で割り当て（パネルと同じ規則）。リードライン/ドットに使う。
  const lineColor = useMemo(
    () => new THREE.Color(POP3[(data.index + (data.seed % 3)) % 3]),
    [data.index, data.seed]
  );

  // ラベルを出す先（パネルから少し外＆斜め上へ）。seed で左右に振り分ける。
  const end = useMemo(() => {
    const side = data.seed % 2 === 0 ? 1 : -1;
    return new THREE.Vector3(0.22 * side, 0.2, 0.34);
  }, [data.seed]);

  // リードラインの折れ点（1 回曲げて計器っぽく）。
  const points = useMemo(
    () => [
      new THREE.Vector3(0, 0, data.size[2] * 0.5),
      new THREE.Vector3(end.x * 0.5, end.y * 0.5, end.z * 0.7),
      end,
    ],
    [end, data.size]
  );

  const label = LABELS[data.index % LABELS.length];
  const code = `${label.cat}_${(data.index % 9) + 1}`;

  useFrame((state) => {
    if (dot.current && !reducedMotion) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3 + data.seed) * 0.2;
      dot.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <Line points={points} color={lineColor} lineWidth={0.7} transparent opacity={0.6} />
      {/* 接続点のドット。 */}
      <mesh ref={dot} position={end}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={lineColor} toneMapped={false} />
      </mesh>
      {/* pointer-events は .hud-tag 側の CSS で無効化している（3D 操作を邪魔しない）。 */}
      <Html position={end} center={false} distanceFactor={6} zIndexRange={[10, 0]}>
        <div className="hud-tag">
          <span className="hud-id">{label.en}</span>
          <span className="hud-coord">{label.jp}</span>
          <span className="hud-coord">{code}</span>
        </div>
      </Html>
    </group>
  );
}
