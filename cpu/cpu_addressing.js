
CPU.prototype.addrReg = function(reg, isByte) {
	/* register addressing */
	var self = this;
	if(isByte) {
		return {
			w: function(val) {
				self.reg_s8[reg<<1] = val;
			},
			rs: function() {
				return self.reg_s8[reg<<1];
			},
			ru: function() {
				return self.reg_u8[reg<<1];
			}
		};
	} else {
		return {
			w: function(val) {
				self.reg_u16[reg] = val;
			},
			rs: function() {
				return self.reg_s16[reg];
			},
			ru: function() {
				return self.reg_u16[reg];
			}
		};
	}
};

CPU.prototype.addrMem = function(memAddr, isByte) {
	/* address memory */
	var self = this;
	if(isByte) {
		return {
			w: function(val) {
				self.access(memAddr, val, true);
			},
			rs: function() {
				/* lazy stuff */
				var v = new Int8Array([self.access(memAddr, null, true)])
				return v[0];
			},
			ru: function() {
				/* lazy stuff */
				var v = new Uint8Array([self.access(memAddr, null, true)])
				return v[0];
			},
			memAddr: memAddr
		};
	} else {
		return {
			w: function(val) {
				self.access(memAddr, val, false);
			},
			rs: function() {
				/* lazy stuff */
				var v = new Int16Array([self.access(memAddr, null, false)])
				return v[0];
			},
			ru: function() {
				/* lazy stuff */
				var v = new Uint16Array([self.access(memAddr, null, false)])
				return v[0];
			},
			memAddr: memAddr
		};
	}
};

CPU.prototype.addressing = function(immediateIP, operand, isByte) {
	var regIndex = operand&7;
	var addrMode = (operand>>3)&7;
	var self = this;
	
	var result = null;
	
	if(addrMode==0) {
		/* if register addressing mode, just get it over with */
		result = this.addrReg(regIndex, isByte);
		result.nextIP = immediateIP;
		return result;
	}

	if((addrMode&6)==4) {
		/* autodecrement */
		this.reg_u16[regIndex] -= ((addrMode&1)==0)?(isByte?1:2):2;
	}

	/* take base value for modes, that is (Ri) */
	var memPtr = self.reg_u16[regIndex];

	if((addrMode&6)==2) {
		/* autoincrement */
		this.reg_u16[regIndex] += (((addrMode&1)==0)&&(regIndex!=6)&&(regIndex!=7))?(isByte?1:2):2;
	}
		
	if((addrMode&6)==6) {
		/* index thing */
		/* get value from current immediate IP address, from second or third word that is */
		memPtr=(memPtr+this.access(immediateIP, null, false))&0xFFFF;
		immediateIP=(immediateIP+2)&0xFFFF;
	}
	
	if((addrMode&1)==1) {
		/* if deferred, add another indirection */
		memPtr=this.access(memPtr, null, false);
	}
	
	result=this.addrMem(memPtr, isByte);
	result.nextIP = immediateIP;
	return result;
};

CPU.prototype.addressingIP = function(operand, isByte) {

	/* Warning! This function automatically advances IP register among the others, 
	 * so shadow-copy your register file before executing a cycle!
	 */

	var regIndex = operand&7;
	var addrMode = (operand>>3)&7;
	var self = this;

//	var DEBUG = (this.reg_u16[7]==0x0a28)||(this.reg_u16[7]==0x0a26)||(this.reg_u16[7]==0x0a24);
	var DEBUG = false;

	if(DEBUG) {
		console.log("IP", this.reg_u16[7].toString(16), "operand",  operand.toString(8));
	}

	var result = null;
	
	if(addrMode==0) {
		/* if register addressing mode, just get it over with */
		result = this.addrReg(regIndex, isByte);
		if(DEBUG) console.log("operand success");
		return result;
	}

	if((addrMode&6)==4) {
		/* autodecrement */
		this.reg_u16[regIndex] -= (((addrMode&1)==0)&&(regIndex!=6)&&(regIndex!=7))?(isByte?1:2):2;
	}

	var memPtr = self.reg_u16[regIndex];

	if((addrMode&6)==2) {
		/* autoincrement */
		this.reg_u16[regIndex] += (((addrMode&1)==0)&&(regIndex!=6)&&(regIndex!=7))?(isByte?1:2):2;
	}
		
	if((addrMode&6)==6) {
		/* index thing */
		/* get value from current immediate IP address, from second or third word that is */
		memPtr=(memPtr+this.access(this.reg_u16[7], null, false)+((regIndex==7)?2:0))&0xFFFF;
		this.reg_u16[7]+=2;
	}

	/* add indirection if req'd */
	var memPtrFinal = (addrMode==1)?memPtr:(((addrMode&1)==1)?this.access(memPtr&~1, null, false):memPtr);

	result=this.addrMem(memPtrFinal, isByte);
	result.loc = ((addrMode>1)&&((addrMode&1)==1))?memPtrFinal:memPtr;
	
	if(DEBUG) console.log("operand success");
	
	return result;
};
