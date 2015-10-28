function init() {

	detectBrowser();

	//preparePortraits();

	var videoContainer = document.getElementById('video');
	var gifContainer = document.getElementById('gifContainer');
	var videoWidth= 0, videoHeight = 0;
	var videoElement;
	var shooter;

	// add event listners
	window.addEventListener('resize', onResize);
	document.getElementById('capture').addEventListener('click', startGifCapture);

	// --> for testing
	// document.getElementById('capture').addEventListener('click', prepareToRecordAudio);

	document.getElementById('home-rec-gif').addEventListener('click', prepareToRecordGif);
	document.getElementById('home-rec-audio').addEventListener('click', prepareToRecordAudio);


	//document.getElementById('save').addEventListener('click', postGif);
	document.getElementById('reRecord').addEventListener('click',reStart); 
	document.getElementById('done').addEventListener('click', doneMakingGif); 
	document.getElementById('netId').addEventListener('change', submitId);
	document.getElementById('descButton').addEventListener('click',submitDescription);

	document.getElementById('homebase-name').addEventListener('click', function() {
		console.log('clicked hb!');
		viewLoadDescription();
	});

	GumHelper.startVideoStreaming(function(error, stream, videoEl, width, height) {
		if(error) {
			//alert('Cannot open the camera. Maybe allow the camera or refresh the page? ' + error.message);
			return;
		}

		document.getElementById('webcam-alert').style.display = "none";
		document.getElementById('capture').style.display = "none";

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
			// console.log(progress);
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
  	document.getElementById('capture').style.display = "none";

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
	  	var webmPath = response.webm;
	  	userDiv.setAttribute('data-userPortrait', webmPath);
	    document.getElementById('loader').style.display = 'none';
	    //document.getElementById('save').style.display = 'none';
	    document.getElementById('done').style.display = 'block';
	  }
	});
}

function submitId(){
	var netId = $('#netId').val();

	$.ajax({
		type:"GET",
		url: "/api/user/"+netId,
		success: function (response) {
			if(response.status == 'failed'){
				document.getElementById('alertMsg').style.display = 'block';
				document.getElementById('welcome').style.zIndex ='0';
				return;
			}
			var portrait = response.user.webm || '';
			var audioPron = response.user.audio || '';
			var userLoc = response.user.location;
			var nickname = response.user.nickname;

			console.log(portrait)

			// assign user data to a div's data-attributes on the page
			var userDiv = document.getElementById('userId');
			userDiv.setAttribute('data-userId', response.user.netId);
			userDiv.setAttribute('data-user-loc', response.user.location);
			userDiv.setAttribute('data-userAudio', audioPron);
			userDiv.setAttribute('data-userPortrait', portrait);
			userDiv.setAttribute('data-userNickname', response.user.nickname || '');
			userDiv.setAttribute('data-userFirst', response.user.name.firstName);
			userDiv.setAttribute('data-userLast', response.user.name.lastName);

			// direct user to fill out any missing info:

			// if user has no location
			if (typeof(userLoc) == 'undefined' || userLoc.length == 0) {
				viewLoadDescription(response.user);
			}

			// if user has location but no nickname
			else if (typeof(nickname) == 'undefined' || nickname.length == 0) {
				viewLoadNickname(response.user);
			}

			// if user has portrait but no audio
			else if ( (typeof(portrait) !== 'undefined' || portrait.indexOf('webm') > -1) && typeof(audioPron) == 'undefined' || audioPron.indexOf('mp3') == -1) {
				console.log('user has portrait but no audio');
				// prepareToRecordAudio();
				viewLoadHomeBase();
			}

			// if user has portrait and audio
			else  {
				console.log('user has portrait and audio');
				viewLoadHomeBase();
			}

		},
		failure: function (response){
			document.getElementById('alertMsg').style.display = 'block';
		}
	});	
}

// load the view to get user's location and nickname
function viewLoadDescription(user) {
	var userDiv = document.getElementById('userId');

	var firstName = typeof(user) != 'undefined' ? user.name.firstName : userDiv.getAttribute('data-userfirst');
	var lastName = typeof(user) != 'undefined' ? user.name.lastName : userDiv.getAttribute('data-userlast');
	var nickname = typeof(user) != 'undefined' ? user.nickname : userDiv.getAttribute('data-usernickname');
	var location = typeof(user) != 'undefined' ? user.location : userDiv.getAttribute('data-user-loc');


	// hide id field, show description field
	document.getElementById('homebase').style.display = 'none';
	document.getElementById('netId').style.display = 'none';
	document.getElementById('alertMsg').style.display = 'none';
	document.getElementById('welcome').style.zIndex ='0';
	document.getElementById('desc-holder').style.top = '5%';
	document.getElementById('description-holder').style.display = 'block';
	document.getElementById('description').focus();
	document.getElementById('userName').innerHTML = 'Hi, ' + firstName + " " + lastName + "!";
	$('#description').val(location);
	$('#nickname').val(nickname);
}

function viewLoadNickname(user) {
	document.getElementById('netId').style.display = 'none';
	document.getElementById('alertMsg').style.display = 'none';
	document.getElementById('welcome').style.zIndex ='0';
	document.getElementById('desc-holder').style.top = '5%';
	document.getElementById('description-holder').style.display = 'block';
	document.getElementById('description').style.display = 'none';
	document.getElementById('locBlurb').style.display = 'none';
	document.getElementById('userName').innerHTML = 'Hi, ' + user.name.firstName + " " + user.name.lastName + "!";
	$('#description').val(user.location);
	$('#nickname').val(user.nickname);

	// to do: change what the next button does

}

