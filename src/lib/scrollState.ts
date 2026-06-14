/**
 * スクロール速度の共有状態。
 * CameraRig（ScrollControls 内）が毎フレーム書き込み、
 * ポストエフェクト側（EffectComposer 内・ScrollControls 外）が読み取る。
 * useScroll は ScrollControls の外では使えないため、モジュール変数で橋渡しする。
 */
export const scrollState = { velocity: 0 };
