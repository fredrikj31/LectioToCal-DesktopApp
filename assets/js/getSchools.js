// Packages
var fs = require("fs");

// Schools Select Load
var contents = fs.readFileSync("./assets/data/skoler.json");
var jsonContent = JSON.parse(contents);
var selectElem = document.getElementById("schoolId");

for (var i = 0; i < jsonContent.length; i++) {
	var obj = jsonContent[i];
	var option = document.createElement("option");

	option.text = obj.Navn;
	option.value = obj.Nummer;
	selectElem.add(option);
}