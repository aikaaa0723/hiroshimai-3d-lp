/**
 * スクロール速度の共有状態。
 * CameraRig（ScrollControls 内）が毎フレーム書き込み、
 * ポストエフェクト側（EffectComposer 内・ScrollControls 外）が読み取る。
 * useScroll は ScrollControls の外では使えないため、モジュール変数で橋渡しする。
 */
/**
 * pulse: セクション切替時に 1 へ叩いて色収差スパイク等に使う（毎フレーム減衰）。
 * warp : ポータル通過区間(終盤)で 0→1→0 に膨らむワープ強度（CameraRig が書込）。
 */
export const scrollState = { velocity: 0, offset: 0, pulse: 0, warp: 0 };
