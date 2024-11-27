const {
  players,
  words,
  game,
  rounds,
  currentWord,
  providedWords,
} = require("../models/gameState");

let timerInterval;

if (game.timer === 30) {
  sendHint();
}

//GAME

const startGame = (io, roundsPerPlayer) => {
  game.gameState = "inProgress";
  io.emit("update game state", game);

  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  for (let i = 0; i < roundsPerPlayer; i++) {
    shuffledPlayers.forEach((player) => {
      rounds.push(player.id);
    });
  }

  game.roundAmount = rounds.length;
  prepareRound(io);
};

const endGame = (io) => {
  game.gameState = "ended";
  io.emit("update game state", game);

  if (game.roundTimer) clearTimeout(game.roundTimer);
};

//ROUND

const prepareRound = (io) => {
  if (rounds.length === 0) {
    endGame(io);
    return;
  }

  game.roundsLeft = rounds.length;

  players.forEach((player) => (player.guessed = false));
  players.forEach((player) => (player.lastRoundPoints = 0));

  currentWord.word = null;
  currentWord.chars = [];

  game.roundState = "pending";
  game.currentDrawer = rounds[0];

  const wordsCopy = [...words];

  for (let i = 0; i < 3 && wordsCopy.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * wordsCopy.length);
    providedWords.push(wordsCopy.splice(randomIndex, 1)[0]);
  }

  io.emit("update game state", game);
  io.emit("update players", players);
  io.emit("update word", currentWord);
  //WORKAROUND FOR NOW
  //TO BE REPLACED WITH SOLID SOLUTION
  //STILL DOES NOT WORK WITHOUT TIMEOUT

  setTimeout(() => {
    io.to(game.currentDrawer).emit("provided words", providedWords);
  }, 100);

  startTimer(10, io, () => {
    if (currentWord.word === null) {
      currentWord.word = providedWords[0];

      currentWord.chars = Array(providedWords[0].length).fill("_");
    }

    providedWords.length = 0;

    startRound(io);
  });
};

const startRound = (io) => {
  stopTimer();
  game.roundState = "inProgress";
  io.emit("update game state", game);

  players.forEach((player) => {
    if (player.id === game.currentDrawer) {
      io.to(player.id).emit("update word", currentWord);
    } else {
      if (!player.guessed) {
        io.to(player.id).emit("update word", {
          word: null,
          chars: currentWord.chars,
        });
      } else {
        io.to(player.id).emit("update word", currentWord);
      }
    }
  });

  startTimer(game.roundDuration, io, () => {
    endRound(io);
  });
};

const endRound = (io) => {
  stopTimer();

  game.roundState = "ended";
  calculateDrawerPoints(io);

  players.forEach((player) => (player.score += player.lastRoundPoints));

  const index = words.indexOf(currentWord.word);
  words.splice(index, 1);
  rounds.shift();

  io.emit("update game state", game);
  io.emit("update players", players);
  io.emit("update word", currentWord);

  startTimer(10, io, () => {
    prepareRound(io);
  });
};

//TIMER

const startTimer = (duration, io, onComplete) => {
  game.timer = duration;

  io.emit("timer update", game.timer);

  timerInterval = setInterval(() => {
    game.timer -= 1;
    io.emit("timer update", game.timer);

    if (game.roundState === "inProgress") {
      if (
        game.timer === game.roundDuration / 2 ||
        game.timer === game.roundDuration / 4
      ) {
        sendHint(io);
      }
    }

    if (game.timer <= 0) {
      clearInterval(timerInterval);

      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
};

//UTIL

const checkAllGuessed = (io) => {
  const guessers = players.filter((player) => player.id !== game.currentDrawer);

  if (guessers.every((player) => player.guessed)) {
    endRound(io);
  }
};

const calculatePoints = () => {
  const points = Math.round(1000 * (game.timer / game.roundDuration));

  return points;
};

const calculateDrawerPoints = (io) => {
  const guessers = players.filter((player) => player.id !== game.currentDrawer);

  const totalPoints = guessers.reduce(
    (sum, player) => sum + (player.lastRoundPoints || 0),
    0
  );

  const drawerPoints = Math.floor(totalPoints / 2);
  const drawer = players.find((player) => player.id === game.currentDrawer);
  drawer.lastRoundPoints = drawerPoints;
  io.emit("update players", players);
};

const sendHint = (io) => {
  const unrevealedIndexes = [];

  for (let i = 0; i < currentWord.word.length; i++) {
    if (currentWord.chars[i] === "_") {
      unrevealedIndexes.push(i);
    }
  }

  const randomCharIndex =
    unrevealedIndexes[Math.floor(Math.random() * unrevealedIndexes.length)];
  currentWord.chars[randomCharIndex] = currentWord.word.charAt(randomCharIndex);

  players.forEach((player) => {
    if (player.id !== game.currentDrawer && !player.guessed) {
      io.to(player.id).emit("update word", {
        word: null,
        chars: currentWord.chars,
      });
    }
  });
};

module.exports = {
  checkAllGuessed,
  startGame,
  startRound,
  calculatePoints,
};
