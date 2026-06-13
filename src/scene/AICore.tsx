import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox, useScroll } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { PALETTE, POP3, POP3_GLOW } from "../lib/config";
import { buildPanels, type PanelData } from "../lib/panels";
import HudLabel from "../components/HudLabels";

/** 構造体の基準半径と、コア球の半径（隙間からコアが覗くよう小さめ）。 */
const SHELL_RADIUS = 1.5;
const CORE_RADIUS = 0.85;

/**
 * スクロール量(0..1)→「分解度」へのマッピング。
 * Hero=0(完全結合) → Modules=1(最大分解) → Architecture=0.35(内部観察のため少し開く)
 * → Contact=0.12(ほぼ再結合して遠景へ)。セクション間は線形補間。
 */
function explodeAt(offset: number): number {
  const keys = [0, 0.35, 0.12, 0.05]; // ↑のニュアンスを 4 セクションに割当
  const seg = offset * (keys.length - 1);
  const i = Math.min(keys.length - 2, Math.floor(seg));
  const f = THREE.MathUtils.clamp(seg - i, 0, 1);
  return THREE.MathUtils.lerp(keys[i], keys[i + 1], f * f * (3 - 2 * f));
}

// ポップ3原色を離散で使う（混ぜない）。パネルごとに index で 1 色に割り当て、
// 構造体全体を「3色のコンフェッティ」に見せる（過去FB「混色グラデは毒々しい」を回避）。
const C_POP = POP3.map((c) => new THREE.Color(c));
const C_POP_GLOW = POP3_GLOW.map((c) => new THREE.Color(c));

interface PanelProps {
  data: PanelData;
  total: number;
  reveal: React.MutableRefObject<number>;
  reducedMotion: boolean;
}

/**
 * パネル 1 枚。位置(浮遊/分解)・上下動・出現(reveal)・ホバー発光を毎フレーム更新する。
 * 個体ごとに useFrame を持つが、R3F は単一ループで束ねて呼ぶため許容範囲。
 */
function Panel({ data, total, reveal, reducedMotion }: PanelProps) {
  const group = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.MeshStandardMaterial>(null!);
  const scroll = useScroll();
  const [hovered, setHovered] = useState(false);

  // 浮遊ブロックは分解時に大きく外へ出る。通常ブロックは控えめ。
  const floatDist = data.floating ? 1.25 : 0.4;
  // 出現タイミング: index が後ろのものほど遅れて立ち上がる（順番に組み上がる演出）。
  const threshold = 0.18 + (data.index / total) * 0.6;

  // パネルごとに3原色を1色割り当て（離散・コンフェッティ）。seed で散らす。
  const ci = (data.index + (data.seed % 3)) % 3;
  const emissiveColor = C_POP[ci];
  const edgeColor = C_POP_GLOW[ci];

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // --- 出現(reveal) ---
    const appear = reducedMotion
      ? 1
      : THREE.MathUtils.smoothstep(reveal.current, threshold, threshold + 0.18);
    const s = 0.0001 + appear; // 0 だと行列が潰れて警告が出るため極小から
    group.current.scale.setScalar(s);
    group.current.visible = appear > 0.001;

    // --- 分解 + 上下動 ---
    const explode = explodeAt(scroll.offset);
    const bobAmp = reducedMotion ? 0 : data.floating ? 0.08 : 0.03;
    const bob = Math.sin(t * (0.6 + (data.seed % 5) * 0.12) + data.seed) * bobAmp;
    const lift = hovered ? 0.16 : 0; // ホバーで少し浮かす
    const r = SHELL_RADIUS + explode * floatDist + bob + lift;
    group.current.position.copy(data.normal).multiplyScalar(r);
    group.current.quaternion.copy(data.quaternion);

    // --- 発光 ---
    if (mat.current) {
      const pulse = reducedMotion || !data.floating ? 0 : (Math.sin(t * 2 + data.seed) * 0.5 + 0.5) * 0.25;
      const target = (hovered ? 1.6 : 0.12) + pulse;
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(
        mat.current.emissiveIntensity,
        target,
        0.12
      );
    }
  });

  return (
    <group ref={group}>
      <RoundedBox
        args={[data.size[0], data.size[1], data.size[2]]}
        radius={0.02}
        smoothness={2}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* 深インディゴのマットセラミック〜金属。発光色は位置依存のブランドグラデ。 */}
        <meshStandardMaterial
          ref={mat}
          color={PALETTE.panel}
          roughness={0.5}
          metalness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={0.12}
        />
        {/* エッジの発光ライン。左=青〜右=マゼンタで Bloom が縁取りを光らせる。 */}
        <Edges threshold={12} color={edgeColor} />
      </RoundedBox>

      {/* 浮遊ブロックにだけ HUD ライン + 番号ラベルを接続。 */}
      {data.floating && <HudLabel data={data} reducedMotion={reducedMotion} />}
    </group>
  );
}

