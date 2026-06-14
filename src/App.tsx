import { useQualitySettings, useReducedMotion } from "./lib/config";
import Scene from "./components/Scene";
import HeroOverlay from "./components/HeroOverlay";
import HudFrame from "./components/HudFrame";
import SceneTransition from "./components/SceneTransition";
import WarpOverlay from "./components/WarpOverlay";
import Loader from "./components/Loader";

/**
 * アプリのルート。
 * 構成は「固定の WebGL Canvas（Scene）＋ 最前面の固定 UI（HeroOverlay）＋
 * CSS のグレイン/ビネット」。背景グラデーションは body（styles.css）。
 *
 * 端末性能(useQualitySettings)と prefers-reduced-motion(useReducedMotion)を一度だけ
 * 解決し、下位コンポーネントへ配って不要な再計算を避ける。
 */
export default function App() {
  const settings = useQualitySettings();
  const reducedMotion = useReducedMotion();

  return (
    <>
      <Scene settings={settings} reducedMotion={reducedMotion} />

      {/* 環境光: 上部のポータル光（天井照明）＋四隅のフロスト。氷ドーム内の空気感。 */}
      <div className="env-glow" aria-hidden />
      <div className="env-frost" aria-hidden />

      {/* 計器フレーム（ゴーストテキスト/クロスヘア/シェブロン/ブラケットナビ）。 */}
      <HudFrame />
      <HeroOverlay reducedMotion={reducedMotion} />

      {/* 画面転換: セクション切替時にフロストフラッシュ＋色収差スパイク。 */}
      <SceneTransition reducedMotion={reducedMotion} />

      {/* ワープ: ポータル通過時の放射速度線＋放射ブラー。 */}
      <WarpOverlay reducedMotion={reducedMotion} />

      {/* 画面全体の薄いフィルムグレイン（postFx が無いモバイルでも質感を担保）。 */}
      <div className="grain" aria-hidden />

      {/* ローディングイントロ（最前面）。完了後に自らアンマウントする。 */}
      <Loader reducedMotion={reducedMotion} />
    </>
  );
}
