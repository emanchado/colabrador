var sectionInitFunctions = {};

function showSection(sectionName) {
    var id = sectionName + "-section";
    var sections = document.getElementsByClassName("section");
    for (var i = 0, len = sections.length; i < len; i++) {
        if (sections[i].id === id) {
            var cb = sectionInitFunctions[sectionName];
            if (cb) { cb(); }
            sections[i].style.display = "";
        } else {
            sections[i].style.display = "none";
        }
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
    console.log("Show 'question' section with question " + board.question);
    showSection("question");
}

function initSection(sectionName, callback) {
    sectionInitFunctions[sectionName] = callback;
}
