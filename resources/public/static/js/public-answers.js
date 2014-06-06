/*
See http://www.greensock.com/draggable/ for details. 
This demo uses ThrowPropsPlugin which is a membership benefit of Club GreenSock, http://www.greensock.com/club/
*/

var $snap = $("#snap"),
  $liveSnap = $("#liveSnap"),
	$container = $("#container"),
	gridWidth = 196,
	gridHeight = 100,
	gridRows = 6,
	gridColumns = 5,
	i, x, y;

//set the container's size to match the grid, and ensure that the box widths/heights reflect the variables above
TweenLite.set($container, {height: gridRows * gridHeight + 1, width: gridColumns * gridWidth + 1});
TweenLite.set("#box1", {width:gridWidth, height:gridHeight, lineHeight:gridHeight + "px"});
TweenLite.set("#box2", {width:gridWidth * 2, height:gridHeight, lineHeight:gridHeight + "px"});

//the update() function is what creates the Draggable according to the options selected (snapping).
function update() {
  var snap = $snap.prop("checked"),
      liveSnap = $liveSnap.prop("checked");
	Draggable.create(".box", {
		bounds:$container,
		edgeResistance:0.65,
		type:"x,y",
		throwProps:true,
		liveSnap:liveSnap,
		snap:{
			x: function(endValue) {
				return (snap || liveSnap) ? Math.round(endValue / gridWidth) * gridWidth : endValue;
			},
			y: function(endValue) {
				return (snap || liveSnap) ? Math.round(endValue / gridHeight) * gridHeight : endValue;
			}
		}
	});
}

//when the user toggles one of the "snap" modes, make the necessary updates...
$snap.on("change", applySnap);
$liveSnap.on("change", applySnap);

function applySnap() {
	if ($snap.prop("checked") || $liveSnap.prop("checked")) {
		$(".box").each(function(index, element) {
			TweenLite.to(element, 0.5, {
				x:Math.round(element._gsTransform.x / gridWidth) * gridWidth,
				y:Math.round(element._gsTransform.y / gridHeight) * gridHeight,
				delay:0.1,
				ease:Power2.easeInOut
			});
		});
	}
	update();
}

var hostname = location.hostname;
var port = location.port;
var socket = new WebSocket("ws://" + hostname + ":" + port + "/messages");
var messagesDiv = document.getElementById('container');
var messages = [];

socket.onmessage = function(rawMessage) {
    function randomInt(limit) {
        return Math.floor(Math.random() * (limit + 1));
    }

    console.log(rawMessage.data);
    var msg = JSON.parse(rawMessage.data);
    messages.push(msg);

    var newMessage = document.createElement("div");
    newMessage.setAttribute("class", "box");
    newMessage.setAttribute("id", msg.id);
    newMessage.innerHTML = "<div class='text'>" + msg.text +
        "<br/><span class='username'>@" + msg.user + "</span></div>";

    // Position randomly
    newMessage.style.left = randomInt(messagesDiv.offsetWidth - 300) + "px";
    newMessage.style.top = randomInt(messagesDiv.offsetHeight - 200) + "px";

    var glyphicon = document.createElement("glyphicon");
    glyphicon.setAttribute("class", "glyphicon glyphicon-remove-sign exit");
    glyphicon.setAttribute("data-id", msg.id);
    glyphicon.addEventListener("click", function(evt) {
        evt.target.parentNode.remove();

        var messageId = this.getAttribute("data-id");
        socket.send(JSON.stringify({command: 'delete', id: messageId}));
    }, false);
    newMessage.appendChild(glyphicon);

    messagesDiv.appendChild(newMessage);

    update();
};
