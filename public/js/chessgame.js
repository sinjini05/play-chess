const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

//role assigned by server, frontend null
let draggedPiece = null;
let sourceSqaure = null;
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
                pieceElement.innertext = getPieceUnicode(square);
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

};

const handleMove = () =>{};

const getPieceUnicode = (piece) =>{
    const unicodePieces = {
        p : "♙",
        k : "♔",
        q : "♕",
        r : "♖",
        b : "♗",
        n : "♘",
        P : "♟",
        N : "♞",
        B : "♝",
        R : "♜",
        Q : "♛",
        K : "♚",
    };
    return unicodePieces[piece.type] || "";
};

renderBoard();


