function initAudio() {

	var mediaRecorder;
	var stream;
	var audioContainer = document.getElementById('audio');
	var recordingTime = 1;// seconds

	// add event listners
	document.getElementById('recAudioStart').addEventListener('click', recordAudio); 

	window.navigator.getUserMedia( {'audio':true}, onMediaSuccess, onMediaError);

	window.prepareToRecordAudio = function() {
		document.getElementById('done').style.display = 'none';
		document.getElementById('reRecord').style.display = 'none';
		document.getElementById('recAudioStart').style.display = 'block';
	}

	function recordAudio() {
		mediaRecorder = new MediaStreamRecorder(stream);
		mediaRecorder.mimeType = 'audio/ogg';
		mediaRecorder.audioChannels = 1;
		document.getElementById('capture').style.pointerEvents = "none";
		document.getElementById('capture').innerHTML = "We're recording...";

		var counter = document.getElementById('counter');
		counter.style.display = 'block';
		var countValue = recordingTime;
		counter.innerHTML = countValue;

		// counter
		var theTimer = setInterval(function(){
			console.log('time');
			countValue = countValue - 0.1;
			counter.innerHTML = Math.ceil(countValue);
			document.getElementById('progressHolder').style.display = 'block';
			document.getElementById('progressBar').style.width = (100 - ( (countValue/recordingTime) *100).toString())+'%';
			if (countValue <= -0.5) {
				window.clearInterval(theTimer);
				stopRecordingAudio();
			}
		}, 100);

		document.getElementById('recAudioStart').style.display = 'none';

		mediaRecorder.ondataavailable = function(blob) {
			// POST / PUT "blob" using form data
			var blobURL = URL.createObjectURL(blob);
			audioEl.src = blobURL;
			audioEl.style.display = 'block';
			document.getElementById('counter').style.display = 'none';
			mediaRecorder.stop();

			// also upload the blob as data
			makeWavFromBlob(blob);
		};

		mediaRecorder.start( (recordingTime + 4000) * 1000);
	}

	// not currently in use
	function stopRecordingAudio() {
		document.getElementById('counter').style.display = 'none';
		mediaRecorder.stop();
	}

	function onMediaSuccess(_stream) {
		stream = _stream;
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
