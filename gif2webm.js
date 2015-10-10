/**
 *  module for converting .gif to .webm
 *
 *  similar to wav2mp3.js
 */

var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var wav2mp3 = require('./wav2mp3.js');

// convert from gif to webm
// https://dzone.com/articles/execute-unix-command-nodejs
// https://gist.github.com/ndarville/10010916
// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/274
// ffmpeg -i your_gif.gif -c:v libvpx -crf 12 -b:v 500K output.webm
// ffmpeg -i input.mp4 -c:v libvpx -qmin 0 -qmax 50 -crf 5 -b:v 1M -c:a libvorbis output.webm
exports.convert = function(filepath, successCallback) {
	var newFilePath = filepath.split('.gif')[0] + '.webm';
	new ffmpeg({ source: filepath })
		.withVideoCodec('libvpx')
		.withVideoBitrate(500)
		.saveToFile(newFilePath)
		.on('error', function() {
			console.log('Error converting to webm !');
		})
		.on('end', function() {
			successCallback(newFilePath);
			wav2mp3.deleteFile(filepath);
			console.log('Success converting to webm !');
		});
};