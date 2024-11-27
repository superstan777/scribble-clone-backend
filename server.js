// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const {
//   players,
//   messages,
//   disconnectedPlayers,
// } = require("./models/gameState");

// const { handlePlayerEvents } = require("./events/playerEvents");
// const { handleMessagesEvents } = require("./events/messagesEvents");
// const { handleGameEvents } = require("./events/gameEvents");
// const { handleCanvasEvents } = require("./events/canvasEvents");

// const app = express();
// const port = process.env.PORT || 3001;
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// app.use(cors({ origin: "*" }));
// app.use(express.json());

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   handlePlayerEvents(io, socket);
//   handleGameEvents(io, socket);
//   handleMessagesEvents(io, socket);
//   handleCanvasEvents(socket);

//   socket.on("disconnect", () => {
//     const index = players.findIndex((player) => player.id === socket.id);
//     if (index !== -1) {
//       const disconnectedPlayer = players.splice(index, 1)[0];
//       disconnectedPlayers.push(disconnectedPlayer);
//       // remove disconnected player if reconnect

//       messages.push({
//         playerName: "",
//         text: `${disconnectedPlayer.name} left the game`,
//         type: "disconnect",
//       });

//       io.emit("update players", players);
//       io.emit("update messages", messages);
//     }
//     console.log("User disconnected:", socket.id);
//   });
// });

// server.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const {
  game,
  players,
  messages,
  disconnectedPlayers,
} = require("./models/gameState");

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

// Middleware to handle socket reconnections based on session (socketId)
io.use((socket, next) => {
  const { socketId } = socket.handshake.auth;

  if (socketId) {
    // Look for the player in the disconnected players list
    const disconnectedPlayerIndex = disconnectedPlayers.findIndex(
      (player) => player.id === socketId
    );

    if (disconnectedPlayerIndex !== -1) {
      // Reconnect the player
      const reconnectedPlayer = disconnectedPlayers.splice(
        disconnectedPlayerIndex,
        1
      )[0];

      // Store the new socket ID
      reconnectedPlayer.id = socket.id;

      if (game.admin === null) {
        game.admin = reconnectedPlayer.id;
      }

      if (game.currentDrawer === socketId) {
        game.currentDrawer = reconnectedPlayer.id;
        //load drawings
      }

      // Add the player back to the active players list
      players.push(reconnectedPlayer);

      console.log(
        `Reconnected player: ${reconnectedPlayer.name} with new socket ID: ${socket.id}`
      );

      // Notify the client of successful reconnection
      socket.emit("player restored", {
        success: true,
        player: reconnectedPlayer,
        message: "Player reconnected successfully.",
      });

      // Update game messages to reflect the reconnection
      messages.push({
        playerName: "",
        text: `${reconnectedPlayer.name} reconnected`,
        type: "connect",
      });

      // Emit the updated game state and player list
      // io.to(reconnectedPlayer.id).emit("update game state", game);

      socket.emit("update game state", game);

      setTimeout(() => {
        io.emit("update messages", messages);
        io.emit("update players", players);
      }, 100);
    }
  }

  next(); // Proceed with the connection
});

// Main connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // io.emit("update messages", messages);
  // io.emit("update players", players);

  // Handle player, game, messages, and canvas events
  handlePlayerEvents(io, socket);
  handleGameEvents(io, socket);
  handleMessagesEvents(io, socket);
  handleCanvasEvents(socket);

  // Handle disconnect event
  socket.on("disconnect", () => {
    const index = players.findIndex((player) => player.id === socket.id);
    if (index !== -1) {
      const disconnectedPlayer = players.splice(index, 1)[0];
      disconnectedPlayers.push(disconnectedPlayer);

      // If the disconnected player was the admin, handle admin reassignment
      if (disconnectedPlayer.id === game.admin) {
        // Find new admin (simple strategy: first player)
        const newAdmin = players[0];
        if (newAdmin) {
          game.admin = newAdmin.id;
          console.log(`New admin: ${newAdmin.name}`);
        } else {
          game.admin = null; // No players left
        }
      }

      messages.push({
        playerName: "",
        text: `${disconnectedPlayer.name} left the game`,
        type: "disconnect",
      });

      io.emit("update players", players);
      io.emit("update messages", messages);
      io.emit("update game state", game);
    }
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
