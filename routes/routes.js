
/*
 * routes/routes.js
 * 
 * Routes contains the functions (callbacks) associated with request urls.
 */

var request = require('request'); // library to make requests to remote urls
var Q = require('q'); // library for javascript promises

var moment = require("moment"); // date manipulation library
var Person = require("../models/model.js"); //db model

var wav2mp3 = require('../wav2mp3.js');
var gif2webm = require('../gif2webm.js');

// S3 File dependencies
var fs = require('fs');
var http = require('http');
var AWS = require('aws-sdk');
var awsBucketName = process.env.AWS_BUCKET_NAME;
var s3Path = process.env.AWS_S3_PATH; // TODO - we shouldn't hard code the path, but get a temp URL dynamically using aws-sdk's getObject
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});
var s3 = new AWS.S3();

/*
	GET /
*/
exports.get12 = function(req, res) {
	
		var viewData = {
			pageTitle : "ITPortraits"
		}	
	res.render('12frame.html', viewData);

}

exports.get9 = function (req,res){
		var viewData = {
			pageTitle : "ITPortraits"
		}	
	res.render('9frame.html', viewData);
}

exports.add = function(req,res){
	console.log('adding a gif page');

	var viewData = {
		pageTitle: "Animated Portrait"
	}

	res.render('add.html',viewData);
}

exports.saveDescriptionToDb = function(req,res){

	var netId = req.body.userId;
	var location = req.body.location;
	var nickname = req.body.nickname;

  // now update the user
  Person.findOneAndUpdateQ({netId:netId}, { $set: {location:location, nickname:nickname}})
  .then(function(response){
    console.log('user updated! ' + response);
    res.json({status:'success'}); 
  })
  .fail(function (err) { 
  	console.log('error in updating user! ' + err)
  	res.json(err); 
  })
  .done();	

}

exports.savePhotoToDb = function(req,res){
	console.log('saving gif to db');

	var netId = req.body.userId;
	var filename = new Date().getTime().toString()+ '.gif' // for now, file name is just the time stamp
	var webmFilename = filename.split('.gif')[0] + '.webm' // for now, file name is just the time stamp
	var mimeType = 'movie/webm';
	var filepath = "temp/"+filename; // will write file to temp folder below
	var originalGif = req.body.image_gif;

	var webmSuccessCallback = function(webmFilepath) {
		// now, save that new file to Amazon S3
		// We first need to open and read the image into a buffer
		fs.readFile(webmFilepath, function(err, file_buffer){

			// save the file_buffer to our Amazon S3 Bucket
			var s3bucket = new AWS.S3({params: {Bucket: awsBucketName}});

			// Set the bucket object properties
			// Key == filename
			// Body == contents of file
		  // ACL == Should it be public? Private?
		  // ContentType == MimeType of file ie. image/jpeg.
		  var params = {
		    Key: webmFilename,
		    Body: file_buffer,
		    ACL: 'public-read',
		    ContentType: mimeType
		  };
		    
		  // Put the Object in the Bucket
		  s3bucket.putObject(params, function(err, data) {
		    if (err) {
		    	console.log(err)
	      } else {
					console.log("Successfully uploaded data to s3 bucket");

					// remove file from temp folder on the server cuz it's in s3 now
					wav2mp3.deleteFile(webmFilepath);

					// add or update user webm
					var dataToSave = {webm: process.env.AWS_S3_PATH + webmFilename};

					// // TODO - we shouldn't hard code the url like this, but instead should get a temp URL dynamically using aws-sdk
					// // i.e. every time there's a request, at that point we get the temp URL by requesting the filename
					// // see 'getObject' at http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html

					// now update the user
					Person.findOneAndUpdateQ({netId:netId}, { $set: dataToSave})
					.then(function(response){
					  console.log('user updated! ' + response);
					  res.json({status:'success', webm: dataToSave.webm}); 
					})
					.fail(function (err) { 
						console.log('error in updating user! ' + err)
						res.json(err); 
					})
					.done();
				}
			});
		});
	};


	// make it into a proper gif that we can save to db
	var base64Data = originalGif.replace(/^data:image\/gif;base64,/, "");
	fs.writeFile(filepath, base64Data, 'base64', function(err) {
		if (err && err != 'null') console.log(err);

		// convert to webm, then call the above callback
		gif2webm.convert(filepath, webmSuccessCallback);
	});
}


