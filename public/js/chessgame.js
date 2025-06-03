const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const infosec = document.querySelector(".infosec");
const roomInfo = document.getElementById("roomInfo");
const msgSection = document.getElementById("msgSection");
const msgInp = document.getElementById("msgInp");
const sendBtn = document.getElementById("sendBtn");

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


// === Socket connection Events ===
const roomId = prompt("Enter Room ID to join:");

if (!roomId) {
  socket.emit("joinRandomMatch", {username: CONFIG.username});
} else {
  roomInfo.innerText = roomId;
  socket.emit("joinRoom", { roomId, username: CONFIG.username });
}


socket.on("opponentName", (name) => {
  document.getElementById("opponent").innerText = name;
});

socket.on("playerRole", (role) => {
  playerRole = role;
  infosec.innerText = `You are playing as ${role === "w" ? "White" : "Black"}`;
  renderBoard();
});

socket.on("spectatorRole", (msg) => {
  infosec.innerText = msg;
  msgInp.style.display = "none";
  sendBtn.style.display = "none";
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen); 
  const isYourTurn = (chess.turn() === playerRole);
  if (isYourTurn) {
    boardElement.classList.add("yourTurn");
  } else {
    boardElement.classList.remove("yourTurn");
  }
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

socket.on("gameOver", ({ winnerColor, winnerName }) => {
  const gameOverMessage = `Game Over! Winner: ${winnerName} (${winnerColor === 'w' ? 'White' : 'Black'})`;
  
  if (infosec) {
    infosec.innerText = gameOverMessage;
    // infosec.classList.remove("hidden");
  } else {
    alert(gameOverMessage); // fallback
  }
});

socket.on("invalidMove", (move) => {
  infosec.innerText = `Invalid move: ${move.from} → ${move.to}`;
});

socket.on("WPO", () => {
  infosec.innerText = "White Player Disconnected";
});

socket.on("BPO", () => {
  infosec.innerText = "Black Player Disconnected";
});

// Chat function
// Send message
let msgSend = false;
sendBtn.addEventListener('click', ()=>{
  if(msgInp.value){
    if(!msgSend){
      document.getElementById('chatInfo').style.display = "none";
      msgSend = true;
    }
    socket.emit('SRUCM', msgInp.value);
    const chatMsg = `<li class="pt-1">
    <p class="text-sm text-gray-300 text-right pr-4">${msgInp.value}</p>
    </li>`
    msgSection.innerHTML += chatMsg;
    msgInp.value = '';
  }
})

msgInp.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && msgInp.value.trim()) {
    sendBtn.click();
  }
});

//received message
socket.on("SSUCM", (msg) =>{
  const chatMsg = `<li class="pt-1">
                    <p class="text-green-400">${msg}</p>
                  </li>`
  msgSection.innerHTML += chatMsg;
  // window.scrollTo(0, document.body.scrollHeight);
  msgSection.scrollTop = msgSection.scrollHeight;
});

document.querySelectorAll(".emoji").forEach(el => {
  el.addEventListener("click", () => {
    const emoji = el.textContent;

    socket.emit('SRUCM', emoji);

    const chatMsg = `<li class="pt-1 text-right pr-4 text-gray-300">
      <p class="text-lg">${emoji}</p>
    </li>`;
    msgSection.innerHTML += chatMsg;
    msgSection.scrollTop = msgSection.scrollHeight;
  });
});


renderBoard();
