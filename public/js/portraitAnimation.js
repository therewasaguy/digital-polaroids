		$(document).ready(function(){
			TweenLite.set(".grid", {perspective:800});
			TweenLite.set(".frame", {transformStyle:"preserve-3d"});
			TweenLite.set(".back", {rotationY:-180});
			TweenLite.set([".back", ".front", ".gif"], {backfaceVisibility:"hidden"});

			resetImage();
			console.log(window.innerWidth);
			console.log(window.innerHeight);
			
			$.when(resetImage()).done(generateTimeline());
			
		
		function resetImage() {
			//$.getJSON( "/api/get/users", function( data ) {
			//for local testing
			$.getJSON( "/api/get/users/9", function( data ) {
				console.log(data);
				var students = data.students;
				for(var i =0; i<students.length; i++){
					if(students[i] != null){
						var firstName = data.students[i].name.firstName;
						var lastName = data.students[i].name.lastName;
						var description = data.students[i].description;
						//console.log(firstName + " " + lastName);
						//console.log(description);
						var photo = data.students[i].photo;
						var gif = document.getElementById(i);
						var node=document.createElement("H1");
						var textnode=document.createTextNode(firstName + " " + lastName);
						var details = "<h1 class=\"test\">"+ firstName + " " + lastName+ "</h1> <p>"+description+"</p>";
						var info = document.getElementById(i+"b");
						info.innerHTML = details;
						gif.style.background="url("+photo+") no-repeat";
						gif.style.backgroundSize="cover";
					}
				}

			});
		};

		function generateTimeline(){
				tl = new TimelineMax({delay:2, repeat:-1}),
				tl.add("explode", "+=30");
				
				//Frame Animation
				$( ".frame" ).each(function( index ) {
				
					tl.from(this, 5, {delay:Math.random()*1.5, scale:0, x:randomNumber(-1000,1000), y:randomNumber(-1000,1000), z:-1, opacity:0, rotation:randomNumber(-360, 360), rotationX:randomNumber(-180, 180), rotationY:randomNumber(-360, 360)}, Math.random()*.5);
		
		 			tl.to(this, 5, {x:randomNumber(-2000,2000), y:randomNumber(-500,1000), z:-1, z:randomNumber(100, 500), opacity:0, rotation:randomNumber(360, 720), rotationX:randomNumber(-180, 180), rotationY:randomNumber(-360, 360)}, "explode+=" + Math.random()*.5);

				});

			}


	$(".grid").click(function(event) {
	  	tl.paused(!tl.paused());
	  	$grids = $(".grid");
	  	for(var i = 0; i < $grids.length; i++){
	  		$grids[i].style.pointerEvents = "none";
	  	}
	  	
	  	
	  	console.log("paused");
	  	var currentFrame = $(this).find(".frame");
	  	var currentGif = $(this).find(".gif");
	    TweenLite.to(currentFrame, 1.2, {rotationY:180, ease:Back.easeOut});
	    TweenLite.to($(this).find(".gif"), 1, {opacity:0, ease:Back.easeOut});
	   $quote = $(this).find(".backFrame");
	   $ps = $( "p" ); 
	   $text = $quote.find( $ps );
	    mySplitText = new SplitText($text, {type:"chars, words"}),
    	splitTextTimeline = new TimelineLite({delay:1,onComplete: done});
    	splitTextTimeline.add("break", "+=30");
    	numChars = mySplitText.chars.length;
    	//console.log(numChars);
    	//intro sequence
		for(var i = 0; i < numChars; i++){
		  splitTextTimeline.from(mySplitText.chars[i], 1.5, {z:randomNumber(-500,300), opacity:0, rotationY:randomNumber(-40, 40)}, Math.random()*1.5);
		}
		//dummy action to delay frame flip 2 seconds
		
		splitTextTimeline.set({},{},"+=2");

			function done() {
		  	tl.paused(!tl.paused());
		  	console.log("playing");
		    TweenLite.to(currentFrame, 1, {rotationY:720,opacity:1, ease:Back.easeOut});  
		    TweenLite.to(currentGif, 1, {opacity:1, ease:Back.easeOut});
		    for(var i = 0; i < $grids.length; i++){
	  		$grids[i].style.pointerEvents = "auto";
	  		}
		  }

	    });
	

		//var pauseBtn = document.getElementById("pause");	
		// pauseBtn.onclick = function() {
		//   tl.paused(!tl.paused());
		//   pauseBtn.innerHTML = tl.paused() ? "play" : "pause";
		// }
			
		});
				
		function randomNumber(min, max){
		  return Math.floor(Math.random() * (1 + max - min) + min);
		}



		// $(document).ready(function(){

		// 	var data = $.getJSON( "/api/get/users/9", function( data ) {
		// 		console.log(data);
		// 		var students = data.students;
		// 		for(var i =0; i<students.length; i++){
		// 			if(data.students[i] != null){
		// 				var firstName = data.students[i].name.firstName;
		// 				var lastName = data.students[i].name.lastName;
		// 				var photo = data.students[i].photo;
		// 				var gif = document.getElementById(i);
		// 				gif.style.background="url("+photo+") no-repeat";
		// 				gif.style.backgroundSize="cover";
		// 			}
		// 		}	

		// 	});
			
		// 	tl = new TimelineMax({delay:2, repeat:-1, onUpdate:updateSlider, onComplete: logit}),
		// 	tl.add("explode", "+=15");
		// 	function updateSlider(){
		// 		//console.log(tl.progress().toFixed(2));
		// 		if (tl.progress().toFixed(2) ==1){
		// 			tl.restart();
		// 			resetImage();
		// 		}
		// 	}

		// 	function logit(){
		// 		//console.log("HERE");
		// 	}

		// 	$( ".frame" ).each(function( index ) {
			
		// 		tl.from(this, 5, {delay:Math.random()*1.5, scale:0, x:randomNumber(-1000,1000), y:randomNumber(-1000,1000), z:-1, opacity:0, rotation:randomNumber(-360, 360), rotationX:randomNumber(-360, 360), rotationY:randomNumber(-360, 360)}, Math.random()*.5);
	
	 // 			tl.to(this, 5, {x:randomNumber(-2000,2000), y:randomNumber(-500,1000), z:-1, z:randomNumber(100, 500), opacity:0, rotation:randomNumber(360, 720), rotationX:randomNumber(-360, 360), rotationY:randomNumber(-360, 360)}, "explode+=" + Math.random()*.5);

		// });

			
		
		// function resetImage() {
		// 	var data = $.getJSON( "/api/get/users/9", function( data ) {
		// 		console.log(data);
		// 		var students = data.students;
		// 		for(var i =0; i<students.length; i++){
		// 			if(data.students[i] != null){
		// 				var firstName = data.students[i].name.firstName;
		// 				var lastName = data.students[i].name.lastName;
		// 				var photo = data.students[i].photo;
		// 				var gif = document.getElementById(i);
		// 				gif.style.background="url("+photo+") no-repeat";
		// 				gif.style.backgroundSize="cover";
		// 			}
		// 		}

		// 	});
		// };

		
		// $frames = $(".frame");

		// $frames.click(function(event) {
		// 	console.log("clickedFrame");
		// 	tl.paused(!tl.paused());	
		// });

		// //var pauseBtn = document.getElementById("pause");	
		// // pauseBtn.onclick = function() {
		// //   tl.paused(!tl.paused());
		// //   pauseBtn.innerHTML = tl.paused() ? "play" : "pause";
		// // }
			
		// });
				
		// function randomNumber(min, max){
		//   return Math.floor(Math.random() * (1 + max - min) + min);
		// }