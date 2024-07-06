
CPU.prototype.checkBitNZ = function(a) {
	/* calculate N and Z bits for the value A */
	this.psw &= ~(this.flags.N|this.flags.Z);
	this.psw |= ((a<0)?this.flags.N:((a==0)?this.flags.Z:0));
};

/* calculate the V bit for shifts/rotations, V = N xor C */
CPU.prototype.NCtoV = function() {
	this.psw = this.psw|(((this.psw>>2)^(this.psw<<1))&this.flags.V);
};

