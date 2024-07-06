CPU.prototype.execCondCode = function(code) {
	/* CLx/SEx instructions */
	this.psw = (code & 0x0010)?(this.psw|(code&0xf)):(this.psw&(~(code&0xf)));
	return CPU.prototype.execCode;
};
