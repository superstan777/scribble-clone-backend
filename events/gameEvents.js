const {
  game,
  currentWord,
  providedWords,
  players,
} = require("../models/gameState");

const { startRound, startGame } = require("../models/gameUtils");

const handleGameEvents = (io, socket) => {
  socket.on("set word", (playerId, selectedWord) => {
    if (playerId !== game.currentDrawer) {
      socket.emit("error", { message: "Your are not the drawer" });
      return;
    }

    if (!providedWords.includes(selectedWord)) {
      socket.emit("error", { message: "Invalid word selected" });
      return;
    }

    currentWord.word = selectedWord;
    currentWord.chars = Array(selectedWord.length).fill("_");

    providedWords.length = 0;

    startRound(io);
  });

  socket.on("start game", (playerId, roundDuration, roundAmount) => {
    if (playerId !== game.admin) {
      socket.emit("error", { message: "Your are not the admin" });
      return;
    }

    if (players.length > 2) {
      game.roundDuration = roundDuration;

      startGame(io, roundAmount);
    }
  });

  socket.on("restart game", (playerId) => {
    if (playerId !== game.admin) {
      socket.emit("error", { message: "Your are not the admin" });
      return;
    }

    game.gameState = "pending";
    game.roundState = "pending";
    game.currentDrawer = null;
    game.roundAmount = null;
    game.roundDuration = null;
    game.timer = null;

    players.forEach((player) => {
      player.score = 0;
      player.lastRoundPoints = 0;
      player.guessed = false;
    });

    io.emit("update players", players);
    io.emit("update game state", game);
  });
};

module.exports = {
  handleGameEvents,
};
