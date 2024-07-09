function C96TOOL() {
    const c96p = document.createElement("div");
    c96p.id = "mk85_ch96_int";
    c96p.style.display = "none";

    const wrdiv = document.createElement("div");
    wrdiv.innerHTML = "The last zeros in the string<br>can be omitted (as in MK)<br><br>";
    wrdiv.style.textAlign = "center";
    c96p.appendChild(wrdiv);

    const pxpan = document.createElement("table");
    pxpan.id = "c96_pixels";
    pxpan.style.marginLeft = "auto";
    pxpan.style.marginRight = "auto";

    c96p.cells = [[], [], [], [], [], [], []];

    for (i=0; i < 7; i++){
        const row = document.createElement("tr");
            for (c=4; c >= 0; c--) {
                const td = document.createElement("td");
                td.id = `ct${i}-${c}`;

                td.addEventListener("touchstart", kpress, false);
                td.addEventListener("mousedown", kpress, false);

                row.appendChild(td);
                c96p.cells[i][c] = td;
            }
        pxpan.appendChild(row);
    }

    c96p.appendChild(pxpan);


    const panel = document.createElement("table");
    panel.id = "c96_panel";
    panel.style.marginLeft = "auto";
    panel.style.marginRight = "auto";

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const cpbtn = document.createElement("button");
    cpbtn.onclick = function() {
        navigator.clipboard.writeText(c96p.CODESTR.value);
    }
    cpbtn.innerText = "Copy";
    td.appendChild(cpbtn);
    tr.appendChild(td);

    const td2 = document.createElement("td");
    const code = document.createElement("input");
    code.oninput = function() {
        updText(c96p);
    }
    code.onfocus = function() {
        panelEditFocus();
    }
    code.onblur = function() {
        panelEditNoFocus();
    }
    code.id = "code";
    code.maxLength = 7;
    code.style.width = "100px";
    code.style.textAlign = "center";
    code.type = "text";
    td2.appendChild(code);
    tr.appendChild(td2);

    const td3 = document.createElement("td");
    const clbtn = document.createElement("button");
    clbtn.onclick = function() {
        c96p.CODESTR.value = "";
        updText(c96p);
    }
    clbtn.innerText = "Clear";
    td3.appendChild(clbtn);
    tr.appendChild(td3);
    panel.appendChild(tr);

    const panel2 = document.createElement("table");
    panel2.id = "c96_panel2";
    panel2.style.marginLeft = "auto";
    panel2.style.marginRight = "auto";
    const tr2 = document.createElement("tr");
    const td21 = document.createElement("td");
    const ext = document.createElement("button");
    ext.onclick = function() {
        c96p.style.display = "none";
        document.getElementById("mk85_ch96_br").style.display = "none";
    }
    ext.innerText = "Close";


    td21.appendChild(ext);
    tr2.appendChild(td21);

    const td2d = document.createElement("td");
    td2d.innerHTML = "&nbsp;||&nbsp;"
    tr2.appendChild(td2d);

    const td22 = document.createElement("td");

    const snd = document.createElement("button");
    snd.onclick = function() {
        if (code.value.length == 0) {
            return;
        }

        c = 0;
        const quotes = chkb.checked;

        if (quotes) {
            setTimeout(autoPressKey, 0, "shift");
            setTimeout(autoUnPressKey, 100, "shift");
            setTimeout(autoPressKey, 200, "w");
            setTimeout(autoUnPressKey, 300, "w");
            c+=2;
        }

        for (i=0; i<code.value.length; i++) {
            setTimeout(autoPressKey, 200*c, code.value, i);
            setTimeout(autoUnPressKey, 100+(200*c), code.value, i);
            //console.log(200*c, 100+(200*c));
            c++;
        }

        if (quotes) {
            setTimeout(autoPressKey, 200*c, "shift");
            setTimeout(autoUnPressKey, 100+(200*c), "shift");
            c++;
            setTimeout(autoPressKey, 200*c, "w");
            setTimeout(autoUnPressKey, 100+(200*c), "w");
        }
    }
    snd.innerText = "Send to MK";

    td22.appendChild(snd);
    tr2.appendChild(td22);

    const td23 = document.createElement("td");

    const lbl = document.createElement("label");
    lbl.htmlFor = "chkb";
    lbl.innerText = "in quotes"
    td23.appendChild(lbl);

    const chkb = document.createElement("input");
    chkb.id = "chkb";
    chkb.name = "chkb";
    chkb.type = "checkbox";
    td23.appendChild(chkb);

    tr2.appendChild(td23);

    panel2.appendChild(tr2);

    c96p.appendChild(panel);
    c96p.appendChild(panel2);

    c96p.CODESTR = code;
    c96p.ignoreUpd = false;

    updText(c96p);

    return c96p;
}

