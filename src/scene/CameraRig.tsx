import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "../lib/scrollState";

/**
 * カメラの主動作をすべて担当するリグ。
 *
 * 意図する 3 種類の動きを 1 箇所で合成する:
 *  1) スクロール: セクションごとのキーフレーム位置/注視点を補間（オブジェクトに寄る→内部→引く）。
 *  2) パララックス: マウス位置に応じてごくわずかにカメラをずらす（高級感のある追従）。
 *  3) ブリージング: 常時、極小の sin 揺れで「呼吸している」ような生命感を出す。
 */

// 空間レイアウト（奥行き -Z へ進む）:
//   コア(dome)= z 0 / ポータルリング = z -10 / AI空間(粒子文字) = z -24。
//   カメラは手前(+Z)からコアを抜け、ポータルの穴を通過(ワープ)し、最深部の AI 空間へ到達する。
const CAM_KEYFRAMES: { pos: THREE.Vector3; target: THREE.Vector3 }[] = [
  // 0: Hero — コア全景を右寄りに収める
  { pos: new THREE.Vector3(0.0, 0.4, 9.5), target: new THREE.Vector3(1.2, 0.0, 0.0) },
  // 1: Services — 斜め上から、分解した姿を見る
  { pos: new THREE.Vector3(3.6, 1.3, 6.6), target: new THREE.Vector3(1.2, 0.1, 0.0) },
  // 2: Implementation — 内部のコアへ肉薄（視線を奥へ向け始める。発光コアを上側から避けて通過）
  { pos: new THREE.Vector3(1.25, 0.8, 3.0), target: new THREE.Vector3(1.2, 0.1, -1.5) },
  // 3: Contact — 分解したコアを抜け、ポータルリング(z-10)に正対して接近（コア中心は上方からかわす）
  { pos: new THREE.Vector3(1.2, 1.1, -4.0), target: new THREE.Vector3(1.2, 0.1, -10.0) },
  // 4: AI 空間 — ポータルを通過し、最深部の粒子「AI」文字(z-24)に到達
  { pos: new THREE.Vector3(1.2, 0.0, -20.5), target: new THREE.Vector3(1.2, 0.0, -24.0) },
];

interface Props {
  reducedMotion: boolean;
}

export default function CameraRig({ reducedMotion }: Props) {
  const scroll = useScroll();
  const { camera, pointer } = useThree();

  // 補間結果を保持して毎フレーム lerp（カクつき防止）。
  const pos = useRef(CAM_KEYFRAMES[0].pos.clone());
  const target = useRef(CAM_KEYFRAMES[0].target.clone());
  const tmpPos = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // スクロール速度/位置を DOM・ポストエフェクト側へ橋渡し（useScroll は ScrollControls 外で不可）。
    scrollState.velocity = scroll.delta;
    scrollState.offset = scroll.offset;
    // ワープ強度: ポータル通過区間(終盤)で 0→1→0。色収差/速度線/ブラーを駆動。
    const o = scroll.offset;
    const wIn = THREE.MathUtils.smoothstep(o, 0.76, 0.86);
    const wOut = THREE.MathUtils.smoothstep(o, 0.9, 1.0);
    scrollState.warp = wIn * (1 - wOut);

    // scroll.offset は 0..1。セクション区間 [0, SECTIONS-1] にスケールする。
    const seg = scroll.offset * (CAM_KEYFRAMES.length - 1);
    const i = Math.min(CAM_KEYFRAMES.length - 2, Math.floor(seg));
    const f = THREE.MathUtils.clamp(seg - i, 0, 1);
    // smoothstep で区間境界を滑らかに → 中途半端なスクロールでもスナップ感が出る。
    const e = f * f * (3 - 2 * f);

    tmpPos.current.lerpVectors(CAM_KEYFRAMES[i].pos, CAM_KEYFRAMES[i + 1].pos, e);
    tmpTarget.current.lerpVectors(CAM_KEYFRAMES[i].target, CAM_KEYFRAMES[i + 1].target, e);

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      // ブリージング: 位置と注視点を極小に揺らす。
      tmpPos.current.x += Math.sin(t * 0.25) * 0.12;
      tmpPos.current.y += Math.cos(t * 0.2) * 0.1;
      // パララックス: マウスに対して控えめ（hero ほど効かせ、奥に行くほど弱める）。
      const parallax = 0.6 * (1 - e * 0.5);
      tmpPos.current.x += pointer.x * parallax;
      tmpPos.current.y += pointer.y * parallax * 0.6;
    }

    // 慣性付きで追従。delta 補正で FPS 非依存に。
    const k = 1 - Math.pow(0.0015, delta);
    pos.current.lerp(tmpPos.current, k);
    target.current.lerp(tmpTarget.current, k);

    camera.position.copy(pos.current);
    camera.lookAt(target.current);
  });

  return null;
}
