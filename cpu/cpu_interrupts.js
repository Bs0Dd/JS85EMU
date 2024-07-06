CPU.prototype.execVector = function() {
	console.log("interrupt addr", this.vector);
	this.vector |= (this.psw&this.flags.H)?(this.sel&0xff00):0;
	try {
		/* saving values to stack */
		var PS = this.reg_u16[6];
		var PC = this.reg_u16[7];
		this.reg_u16[6] -= 2;
		this.access(this.reg_u16[6], PS, false);
		this.reg_u16[6] -= 2;
		this.access(this.reg_u16[6], PC, false);
		/* jumping to address */
		this.reg_u16[7] = this.access(this.vector, null, false);
		this.psw = this.access(this.vector+2, null, false);
	} catch(e) {
		if(e == this.vectors.TRAP_BUS_ERROR) {
			if(this.vector == this.vectors.TRAP_BUS_ERROR) {
				console.log("Caught bus error trap within itself. CPU HALTED.");
				console.log(MK85CPU.reg_u16[7].toString(16), "PS", PS.toString(16), "PC", PC.toString(16));
				console.log("R0", MK85CPU.reg_u16[0].toString(16), "R1", MK85CPU.reg_u16[1].toString(16))
				this.vector = null;
				return CPU.prototype.halt();
			} else {
				console.log("Caught bus error trap, interrupting...");
				this.vector = this.vectors.TRAP_BUS_ERROR;
				return CPU.prototype.execVector;
			}
		} else {
			// log other errors
			// learned it the hard way to do it to catch things i didn't expect to happen
			// like a typo in nested call, jesus fucking christ
			console.log(e);
			return CPU.prototype.halt();
		}
	}
	this.vector = null;
	return CPU.prototype.execCode;
};
