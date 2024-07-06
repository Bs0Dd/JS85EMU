CPU.prototype.execHALT = function(code) {
	this.cpc = this.reg_u16[7];
	this.cps = this.psw;
	console.log("HALT, PC =", this.cpc.toString(16), ", PSW =",this.cps.toString(16));
	
	var loc = 0x0078|((this.psw&this.flags.H)?(this.sel&0xff00):0);
	/* jumping to address */
	this.reg_u16[7] = this.access(loc, null, false);
	this.psw = this.access(loc+2, null, false) | this.flags.H;
	return CPU.prototype.execCode;
};

CPU.prototype.execGO = function(code) {
	if(this.psw&this.flags.H) {
		console.log("GO, PC =", this.cpc.toString(16), ", PSW =",this.cps.toString(16));
		this.reg_u16[7] = this.cpc;
		this.psw = this.cps&(~this.flags.H);
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
};


CPU.prototype.execSTEP = function(code) {
	if(this.psw&this.flags.H) {
		this.flag_step = true;
		this.reg_u16[7] = this.cpc;
		this.psw &= ~this.flags.H;
		return CPU.prototype.execCode;
	} else {
		console.log("STEP threw a trap");
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
};


CPU.prototype.execRTI = function(code) {
	var SP1 = this.addressingIP(0x16, false);
	this.reg_u16[7] = SP1.ru();
	//this.reg_u16[6] += 2;
	var SP2 = this.addressingIP(0x16, false);
	this.psw = SP2.ru();
	//this.reg_u16[6] += 2;
	if (this.reg_u16[7]>=0xe000) this.psw |= this.flags.H;
	return CPU.prototype.execCode;
};


CPU.prototype.execRTS = function(code) {
	var r = code&7;
	this.reg_u16[7] = this.reg_u16[r];
	this.reg_u16[r] = this.addressingIP(0x16, false).ru();
	return CPU.prototype.execCode;
};

CPU.prototype.execRESET = function(code) {
	this.flag_reset = true;
	return CPU.prototype.execCode;
};

CPU.prototype.execBPT = function(code) {
	throw this.vectors.TRAP_T_BIT
};

CPU.prototype.execRTT = function(code) {
	this.flag_rtt = true
	return CPU.prototype.execRTI;
};

CPU.prototype.execRSEL = function(code) {
	if(this.psw&this.flags.H) {
		this.reg_u16[0] = this.regSel;
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execRCPC = function(code) {
	if(this.psw&this.flags.H) {
		this.reg_u16[0] = this.cpc;
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execRCPS = function(code) {
	if(this.psw&this.flags.H) {
		this.reg_u16[0] = this.cps;
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execWCPC = function(code) {
	if(this.psw&this.flags.H) {
		this.cpc = this.reg_u16[0];
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execWCPS = function(code) {
	if(this.psw&this.flags.H) {
		this.cps = this.reg_u16[0];
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execMFUS = function(code) {
	if(this.psw&this.flags.H) {
		this.psw = this.cps&(~this.flags.H);
		this.reg_u16[0] = this.addressingIP(0x15, false).ru();
		this.psw = this.cps | this.flags.H;
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}

CPU.prototype.execMTUS = function(code) {
	if(this.psw&this.flags.H) {
		this.psw = this.cps&(~this.flags.H);
		this.addressingIP(0x25, false).w(this.reg_u16[0]);
		this.psw = this.cps | this.flags.H;
		return CPU.prototype.execCode;
	} else {
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
}