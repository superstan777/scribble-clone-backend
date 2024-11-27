const players = [];
const messages = [];
const providedWords = [];
const rounds = [];

const currentWord = {
  word: "",
  chars: [],
};

const game = {
  gameState: "pending",
  roundState: "pending",
  drawingState: [],
  roundAmount: null,
  roundsLeft: null,
  roundDuration: 60,
  timer: null,
  currentDrawer: null,
  admin: null,
};
const words = [
  // Easy Words
  "apple",
  "banana",
  "chair",
  "happy",
  "table",
  "smile",
  "dance",
  "water",
  "light",
  "story",

  // Medium Words
  "puzzle",
  "travel",
  "window",
  "magic",
  "clever",
  "nature",
  "forest",
  "whisper",
  "sunset",
  "thunder",

  // Additional Words
  "garden",
  "river",
  "bridge",
  "flower",
  "house",
  "mountain",
  "school",
  "friend",
  "picture",
  "family",
  "animal",
  "ocean",
  "book",
  "village",
  "dream",
  "mirror",
  "shadow",
  "butterfly",
  "castle",
  "journey",
];

module.exports = {
  players,
  messages,
  words,
  game,
  rounds,
  currentWord,
  providedWords,
};