interface CoreProps {
  reveal: React.MutableRefObject<number>;
  reducedMotion: boolean;
}

/** 内側で発光するコア。隙間から白い光を漏らしつつ、青/マゼンタの2灯で横グラデを作る。 */
function InnerCore({ reveal, reducedMotion }: CoreProps) {
  const lightBlue = useRef<THREE.PointLight>(null!);
  const lightMag = useRef<THREE.PointLight>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // コアは reveal の前半で立ち上がる（光が先、ブロックが後）。
    const appear = reducedMotion ? 1 : THREE.MathUtils.smoothstep(reveal.current, 0.05, 0.4);
    // 不規則なパルス（2 つの sin を重ねて周期を崩す）。
    const pulse = reducedMotion ? 1 : 0.8 + Math.sin(t * 1.3) * 0.12 + Math.sin(t * 2.7) * 0.06;
    if (mesh.current) mesh.current.scale.setScalar(appear);
    if (mat.current) mat.current.opacity = appear * pulse;
    if (lightBlue.current) lightBlue.current.intensity = appear * pulse * 2.6;
    if (lightMag.current) lightMag.current.intensity = appear * pulse * 2.6;
  });

  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[CORE_RADIUS, 2]} />
        <meshBasicMaterial ref={mat} color={PALETTE.glow} transparent toneMapped={false} />
      </mesh>
      {/* グローは青・ピンクの「離れた2ブロブ」で（混ぜない）。内側から構造体を照らす。 */}
      <pointLight ref={lightBlue} color={PALETTE.blue} position={[-0.7, 0.2, 0.4]} distance={7} decay={2} />
      <pointLight ref={lightMag} color={PALETTE.pink} position={[0.7, -0.2, 0.4]} distance={7} decay={2} />
    </group>
  );
}

interface Props {
  detail: number;
  reducedMotion: boolean;
}

/**
 * AI コア構造体のルート。x≈1.2 に配置（Hero で右寄りに見せるため）。
 * 常時ゆっくり自転しつつ、スクロールに応じて追加回転する。
 */
export default function AICore({ detail, reducedMotion }: Props) {
  const root = useRef<THREE.Group>(null!);
  const scroll = useScroll();
  const reveal = useRef(0); // 0→1 のロード進捗（gsap で駆動）
  const panels = useMemo(() => buildPanels(detail), [detail]);

  // マウント時のロードタイムライン: 霧/CSS背景は即時 → 光(コア/エッジ) → ブロック順次。
  useMemo(() => {
    if (reducedMotion) {
      reveal.current = 1;
      return;
    }
    gsap.fromTo(reveal, { current: 0 }, { current: 1, duration: 3.4, ease: "power2.inOut" });
  }, [reducedMotion]);

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const spin = reducedMotion ? 0 : t * 0.05;
    // スクロールで大きく回す（分解と合わせて「回転・分解・再構築」を見せる）。
    root.current.rotation.y = spin + scroll.offset * Math.PI * 0.9;
    root.current.rotation.x = Math.sin(t * 0.1) * 0.05 + scroll.offset * 0.3;
  });

  return (
    <group ref={root} position={[1.2, 0, 0]}>
      <InnerCore reveal={reveal} reducedMotion={reducedMotion} />
      {panels.map((p) => (
        <Panel
          key={p.index}
          data={p}
          total={panels.length}
          reveal={reveal}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
