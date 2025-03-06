// Debugger module
// Debugger panel with a lot of functions to operate with RAM, CPU registers, disassembled code,
// control execution process (single step, multiple steps, breakpoint)

// 2024 (c) Bs0Dd

var ISWORD = false;
var RAMOCT = false;
var REGOCT = false;
var DISOCT = false;
var RAMSTA = 0x8000;
var RAMADDR = RAMSTA;
var RAMLIM = 0xFFFF;

var ROMSTA = 0x0000;
var DISADDR = ROMSTA;
var DISADDRS = DISADDR;

var LASTPC = 0x0000;

function DBGTOOL() {
    const tab = document.createElement("table");
    tab.id = "mk85_dbg_int";
    tab.style.display = "none";

    var tabcont = [];

    tabcont[0] = `<span style="font-style:italic;">&nbsp;&nbsp;Disassembly:</span><br>
    <div style="text-align:center">
    <input type="radio" name="disoct" id="dishex" onchange="DISOCT=false;debugSetDisV();debugUpdate();" checked><label for="dishex">Hexadecimal</label>
    <input type="radio" name="disoct" id="disoct" onchange="DISOCT=true;debugSetDisV();debugUpdate();"><label for="disoct">Octal</label></div>
    <table style="border-collapse:collapse;width:240px;margin-left:auto;margin-right:auto;border: solid 1px black;font-family:monospace, monospace;line-height:1;
    margin-top:5px;margin-bottom:5px;font-size:12px;">
    <tr><td style="width:0;padding-right:5px;" onclick="debugDisClick(this);" id="dis0a"><td onclick="debugDisClick(this);" id="dis0"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis1a"><td onclick="debugDisClick(this);" id="dis1"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis2a"><td onclick="debugDisClick(this);" id="dis2"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis3a"><td onclick="debugDisClick(this);" id="dis3"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis4a"><td onclick="debugDisClick(this);" id="dis4"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis5a"><td onclick="debugDisClick(this);" id="dis5"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis6a"><td onclick="debugDisClick(this);" id="dis6"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis7a"><td onclick="debugDisClick(this);" id="dis7"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis8a"><td onclick="debugDisClick(this);" id="dis8"></td></tr>
    <tr><td onclick="debugDisClick(this);" id="dis9a"><td onclick="debugDisClick(this);" id="dis9"></td></tr>
    </table>
    <div style="text-align:center;line-height:1.7;">
    <button disabled id="disu" onclick="debugDisU();debugUpdate();"><b>U</b></button>
    <button disabled id="dispu" onclick="debugDisPgU();"><b>PgU</b></button> 
    |<input disabled style="width:50px;" maxlength="4" oninput="debugValidInput(this, DISOCT)"
    onkeydown="panelOnEnter(this, event.keyCode, debugGoDis);" id="disgo" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <button disabled id="disgob" onclick="debugGoDis();"><b>Go</b></button>|
    <button disabled id="dispd" onclick="debugDisPgD();"><b>PgD</b></button>
    <button disabled id="disd" onclick="debugDisD();debugUpdate();"><b>D</b></button><br>
    <button disabled id="disr" onclick="debugDisRead();"><b>Read</b></button>
    <input disabled style="width:160px;" maxlength="28"
    onkeydown="panelOnEnter(this, event.keyCode, debugDisSet);" id="dised" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <button disabled id="diss" onclick="debugDisSet();"><b>Set</b></button>
    </div>`


    tabcont[1] = `<span style="font-style:italic;">&nbsp;&nbsp;Registers:</span><br>
    <div style="margin-top:5px;margin-bottom:5px;text-align:center;">
    <input type="radio" name="regoct" id="reghex" onchange="REGOCT=false;debugSetRegV();debugUpdate();" checked><label for="reghex">Hexadecimal</label>
    <input type="radio" name="regoct" id="regoct" onchange="REGOCT=true;debugSetRegV();debugUpdate();"><label for="regoct">Octal</label></div>
    <div style="font-size:13px;margin:5px;">
    <table style="width:100%;">
    <tr><td id="dr0" onclick="debugRegClick(this);">R0: <span id="dbgr0">0000</span></td> <td id="dr4" onclick="debugRegClick(this);">R4: <span id="dbgr4">0000</span></td></tr>
    <tr><td id="dr1" onclick="debugRegClick(this);">R1: <span id="dbgr1">0000</span></td> <td id="dr5" onclick="debugRegClick(this);">R5: <span id="dbgr5">0000</span></td></tr>
    <tr><td id="dr2" onclick="debugRegClick(this);">R2: <span id="dbgr2">0000</span></td> <td id="dr6" onclick="debugRegClick(this);">R6 (SP): <span id="dbgr6">0000</span></td></tr>
    <tr><td id="dr3" onclick="debugRegClick(this);">R3: <span id="dbgr3">0000</span></td> <td id="dr7" onclick="debugRegClick(this);">R7 (PC): <span id="dbgr7">0000</span></td></tr>
    <tr><td id="dr8" onclick="debugRegClick(this);" colspan="2">PSW: <span id="dbgrp" style="font-family:monospace, monospace;"></span>
    (<span id="dbgrph"></span>)</td></tr>
    </table><br>
    &nbsp;<span id="dr9" onclick="debugRegClick(this);">CPUC: <span id="dbgprc"></span></span><br>
    &nbsp;<span id="drA" onclick="debugRegClick(this);">PP: <span id="dbgkport"></span></span><br>
    &nbsp;KEYB: <span id="dbgkb"></span><br>
    </div>`

    tabcont[2] = `<table id="dbg_actions" style="width:100%;">
        <tr><td><span style="font-size:14px;font-style:italic;">Execution control:</span><br>
        <button id="dstst" onClick="panelSwState()">Pause</button>
        <button id="drst" onClick="panelDevRestart()">Restart</button> ||
        <button id="dbcl" onClick="panelOpenDbg()">Close</button></td></tr>
        <tr><td><label style="font-size:14px;font-style:italic;" for="stps">Decimal number of steps:</label><br>
        <input disabled  type="number" style="width:80px;" value="1" min="1" max="1000000"
        onkeydown="panelOnEnter(this, event.keyCode, debugSteps);" id="stps" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
        <button id="dbsts" onClick="debugSteps()" disabled>Execute</button>
        <button id="dbst" onClick="debugStep()" disabled>Single</button></td></tr>
        <tr><td><label style="font-size:14px;font-style:italic;" for="brkp">Set breakpoint on <span id="adrt">hex</span> address:</label><br>
        <input disabled  style="width:50px;" id="brkp" value="0000" maxlength="4"
        onkeydown="panelOnEnter(this, event.keyCode, debugBreakp);" oninput="debugValidInput(this, REGOCT)" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
        <button id="dbbr" onClick="debugBreakp()" disabled>Set & run</button>
        <button id="dbclb" onClick="debugClearB()">Clear</button></td></tr>
        <tr><td><label style="font-size:14px;font-style:italic;" for="stps">Change register value (<span id="regtp">hex</span>):</label><br>
        <select id="regist" name="regist" disabled onchange="debugUpdRegIn();var reged = document.getElementById('reged');
        reged.focus();reged.setSelectionRange(0, 10);">  
            <option value="R0">R0</option>
            <option value="R1">R1</option>
            <option value="R2">R2</option>
            <option value="R3">R3</option>
            <option value="R4">R4</option>
            <option value="R5">R5</option>
            <option value="R6">R6 (SP)</option>
            <option value="R7">R7 (PC)</option>
            <option value="PSW">PSW</option>
            <option value="CPUCTRL">CPUCTRL</option>
            <option value="PP">PP</option>
        </select>  
        <input disabled style="width:50px;" value="0000" maxlength="4" onkeydown="panelOnEnter(this, event.keyCode, debugEditReg);"
        oninput="debugValidInput(this, REGOCT)" id="reged" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
        <button id="edreg" onClick="debugEditReg()" disabled>Change</button></td></tr></table>`

    const row = document.createElement("tr");
    for (let i=0; i < 3; i++) {
        const td = document.createElement("td");
        td.id = `dcl${i}`;

        if (typeof tabcont[i] != "undefined") {
            td.innerHTML = tabcont[i];
        }

        if (i == 2) {
            td.style.width = "240px";
        }
        else if (i == 1) {
            td.style.width = "230px";
            td.style.verticalAlign = "top";
        }

        row.appendChild(td);
    }
    tab.appendChild(row);

    const row2 = document.createElement("tr");
    const td2 = document.createElement("td");
    td2.innerHTML = `<span style="font-style:italic;">&nbsp;&nbsp;RAM editor:</span>
    <input type="radio" name="ramtyp" id="rambyte" onchange="debugSetByte();debugUpdate();" checked><label for="rambyte">Byte</label>
    <input type="radio" name="ramtyp" id="ramword" onchange="debugSetWord();debugUpdate();"><label for="ramword">Word</label>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <input type="radio" name="ramoct" id="ramhex" onchange="RAMOCT=false;debugSetRamV();debugUpdate();" checked><label for="ramhex">Hexadecimal</label>
    <input type="radio" name="ramoct" id="ramoct" onchange="RAMOCT=true;debugSetRamV();debugUpdate();"><label for="ramoct">Octal</label>`;
    td2.colSpan = 3;
    td2.id = `dcl3`;

    const ramtab = document.createElement("table");
    ramtab.style.border = "solid black 1px";
    ramtab.style.fontFamily = "monospace, monospace";
    ramtab.style.marginLeft = "auto";
    ramtab.style.marginRight = "auto";
    ramtab.style.marginTop = "10px";
    ramtab.style.marginBottom = "10px";
    ramtab.style.fontSize = "14px";
    td2.appendChild(ramtab);

    const adrsr = document.createElement("tr");
    const adrsd = document.createElement("td");
    const adrstab = document.createElement("table");
    adrsd.appendChild(adrstab);
    adrsr.appendChild(adrsd);
    ramtab.appendChild(adrsr);

    for (let i=0; i < 10; i++) {
        const ar = document.createElement("tr");
        const ad = document.createElement("td");

        ad.id=`adr-${i}`;
        //ad.innerText=(0x8000+(0x10*i)).toString(16).toUpperCase()+":";
        ar.appendChild(ad);
        adrstab.appendChild(ar);
    }

    const hexd = document.createElement("td");
    const hextab = document.createElement("table");
    hextab.style.paddingLeft = "5px";
    hexd.appendChild(hextab);
    adrsr.appendChild(hexd);

    const ascd = document.createElement("td");
    const asctab = document.createElement("table");
    asctab.style.paddingLeft = "10px";
    asctab.style.borderSpacing = "0px 2px";
    //asctab.style.fontSize = "15px";
    ascd.appendChild(asctab);
    adrsr.appendChild(ascd);

    for (let i=0; i < 10; i++) {
        const tr = document.createElement("tr");
        const tra = document.createElement("tr");
        for (let c=0; c < 16; c++) {
            const td = document.createElement("td");
            const tda = document.createElement("td");
            td.id = `hexc-${i}-${c}`;
            tda.id = `ascc-${i}-${c}`;
            if (c == 7) {
                td.style.paddingRight = "5px";
                tda.style.paddingRight = "5px";
            }
            else if (c == 8) {
                td.style.paddingLeft = "5px";
                tda.style.paddingLeft = "5px";
            }
            //tda.innerText = "A";

            td.onclick = function() {
                if (this.innerText == "") {
                    return;
                }

                const i = Number(this.id[5]);
                const c = Number(this.id.substring(7));
                var addr = ((RAMADDR-RAMSTA)+c+(i*0x10));

                if (ISWORD && (addr % 2 !=0)) {
                    addr--;
                }

                document.getElementById("ramcha").value = HexOrOct(addr+RAMSTA, RAMOCT);
                const ramch = document.getElementById("ramch");
                if (ISWORD) {
                    var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
                    ramch.value = HexOrOct(word, RAMOCT);
                }
                else {
                    ramch.value = HexOrOct(RAM[addr], RAMOCT, true);
                }
                ramch.focus();
                ramch.setSelectionRange(0, 10);
            }

            tda.onclick = td.onclick;

            tr.appendChild(td);
            tra.appendChild(tda);
        }
        hextab.appendChild(tr);
        asctab.appendChild(tra);
    }

    const conttab = document.createElement("div");
    conttab.style.border = "solid black 1px";
    conttab.style.marginBottom = "10px";
    conttab.style.marginLeft = "auto";
    conttab.style.marginRight = "auto";
    conttab.style.width = "450px";
    conttab.style.textAlign = "center";
    conttab.style.padding = "5px";
    conttab.style.lineHeight = "200%";
    td2.appendChild(conttab);

    conttab.innerHTML = `<button onclick="debugShiftL();"><b>&lt;-</b></button>
    <button onclick="if ((RAMADDR-0x10) >= RAMSTA){RAMADDR-=0x10;debugDrawRamAddr();debugUpdate();}"><b>Up</b></button>
    <button onclick="if ((RAMADDR-0xA0) >= RAMSTA){RAMADDR-=0xA0;debugDrawRamAddr();debugUpdate();}"><b>Page Up</b></button> |
    <input style="width:50px;" value="0000" maxlength="4" onkeydown="panelOnEnter(this, event.keyCode, debugGoRam);"
    oninput="debugValidInput(this, RAMOCT)" id="ramgo" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <button onclick="debugGoRam();"><b>Go</b></button> |
    <button onclick="if (((RAMADDR+0xA0) < (RAM.length+RAMSTA)) && ((RAMADDR+0xA0) < RAMLIM-0x8F)){RAMADDR+=0xA0;debugDrawRamAddr();debugUpdate();}"><b>Page Down</b></button>
    <button onclick="if (((RAMADDR+0x10) < (RAM.length+RAMSTA)) && ((RAMADDR+0x10) < RAMLIM-0x8F)){RAMADDR+=0x10;debugDrawRamAddr();debugUpdate();}"><b>Down</b></button>
    <button onclick="debugShiftR();"><b>-&gt;</b></button><br>
    Address: <input style="width:50px;" value="0000" maxlength="4" onkeydown="panelOnEnter(this, event.keyCode, debugReadMem);"
    oninput="debugValidInput(this, RAMOCT)" id="ramcha" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    Value: <input style="width:50px;" value="0000" maxlength="2" onkeydown="panelOnEnter(this, event.keyCode, debugChangeMem);"
    oninput="debugValidInput(this, RAMOCT)" id="ramch" onfocus="panelEditFocus()" onblur="panelEditNoFocus()">
    <button onclick="debugReadMem();"><b>Read</b></button>
    <button onclick="debugChangeMem();"><b>Change</b></button>`;

    row2.appendChild(td2);
    tab.appendChild(row2);

    tab.debugStart = function() {
        debugUpdate();
        debugDrawRamAddr();
        this.timer = setInterval(debugUpdate, 1000);
    }

    tab.debugStop = function() {
        clearInterval(this.timer);
        this.timer = null;
        debugUpdate();
        debugDrawRamAddr();
    }

    return tab;
}

