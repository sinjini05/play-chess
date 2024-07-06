const express = require("express");
const socket = require ("socket.io");
const http = require("http");
const { Chess } =require("chess.js");
const path= require("path");

const app = express();

const server = http.createServer(app);
//socket runs http server (which is linked w the express server)
const io = socket(server);//socket helps in realtime conversation

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine","ejs"); // ejs is like html
app.use(express.static(path.join(__dirname,"public"))); // for static files like js,img,vid,fonts

app.get("/",(req,res)=>{
    res.render("index",{ title: "Custom Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("Connected");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("specatatorRole");
    }

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }

    });

    uniquesocket.on("move",(move)=>{
        //right move
        try{
            if(chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
            }
        }
        catch(err){}
    })

});

server.listen(3000,function(){
    console.log("listening on port 3000");
})




