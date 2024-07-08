var stopped = false;

var realConsoleLog = console.log;

function PANEL() {

    const pnl = document.createElement("table");
    pnl.id = "mk85_panel_int";

    var dwram = document.createElement('a');
    dwram.id = "dwram";
    dwram.style.display = "none";
    dwram.download = "mk85_ram.bin";

    pnl.appendChild(dwram);

    var ovl = (loadProperty('mk_overlay', false, true)) ? "checked" : "";
    var init = (loadProperty('mk_autoinit', true, true)) ? "checked" : "";

    var ign = ignoreFreqDiv ? "checked" : "";
    var forc = forceTurbo ? "checked" : "";

    var dbgm = DEBUG ? "checked" : "";

    if (!DEBUG) {
        console.log = function() {};
    }

    var tabcont = [[],[],[]];
    tabcont[0][1] = `<button id="stst" onClick="panelSwState()">Pause</button>
            <button id="rst" onClick="panelDevRestart()">Restart</button> |
            <label for="lay">EXT overlay:</label> <input type="checkbox" onChange="panelSwOverlay()" id="lay" name="lay" ${ovl}>`;

    if (supportsVibrate) {
        var vib = useVibrate ? "checked" : "";

        tabcont[0][1] += `| <label for="vib">Vibro (keys):</label> <input type="checkbox" onChange="panelSwVibro()" id="vib" name="vib" ${vib}>`;
    }

    tabcont[1][0] = `RAM size: <span id="csz"></span>KB<br>
            <input type="range" id="msiz" onChange="panelUpdNSz()" name="msiz" min="2" max="32" step="2"/>
            <button onClick="panelNewMem()">Set size</button><br>
            New size: <span id="nsz"></span>KB<br>
            <label for="aini">Auto init:</label> <input type="checkbox" id="aini" name="aini" ${init}><br><br>
            2KB - Standard MK85<br>6KB - Extended MK85M<br>32KB - Maximal value`;

    tabcont[1][1] = `RAM file: <span id="rfi"></span><br><button onClick="panelSaveRaF()">Save RAM</button><br>
    <button onClick="panelLoadRaF()">Load RAM from file</button>: <input type="file" id="ramf" name="ramf" accept=".bin"><br><br>
    ROM file: <span id="rofi"></span><br><button onClick="panelResetRoF()">Reset ROM</button><br>
    <button onClick="panelLoadRoF()">Load ROM from file</button>: <input type="file" id="romf" name="romf" accept=".bin">`;

    tabcont[2][0] = `<button onClick="panelOpenLay()">Keyboard layout</button> <button onClick="panelOpenCTool()">CHR96 code tool</button><br>
    <button onClick="panelOpenDbg()">Debugger</button>
    <button onClick="panelOpenHelp()">Help</button> <button onClick="panelOpenInfo()">About</button><br>
    <label for="iturb">Force turbo (ign. bit 3 in cpuctrl):</label> <input type="checkbox" onChange="panelSwTurIg()" id="iturb" name="iturb" ${forc}><br>
    <label for="ifrdiv">Ignore frq. div. bit (11 in cpuctrl):</label> <input type="checkbox" onChange="panelSwDivIg()" id="ifrdiv" name="ifrdiv" ${ign}><br>
    <label for="dbgm">Show debug messages in console:</label> <input type="checkbox" onChange="panelSWDbgMsg()" id="dbgm" name="dbgm" ${dbgm}>`;

    tabcont[2][1] = `Speed: <span id="speedstat"></span><br>
    Standard: <input type="number" style="width:80px;" min="100" max="1000000" id="norvl" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <label for="norvl">Op/s</label>
    <button onClick="panelSetNormSP()">Set</button> <button onClick="panelResetNormSP()">Reset</button><br>
    Turbo: <input type="number" style="width:80px;" min="100" max="1000000" id="turvl" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <label for="turvl">Op/s</label>
    <button onClick="panelSetTurSP()">Set</button> <button onClick="panelResetTurSP()">Reset</button><br>
    <button id="cspm" onClick="panelChangeSP()">Change speed mode</button> <button id="rstm" onClick="panelSetTRB()">Restart in turbo mode</button>`;

    for (i=0; i < 3; i++){
        const row = document.createElement("tr");
        for (c=0; c < 2; c++) {
            const td = document.createElement("td");
            td.id = `cl${i}-${c}`;

            if (typeof tabcont[i][c] != "undefined") {
                td.innerHTML = tabcont[i][c];
            }

            if (c == 0 && i == 0) {
                td.style.width = "320px";
            }

            row.appendChild(td);
        }
        pnl.appendChild(row);
    }

    const row = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2;
    td.innerText = `JS85EMU v${VERVAR}`;
    td.style.textAlign = "center";
    td.style.fontWeight = "bold";
    row.appendChild(td);
    pnl.appendChild(row);

    pnl.panelStart = function(){
        panelCalcRAM();

        document.getElementById("norvl").value = SPEED_NORMAL * 100;
        document.getElementById("turvl").value = SPEED_TURBO * 100;

        document.getElementById("rfi").innerText = ramname;
        document.getElementById("rofi").innerText = romname;
        document.getElementById("cl0-0").innerHTML = `BASIC memory free: <span id=\"fbm\"></span> bytes<br>
        Allocated variables: <span id=\"avr\"> ( bytes)</span>`;
        panelUpdate();
    
        this.timer = setInterval(panelUpdate, 1000)
    }

    pnl.panelStop = function(){
        clearInterval(this.timer);
        this.timer = null;
    }

    return pnl;
}

