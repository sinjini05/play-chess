const socket = io();

socket.emit("hii");
socket.on("hi everyone", function(){
    console.log("hi everyone received");
});