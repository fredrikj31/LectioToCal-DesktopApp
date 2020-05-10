// Packages
var fs = require("fs");
var { google } = require("googleapis");
var electron = require("electron").remote;
var request = require("request");

var calendar = google.calendar("v3");
//Default location for folder
var defaultLocation = electron.app.getPath("documents");

function setupAuth() {
	let auth = new google.auth.OAuth2(
		"294965687317-mccilvgvhpi91adf875pl4jcmh35qsm5.apps.googleusercontent.com",
		"D9sni3BasEk6regCadf1HqFG",
		"http://localhost"
	);

	fs.readFile(defaultLocation + "\\LectioToCal\\token.json", (err, result) => {
		fileContent = JSON.parse(result)


		let credentials = {
			access_token: fileContent['access_token'],
			token_type: fileContent['token_type'], // mostly Bearer
			refresh_token: fileContent['refresh_token'],
			expiry_date: fileContent['expiry_date']
		};

		auth.setCredentials(credentials);
	});

	console.log(auth);

	return auth;
}

function getCalendar() {
	auth = setupAuth();

	const calendar = google.calendar({ version: "v3", auth });

	calendar.events.list(
		{
			calendarId: "primary",
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: "startTime",
		},
		(err, res) => {
			if (err) {
				return console.log("The API returned an error: " + err);
			}
			const events = res.data.items;
			if (events.length) {
				console.log("Upcoming 10 events:");
				events.map((event, i) => {
					const start = event.start.dateTime || event.start.date;
					console.log(`${start} - ${event.summary}`);
				});
			} else {
				console.log("No upcoming events found.");
			}
		}
	);
}

function stepper(number) {
	var stepOne = document.getElementById("firstStep");
	var stepTwo = document.getElementById("secondStep");
	var stepThird = document.getElementById("thirdStep");

	var activeColor = "#343A40";
	var inactiveColor = "#6C757D";
	var errorColor = "#DC3545";

	if (number == 1) {
		stepOne.style.backgroundColor = activeColor;
		stepTwo.style.backgroundColor = inactiveColor;
		stepThird.style.backgroundColor = inactiveColor;
	} else if (number == 2) {
		stepOne.style.backgroundColor = inactiveColor;
		stepTwo.style.backgroundColor = activeColor;
		stepThird.style.backgroundColor = inactiveColor;
	} else if (number == 3) {
		stepOne.style.backgroundColor = inactiveColor;
		stepTwo.style.backgroundColor = inactiveColor;
		stepThird.style.backgroundColor = activeColor;
	} else {
		stepOne.style.backgroundColor = errorColor;
		stepTwo.style.backgroundColor = errorColor;
		stepThird.style.backgroundColor = errorColor;
	}
}

// Form Validation
function submitForm() {
	var usernameInput = document.getElementById("username");
	var passwordInput = document.getElementById("password");

	var formFeedback = document.getElementById("feedback");

	if (usernameInput.value == "" && passwordInput.value == "") {
		formFeedback.innerHTML =
			"<div class='alert alert-danger'><strong>Error!</strong> Please fill out all the values.</div>";
	} else {
		var lectioUsername = document.getElementById("username").value;
		var lectioPassword = document.getElementById("password").value;
		var lectioType = document.getElementById("type").value;
		var lectioSchoolId = document.getElementById("schoolId").value;

		var form = document.getElementById("submitForm");
		var apiCallMenu = document.getElementById("apiLoading");
		var syncCalendarMenu = document.getElementById("calendarLoading");

		// API RESPONSE
		form.style.display = "none";
		apiCallMenu.style.display = "block";
		stepper(2);

		const options = {
			headers: {
				Username: lectioUsername,
				Password: lectioPassword,
				SchoolId: lectioSchoolId,
				Type: lectioType,
			},
			uri: "https://lectio-api.herokuapp.com/schedule",
			method: "GET",
		};

		let result = new Promise((resolve, reject) => {
			request(options, (err, res, body) => {
				if (err) {
					console.log(err);
					reject(err);
				}
				//console.log(JSON.parse(body));
				resolve(JSON.parse(body));
			});
		});

		result
			.then((response) => {
				apiCallMenu.style.display = "none";
				syncCalendarMenu.style.display = "block";
				stepper(3);
				//syncCalendar(result);

				return response;
			})
			.catch((error) => {
				apiCallMenu.style.display = "none";
				form.style.display = "block";
				formFeedback.innerHTML =
					"<div class='alert alert-danger'><strong>Error!</strong> Please send a support ticket with this code: " +
					error +
					"</div>";
				stepper(4);
			});
	}
}

function createCalendar() {}

function grabCalendar() {}

function checkEvents(auth) {}

function insertEvents(auth) {
	const calendar = google.calendar({ version: "v3", auth });
	var event = {
		summary: "Google I/O 2019",
		location: "800 Howard St.",
		description: "A chance to hear more.",
		start: {
			dateTime: "2019-11-28T09:00:00-07:00",
			timeZone: "America/Los_Angeles",
		},
		end: {
			dateTime: "2019-11-28T10:00:00-07:00",
			timeZone: "America/Los_Angeles",
		},
		recurrence: ["RRULE:FREQ=DAILY;COUNT=2"],
		attendees: [
			{ email: "lpage@example.com" },
			{ email: "sbrin@example.com" },
		],
		reminders: {
			useDefault: false,
			overrides: [
				{ method: "email", minutes: 24 * 60 },
				{ method: "popup", minutes: 10 },
			],
		},
	};

	calendar.events.insert(
		{
			auth: auth,
			calendarId: "primary",
			resource: event,
		},
		function (err, event) {
			if (err) {
				console.log(
					"There was an error contacting the Calendar service: " + err
				);
				return;
			}
			console.log("Event created: %s", event.data.htmlLink);
		}
	);
}
