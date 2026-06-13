# HiroshimAI — 3D Landing Page (Vite + R3F)

没入感のある 3D ビジュアルを主役にした 1 ページ完結の LP。
コピー・構成は **企画書 v0.1（`vault/HP/HiroshimAI-HP-企画書-v0.1.md`）** の確定情報（Part A / Part D）に準拠し、
トンマナは公式ロゴの **ブルー→パープル→マゼンタ グラデ＋白地（Part E）** に合わせています。
（igloo.inc のビジュアル構造・体験設計を参考に制作。ロゴ/文章/モデル等のブランド要素は流用していません。）

> ⚠️ ディレクトリ名は制作初期の仮名（NEXORA）由来のままです。中身は HiroshimAI 化済み。
> ⚠️ 既存の `hiroshimai-3d/`（Next.js 版）とは別物の Vite 版です。

## 技術スタック

- React + Vite + TypeScript
- Three.js / React Three Fiber + `@react-three/drei`
- `@react-three/postprocessing`（Bloom / Noise / Vignette / SMAA）
- GSAP（ロード時の組み上がり）/ Framer Motion（オーバーレイのフェードイン）

## セットアップ

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + 本番ビルド
npm run preview
```

外部 3D モデルに依存せず、構造体はすべて Three.js プリミティブ（正二十面体ベースのパネル群＋コア球）で生成。

## コンテンツ（企画書準拠）

1. **Hero** — 正タグライン「AIで広島から、未来を実装する。」＋ミッション一文
2. **事業（SERVICES）** — AI顧問 / AI研修 / AIシステム開発（IoT は開発に内包＝Part C-2 安全側）
3. **実装プロセス（IMPLEMENTATION）** — 構想 → 実証 → 実装 → 展開（Part A-9 ロードマップ）
4. **Contact** — 「広島から、世界へ。」（Vision）＋ Purpose ＋ CTA「相談する」＋ フッター（代表 住田 隆真）

- 確信度の低い Part C 項目（実績数値=C-6 / 料金=C-7 / 登記名の確定表記=C-1）は **「推測で決めない」** に従い非掲載。
- 浮遊する 3D ブロックの HUD ラベルは、企画書の **Values / Operating Principles / サービス語彙** から採用。

## トンマナ実装メモ

- **混色（ブレンド）グラデは使わない**（過去FB「毒々しい」を踏まえ hiroshimai-3d 同様）。
  ロゴ実色ベースの**ポップ3原色を要素ごとに独立配色**する：青 `#2F6FE0` / 紫 `#8B5CF6` / ピンク `#E41884`。
- ワードマークは "Hiroshim"＝濃紺 + "AI"＝ピンク（ロゴ準拠）。見出し番号・カード・HUD フェーズ名は 3 色を循環。
  CTA は単色（青）、ヒーロー「実装」とコンタクト見出しは単色アクセント。
- 3D 構造体は各パネルに 3 色のいずれかを離散割当（コンフェッティ）。コアのグローは青・ピンクの**離れた 2 ブロブ**。
- 白地＋淡い霧＋発光エッジ（Bloom）で「先進的・クール」を表現。**シアン/ティール/緑は不使用**。
- レスポンシブ（粒子/パネル/ポストエフェクトを低負荷端末で削減）＋ `prefers-reduced-motion` 対応。

## 主要ファイル

```
src/
├─ App.tsx · main.tsx · styles.css
├─ components/  Scene / HeroOverlay / ScrollSections / HudLabels
├─ scene/       AICore / CameraRig / Particles / Terrain / Lights
└─ lib/         config（PALETTE=ブランド配色 / 品質ティア） · panels（構造体生成）
```