function panelOpenCTool() {
    const hidp = document.getElementById("mk85_ch96_int");
    hidp.style.display = (hidp.style.display == "none") ? "" : "none";
    document.getElementById("mk85_ch96_br").style.display = hidp.style.display;
}

function panelOpenHelp() {
    window.open(`${BASEPATH}/help.html`,'85_helpWindow', `toolbar=no, location=no, status=no, menubar=no,
        scrollbars=no, resizable=no, width=820, height=340`)
}

function panelOpenDbg() {
    window.open(`${BASEPATH}/debug.html`,'85_debugWindow', `toolbar=no, location=no, status=no, menubar=no,
        scrollbars=no, resizable=no, width=820, height=340`)
}


function panelSWDbgMsg(){
    DEBUG = !DEBUG;
    window.localStorage.setItem('mk_debugmsg', DEBUG);

    if (DEBUG) {
        console.log = realConsoleLog;
    }
    else {
        console.log = function() {};
    }

}

function panelCalcRAM(){
    var rlen = (RAM.length % 1024 == 0) ? (RAM.length/1024) : (RAM.length/1024).toFixed(3);

    var rangval;

    if (RAM.length % 2048 != 0) {
        rangval = (Math.floor(RAM.length / 2048)+1)*2;
    }
    else {
        rangval = RAM.length/1024
    }

    document.getElementById("msiz").value = rangval;
    document.getElementById("csz").innerText = rlen;
    document.getElementById("nsz").innerText = rangval;
}

function panelEditFocus() {
    window.removeEventListener('keydown', KBKeyPress, true);
    window.removeEventListener('keyup', KBKeyRelease, true);
} 

function panelEditNoFocus() {
    window.addEventListener('keydown', KBKeyPress, true);
    window.addEventListener('keyup', KBKeyRelease, true);
} 

function panelResetTurSP(){
    document.getElementById("turvl").value = "120000";
    panelSetTurSP();
}

function panelSetTurSP(){
    var nval = document.getElementById("turvl").value;

    if (nval > 1000000) {
        nval = 1000000;
        document.getElementById("turvl").value = nval;
    }
    else if (nval < 100) {
        nval = 100;
        document.getElementById("turvl").value = nval;
    }

    SPEED_TURBO = nval / 100;
    window.localStorage.setItem('mk_turbospeed', SPEED_TURBO);
}

function panelResetNormSP(){
    document.getElementById("norvl").value = "25000";
    panelSetNormSP();
}

function panelSetNormSP(){
    var nval = document.getElementById("norvl").value;

    if (nval > 1000000) {
        nval = 1000000;
        document.getElementById("norvl").value = nval;
    }
    else if (nval < 100) {
        nval = 100;
        document.getElementById("norvl").value = nval;
    }

    SPEED_NORMAL = nval / 100;
    window.localStorage.setItem('mk_normspeed', SPEED_NORMAL);
}

