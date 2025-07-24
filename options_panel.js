// Options panel module
// Panel with standard functions to configure emulator
// (change RAM size, load ROM/RAM from files, save RAM to disk, change speed parameters and etc.)

// 2024 (c) Bs0Dd

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

    var dwvar = document.createElement('a');
    dwvar.id = "dwvar";
    dwvar.style.display = "none";
    dwvar.download = "mk85_vars.txt";

    pnl.appendChild(dwvar);

    var dwbas = document.createElement('a');
    dwbas.id = "dwbas";
    dwbas.style.display = "none";
    dwbas.download = "mk85_programs.txt";

    pnl.appendChild(dwbas);

    var ovl = (loadProperty('mk_overlay', false, true)) ? "checked" : "";
    var init = (loadProperty('mk_autoinit', true, true)) ? "checked" : "";
    var fi32 = (loadProperty('mk_32kfix', true, true)) ? "checked" : "";
    var ncimode = NCIMODE ? "checked" : "";

    var ign = ignoreFreqDiv ? "checked" : "";
    var ignp = ignorePowerOff ? "checked" : "";
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

    tabcont[1][0] = `<label for="nci">НЦИ mode (banked RAM, RTC):</label> <input type="checkbox" id="nci" onChange="panelUpdNSz()" name="nci" ${ncimode}><br>
			RAM size: <span id="csz"></span>KB<br>
            <input type="range" id="msiz" onChange="panelUpdNSz()" name="msiz" min="2" max="32" step="2"/>
            <button onClick="panelNewMem()">Set size</button><br>
            New size: <span id="nsz"></span>KB<br>
            <label for="aini">Auto init:</label> <input type="checkbox" id="aini" onChange="panelUpdNSz()" name="aini" ${init}>&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;&nbsp;<label for="32fi">32KB fix:</label> <input type="checkbox" id="32fi" name="32fi" ${fi32}><br><br>
            2KB - Standard MK85<br>6KB - Extended MK85M<br>30KB - Max w/o 32KB fix<br>32KB - Maximal value`;

    tabcont[1][1] = `RAM file: <span id="rfi"></span><br><button onClick="panelSaveRaF()">Save RAM</button>
    <button onClick="panelGetRLS()">Get vars list</button> <button onClick="panelGetBAS()">Get programs</button><br>
    <button onClick="panelLoadRaF()">Load RAM from file</button>: <input type="file" id="ramf" name="ramf" accept=".bin"><br>
    <button onClick="panelLoadBAS()">Load program from file</button>: <input type="file" id="pbasf" name="pbasf" accept=".txt, .bas"><br><br>
    ROM file: <span id="rofi"></span><br><button onClick="panelResetRoF(ROM_int, 'internal')">Reset ROM</button>
    <button onClick="panelResetRoF(ROM_pol, 'internal (PL ROM v27B)')">Load PL ROM v27B</button><br>
    <button onClick="panelLoadRoF()">Load ROM from file</button>: <input type="file" id="romf" name="romf" accept=".bin">`;

    tabcont[2][0] = `<button onClick="panelOpenLay()">Keyboard layout</button> <button onClick="panelOpenCTool()">CHR96 code tool</button><br>
    <button onClick="panelOpenDbg()">Debugger</button>
    <button onClick="panelOpenHelp()">Help</button> <button onClick="panelOpenInfo()">About</button><br>
    <label for="iturb">Force turbo (ign. bit 3 in cpuctrl):</label> <input type="checkbox" onChange="panelSwTurIg()" id="iturb" name="iturb" ${forc}><br>
    <label for="ifrdiv">Ignore frq. div. (bit 11 in cpuctrl):</label> <input type="checkbox" onChange="panelSwDivIg()" id="ifrdiv" name="ifrdiv" ${ign}><br>
    <label for="ipoff">Disable soft poff (bit 12 in cpuctrl):</label> <input type="checkbox" onChange="panelSwDivPo()" id="ipoff" name="ifrdiv" ${ignp}><br>
    <label for="dbgm">Show debug messages in console:</label> <input type="checkbox" onChange="panelSWDbgMsg()" id="dbgm" name="dbgm" ${dbgm}>`;

    tabcont[2][1] = `Speed: <span id="speedstat"></span><br>
    Standard: <input type="number" style="width:80px;" min="100" max="1000000" id="norvl"
    onkeydown="panelOnEnter(this, event.keyCode, panelSetNormSP);" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <label for="norvl">Op/s</label>
    <button onClick="panelSetNormSP()">Set</button> <button onClick="panelResetNormSP()">Reset</button><br>
    Turbo: <input type="number" style="width:80px;" min="100" max="1000000" id="turvl"
    onkeydown="panelOnEnter(this, event.keyCode, panelSetTurSP);" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <label for="turvl">Op/s</label>
    <button onClick="panelSetTurSP()">Set</button> <button onClick="panelResetTurSP()">Reset</button><br>
    <button id="cspm" onClick="panelChangeSP()">Change speed mode</button> <button id="rstm" onClick="panelSetTRB()">Restart in turbo mode</button>`;

    for (let i=0; i < 3; i++){
        const row = document.createElement("tr");
        for (let c=0; c < 2; c++) {
            const td = document.createElement("td");
            td.id = `cl${i}-${c}`;
            //td.style.lineHeight = "1.8";

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
    
        this.timer = setInterval(panelUpdate, 1000);
    }

    pnl.panelStop = function(){
        clearInterval(this.timer);
        this.timer = null;
    }

    return pnl;
}

