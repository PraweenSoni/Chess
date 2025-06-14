const { Chess } = require('chess.js');
const UserInfo = require("../models/UserInfo");

const rooms = {};
const games = {};

function assignPlayer(roomId, socket) {
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
  socket.join(roomId);
  socket.roomId = roomId;
  socket.emit("roomId", roomId);
  socket.emit("playerRole", role);
  socket.emit("boardState", games[roomId].fen());

  // Find opponent name if available
  const opponentId = role === "w" ? room.players.b : room.players.w;
  const opponentName = opponentId ? room.usernames[opponentId] : null;

  socket.emit("opponentName", opponentName);

  let time = 600;
  const timer = setInterval(()=>{
    time--;

    socket.emit("timer", time);
    if(time == 300){
      socket.emit("timer", time);
    }
    
    if(time <= 0){
      socket.emit("timer", time);
      clearInterval(timer);
      console.log("time Up!", timer);
    }
  }, 1000);

  playerLimit++;
  if(playerLimit >= 2){
    playerLimit = 0;
    roomNo++;
  }
}

function getAvailableRandomRoom() {
  let index = 1;
  while (true) {
    const roomId = `default${index}`;
    const room = rooms[roomId];

    // If room doesn't exist or has less than 2 players
    if (!room || (room.players && (!room.players.w || !room.players.b))) {
      return roomId;
    }

    index++;
  }
}

function gameSocket(io) {
  io.on("connection", (socket) => {
    // Execute when user doesn't enter Room Id.
    socket.on("joinRandomMatch", ({username}) => {
    const roomId = getAvailableRandomRoom();
      if (!rooms[roomId]) {
        rooms[roomId] = { players: { w: null, b: null }, spectators: [], userIds:{}, usernames: {} };
        games[roomId] = new Chess();
        console.log(`Created new Random match room: ${roomId}`);
      }

      rooms[roomId].usernames[socket.id] = username;
      assignPlayer(roomId, socket);

      // block to emit opponent's name after joining
      const room = rooms[roomId];
      const opponentId = Object.entries(room.players).find(([, id]) => id !== socket.id)?.[1];
      const opponentName = room.usernames[opponentId];

      socket.emit("opponentName", opponentName || "Waiting...");
      if (opponentId && io.sockets.sockets.get(opponentId)) {
        const currentUsername = room.usernames[socket.id];
        io.to(opponentId).emit("opponentName", currentUsername);
      }
      socket.on("SRUCM", (msg)=>{
        const roomId = socket.roomId;
        socket.broadcast.to(roomId).emit("SSUCM", msg);
      });
    });

    // Execute when user enter Room Id.
    socket.on("joinRoom", ({roomId, username}) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { players: { w: null, b: null }, spectators: [], userIds: {}, usernames: {} };
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
      // Chat Function start.
      // SRUCM (Server Received User Chat Messages), SSUCM (Server Send User Chat Message, to frontend)
      socket.on("SRUCM", (msg)=>{
        const roomId = socket.roomId;
        // socket.emit("SSUCM", msg);
        // io.to(roomId).emit("SSUCM", msg);
        // console.log(msg);
        socket.broadcast.to(roomId).emit("SSUCM", msg);
      });
      // Chat function end.
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

        if (game.isGameOver()){
          const winnerColor = game.turn() === 'w' ? 'b' : 'w';
          const loserColor = game.turn();

          const winnerId = rooms[roomId].players[winnerColor];
          const winnerName = rooms[roomId].usernames[winnerId] || 'Not fetch opponent name';
          const loserId = rooms[roomId].players[loserColor];

          const savePlayerStats = async () => {
          try {
            // Winner update
            await UserInfo.findOneAndUpdate(
              { userId: winnerId },
              {
                $inc: {
                  rating: 10,
                  gamesPlayed: 1,
                  gamesWins: 1
                }
              }
            );

            // Loser update
            await UserInfo.findOneAndUpdate(
              { userId: loserId },
                  {
                    $inc: {
                      rating: -10,
                      gamesPlayed: 1
                    }
                  }
                );
              } catch (err) {
                console.error("Failed to update UserInfo:", err);
              }
            };

          savePlayerStats();
        }

        if (game.isGameOver()) {
          let GameResult = { type: "unknown" };
          const winnerColor = game.turn() === 'w' ? 'b' : 'w'; // player made the last move

          const winnerId = rooms[roomId].players[winnerColor];
          const winnerName = rooms[roomId].usernames[winnerId] || 'Not fetch opponent name';

          if (game.isCheckmate()) {
            GameResult =  {
              type: "checkmate",
              winnerColor: winnerColor,
              winnerName : winnerName,
            };
          } else if (game.isDraw()) {
            GameResult =  {
              type: "Draw",
            };
          } else {
            GameResult =  {
              type: "Unknown",
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

module.exports = {gameSocket, rooms};