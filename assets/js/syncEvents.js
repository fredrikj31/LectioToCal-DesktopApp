// Packages
var fs = require("fs");
var { google } = require("googleapis");
const { OAuth2 } = google.auth;
var electron = require("electron").remote;
var request = require("request");

//Default location for folder
var defaultLocation = electron.app.getPath("documents");

function setupAuth() {
	// Create a new instance of oAuth and set our Client ID & Client Secret.
	const oAuth2Client = new OAuth2(
		"294965687317-qca0crm8d3tu78nkkreuk73sdkdgsivh.apps.googleusercontent.com",
		"LdE_CuDQ6Mx0WLAJJOSEVOrz"
	);

	var contents = fs.readFileSync(defaultLocation + "/LectioToCal/token.json", 'utf8');

	//console.log(JSON.parse(contents)['refresh_token'])

	oAuth2Client.setCredentials({
		refresh_token: JSON.parse(contents)['refresh_token']
	});

	return oAuth2Client;
}

async function createCalendar() {
	var result = await createCalendarFunc()
		.then((result) => {
			console.log(result);
			return result;
		})
		.catch((error) => {
			console.log("There was an error: " + error);
			return error;
		});

	console.log("Calendar Id: " + result);
	return result;
}

function createCalendarFunc() {
	return new Promise(function (resolve, reject) {
		authorize((auth) => {
			const calendar = google.calendar({ version: "v3", auth });
			calendar.calendars.insert(
				{
					summary: "LectioToCal",
				},
				(err, result) => {
					if (err) {
						console.log("The API returned an error: " + err);
						reject("error");
					} else {
						console.log(result);
						resolve(result);
					}
				}
			);
		});
	});
}

async function getCalendarId() {
	var result = await getCalendarIdFunc()
		.then((result) => {
			console.log(result);
			return result;
		})
		.catch((error) => {
			console.log("There was an error: " + error);
			return error;
		});

	console.log("Calendar Id: " + result);
	return result;
}

/*
https://softwareengineering.stackexchange.com/questions/279898/how-do-i-make-a-javascript-promise-return-something-other-than-a-promise
*/
function getCalendarIdFunc() {
	return new Promise(function (resolve, reject) {
		authorize((auth) => {
			const calendar = google.calendar({ version: "v3", auth });
			calendar.calendarList.list({}, (err, result) => {
				if (err) {
					//console.log("The API returned an error: " + err);
					reject(505);
				}

				//console.log(result);
				var found = false;
				result.data.items.forEach((element) => {
					if (element.summary == "LectioToCal") {
						//console.log("Found it: " + element.id);

						var calendarId = element.id;
						//console.log(calendarId);
						found = true;
						resolve(calendarId);
					}
				});

				if (!found) {
					//console.log("Could not find the calendar")
					reject(404);
				}
			});
		});
	});
}

function getEvents() {
	authorize((auth) => {
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
				if (err)
					return console.log("The API returned an error: " + err);
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
	});
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

function listEvents() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	calendar.events.list(
		{
			calendarId: "primary",
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: "startTime",
		},
		(err, res) => {
			if (err) return console.log("The API returned an error: " + err);
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

listEvents();