function panelSwDivIg() {
    ignoreFreqDiv = document.getElementById("ifrdiv").checked;
    MK85CPU.ignoreFreqDiv = ignoreFreqDiv;
    window.localStorage.setItem('mk_ignorediv', ignoreFreqDiv);
}

function panelSwTurIg() {
    forceTurbo = document.getElementById("iturb").checked;
    MK85CPU.forceTurbo = forceTurbo;
    window.localStorage.setItem('mk_forceturbo', forceTurbo);
}

function panelChangeSP(){
    MK85CPU.cpuctrl ^= 0x0008;
}

function panelSetTRB(){
    panelDevRestart();

    setTimeout(function () {
		MK85CPU.cpuctrl |= 0x0008;
	  }, 500)
}

function panelOpenInfo() {
    window.open(`${BASEPATH}/about.html`,'85_aboutWindow', `toolbar=no, location=no, status=no, menubar=no,
        scrollbars=no, resizable=no, width=820, height=570`)
}

function panelOpenLay() {
    window.open(`${BASEPATH}/layout.html`,'85_layoutWindow', `toolbar=no, location=no, status=no, menubar=no,
        scrollbars=no, resizable=no, width=820, height=340`)
}

function panelSwVibro() {
    useVibrate = !useVibrate;
    document.getElementById("vib").checked = useVibrate;
    window.localStorage.setItem('mk_vibro', useVibrate);
}

function panelResetRoF() {
    //PAN.panelStop();
    if (POWER) {
        LCD.stopAnimating();
        LCD.clearScreen();
        if (stopped) {
            PAN.panelStart();
            document.getElementById("stst").innerText="Pause"
            stopped = false;
        }
    }

    romname = "internal";
    window.localStorage.removeItem('mk_rom');
    window.localStorage.removeItem('mk_romname');
    document.getElementById("rofi").innerText = romname;

    ROM = ROM_int; // Internal ROM image constant

    if (POWER) {
        MK85CPU = new CPU();
        startEmu();
    }
    //PAN.panelStart();
}

function panelLoadRoF(){
    const romf = document.getElementById("romf").files[0];

    if (typeof romf == "undefined") {
        return;
    }
    else if (romf.size > 32768) {  // 32KB max size
		alert("File larger than expected, maximum memory size is 32KB");
        return;
	}
	// else if (romf.size % 1024 != 0) {  // 1KB multiple
	// 	alert("File must be a multiple of 1KB");
    //     return;
	// }

    const reader = new FileReader();

    reader.onload = function() {
        console.log(reader.result)

        //PAN.panelStop();
        if (POWER) {
            LCD.stopAnimating();
            LCD.clearScreen();
            if (stopped) {
                PAN.panelStart();
                document.getElementById("stst").innerText="Pause"
                stopped = false;
            }
        }

        ROM = new Uint8Array(reader.result);
        romname = romf.name;
        window.localStorage.setItem('mk_rom', btoa(String.fromCharCode.apply(null, ROM)));
        window.localStorage.setItem('mk_romname', romname);
        document.getElementById("rofi").innerText = romname;

        if (POWER) {
            MK85CPU = new CPU();
            startEmu();
        }
        
        //PAN.panelStart();
    };

    reader.readAsArrayBuffer(romf);
}

function panelSaveRaF(){
    //PAN.panelStop();

    if (POWER && !stopped) {
        LCD.stopAnimating();
    }

    
    window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));

    var dwram = document.getElementById("dwram");
    var blob = new Blob([RAM], {'type':'application/octet-stream'});
    dwram.href = URL.createObjectURL(blob);
    dwram.click();

    //PAN.panelStart();
    if (POWER && !stopped) {
        LCD.animate(LCD_ANIMSPEED);
    }
}

function panelLoadRaF() {
    const ramf = document.getElementById("ramf").files[0];

    if (typeof ramf == "undefined") {
        return;
    }
    else if (ramf.size > 32768) {  // 32KB max size
		alert("File larger than expected, maximum memory size is 32KB");
        return;
	}
	// else if (ramf.size % 1024 != 0) {  // 1KB multiple
	// 	alert("File must be a multiple of 1KB");
    //     return;
	// }

    const reader = new FileReader();

    reader.onload = function() {
        console.log(reader.result)

        //PAN.panelStop();
        if (POWER) {
            LCD.stopAnimating();
            LCD.clearScreen();
            if (stopped) {
                PAN.panelStart();
                document.getElementById("stst").innerText="Pause"
                stopped = false;
            }
        }

        RAM = new Uint8Array(reader.result);
        ramname = ramf.name;
        window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
        window.localStorage.setItem('mk_ramname', ramname);
        document.getElementById("rfi").innerText = ramname;
        panelCalcRAM();

        if (POWER) {
            MK85CPU = new CPU();
            startEmu();
        }
        //PAN.panelStart();
    };

    reader.readAsArrayBuffer(ramf);
}

