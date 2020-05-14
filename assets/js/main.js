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

	var contents = fs.readFileSync(
		defaultLocation + "/LectioToCal/token.json",
		"utf8"
	);

	//console.log(JSON.parse(contents)['refresh_token'])

	oAuth2Client.setCredentials({
		refresh_token: JSON.parse(contents)["refresh_token"],
	});

	return oAuth2Client;
}

function createCalendar() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	calendar.calendars.insert(
		{
			resource: {
				summary: "LectioToCal",
				description: "This is the calendar for LectioToCal",
				timeZone: "Europe/Copenhagen",
			},
		},
		(err, result) => {
			if (err) {
				console.log("The API returned an error: " + err);
			} else {
				console.log(result);
			}
		}
	);
}

async function getCalendarId() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });
	var result = new Promise((resolve, reject) => {
		calendar.calendarList.list({}, (err, result) => {
			if (err) {
				console.log("The API returned an error: " + err);
			}

			//console.log(result);
			var found = false;
			result.data.items.forEach((element) => {
				if (element.summary == "LectioToCal") {
					console.log("Found it: " + element.id);

					var calendarId = element.id;
					//console.log(calendarId);
					found = true;
					resolve(calendarId);
				}
			});

			if (!found) {
				console.log("Could not find the calendar");
				reject("error");
			}
		});
	});

	return result;
}

async function getEvents() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	var resultCalendarId = getCalendarId()
		.then((result) => {
			return result;
		})
		.catch((error) => {
			console.log(error);
		});

	var calendarId = await resultCalendarId;

	var weekDate = getStartEndDate();
	var startDate = weekDate[0] + "T00:00:00+02:00";
	var endDate = weekDate[1] + "T23:59:59+02:00";

	//console.log(startDate)
	//console.log(endDate)

	var result = new Promise((resolve, reject) => {
		calendar.events.list(
			{
				calendarId: calendarId,
				singleEvents: true,
				timeMin: startDate,
				timeMax: endDate,
			},
			(err, res) => {
				if (err) {
					console.log("The API returned an error: " + err);
					reject(err);
				} else {
					var events = res.data.items;

					//console.log(events.length);
					resolve(events.length);
				}
			}
		);
	});

	return result;
}

async function clearEvents() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	var resultCalendarId = getCalendarId()
		.then((result) => {
			return result;
		})
		.catch((error) => {
			console.log(error);
		});

	var calendarId = await resultCalendarId;

	var weekDate = getStartEndDate();
	var startDate = weekDate[0] + "T00:00:00+02:00";
	var endDate = weekDate[1] + "T23:59:59+02:00";

	//console.log(startDate)
	//console.log(endDate)

	// Getting all the events by id
	var result = new Promise((resolve, reject) => {
		calendar.events.list(
			{
				calendarId: calendarId,
				singleEvents: true,
				timeMin: startDate,
				timeMax: endDate,
			},
			(err, res) => {
				if (err) {
					console.log("The API returned an error: " + err);
					reject("error");
				} else {
					const events = res.data.items;
					console.log(events);
					console.log("---------------");

					events.forEach((element, i) => {
						setTimeout(() => {
							var params = {
								calendarId: calendarId,
								eventId: element.id,
							};
	
							calendar.events.delete(params, function (err) {
								if (err) {
									console.log(
										"The API returned an error: " + err
									);
									return;
								}
								//console.log("Event deleted.");
							});
						}, i * 1000);
					});
					resolve("finish")
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
				
				mainSync(response);
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

function getStartEndDate() {
	var current = new Date(); // get current date
	var weekstart = current.getDate() - current.getDay() + 1;
	var weekend = weekstart + 6; // end day is the first day + 6
	var monday = new Date(current.setDate(weekstart));
	var sunday = new Date(current.setDate(weekend));

	var startDate =
		monday.getFullYear() +
		"-" +
		(monday.getMonth() + 1) +
		"-" +
		monday.getDate();
	var endDate =
		sunday.getFullYear() +
		"-" +
		(sunday.getMonth() + 1) +
		"-" +
		sunday.getDate();

	return [startDate, endDate];
}

async function mainSync(data) {
	var lectioData = data['data'];

	var resultCalendarId = await getCalendarId();
	console.log(resultCalendarId)
	if (resultCalendarId != "error") {
		// If calendar already exists
		var resultEventsList = await getEvents();
		console.log(resultEventsList)
		if (resultEventsList != "error") {
			if (resultEventsList < 1) {
				// If events is empty
				lectioData.forEach(element => {
					console.log(element)
					console.log("---------------------------");
				});

			} else {
				// If events already exists
				var resultClearCalendar = await clearCalendarId();

				lectioData.forEach(element => {
					console.log(element)
					console.log("---------------------------");
				});

			}
		}
	} else {
		// If calendar does not exists
		createCalendar();
	}
}
