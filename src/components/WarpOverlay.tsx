import { useEffect, useRef, useState } from "react";
import { scrollState } from "../lib/scrollState";

/**
 * ワープ演出のフルスクリーンオーバーレイ（DOM）。
 * scrollState.warp(0→1→0) に応じて、中心から放射する速度線＋放射ブラー＋白トンネルを出す。
 * ポータルリングを通過する終盤に、3D 側の色収差スパイクと合わせて「吸い込まれ／ワープ」を作る。
 * reducedMotion 時は無効。
 */
interface Props {
  reducedMotion: boolean;
}

export default function WarpOverlay({ reducedMotion }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    let id = 0;
    const loop = () => {
      const w = scrollState.warp;
      const el = ref.current;
      if (el) {
        el.style.opacity = String(Math.min(1, w * 1.2));
        // 中心からズーム＆放射ブラーで吸い込まれる感覚。
        el.style.transform = `scale(${1 + w * 0.6})`;
        el.style.backdropFilter = w > 0.02 ? `blur(${w * 7}px)` : "none";
      }
      setActive(w > 0.01);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  if (reducedMotion) return null;
  return (
    <div
      ref={ref}
      className={`warp ${active ? "is-active" : ""}`}
      style={{ opacity: 0 }}
      aria-hidden
    >
      <div className="warp__streaks" />
      <div className="warp__core" />
    </div>
  );
}
