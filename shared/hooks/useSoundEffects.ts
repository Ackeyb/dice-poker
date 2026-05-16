"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

export type SoundKey =
  | "cutin"
  | "diceRoll"
  | "doubleUpBgm"
  | "doubleUpSuccess"
  | "doubleUpFailure"
  | "mainResult";

const SOUND_SOURCES:
  Record<SoundKey, string> = {
  cutin: "/sound/cutin.mp3",
  diceRoll: "/sound/dice_roll.mp3",
  doubleUpBgm: "/sound/doubleup_bgm.mp3",
  doubleUpSuccess: "/sound/doubleup_success.mp3",
  doubleUpFailure: "/sound/doubleup_failure.mp3",
  mainResult: "/sound/main_result.mp3",
};

type PlayOptions = {
  loop?: boolean;
  restart?: boolean;
  volume?: number;
};

export const useSoundEffects = () => {
  const audioRefs =
    useRef<
      Partial<Record<SoundKey, HTMLAudioElement>>
    >({});

  const getAudio = useCallback((
    key: SoundKey
  ) => {
    if (typeof window === "undefined") {
      return null;
    }

    const current =
      audioRefs.current[key];

    if (current) {
      return current;
    }

    const audio =
      new Audio(SOUND_SOURCES[key]);

    audio.preload = "auto";
    audioRefs.current[key] = audio;
    audio.load();

    return audio;
  }, []);

  useEffect(() => {
    const audioMap =
      audioRefs.current;

    (
      Object.keys(SOUND_SOURCES) as SoundKey[]
    ).forEach(key => {
      getAudio(key);
    });

    return () => {
      Object.values(audioMap)
        .forEach(audio => {
          if (!audio) {
            return;
          }

          audio.pause();
          audio.currentTime = 0;
        });
    };
  }, [getAudio]);

  const play = useCallback((
    key: SoundKey,
    options: PlayOptions = {}
  ) => {
    const audio =
      getAudio(key);

    if (!audio) {
      return;
    }

    audio.loop =
      options.loop ?? false;

    if (typeof options.volume === "number") {
      audio.volume = options.volume;
    }

    if (options.restart !== false) {
      audio.currentTime = 0;
    }

    void audio.play().catch(() => {
      // Browser autoplay policy can block sounds until user interaction.
    });
  }, [getAudio]);

  const stop = useCallback((
    key: SoundKey
  ) => {
    const audio =
      audioRefs.current[key];

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, []);

  return {
    play,
    stop,
  };
};
