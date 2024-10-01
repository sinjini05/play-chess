const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(helmet()); // Add security headers
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(express.json()); // Built-in middleware for JSON
app.use(express.urlencoded({ extended: true })); // Built-in middleware for URL-encoded data

// Serve the main page
app.get("/", (req, res) => {
    res.render("index", { title: "Custom Chess Game" });
});

// Handle socket connections
io.on("connection", function (uniquesocket) {
    console.log("Connected");

    // Assign player roles
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    // Handle disconnections
    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    // Handle moves
    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
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

// Secure redirect example with validation
const validRedirects = ['/page1', '/page2']; // Whitelisted routes
app.get('/redirect', (req, res) => {
    const target = req.query.target;
    if (validRedirects.includes(target)) {
        res.redirect(target);
    } else {
        res.status(400).send('Invalid redirect');
    }
});

// Start the server
server.listen(3000, function () {
    console.log("Listening on port 3000");
});
