import { useCallback, useRef } from "react";
import { getYoutubeVideo, wasPlaying } from "../utils/video";

type GetVideoFn = () => HTMLVideoElement | null;

export function useHoverPauseVideo(getVideo: GetVideoFn = getYoutubeVideo) {
  const pausedByUsRef = useRef(false);
  const wasPlayingRef = useRef(false);

  const onPointerEnter = useCallback(() => {
    const v = getVideo();
    if (!v) return;
    wasPlayingRef.current = wasPlaying(v);

    if (wasPlayingRef.current) {
      v.pause();
      pausedByUsRef.current = true;
    } else {
      pausedByUsRef.current = false;
    }
  }, [getVideo]);

  const onPointerLeave = useCallback(() => {
    const v = getVideo();
    if (!v) return;

    if (pausedByUsRef.current && wasPlayingRef.current && !v.ended) {
      const p = v.play();
      (p as Promise<void> | undefined)?.catch?.(() => {});
    }
    pausedByUsRef.current = false;
  }, [getVideo]);

  const bind = { onPointerEnter, onPointerLeave } as const;

  return { bind, onPointerEnter, onPointerLeave };
}
