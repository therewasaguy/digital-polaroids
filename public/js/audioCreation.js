var mediaRecorder;
var mediaStream, amp;
var audioPermissionGranted = false;

function initAudio() {

	var stream;
	var audioContainer = document.getElementById('audio');
	var maxRecordingTime = 7;// seconds
	var recordingStartedTime;
	var timerLoop, playbackVizLoop;

	// --> audioPermissionGranted (will not fire in FireFox and so we can call it again later)
	window.navigator.getUserMedia( {'audio':true, 'video': false}, onMediaSuccess, onMediaError);


	// add event listners
	document.getElementById('recAudioStart').addEventListener('click', recordAudio); 
	document.getElementById('recAudioAgain').addEventListener('click', recordAudio); 
	document.getElementById('recAudioListen').addEventListener('click', playAudio);
	document.getElementById('recAudioSave').addEventListener('click', endAudioSession);

	audioEl.onpause = function() {
		window.clearInterval(playbackVizLoop);
		playbackVizLoop = null;
			document.getElementById('level-meter').style.display = 'none';

	}


	window.prepareToRecordAudio = function() {

		if (!audioPermissionGranted) {
			window.navigator.getUserMedia( {'audio':true, 'video': false}, onMediaSuccess, onMediaError);
		}

		document.getElementById('done').style.display = 'none';
		document.getElementById('reRecord').style.display = 'none';
		document.getElementById('homebase').style.display = 'none';
		document.getElementById('welcome').style.display = 'none';

		document.getElementById('video-cover').className = 'cover-vid';

		audioEl.style.display = 'none';
		document.getElementById('recAudioStart').style.display = 'block';
	}

	function recordAudio() {
		console.log('rec audio!');
		mediaRecorder = new MediaStreamRecorder(stream);
		mediaRecorder.mimeType = 'audio/wav';
		mediaRecorder.audioChannels = 1;
		// document.getElementById('capture').style.pointerEvents = "none";
		document.getElementById('capture').style.display = "none";
		document.getElementById('recAudioAgain').style.display = "none";
		document.getElementById('recAudioListen').style.display = "none";

		document.getElementById('recAudioStop').style.display = "block";
		document.getElementById('recAudioStop').innerHTML = "Recording... (click to stop)";
		document.getElementById('recAudioStop').addEventListener('click', stopRecordingAudio);

		document.getElementById('recAudioStart').style.display = 'none';

		audioEl.pause();

		recordingStartedTime = window.performance.now();

		// mediaRecorder.onstop = function(e) {
		// 	console.log(mediaRecorder.stream);
		// }
		// 
		mediaRecorder.ondataavailable = function(blob) {
			var audioBlob = blob;

			// TO DO: (for Firefox)
			// if blob is .ogg, save it as-is, but if .wav, convert it

			// upload the blob as data
			makeWavFromBlob(audioBlob);

			// create audio element on the page for previewing
			var blobURL = URL.createObjectURL(audioBlob);
			onStopRecordingAudioCallback(blobURL);
		};

		mediaRecorder.start( (maxRecordingTime + 4000) * 1000 );
		startTimer();
	}

	// not currently in use
	function stopRecordingAudio() {
		console.log('stop recording audio!');
		window.clearInterval(timerLoop);

		// add new buttons
		mediaRecorder.stop();
	}

	// callback to change the view once audio has been recorded
	function onStopRecordingAudioCallback(blobURL) {

		// store the audio in three places (which are redundant / unnecessary?)
		var audioPlayer = document.getElementById('audioPlayer');
		audioPlayer.src = blobURL;
		var userDiv = document.getElementById('userId');
		userDiv.setAttribute('data-userAudio', blobURL);
		audioEl.src = blobURL;

		setUserAudioOnPage(blobURL);
		// audioEl.style.display = 'block';

		// hide buttons and stuff
		document.getElementById('progressHolder').style.display = 'none';
		document.getElementById('recAudioStop').style.display = 'none';
		document.getElementById('counter').style.display = 'none';
		document.getElementById('level-meter').style.display = 'none';
		document.getElementById('recAudioStart').style.display = 'none';

		// show preview, re-record and save buttons
		document.getElementById('recAudioListen').style.display = 'block';
		document.getElementById('recAudioAgain').style.display = 'block';
		document.getElementById('recAudioSave').style.display = 'block';

	}

	function playAudio() {
		audioEl.currentTime = 0;
		audioEl.play();

		if (!playbackVizLoop) {
			// show meter
			document.getElementById('level-meter').style.display = 'block';
			// set loop to update volume meter
			playbackVizLoop = setInterval(function(){
				document.getElementById('level-meter').style.height = (amp.getLevel() * 100).toString()+'%';
				console.log('playback viz');
			}, 60);
		}

	}

	// connect input audio stream to measure amplitude
	function onMediaSuccess(_stream) {
		audioPermissionGranted = true;

		stream = _stream;
		amp = new p5.Amplitude();
		mediaStream = amp.audiocontext.createMediaStreamSource(stream);
		mediaStream.connect(amp.input);

		var audioElNode = amp.audiocontext.createMediaElementSource(audioEl);
		audioElNode.connect(amp.input);
		audioElNode.connect(amp.audiocontext.destination);
	}

	function onMediaError(e) {
		console.log('media error', e);
	}

	// converts blob to base64
	function makeWavFromBlob(blob) {
		var reader = new FileReader();

		reader.onloadend = function(evt) {
			var dataUrl = reader.result;
			var base64 = dataUrl.split(',')[1];

			// upload the blob
			postWav(base64);
		};
		console.log(blob);
		reader.readAsDataURL(blob);

		// blobToBase64(blobURL, postWav)
	}

	function startTimer() {
		var counter = document.getElementById('counter');
		counter.style.display = 'block';
		var countValue = maxRecordingTime;
		counter.innerHTML = countValue;

		// counter loop
		timerLoop = setInterval(function(){
			var elapsedTime = (window.performance.now() - recordingStartedTime) / 1000;
			var recPercentage = elapsedTime / maxRecordingTime * 100;
			// console.log(recPercentage);
			// countValue = countValue - 0.1;
			counter.innerHTML = Math.floor(elapsedTime*10) / 10;

			document.getElementById('level-meter').style.display = 'block';
			document.getElementById('level-meter').style.height = (amp.getLevel() * 100).toString()+'%';

			document.getElementById('progressHolder').style.display = 'block';
			document.getElementById('progressBar').style.width = recPercentage.toString()+'%';
			if ( Number(counter.innerHTML) > maxRecordingTime) {
				stopRecordingAudio();
			}
		}, 60);
	}

	// save the user audio url so we can hear it later. Also saved as audioEl.src
	function setUserAudioOnPage(audioBlob) {
		var userDiv = document.getElementById('userId');
		userDiv.setAttribute('data-userAudio', audioBlob);
		console.log('set user audio');
	}

	function postWav(soundBlob) {
		var userDiv = document.getElementById('userId');
		var userId = userDiv.getAttribute('data-userId');

		$.ajax({
			type: 'POST',
			// url: '/uploadwav',
			url: 'api/add/audio',
			data: {soundBlob:soundBlob,userId:userId}
		}).done(function(data) {
			console.log(data);
		});

	}


	// take user to homebase and hide other buttons
	function endAudioSession() {
		document.getElementById('video-cover').className = '';
		viewLoadHomeBase();
	}

}


window.addEventListener('DOMContentLoaded', initAudio);