function debugDisSet() {
    var cmd = document.getElementById("dised").value;
    if (cmd == "") {
        return;
    }

    INBUF = cmd;
   
    const disgo = document.getElementById("disgo");
    var val = disgo.value;
    if (val == "") {
        debugUpdate();
        val = disgo.value;
    }
    val = parseInt(val, DISOCT ? 8 : 16);

    if (((val >= (ROM.length+ROMSTA)) && (val < RAMSTA)) || (val >= (RAM.length+RAMSTA))) {
        return;
    }

    if (val > 0xFFFE) {
        val = 0xFFFE;
        disgo.value = HexOrOct(val, DISOCT);
    }
    else if (val % 2 != 0) {
        val--;
        disgo.value = HexOrOct(val, DISOCT);
    }

    DISADDR = val;

    var statusstr = Assemble();
    if (ININDEX == 0) {
        for (let i=0; i < OUTINDEX; i++) {
            StoreWord(OUTBUF[i]);
        }
        debugUpdate();
    }
    else {
        alert("Failed to assemble operation: "+statusstr);
    }
}

function debugRegClick(obj) {
    if (!stopped) {
        return;
    }

    var numr = parseInt(obj.id[2], 16);
    var regsel = document.getElementById("regist");

    if (numr < 8) {
        regsel.value = "R"+numr;
    }
    else if (numr == 8) {
        regsel.value = "PSW";
    }
    else if (numr == 9) {
        regsel.value = "CPUCTRL";
    }
    else if (numr == 10) {
        regsel.value = "PP";
    }

    debugUpdRegIn();
    var reged = document.getElementById("reged");
    reged.focus();
    reged.setSelectionRange(0, 10);
}

