function CPU() {
    this.regBuffer	= new ArrayBuffer(16);
    this.regView	= new DataView(this.regBuffer, 0);
    this.reg_u16	= new Uint16Array(this.regBuffer);
    this.reg_s16	= new Int16Array(this.regBuffer);
    this.reg_u8		= new Uint8Array(this.regBuffer);
    this.reg_s8		= new Int8Array(this.regBuffer);
    
    /* since this is JavaScript and we have no simple solution for static typing and typecasting
     * our registers and variables, we're going to organize a safe static "scratchpad" area where
     * everyhing acts like we expect it to.
     * It's silly, I know :)
     */
    this.scratchpad = new ArrayBuffer(16);
    this.sp_u16		= new Uint16Array(this.scratchpad);
    this.sp_s16		= new Int16Array(this.scratchpad);
    this.sp_u8		= new Uint8Array(this.scratchpad);
    this.sp_s8		= new Int8Array(this.scratchpad);
    
    /* reset state */
    this.nextFun		= CPU.prototype.execVector;
    this.vector			= this.vectors.RESET;
    
    this.regSel         = 0x0000;   // HALT mode
    this.psw            = 0x0000;
    this.pc             = 0x0000;	// to save immediate R7 while reading multiple word instructions
    this.cpc            = 0x0000;
    this.cps            = 0x0000;
    this.sel			= 0x0000;
    this.opcode         = 0x0000;
    this.cpuctrl		= 0x0500;

	this.freqDiv = 0;
    
    this.flag_reset		= true;
    this.flag_rtt		= false;
    this.flag_wait		= false;
    this.flag_step		= false;
    this.flag_halt		= false;
    this.flag_evnt		= false;

	this.ignoreFreqDiv  = ignoreFreqDiv;
	this.forceTurbo     = forceTurbo;
	this.ignorePowerOff = ignorePowerOff;
    
    /* gotta assign those before running anything */   
	this.readCallback   = null;
    this.writeCallback  = null;
	this.steps          = null;
}

CPU.prototype.access = function(addr,writeVal,isByte) {
	// MK-85 CPU ignores this, НЦИ ROM utilizes this fact
	//if(!isByte && addr&1) {
		//throw this.vectors.TRAP_BUS_ERROR;	// bus error: attempt to read word from odd address
	//} // TRAP 4

	if(writeVal === null) {
		switch(addr) {
			case 0x0104:
			case 0x0105: {
				return (this.cpuctrl>>((addr&1)?8:0))&(isByte?0xff:0xffff);
			}
			default: {
				if(isByte) {
					return this.readCallback(addr);
				} else {
					return this.readCallback(addr&0xFFFE)|(this.readCallback(addr|1)<<8);
				}
			}
		}
	} else {
		switch(addr) {
			case 0x0104:
			case 0x0105: {
				this.cpuctrl = writeVal & 0xFFFF;
//				console.log("cpuctrl <= ", writeVal.toString(16));
				return null;
			}
			default: {
				if(isByte) {
					this.writeCallback(addr,writeVal&0xFF);
				} else {
					this.writeCallback(addr&0xFFFE,writeVal&0xFF);
					this.writeCallback(addr|1,(writeVal>>8)&0xFF);
				}
				return null;
			}
		}
	}
};


CPU.prototype.getOctet = function(octet, val) {return ((val>>(octet*3))&7);};

CPU.prototype.execTRAP10 = function(code) {
	throw this.vectors.TRAP_RESERVED_OPCODE;
};

CPU.prototype.execTRAP = function(code) {
	throw this.vectors.TRAP_TRAP;
};

CPU.prototype.execIOT = function(code) {
	throw this.vectors.TRAP_IO;
};

CPU.prototype.execBPT = function(code) {
	throw this.vectors.TRAP_T_BIT
};

CPU.prototype.execWAIT = function(code) {
	this.flag_wait = true;
	return CPU.prototype.execCode;
};

CPU.prototype.execEMT = function(code) {
	throw this.vectors.TRAP_EMT;
};

CPU.prototype.execCode = function() {
	this.vector = null;
	
	if((this.cpuctrl&0x0400)==0) return CPU.prototype.execCode;

	if ((typeof BREAKPOINT == "number") && BREAKPOINT==this.reg_u16[7] && !SKIPBSTEP) {
		BREAKPOINT = -1;
		return CPU.prototype.execCode;
	}

	if((((this.cpuctrl&0x0800)==0) || this.flag_reset) && (!this.ignoreFreqDiv) && (DEBUG_STEPS==false)) {
		if(this.freqDiv < (this.flag_reset ? 80 : 8))
		{
			this.freqDiv++;
			return CPU.prototype.execCode;
		} else {
			this.freqDiv = 0;
			this.flag_reset = false;
		}
	} else {
		this.freqDiv = 0;
		this.flag_reset = false;
	}

	var shadowBuffer = this.regBuffer.slice();
	var shadowPSW = this.psw;

	try {
		
		var code=this.access(this.reg_u16[7], null, false);
		//console.log("code", code.toString(8), "(oct) at IP ", this.reg_u16[7].toString(16), "(hex)");
		if(this.flag_halt||this.flag_evnt) this.flag_wait = false;
		if(this.flag_step||((this.psw&this.flags.H)!=0)) this.flag_halt =false;
		this.step_flag = false;
		if (this.flag_wait) {return CPU.prototype.execCode};

		if (this.flag_evnt && ((this.psw&this.flags.I)==0)) {this.flag_evnt = false; throw this.vectors.TRAP_EVNT;}
		else if (this.flag_halt) {
			this.flag_halt = false;
			return this.makeDC0(0x0000);
		}
		
		this.reg_u16[7] += 2;
		return this.makeDC0(code);
		
	} catch(e) {
		if (typeof e == 'number') {

			/* restore things clean before TRAP */
			this.regBuffer = shadowBuffer;
			this.psw = shadowPSW;

			this.vector = e;
			return CPU.prototype.execVector;
		} else {
			for (let key in e) console.log("ERROR ",key,e[key]);
			throw e;
		}
	}


	/* if we reached down here, then opcode was not understood, therefore reserved code trap */
	this.vector = this.vectors.TRAP_RESERVED_OPCODE;
	return CPU.prototype.execVector;
};

CPU.prototype.halt = function() {
	/* this is what we'll get if we get 2 Bus Errors in a row*/
	return CPU.prototype.halt;
};

CPU.prototype.step = function() {
//	console.log("STEP");
	this.nextFun = this.nextFun();
};
