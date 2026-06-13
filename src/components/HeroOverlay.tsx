import { useState } from "react";
import { motion } from "framer-motion";

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

      {/* 右上: 極小ステータス HUD（座標は広島市） */}
      <motion.div className="status" {...fade(0.9)}>
        <span>SYS / HIROSHIMAI-CORE</span>
        <span>HIROSHIMA · 34.39N 132.45E</span>
        <span className="status__live">● IMPLEMENTING</span>
      </motion.div>

      {/* 左下スクロール誘導 */}
      <motion.div className="scroll-hint" {...fade(1.2)}>
        <span className="scroll-hint__line" aria-hidden />
        <span className="scroll-hint__label">Scroll to explore</span>
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
