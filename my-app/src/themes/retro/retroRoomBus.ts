// Retro theme: what the page tells the 3D listening room (src/themes/retro/RetroRoom.tsx). Plain values the room
// reads every frame, so writing them never re-renders anything.
export const roomBus = {
  /** Journey ("Side B") progress 0–1 while that section is on screen, -1 otherwise: drives the tonearm. */
  sideB: -1,
  /** The project picked in Work, shown on the record's label while Work is on screen. */
  track: null as null | { title: string; side: string },
  /** Hero mode: where the record is on screen (px in the hero), so the opening's label can land on it. */
  recordScreen: null as null | { x: number; y: number; d: number },
  heroP: 0,
};

/** Hero mode: how far the opening's move has played (0 = the disc screen, 1 = the hero), for the camera. */
export function setHeroProgress(p: number) {
  roomBus.heroP = p;
}

export function setRecordScreen(at: typeof roomBus.recordScreen) {
  roomBus.recordScreen = at;
}

export function setSideB(progress: number) {
  roomBus.sideB = progress;
}

export function setRoomTrack(track: typeof roomBus.track) {
  roomBus.track = track;
}
