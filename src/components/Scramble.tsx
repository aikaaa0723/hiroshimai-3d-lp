import { useEffect, useState } from "react";

/**
 * テキストスクランブル（igloo.inc 風の「文字が解読されて現れる」演出）。
 * マウント時に各文字をランダムなグリフでシャッフルし、左から順に確定させる。
 * 技術ラベル（ラテン/モノスペース）に当てると HUD が起動する印象になる。
 * prefers-reduced-motion 時は即座に最終テキストを表示。
 */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%*+<>=";

interface Props {
  text: string;
  className?: string;
  /** 開始までの遅延(ms)。複数ラベルをずらして“順に解読”させる。 */
  delay?: number;
  /** 解読にかける時間(ms)。 */
  duration?: number;
}

export default function Scramble({ text, className, delay = 0, duration = 900 }: Props) {
  // 初期はマスク（同じ長さ）でレイアウトを安定させる。
  const [display, setDisplay] = useState(() => text.replace(/\S/g, "#"));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    let startT: number | undefined;
    let id = 0;
    const total = text.length;
    const end = delay + duration;

    const tick = (now: number) => {
      if (startT === undefined) startT = now;
      const elapsed = now - startT;
      const progress = Math.max(0, Math.min(1, (elapsed - delay) / duration));
      const revealed = progress * total;
      let out = "";
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === " ") out += " ";
        else if (i < revealed) out += ch;
        else out += CHARS[(Math.random() * CHARS.length) | 0];
      }
      setDisplay(out);
      if (elapsed < end) id = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [text, delay, duration]);

  return <span className={className}>{display}</span>;
}
