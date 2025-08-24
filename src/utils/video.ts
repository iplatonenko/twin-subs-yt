import {
  MOVIE_PLAYER,
  VIDEO,
  VIDEO_PLAYER,
} from "../constants/youtubeSelectors";

export const getYoutubeVideo = (): HTMLVideoElement | null => {
  return (document.querySelector(VIDEO_PLAYER) ||
    document.querySelector(MOVIE_PLAYER) ||
    document.querySelector(VIDEO)) as HTMLVideoElement | null;
};

export const wasPlaying = (v: HTMLVideoElement) =>
  !v.paused && !v.ended && v.currentTime > 0;