// on GIF completion take user to homebase or to record audio
function doneMakingGif() {
	var audioPron = document.getElementById('userId').getAttribute('data-userAudio');
	if (audioPron.indexOf('mp3') == -1) {
		prepareToRecordAudio();
	} else {
		viewLoadHomeBase();
	}

}

function prepareToRecordGif() {
	document.getElementById('done').style.display = 'none';
	document.getElementById('reRecord').style.display = 'none';
	document.getElementById('homebase').style.display = 'none';
	document.getElementById('welcome').style.display = 'none';

	document.getElementById('capture').style.display = "block";

}

// when user location is submitted
function submitDescription (){

	var loc = $('#description').val();
	var nickname = $('#nickname').val();

	var userDiv = document.getElementById('userId');
	var userId = userDiv.getAttribute('data-userId');
	var userAudio = userDiv.getAttribute('data-userAudio');
	var userPortrait = userDiv.getAttribute('data-userPortrait');

	var hasWebM = false;

	if (userPortrait.indexOf('webm') > 0) {
		console.log('user has webm');
		hasWebM = true;
	} else {console.log('user needs webm')}

	if (userAudio.indexOf('mp3') > 0) {
		console.log('user has audio');
	} else {console.log('user needs audio')}

	if(loc!=""){
		$.ajax({
			type:"POST",
			url: "/api/add/description",
			data: {
				location:loc,
				userId:userId,
				nickname: nickname
			},
			success: function (response) {
				document.getElementById('welcome').style.display = 'none';
				
				if (hasWebM) {
					viewLoadHomeBase();
				} else {
					document.getElementById('capture').style.display = "block";
				}

			}
		});
	} else {
		var pHolder = $('#description')[0].placeholder;
		if ( pHolder.indexOf("From") > -1) {
			$('#description')[0].placeholder = "Straight outta ... ?";
		} else {
			$('#description')[0].placeholder += '?';
		}
	}
}

function viewLoadHomeBase() {
	document.getElementById('recAudioAgain').style.display = 'none';
	document.getElementById('recAudioListen').style.display = 'none';
	document.getElementById('recAudioSave').style.display = 'none';
	document.getElementById('done').style.display = 'none';
	document.getElementById('reRecord').style.display = 'none';


	document.getElementById('homebase').style.display = 'block';

	// Check if user has audio / video and fill in spans accordingly
	var userDiv = document.getElementById('userId');
	var audioPron = userDiv.getAttribute('data-userAudio');
	var portrait = userDiv.getAttribute('data-userPortrait');
	var audioPlayer = document.getElementById('audioPlayer');
	var videoPlayer = document.getElementById('videoPlayer');
	var name = userDiv.getAttribute('data-usernickname').length > 0 ? userDiv.getAttribute('data-usernickname') : userDiv.getAttribute('data-userfirst')

	document.addEventListener('click', function() {
		if (videoPlayer.className.indexOf('video-sm') == -1) {
			videoPlayer.className = 'video-sm';
		}
	});

	document.getElementById('homebase-name').textContent = name;

	// if user has audio...
	if (audioPron.indexOf('mp3') > -1) {
		audioPlayer.src = audioPron

		// if we havent already set event listeners...
		if (document.getElementById('hasAudio').innerText != 'got') {
			document.getElementById('hasAudio').innerText = 'got';

			var listenButton = 	document.getElementById('listenAgain');
			listenButton.style.display = 'block';
			listenButton.addEventListener('click', function() {
				audioPlayer.play();
			});

			document.getElementById('audioIcon').addEventListener('click', function() {
				audioPlayer.play();
			});
		}
	}

	// if user has video...
	if (portrait.indexOf('webm') > -1) {
		videoPlayer.src = portrait;

		// if we havent already set event listeners...
		if (document.getElementById('hasVideo').innerText != 'got') {
			document.getElementById('hasVideo').innerText = 'got';
			var viewButton = 	document.getElementById('viewAgain');
			viewButton.style.display = 'block';
			viewButton.addEventListener('click', function(e) {
				if (videoPlayer.className.indexOf('video-big') == -1) {
					videoPlayer.className = 'video-big';
				} else if ( videoPlayer.className.indexOf('video-sm') == -1) {
						videoPlayer.className = 'video-sm';
				}
				e.stopPropagation();
				e.preventDefault();
			});
		}

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

function detectBrowser() {
	var browser = null;

	var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

	    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)

	var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+

	var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
	    // At least Safari 3+: "[object HTMLElementConstructor]"

	var isChrome = !!window.chrome && !isOpera;              // Chrome 1+

	var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

	var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);

	function getAndroidVersion(ua) {
	    ua = (ua || navigator.userAgent).toLowerCase(); 
	    var match = ua.match(/android\s([0-9\.]*)/);
	    return match ? match[1] : false;
	};

	var isAndroidVersion = getAndroidVersion();

	// console.log('opera', isOpera);
	// console.log('chrome', isChrome);
	// console.log('IE', isIE);
	// console.log('FF', isFirefox);
	// console.log('Safari', isSafari);

	if (!isOpera && !isChrome && !isFirefox) {
		var browserName = 'Your browser';
		if (isIE) browserName = 'Internet Explorer';
		if (isSafari) browserName = 'Safari';
		if (isIOS) browserName = 'iOS'
		if (isAndroidVersion) && (parseFloat(isAndroidVersion) < 5) {
			alert('This app is not compatible with Android version ' + isAndroidVersion +'. Please try again in a different browser. Well-supported browsers include desktop Chrome, Firefox, Opera. ')
		} else {
			alert(browserName + ' does not allow access to the camera and microphone. Please try again in a different browser. Well-supported browsers include desktop Chrome, Firefox, Opera.')
		}
	}
}