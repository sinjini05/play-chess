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

app.set("view engine", "ejs"); 
app.use(helmet()); 
app.use(express.static(path.join(__dirname, "public"))); 

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
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
            io.emit("playerDisconnected", { color: "white" });
        } else if (uniquesocket.id === players.black) {
            delete players.black;
            io.emit("playerDisconnected", { color: "black" });
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            if ((chess.turn() === 'w' && uniquesocket.id !== players.white) ||
                (chess.turn() === 'b' && uniquesocket.id !== players.black)) {
                return;
            }

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                uniquesocket.emit("invalidMove", { message: "Invalid move", move });
            }
        } catch (err) {
            console.error(err);
            uniquesocket.emit("error", { message: "An error occurred", details: err.message });
        }
    });
});

server.listen(3000, function () {
    console.log("Listening on port 3000");
});