function panelOnEnter(th, kc, fun) {
    if (kc == 13) {
        th.blur();
        fun();
    }
}

function panelLoadBAS() {
    const pbasf = document.getElementById("pbasf").files[0];

    if (typeof pbasf == "undefined") {
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        function powerdev(msg) {
            var finmsg = `${msg}\n\nProcessed ${processed} program${(processed != 1) ? "s" : ""}.`;

            if (stored.length > 0) {
                finmsg+=`\nStored at number${(stored.length != 1) ? "s" : ""}: `+stored.join(", ")+".";
            }

            alert(finmsg);

            RAM = TRAM;
            window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));

            if (POWER) {
                MK85CPU = new CPU();
                startEmu();
                panelUpdate();
                if (document.getElementById("mk85_dbg_int").style.display == "") {
                    debugUpdate();
                }
            }
        }

        if (POWER) {
            LCD.stopAnimating();
            LCD.clearScreen();
            if (stopped) {
                panelUnStop();
            }
        }

        var TRAM = new Uint8Array(RAM);
        var LINES = (new TextDecoder()).decode(reader.result).split('\n');
        var strnum = 1;
        var processed = 0;
        var stored = [];

        do {
            var PRGBUF = new Uint8Array(RAM.length);
            var PRGPTR = 0;
            var np = 0;
            var pnum = -1;
            var tstart = 0x22C;
            var prevlin = 0;

            while (LINES.length > 0) {
                var chkl = LINES[0].trim();
                if (pnum == -1) {
                    var pospnum = chkl.toLowerCase().indexOf("program ")
                    
                    if (pospnum != -1) {
                        pnum = Number(chkl[pospnum+8]);

                        if (isNaN(pnum)) {
                            powerdev(`Failed to parse program number at line ${strnum}!`);
                            return;
                        }
                    }
                }

                if (!isNaN(Number(chkl[0]))) {
                    break;
                }
                
                strnum++;
                LINES.shift();
            }

            var preend = 0x826B;
            if (pnum == -1) {
                for (let i=0; i<10; i++) {
                    var tend = (((TRAM[tstart+(i*2)+1] & 0xFF) << 8) | (TRAM[tstart+(i*2)] & 0xFF));
                    if (preend == tend) {
                        pnum = i;
                        break;
                    }
                    preend = tend;
                }
                if (pnum == -1) {
                    powerdev(`There are no empty programs in memory, clear one of them!`);
                    return;
                }
            }
            else {
                if (pnum > 0) {
                    preend = (((TRAM[tstart+((pnum-1)*2)+1] & 0xFF) << 8) | (TRAM[tstart+((pnum-1)*2)] & 0xFF));
                }
                if (preend != (((TRAM[tstart+(pnum*2)+1] & 0xFF) << 8) | (TRAM[tstart+(pnum*2)] & 0xFF))) {
                    powerdev(`Program ${pnum} already exists, clear it or specify another one!`);
                    return;
                }
            }

            while (LINES.length > 0) {
                var trstr = LINES[0].trim();

                if (trstr.length == 0) {
                    np++;
                    LINES.shift();
                    if (np == 2) {
                        break;
                    }
                    continue;
                }
                else {
                    np = 0;
                }

                var status = bas_parser(PRGBUF, PRGPTR, trstr, prevlin);

                if (typeof status == "string") {
                    powerdev(`Failed to convert code at line ${strnum}: `+status);
                    return;
                }
                else {
                    PRGPTR = status[0];
                    prevlin = status[1];
                }

                strnum++;
                LINES.shift();
            }

            if (PRGPTR > 0) {

                var allocvars = (((TRAM[0x251] & 0xFF) << 8) | (TRAM[0x250] & 0xFF));
                var topram = (((TRAM[0x253] & 0xFF) << 8) | (TRAM[0x252] & 0xFF));
                var basend = (((TRAM[0x23F] & 0xFF) << 8) | (TRAM[0x23E] & 0xFF));

                var free = (topram-basend-(allocvars<<3)) & 0xFFFF;

                if (free < PRGPTR) {
                    powerdev(`Not enough space to store program ${pnum}.\nClear some data or expand RAM image!`);
                    return;
                }

                var cpaddr = (((TRAM[tstart+(pnum*2)+1] & 0xFF) << 8) | (TRAM[tstart+(pnum*2)] & 0xFF))-0x8000;
                var eaddr = basend-0x8000;
                var newaddr = cpaddr + PRGPTR;

                if (cpaddr < basend) {
                    const shiftmem = TRAM.subarray(cpaddr, eaddr);
                    TRAM.set(shiftmem, newaddr);
                }

                TRAM.set(PRGBUF.subarray(0, PRGPTR), cpaddr);

                for (let i=pnum; i<10;i++) {
                    var addr = (((TRAM[tstart+(i*2)+1] & 0xFF) << 8) | (TRAM[tstart+(i*2)] & 0xFF)) + PRGPTR;
                    TRAM[tstart+(i*2)+1] = (addr>>8) & 0xFF;
                    TRAM[tstart+(i*2)] = addr & 0xFF;
                }

                processed++
                stored.push(pnum);
            }

            if (LINES.length == 0) {
                break;
            }
        } while (processed < 10);

        powerdev("All programs processed successfully!");
    };

    reader.readAsArrayBuffer(pbasf);
}