function debugDisClick(obj) {
    if (POWER && !stopped) {
        return;
    }

    var adrcell = obj;
    if (obj.id[obj.id.length-1] != "a") {
        adrcell = document.getElementById(obj.id+"a")
    }

    document.getElementById("disgo").value = adrcell.innerText.substring(0, adrcell.innerText.length-1);

    debugDisRead();
}

function debugDisRead() {
    const disgo = document.getElementById("disgo");
    var val = disgo.value;
    if (val == "") {
        debugUpdate();
        val = disgo.value;
    }
    val = parseInt(val, DISOCT ? 8 : 16);

    if (val > 0xFFFE) {
        val = 0xFFFE;
        disgo.value = HexOrOct(val, DISOCT);
    }
    else if (val % 2 != 0) {
        val--;
        disgo.value = HexOrOct(val, DISOCT);
    }

    DISADDR = val;

    if (((DISADDR >= (ROM.length+ROMSTA)) && (DISADDR < RAMSTA)) || (DISADDR >= (RAM.length+RAMSTA))) {
        document.getElementById("dised").value = "";
        return;
    }

    var dised = document.getElementById("dised")
    dised.value = debugDisOpStep();
    dised.focus();
    dised.setSelectionRange(0, 50);
}

function debugDisOpStep() {
    const opcode = FetchWord();
    const index = ScanMnemTab(opcode);
    const c = ((opcode & 0x8000) == 0) ? "" : "b";
    return (Mnemonic(index, c)+" "+Arguments(index, opcode));
    //console.log(Mnemonic(index, c), Arguments(index, opcode));
}

