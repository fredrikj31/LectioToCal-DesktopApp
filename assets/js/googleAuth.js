// Packages
var fs = require("fs");
var electron = require("electron").remote;
// For google calendar sync
var { google } = require("googleapis");
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
var oAuth2Client;

//Default location for folder
var defaultLocation = electron.app.getPath("documents");

// Check File
function checkTokenFile() {
	fs.exists(defaultLocation + "\\LectioToCal\\token.json", function (exists) {
		//console.log("file exists = " + exists);
		if (exists == false) {
			document.getElementById("connectCalendar").style.display = "block";
		} else {
			document.getElementById("loginForm").style.display = "block";
		}
	});
}

// Overall function to link calendar
function linkCalendar() {
	// Getting the client secret
	fs.readFile("./assets/data/credentials.json", (err, content) => {
		if (err) return console.log("Error loading client secret file:", err);
		// Authorize a client with credentials, then call the Google Calendar API.
		console.log("JSON" + JSON.parse(content))
		authorize(JSON.parse(content));
	});
	var linkCalendarHTML = document.getElementById("connectCalendar");
	var confirmCode = document.getElementById("codeForm");
	linkCalendarHTML.style.display = "none";
	confirmCode.style.display = "block";
}

function getAccessToken(oAuth2Client) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url:", authUrl);
	electron.shell.openItem(authUrl);
}

function enterCode() {
	var code = document.getElementById("code").value;
	var homeMenu = document.getElementById("loginForm");
	var feedback = document.getElementById("feedback");
	var confirmCodeMenu = document.getElementById("codeForm");

	//console.log(code)

	oAuth2Client.getToken(code, (err, token) => {
		if (err) return console.error("Error retrieving access token", err);
		oAuth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		fs.mkdirSync(defaultLocation + "\\LectioToCal\\");
		fs.writeFile(
			defaultLocation + "\\LectioToCal\\token.json",
			JSON.stringify(token),
			(err) => {
				if (err) return console.error(err);
				console.log(
					"Token stored to",
					defaultLocation + "\\LectioToCal\\token.json"
				);
				confirmCodeMenu.style.display = "none";
				homeMenu.style.display = "block";
				feedback.innerHTML =
					"<div class='alert alert-success alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Success!</strong> You have linked you calendar.</div>";
			}
		);
		//callback(oAuth2Client);
	});
}

function authorize(credentials) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);

	// Check if we have previously stored a token.
	fs.readFile(defaultLocation + "\\LectioToCal\\token.json", (err, token) => {
		if (err) return getAccessToken(oAuth2Client);
		oAuth2Client.setCredentials(JSON.parse(token));
	});

	console.log(oAuth2Client)
}