exports.saveAudioToDb = function(req, res) {
	console.log('saving audio to db');
	var netId = req.body.userId;

	wav2mp3.saveTempWav(req.body.soundBlob, function(tempFilePath) {

		wav2mp3.convert(tempFilePath, mp3SuccessCallback);

		res.send('got it!')
	}, function(error) {
		res.send('error uploading wav')
	});

	var mp3SuccessCallback = function(mp3Path) {
		console.log(mp3Path);
		var mp3Filename = mp3Path.split('/temp/')[1];
		var mimeType = 'audio/mpeg3';
		console.log(mp3Filename);

		// We first need to open and read the mp3 into a buffer
		fs.readFile(mp3Path, function(err, file_buffer) {
			console.log(file_buffer);

			// save the file_buffer to our Amazon S3 Bucket
			var s3bucket = new AWS.S3({params: {Bucket: awsBucketName}});

			var params = {
				Key: mp3Filename,
				Body: file_buffer,
				ACL: 'public-read',
				ContentType: mimeType
			};

			s3bucket.putObject(params, function(err, data) {
				if (err) {
					console.log(err)
				} else {
					console.log("Successfully uploaded data to s3 bucket: ", mp3Path);

					// remove file from temp folder on the server cuz it's in s3 now
					wav2mp3.deleteFile(mp3Path);

					var dataToSave = {audio: process.env.AWS_S3_PATH + mp3Filename};

					// update DB
					Person.findOneAndUpdateQ({netId:netId}, { $set: dataToSave})
					.then(function(response){
					  console.log('user updated! ' + response);
					  res.json({status:'success'}); 
					})
					.fail(function (err) { 
						console.log('error in updating user! ' + err)
						res.json(err); 
					})
					.done();
				}
			});
		});
	}
};

exports.getUser = function(req,res){
	var netId = req.param('id');

  Person.findOneQ({netId:netId})
  .then(function(response){
  	if (response == null) var dataToReturn = {status: 'failed'};
  	else {
	  	var dataToReturn = {
	  		user: response,
	  		status: 'success'
	  	}
	  }
    res.json(dataToReturn); 
  })
  .fail(function (err) { 
  	var dataToReturn = {
  		status: 'failed'
  	}
    res.json(dataToReturn);
  })
  .done();	
}

// gets the users and chooses 9 at random
// this works because the dataset is small. would need a better way to get random docs if a larger dataset
exports.getUsers = function(req,res){

	var requestNum = req.param('num');

	console.log('getting '+requestNum+' users');

	Person.findQ({
		// photo: {'$ne': '' },
		// year: {$gt: 2015 }})
		photo: {'$ne': '' }})
	.then(function(response){
		// choose 9 at random
		var ranNumArray = new Array();
		for(var i=0;i<requestNum;i++){
			ranNumArray.push(getRanNum());
		}

		// get a random number, ensuring there are no duplicates
		function getRanNum(){
			 // get a random number between 0 and the document array length 
			 var ranNum = Math.floor((Math.random() * response.length) + 0);
			 // if ranNum is already in the array of chosen numbers, getRanNum again
			 if (!response[ranNum] || response[ranNum] == 'null') getRanNum(); // if null, calls the function again
			 if (checkDuplicates(ranNum,ranNumArray)) getRanNum(); // if duplicated, calls the function again
			 if (!response[ranNum] || response[ranNum] == 'null') getRanNum(); // if null, calls the function again
			 else return ranNum;
		}	

		function checkDuplicates(num,arr){
			for(var i=0;i<arr.length;i++){
				if(num == arr[i]) {
					return true;
					break;
				}
			}
			return false;
		}

		// move on to returning the data
		var arrayToReturn = new Array();
		for(var i=0;i<requestNum;i++){
			arrayToReturn.push(response[ranNumArray[i]]);
		}
		var dataToReturn = {'students': arrayToReturn};
		//respond back with the data
  	res.json(dataToReturn);
  })
  .fail(function (err) { 
  	var dataToReturn = {status: 'failed'}
    res.json(dataToReturn);
  })
  .done();	
}

//// TESTING / UTILITY ROUTES - not used in production //

exports.addPhotos = function(req,res){

	var gifList = ['https://s3.amazonaws.com/digitalpolaroids/1414603562424.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414602635356.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414437551984.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414598776220.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414176903720.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414437380389.gif',
	'https://s3.amazonaws.com/digitalpolaroids/1414432816988.gif'];


	Person.find(function(err,data){

		for(var i=0;i<data.length;i++){
			var ranNum = Math.floor((Math.random() * (gifList.length)) + 0);
		  var dataToSave = {photo: gifList[ranNum],description: 'My name is '+data[i].name.firstName+' and this is just a random description for testing purposes!'};

		    Person.update({_id:data[i]._id},{$set: dataToSave}, function (err,data) {
		        if (err) {
		            console.log(err);
		        }
		        else {
		        	console.log(data);
		        }
			});
		}

		console.log('done');
	});

}

exports.updateInfo = function(req,res){

	Person.find(function(err,data){

		for(var i=0;i<data.length;i++){

				var dataToSave = {
					description: "",
					location: "",
					photo: ""
				}

		    Person.update({_id:data[i]._id},{$set: dataToSave}, function (err,data) {
		        if (err) {
		            console.log(err);
		        }
		        else {
		        	console.log(data);
		        }
			});
		}

		console.log('done');
	});

}