function panelSwOverlay() {
    var opacity = (document.getElementById("lay").checked == true) ? 1 : 0;

    for (i=1; i < 4; i++){
        document.getElementById(`ovl${i}`).setAttributeNS(null, "opacity", opacity);
    }
}

function panelDevRestart() {
    //PAN.panelStop();
    LCD.stopAnimating();
    LCD.clearScreen();

    if (stopped) {
        PAN.panelStart();
        document.getElementById("stst").innerText="Pause"
	    stopped = false;
    }

    MK85CPU = new CPU();
    startEmu();
    //PAN.panelStart();
}

function panelSwState(stat) {
    if (stat == stopped) {
        return;
    }
    else if (typeof stat == "boolean") {
        stopped = stat
    }
    else {
        stopped = !stopped;
    }

    if (!stopped) {
        PAN.panelStart();
        LCD.animate(LCD_ANIMSPEED);
        document.getElementById("stst").innerText="Pause";
    }
    else {
        PAN.panelStop();
        LCD.stopAnimating();
        document.getElementById("stst").innerText="Resume";
    }
}

function panelUpdNSz() {
    document.getElementById("nsz").innerText= document.getElementById("msiz").value;
}

function panelNewMem(){
    //PAN.panelStop();
    if (POWER) {
        LCD.stopAnimating();
        LCD.clearScreen();
    }
    var nmemsiz = document.getElementById("msiz").value
    RAM = new Uint8Array((nmemsiz*1024));
    document.getElementById("csz").innerText = nmemsiz;
    window.localStorage.removeItem('mk_ramname');
    ramname = "internal";
    document.getElementById("rfi").innerText = ramname;

    if (!POWER && document.getElementById("aini").checked == true) {
        document.getElementById("swi").setAttributeNS(null, "opacity", 0);
        document.getElementById("stst").disabled = false;
	    document.getElementById("rst").disabled = false;
        document.getElementById("cspm").disabled = false;
	    document.getElementById("rstm").disabled = false;
        POWER = true;
        MK85CPU = new CPU();
        startEmu();
        PAN.panelStart();
        ramAutoInit();
    }
    else if (POWER) {
        MK85CPU = new CPU();
        if (stopped) {
            PAN.panelStart();
            document.getElementById("stst").innerText="Pause"
            stopped = false;
        }
        startEmu();
        if (document.getElementById("aini").checked == true)
            ramAutoInit();
    }
    //PAN.panelStart();
}

function panelUpdate(){
    var allocvars = (((RAM[0x251] & 0xFF) << 8) | (RAM[0x250] & 0xFF));
    var topram = (((RAM[0x253] & 0xFF) << 8) | (RAM[0x252] & 0xFF));
    var basend = (((RAM[0x23F] & 0xFF) << 8) | (RAM[0x23E] & 0xFF));

    var uans = new Uint16Array(1);
    uans[0] = topram-basend-(allocvars<<3);

    document.getElementById("fbm").innerText= uans[0];
    document.getElementById("avr").innerText= `${allocvars} (${allocvars<<3} bytes)`;

    document.getElementById("speedstat").innerText=
        (((MK85CPU.cpuctrl&0x0008)==0) && !MK85CPU.forceTurbo) ? "Normal" : "Turbo";

    if (((MK85CPU.cpuctrl&0x0800)==0) && !MK85CPU.ignoreFreqDiv) {
        document.getElementById("speedstat").innerText+= " (8x slowed by freq. divider)"
    }

    if ((MK85CPU.cpuctrl&0x0400)==0) {
        document.getElementById("speedstat").innerText+= " (clock stopped)"
    }

    //console.log((MK85CPU.cpuctrl).toString(2));
}