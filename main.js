/* Top level script for MK-85 emulator.
 * Trying to keep things simple this time and not cram the entire thing into a single object.
 * Although that would be handy, who knows, maybe I want to run 3 calculators on a single page
 * concurrently =)
 * 
 * 
 */

window.onload = function() {
	document.getElementById("mk85").appendChild(GUI);
	document.getElementById("mk85_panel").appendChild(PAN);
	document.getElementById("mk85_ch96").appendChild(CH96P);
	document.getElementById("mk85_dbg").appendChild(DBG);
	PAN.panelStart();
	//DBG.debugStart();

	if (window.localStorage.getItem('mk_overlay') == "true"){
		panelSwOverlay();
	}

	document.getElementById("mktype").setAttributeNS(null, "opacity", (RAM.length > 2048 ? 0 : 1));
};

var VERVAR = "1.4 - build 25.07.2024"

var supportsVibrate = "vibrate" in navigator;

var useVibrate = window.localStorage.getItem('mk_vibro');

if(supportsVibrate && (useVibrate == null)) {
	useVibrate = true;
	window.localStorage.setItem('mk_vibro', useVibrate);
}
else if (supportsVibrate) {
	useVibrate = (useVibrate == "true");
}

//var BASEPATH = "/jsemu/mk85";
var BASEPATH = "."; // Base path for files!

var GUI = composeGUI();

var LCD = new MK85_SVG_LCD();
var LCD_ANIMSPEED = 10;

var CH96P = new C96TOOL();
var DBG = new DBGTOOL();

var SPEED_NORMAL = loadProperty('mk_normspeed', 250, false);
var SPEED_TURBO = loadProperty('mk_turbospeed', 1200, false);

var DEBUG_STEPS = false;
var BREAKPOINT = false;

var ignoreFreqDiv = loadProperty('mk_ignorediv', false, true);
var ignorePowerOff = loadProperty('mk_ignorepoff', false, true);
var forceTurbo = loadProperty('mk_forceturbo', false, true);

var DEBUG = loadProperty('mk_debugmsg', false, true);

var PAN = new PANEL();

GUI.appendChild(LCD.svg);

var MK85CPU = new CPU();

var RAM = null;
var ROM = null;

var POWER = true;
var PAUSE_ON_HID = false;

// Load RAM and ROM contents

var ram = window.localStorage.getItem('mk_ram');
var ramname = window.localStorage.getItem('mk_ramname');

if(ram == null) {
	console.log("Creating new RAM memory file");
	RAM = new Uint8Array(2048);
	ramname = "internal";
	ramAutoInit();
} else {
	console.log("Getting RAM contents from local storage");

	if (ramname == null) {
		ramname = "internal";
	}

	RAM = new Uint8Array(base64ToArrayBuffer(ram));
}

var rom = window.localStorage.getItem('mk_rom');
var romname = window.localStorage.getItem('mk_romname');

if(rom == null) {
	console.log("Loading internal ROM memory file");
	romname = "internal";

	ROM = new Uint8Array(ROM_int); // Internal ROM image constant
} else {
	console.log("Getting ROM contents from local storage");

	ROM = new Uint8Array(base64ToArrayBuffer(rom));
}

startEmu();


document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		if (POWER) {
			PAUSE_ON_HID = stopped;
			panelSwState(true);
		}
		// Store RAM in local storage
		window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
		window.localStorage.setItem('mk_overlay', document.getElementById("lay").checked);
		window.localStorage.setItem('mk_autoinit', document.getElementById("aini").checked);
	}
	else if (POWER && !PAUSE_ON_HID){
		panelSwState(false);
	}
});
