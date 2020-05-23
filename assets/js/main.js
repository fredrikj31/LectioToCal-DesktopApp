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

async function createCalendar() {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	var result = new Promise((resolve, reject) => {
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
					reject("error")
				} else {
					resolve("success")
				}
			}
		);
	});

	return result
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
					resolve("finish");
				}
			}
		);
	});
}

async function createEvents(dataInput, calendarIdInput, totalEventsInput) {
	const calendar = google.calendar({ version: "v3", auth: setupAuth() });

	var mainMenu = document.getElementById("loginForm");
	var mainMenuFeedback = document.getElementById("feedback");
	var calendarSyncMenu = document.getElementById("calendarLoading")
	var form = document.getElementById("submitForm");

	var calendarId = calendarIdInput;

	var totalEvents = totalEventsInput;
	var totalEventsProcent = 100 / totalEvents;
	var finishProcent = 0;
	var finishLessons = 1;

	var progressTitle = document.getElementById("progressTitle");

	dataInput.forEach((element, i) => {
		setTimeout(() => {
			// Setting the properties
			var eventColor;
			var eventTitle;
			var eventStartDate;
			var eventEndDate;

			// Setting date
			var splitData = element["Time"].split(" ");
			var startTime = splitData[1];
			var endTime = splitData[3];

			var fullTimeYear = splitData[0].split("-")[1];
			var fullTimeDate = splitData[0].split("-")[0];
			var fullTimeDateReal = fullTimeDate.split("/");
			var fullTimeDay = fullTimeDateReal[0];
			var fullTimeMonth = fullTimeDateReal[1];

			eventStartDate =
				fullTimeYear +
				"-" +
				fullTimeMonth +
				"-" +
				fullTimeDay +
				"T" +
				startTime +
				":00" +
				"+02:00";
			eventEndDate =
				fullTimeYear +
				"-" +
				fullTimeMonth +
				"-" +
				fullTimeDay +
				"T" +
				endTime +
				":00" +
				"+02:00";

			// Setting color
			if (element["Status"] == "Ændret!") {
				eventColor = 10;
			} else if (element["Status"] == "Aflyst!") {
				eventColor = 11;
			} else {
				eventColor = 9;
			}

			// Setting title
			if (element["Status"] != " ") {
				if (element["Title"] != " ") {
					eventTitle = element["Status"].trim() + ", " + element["Title"].trim() + ", " + element["Team"].trim();
				} else {
					eventTitle = element["Status"].trim() + ", " + element["Team"].trim();
				}
			} else {
				if (element["Title"] != " ") { eventTitle = element["Title"].trim() + ", " + element["Team"].trim();
				} else {
					eventTitle = element["Team"].trim();
				}
			}

			var event = {
				'summary': `${eventTitle}`,
				'colorId': `${eventColor}`,
				'location': `${element['Room']}`,
				'description': `<b>Status:</b> ${element["Status"]} \n<b>Title:</b> ${element["Title"]} \n<b>Tid:</b> ${element["Time"]} \n<b>Hold:</b> ${element["Team"]} \n<b>Lærer(r):</b> ${element["Teacher"]} \n<b>Lokale:</b> ${element["Room"]}`,
				'start': {
					'dateTime': `${eventStartDate}`,
				},
				'end': {
					'dateTime': `${eventEndDate}`,
				},
				'reminders': {
					'useDefault': true,
				},
			};

			//console.log(event)

			calendar.events.insert(
				{
					calendarId: `${calendarId}`,
					resource: event,
				},
				function (err, event) {
					if (err) {
						console.log(
							"There was an error contacting the Calendar service: " +
								err
						);
						return;
					}
					//console.log("Event created!");
				}
			);

			finishProcent = finishProcent + totalEventsProcent;

			// Animate progress bar
			$(".progress-bar").animate({
				width: Math.ceil(finishProcent) + "%"
			}, 500);

			progressTitle.innerHTML = "Processing " + finishLessons + " of " + totalEvents + " lessons " + `(${Math.ceil(finishProcent)}%)`;

			finishLessons = finishLessons + 1;

			//console.log(finishProcent)

			if (finishLessons-1 >= dataInput.length) {
				calendarSyncMenu.style.display = "none";
				mainMenu.style.display = "block"
				form.style.display = "block"

				//Empty the inputs
				document.getElementById("username").value = "";
				document.getElementById("password").value = "";

				stepper(1)
			
				mainMenuFeedback.innerHTML = "<div class='alert alert-success'><strong>Success!</strong> Your Lectio schedule is now synced with your Google Calendar.</div>"
			}

		}, i * 2000);


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
				console.log(response)

				if (response['message'] == "Success") {
					apiCallMenu.style.display = "none";
					syncCalendarMenu.style.display = "block";
					stepper(3);
		
					mainSync(response);
				} else {
					apiCallMenu.style.display = "none";
					form.style.display = "block";
					formFeedback.innerHTML =
						"<div class='alert alert-danger'><strong>Wrong Details!</strong> Please check your login details.</div>";
					stepper(1);
				}


			})
			.catch((error) => {
				console.log(error)
				apiCallMenu.style.display = "none";
				form.style.display = "block";
				formFeedback.innerHTML =
					"<div class='alert alert-danger'><strong>Error!</strong> Check your details. If is continues to break please send a support ticket with this code: " +
					error +
					"</div>";
				stepper(1);
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
	var lectioData = data["data"];
	var totalLessons = lectioData.length;

	var resultCalendarId = await getCalendarId();
	console.log(resultCalendarId);
	if (resultCalendarId != "error") {
		// If calendar already exists
		var resultEventsList = await getEvents();
		console.log(resultEventsList);
		if (resultEventsList != "error") {
			if (resultEventsList < 1) {
				// If events is empty
				createEvents(lectioData, resultCalendarId, totalLessons)
			} else {
				// If events already exists
				var resultClearCalendar = await clearEvents();

				createEvents(lectioData, resultCalendarId, totalLessons)
			}
		}
	} else {
		// If calendar does not exists
		var resultCreateCalendar = await createCalendar();
		createEvents(lectioData, resultCalendarId, totalLessons)
	}
}