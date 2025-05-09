const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

//role assigned by server, frontend null
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () =>{
    const board = chess.board();
    boardElement.innerHTML= "";
    board.forEach((row, rowindex)=>{
        row.forEach((square,squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", 
                //first square light and so on
                (rowindex + squareindex)%2 === 0 ? "light" : "dark"
            );

            //setting numbers for each squares
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece",square.color === 'w' ? "white" : "black");
                pieceElement.textContent = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart",(e)=>{
                    if(pieceElement.draggable){
                        draggedPiece  = pieceElement;
                        sourceSquare = {row: rowindex, col: squareindex};
                        e.dataTransfer.setData("text/plain","");
                    }
                });

                pieceElement.addEventListener("dragend",(e)=>{
                    draggedPiece = null;
                    sourceSquare = null;
                });

                //appending pieces to squares
                squareElement.appendChild(pieceElement)

            }
            
            //dont let them drag square itself
            squareElement.addEventListener("dragover", function(e){
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e){
                //dont let conventional drop() occur
                e.preventDefault();
                if(draggedPiece){
                    const targetSource = {
                            row: parseInt(squareElement.dataset.row),
                            col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare,targetSource);

                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }

};

const handleMove = (source,target) =>{
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };
    socket.emit("move",move);
};

const getPieceUnicode = (piece) =>{
    const unicodePieces = {
        p : "♙",
        r : "♜",
        n : "♞",
        b : "♝",
        q : "♛",
        k : "♚",
        P : "♙",
        R : "♖",
        N : "♘",
        B : "♗",
        Q : "♕",
        K : "♔", 
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole",function(role){
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole",function(){
    playerRole = null;
    renderBoard();
});

socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});

socket.on("move",function(move){
    chess.move(move);
    renderBoard();
});


renderBoard();


