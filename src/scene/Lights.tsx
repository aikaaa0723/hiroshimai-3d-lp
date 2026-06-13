import { PALETTE } from "../lib/config";

/**
 * 照明。冷たい氷原を表現するため、青白い環境光 + 上方からのキーライト +
 * コア由来の内側からの光（AICore 側の pointLight）で構成する。
 * 影は使わない（広い拡散光のシーンでは不要で、モバイル負荷も避けられる）。
 */
export default function Lights() {
  return (
    <>
      {/* 全体の底上げ。白地に合わせてニュートラルに。 */}
      <ambientLight intensity={0.6} color={PALETTE.bgMid} />
      {/* 上前方からの主光源（白）。エッジに緩いハイライトを乗せる。 */}
      <directionalLight position={[3, 6, 5]} intensity={1.0} color={PALETTE.glow} />
      {/* 左右からブランド2色の弱い補助光（青/ピンク・離散）で陰影に色味を添える。 */}
      <directionalLight position={[-5, 1, 2]} intensity={0.4} color={PALETTE.blue} />
      <directionalLight position={[5, -1, 2]} intensity={0.4} color={PALETTE.pink} />
      {/* 上方の半球光で白地の照り返しを擬似的に。 */}
      <hemisphereLight args={[PALETTE.bgTop, PALETTE.panel, 0.5]} />
    </>
  );
}
