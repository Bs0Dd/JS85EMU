// КР512ВИ1 RTC stub

class KR512VI1 {
	constructor() {
		this.reset();
	}

	reset() {
		this.ADDR = 0x00;
		this.DATA = new Array(64).fill(0x00);
		this.DATA[0x0D] = 0x80; // reg D VRT
	}


	w_addr(byteVal) {
		console.log("W RTCADDR", byteVal.toString(16));
		this.ADDR=byteVal;
		return;
	}

	w_data(byteVal) {
		console.log("W RTCDATA", byteVal.toString(16));
		this.DATA[this.ADDR]=byteVal;
		return;
	}
	
	r_data() {
		console.log("R RTCDATA", (this.DATA[this.ADDR]).toString(16));
		return this.DATA[this.ADDR];
	}
}