function debugDisPgU() {
    for (let r=0; r < 10; r++) {
        debugDisU();
    }
    debugUpdate();
}

function debugDisU() {

    var i = 6;
    for (; i>2; i-=2) {
        DISADDR = DISADDRS-i;
        if (DISADDR < 0x0000) {
            continue;
        }
        debugDisOpStep();
        //console.log(i, DISADDRS, DISADDR);
        if (DISADDR == DISADDRS) {
            break;
        }
    }

    if (DISADDRS-i < 0x0000) {
        return;
    }

    //console.log("Predicted op len:", i);
    DISADDRS -= i;
}

function debugDisPgD() {
    for (let r=0; r < 10; r++) {
        debugDisD();
    }
    debugUpdate();
}

function debugDisD() {
    DISADDR = DISADDRS;
    debugDisOpStep();
    if (DISADDR <= 0xFFFE) {
        DISADDRS = DISADDR;
    }
}

function debugSetDisV() {
    const disgo = document.getElementById("disgo");
    disgo.maxLength = DISOCT ? 6 : 4;
    disgo.value = HexOrOct(DISADDRS, DISOCT);
}

function debugGoDis() {
    const disgo = document.getElementById("disgo");
    var val = disgo.value;
    if (val == "") {
        debugUpdate();
        return;
    }
    val = parseInt(val, DISOCT ? 8 : 16);

    if (val > 0xFFFE) {
        val = 0xFFFE;
        disgo.value = HexOrOct(val, DISOCT);
    }
    else if (val % 2 != 0) {
        val--;
        disgo.value = HexOrOct(val, DISOCT);
    }

    DISADDRS = val;
    debugUpdate();
}

