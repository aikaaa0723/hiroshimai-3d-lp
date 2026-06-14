import { useEffect, useState } from "react";
import { scrollState } from "./scrollState";

/**
 * scrollState.offset（CameraRig が毎フレーム更新）を React state へ取り込む。
 * DOM オーバーレイ（ブラケットナビのアクティブ表示・ヒーロー要素のスクロールフェード）で使う。
 * 変化が小さいときは setState しない（再レンダー抑制）。
 */
export function useScrollOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let id = 0;
    let last = -1;
    const loop = () => {
      const o = scrollState.offset;
      if (Math.abs(o - last) > 0.002) {
        last = o;
        setOffset(o);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return offset;
}
