import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { PALETTE, SECTIONS } from "../lib/config";
import CameraRig from "../scene/CameraRig";
import Lights from "../scene/Lights";
import AICore from "../scene/AICore";
import Particles from "../scene/Particles";
import Terrain from "../scene/Terrain";
import ScrollSections from "./ScrollSections";

interface Settings {
  dpr: [number, number];
  particleCount: number;
  enablePostFx: boolean;
  panelDetail: number;
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
      <Particles count={settings.particleCount} reducedMotion={reducedMotion} />

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
          <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
