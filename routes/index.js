
/*
 * routes/index.js
 * 
 * Routes contains the functions (callbacks) associated with request urls.
 */

var request = require('request'); // library to make requests to remote urls

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
		var templateData = {
			people : data,
			pageTitle : "Some Title"
		}

		res.render('index.html', templateData);

	});

}