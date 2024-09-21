/* the following function implements entire single operand group
 * except JMP and SWAB according to PDP-11 instruction repertoire, page 92 */

CPU.prototype.execSingleOp = function(code) {
	
	var isByte = (code&0x8000)==0x8000; //&&(opcode<6);

	var dst = this.addressingIP(code&0x3f, isByte);

	spu = isByte?this.sp_u8:this.sp_u16;
	sps = isByte?this.sp_s8:this.sp_s16;
	
	switch((code>>6)&0x3f) {
		case 0x28: { // CLR[B]
			dst.w(0);
			this.psw |= this.flags.Z;
			this.psw &= ~(this.flags.N|this.flags.C|this.flags.V);
			return CPU.prototype.execCode;
		}
		case 0x29: { // COM[B]
			spu[0] = dst.ru(); spu[0]^=0xffff; dst.w(spu[0]);
			this.psw |= this.flags.C;
			this.psw &= ~this.flags.V;
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x2b:   // DEC[B]
		case 0x2a: { // INC[B]
			spu[0] = dst.ru();
			spu[0] = ((code>>6)&1)?spu[0]-1:spu[0]+1;
			dst.w(spu[0]);
			this.psw &= ~this.flags.V;			
			this.psw |= (spu[0]==(isByte?0x80:0x8000)-((code>>6)&1))?this.flags.V:0;
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x2c: { // NEG[B]
			spu[0] = dst.ru();
			this.psw &= ~(this.flags.V|this.flags.C);
			this.psw |= (spu[0]==(isByte?0x80:0x8000))?this.flags.V:0;
			spu[0]^=0xffff; spu[0]++; dst.w(spu[0]);
			this.psw |= (spu[0]!=0)?this.flags.C:0;
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x2d: { // ADC[B]
			spu[0] = dst.ru();
			this.psw &= ~this.flags.V;
			if(this.psw&this.flags.C) {
				if(spu[0] == (isByte?0x7f:0x7fff)) this.psw |= this.flags.V;
				if(spu[0] != (isByte?0xff:0xffff)) this.psw &= ~this.flags.C;
				spu[0]++;
			}
			dst.w(spu[0]);
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x2e: { // SBC[B]
			spu[0] = dst.ru();
			this.psw &= ~this.flags.V;
			if(this.psw&this.flags.C) {
				if(spu[0] == (isByte?0x80:0x8000)) this.psw |= this.flags.V;
				if(spu[0] != 0) this.psw &= ~this.flags.C;
				spu[0]--;
			}
			dst.w(spu[0]);
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x2f: { // TST[B]
			this.psw &= ~(this.flags.V|this.flags.C);
			spu[0] = dst.ru();
			this.checkBitNZ(sps[0]);
			return CPU.prototype.execCode;
		}
		case 0x30: { // ROR[B]
			spu[0] = dst.ru();
			var newC = (spu[0]&1)?this.flags.C:0;
			spu[0] = (spu[0]>>1)|((this.psw&this.flags.C)?(isByte?0x80:0x8000):0);
			dst.w(spu[0]);
			this.psw = (this.psw&(~(this.flags.V|this.flags.C)))|newC;
			this.checkBitNZ(sps[0]);
			this.NCtoV();
			return CPU.prototype.execCode;
		}
		case 0x31: { // ROL[B]
			spu[0] = dst.ru();
			var newC = (spu[0]&(isByte?0x80:0x8000))?this.flags.C:0;
			spu[0] = (spu[0]<<1)|((this.psw&this.flags.C)?1:0);
			dst.w(spu[0]);
			this.psw = (this.psw&(~(this.flags.V|this.flags.C)))|newC;
			this.checkBitNZ(sps[0]);
			this.NCtoV();
			return CPU.prototype.execCode;
		}
		case 0x32: { // ASR[B]
			spu[0] = dst.ru();
			var newC = (spu[0]&1)?this.flags.C:0;
			spu[0] = (spu[0]>>1)|(spu[0]&(isByte?0x80:0x8000));
			dst.w(spu[0]);
			this.psw = (this.psw&(~(this.flags.V|this.flags.C)))|newC;
			this.checkBitNZ(sps[0]);
			this.NCtoV();
			return CPU.prototype.execCode;
		}
		case 0x33: { // ASL[B]
			spu[0] = dst.ru();
			var newC = (spu[0]&(isByte?0x80:0x8000))?this.flags.C:0;
			spu[0] = (spu[0]<<1);
			dst.w(spu[0]);
			this.psw = (this.psw&(~(this.flags.V|this.flags.C)))|newC;
			this.checkBitNZ(sps[0]);
			this.NCtoV();
			return CPU.prototype.execCode;
		}
		default: throw this.vectors.TRAP_RESERVED_OPCODE;
	}
};

CPU.prototype.execSWAB = function(code) {
	var dst = this.addressingIP(code&0x3F, false);
	this.sp_u16[0] = dst.ru();
	dst.w((this.sp_u8[0]<<8)|this.sp_u8[1]);
	this.psw &= ~(this.flags.V|this.flags.C);
	this.checkBitNZ(this.sp_s8[1]);
	return CPU.prototype.execCode;
};


CPU.prototype.execMTPS = function(code) {
	var src = this.addressingIP(code&0x3f, true);
	this.psw = (this.psw & 0xFF10) | (src.ru() & 0x00EF); // T bit left unchanged
	return CPU.prototype.execCode;
}

CPU.prototype.execMFPS = function(code) {
	/* if destination is a register, then sign-extend it */
	var dst = this.addressingIP(code&0x3f, ((code&0x38)!=0));
	
	var x = this.psw << 24 >> 24;

	dst.w(x);
	this.psw &= ~this.flags.V;
	this.checkBitNZ(x);
	return CPU.prototype.execCode;
}

CPU.prototype.execSXT = function(code) {
	var dst = this.addressingIP(code&0x3F, false);
	if ((this.psw&this.flags.N) == 0) {
		dst.w(0);
		this.psw |= this.flags.Z;
	}
	else {
		dst.w(0xFFFF);
		this.psw &= ~this.flags.Z;
	}
	this.psw &= ~this.flags.V;
	return CPU.prototype.execCode;
}

CPU.prototype.execMARK = function(code) {
	this.reg_u16[6] = this.reg_u16[7] + ((code << 1) & 0x7E);
	this.reg_u16[7] = this.reg_u16[5] & 0xFFFE;
	var src = this.addressingIP(0x16, false);
	this.reg_u16[5] = src.ru();
	return CPU.prototype.execCode;
}