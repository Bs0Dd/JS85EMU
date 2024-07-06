
/*

0 111 xxx rrr sss sss
MUL   000
DIV   001
ASH   010
ASHC  011

*/
CPU.prototype.execEIS = function(code) {
//	var u32	= new Uint32Array(this.scratchpad);
	var s32 = new  Int32Array(this.scratchpad);
//	var r32 = new  Int32Array(this.regBuffer);
	var src = this.addressingIP(code&0x3f);
	var r = (code>>6)&0x7;

	this.psw &= ~(this.flags.N|this.flags.Z|this.flags.V|this.flags.C);
	switch ((code>>9)&3) {
		case 0:	// MUL
		{
			// 16 bit source * 16 bit regiter = 32 bit result
			s32[0] = src.rs();			// source
			s32[1] = this.reg_s16[r];	// destination
			
			s32[1] *= s32[0];
			this.checkBitNZ(s32[1]);
			
			this.reg_u16[r|0] = this.sp_u16[3];	// MSW
			this.reg_u16[r|1] = this.sp_u16[2];	// LSW
			
			if((s32[1]>32767)||(s32[1]<(-32768))) this.psw |= this.flags.C;
			return CPU.prototype.execCode;
		}
		case 1: // DIV
		{
			// (R, R|1) 32-bits divident, source field - 16-bit divisor, register - 16-bit quotient
			// R must be even
			this.sp_u16[0] = this.reg_u16[r|1];
			this.sp_u16[1] = this.reg_u16[r|0];
			this.sp_u16[2] = src.ru();
			this.sp_u16[3] = 0;
			if(s32[1]==0) {
				this.psw |= this.flags.V|this.flags.C;
				return CPU.prototype.execCode;
			}		
			s32[2] = Math.floor(s32[0]/s32[1]);
			s32[3] = s32[0] % s32[1];
			this.reg_s16[r] = s32[2];
			this.reg_s16[r|1] = s32[3];
			this.checkBitNZ(s32[2]);
			if((s32[2]>32767)||(s32[2]<(-32768))) this.psw |= this.flags.V;
			return CPU.prototype.execCode;

		}
		case 2: // ASH
		{
			this.sp_u16[0] = this.reg_u16[r];	//x
			this.sp_u16[1] = src.ru()&0x3f;		//d
			this.sp_u16[2] = 0;					// m

			if(this.sp_s16[1] >= 0x20) {
				// shift right
				this.sp_s16[1] = 0x40-this.sp_s16[1];
				if(this.sp_s16[1]>16) this.sp_s16[1]=16;
				this.sp_s16[2] = 1<<(this.sp_s16[1]-1);
				if((this.sp_s16[0]&m)!=0) this.psw |= this.flags.C;
				this.sp_s16[0] = this.sp_s16[0]>>this.sp_s16[1];
			} else if (this.sp_s16[1] >= 0x10) {
				// all bits shifted out left
				if(this.sp_s16[0]!=0) this.psw |= this.flags.V;
				if((this.sp_s16[1]==16)&&((this.sp_s16[0]&1)!=0)) this.psw |= this.flags.C;
				this.sp_s16[0] = 0;
			} else if (this.sp_s16[1] > 0) {
				this.sp_s16[2] = 1<<(16-this.sp_s16[1]);
				if((this.sp_s16[0]&this.sp_s16[2])!=0) this.psw |= this.flags.C;
				this.sp_s16[2] = (-1)<<(15-this.sp_s16[1]);
				this.sp_s16[3] = this.sp_s16[0]&this.sp_s16[2]; // y
				if((this.sp_s16[3]!=this.sp_s16[2])&&(this.sp_s16[3]!=0)) this.psw |= this.flags.V;
				this.sp_s16[0] = this.sp_s16[0]<<this.sp_s16[1];
			}
			this.reg_u16[r] = this.sp_u16[0];
			this.checkBitNZ(this.sp_s16[0]);
			return CPU.prototype.execCode;
		}
		case 3: // ASHC
		{
			// I'm tired, so not yet
			// TODO
			// TODO
			// TODO
			// TODO
			// TODO
			throw this.vectors.TRAP_RESERVED_OPCODE;
		}
	}
	return CPU.prototype.execCode;
};

CPU.prototype.execXOR = function(code) {
	var r = (code>>6)&0x7;
	var dst = this.addressingIP(code&0x3f, false);
	this.sp_u16[0] = this.reg_u16[r];
	this.sp_u16[0] ^= dst.ru();
	dst.w(this.sp_u16[0]);
	this.psw &= ~this.flags.V;
	this.checkBitNZ(this.sp_s16[0]);
	return CPU.prototype.execCode;
};

CPU.prototype.execFIS = function(code) {
	/* floating point instructions: FADD, FMUL, FSUB, FDIV */
	if(((code&0xe0)==0)&&((this.sel&0x0080)==0)) {
		this.psw |= this.flags.H;
		throw this.vectors.TRAP_RESERVED_OPCODE;
	}
};

