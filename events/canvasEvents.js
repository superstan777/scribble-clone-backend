// const { game } = require("../models/gameState");

const handleCanvasEvents = (socket) => {
  // ADD SAVING DRAWINGS

  socket.on("drawing", (data) => {
    // game.drawingState.push(data);
    socket.broadcast.emit("drawing", data);
  });

  socket.on("clear canvas", () => {
    // game.drawingState.length = 0;
    socket.broadcast.emit("clear canvas");
  });
};

module.exports = {
  handleCanvasEvents,
};
