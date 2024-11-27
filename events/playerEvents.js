const { players, messages, game } = require("../models/gameState");

const handlePlayerEvents = (io, socket) => {
  socket.on("set player name", (playerName) => {
    const isNameTaken = players.some((player) => player.name === playerName);

    if (isNameTaken) {
      socket.emit("is name valid", {
        success: false,
        message: "Name is already taken. Please choose another.",
      });
      return;
    }

    const newPlayer = {
      id: socket.id,
      name: "",
      score: 0,
      lastRoundPoints: 0,
      guessed: false,
    };

    newPlayer.name = playerName;

    if (game.admin === null) {
      game.admin = newPlayer.id;
    }

    console.log(game.admin);

    players.push(newPlayer);

    messages.push({
      playerName: "",
      text: `${newPlayer.name} joined the game`,
      type: "connect",
    });

    socket.emit("is name valid", {
      success: true,
      message: "Name is valid and player created.",
    });

    io.emit("update players", players);
    io.emit("update messages", messages);
    io.emit("update game state", game);
  });
};

module.exports = { handlePlayerEvents };