exports.getEmails = function(req,res){
	Person.find(function(err,data){

		var emailList;

		for(var i=0;i<data.length;i++){

			if (data[i].photo == "" || typeof(data[i].photo == 'undefined')) emailList += data[i].netId+"@nyu.edu,"
		}

		fs.writeFile('emails.csv', emailList, function (err) {
		  if (err) throw err;
		  console.log('It\'s saved!');
		});
	});

}

exports.createUsers = function(req,res){
	
	var csv = require('fast-csv');

	// var stream = fs.createReadStream("all-students-20141024.csv");
	// var stream = fs.createReadStream('test2.csv');
	// var stream = fs.createReadStream('allstudents2015-2016.csv');

	var csvStream = csv()
    .on("data", function(data){
         var netId = data[0];
         var firstName = data[1];
         var lastName = data[2];
         var year = data[3];

         var dataToSave = {
         	netId: netId,
         	name: {firstName: firstName, lastName: lastName},
         	year: year
         }

         var person = Person(dataToSave);

         Person.find({netId: netId}, function(err, data) {
					if (data.length == 0) {
						// save the person to db
						person.saveQ()
						.then(function (response){ 
							console.log(response);
						 })
						 .fail(function (err) { console.log(err); })
						 .done();
					}
				});
		})
		.on("end", function(){
			console.log("done");
    });

    stream.pipe(csvStream);
};

exports.getAllUsers = function(req, res) {
	Person.find(function(err, data) {
		res.send(data);
	});
}

// run this one time to convert all the gifs to webm
exports.convertAllGifToWebm = function(req, res) {
	// get all users from the database
	var users = [];
	var toConvert = [];
	Person.find(function(err, data) {
		if (err) throw err;
		console.log('got ' + data.length + ' users!');
		users = data;

		// for every user...
		for (var i = 0; i < users.length; i++) {
			var u = users[i];

			// if user has a .gif but not a .webm...
			if ( u.photo.length > 0 && u.photo.indexOf('.gif') > -1 && typeof(u.webm == 'undefined')) {
				toConvert.push(u);

				var gifWebPath = u.photo.replace('https', 'http');
				var gifName = gifWebPath.split('digitalpolaroids/')[1];
				var tempGifPath = 'temp/'+gifName;
				var webmFilename = 	tempGifPath.split('.gif')[0] + '.webm' // for now, file name is just the time stamp
				var mimeType = 'movie/webm';
				var netId = u.netId;

				// TO DO: remember netId (or use gif path to lookup?)

				// download method via http://stackoverflow.com/a/22907134/2994108
				var download = function(url, dest, uNetId, cb) {
				  var file = fs.createWriteStream(dest);
				  var request = http.get(url, function(response) {
				    response.pipe(file);
				    file.on('finish', function() {
				      file.close(function() {
				      	cb(dest, uNetId);
				      });  // close() is async, call cb after close completes.
				    });
				  }).on('error', function(err) { // Handle errors
				    fs.unlink(dest); // Delete the file async. (But we don't check the result)
				    if (cb) cb(err.message);
				  });
				};

				// same webmSuccessCallback as above...
				var webmSuccessCallback = function(webmFilepath, _netID) {
					fs.readFile(webmFilepath, function(err, file_buffer){

						// save the file_buffer to our Amazon S3 Bucket
						var s3bucket = new AWS.S3({params: {Bucket: awsBucketName}});
					  var params = {
					    Key: webmFilepath,
					    Body: file_buffer,
					    ACL: 'public-read',
					    ContentType: mimeType
					  };
					    
					  // Put the Object in the Bucket
					  s3bucket.putObject(params, function(err, data) {
					    if (err) {
					    	console.log(err)
				      } else {
								console.log("Successfully uploaded data to s3 bucket");

								// remove file from temp folder on the server cuz it's in s3 now
								wav2mp3.deleteFile(webmFilepath);

								// add or update user webm
								var dataToSave = {webm: process.env.AWS_S3_PATH + webmFilepath};

								// // TODO - we shouldn't hard code the url like this, but instead should get a temp URL dynamically using aws-sdk
								// // i.e. every time there's a request, at that point we get the temp URL by requesting the filename
								// // see 'getObject' at http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html

								// now update the user
								Person.findOneAndUpdateQ({netId:_netID}, { $set: dataToSave})
								.then(function(response){
								  console.log('user updated! ' + response);
								  res.json({status:'success'}); 
								})
								.fail(function (err) { 
									console.log('error in updating user! ' + err)
									res.json(err); 
								})
								.done();
							}
						});
					});
				};


				// download & save the gif locally
				download(gifWebPath, tempGifPath, netId, function(savedGifPath, uNetId) {
					console.log('finished downlaoding ' + savedGifPath);
					console.log('uNedId: ' + uNetId);

					// convert gif to webm,
					// upload webm to aws &
					// save webm path to database
					gif2webm.convert(savedGifPath, function(wpath){
						console.log(wpath);
						webmSuccessCallback(wpath, uNetId)
					});

					// delete gif
					// fs.unlink(tempGifPath);
				});
			}
		}

		console.log('users: ' + users.length + ' To convert: ' + toConvert.length);

	});
}
