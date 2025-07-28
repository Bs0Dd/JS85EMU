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
	if (((!extram || eramd) && (!extrom || erold))){
		document.getElementById("mktype").setAttributeNS(null, "opacity", (RAM.length > 2048 ? 0 : 1));
		PAN.panelStart();
	}
	//DBG.debugStart();

	if (window.localStorage.getItem('mk_overlay') == "true"){
		panelSwOverlay();
	}
	pagld = true;
};

var VERVAR = "1.64 - build 27.07.2025";

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
var SKIPBSTEP = false;

var ignoreFreqDiv = loadProperty('mk_ignorediv', false, true);
var ignorePowerOff = loadProperty('mk_ignorepoff', false, true);
var forceTurbo = loadProperty('mk_forceturbo', false, true);

var usePlRom = loadProperty('mk_polrom', false, true);

var DEBUG = loadProperty('mk_debugmsg', false, true);

var NCIMODE = loadProperty('mk_ncimode', false, true);

var RTC = NCIMODE ? new KR512VI1() : null;

var PAN = new PANEL();

GUI.appendChild(LCD.svg);

var MK85CPU = new CPU();

var RAM = null;
var ROM = null;

var POWER = true;
var PAUSE_ON_HID = false;

function extrun() {
	if ((extram || extrom) && pagld) {
		document.getElementById("mktype").setAttributeNS(null, "opacity", (RAM.length > 2048 ? 0 : 1));
		PAN.panelStart();
	}
	startEmu();
}

// Load RAM and ROM contents

function ramlo() {
	if(ram == null) {
		console.log("Creating new RAM memory file");
		RAM = new Uint8Array(2048);
		ramname = "internal";
		ramAutoInit();
	} else if (!extram) {
		console.log("Getting RAM contents from local storage");
	
		if (ramname == null) {
			ramname = "internal";
		}
	
		RAM = new Uint8Array(base64ToArrayBuffer(ram));
	}
}

var ram = window.localStorage.getItem('mk_ram');
var ramname = window.localStorage.getItem('mk_ramname');

var urargs = parseURLParams(window.location.href);
var extram = false;
var extrom = false;
var eramd = false;
var erold = false;

var pagld = false;

if (urargs && urargs.ram) {
	var ract = true;
	if (ram != null && !(urargs.fload && urargs.fload=="force")) {
		ract = confirm('You are going to load RAM from the link and the old RAM will be lost. \
If the data in it is important to you, interrupt the load and save the old RAM.')
	}
	
	if (ract) {	
		console.log('Ext RAM load started.');
		extram = true;
		ramname = urargs.ram.toString().split('/').pop();
		loadBinaryHTTP(urargs.ram,
		function (buf) {
			RAM = new Uint8Array(buf);
			RAMbou();
			eramd = true;
			window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
			window.localStorage.setItem('mk_ramname', ramname);
			if (!extrom || erold) {
				extrun();
			}
		},
		function () {
			extram = false;
			ramname = window.localStorage.getItem('mk_ramname');
			alert("Failed to load RAM from the link, loading old RAM...");
			ramlo();
			eramd = true;
			if (!extrom || erold) {
				extrun();
			}
		},);
	} else {
		console.log('Ext RAM load interrupted.');
		ramlo();
	}
}
else {
	ramlo();
}



function romlo() {
	if (usePlRom) {
		console.log("Loading internal ROM memory file");
		romname = "internal (PL ROM v27B)";
	
		ROM = new Uint8Array(ROM_pol); // Internal ROM image constant (piotr)
	}
	else if (NCIMODE) {
		console.log("Loading internal ROM memory file");
		romname = "internal (НЦИ ROM v1.3)";
	
		ROM = new Uint8Array(ROM_nci); // Internal ROM image constant (НЦИ)
	}
	else if(rom == null) {
		console.log("Loading internal ROM memory file");
		romname = "internal";
	
		ROM = new Uint8Array(ROM_int); // Internal ROM image constant (factory)
	} else {
		console.log("Getting ROM contents from local storage");
	
		ROM = new Uint8Array(base64ToArrayBuffer(rom));
	}
}


var rom = window.localStorage.getItem('mk_rom');
var romname = window.localStorage.getItem('mk_romname');


if (urargs && urargs.rom) {
	
	console.log('Ext ROM load started.');
	extrom = true;
	romname = urargs.rom.toString().split('/').pop();
	loadBinaryHTTP(urargs.rom,
	function (buf) {
		ROM = new Uint8Array(buf);
		ROMbou();
		erold = true;
		window.localStorage.setItem('mk_rom', btoa(String.fromCharCode.apply(null, ROM)));
		window.localStorage.setItem('mk_romname', romname);
		window.localStorage.setItem('mk_polrom', false);
		if (!extram || eramd) {
			extrun();
		}
	},
	function () {
		extrom = false;
		romname = window.localStorage.getItem('mk_romname');
		alert("Failed to load ROM from the link, loading old ROM...");
		romlo();
		erold = true;
		if (!extram || eramd) {
			extrun();
		}
	},);
}
else {
	romlo();
}

if (!extram && !extrom) {
	startEmu();
}


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
		window.localStorage.setItem('mk_ncimode', document.getElementById("nci").checked);
	}
	else if (POWER && !PAUSE_ON_HID){
		panelSwState(false);
	}
});
