const { Chess } = require('chess.js');
const User = require("../models/User");

const rooms = {};
const games = {};

// function assignPlayer(roomId, socket) {
//   const room = rooms[roomId];

//   if (!room.players.w) {
//     room.players.w = socket.id;
//     socket.emit("playerRole", "w");
//   } else if (!room.players.b) {
//     room.players.b = socket.id;
//     socket.emit("playerRole", "b");
//   } else {
//     room.spectators.push(socket.id);
//     socket.emit("spectatorRole");
//   }

//   socket.join(roomId);
//   socket.roomId = roomId;
//   socket.emit("boardState", games[roomId].fen());

//   // Find opponent name if available
//   const opponentId = role === "w" ? room.players.b : room.players.w;
//   const opponentName = opponentId ? room.usernames[opponentId] : null;

//   socket.emit("opponentName", opponentName);
// }

function assignPlayer(roomId, socket) {
  const room = rooms[roomId];

  let role;
  if (!room.players.w) {
    room.players.w = socket.id;
    role = "w";
  } else if (!room.players.b) {
    room.players.b = socket.id;
    role = "b";
  } else {
    room.spectators.push(socket.id);
    socket.emit("spectatorRole");
    socket.join(roomId);
    return;
  }

  socket.join(roomId);
  socket.roomId = roomId;
  socket.emit("playerRole", role);
  socket.emit("boardState", games[roomId].fen());

  // Find opponent name if available
  const opponentId = role === "w" ? room.players.b : room.players.w;
  const opponentName = opponentId ? room.usernames[opponentId] : null;

  socket.emit("opponentName", opponentName);
}


function gameSocket(io) {
  io.on("connection", (socket) => {
    socket.on("joinRoom", ({roomId, username}) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { players: { w: null, b: null }, spectators: [], usernames: {} };
        games[roomId] = new Chess();
        console.log(`Created new room: ${roomId}`);
      }
       // Store username by socket.id
      rooms[roomId].usernames[socket.id] = username;
      assignPlayer(roomId, socket);

      // block to emit opponent's name after joining
      const room = rooms[roomId];
      const opponentId = Object.entries(room.players).find(([, id]) => id !== socket.id)?.[1];
      const opponentName = room.usernames[opponentId];

      socket.emit("opponentName", opponentName || "Waiting...");
    });

    socket.on("move", async (move) => {
      const roomId = socket.roomId;
      const game = games[roomId];
      if (!game) return;

      const playerColor = Object.entries(rooms[roomId]?.players || {}).find(
        ([, id]) => id === socket.id
      )?.[0];

      if (game.turn() !== playerColor) return;

      try {
        const result = game.move(move);
        if (!result) {
          socket.emit("invalidMove", move);
          return;
        }
        const user = await User.findById(req.session.userId);

        io.to(roomId).emit("oponent", user);
        io.to(roomId).emit("roomId", roomId);
        io.to(roomId).emit("move", result);
        io.to(roomId).emit("boardState", game.fen());
        io.to(roomId).emit("ischeck", game.inCheck());
        io.to(roomId).emit("ischeckmate", game.isCheckmate());
        io.to(roomId).emit("isgameover", game.isGameOver());
      } catch (err) {
        socket.emit("invalidMove", move);
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return;

      const room = rooms[roomId];
      if (room.players.w === socket.id) {
        room.players.w = null;
        io.to(roomId).emit("WPO");
      } else if (room.players.b === socket.id) {
        room.players.b = null;
        io.to(roomId).emit("BPO");
      } else {
        room.spectators = room.spectators.filter((id) => id !== socket.id);
      }

      const isEmpty =
        !room.players.w && !room.players.b && room.spectators.length === 0;
      if (isEmpty) {
        delete rooms[roomId];
        delete games[roomId];
      }
    });
  });
}

module.exports = gameSocket;