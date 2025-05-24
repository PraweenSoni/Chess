const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const infosec = document.querySelector(".infosec");
const roomInfo = document.getElementById("roomInfo");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const piece = document.createElement("div");
        piece.classList.add("piece", square.color === "w" ? "white" : "black");
        piece.innerText = getPieceUnicode(square);
        piece.draggable = (playerRole === square.color);
        piece.addEventListener("dragstart", (e) => {
          if (piece.draggable) {
            draggedPiece = piece;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });
        piece.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(piece);
      }

      squareElement.addEventListener("dragover", (e) => e.preventDefault());
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const target = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, target);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const getPieceUnicode = (piece) => {
  const map = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };
  return map[piece.color === "w" ? piece.type.toUpperCase() : piece.type] || "";
};

// const handleMove = (source, target) => {
//   const move = {
//     from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
//     to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
//     promotion: "q",
//   };
//   socket.emit("move", move);
// };

const handleMove = (source, target) => {
  const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
  const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;

  const movingPiece = chess.get(from);
  const isPromotionMove =
    movingPiece?.type === 'p' &&
    ((movingPiece.color === 'w' && to[1] === '8') ||
     (movingPiece.color === 'b' && to[1] === '1'));

  const move = {
    from,
    to,
    ...(isPromotionMove && { promotion: 'q' }),
  };

  socket.emit("move", move);
};


// === Socket Events ===
const roomId = prompt("Enter room ID to join:");
socket.emit("joinRoom", roomId || "default");


socket.on("playerRole", (role) => {
  playerRole = role;
  if (role === "spectatorRole") {
    infosec.innerText = "You are a Spectator";
  } else {
    infosec.innerText = `You are playing as ${role === "w" ? "White" : "Black"}`;
  }
  renderBoard();
});

socket.on("roomId", (roomId) => {
  roomInfo.innerText = `Room ID: ${roomId}`;
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("ischeck", (val) => {
  if (val) infosec.innerText = "Check!";
});

socket.on("ischeckmate", (val) => {
  if (val) infosec.innerText = "Checkmate!";
});

socket.on("isgameover", (val) => {
  if (val) infosec.innerText = "Game Over!";
});

socket.on("WPO", () => {
  infosec.innerText = "White Player Disconnected";
});

socket.on("BPO", () => {
  infosec.innerText = "Black Player Disconnected";
});

socket.on("invalidMove", (move) => {
  infosec.innerText = `Invalid move: ${move.from} → ${move.to}`;
});

renderBoard();