function debugReadMem() {
    const ramcha = document.getElementById("ramcha");
    if (ramcha.value == "") {
        ramcha.value = HexOrOct(RAMADDR, RAMOCT);
    }
    var addr = parseInt(ramcha.value, RAMOCT ? 8 : 16)-RAMSTA;

    if (ISWORD && (addr % 2 !=0)) {
        addr--;
        ramcha.value = HexOrOct(addr+RAMSTA, RAMOCT);
    }

    const ramch = document.getElementById("ramch");
    if (ISWORD) {
        var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
        ramch.value = HexOrOct(word, RAMOCT);
    }
    else {
        ramch.value = HexOrOct(RAM[addr], RAMOCT, true);
    }
    ramch.focus();
    ramch.setSelectionRange(0, 10);
}

function debugSetWord() {
    ISWORD=true;
    if (RAMADDR % 2 != 0){
        RAMADDR--;
        debugDrawRamAddr();
    }
    const ramcha = document.getElementById("ramcha");
    if (ramcha.value == "") {
        ramcha.value = HexOrOct(RAMADDR, RAMOCT);
    }
    var addr = parseInt(ramcha.value, RAMOCT ? 8 : 16)-RAMSTA;
    if (addr % 2 != 0) {
        addr--;
        ramcha.value = HexOrOct(addr+RAMSTA, RAMOCT);
    }
    var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
    const ramch = document.getElementById("ramch");
    ramch.maxLength = RAMOCT ? 6 : 4;
    ramch.value = HexOrOct(word, RAMOCT);
}

function debugSetByte() {
    ISWORD=false;
    const ramcha = document.getElementById("ramcha");
    if (ramcha.value == "") {
        ramcha.value = HexOrOct(RAMADDR, RAMOCT);
    }
    const addr = parseInt(ramcha.value, RAMOCT ? 8 : 16)-RAMSTA;
    const ramch = document.getElementById("ramch");
    ramch.maxLength = RAMOCT ? 3 : 2;
    ramch.value = HexOrOct(RAM[addr], RAMOCT, true);
}

function debugShiftR() {
    if (ISWORD && (RAMADDR+1 < (RAM.length+(RAMSTA-1))) && (RAMADDR+1 < RAMLIM-0x90)) {
            RAMADDR+=2;
            debugDrawRamAddr();
            debugUpdate();
    }
    else if (!ISWORD && (RAMADDR < (RAM.length+(RAMSTA-1))) && (RAMADDR < RAMLIM-0x90)) {
            RAMADDR++;
            debugDrawRamAddr();
            debugUpdate();
    }
}

function debugShiftL() {
    if (ISWORD && (RAMADDR-1 > RAMSTA)) {
            RAMADDR-=2;
            debugDrawRamAddr();
            debugUpdate();
    }
    else if (!ISWORD && (RAMADDR > RAMSTA)) {
            RAMADDR--;
            debugDrawRamAddr();
            debugUpdate();
    }
}

