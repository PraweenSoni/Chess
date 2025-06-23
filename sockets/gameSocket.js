const { Chess } = require('chess.js');
const UserInfo = require("../models/UserInfo");

const rooms = {};
const games = {};

function assignPlayer(roomId, socket, userId) {
  let roomNo = 1;
  let playerLimit = 0;

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
    socket.emit("spectatorRole", "Currently you are as a spectator Role!!!");
    socket.join(roomId);
    return;
  }

  // Only assign if userId is valid
  if (userId && typeof userId === "string" && userId.length === 24) {
    room.userMongoIds[socket.id] = userId;
  } else {
    console.warn(`⚠️ Invalid or missing userId for socket ${socket.id}:`, userId);
    room.userMongoIds[socket.id] = null; // fallback if needed
  }

  socket.join(roomId);
  socket.roomId = roomId;
  socket.emit("roomId", roomId);
  socket.emit("playerRole", role);
  socket.emit("boardState", games[roomId].fen());

  // Find opponent name if available
  const opponentId = role === "w" ? room.players.b : room.players.w;
  const opponentName = opponentId ? room.usernames[opponentId] : null;
  socket.emit("opponentName", opponentName);

  // Countdown timer logic
  let time = 600;
  const timer = setInterval(() => {
    time--;
    socket.emit("timer", time);
    if (time === 300) {
      socket.emit("timer", time);
    }
    if (time <= 0) {
      socket.emit("timer", time);
      clearInterval(timer);
      console.log("time Up!", timer);
    }
  }, 1000);

  playerLimit++;
  if (playerLimit >= 2) {
    playerLimit = 0;
    roomNo++;
  }
}

function getAvailableRandomRoom() {
  let index = 1;
  while (true) {
    const roomId = `default${index}`;
    const room = rooms[roomId];
    if (!room || (room.players && (!room.players.w || !room.players.b))) {
      return roomId;
    }
    index++;
  }
}

function gameSocket(io) {
  io.on("connection", (socket) => {
    // When a user joins a random match
    socket.on("joinRandomMatch", ({ username, userId }) => {
      const roomId = getAvailableRandomRoom();
      if (!rooms[roomId]) {
        rooms[roomId] = { players: { w: null, b: null }, spectators: [], userIds: {}, usernames: {}, userMongoIds: {} };
        games[roomId] = new Chess();
        console.log(`Created new Random match room: ${roomId}`);
      }

      rooms[roomId].usernames[socket.id] = username;
      assignPlayer(roomId, socket, userId); // Pass userId to assignPlayer

      const room = rooms[roomId];
      const opponentId = Object.entries(room.players).find(([, id]) => id !== socket.id)?.[1];
      const opponentName = room.usernames[opponentId];
      socket.emit("opponentName", opponentName || "Waiting...");

      if (opponentId && io.sockets.sockets.get(opponentId)) {
        const currentUsername = room.usernames[socket.id];
        io.to(opponentId).emit("opponentName", currentUsername);
      }

      socket.on("SRUCM", (msg) => {
        const roomId = socket.roomId;
        socket.broadcast.to(roomId).emit("SSUCM", msg);
      });
    });

    // When a user joins using specific Room ID
    socket.on("joinRoom", ({ roomId, username, userId }) => {
      console.log("Received joinRoom:", username, userId);
      if (!rooms[roomId]) {
        rooms[roomId] = { players: { w: null, b: null }, spectators: [], userIds: {}, usernames: {}, userMongoIds: {} };
        games[roomId] = new Chess();
        console.log(`Created new room: ${roomId}`);
      }

      rooms[roomId].usernames[socket.id] = username;
      assignPlayer(roomId, socket, userId); // Pass userId to assignPlayer

      const room = rooms[roomId];
      const opponentId = Object.entries(room.players).find(([, id]) => id !== socket.id)?.[1];
      const opponentName = room.usernames[opponentId];

      socket.emit("opponentName", opponentName || "Waiting...");

      socket.on("SRUCM", (msg) => {
        const roomId = socket.roomId;
        socket.broadcast.to(roomId).emit("SSUCM", msg);
      });
    });

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

        io.to(roomId).emit("move", result);
        io.to(roomId).emit("boardState", game.fen());
        io.to(roomId).emit("ischeck", game.inCheck());

        if (game.isGameOver()) {
          const winnerColor = game.turn() === 'w' ? 'b' : 'w';
          const loserColor = game.turn();

          const winnerSocketId = rooms[roomId].players[winnerColor];
          const loserSocketId = rooms[roomId].players[loserColor];

          const winnerMongoId = rooms[roomId].userMongoIds[winnerSocketId];
          const loserMongoId = rooms[roomId].userMongoIds[loserSocketId];

          const savePlayerStats = async () => {
            try {
              if (winnerMongoId && loserMongoId) {
                await UserInfo.findOneAndUpdate(
                  { userId: winnerMongoId },
                  { $inc: { rating: 10, gamesPlayed: 1, gamesWins: 1 } }
                );
                await UserInfo.findOneAndUpdate(
                  { userId: loserMongoId },
                  { $inc: { rating: -10, gamesPlayed: 1 } }
                );
              } else {
                console.warn("Skipped DB update: winner or loser MongoId missing", { winnerMongoId, loserMongoId });
              }
            } catch (err) {
              console.error("Failed to update UserInfo:", err);
            }
          };

          savePlayerStats();

          let GameResult = { type: "unknown" };
          const winnerName = rooms[roomId].usernames[winnerSocketId] || 'Not fetch opponent name';

          if (game.isCheckmate()) {
            GameResult = {
              type: "checkmate",
              winnerColor,
              winnerName
            };
          } else if (game.isDraw()) {
            GameResult = {
              type: "Draw"
            };
          } else {
            GameResult = {
              type: "Unknown"
            };
          }

          io.to(roomId).emit("gameResult", GameResult);
        }

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

module.exports = { gameSocket, rooms };