function panelGetBAS() {
    if (POWER && !stopped) {
        LCD.stopAnimating();
    }

    var resf = "-=MK85 BASIC programs=-";

    var offset = 0x022C;
    var prsta = 0x826B;
    var lim = prsta;
    var bprogst = [];

    for (let i = 0; i<10; i++) {
        var adr = (((RAM[offset+1] & 0xFF) << 8) | (RAM[offset] & 0xFF));
        if (adr < lim) {
            alert("Falied to get BASIC programs: bad RAM");
            return;
        }

        bprogst.push(adr);
        lim = adr;
        offset+=2;
    }

    var ps = 0;
    var b1 = 0;
    var b2;
    var offset = 0x026B;
    var quot = false;
    var comm = false; 

    for (let p = 0; p<10; p++) {
        if (prsta < bprogst[p]) {
            resf+= `\n\n-[Program ${p}]-\n`;
        }
        while (prsta < bprogst[p])
        {
        b2 = b1;
        b1 = (RAM[offset] & 0xFF);
        switch (ps)
        {
            case 0:		/* first byte of the line number */
            ps++;
            break;
            case 1:		/* second byte of the line number */
            resf+= (((b1 & 0xFF) << 8) | (b2 & 0xFF)) + " ";
            ps++;
            break;
            default:
            if (b1 == 0)
            {
                resf+="\n";
                quot = false;
                comm = false;
                ps = 0;	/* line number expected */
            }
            else if (b1 == 0x5C && (!(quot || comm)))
            {
                resf+="!=";
            }
            else if (b1 == 0x5E && (!(quot || comm)))
            {
                resf+="^";
            }
            else if (b1 == 0x5F && (!(quot || comm)))
            {
                resf+="<=";        
            }
            else if (b1 == 0x7B && (!(quot || comm)))
            {
                resf+="E";
            }
            else if (b1 == 0x7C && (!(quot || comm)))
            {
                resf+="PI";
            }
            else if (b1 == 0x7D && (!(quot || comm)))
            {
                resf+="E-";
            }
            else if (b1 == 0x7D)
            {
                resf+="ᵉ⁻";
            }
            else if (b1 == 0x7E && (!(quot || comm)))
            {
                resf+=">=";
            }
            else if (b1 == 0x21) {
                resf+="!";
                comm = true;
            }
            else if (b1 == 0x22) {
                if ((!quot) || (b2 != 0x60)) {
                    resf+="\"";
                }
                quot = !quot;
            }
            else if (b1 == 0x60) {
                if (b2 == 0x22) {
                    resf = resf.slice(0, -1); 
                }
                else if (b2 == 0x60) {
                    resf+= "+"
                }
                else {
                    resf+= "\"+"
                }
                resf+="CHR 96"
                if (quot) {
                    var b3 = (RAM[offset+1] & 0xFF);
                    if ((b3 != 0x22) && (b3 != 0x60)) {
                        resf+= "+\""
                    }
                }
            }
            else if ((b1 < 0xC0) && (CCODES[b1] == "|"))
            {
                resf+=SUCODES[b1-1];
            }
            else if (b1 < 0xC0)
            {
                resf+=CCODES[b1];
            }
            else if (b1 < 0xF2)
            {
                resf+=TOKENS[b1 - 0xC0];
            }
            else
            {
                resf+=`{0x${b1.toString(16)}}`;
            }
            break;
        }
        offset++;
        prsta++;
        }
    }

    var dwbas = document.getElementById("dwbas");
    dwbas.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(resf);
    dwbas.click();

    if (POWER && !stopped) {
        LCD.animate(LCD_ANIMSPEED);
    }
}

