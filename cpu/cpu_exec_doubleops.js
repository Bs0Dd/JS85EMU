CPU.prototype.execDoubleOp = function(code) {
	var opcode = (code>>12)&0x7;
	var isByte = ((code&0x8000)==0x8000);

	/* opcode 6, i.e. ADD/SUB instructions always work on words */
	spu = (isByte&&(opcode!=6))?this.sp_u8:this.sp_u16;
	sps = (isByte&&(opcode!=6))?this.sp_s8:this.sp_s16;

	/* get 2 operands */

	switch(opcode) {
		case 1:	/* MOV[B] */
		{
			var src = this.addressingIP((code>>6)&0x3f, isByte);
			
			/* if destination is a register, then sign-extend it */
			var dst = this.addressingIP(code&0x3f, ((code&0x38)==0)?false:isByte);
	
			/* read signed */
			var x = src.rs();
//			console.log(x);
			/* and write it to destination */
			dst.w(x);
			this.psw &= ~this.flags.V;
			this.checkBitNZ(x);
			break;
		}
		case 2: /* CMP[B] */
		{
			var src = this.addressingIP((code>>6)&0x3f, isByte);
			var dst = this.addressingIP(code&0x3f, isByte);
			
//			console.log(isByte);
			
			sp = isByte?this.sp_u8:this.sp_u16;

			sp[0] = src.ru();
			sp[1] = dst.ru();
			sp[2] = sp[0] - sp[1];

			
			/* I had two different PDP emulators, hundred and one Undertale soundtracks playing, 
			 * five Wiki pages open, a mug half-full of tea, and a whole galaxy bitwise ANDs, ORs,
			 * NOTs, XORs...
			 * ...and also a pint of SIMH sources, a quart of Wine, a case of MDN javascript docs,
			 * and two dozen kilobytes of plain-text PDP manuals.
			 * Not that I needed all that for the trip, but once you get locked into a serious
			 * JS coding, the tendency is to push it as far as you can.
			 * The only thing that worried me was bitwise XOR. There's nothing more helpless and 
			 * irresponsible and depraved than storing number's sign separately from the number, 
			 * and I knew I'd get into that rotten stuff pretty soon.
			 *
 			 * PS: note to myself: simulate ~ as ^0xffff - JS bitwise XOR messes things up, grrrr
			 */

			sp[3] = ((sp[2]&sp[1])|((0xffff^sp[0])&(sp[2]|sp[1])))>>(isByte?0:8);
			
			this.psw &= ~(this.flags.V|this.flags.C);
			this.psw |= (((sp[3]&0x80)!=0)?this.flags.C:0);
			this.psw |= (((sp[3]^(sp[3]<<1))&0x80)!=0)?this.flags.V:0;
		
			this.checkBitNZ((isByte?this.sp_s8:this.sp_s16)[2]);
			
			break;
		}
		case 3:	/* BIT[B] */
		{
			var src = this.addressingIP((code>>6)&0x3f, isByte);
			var dst = this.addressingIP(code&0x3f, isByte);
			
			sp = isByte?this.sp_u8:this.sp_u16;
			
			sp[0] = src.ru();
			sp[1] = dst.ru();
			sp[2] = sp[0]&sp[1];
			
			this.psw &= ~(this.flags.V);
			
			this.checkBitNZ((isByte?this.sp_s8:this.sp_s16)[2]);
			
			break;
		}
		case 4: /* BIC[B] */
		case 5:	/* BIS[B] */
		{
			var src = this.addressingIP((code>>6)&0x3f, isByte);
			var dst = this.addressingIP(code&0x3f, isByte);
			
/*			if(typeof dst.memAddr != 'undefined')
				console.log(dst.memAddr.toString(16), src.ru().toString(16));*/
			
			spu[0] = src.ru();
			spu[1] = (opcode==5)?(dst.ru()|spu[0]):(dst.ru()&(spu[0]^0xffff));
			dst.w(spu[1]);
			this.psw &= ~(this.flags.V);

			this.checkBitNZ(sps[1]);
			break;
		}
		case 6: /* ADD(0)/SUB(1) - those work with words only */
		{
			var src = this.addressingIP((code>>6)&0x3f, false);
			var dst = this.addressingIP(code&0x3f, false);
			spu[0] = src.ru();
			spu[1] = dst.ru();
			spu[2] = isByte?(spu[1]-spu[0]):(spu[1]+spu[0]);
			spu[4] = ~spu[(isByte?1:2)];
			spu[3] = (spu[(isByte?2:1)]&spu[0])|(spu[4]&(spu[(isByte?2:1)]|spu[0]));
			this.psw &= ~(this.flags.V|this.flags.C);
			dst.w(spu[2]);
			if((spu[3]&0x8000)!=0) this.psw |= this.flags.C;
			if(((spu[3]^(spu[3]<<1))&0x8000)!=0) this.psw |= this.flags.V;
			this.checkBitNZ(sps[2])
			break;
		}
	}
	return CPU.prototype.execCode;
};
