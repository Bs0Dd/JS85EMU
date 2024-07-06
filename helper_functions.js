var loadCounter = 0;

function loadProperty(propname, defval, convtobool){
	var prop = window.localStorage.getItem(propname);

	if (prop == null) {
		prop = defval;
		window.localStorage.setItem(propname, prop);
		return prop;
	}

	if (convtobool){
		prop = (prop == "true");
	}

	return prop;
}

/* http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer */

function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

/* ---------- */

function ramAutoInit() {
	uniquesPressed.push("init");

	setTimeout(function () {
		uniquesPressed.splice("init", 1);
		window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
	  }, 500)
}

function devicePower() {
	if (POWER) {
		PAN.panelStop();
		LCD.stopAnimating();
		LCD.clearScreen();
		document.getElementById("stst").innerText = "Pause";
		stopped = false;
	}
	else {
		MK85CPU = new CPU();
		startEmu();
		PAN.panelStart();
	}

	document.getElementById("swi").setAttributeNS(null, "opacity", POWER ? 1 : 0);
	document.getElementById("stst").disabled = POWER;
	document.getElementById("rst").disabled = POWER;
	document.getElementById("cspm").disabled = POWER;
	document.getElementById("rstm").disabled = POWER;
	
	POWER = !POWER;
}

function startEmu() {
	glueCPU();
	LCD.timerCallback = function () {
		if(uniquesPressed.length>0)
		{
//			if(uniquesPressed.indexOf("stop")!=-1) MK85CPU.flag_halt = true;
			MK85CPU.cpuctrl |= 0x0400;	// enable CPU clock if anything is pressed
//			if()
		}
		MK85CPU.steps = 1;
		for(var steps = 0; steps < MK85CPU.steps; steps++)
		{

			MK85CPU.step();
			MK85CPU.steps = (((MK85CPU.cpuctrl&0x0008)==0) && !MK85CPU.forceTurbo) ? SPEED_NORMAL : SPEED_TURBO;
/*			if(MK85CPU.reg_u16[7] == 0x00f4) {
				console.log("HALT INTERRUPT");
				DEBUG = true;
			}*/
			if(MK85CPU.psw&MK85CPU.flags.H) console.log(MK85CPU.reg_u16[7].toString(16));
		}
			
	}
	LCD.animate(LCD_ANIMSPEED);
}

var PP = 0;	// CPU parallel port for now

// Attach CPU to everything else
function glueCPU() {
	if (RAM.length > 32768) {  // 32KB max size
		RAM = RAM.subarray(0, 32768);
		console.log("Maximum memory size is 32KB, memory area reduced");
	}
	// if (RAM.length % 2048 != 0) {  // MK85 firmware expects a RAM multiple of 2KB 
	// 	var nRAM = new Uint8Array((Math.floor(RAM.length / 2048)+1)*2048);
	// 	nRAM.set(RAM);
	// 	RAM = nRAM;
	// 	console.log(`The RAM size must be a multiple of 2KB, increasing the area to ${RAM.length / 1024}KB.`);
	// }
	
	var ramLastAddr = 0x8000+RAM.length;
	
	MK85CPU.readCallback = function (addr) {
		if((addr&0xfffe)==0x0100) return (keysRead(PP)>>((addr&1)?8:0))&0xff;
		if(addr<0x8000) return ROM[addr&0x7FFF];
		if((addr>=0x8000)&&(addr<ramLastAddr)) return RAM[addr&0x7FFF]; // For any RAM size 
		// keyboard column regs
		return 0;
	};

	MK85CPU.writeCallback = function (addr, byteVal) {
		if((addr>0x7f)&&(addr<0xe0)) {	// 0x80...0xDF is LCD contoller memory
			LCD.videoMemory[addr&0x7f] = byteVal;
			return;
		}
		if(addr==0xe0) {			// 0xe0 - LCD cursor register
			LCD.cursorReg = byteVal;
			return;
		}
		if(addr==0x102) {			// 0x102 - keyboard rows
			PP &= 0xff00;
			PP |= byteVal;
			return;
		}
		if(addr==0x103) {			// 0x102 - keyboard rows
			PP &= 0x00ff; 
			PP |= byteVal<<8;
			return;
		}
		if((addr>=0x8000)&&(addr<ramLastAddr)) { // For any RAM size 
			RAM[addr&0x7FFF] = byteVal;
			return;
		}
		return;
	};
}
