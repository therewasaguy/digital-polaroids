// following this example
// https://github.com/TooTallNate/node-lame/blob/master/examples/wav2mp3.js

var fs = require('fs');
var lame = require('lame');
var wav = require('wav');

var input, output, reader;
var wavPath, mp3Path;

exports.convert = function(_wavPath) {
	// read file
	wavPath = _wavPath
	input = fs.createReadStream(wavPath);
	outfile = wavPath.split('.wav')[0] + '.mp3';
	mp3Path = fs.createWriteStream(outfile);

	// ... start reading the WAV file from the input
	reader = new wav.Reader();

	// ... we have to wait for the "format" event before we can start encoding
	reader.on('format', onFormat);
	// start transferring the data
	input.pipe(reader);

};


// delete wav
var deleteWav = function(wavPath) {
	fs.unlink(wavPath, function(e) {
		console.log('deleted ' + wavPath);
	});
};

// upload mp3 to server
var uploadMp3ToServer = function(_mp3Path) {
	
};

var onFormat = function(format) {
  console.error('WAV format: %j', format);

  // encoding the wave file into an MP3 is as simple as calling pipe()
  var encoder = new lame.Encoder(format);
  reader.pipe(encoder).pipe(mp3Path);

  deleteWav(wavPath);
  uploadMp3ToServer(mp3Path);
};