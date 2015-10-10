// following this example
// https://github.com/TooTallNate/node-lame/blob/master/examples/wav2mp3.js

var fs = require('fs');
var lame = require('lame');
var wav = require('wav');

var input, output, reader;
var wavPath, mp3Path;

exports.convert = function(_wavPath, successCallback) {
	// read file
	wavPath = _wavPath
	mp3Path = wavPath.split('.wav')[0] + '.mp3';

	input = fs.createReadStream(wavPath);
	outfile = fs.createWriteStream(mp3Path);

	// ... start reading the WAV file from the input
	reader = new wav.Reader();

	// ... we have to wait for the "format" event before we can start encoding
	reader.on('format', function(format) {
		console.error('WAV format: %j', format);

		// encoding the wave file into an MP3 is as simple as calling pipe()
		var encoder = new lame.Encoder(format);
		reader.pipe(encoder).pipe(outfile).on('finish', function() {
			console.log('FINISH MP3');
			successCallback(mp3Path);
		});

		exports.deleteFile(wavPath);
	});

	// start transferring the data
	input.pipe(reader);

};


// delete a file (.wav or .gif or anything) from server temp folder
exports.deleteFile = function(wavPath) {
	fs.unlink(wavPath, function(e) {
		console.log('deleted ' + wavPath);
	});
};


// save .wav file to server in a temp folder
exports.saveTempWav = function(blob, doSuccess, doError) {
  var buf = new Buffer(blob, 'base64'); // decode
  var tempFileName = new Date().getTime() + '_' + Math.round(Math.random() * 900000);
  var tempFilePath = "./temp/" + tempFileName + ".wav";
  console.log('path', tempFilePath);

  fs.writeFile(tempFilePath, buf, function(err) {
    if(err) {
      doError(err);
    } else {
      doSuccess(tempFilePath);
    }
  });
};
