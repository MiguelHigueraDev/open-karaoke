import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseAudioOptions {
  url: string | null;
  container: React.RefObject<HTMLDivElement | null>;
  waveColor?: string;
  progressColor?: string;
}

export function useAudio({
  url,
  container,
  waveColor = '#4a5568',
  progressColor = '#8b5cf6',
}: UseAudioOptions) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  /** Current playback time in milliseconds. */
  const [currentTime, setCurrentTime] = useState(0);
  /** Total duration in milliseconds. */
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!url || !container.current) return;

    const ws = WaveSurfer.create({
      container: container.current,
      url,
      waveColor,
      progressColor,
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 2,
      cursorColor: '#8b5cf6',
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration() * 1000);
      setIsReady(true);
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time * 1000);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [url, container, waveColor, progressColor]);

  const play = useCallback(() => wsRef.current?.play(), []);
  const pause = useCallback(() => wsRef.current?.pause(), []);
  const togglePlay = useCallback(() => wsRef.current?.playPause(), []);

  /** Seek to a position in milliseconds. */
  const seekTo = useCallback((ms: number) => {
    const ws = wsRef.current;
    if (!ws) return;
    const dur = ws.getDuration(); // seconds
    if (dur > 0) ws.seekTo((ms / 1000) / dur);
  }, []);

  /** Returns current playback time in milliseconds. */
  const getCurrentTime = useCallback(
    () => (wsRef.current?.getCurrentTime() ?? 0) * 1000,
    [],
  );

  const setPlaybackRate = useCallback((rate: number) => {
    wsRef.current?.setPlaybackRate(rate);
  }, []);

  return {
    isPlaying,
    isReady,
    currentTime,
    duration,
    play,
    pause,
    togglePlay,
    seekTo,
    getCurrentTime,
    setPlaybackRate,
    wsRef,
  };
}
