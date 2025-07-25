// КР512ВИ1 RTC stub

class KR512VI1 {
	constructor() {
		this.reset();
	}

	reset() {
		this.ADDR = 0x00;
		this.DATA = new Array(64).fill(0x00);

		this.update();
		this.DATA[0x0D] = 0x80; // reg D VRT
		//setInterval(this.update, 1000);
	}

	update() {
		this.DATA[10] |= 0x80;	// reg A UIP
		const currentDate = new Date();
		this.DATA[0] = currentDate.getSeconds();
		this.DATA[2] = currentDate.getMinutes();
		this.DATA[4] = currentDate.getHours();
		this.DATA[6] = currentDate.getDay()+1;
		this.DATA[7] = currentDate.getDate();
		this.DATA[8] = currentDate.getMonth();
		this.DATA[9] = currentDate.getFullYear()%100;
		this.DATA[10] ^= 0x80;	// reg A UIP
	}

	w_addr(byteVal) {
		//console.log("W RTCADDR", byteVal.toString(16));
		this.ADDR=byteVal;
		return;
	}

	w_data(byteVal) {
		console.log("W RTCDATA", byteVal.toString(16));
		this.DATA[this.ADDR]=byteVal;
		return;
	}
	
	r_data() {
		//console.log("R RTCDATA", (this.DATA[this.ADDR]).toString(16));
		const currentDate = new Date();
		switch(this.ADDR) {
			case 0:
				return currentDate.getSeconds();
			case 2:
				return currentDate.getMinutes();
			case 4:
				return currentDate.getHours();
			case 6:
				return currentDate.getDay()+1;
			case 7:
				return currentDate.getDate();
			case 8:
				return currentDate.getMonth();
			case 9:
				return currentDate.getFullYear()%100;
			default:
				return this.DATA[this.ADDR];
		}
	}
}
