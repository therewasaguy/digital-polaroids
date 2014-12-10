function init() {

	//preparePortraits();

	var videoContainer = document.getElementById('video');
	var gifContainer = document.getElementById('gifContainer');
	var videoWidth= 0, videoHeight = 0;
	var videoElement;
	var shooter;

	// add event listners
	window.addEventListener('resize', onResize);
	document.getElementById('capture').addEventListener('click', startGifCapture);
	//document.getElementById('save').addEventListener('click', postGif);
	document.getElementById('reRecord').addEventListener('click',reStart); 
	document.getElementById('done').addEventListener('click',reLoad); 
	document.getElementById('netId').addEventListener('change', submitId);
	document.getElementById('descButton').addEventListener('click',submitDescription);

	GumHelper.startVideoStreaming(function(error, stream, videoEl, width, height) {
		if(error) {
			//alert('Cannot open the camera. Maybe allow the camera or refresh the page? ' + error.message);
			return;
		}

		document.getElementById('webcam-alert').style.display = "none";
		document.getElementById('capture').style.display = "block";

		videoElement = videoEl;
		videoElement.width = width;
		videoElement.height = height;
		videoWidth = width;
		videoHeight = height;

		videoContainer.appendChild(videoElement);

		shooter = new VideoShooter(videoElement);

		onResize();
	});

	function startGifCapture() {
		
		shooter.getShot(onFrameCaptured, 30, 0.2, function onProgress(progress) {
			// show counter and progress
			document.getElementById('counter').style.display = 'block';
			document.getElementById('progressHolder').style.display = 'block';
			document.getElementById('progressBar').style.width = ((progress*100).toString())+'%';

			// disable capture button and show it recording
			document.getElementById('capture').style.pointerEvents = "none";
			document.getElementById('capture').innerHTML = "We're recording...";
			
			if((progress*100)%1 === 0){
				var count = 10-(progress*10);
				document.getElementById('counter').innerHTML = count;
				document.getElementById('counter').style.opacity = '0.8';
			}
			else document.getElementById('counter').style.opacity = '0.9';
			if(progress === 1){
				document.getElementById('counter').style.display = 'none';
				document.getElementById('progressHolder').style.display = 'none';
				document.getElementById('capture').style.display = 'none';
				document.getElementById('loader').style.display = 'block';
				document.getElementById('video').style.display = 'none';				
			}
		});

	}

	function onFrameCaptured(pictureData) {
		var img = document.createElement('img');
		img.src = pictureData;
		img.id = 'generatedGif';

		var imageSize = getImageSize();

		img.style.width = imageSize[0] + 'px';
		img.style.height = imageSize[1] + 'px';

		gifContainer.insertBefore(img, gifContainer.firstChild);
		//document.getElementById('loader').style.display = 'none';	
		document.getElementById('gifContainer').style.display = "block";
		document.getElementById('video').style.display = "none";
		//document.getElementById('save').style.display = "block";
		document.getElementById('reRecord').style.display = "block";
		document.getElementById('capture').style.display = "none";

		// go ahead and save automatically
		postGif();


	}

	function getImageSize() {
		var imageWidth = videoWidth;
		var imageHeight = videoHeight;

		return [ imageWidth, imageHeight ];
	}

	function onResize(e) {

		// Don't do anything until we have a video element from which to derive sizes
		if(!videoElement) {
			return;
		}
		
		var imageSize = getImageSize();
		var imageWidth = imageSize[0] + 'px';
		var imageHeight = imageSize[1] + 'px';

		for(var i = 0; i < gifContainer.childElementCount; i++) {
			var img = gifContainer.children[i];
			img.style.width = imageWidth;
			img.style.height = imageHeight;
		}

		videoElement.style.width = imageWidth;
		videoElement.style.height = imageHeight;
	
	}

  function reStart(){
  	if(gifContainer.childElementCount > 0) gifContainer.removeChild(gifContainer.lastChild);
  	document.getElementById('gifContainer').style.display = "none";
		//document.getElementById('save').style.display = "none";
		document.getElementById('reRecord').style.display = "none";  
		document.getElementById('done').style.display = "none"; 	
  	document.getElementById('video').style.display = "block";
  	document.getElementById('capture').style.display = "block";

  	startGifCapture();
  }

  function reLoad(){
  	location.reload();
  }
}

window.addEventListener('DOMContentLoaded', init);

function postGif (){
	document.getElementById('loader').style.display = 'block'
	document.getElementById('help-text').innerHTML = "saving...";

	var gif = $('#generatedGif').attr('src');
	var userDiv = document.getElementById('userId');
	var userId = userDiv.getAttribute('data-userId');

	$.ajax({
	  type:"POST",
	  url: "/api/add/photo",
	  data: {image_gif:gif,userId:userId},
	  success: function (response) {
	    document.getElementById('loader').style.display = 'none';
	    //document.getElementById('save').style.display = 'none';
	    document.getElementById('done').style.display = 'block';
	  }
	});
}

function submitId(){
	var netId = $('#netId').val()

	$.ajax({
	  type:"GET",
	  url: "/api/user/"+netId,
	  success: function (response) {
	  	if(response.status == 'failed'){
	  		document.getElementById('alertMsg').style.display = 'block';
	  		document.getElementById('welcome').style.zIndex ='0';
	  		return;
	  	}
	  	// set the id on the page
	  	document.getElementById('userId').setAttribute('data-userId', response.user.netId);
	  	// hide id field, show description field
	  	document.getElementById('netId').style.display = 'none';
	  	document.getElementById('alertMsg').style.display = 'none';
	  	document.getElementById('welcome').style.zIndex ='0';
	  	document.getElementById('desc-holder').style.top = '25%';
	  	document.getElementById('description-holder').style.display = 'block';
	  	document.getElementById('description').focus();
	  	document.getElementById('userName').innerHTML = 'Hi, ' + response.user.name.firstName + " " + response.user.name.lastName + "!";
	  	$('#description').val(response.user.location);
	  },
	  failure: function (response){
	  	document.getElementById('alertMsg').style.display = 'block';
	  }
	});	
}

function submitDescription (){

	var location = $('#description').val()
	var userDiv = document.getElementById('userId');
	var userId = userDiv.getAttribute('data-userId');

	if(location!=""){
		console.log("got here!");
		$.ajax({
		  type:"POST",
		  url: "/api/add/description",
		  data: {location:location,userId:userId},
		  success: function (response) {
		  	document.getElementById('welcome').style.display = 'none';
		  }
		});
	}
}

function preparePortraits(){

		var data = $.getJSON( "/api/get/users/4", function( data ) {
			var students = data.students;
			for(var i =0; i<students.length; i++){
				if(data.students[i] != null){
					var photo = data.students[i].photo;
					var gif = $("#portrait"+i).find(".small-portrait");
					gif.attr( "src", photo);
				}
			}	

		});	
}