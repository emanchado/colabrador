/*global ajaxRequest, window, showSection, showError, initSection, showBoard, boardConnector, _, showBoardAdmin, addAnswerToBoard */

var hostname = location.hostname;
var port = location.port;
var socket, userId;

window.addEventListener("load", function(/*e*/) {
    ajaxRequest("GET", "/login-info", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                var result = JSON.parse(xmlhttp.responseText);
                var sectionToShow = "login";
                if (result["valid-session"]) {
                    sectionToShow = "list-boards";
                    userId = result["user-id"];
                }
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
                var result = JSON.parse(xmlhttp.responseText);
                var sectionToShow = "login";
                if (result.status === "ok") {
                    userId = result["user-id"];
                    sectionToShow = "list-boards";
                }
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
                var result = JSON.parse(xmlhttp.responseText);
                if (result.status === "ok") {
                    showBoard(result.board);
                    nameBox.value = "";
                    questionBox.value = "";
                } else {
                    showError("Couldn't create board '" + nameBox.value + "'");
                }
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
    var boardId = document.getElementById("board-id").value;
    ajaxRequest("POST", "/boards/" + boardId, {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                box.value = "";
                showSection("list-boards");
            } else {
                showError("Couldn't post answer on board");
            }
        },
        body: "answer=" + encodeURI(box.value)
    });
}, false);

document.getElementById("toggle-names-button").addEventListener("click", function(e) {
    e.preventDefault();

    _.forEach(document.getElementsByClassName("username"), function(e) {
        e.style.display = e.style.display === "none" ? "" : "none";
    });
}, false);

document.getElementById("back-from-board-admin-button").addEventListener("click", function(e) {
    e.preventDefault();

    showSection("list-boards");
});

document.getElementById("back-from-answer-button").addEventListener("click", function(e) {
    e.preventDefault();

    showSection("list-boards");
});

initSection("list-boards", function() {
    ajaxRequest("GET", "/boards", {
        ready: function(xmlhttp) {
            if (xmlhttp.status === 200) {
                var result = JSON.parse(xmlhttp.responseText);
                var listElement = document.getElementById("board-list");
                while (listElement.firstChild) {
                    listElement.removeChild(listElement.firstChild);
                }

                var boardElement, boardLink;
                var orderedBoards = _.sortBy(result.boards,
                                             "creation-timestamp");
                _.forEach(orderedBoards.reverse(), function(board) {
                    boardElement = document.createElement("li");
                    boardLink = document.createElement("a");

                    boardLink.textContent = board.name;
                    boardLink.addEventListener("click",
                                               boardConnector(board),
                                               false);
                    boardElement.appendChild(boardLink);

                    if (board.owner === userId) {
                        boardElement.appendChild(document.createTextNode(" (owner)"));
                    }
                    listElement.appendChild(boardElement);
                });
            } else {
                showError("Error fetching boards. Server status code " + xmlhttp.status + ".");
            }
        }
    });
});

initSection("board", function() {
    var boardOwner = document.getElementById("board-owner").value;
    if (boardOwner === userId) {
        var boardId = document.getElementById("board-id").value;
        var wsUri = "ws://" + hostname + ":" + port + "/boards/" + boardId + "/ws";
        socket = new WebSocket(wsUri);

        socket.onerror = function() {
            console.log("Could not establish a WebSocket connection to board " + boardId);
            showSection("question");
        };
        socket.onopen = function() {
            showBoardAdmin();
        };
        socket.onmessage = function(msg) {
            var answer = JSON.parse(msg.data);
            var answerBoard = document.getElementById("container");
            addAnswerToBoard(answer, answerBoard, function() {
                ajaxRequest('DELETE', '/answers/' + answer.id, {
                    ready: function(xmlhttp) {
                        if (xmlhttp.status !== 200) {
                            console.log("Couldn't delete answer '" +
                                            answer.id + "'");
                        }
                    }
                });
            });
        };
    } else {
        showSection("question");
    }
});
