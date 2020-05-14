// Require google from googleapis package.
const { google } = require("googleapis");

// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth;

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new OAuth2(
	"294965687317-qca0crm8d3tu78nkkreuk73sdkdgsivh.apps.googleusercontent.com",
	"LdE_CuDQ6Mx0WLAJJOSEVOrz"
);

// Call the setCredentials method on our oAuth2Client instance and set our refresh token.
oAuth2Client.setCredentials({
	refresh_token: "1//0cI54fx7L3ptOCgYIARAAGAwSNwF-L9IrKjJlAOemxejAcl4EWHonjwI-XXF_asDZouR0Wlvrz90IZUicE8K0rH09ZvWIPsVAurE",
});

// Create a new calender instance.
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

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
