/*global ajaxRequest, window, showSection, showError, initSection, showBoard, boardConnector */

// var hostname = location.hostname;
// var port = location.port;
// var socket = new WebSocket("ws://" + hostname + ":" + port + "/ws");

// socket.onopen = function() {
//     console.log("Connected!");
// };
// socket.onmessage = function(msg) {
//     console.log("Received message from server: " + msg.data);
// };

window.addEventListener("load", function(/*e*/) {
    ajaxRequest("GET", "/login-info", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                console.log("Received " + xmlhttp.responseText + " from login-info");
                var result = JSON.parse(xmlhttp.responseText);
                var sectionToShow = result["valid-session"] ?
                        "list-boards" : "login";
                showSection(sectionToShow);
            } else {
                showError("Authentication error, try reloading the page in a couple of minutes");
            }
        }
    });
}, false);

document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();

    var box = document.getElementById("login-box");
    ajaxRequest("POST", "/login", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                console.log("Received " + xmlhttp.responseText + " from login");
                var result = JSON.parse(xmlhttp.responseText);
                var sectionToShow = result.status === "ok" ?
                        "list-boards" : "login";
                showSection(sectionToShow);
                box.value = "";
            } else {
                showError("Authentication error (server returned status " + xmlhttp.status + "), try reloading the page in a couple of minutes");
            }
        },
        body: "username=" + encodeURI(box.value)
    });
}, false);

document.getElementById("new-board-form").addEventListener("submit", function(e) {
    e.preventDefault();

    var nameBox = document.getElementById("new-board-name");
    var questionBox = document.getElementById("new-board-question");
    ajaxRequest("POST", "/boards", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                showSection("board");
                nameBox.value = "";
                questionBox.value = "";
            } else {
                showError("Couldn't create board '" + nameBox.value + "'");
            }
        },
        body: "board-name=" + encodeURI(nameBox.value) + "&board-question=" +
            encodeURI(questionBox.value)
    });
}, false);

document.getElementById("message-form").addEventListener("submit", function(e) {
    e.preventDefault();

    var box = document.getElementById("message-box");
    // socket.send(JSON.stringify({command: 'post', text: box.value}));
    box.value = "";
}, false);

initSection("list-boards", function() {
    ajaxRequest("GET", "/boards", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                var result = JSON.parse(xmlhttp.responseText);
                var listElement = document.getElementById("board-list");
                var board, boardElement, boardLink;
                for (var i = 0, len = result.boards.length; i < len; i++) {
                    board = result.boards[i];
                    boardElement = document.createElement("li");
                    boardLink = document.createElement("a");

                    boardLink.textContent = board.name;
                    boardLink.addEventListener("click",
                                               boardConnector(board),
                                               false);
                    boardElement.appendChild(boardLink);
                    listElement.appendChild(boardElement);
                }
            } else {
                showError("Error fetching boards. Server status code " + xmlhttp.status + ".");
            }
        }
    });
});
