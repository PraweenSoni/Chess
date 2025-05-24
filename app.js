const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// app.js (Express route)
// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/views/home.ejs");
// });
app.get("/", (req, res) => {
  res.render("home");
});


app.get('/create', (req, res) => {
  res.render("index", {title : "Chess game"}); // or res.sendFile(...) depending on your setup
});

app.get('/profile', (req, res) => {
  res.render('profile'); // assuming EJS
});


app.get('/leaderboard', (req, res) => {
  res.render('leaderboard'); // assuming EJS template
});

// Store active rooms and games
const rooms = {}; // roomId -> { players: { w: socketId, b: socketId }, spectators: [socketId] }
const games = {}; // roomId -> Chess instance

// Helper: assign player role
function assignPlayer(roomId, socket) {
  const room = rooms[roomId];

  if (!room.players.w) {
    room.players.w = socket.id;
    socket.emit("playerRole", "w");
    console.log(`[${roomId}] Assigned white to ${socket.id}`);
  } else if (!room.players.b) {
    room.players.b = socket.id;
    socket.emit("playerRole", "b");
    console.log(`[${roomId}] Assigned black to ${socket.id}`);
  } else {
    room.spectators.push(socket.id);
    socket.emit("spectatorRole");
    console.log(`[${roomId}] Assigned spectator to ${socket.id}`);
  }

  socket.join(roomId);
  socket.roomId = roomId;

  // Send initial board state
  socket.emit("boardState", games[roomId].fen());
}

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  // When user joins a room
  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: { w: null, b: null }, spectators: [] };
      games[roomId] = new Chess();
      console.log(`Created new room: ${roomId}`);
    }

    assignPlayer(roomId, socket);
  });

  // Handle moves
  socket.on("move", (move) => {
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

      io.to(roomId).emit("roomId", roomId);
      io.to(roomId).emit("move", result);
      io.to(roomId).emit("boardState", game.fen());
      io.to(roomId).emit("ischeck", game.inCheck());
      io.to(roomId).emit("ischeckmate", game.isCheckmate());
      io.to(roomId).emit("isgameover", game.isGameOver());
    } catch (err) {
      console.error("Invalid move error:", err.message);
      socket.emit("invalidMove", move);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];
    if (room.players.w === socket.id) {
      room.players.w = null;
      io.to(roomId).emit("WPO");
      console.log(`[${roomId}] White player disconnected`);
    } else if (room.players.b === socket.id) {
      room.players.b = null;
      io.to(roomId).emit("BPO");
      console.log(`[${roomId}] Black player disconnected`);
    } else {
      room.spectators = room.spectators.filter((id) => id !== socket.id);
    }

    // If room is empty, clean up
    const isEmpty =
      !room.players.w && !room.players.b && room.spectators.length === 0;
    if (isEmpty) {
      delete rooms[roomId];
      delete games[roomId];
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