function panelGetRLS() {
    if (POWER && !stopped) {
        LCD.stopAnimating();
    }

    var allocvars = (((RAM[0x251] & 0xFF) << 8) | (RAM[0x250] & 0xFF));
    var topram = (((RAM[0x253] & 0xFF) << 8) | (RAM[0x252] & 0xFF));
    var offset = 0x014E

    var resf = `-=MK 85 variables list=-\n\nAllocated variables: ${allocvars}\n\nNon-zero variables:\n`;

    resf += "$ = " + sv2str (offset, 30) + "\n";

    if (0x826B + 8*allocvars > topram)
        {
          alert("Falied to get variables list: bad RAM");
          return;
        }

    offset = topram - 8*allocvars - 0x8000;

    while (allocvars-- != 0){
        if ((RAM[offset] == 0) && RAM[offset+1] == 0) {
            offset+=8;
            continue;
        }

        var isnum = ((RAM[offset+1] & 0x60) == 0);

        if (allocvars >= 26) {
              resf+= `Z(${allocvars-25})${(isnum ? "" : "$")} = `;
        }
        else {
              resf+= String.fromCharCode(65+allocvars) + (isnum ? "" : "$") + " = ";
        }

        if (isnum){
            resf+= fp2str (offset, -10) + "\n";
        }
        else{
            resf+= sv2str (offset, 8) + "\n";
        }
        offset+=8;
    }

    var dwvar = document.getElementById("dwvar");
    dwvar.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(resf);
    dwvar.click();

    if (POWER && !stopped) {
        LCD.animate(LCD_ANIMSPEED);
    }
}

function panelOpenCTool() {
    const hidp = document.getElementById("mk85_ch96_int");
    hidp.style.display = (hidp.style.display == "none") ? "" : "none";
    document.getElementById("mk85_ch96_br").style.display = hidp.style.display;
}

function panelOpenHelp() {
    window.open(`${BASEPATH}/help/help.html`,'85_helpWindow', `toolbar=no, location=no, status=no, menubar=no,
        scrollbars=no, resizable=no, width=820, height=660`)
}

