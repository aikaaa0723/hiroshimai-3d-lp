import { useEffect, useRef, useState } from "react";
import { useScrollOffset } from "../lib/useScrollOffset";
import { SECTIONS } from "../lib/config";
import { scrollState } from "../lib/scrollState";

/**
 * 画面転換（シーン遷移）。参考サイトの「色収差＋ディスプレイス＋フロスト」を再現する。
 * セクションのアクティブが変わった瞬間に:
 *  - scrollState.pulse=1 へ → 3D 側の色収差がスパイク（Scene の AberrationDriver が読む）
 *  - フロスト用オーバーレイ(.scene-flash)を key 変更で再マウントし CSS アニメを1回再生
 * reducedMotion 時は何もしない。
 */
interface Props {
  reducedMotion: boolean;
}

export default function SceneTransition({ reducedMotion }: Props) {
  const offset = useScrollOffset();
  const active = Math.round(offset * (SECTIONS - 1));
  const prev = useRef(active);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    if (active !== prev.current) {
      prev.current = active;
      scrollState.pulse = 1; // 色収差スパイク
      setFlash((f) => f + 1); // フロストフラッシュ再生
    }
  }, [active, reducedMotion]);

  if (reducedMotion || flash === 0) return null;
  // key を変えるたびに DOM が作り直され、CSS アニメ(sceneFlash)が頭から再生される。
  return <div className="scene-flash" key={flash} aria-hidden />;
}
