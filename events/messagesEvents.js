const { messages, currentWord, players } = require("../models/gameState");
const { checkAllGuessed, calculatePoints } = require("../models/gameUtils");

const handleMessagesEvents = (io, socket) => {
  socket.on("add message", (playerId, message) => {
    const player = players.find((player) => player.id === playerId);

    if (!player || !message) {
      socket.emit("error", { message: "Player name and message are required" });
      return;
    }

    let newMessage;
    if (message === currentWord.word) {
      newMessage = {
        playerName: "",
        text: `${player.name} guessed the word`,
        type: "guessed",
      };

      player.guessed = true;

      player.lastRoundPoints = calculatePoints();

      io.emit("update players", players);

      io.to(player.id).emit("update word", currentWord);

      checkAllGuessed(io);
    } else {
      newMessage = {
        playerName: player.name,
        text: message,
      };
    }

    messages.push(newMessage);
    io.emit("update messages", messages);
  });
};

module.exports = { handleMessagesEvents };
