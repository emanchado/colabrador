var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/messages");
var numberMessagesDiv = document.getElementById('number-messages-text');
var messages = [];

function numberMessagesText(number) {
    switch (number) {
        case 0: return "are no messages";
        case 1: return "is 1 message";
        default: return "are " + number + " messages";
    }
}

socket.onmessage = function(msg) {
    console.log(msg.data);
    messages.push(JSON.parse(msg.data));

    numberMessagesDiv.innerHTML = numberMessagesText(messages.length);
};
