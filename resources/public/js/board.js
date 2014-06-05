var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/chat");
var numberMessagesDiv = document.getElementById('number-messages');

socket.onmessage = function(msg) {
    var numberMessages = parseInt(numberMessagesDiv.innerHTML, 10);
    numberMessagesDiv.innerHTML = numberMessages + 1;
};
