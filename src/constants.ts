import * as THREE from 'three';

export const COLORS = {
  GOLD: 0xC9A55A,
  BLUE: 0xA3C9E2,
  WHITE: 0xFFFFFF,
  CREAM: 0xEEE8DC,
  DARK_BG: '#050507',
};

export const PALETTE = [
  new THREE.Color(COLORS.GOLD),
  new THREE.Color(COLORS.BLUE),
  new THREE.Color(COLORS.WHITE),
  new THREE.Color(COLORS.CREAM),
];

export const SPACE_CONFIG = {
  STAR_COUNT: 2500,
  STREAK_COUNT: 1500,
  GLOW_COUNT: 300,
  WARP_COUNT: 400,
  ORB_COUNT: 6,
  BASE_SPEED: 28,
  WARP_SPEED: 60,
  RESET_Z: 5,
  SPAWN_Z: -400,
};

export const EMOTION_RESPONSES: Record<string, {text: string, q: string}> = {
  Fear: { text: "Fear is present here. Sometimes fear appears when something important feels uncertain or at risk.", q: "What part of this moment feels most uncertain for you?" },
  Anger: { text: "There seems to be anger connected to this experience.", q: "What do you think the anger might be protecting?" },
  Overwhelm: { text: "It sounds like a lot is happening inside at once.", q: "If you could focus on just one part of this, what would it be?" },
  Guilt: { text: "Guilt is here. Sometimes guilt appears when something inside us still cares deeply.", q: "What part of this memory stays with you most today?" },
  Sadness: { text: "Sadness is present. It often appears when something meaningful has changed or been lost.", q: "What part of this memory still feels tender for you?" },
  Confusion: { text: "Confusion is here. It often appears when old assumptions start loosening.", q: "What part of this experience still feels unclear?" },
  Acceptance: { text: "There is a quality of acceptance present. It often means we are no longer fighting reality.", q: "What becomes possible now that you see this more clearly?" },
  Courage: { text: "Courage is here, quietly. It often appears when we choose to respond differently.", q: "What step feels possible now?" },
  Gratitude: { text: "Gratitude is present. Sometimes it appears when we can see meaning even inside difficulty.", q: "What part of this experience shaped you the most?" },
  Clarity: { text: "There is a sense of clarity here. It often arrives after sitting with uncertainty long enough.", q: "What direction feels clearer now?" },
  Compassion: { text: "Compassion is present — toward yourself or others. It allows us to hold both our mistakes and our humanity.", q: "How would you speak to yourself from this place?" },
  Peace: { text: "There is a quiet here. Peace often arrives when the struggle with the past softens.", q: "What helped you arrive at this feeling?" }
};

export const PHASE_ANCHORS: Record<string, string> = {
  dim: "You don't have to solve anything right now. Just notice what is here.",
  soft: "What you felt here deserves gentleness. You can carry that with you.",
  grow: "There is a small step waiting for you, when you are ready.",
  bright: "You can carry this clarity into your day."
};

export const RITUAL_ANCHORS = [
  { k: 'breath', n: 'Nafas', i: '💨' },
  { k: 'stillness', n: 'Keheningan', i: '🔇' },
  { k: 'sound', n: 'Suara', i: '🔔' },
  { k: 'body', n: 'Tubuh', i: '🧘' },
  { k: 'earth', n: 'Bumi', i: '🌍' },
  { k: 'heart', n: 'Jantung', i: '💓' }
];

export const EMOTIONS = [
  { n: "Fear", p: "dim" }, { n: "Anger", p: "dim" }, { n: "Overwhelm", p: "dim" }, 
  { n: "Guilt", p: "soft" }, { n: "Sadness", p: "soft" }, { n: "Confusion", p: "soft" },
  { n: "Acceptance", p: "grow" }, { n: "Courage", p: "grow" }, { n: "Gratitude", p: "grow" },
  { n: "Clarity", p: "bright" }, { n: "Compassion", p: "bright" }, { n: "Peace", p: "bright" }
];
