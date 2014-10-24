
/*
 * routes/routes.js
 * 
 * Routes contains the functions (callbacks) associated with request urls.
 */

var request = require('request'); // library to make requests to remote urls
var Q = require('q'); // library for javascript promises

var moment = require("moment"); // date manipulation library
var Person = require("../models/model.js"); //db model

// S3 File dependencies
var fs = require('fs');
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
exports.index = function(req, res) {
	
	console.log("main page requested");

	// query for all people in the db, return their name and slug
	Person.find({}, 'name slug', function(err, data){

		if (err) {
			res.send("Unable to query database for people").status(500);
		};

		console.log("retrieved " + data.length + " people from database");

		//build and render template
		var viewData = {
			people : data,
			pageTitle : "Some Title"
		}

		res.render('index.html', viewData);

	});

}

exports.add = function(req,res){
	console.log('adding a gif page');

	var viewData = {
		pageTitle: "Animated Portrait"
	}

	res.render('add.html',viewData);
}

exports.savePhotoToDb = function(req,res){
	console.log('saving gif to db');

	var netId = req.body.userId;
	var filename = new Date().getTime().toString()+ '.gif' // for now, file name is just the time stamp
	var mimeType = 'image/gif';
	var filepath = "tmp/"+filename; // will write file to tmp folder below
	var originalGif = req.body.image_gif;

	// make it into a proper gif that we can save to db
	var base64Data = originalGif.replace(/^data:image\/gif;base64,/, "");
	require("fs").writeFile(filepath, base64Data, 'base64', function(err) {
	  if (err && err != 'null') console.log(err);
	  // now, save that new file to Amazon S3
	  // We first need to open and read the image into a buffer
	  fs.readFile(filepath, function(err, file_buffer){

	  // save the file_buffer to our Amazon S3 Bucket
	  	var s3bucket = new AWS.S3({params: {Bucket: awsBucketName}});

	  	// Set the bucket object properties
	  	// Key == filename
	  	// Body == contents of file
	    // ACL == Should it be public? Private?
	    // ContentType == MimeType of file ie. image/jpeg.
	    var params = {
	      Key: filename,
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

	          // add or update user image
	          var dataToSave = {photo: process.env.AWS_S3_PATH + filename};

	          // // TODO - we shouldn't hard code the url like this, but instead should get a temp URL dynamically using aws-sdk
	          // // i.e. every time there's a request, at that point we get the temp URL by requesting the filename
	          // // see 'getObject' at http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html

	          // now update the user
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
	});
}

exports.createUsers = function(req,res){
	
	var csv = require('fast-csv');

	var stream = fs.createReadStream("all-students-20141024.csv");

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

         // save the person to db
         person.saveQ()
		 .then(function (response){ 
		 	console.log(response);
		  })
		  .fail(function (err) { console.log(err); })
		  .done();         
    })
    .on("end", function(){
         console.log("done");
    });

    stream.pipe(csvStream);

}