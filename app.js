var config = require('./config');
var fs = require('fs');
var express = require('express');
var fileUpload = require('express-fileupload');
var axios = require('axios');

var app = express();
app.use(fileUpload());

app.get('/', function(req, res){

    res.sendFile(__dirname + "/test.html");

})

app.post('/upload', function(req, res){
    if (!req.files)
        return res.status(400).send('No files were uploaded.');
	
	var keywords;

	axios.post("https://vision.googleapis.com/v1p3beta1/images:annotate?key=" + config.key, {
		"requests": [
			{
			"image": {
					"content": req.files.image.data.toString('base64')
			},
			"features": [
				{
				"type": "LABEL_DETECTION"
				}
			]
			}
		]
	}).then(function(response) {
		keywords = response.data.responses[0].labelAnnotations.map(item =>{
			return{
				description: item.description,
				score: item.score
			}
		});
	});

    axios.post("https://vision.googleapis.com/v1p3beta1/images:annotate?key=" + config.key, {
        "requests": [
          {
            "image": {
                  "content": req.files.image.data.toString('base64')
            },
            "features": [
              {
                "type": "TEXT_DETECTION"
              }
            ]
          }
        ]
    }).then(function(response) {
        console.log(response.data.responses[0].textAnnotations[0].description.match(/\d\w?\. ([a-zA-Z0-9-]+)?/gm));

        var fullText = response.data.responses[0].textAnnotations[0].description;

        if(fullText.includes("DRIVER LICENCE") && fullText.includes("NEW ZEALAND")){
            var id = {};
            fullText.match(/\d\w?\. ([a-zA-Z0-9-]+)?/gm).forEach(element => {
            	var line = element.split('. ');
            	id[line[0]]= line[1];
			});
			id["keywords"] = keywords;
        	console.log(id);
        	console.log(id["4b"]);
        	console.log(fullText);
			// \d\w?\. ([a-zA-Z0-9-]+)?
			//console.log(typeof response.data);
			//console.log(JSON.stringify(response.data));
			res.send("<pre>" + JSON.stringify(id,null,4) + "</pre>");
		} else if(fullText.includes("PASSPORT") && fullText.includes("NEW ZEALAND")) {
			var id = {};
			id["keywords"] = keywords;
			var passNumIndex = response.data.responses[0].textAnnotations.findIndex(function(item){
				return item.description=="Uruwhenua" ;
			});
			id["passportNumber"] = response.data.responses[0].textAnnotations[passNumIndex+1].description;
			res.send("<pre>" + JSON.stringify(id,null,4) + "</pre>");
			//res.send("<pre>" + JSON.stringify(response.data.responses[0].textAnnotations,null,4) + "</pre>");
		} else {
			res.send("Document not supported");
		}
			
		});

    //console.log(req.files.image.data.toString('base64'));
    //console.log(base64Encode(req.files.image.data));

})

app.listen(3000);

function base64Encode(file) {
    var body = fs.readFileSync(file);
    return body.toString('base64');
}


var base64String = base64Encode('ID2.jpg');
fs.writeFile("results.txt",base64String);
