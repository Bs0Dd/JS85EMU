var uniquesPressed = [];

window.addEventListener('keydown', KBKeyPress, true);
window.addEventListener('keyup', KBKeyRelease, true);

function keyByCode(keyCode) {
	for (let key in keyboardMapping)
		if(keyboardMapping[key] === keyCode) return key
	for (let key in numpadKeyboardMapping)
		if(numpadKeyboardMapping[key] === keyCode) return key
	return undefined;
}

function KBKeyPress(evt) {

	console.log(evt.keyCode.toString(16));

	var key = keyByCode(evt.keyCode);
	if(typeof key == 'undefined') return;

	if (evt.cancelable) evt.preventDefault();

	if (key == "powersw") {
		devicePower()
		return;
	}
	else {
		document.getElementById(key).children[0].setAttributeNS(null, "opacity", 1);
	}

	// find the key in mapping
	if((uniquesPressed.indexOf(key) == -1)&&(uniquesPressed.length < 2)) {
		if((key=="stop")&&(!MK85CPU.flag_halt)) MK85CPU.flag_halt = true;
		uniquesPressed.push(key);
		console.log("Pressed", key, uniquesPressed);
	}
}

function KBKeyRelease(evt) {

	var key = keyByCode(evt.keyCode);
	if(typeof key == 'undefined') return;

	if (evt.cancelable) evt.preventDefault();

	if (key == "powersw") {
		return;
	}

	document.getElementById(key).children[0].setAttributeNS(null, "opacity", 0);

	if(uniquesPressed.indexOf(key) != -1) {
		uniquesPressed.splice(uniquesPressed.indexOf(key), 1);
		console.log("Released", key, uniquesPressed);
	}
}

function GUIKeyPress(evt) {
	var key = evt.currentTarget.id;
	if (evt.cancelable) evt.preventDefault();
	if(supportsVibrate && useVibrate) window.navigator.vibrate(100);

	if (evt.currentTarget.id == "powersw") {
		devicePower()
		return;
	}
	else {
		evt.currentTarget.children[0].setAttributeNS(null, "opacity", 1);
	}

	if((uniquesPressed.indexOf(key) == -1)&&(uniquesPressed.length < 2)) {
		if((key=="stop")&&(!MK85CPU.flag_halt)) MK85CPU.flag_halt = true;
		uniquesPressed.push(key);
		console.log(uniquesPressed);
	}
}

function GUIKeyRelease(evt) {
	if (evt.cancelable) evt.preventDefault();
	var key = evt.currentTarget.id;

	if (evt.currentTarget.id == "powersw") {
		return;
	}
	
	evt.currentTarget.children[0].setAttributeNS(null, "opacity", 0);

	if(uniquesPressed.indexOf(key) != -1) {
		uniquesPressed.splice(uniquesPressed.indexOf(key), 1);
		console.log(uniquesPressed);
	}
}
