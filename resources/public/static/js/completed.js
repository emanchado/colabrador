var imageLocation = "/static/images/";
var images = ['funnydog1.gif',
              'funnydog2.gif',
              'funnydog3.gif',
              'funnydog4.gif',
              'funnydog5.gif',
              'funnydog6.gif',
              'funnydog7.gif',
              'funnydog8.gif',
              'funnydog9.gif',
              'funnydog10.gif',
              'funnydog11.gif',
              'funnydog12.gif'];

var imgElement = document.getElementById("happy");
var randomIndex = Math.floor(Math.random() * images.length);
imgElement.setAttribute("src", imageLocation + images[randomIndex]);
