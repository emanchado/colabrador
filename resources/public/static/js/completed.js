

 var imlocation = "/static/images/";
 var currentdate = 0;
 var image_number = 0;
 function ImageArray (n) {
   this.length = n;
   for (var i =1; i <= n; i++) {
     this[i] = ' '
   }
 }
 image = new ImageArray(7)
 image[0] = 'funnydog1.gif'
 image[1] = 'funnydog2.gif'
 image[2] = 'funnydog3.gif'
 image[3] = 'funnydog4.gif'
 image[4] = 'funnydog5.gif'
 image[5] = 'funnydog6.gif'
 image[6] = 'funnydog7.gif'

 var rand = 60/image.length
 function randomimage() {
 	currentdate = new Date()
 	image_number = currentdate.getSeconds()
 	image_number = Math.floor(image_number/rand)
 	return(image[image_number])
 }


 document.write("<img class='complete' id='happy'  width='300px' src='" + imlocation + randomimage()+ "'>");
