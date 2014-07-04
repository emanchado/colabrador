/*global _, TweenLite, Draggable */

var sectionInitFunctions = {};

function showSection(sectionName) {
    // First, make sure we are back to "default design"
    _.forEach(document.getElementsByClassName("board-design"), function(e) {
        e.style.display = 'none';
    });
    _.forEach(document.getElementsByClassName("default-design"), function(e) {
        e.style.display = '';
    });

    var id = sectionName + "-section";
    var sections = document.getElementsByClassName("section");
    var cb;
    for (var i = 0, len = sections.length; i < len; i++) {
        if (sections[i].id === id) {
            cb = sectionInitFunctions[sectionName];
            sections[i].style.display = "";
        } else {
            sections[i].style.display = "none";
        }
    }

    if (cb) {
        cb();
    }
}

function showError(msg) {
    showSection("error");
    document.getElementById("error-message").textContent = msg;
}

function boardConnector(board) {
    return function(e) {
        e.preventDefault();
        showBoard(board);
    };
}

function showBoard(board) {
    document.getElementById("board-question").textContent = board.question;
    document.getElementById("board-id").value = board.id;
    document.getElementById("board-owner").value = board.owner;
    showSection("board");
}

function showBoardAdmin() {
    var container = document.getElementById("container"),
        gridWidth = 196,
        gridHeight = 100,
        gridRows = 6,
        gridColumns = 5;

    TweenLite.set(container,
                  {height: gridRows    * gridHeight + 1,
                   width:  gridColumns * gridWidth  + 1});

    _.forEach(document.getElementsByClassName("default-design"), function(e) {
        e.style.display = 'none';
    });

    _.forEach(document.getElementsByClassName("board-design"), function(e) {
        e.style.display = '';
    });
}

function addAnswerToBoard(answer, board, deleteCb) {
    function randomInt(limit) {
        return Math.floor(Math.random() * (limit + 1));
    }

    var answerDiv = document.createElement("div");
    answerDiv.setAttribute("class", "box");
    answerDiv.setAttribute("id", "answer-" + answer.id);
    answerDiv.innerHTML = "<div class='text'>" + answer.text +
        "<span class='username'><br/>@" + answer.user + "</span></div>";

    // Position randomly
    answerDiv.style.left = randomInt(board.offsetWidth - 300) + "px";
    answerDiv.style.top = randomInt(board.offsetHeight - 200) + "px";

    var glyphicon = document.createElement("glyphicon");
    glyphicon.setAttribute("class", "glyphicon glyphicon-remove-sign exit");
    glyphicon.addEventListener("click", function(evt) {
        evt.target.parentNode.remove();
        deleteCb();
    }, false);
    answerDiv.appendChild(glyphicon);

    board.appendChild(answerDiv);

    Draggable.create(".box", {
        bounds: board,
        edgeResistance: 0.65,
        type: "x,y",
        throwProps: true
    });
}

function initSection(sectionName, callback) {
    sectionInitFunctions[sectionName] = callback;
}
