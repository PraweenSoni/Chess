const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const infosec = document.querySelector(".infosec");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark");

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = (playerRole === square.color);
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");   // This line for no  dragged issue.
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);

            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const tragetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, tragetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    }else{
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, traget) => {
   const move = {
    from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
    to: `${String.fromCharCode(97+traget.col)}${8-traget.row}`,
    promotion: 'q',          // sipahi last tak jata hai to default me queen he milega
   };
   socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
       p: "♟︎",
       r: "♖",
       n: "♘",
       b: "♗",
       q: "♕",
       k: "♔",
       P: "♟︎",
       R: "♜",
       N: "♞",
       B: "♝",
       Q: "♛",
       K: "♚",
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
});
socket.on("spectatorRole", function(){
    playerRole = null;
    infosec.innerText = "Spectator";  
    renderBoard();
});
socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
});
socket.on("move", function(move){
    chess.move(move);
    renderBoard();
});
// const checkmate = chess.isCheck();
// console.log(checkmate);
// if(checkmate){
//     infosec.innerText = "Checkmate...";
// }
socket.on("ischeck",function(ischeck){
    if(ischeck){
        infosec.innerText = "Checked...";
    }else{
        infosec.innerText = "";
    }
    renderBoard();
})
socket.on("ischeckmate",function(ischeckmate){
    if(ischeckmate){
        infosec.innerText = "Checkmate...";
    }else{
        infosec.innerText = "";
    }
    renderBoard();
})
socket.on("isgameover",function(isgameover){
    if(isgameover){
        infosec.innerText = "Game Over...Restart Play!";
    }else{
        infosec.innerText = "";
    }
    renderBoard();
})
socket.on("WPO", function(){
    infosec.innerText = "White Player Goes Offline...";
})
socket.on("BPO", function(){
    infosec.innerText = "Black Player Goes Offline...";
})



// socket.emit("bol");
// socket.on("Haa",function(){
//     // console.log("Haa Bol");
// })
renderBoard();