function debugChangeMem() {
    var addr = document.getElementById("ramcha").value;
    var val = document.getElementById("ramch").value;
    if (addr == "") {
        debugDrawRamAddr();
        return;
    }
    addr = parseInt(addr, RAMOCT ? 8 : 16)-RAMSTA;

    if (val == "") {
        if (ISWORD) {
            var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
            document.getElementById("ramch").value = HexOrOct(word, RAMOCT);
        }
        else {
            document.getElementById("ramch").value = HexOrOct(RAM[addr], RAMOCT, true);
        }
        return;
    }
    val = parseInt(val, RAMOCT ? 8 : 16);

    if (ISWORD) {
        RAM[addr+1] = (val>>8) & 0xFF;
        RAM[addr] = val & 0xFF;
    }
    else {
        RAM[addr] = val;
    }
    debugUpdate();
}

function debugGoRam(){
    var val = document.getElementById("ramgo").value;
    if (val == "") {
        document.getElementById("ramgo").value = HexOrOct(RAMADDR, RAMOCT);
        return;
    }
    val = parseInt(val, RAMOCT ? 8 : 16);

    if (val >= RAMSTA && val <= (RAM.length+(RAMSTA-1))) {
        RAMADDR = val;
    }
    else if (val < RAMSTA) {
        RAMADDR = RAMSTA;
    }
    else {
        RAMADDR = RAM.length+(RAMSTA-1);
    }
    debugDrawRamAddr();
    debugUpdate();
}

function debugEditReg() {
    const reg = document.getElementById("regist").value;
    var val = document.getElementById("reged").value;
    if (val == "") {
        debugUpdRegIn();
        return;
    }
    val = parseInt(val, REGOCT ? 8 : 16);

    if (reg[0] == "R") {
        const rnum = Number(reg[1]);

        if (((rnum == 6) || (rnum == 7)) && (val % 2 !=0)){
            val--;
            document.getElementById("reged").value = HexOrOct(val, REGOCT);
        }

        MK85CPU.reg_u16[rnum] = val;
    }
    else if (reg == "PSW") {
        MK85CPU.psw = val;
    }
    else if (reg == "CPUCTRL") {
        MK85CPU.cpuctrl = val;
    }
    else if (reg == "PP") {
        PP = val;
    }
    debugUpdate();
}

function debugUpdRegIn() {
    const reg = document.getElementById("regist").value;

    if (reg[0] == "R") {
        const rnum = Number(reg[1]);
        document.getElementById("reged").value = HexOrOct(MK85CPU.reg_u16[rnum], REGOCT);
    }
    else if (reg == "PSW") {
        document.getElementById("reged").value = HexOrOct(MK85CPU.psw, REGOCT);
    }
    else if (reg == "CPUCTRL") {
        document.getElementById("reged").value = HexOrOct(MK85CPU.cpuctrl, REGOCT);
    }
    else if (reg == "PP") {
        document.getElementById("reged").value = HexOrOct(PP, REGOCT);
    }
}

function debugSetRegV() {
    document.getElementById("regtp").innerText = REGOCT ? "oct" : "hex";
    const reged = document.getElementById("reged");
    reged.maxLength = REGOCT ? 6 : 4;
    reged.value = HexOrOct((reged.value == "") ? 0 : parseInt(reged.value, (REGOCT ? 16 : 8)), REGOCT);
    document.getElementById("adrt").innerText = REGOCT ? "oct" : "hex";
    const brkp = document.getElementById("brkp");
    brkp.maxLength = REGOCT ? 6 : 4;
    brkp.value = HexOrOct((brkp.value == "") ? 0 : parseInt(brkp.value, (REGOCT ? 16 : 8)), REGOCT);
}

function debugSetRamV() {
    const ramgo = document.getElementById("ramgo");
    ramgo.maxLength = RAMOCT ? 6 : 4;
    ramgo.value = HexOrOct((ramgo.value == "") ? 0 : parseInt(ramgo.value, (RAMOCT ? 16 : 8)), RAMOCT);
    debugDrawRamAddr(true);
}

function debugValidInput(obj, isoct) {

    obj.value = obj.value.toUpperCase()

    for (let i = 0; i < obj.value.length; i++) {
        var ch = obj.value.charCodeAt(i);

        const validat = isoct ? ((ch >= 48) && (ch <= 55))
            : (((ch >= 48) && (ch <= 57)) || ((ch >= 65) && (ch <= 70)))

        if (!validat) {
            obj.value = obj.value.substring(0, i) + obj.value.substring(i + 1);
            obj.setSelectionRange(i, i);
            i--;
        }
    }
}

