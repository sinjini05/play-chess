const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs"); // ejs is like html
app.use(helmet()); // Add security headers including XSS protection
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use(limiter);

app.get("/", (req, res) => {
    res.render("index", { title: "Custom Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("Connected");

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

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move); // Notify all clients of the move
                io.emit("boardState", chess.fen()); // Update board state
            } else {
                console.log("Invalid move");
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("Invalid move: ", move);
        }
    });
});

server.listen(3000, function () {
    console.log("Listening on port 3000");
});
