var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/chat");

socket.onmessage = function(msg) {
    console.log("Received message from server: " + msg.data);
};

document.getElementById("message-form").addEventListener("submit", function(e) {
    var box = document.getElementById("message-box");
    socket.send(JSON.stringify({command: 'post', text: box.value}));
    box.value = "";
}, false);
