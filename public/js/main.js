function init() {

	var videoContainer = document.getElementById('video');
	var gifContainer = document.getElementById('gifContainer');
	var videoWidth= 0, videoHeight = 0;
	var videoElement;
	var shooter;

	window.addEventListener('resize', onResize);
	document.getElementById('capture').addEventListener('click', startGifCapture);
	document.getElementById('save').addEventListener('click', postGif);
	document.getElementById('reRecord').addEventListener('click',reStart); 
	document.getElementById('done').addEventListener('click',reLoad); 

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
			document.getElementById('capture').style.backgroundColor = "#e74c3c";
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
		document.getElementById('loader').style.display = 'none';	
		document.getElementById('gifContainer').style.display = "block";
		document.getElementById('video').style.display = "none";
		document.getElementById('save').style.display = "block";
		document.getElementById('reRecord').style.display = "block";
		document.getElementById('capture').style.display = "none";

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
	document.getElementById('save').style.display = "none";
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
	document.getElementById('loader').style.display = 'block';

	var gif = $('#generatedGif').attr('src');
	var userDiv = document.getElementById('userId');
	var userId = userDiv.getAttribute('data-userId');

	$.ajax({
	  type:"POST",
	  url: "/add",
	  data: {image_gif:gif,userId:userId},
	  success: function (response) {
	    document.getElementById('loader').style.display = 'none';
	    document.getElementById('save').style.display = 'none';
	    document.getElementById('done').style.display = 'block';
	  }
	});
}