function panelOpenDbg() {
    const hidp = document.getElementById("mk85_dbg_int");
    hidp.style.display = (hidp.style.display == "none") ? "" : "none";
    document.getElementById("mk85_dbg_br").style.display = hidp.style.display;
    var active = (!stopped && POWER);
    if (hidp.style.display == "" && active) {
        DBG.debugStart();
    }
    else if (hidp.style.display == "" && !active) {
        debugUpdate();
        debugUpdRegIn();
    }
    else{
        DBG.debugStop();
    }
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

    if ((document.getElementById("aini").checked != true) || (rangval < 32)) {
        document.getElementById("32fi").disabled = true;
    }
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
    var nval = Number(document.getElementById("turvl").value);

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
    var nval = Number(document.getElementById("norvl").value);

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


function panelSwDivPo() {
    ignorePowerOff = document.getElementById("ipoff").checked;
    MK85CPU.ignorePowerOff = ignorePowerOff;
    window.localStorage.setItem('mk_ignorepoff', ignorePowerOff);
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
    panelUpdate();
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

function panelUnStop() {
    PAN.panelStart();
    if (document.getElementById("mk85_dbg_int").style.display == "") {
        DBG.debugStart();
    }
    document.getElementById("stst").innerText="Pause";
    document.getElementById("dstst").innerText="Pause";

    document.getElementById("dbst").disabled = true;
    document.getElementById("dbsts").disabled = true;
    document.getElementById("dbbr").disabled = true;
    document.getElementById("stps").disabled = true;
    document.getElementById("brkp").disabled = true;
    document.getElementById("regist").disabled = true;
    document.getElementById("reged").disabled = true;
    document.getElementById("edreg").disabled = true;
    
    document.getElementById("disu").disabled = true;
    document.getElementById("dispu").disabled = true;
    document.getElementById("disgo").disabled = true;
    document.getElementById("disgob").disabled = true;
    document.getElementById("dispd").disabled = true;
    document.getElementById("disd").disabled = true;
    document.getElementById("disr").disabled = true;
    document.getElementById("dised").disabled = true;
    document.getElementById("diss").disabled = true;
    stopped = false;
}

function panelResetRoF(rconst, name) {
    //PAN.panelStop();
    if (POWER) {
        LCD.stopAnimating();
        LCD.clearScreen();
        if (stopped) {
            panelUnStop();
        }
    }

    romname = name;
    window.localStorage.removeItem('mk_rom');
    window.localStorage.removeItem('mk_romname');
    document.getElementById("rofi").innerText = romname;

    usePlRom = (name == 'internal (PL ROM v27B)');
    window.localStorage.setItem('mk_polrom', usePlRom);

    ROM = new Uint8Array(rconst); // Internal ROM image constant (factory / piotr)

    if (POWER) {
        MK85CPU = new CPU();
        startEmu();
        panelUpdate();
        if (document.getElementById("mk85_dbg_int").style.display == "") {
            debugUpdate();
        }
    }
    //PAN.panelStart();
}

function panelLoadRoF(){
    const romf = document.getElementById("romf").files[0];

    if (typeof romf == "undefined") {
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        //console.log(reader.result)

        //PAN.panelStop();
        if (POWER) {
            LCD.stopAnimating();
            LCD.clearScreen();
            if (stopped) {
                panelUnStop();
            }
        }

        ROM = new Uint8Array(reader.result);

        ROMbou();

        romname = romf.name;
        window.localStorage.setItem('mk_rom', btoa(String.fromCharCode.apply(null, ROM)));
        window.localStorage.setItem('mk_romname', romname);
        document.getElementById("rofi").innerText = romname;

        if (POWER) {
            MK85CPU = new CPU();
            startEmu();
            panelUpdate();
            if (document.getElementById("mk85_dbg_int").style.display == "") {
                debugUpdate();
            }
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

    const reader = new FileReader();

    reader.onload = function() {
        //console.log(reader.result)

        //PAN.panelStop();
        if (POWER) {
            LCD.stopAnimating();
            LCD.clearScreen();
            if (stopped) {
                panelUnStop();
            }
        }

        RAM = new Uint8Array(reader.result);

        RAMbou();

        ramname = ramf.name;
        window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
        window.localStorage.setItem('mk_ramname', ramname);
        document.getElementById("rfi").innerText = ramname;
        document.getElementById("mktype").setAttributeNS(null, "opacity", (RAM.length > 2048 ? 0 : 1));
        panelCalcRAM();

        if (POWER) {
            MK85CPU = new CPU();
            startEmu();
            panelUpdate();
            if (document.getElementById("mk85_dbg_int").style.display == "") {
                debugUpdate();
            }
        }
        //PAN.panelStart();
    };

    reader.readAsArrayBuffer(ramf);
}

function panelSwOverlay() {
    var opacity = (document.getElementById("lay").checked == true) ? 1 : 0;

    for (let i=1; i < 4; i++){
        document.getElementById(`ovl${i}`).setAttributeNS(null, "opacity", opacity);
    }
}

function panelDevRestart() {
    //PAN.panelStop();
    LCD.stopAnimating();
    LCD.clearScreen();

    if (stopped) {
        panelUnStop();
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
        document.getElementById("dstst").innerText="Pause";
        if (document.getElementById("mk85_dbg_int").style.display == "") {
            DBG.debugStart();
        }
    }
    else {
        PAN.panelStop();
        LCD.stopAnimating();
        document.getElementById("stst").innerText="Resume";
        document.getElementById("dstst").innerText="Resume";
        if (document.getElementById("mk85_dbg_int").style.display == "") {
            DBG.debugStop();
            debugUpdRegIn();
            debugUpdate();
        }
        
    }

    document.getElementById("dbst").disabled = !stopped;
	document.getElementById("dbsts").disabled = !stopped;
	document.getElementById("dbbr").disabled = !stopped;
    document.getElementById("stps").disabled = !stopped;
    document.getElementById("brkp").disabled = !stopped;
    document.getElementById("regist").disabled = !stopped;
    document.getElementById("reged").disabled = !stopped;
    document.getElementById("edreg").disabled = !stopped;

    document.getElementById("disu").disabled = !stopped;
    document.getElementById("dispu").disabled = !stopped;
    document.getElementById("disgo").disabled = !stopped;
    document.getElementById("disgob").disabled = !stopped;
    document.getElementById("dispd").disabled = !stopped;
    document.getElementById("disd").disabled = !stopped;
    document.getElementById("disr").disabled = !stopped;
    document.getElementById("dised").disabled = !stopped;
    document.getElementById("diss").disabled = !stopped;
}

function panelUpdNSz() {
	if (document.getElementById("nci").checked==true) {
		document.getElementById("msiz").value = 34;
    	document.getElementById("nsz").innerText = 34;
		document.getElementById("msiz").disabled = true;
		document.getElementById("32fi").disabled = true;
	}
	else {
		document.getElementById("msiz").disabled = false;
    	var msiz = document.getElementById("msiz").value
	    document.getElementById("nsz").innerText = msiz;
    	document.getElementById("32fi").disabled =
        	((document.getElementById("aini").checked != true) || (msiz < 32)) ? true : false;
	}
}

function panelNewMem(){
    //PAN.panelStop();
    if (POWER) {
        LCD.stopAnimating();
        LCD.clearScreen();
        if (stopped) {
            panelUnStop();
        }
    }
    var nmemsiz = document.getElementById("msiz").value
    RAM = new Uint8Array((nmemsiz*1024));
    document.getElementById("csz").innerText = nmemsiz;
    window.localStorage.removeItem('mk_ramname');
    ramname = "internal";
    document.getElementById("rfi").innerText = ramname;
    document.getElementById("mktype").setAttributeNS(null, "opacity", (RAM.length > 2048 ? 0 : 1));

    if (!POWER && document.getElementById("aini").checked == true) {
        document.getElementById("swi").setAttributeNS(null, "opacity", 0);
        document.getElementById("stst").disabled = false;
	    document.getElementById("rst").disabled = false;
        document.getElementById("dstst").disabled = false;
	    document.getElementById("drst").disabled = false;
        document.getElementById("cspm").disabled = false;
	    document.getElementById("rstm").disabled = false;
        POWER = true;
        MK85CPU = new CPU();
        startEmu();
        PAN.panelStart();
        ramAutoInit();
        if ((document.getElementById("32fi").checked == true) && (nmemsiz == 32)){
            setTimeout(function () {
                RAM[0x252] = 0xFE;
                RAM[0x253] = 0xFF;
                window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
            }, 200)
        }
    }
    else if (POWER) {
        MK85CPU = new CPU();
        startEmu();
        if (document.getElementById("aini").checked == true){
            ramAutoInit();
            if ((document.getElementById("32fi").checked == true) && (nmemsiz == 32)){
                setTimeout(function () {
                    RAM[0x252] = 0xFE;
                    RAM[0x253] = 0xFF;
                    window.localStorage.setItem('mk_ram', btoa(String.fromCharCode.apply(null, RAM)));
                }, 200)
            }
        }
        panelUpdate();
        if (document.getElementById("mk85_dbg_int").style.display == "") {
            debugUpdate();
        }
        
    }
    //PAN.panelStart();
}

function panelUpdate(){
    var allocvars = (((RAM[0x251] & 0xFF) << 8) | (RAM[0x250] & 0xFF));
    var topram = (((RAM[0x253] & 0xFF) << 8) | (RAM[0x252] & 0xFF));
    var basend = (((RAM[0x23F] & 0xFF) << 8) | (RAM[0x23E] & 0xFF));

    document.getElementById("fbm").innerText= (topram-basend-(allocvars<<3) & 0xFFFF);
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