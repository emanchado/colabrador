console.clear();
var containerID = "kiCanvas";
var stage = new Kinetic.Stage({
    container: containerID,
    width: 600,
    height: 500,
});
var layer = new Kinetic.Layer();
stage.add(layer);
$('#drawText').on('click', function () {
    $('canvas').on('click', drawText);
});

function drawText(e) {
    var newText = new Kinetic.Text({
        text: "Text",
        x: e.clientX,
        y: e.clientY,
        fill: 'red',
    });
    layer.add(newText);
    layer.draw();
}

      $("textarea").resizable();
