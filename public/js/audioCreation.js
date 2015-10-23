var mediaRecorder;
var mediaStream, amp;


function initAudio() {

	var stream;
	var audioContainer = document.getElementById('audio');
	var maxRecordingTime = 7;// seconds
	var recordingStartedTime;
	var timerLoop, playbackVizLoop;

	// add event listners
	document.getElementById('recAudioStart').addEventListener('click', recordAudio); 
	document.getElementById('recAudioAgain').addEventListener('click', recordAudio); 
	document.getElementById('recAudioListen').addEventListener('click', playAudio);
	audioEl.onpause = function() {
		window.clearInterval(playbackVizLoop);
		playbackVizLoop = null;
			document.getElementById('level-meter').style.display = 'none';

	}

	window.navigator.getUserMedia( {'audio':true}, onMediaSuccess, onMediaError);

	window.prepareToRecordAudio = function() {
		document.getElementById('done').style.display = 'none';
		document.getElementById('reRecord').style.display = 'none';
		document.getElementById('homebase').style.display = 'none';
		document.getElementById('welcome').style.display = 'none';

		audioEl.style.display = 'none';
		document.getElementById('recAudioStart').style.display = 'block';
	}

	function recordAudio() {
		mediaRecorder = new MediaStreamRecorder(stream);
		mediaRecorder.mimeType = 'audio/ogg';
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

		mediaRecorder.ondataavailable = function(blob) {
			console.log('blob data');
			var audioBlob = blob;

			// upload the blob as data
			makeWavFromBlob(audioBlob);

			mediaRecorder.stop();

			// create audio element on the page for previewing
			var blobURL = URL.createObjectURL(audioBlob);
			onStopRecordingAudioCallback(blobURL);

		};

		recordingStartedTime = window.performance.now();
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
		console.log('hi');
		audioEl.src = blobURL;
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
			console.log(recPercentage);
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

	function postWav(soundBlob) {
		// document.getElementById('loader').style.display = 'block'
		// document.getElementById('help-text').innerHTML = "saving...";

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
}

window.addEventListener('DOMContentLoaded', initAudio);

// audio blob builder
// via http://stackoverflow.com/questions/15970729/appending-blob-data
// var MyBlobBuilder = function() {
//   this.parts = [];
// }

// MyBlobBuilder.prototype.append = function(part) {
//   this.parts.push(part);
//   this.blob = undefined; // Invalidate the blob
// };

// MyBlobBuilder.prototype.getBlob = function() {
//   if (typeof(this.blob) == 'undefined') {
//     this.blob = new Blob(this.parts, { type: "audio/ogg" });
//   }
//   return this.blob;
// };

// MyBlobBuilder.prototype.clear = function() {
// 	this.parts = [];
// 	this.blob = undefined;
// };

// var audioBlobBuilder = new MyBlobBuilder();
