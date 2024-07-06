/* return BRanch instruction decision based on branch code
 * - true if branch
 * - false if skip
 */
CPU.prototype.getBranchCondition = function(opcode)
{
	/* entire BR instruction logic is in there */
	var b15 = (opcode&0x8000)?true:false;
	var b10 = (opcode&0x0400)?true:false;
	var b9  = (opcode&0x0200)?true:false;
	var b8  = (opcode&0x0100)?true:false;
	/* unconditional "flag" */
	var uncond = (((opcode^0x8600)&0x8600)==0x8600);
	/* Z flag enabled */
//	var Z = ((this.psw&this.flags.Z)?true:false) && b9 && !(b10 && b15);
	var Z = ((this.psw&this.flags.Z)?true:false) && ((b9 && !b15) || (b15 && b9 && !b10));
	/* C flag enabled */
	var C = ((this.psw&this.flags.C)?true:false) && b9 && b15;
	/* V flag enabled */
	var V = ((this.psw&this.flags.V)?true:false) && ((b10 && !b15) || (b15 && b10 && !b9));
	/* N flag enabled */
	var N = ((this.psw&this.flags.N)?true:false) && ((b10 && !b15) || (b15 && !b10 && !b9));
	/* compute actual value */
	var result = (uncond || (Z || (N != V) || C)) == b8;
	return result;
};

CPU.prototype.execBranch = function(code) {
	// Branch instruction payload
	this.sp_u8[0] = code&0xff;	// get offset
	if(this.getBranchCondition(code)) {
		this.reg_u16[7] += this.sp_s8[0]*2;
	}
	return CPU.prototype.execCode;
};

