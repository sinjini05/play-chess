const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const helmet = require("helmet");

const app = express();
app.use(helmet());

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Custom Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("Connected:", uniquesocket.id);

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    // Simple rate limiting per socket
    let moveCount = 0;
    setInterval(() => { moveCount = 0; }, 1000);

    uniquesocket.on("move", (move) => {
        // Rate limit: max 5 moves/sec
        if (++moveCount > 5) {
            uniquesocket.emit("error", "Too many moves, slow down.");
            return;
        }

        // Validate move object
        if (
            typeof move !== "object" ||
            typeof move.from !== "string" ||
            typeof move.to !== "string" ||
            move.from.length !== 2 ||
            move.to.length !== 2
        ) {
            uniquesocket.emit("invalidMove", move);
            return;
        }

        try {
            // Only allow correct player to move
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error("Move error:", err.message);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, function () {
    console.log("listening on port 3000");
});