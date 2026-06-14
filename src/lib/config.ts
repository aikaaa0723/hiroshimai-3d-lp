import { useEffect, useMemo, useState } from "react";

/**
 * 配色トークン ＝ HiroshimAI ブランドトンマナ。
 * 方針: 「混色（3stop ブレンド）グラデは毒々しい」という過去FB（hiroshimai-3d）を踏まえ、
 * ロゴ実色ベースの**ポップ3原色を要素ごとに独立配色**する（ブレンドしない）。白地＋先進的・クール。
 * ※ ティール/シアン/緑は使わない。正式 HEX/CMYK 確定後（企画書 Part C-13）に差し替える。
 */
export const PALETTE = {
  // 背景（白地・クール）
  bgTop: "#FFFFFF",
  bgMid: "#F1F4FB",
  bgBottom: "#E4E9F4",
  fog: "#EDF0F8",
  // ポップ3原色（離散・要素ごとに使い分ける。混ぜない）
  blue: "#2F6FE0",
  violet: "#8B5CF6",
  pink: "#E41884",
  // 発光用にやや明るくした版（Bloom に拾わせる）。グローは青・ピンクの2色を離して使う。
  glowBlue: "#5B8CFF",
  glowViolet: "#A98BFF",
  glowPink: "#FF4FA3",
  glow: "#FFFFFF",
  // 構造体（白地で映えるよう深いインディゴ。マットセラミック〜金属の中間）
  panel: "#232844",
  panelLight: "#39406A",
  // テキスト（白地・濃紺主体）
  textHi: "#1C2030",
  textMid: "#5A6377",
  textLow: "#959DB1",
  ink: "#1C2030",
} as const;

/** 3D の離散3色（コンフェッティ）。index に対して循環させる。 */
export const POP3 = ["#2F6FE0", "#8B5CF6", "#E41884"] as const;
/** 上記の発光版（構造体エッジ/コア用）。 */
export const POP3_GLOW = ["#5B8CFF", "#A98BFF", "#FF4FA3"] as const;

/** スクロールのセクション数（= ScrollControls の pages）。
 *  0:Hero 1:Services 2:Implementation 3:Contact(ポータル接近) 4:AI空間(ワープ到達). */
export const SECTIONS = 5;

export type Quality = "high" | "low";

/**
 * 端末性能に応じた品質ティア。
 * スマホ/狭幅/低 DPR を "low" と判定し、粒子数・ポストエフェクト・影を削る。
 */
export function useQuality(): Quality {
  const [quality, setQuality] = useState<Quality>("high");

  useEffect(() => {
    const compute = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 820;
      const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
      setQuality(coarse || narrow || lowCores ? "low" : "high");
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return quality;
}

/** prefers-reduced-motion: reduce を監視。true の間は常時アニメーションを抑制する。 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** 品質ティアごとの具体的なパラメータ。Scene からまとめて参照する。 */
export function useQualitySettings() {
  const quality = useQuality();
  return useMemo(() => {
    const high = quality === "high";
    return {
      quality,
      dpr: (high ? [1, 2] : [1, 1.5]) as [number, number],
      particleCount: high ? 1400 : 450,
      enablePostFx: high, // Bloom / Noise / Vignette を出すか
      enableShadows: false, // 影は常時オフ（広い氷原では不要・重い）
      panelDetail: high ? 1 : 0, // Icosahedron の分割数 → パネル数
    };
  }, [quality]);
}
