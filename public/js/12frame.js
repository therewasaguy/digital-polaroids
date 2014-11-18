$(document).ready(function(){
	setFeatureStudent();
	TweenLite.set(".grid", {perspective:800});
	TweenLite.set(".frame", {transformStyle:"preserve-3d"});
	TweenLite.set(".back", {rotationY:-180});
	TweenLite.set([".back", ".front", ".gif", ".backFrame"], {backfaceVisibility:"hidden"});	
	//resetImage();
	$.when(resetImage()).done(generateTimeline());	

function setFeatureStudent(){
	$.getJSON("/api/get/users/1", function( data ) {

			if(data.students[0]!= null){
				var firstName = data.students[0].name.firstName;
				var lastName = data.students[0].name.lastName;
				var location = data.students[0].location;
				var mphoto = data.students[0].photo;
				var main = document.getElementById("main");
				main.style.background="url("+mphoto+") no-repeat";
				main.style.backgroundSize ="cover";
				main.style.backfaceVisibility="hidden";
				var details = "<h1>"+ firstName + " " + lastName+ " "+location+"</h1>";
				var p = document.getElementById("plaque");
				p.innerHTML = details;			
		}

	});
}
	

function resetImage() {
	//$.getJSON( "/api/get/users", function( data ) {
	//for local testing
	killFlip();
	
	$.getJSON("/api/get/users/12", function( data ) {
		var students = data.students;
		for(var i =0; i<students.length; i++){
			if(students[i] != null){
				var firstName = data.students[i].name.firstName;
				var lastName = data.students[i].name.lastName;
				var location = data.students[i].location;
				var year = data.students[i].year;
				var photo = data.students[i].photo;
				var gif = document.getElementById(i);
				var node=document.createElement("H1");
				var textnode=document.createTextNode(firstName + " " + lastName);
				var details = "<h1 class=\"test\">"+ firstName + " " + lastName+ "<br>"+location+"<br>ITP "+year+"</h1>";
				var info = document.getElementById(i+"b");
				info.innerHTML = details;
				gif.style.backfaceVisibility="hidden";
				gif.style.background="url("+photo+") no-repeat";
				gif.style.backgroundSize="cover";

			}
		}
	});
	setTimeout(setFlip, 5000);
};

var intervalID = null;

function intervalManager(flag, animate, time) {
   if(flag){
     intervalID =  setInterval(animate, time);
   } else{
     clearInterval(intervalID);
   }
}


function setFlip(){
	intervalManager(true, flip, 6000);	
	counter = 0;
	
	function randomDivs(){
		function shuffle(o) {
		    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		    return o;
		};

		var random = shuffle(numbers);

		for (var i = 0; i < random.length; i++){
		}
	}
	randomDivs();
}

function killFlip(){
	intervalManager(false);	
	
}



function flip() {
	var rd = numbers[counter];
	$grids = $(".grid");
	$grid = $grids[rd];
	var currentFrame = $($grid).find(".frame");
	var currentGif = $($grid).find(".gif");
	TweenLite.to(currentFrame, 1.2, {rotationY:180, ease:Back.easeOut});
	TweenLite.to(currentGif, 1, {opacity:0, ease:Back.easeOut});
	$quote = $($grid).find(".backFrame");
    $hs = $( "h1" ); 
    $text = $quote.find( $hs );
    mySplitText = new SplitText($text, {type:"chars, words"}),
	splitTextTimeline = new TimelineLite({delay:1,onComplete: done});
	
	numChars = mySplitText.chars.length;
	//intro sequence
	for(var i = 0; i < numChars; i++){
	  splitTextTimeline.from(mySplitText.chars[i], 2, {z:randomNumber(-500,300), opacity:0, rotationY:randomNumber(-40, 40)}, Math.random()*1.5);
	}
	//dummy action to delay frame flip 2 seconds
	splitTextTimeline.set({},{},"+=2");

	function done() {	
	  	counter++;			  	
	    TweenLite.to(currentFrame, 1, {rotationY:720,opacity:1, ease:Back.easeOut});  
	    TweenLite.to(currentGif, 1, {opacity:1, ease:Back.easeOut});
	    if(counter ==6 ){
		counter=-1;
		setTimeout(function(){
			tl.play("explode");					
		},5000);
		}
	}

};
var counter = 0;
var numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function watchTimeLine(){
	var currentLabel = tl.currentLabel();
	var progress = tl.progress()*100;
	if (progress ==100){
		resetImage();
	}

}

function generateTimeline(){
	
		tl = new TimelineMax({delay:2, repeat:-1, onUpdate:watchTimeLine}),
		tl.add("explode", "+=300");

		
		//Frame Animation
		$( ".frame" ).each(function( index ) {			
			tl.from(this, 5, {delay:Math.random()*1.5, scale:0, x:randomNumber(-1000,1000), y:randomNumber(-1000,1000), z:-1, opacity:0, rotation:randomNumber(-360, 360), rotationX:randomNumber(-180, 180), rotationY:randomNumber(-360, 360)}, Math.random()*.5);			
			
 			tl.to(this, 5, {x:randomNumber(-2000,2000), y:randomNumber(-500,1000), z:-1, z:randomNumber(100, 500), opacity:0, rotation:randomNumber(360, 720), rotationX:randomNumber(-180, 180), rotationY:randomNumber(-360, 360)}, "explode+=" + Math.random()*.5);

		});

	};

	function randomNumber(min, max){
	  return Math.floor(Math.random() * (1 + max - min) + min);
	}
});