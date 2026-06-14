import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  SMAA,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { PALETTE, SECTIONS } from "../lib/config";
import { scrollState } from "../lib/scrollState";
import CameraRig from "../scene/CameraRig";
import Lights from "../scene/Lights";
import AICore from "../scene/AICore";
import Particles from "../scene/Particles";
import Terrain from "../scene/Terrain";
import Pedestal from "../scene/Pedestal";
import ParticleText from "../scene/ParticleText";
import PortalRing from "../scene/PortalRing";
import ScrollSections from "./ScrollSections";

interface Settings {
  dpr: [number, number];
  particleCount: number;
  enablePostFx: boolean;
  panelDetail: number;
}

/**
 * 色収差を毎フレーム駆動するだけのコンポーネント（描画は持たず null を返す）。
 * EffectComposer は直下の子から effect を収集するため、ChromaticAberration は
 * composer の直接の子として置き、その ref をここで更新する（ラッパで包むと収集されない）。
 * igloo.inc のシーン遷移の質感: 常時わずか＋スクロール速度で“フロスト/にじみ”が増す。
 */
function AberrationDriver({
  caRef,
  reducedMotion,
}: {
  caRef: React.MutableRefObject<any>;
  reducedMotion: boolean;
}) {
  useFrame(() => {
    const e = caRef.current;
    if (!e || !e.offset) return;
    if (!reducedMotion) scrollState.pulse *= 0.9; // 遷移パルスを減衰
    const base = 0.0006;
    // 速度連動＋セクション切替パルス＋ワープ（ポータル通過時に強い色収差）。
    const v = reducedMotion
      ? 0
      : Math.min(scrollState.velocity * 6, 0.006) +
        scrollState.pulse * 0.014 +
        scrollState.warp * 0.03;
    const x = THREE.MathUtils.lerp(e.offset.x, base + v, 0.2);
    e.offset.set(x, x * 0.7);
  });
  return null;
}

interface Props {
  settings: Settings;
  reducedMotion: boolean;
}

/**
 * WebGL シーン全体。Canvas は CSS で画面に固定（styles.css）。
 * 背景グラデーションは CSS 側（body）が担当し、Canvas は透過させて重ねる。
 * fog がシーンを霧色へ溶かし、遠景の地形と粒子に奥行きを与える。
 */
export default function Scene({ settings, reducedMotion }: Props) {
  // 色収差エフェクトの ref（composer 直下の effect とドライバで共有）。
  const caRef = useRef<any>(null);
  return (
    <Canvas
      className="webgl"
      dpr={settings.dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0.4, 10] }}
    >
      {/* 霧: カメラ距離 11 から霧色へ。遠景(地形/粒子)だけ霞ませ、主役は明瞭に保つ。 */}
      <fog attach="fog" args={[PALETTE.fog, 11, 32]} />

      <Lights />
      <Terrain />
      {/* コアの台座（z0）と AI 空間の台座（z-24）。 */}
      <Pedestal />
      <Pedestal position={[1.2, -2.0, -24]} />
      {/* コアと AI 空間の境界＝ポータルリング（z-10）。ここを通過してワープする。 */}
      <PortalRing reducedMotion={reducedMotion} />
      {/* 最深部 AI 空間の、触ると動く粒子「AI」文字。 */}
      <ParticleText dense={settings.panelDetail > 0} reducedMotion={reducedMotion} />
      <Particles count={settings.particleCount} reducedMotion={reducedMotion} />
      {settings.enablePostFx && (
        <AberrationDriver caRef={caRef} reducedMotion={reducedMotion} />
      )}

      {/* スクロール駆動。damping で慣性を持たせ、セクション遷移を滑らかにする。 */}
      <ScrollControls pages={SECTIONS} damping={0.28} distance={1}>
        <CameraRig reducedMotion={reducedMotion} />
        <AICore detail={settings.panelDetail} reducedMotion={reducedMotion} />

        {/* HTML セクション（Canvas 上に重なるスクロールコンテンツ）。 */}
        <Scroll html>
          <ScrollSections />
        </Scroll>
      </ScrollControls>

      {/* ポストエフェクト: 高品質時のみ。Bloom=発光、Noise=フィルム粒状、Vignette=四隅減光。 */}
      {settings.enablePostFx && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          {/* スクロール速度連動の色収差（igloo 風の遷移質感）。ref は AberrationDriver が更新。 */}
          <ChromaticAberration
            ref={caRef}
            offset={new THREE.Vector2(0.0006, 0.0004)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