function kpress(event) {
    if (event.cancelable) event.preventDefault();

    var CODESTR = document.getElementById("code");
    var c96p = document.getElementById("mk85_ch96_int");

    if (c96p.lastCancel == false && event.type == "mousedown") {
        return; // Sometimes when touchstart event is non cancelable, mousedown event appears (idk why)
    }

    c96p.lastCancel = event.cancelable;

    const sbyte = (event.currentTarget.style.backgroundColor == "");

    event.currentTarget.style.backgroundColor = sbyte ? "black" : "";

    const id = event.currentTarget.id;
    
    const row = Number(id[2]);
    const col = Number(id[4]);

    c96p.ignoreUpd = true;

    for (i = 0; CODESTR.value.length <= row; i++) {
        CODESTR.value += "0";
    }

    var snum = CODESTR.value.charCodeAt(row)-48;
    //console.log(snum);
    if (snum >= 17) {snum -= 7;}

    snum = (snum ^ (1 << col))+48

    if (snum >= 58) {snum += 7;}

    CODESTR.value = CODESTR.value.substring(0, row) + String.fromCharCode(snum) + CODESTR.value.substring(row + 1);

    c96p.ignoreUpd = false;
}

function updText(obj) {
    if (obj.ignoreUpd) {
        return;
    }

    var stt = obj.CODESTR.selectionStart;
    obj.CODESTR.value = obj.CODESTR.value.toUpperCase();
    obj.CODESTR.setSelectionRange(stt, stt);

    for (i = 0; i < obj.CODESTR.value.length; i++) {
        var ch = obj.CODESTR.value.charCodeAt(i);
        if (!(((ch >= 48) && (ch <= 57)) || ((ch >= 65) && (ch <= 86)))) {
            obj.CODESTR.value = obj.CODESTR.value.substring(0, i) + obj.CODESTR.value.substring(i + 1);
            obj.CODESTR.setSelectionRange(i, i);
            i--;
        }
    }

    for (i = 0; i < 7; i++) {
        var snum = (i < obj.CODESTR.value.length) ? (obj.CODESTR.value.charCodeAt(i)-48) : 0;
        if (snum >= 17) {snum -= 7;}

        for (c = 0; c < 5; c++) {
            obj.cells[i][c].style.backgroundColor = (((snum >> (4-c)) & 1) == 1) ? "black" : "";
        }
    }
}

function autoPressKey(code, i) {
    if (code == "shift") {
        uniquesPressed.push("mode_s");
        console.log(uniquesPressed);
        return;
    }
    else if (code == "w") {
        uniquesPressed.push("w");
        console.log(uniquesPressed);
        return;
    }

    var ch = code.charCodeAt(i);
    if ((ch >= 48) && (ch <= 57)) {
        uniquesPressed.push("n"+code[i]);
    }
    else if ((ch >= 65) && (ch <= 86)) {
        uniquesPressed.push((code[i]).toLowerCase());
    }
    console.log(uniquesPressed);
}

function autoUnPressKey(code, i) {
    if (code == "shift") {
        uniquesPressed.splice("mode_s", 1);
        console.log(uniquesPressed);
        return;
    }
    else if (code == "w") {
        uniquesPressed.splice("w", 1);
        console.log(uniquesPressed);
        return;
    }

    var ch = code.charCodeAt(i);
    if ((ch >= 48) && (ch <= 57)) {
        uniquesPressed.splice("n"+code[i], 1);
    }
    else if ((ch >= 65) && (ch <= 86)) {
        uniquesPressed.splice((code[i]).toLowerCase(), 1);
    }
    console.log(uniquesPressed);
}