function debugClearB() {
    BREAKPOINT = false;
    document.getElementById("brkp").value = HexOrOct(0, REGOCT);
}

function debugBreakp() {
    if (document.getElementById("brkp").value == "") {
        debugClearB();
        return;
    }
    BREAKPOINT = parseInt(document.getElementById("brkp").value, REGOCT ? 8 : 16);
    if (BREAKPOINT == MK85CPU.reg_u16[7]) {
        SKIPBSTEP = true;
    }
    panelSwState();
}

function debugSteps() {
    var sval = Number(document.getElementById("stps").value);

    if (sval > 1000000) {
        sval = 1000000;
        document.getElementById("stps").value = sval;
    }
    else if (sval < 1) {
        sval = 1;
        document.getElementById("stps").value = sval;
    }

    DEBUG_STEPS = sval;
    //console.log(DEBUG_STEPS);
    LCD.doFrame();
    panelUpdate();
    debugUpdate();
    DEBUG_STEPS = false;
}

function debugStep() {
    DEBUG_STEPS = 1;
    LCD.doFrame();
    panelUpdate();
    debugUpdate();
    DEBUG_STEPS = false;
}

function debugDrawRamAddr(noramch) {
    for (let i=0; i < 10; i++) {
        document.getElementById(`adr-${i}`).innerText=HexOrOct(RAMADDR+(0x10*i), RAMOCT)+":";
    }
    document.getElementById("ramgo").value = HexOrOct(RAMADDR, RAMOCT);
    var addr;

    if (noramch) {
        var ramcha = document.getElementById("ramcha")
        if (ramcha.value == "") {
            ramcha.value = HexOrOct(RAMADDR, RAMOCT);
        } else {
            ramcha.value = HexOrOct(parseInt(ramcha.value, RAMOCT ? 16 : 8), RAMOCT);
        }
        addr = parseInt(ramcha.value, RAMOCT ? 8 : 16)-RAMSTA;

    }
    else {
        document.getElementById("ramcha").value = HexOrOct(RAMADDR, RAMOCT);
        addr = RAMADDR-RAMSTA;
    }

    if (ISWORD) {MK85CPU.reg_u16[7]
        var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
        document.getElementById("ramch").value = HexOrOct(word, RAMOCT);
    }
    else {
        document.getElementById("ramch").value = HexOrOct(RAM[addr], RAMOCT, true);
    }
}

function HexOrOct(val, isoct, byte) {
    if (isoct) {
        if (byte) {
            return ('00' + val.toString(8).toUpperCase()).slice(-3);
        }
        else {
            return ('00000' + val.toString(8).toUpperCase()).slice(-6);
        }
    }
    else {
        if (byte) {
            return ('0' + val.toString(16).toUpperCase()).slice(-2);
        }
        else {
            return ('000' + val.toString(16).toUpperCase()).slice(-4);
        }
    }
}

