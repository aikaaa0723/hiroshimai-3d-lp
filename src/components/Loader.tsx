import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Scramble from "./Scramble";

/**
 * ローディングイントロ（igloo.inc 風）。
 * 000→100 のカウンタ＋スクランブル文字＋進捗バーを表示し、
 * 完了後に上方向へスライドしながらフェードして 3D シーンへ“流入”する。
 * 背後では既に AICore の reveal タイムラインが進むため、暗幕が上がると組み上がりが見える。
 * reducedMotion 時は一瞬で消す。
 */
interface Props {
  reducedMotion: boolean;
}

export default function Loader({ reducedMotion }: Props) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      setCount(100);
      setDone(true);
      return;
    }
    const obj = { v: 0 };
    const tl = gsap.timeline();
    // カウントアップ（緩急のある power2）。
    tl.to(obj, {
      v: 100,
      duration: 2.6,
      ease: "power2.inOut",
      onUpdate: () => setCount(Math.round(obj.v)),
    });
    // 上方向スライド＋フェードでシーンへ流入。
    tl.to(
      root.current,
      {
        yPercent: -100,
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => setDone(true),
      },
      "+=0.15"
    );
    // 安全弁: 何らかの理由（バックグラウンドタブで rAF 停止等）でタイムラインが
    // 進まなくてもローダーが恒久的に画面を塞がないよう、最大6秒で必ず解除する。
    const fallback = window.setTimeout(() => setDone(true), 6000);
    return () => {
      tl.kill();
      window.clearTimeout(fallback);
    };
  }, [reducedMotion]);

  if (done) return null;

  return (
    <div className="loader" ref={root}>
      <div className="loader__inner">
        <div className="loader__brand">
          Hiroshim<span className="ai">AI</span>
        </div>
        <Scramble className="loader__tag" text="INITIALIZING IMPLEMENTATION RUNTIME" duration={1600} />
        <div className="loader__bar">
          <span style={{ transform: `scaleX(${count / 100})` }} />
        </div>
        <div className="loader__count">{String(count).padStart(3, "0")}</div>
      </div>
    </div>
  );
}
