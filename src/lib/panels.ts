import * as THREE from "three";

/**
 * AI コア構造体を構成する 1 枚 1 枚の「パネル（セル）」のデータ。
 * 中心球の表面に正二十面体ベースのファセットを敷き詰め、研究施設/データドームの
 * ような分割構造を作る。一部を floating（本体から外れて浮遊）に指定する。
 */
export interface PanelData {
  index: number;
  /** 球面上の基準位置（半径 1 に正規化済み）。実際の配置は radius を掛ける。 */
  position: THREE.Vector3;
  /** 面の外向き法線。パネルの向き・浮遊方向・発光のはみ出し方向に使う。 */
  normal: THREE.Vector3;
  /** local +Z を normal に向ける回転。 */
  quaternion: THREE.Quaternion;
  /** パネルの寸法（w, h, 厚み）。 */
  size: [number, number, number];
  /** 浮遊ブロックか。true のものだけ HUD ラインとラベルを接続する。 */
  floating: boolean;
  /** 個体差用の乱数シード（上下動の位相など）。 */
  seed: number;
}

/** [0,1) の擬似乱数（seed 固定で再現性を持たせる軽量版）。 */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 正二十面体ジオメトリの各三角形面から 1 パネルを生成する。
 * detail を上げると面数（=パネル数）が増える。
 */
export function buildPanels(detail: number): PanelData[] {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const panels: PanelData[] = [];

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);

  const faceCount = pos.count / 3;
  for (let f = 0; f < faceCount; f++) {
    a.fromBufferAttribute(pos, f * 3 + 0);
    b.fromBufferAttribute(pos, f * 3 + 1);
    c.fromBufferAttribute(pos, f * 3 + 2);

    centroid
      .copy(a)
      .add(b)
      .add(c)
      .multiplyScalar(1 / 3);

    // 球面なので法線 ≒ 重心方向。
    const normal = centroid.clone().normalize();

    // local +Z を法線に合わせる回転。
    const quaternion = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);

    // 面の大きさからパネルの一辺を推定（detail が上がるほど小さく）。
    const edge = a.distanceTo(b);
    const seed = f + 1;
    const r = rand(seed);

    // 約 28% を浮遊ブロックに。極端に多いと散らかるので抑える。
    const floating = rand(seed * 3.1) > 0.72;

    const thickness = 0.05 + r * 0.06;
    const w = edge * (0.62 + r * 0.18);
    const h = edge * (0.5 + rand(seed * 1.7) * 0.18);

    panels.push({
      index: f,
      position: normal.clone(), // 半径 1 基準。配置時に radius を掛ける。
      normal,
      quaternion,
      size: [w, h, thickness],
      floating,
      seed,
    });
  }

  geo.dispose();
  return panels;
}
