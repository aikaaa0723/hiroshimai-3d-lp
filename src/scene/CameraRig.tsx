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

// セクションごとのカメラ位置と注視点。オブジェクトは x≈1.2 にオフセット配置している。
const CAM_KEYFRAMES: { pos: THREE.Vector3; target: THREE.Vector3 }[] = [
  // 0: Hero — 全景を右寄りに収める
  { pos: new THREE.Vector3(0.0, 0.4, 10.0), target: new THREE.Vector3(1.2, 0.0, 0.0) },
  // 1: Intelligence Modules — 斜め上から、分解した姿を見る
  { pos: new THREE.Vector3(3.4, 1.4, 7.2), target: new THREE.Vector3(1.2, 0.1, 0.0) },
  // 2: System Architecture — 内部のコアへ肉薄
  { pos: new THREE.Vector3(1.25, 0.1, 2.6), target: new THREE.Vector3(1.2, 0.0, 0.0) },
  // 3: Contact / Footer — 遠景へ引き、さらに見上げる構図にして構造体を画面下方へ落とす。
  //    （見出し/CTA を上半分のクリーンな余白に置けるよう、target.y を上げて視線を上向きに）
  { pos: new THREE.Vector3(0.0, 0.6, 19.0), target: new THREE.Vector3(0.8, 1.6, 0.0) },
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
