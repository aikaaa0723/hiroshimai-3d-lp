import { useScrollOffset } from "../lib/useScrollOffset";
import { SECTIONS } from "../lib/config";

/**
 * 画面全体を覆う“計器フレーム”（参考サイトの研究機器 UI を再現）。
 * - 背景に薄いゴーストの技術テキスト
 * - 四隅のクロスヘア／コーナーティック
 * - 左右のシェブロン（‹ ›）
 * - 下中央のブラケット選択ナビ（現在セクションを [ ] で囲む・他は減光）
 * すべて装飾なので pointer-events:none（スクロール/3D 操作を妨げない）。
 */
const NAV = ["HERO", "SERVICES", "IMPLEMENT", "CONTACT", "AI//CORE"];

export default function HudFrame() {
  const offset = useScrollOffset();
  const active = Math.round(offset * (SECTIONS - 1));

  return (
    <div className="hudframe">
      {/* 背景ゴーストテキスト（極薄） */}
      <div className="hudframe__ghost" aria-hidden>
        ADAPTIVE
        <br />
        INTELLIGENCE
      </div>

      {/* 四隅のコーナーティック */}
      <span className="corner corner--tl" aria-hidden />
      <span className="corner corner--tr" aria-hidden />
      <span className="corner corner--bl" aria-hidden />
      <span className="corner corner--br" aria-hidden />

      {/* 中央クロスヘア（散らした計測マーク） */}
      <span className="xhair xhair--a" aria-hidden />
      <span className="xhair xhair--b" aria-hidden />
      <span className="xhair xhair--c" aria-hidden />

      {/* 左右シェブロン */}
      <span className="chevron chevron--l" aria-hidden>
        ‹
      </span>
      <span className="chevron chevron--r" aria-hidden>
        ›
      </span>

      {/* 下中央: ブラケット選択ナビ */}
      <nav className="bracketnav" aria-hidden>
        {NAV.map((label, i) => (
          <span
            key={label}
            className={`bracketnav__item ${i === active ? "is-active" : ""}`}
          >
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
