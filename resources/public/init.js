var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/chat");
var messagesDiv = document.getElementById("messages");

socket.onopen = function() {
    this.send("> HERE COMES A NEW CHALLENGER");
    return messagesDiv.innerHTML += "<p>socket opened</p>";
};
socket.onmessage = function(msg) {
    console.log("Received message from server: " + msg.data);
    return messagesDiv.innerHTML += "<p>" + msg.data + "</p>";
};

document.getElementById("message-form").addEventListener("submit", function(e) {
    e.preventDefault();
    var box = document.getElementById("message-box");
    socket.send(box.value);
    box.value = "";
}, false);