function debugUpdate() {

    for (let i=0; i < 8; i++) {
        document.getElementById(`dbgr${i}`).innerText = HexOrOct(MK85CPU.reg_u16[i], REGOCT);
    }

    var flags = `${((MK85CPU.psw&MK85CPU.flags.H)) ? "H" : "-"}${(MK85CPU.psw&MK85CPU.flags.I) ? "P" : "-"} `
    flags +=`${(MK85CPU.psw&MK85CPU.flags.T) ? "T" : "-"}${(MK85CPU.psw&MK85CPU.flags.N) ? "N" : "-"}${(MK85CPU.psw&MK85CPU.flags.Z) ? "Z" : "-"}`
    flags +=`${(MK85CPU.psw&MK85CPU.flags.V) ? "V" : "-"}${(MK85CPU.psw&MK85CPU.flags.C) ? "C" : "-"}`;

    document.getElementById("dbgrp").innerText = flags;
    document.getElementById("dbgrph").innerText = HexOrOct(MK85CPU.psw, REGOCT);

    var ctrlbin = ('000000000000' + MK85CPU.cpuctrl.toString(2).toUpperCase()).slice(-13);
    ctrlbin = [ctrlbin.slice(0, 5), " ", ctrlbin.slice(5)].join('');

    document.getElementById("dbgprc").innerText = `###${ctrlbin} (${HexOrOct(MK85CPU.cpuctrl, REGOCT)})`;


    
    var ppbin = ('000000000000000' + PP.toString(2).toUpperCase()).slice(-16).substring(0, 15);
    ppbin = [ppbin.slice(0, 8), " ", ppbin.slice(8)].join('');

    if ((MK85CPU.cpuctrl&0x1) != 0) {
        ppbin = ppbin.substring(0, 13) + "xxx";
    }
    if ((MK85CPU.cpuctrl&0x2) != 0) {
        ppbin = ppbin.substring(0, 9) + "xxxx" + ppbin.substring(13, ppbin.length);
    }
    if ((MK85CPU.cpuctrl&0x4) != 0) {
        ppbin = ppbin.substring(0, 4) + "xxxx" + ppbin.substring(8, ppbin.length);
    }
    if ((MK85CPU.cpuctrl&0x8) != 0) {
        ppbin = "xxxx" + ppbin.substring(4, ppbin.length);
    }

    document.getElementById("dbgkport").innerText = `${ppbin}# (${HexOrOct(PP, REGOCT)})`;

    var kread = keysRead(PP);
    var keybin = ('000000000000' + kread.toString(2).toUpperCase()).slice(-13)
    keybin = [keybin.slice(0, 5), " ", keybin.slice(5)].join('');
    document.getElementById("dbgkb").innerText = `###${keybin} (${HexOrOct(kread, REGOCT)})`;

    if (RAMADDR >= (RAM.length+RAMSTA)) {
        RAMADDR = RAM.length+RAMSTA-0xA0;
        document.getElementById("ramgo").value = HexOrOct(RAMADDR, RAMOCT);
        debugDrawRamAddr();
    }

    for (let i=0; i < 10; i++) {
        for (let c=0; c < 16; c++) {
            const addr = ((RAMADDR-RAMSTA)+c+(i*0x10));
            const cell = document.getElementById(`hexc-${i}-${c}`);
            const acell = document.getElementById(`ascc-${i}-${c}`);
            if (ISWORD && (c%2 != 0)) {
                cell.innerText = "";
            }

            if (addr >= RAM.length) {
                
                if (ISWORD && (c%2 == 0)) {
                    cell.innerText = RAMOCT ? "######" : "####";
                }
                else if (!ISWORD) {
                    cell.innerText = RAMOCT ? "###" : "##";
                }
                acell.innerText = "#";
            }
            else {
                if (ISWORD && (c%2 == 0)) {
                    var word = (((RAM[addr+1] & 0xFF) << 8) | (RAM[addr] & 0xFF));
                    cell.innerText = HexOrOct(word, RAMOCT);
                }
                else if (!ISWORD) {
                    cell.innerText = HexOrOct(RAM[addr], RAMOCT, true);
                }

                if ((RAM[addr] < 0x20) || (RAM[addr] == 0x7F)) {
                    acell.innerText = ".";
                }
                else if (RAM[addr] == 0x20) {
                    acell.innerHTML = "&nbsp;";
                }
                else {
                    acell.innerText = String.fromCharCode(RAM[addr]);
                }
            }
        }
    }

    if (((!stopped) && (POWER)) || LASTPC != MK85CPU.reg_u16[7]) {
        DISADDR = MK85CPU.reg_u16[7];
        LASTPC = DISADDR;
        DISADDRS = DISADDR;
        document.getElementById("disgo").value = HexOrOct(DISADDR, DISOCT);
    }
    else {
        DISADDR = DISADDRS;
        const disgo = document.getElementById("disgo");
        if (parseInt(disgo.value, DISOCT ? 8 : 16) != DISADDR) {
            disgo.value = HexOrOct(DISADDR, DISOCT);
        }
    }

    for (let i=0; i < 10; i++) {
        const cell = document.getElementById(`dis${i}`);
        const cella = document.getElementById(`dis${i}a`);
        if (DISADDR == MK85CPU.reg_u16[7]) {
            cell.style.backgroundColor = "white";
            cella.style.backgroundColor = "white";
        }
        else {
            cell.style.backgroundColor = "";
            cella.style.backgroundColor = "";
        }

        if (DISADDR > 0xFFFF) {
            cella.innerText = "";
            cell.innerHTML = "&nbsp;";
            DISADDR+=2;
            continue;
        }
        else {
            cella.innerText = HexOrOct(DISADDR, DISOCT)+":";
        }

        if (((DISADDR >= (ROM.length+ROMSTA)) && (DISADDR < RAMSTA)) || (DISADDR >= (RAM.length+RAMSTA))) {
            cell.innerHTML = "########";
            DISADDR+=2;
            continue;
        }
        const opcode = FetchWord();
        const index = ScanMnemTab(opcode);
        const c = ((opcode & 0x8000) == 0) ? " " : "b";
        var mn = Mnemonic(index, c);
        var ml = mn.length;
        while (ml < 5) {
            mn+="&nbsp;"
            ml++;
        }
        cell.innerHTML = mn + " " + Arguments(index, opcode);
    }
}