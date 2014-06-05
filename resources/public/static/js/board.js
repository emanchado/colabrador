var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/messages");
var numberMessagesDiv = document.getElementById('number-messages');
var messages = [];

socket.onmessage = function(msg) {
    console.log(msg.data);
    messages.push(JSON.parse(msg.data));

    numberMessagesDiv.innerHTML = messages.length;
};
