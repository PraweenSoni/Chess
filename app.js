const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Online Chess game" });
});
// Chat gpt
app.get('*', (req, res) => {
  res.render("index", {title : "Online ChessGame"});
});

io.on("connection", function (uniquesocket) {
  console.log("Player Connected");

  // uniquesocket.on("bol",function(){
  //     io.emit("Haa");
  // })

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  // Player offline code..
  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
      console.log("White Go Offline");
      io.emit("WPO");
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      console.log("Black Go Offline");
      io.emit("BPO");
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() == "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() == "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move :", move);
        uniquesocket.emit("Invalid Move ", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid Move :", move);
    }
    const ischeck = chess.isCheck();
    console.log(ischeck);
    io.emit("ischeck", ischeck);
    const ischeckmate = chess.isCheckmate();
    console.log(ischeckmate);
    io.emit("ischeckmate", ischeckmate);
    const isgameover = chess.isGameOver();
    console.log(isgameover);
    io.emit("isgameover", isgameover);
  });
});

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server Started! PORT ${PORT}`);
});
