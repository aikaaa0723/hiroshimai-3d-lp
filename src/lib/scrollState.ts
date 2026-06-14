/**
 * スクロール速度の共有状態。
 * CameraRig（ScrollControls 内）が毎フレーム書き込み、
 * ポストエフェクト側（EffectComposer 内・ScrollControls 外）が読み取る。
 * useScroll は ScrollControls の外では使えないため、モジュール変数で橋渡しする。
 */
/** pulse: セクション切替時に 1 へ叩いて、色収差スパイク等の遷移演出に使う（毎フレーム減衰）。 */
export const scrollState = { velocity: 0, offset: 0, pulse: 0 };
