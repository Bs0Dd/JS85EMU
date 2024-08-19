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
    for (let i = 0; i < len; i++)        {
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
		DBG.debugStop();
		document.getElementById("stst").innerText = "Pause";
		document.getElementById("dstst").innerText = "Pause";

		document.getElementById("dbst").disabled = POWER;
		document.getElementById("dbsts").disabled = POWER;
		document.getElementById("dbbr").disabled = POWER;
		document.getElementById("stps").disabled = POWER;
		document.getElementById("brkp").disabled = POWER;
		document.getElementById("regist").disabled = POWER;
        document.getElementById("reged").disabled = POWER;
        document.getElementById("edreg").disabled = POWER;
		
		stopped = false;
	}
	else {
		MK85CPU = new CPU();
		startEmu();
		PAN.panelStart();
		DBG.debugStart();
	}

	document.getElementById("swi").setAttributeNS(null, "opacity", POWER ? 1 : 0);
	document.getElementById("stst").disabled = POWER;
	document.getElementById("rst").disabled = POWER;
	document.getElementById("dstst").disabled = POWER;
	document.getElementById("drst").disabled = POWER;
	document.getElementById("cspm").disabled = POWER;
	document.getElementById("rstm").disabled = POWER;

	document.getElementById("disu").disabled = !POWER;
	document.getElementById("dispu").disabled = !POWER;
	document.getElementById("disgo").disabled = !POWER;
	document.getElementById("disgob").disabled = !POWER;
	document.getElementById("dispd").disabled = !POWER;
	document.getElementById("disd").disabled = !POWER;
	document.getElementById("disr").disabled = !POWER;
	document.getElementById("dised").disabled = !POWER;
	document.getElementById("diss").disabled = !POWER;
	
	POWER = !POWER;
}

function startEmu() {
	glueCPU();
	LCD.timerCallback = function () {
		if(keysRead(PP)>0)
		{
//			if(uniquesPressed.indexOf("stop")!=-1) MK85CPU.flag_halt = true;
			MK85CPU.cpuctrl |= 0x0400;	// enable CPU clock if key in selected by PP row is pressed
		}
		MK85CPU.steps = 1;
		for(var steps = 0; steps < MK85CPU.steps; steps++)
		{

			if(uniquesPressed.indexOf("stop")!=-1) {
				return; // looks like real MK stays "frozen" until STOP button will not be released
			}

			MK85CPU.step();

			if (BREAKPOINT<0) {
				panelSwState();
				BREAKPOINT = false;
				return;
			}
			
			if (SKIPBSTEP){SKIPBSTEP=false;}

			if(((MK85CPU.cpuctrl&0x1000)!=0) && !MK85CPU.ignorePowerOff) {
				console.log("Device was turned off by firmware (bit 12 in cpuctrl was set)!");
				devicePower();
				setTimeout(LCD.clearScreen.bind(LCD), 100); //clear screen after last update
				return;
			}

			if (typeof DEBUG_STEPS == "number") {
				MK85CPU.steps = DEBUG_STEPS;
			} else {
				MK85CPU.steps = (((MK85CPU.cpuctrl&0x0008)==0) && !MK85CPU.forceTurbo) ? SPEED_NORMAL : SPEED_TURBO;
			}
			
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
		
	var ramLastAddr = 0x8000+RAM.length;
	var romLastAddr = 0x0000+ROM.length;
	
	MK85CPU.readCallback = function (addr) {
		if((addr&0xfffe)==0x0100) return (keysRead(PP)>>((addr&1)?8:0))&0xff;
		if((addr<0x8000)&&(addr<romLastAddr)) return ROM[addr];
		if((addr>=0x8000)&&(addr<ramLastAddr)) return RAM[addr&0x7FFF]; // For any RAM size 
		// keyboard column regs
		return 0xFF;
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
