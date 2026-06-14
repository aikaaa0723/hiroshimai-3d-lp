/**
 * Canvas 上に重なるスクロールコンテンツ（drei <Scroll html> の中身）。
 * 文言はすべて企画書 v0.1 の Part A（確定情報）/ Part D（最上位方針）に準拠。
 * 確信度の低い Part C（実績数値・料金・登記名の確定表記など）は載せない＝「推測で決めない」。
 *
 * 各 <section> は 100vh。コンテナは pointer-events:none で 3D 操作・スクロールを通し、
 * 操作対象（カード/CTA）だけ pointer-events:auto に戻す（styles.css）。
 */
import Scramble from "./Scramble";

export default function ScrollSections() {
  return (
    <div className="sections">
      {/* ───────────── 01 HERO ───────────── */}
      {/* 正タグライン（C-14 で確定）を主役に。左寄せで 3D の右側に置き、可読性を確保。 */}
      <section className="section section--hero">
        <div className="hero-copy">
          <p className="hero-copy__eyebrow">広島発・AI実装パートナー</p>
          <h1 className="hero-copy__title">
            AIで広島から、
            <br />
            未来を<em>実装</em>する。
          </h1>
          <p className="hero-copy__lead">
            「AIを使いたい」で終わらせない。AIを現場へ実装し、
            <br />
            人を創造的な仕事へ戻す。成果が出るまで、伴走する。
          </p>
        </div>
      </section>

      {/* ───────────── 02 SERVICES（主力3領域 / A-5） ───────────── */}
      <section className="section section--modules">
        <header className="section__head">
          <Scramble className="section__index" text="// 02  SERVICES" />
          <h2 className="section__title">事業</h2>
          <p className="section__lead">
            入口は、顧問・研修・開発のどれでもいい。目的はひとつ、現場への「実装」。
            「どのAIを使うか」ではなく「どの作業を減らし、どの創造を増やすか」から設計する。
          </p>
        </header>

        <div className="cards">
          <article className="card">
            <span className="card__no">001</span>
            <h3 className="card__title">AI顧問</h3>
            <p className="card__body">
              外部CTO・AI顧問として経営に伴走。チャットで相談し放題、必要な時はすぐ動ける体制で、
              戦略から運用までを支える。
            </p>
            <Scramble className="card__meta" text="ADVISORY" />
          </article>

          <article className="card">
            <span className="card__no">002</span>
            <h3 className="card__title">AI研修</h3>
            <p className="card__body">
              基礎 → 実践 → 自動化の3STEP。「触れる」から「業務に組み込める」へ。
              研修後3ヶ月のフォローで、現場に定着するまで伴走する。
            </p>
            <Scramble className="card__meta" text="TRAINING" />
          </article>

          <article className="card">
            <span className="card__no">003</span>
            <h3 className="card__title">AIシステム開発</h3>
            <p className="card__body">
              要件定義から運用まで一気通貫。「作って終わり」ではなく、業務に根付くシステムを届ける。
              IoT（製造・物流・農業）も開発領域に含む。
            </p>
            <Scramble className="card__meta" text="BUILD & IoT" />
          </article>
        </div>
      </section>

      {/* ───────────── 03 IMPLEMENTATION（ロードマップ4フェーズ / A-9） ───────────── */}
      <section className="section section--arch">
        <header className="section__head section__head--right">
          <Scramble className="section__index" text="// 03  IMPLEMENTATION" />
          <h2 className="section__title">実装プロセス</h2>
          <p className="section__lead">
            構想で終わらせない。小さく試し、業務フローへ組み込み、現場に根付くまで磨き切る。
            広島から、成功パターンを型化して広げていく。
          </p>
        </header>

        {/* 企画書 A-9 の4フェーズをデバッグ HUD 風に。 */}
        <div className="hud-panel">
          <div className="hud-row">
            <span className="hud-row__k">構想</span>
            <span className="hud-row__v">課題と提供価値の仮説を定める</span>
            <span className="hud-row__s">01</span>
          </div>
          <div className="hud-row">
            <span className="hud-row__k">実証</span>
            <span className="hud-row__v">小さく試し、現場で価値を測る</span>
            <span className="hud-row__s">02</span>
          </div>
          <div className="hud-row">
            <span className="hud-row__k">実装</span>
            <span className="hud-row__v">業務フローへ組み込み、定着させる</span>
            <span className="hud-row__s">03</span>
          </div>
          <div className="hud-row">
            <span className="hud-row__k">展開</span>
            <span className="hud-row__v">型化し、広島から広げる</span>
            <span className="hud-row__s">04</span>
          </div>
        </div>
      </section>

      {/* ───────────── 04 CONTACT（ポータル接近） ───────────── */}
      {/* 「広島から、世界へ。」はワープ後の AI 空間(05)へ移設。ここは導線(CTA)のみ。 */}
      <section className="section section--contact">
        <div className="contact">
          <Scramble className="section__index" text="// 04  CONTACT" />
          <p className="contact__lead">
            人が、人にしかできない創造的な仕事に没頭できる社会をつくる。
            <br />
            その一歩を、一緒に。
          </p>
          <a className="cta" href="#contact">
            <span>相談する</span>
            <span className="cta__arrow">→</span>
          </a>
        </div>
      </section>

      {/* ───────────── 05 AI CORE（最深部・ワープ到達先） ───────────── */}
      {/* 主役は 3D の触れる粒子「AI」文字。「広島から、世界へ。」をこの空間に表示。 */}
      <section className="section section--core">
        <div className="core-finale">
          <span className="section__index core-finale__idx">// 05 &nbsp;AI CORE</span>
          <h2 className="contact__title">広島から、世界へ。</h2>
        </div>

        <footer className="footer">
          <div className="footer__brand">
            Hiroshim<span className="ai">AI</span>
          </div>
          <div className="footer__cols">
            <span>代表取締役　住田 隆真</span>
            <span>Hiroshima, Japan</span>
            <span>// Copyright © 2026 HiroshimAI Inc.</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
