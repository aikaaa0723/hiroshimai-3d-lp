import { useState } from "react";
import { motion } from "framer-motion";
import Scramble from "./Scramble";
import { useScrollOffset } from "../lib/useScrollOffset";

/**
 * 画面に固定表示される最前面 UI（スクロールしない）。
 * 左上ブランド（HiroshimAI）／コピーライト、下部のスクロール誘導 + サウンドトグル、
 * 右上の極小ステータス HUD（座標は広島：34.39N, 132.45E）。研究機器風の無機質さ。
 *
 * framer-motion でロード時にふわっと出す（3D の組み上がりに合わせた間合い）。
 * reducedMotion 時はアニメーションを無効化して即時表示。
 */
interface Props {
  reducedMotion: boolean;
}

export default function HeroOverlay({ reducedMotion }: Props) {
  const [sound, setSound] = useState(false);
  // オブジェクト計器アノテーションはヒーローでのみ表示し、スクロールで消す。
  const offset = useScrollOffset();
  const annoOpacity = Math.max(0, 1 - offset * 9);

  const fade = (delay: number) =>
    reducedMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="overlay">
      {/* 左上: ブランド + コピーライト */}
      <motion.div className="brand" {...fade(0.4)}>
        <div className="brand__name">
          Hiroshim<span className="ai">AI</span>
        </div>
        <div className="brand__copy">
          // Copyright © 2026
          <br />
          HiroshimAI Inc.
          <br />
          AIで広島から、未来を実装する。
        </div>
      </motion.div>

      {/* 右上: 極小ステータス HUD（座標は広島市）。各行をスクランブルで“解読”表示。 */}
      <motion.div className="status" {...fade(0.9)}>
        <Scramble text="SYS / HIROSHIMAI-CORE" delay={300} />
        <Scramble text="HIROSHIMA · 34.39N 132.45E" delay={450} />
        <span className="status__live">
          ● <Scramble text="IMPLEMENTING" delay={650} />
        </span>
      </motion.div>

      {/* オブジェクトの計器アノテーション（参考サイトの引き出し線＋読み値）。
          オブジェクト（中央やや右）に重ねる。スクロールでフェードアウト。
          framer-motion とは併用せず、scroll 連動の opacity のみで制御（競合回避）。 */}
      <div className="objanno" style={{ opacity: annoOpacity, transition: "opacity 0.2s linear" }}>
        {/* 引き出し線＋ティック（SVG。コンテナ内座標で対象中心へ伸ばす）。 */}
        <svg className="objanno__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points="10,16 30,16 46,44" />
          <polyline points="90,30 70,30 56,46" />
          <polyline points="84,82 64,82 56,58" />
          <circle cx="46" cy="44" r="0.9" />
          <circle cx="56" cy="46" r="0.9" />
          <circle cx="56" cy="58" r="0.9" />
        </svg>

        <div className="objanno__title">
          <Scramble text="CORE_01" delay={1100} />
          <span>ADAPTIVE INTELLIGENCE</span>
        </div>

        <div className="objanno__read">
          <span className="k">LOAD</span>
          <span className="v">41.2</span>
          <span className="k">SYNC</span>
          <span className="v">OK</span>
        </div>

        <div className="objanno__foot">
          <span>D 06.14.2026</span>
          <span className="objanno__cta">SCROLL TO EXPLORE</span>
        </div>
      </div>

      {/* 左下スクロール誘導 */}
      <motion.div className="scroll-hint" {...fade(1.2)}>
        <span className="scroll-hint__line" aria-hidden />
        <Scramble className="scroll-hint__label" text="Scroll to explore" delay={800} />
      </motion.div>

      {/* 左下(さらに下): サウンドトグル */}
      <motion.button
        className="sound"
        onClick={() => setSound((s) => !s)}
        {...fade(1.35)}
        aria-pressed={sound}
      >
        <span className={`sound__dot ${sound ? "is-on" : ""}`} />
        Sound: {sound ? "On" : "Off"}
      </motion.button>
    </div>
  );
}
