const { app, BrowserWindow, globalShortcut } = require("electron");

function createWindow() {
	// Create the browser window.
	const win = new BrowserWindow({
		width: 1300,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
		},
		icon: __dirname + './assets/images/favicon.ico'
	});

	// and load the index.html of the app.
	win.loadFile("./templates/index.html");

	// Removes the menu bar
	win.removeMenu();

	// Developer Shortcuts
	globalShortcut.register("CommandOrControl+Shift+R", () => {
		console.log("Reloaded Window");
		win.webContents.reload();
	});
	globalShortcut.register("CommandOrControl+Shift+X", () => {
		console.log("Opened Developer Options");
		win.webContents.openDevTools();
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
