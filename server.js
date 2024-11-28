const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { players, messages, game } = require("./models/gameState");

const { handlePlayerEvents } = require("./events/playerEvents");
const { handleMessagesEvents } = require("./events/messagesEvents");
const { handleGameEvents } = require("./events/gameEvents");
const { handleCanvasEvents } = require("./events/canvasEvents");

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Socket.IO server is running!");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  handlePlayerEvents(io, socket);
  handleGameEvents(io, socket);
  handleMessagesEvents(io, socket);
  handleCanvasEvents(socket);

  socket.on("disconnect", () => {
    const index = players.findIndex((player) => player.id === socket.id);
    if (index !== -1) {
      const disconnectedPlayer = players.splice(index, 1)[0];

      if (game.admin === disconnectedPlayer.id && players.length > 0) {
        game.admin = players[0].id;
      } else {
        game.admin = null;
      }

      messages.push({
        playerName: "",
        text: `${disconnectedPlayer.name} left the game`,
        type: "disconnect",
      });
      io.emit("update game state", game);

      io.emit("update players", players);
      io.emit("update messages", messages);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
