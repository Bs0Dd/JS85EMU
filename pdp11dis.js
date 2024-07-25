// PDP-11 assembler and disassembler module
// the disassembler part is based on program pinst.c written by Martin Minow
// module ported from Delphi Pascal (Piotr Piątek) to JS (Bs0Dd)

// 2024 (c) Bs0Dd

var DIGITS = '0123456789ABCDEFabcdef';

var INBUF = "";
var ININDEX = 0;

var OUTBUF = new Uint16Array(3);
var OUTINDEX = 0;
 
var PDP11_KINDS = {
    ILLOP: "ILLOP",	//{ illop }
    NONE: "NONE",	//{ halt }
    RTS: "RTS",	//{ rts reg }
    DOUBLE: "DOUBLE",	//{ mov src,dst }
    ADD: "ADD",	//{ add src,dst }
    SWBYTE: "SWBYTE",	//{ sop[b] dst }
    SINGLE: "SINGLE",	//{ sop dst }
    JSR: "JSR",	//{ jsr reg,dst }
    MUL: "MUL",	//{ mul src,reg }
    BR: "BR",		//{ br addr }
    SOB: "SOB",	//{ sob reg,addr }
    SPL: "SPL",	//{ spl n }
    MARK: "MARK",	//{ mark n }
    TRAP: "TRAP",	//{ trap n }
    CODE: "CODE",	//{ se[cvnz] }
    DATA: "DATA"	//{ .word }
}

var PDP11_MNEMS = [
    {	mask:0xFFFF,	op:0x0000,	str:'halt',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0001,	str:'wait',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0002,	str:'rti',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0003,	str:'bpt',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0004,	str:'iot',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0005,	str:'reset',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0006,	str:'rtt',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x000A,	str:'go',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFC,	op:0x0008,	str:'go',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x000E,	str:'step',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFC,	op:0x000C,	str:'step',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFF7,	op:0x0010,	str:'rsel',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0011,	str:'mfus',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFE,	op:0x0012,	str:'rcpc',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFC,	op:0x0014,	str:'rcps',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0019,	str:'mtus',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFE,	op:0x001A,	str:'wcpc',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFC,	op:0x001C,	str:'wcps',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFE0,	op:0x0000,	str:'illop',	kind:PDP11_KINDS.ILLOP	},
    {	mask:0xFFC0,	op:0x0040,	str:'jmp',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFF8,	op:0x0080,	str:'rts',	kind:PDP11_KINDS.RTS	},
    {	mask:0xFFF0,	op:0x0088,	str:'illop',	kind:PDP11_KINDS.ILLOP	},
    {	mask:0xFFF8,	op:0x0098,	str:'spl',	kind:PDP11_KINDS.SPL	},
    {	mask:0xFFFF,	op:0x00A0,	str:'nop',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x00A1,	str:'clc',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFF0,	op:0x00A0,	str:'clear',	kind:PDP11_KINDS.CODE	},
    {	mask:0xFFFF,	op:0x00B1,	str:'sec',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFF0,	op:0x00B0,	str:'set',	kind:PDP11_KINDS.CODE	},
    {	mask:0xFFC0,	op:0x00C0,	str:'swab',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFF00,	op:0x0100,	str:'br',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0200,	str:'bne',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0300,	str:'beq',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0400,	str:'bge',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0500,	str:'blt',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0600,	str:'bgt',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x0700,	str:'ble',	kind:PDP11_KINDS.BR		},
    {	mask:0xFE00,	op:0x0800,	str:'jsr',	kind:PDP11_KINDS.JSR	},
    {	mask:0x7FC0,	op:0x0A00,	str:'clr',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0A40,	str:'com',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0A80,	str:'inc',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0AC0,	str:'dec',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0B00,	str:'neg',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0B40,	str:'adc',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0B80,	str:'sbc',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0BC0,	str:'tst',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0C00,	str:'ror',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0C40,	str:'rol',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0C80,	str:'asr',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0x7FC0,	op:0x0CC0,	str:'asl',	kind:PDP11_KINDS.SWBYTE	},
    {	mask:0xFFC0,	op:0x0D00,	str:'mark',	kind:PDP11_KINDS.MARK	},
    {	mask:0xFFC0,	op:0x0D40,	str:'mfpi',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFC0,	op:0x0D80,	str:'mtpi',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFC0,	op:0x0DC0,	str:'sxt',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFE00,	op:0x0E00,	str:'illop',	kind:PDP11_KINDS.ILLOP	},
    {	mask:0x7000,	op:0x1000,	str:'mov',	kind:PDP11_KINDS.DOUBLE	},
    {	mask:0x7000,	op:0x2000,	str:'cmp',	kind:PDP11_KINDS.DOUBLE	},
    {	mask:0x7000,	op:0x3000,	str:'bit',	kind:PDP11_KINDS.DOUBLE	},
    {	mask:0x7000,	op:0x4000,	str:'bic',	kind:PDP11_KINDS.DOUBLE	},
    {	mask:0x7000,	op:0x5000,	str:'bis',	kind:PDP11_KINDS.DOUBLE	},
    {	mask:0xF000,	op:0x6000,	str:'add',	kind:PDP11_KINDS.ADD	},
    {	mask:0xF000,	op:0xE000,	str:'sub',	kind:PDP11_KINDS.ADD	},
    {	mask:0xFE00,	op:0x7000,	str:'mul',	kind:PDP11_KINDS.MUL	},
    {	mask:0xFE00,	op:0x7200,	str:'div',	kind:PDP11_KINDS.MUL	},
    {	mask:0xFE00,	op:0x7600,	str:'ashc',	kind:PDP11_KINDS.MUL	},
    {	mask:0xFE00,	op:0x7400,	str:'ash',	kind:PDP11_KINDS.MUL	},
    {	mask:0xFE00,	op:0x7800,	str:'xor',	kind:PDP11_KINDS.JSR	},
    {	mask:0xFFF8,	op:0x7A00,	str:'fadd',	kind:PDP11_KINDS.RTS	},
    {	mask:0xFFF8,	op:0x7A08,	str:'fsub',	kind:PDP11_KINDS.RTS	},
    {	mask:0xFFF8,	op:0x7A10,	str:'fmul',	kind:PDP11_KINDS.RTS	},
    {	mask:0xFFF8,	op:0x7A18,	str:'fdiv',	kind:PDP11_KINDS.RTS	},
    {	mask:0xFE00,	op:0x7E00,	str:'sob',	kind:PDP11_KINDS.SOB	},
    {	mask:0xF800,	op:0x7800,	str:'illop',	kind:PDP11_KINDS.ILLOP	},
    {	mask:0xFF00,	op:0x8000,	str:'bpl',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8100,	str:'bmi',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8600,	str:'bcc',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8600,	str:'bhis',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8200,	str:'bhi',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8300,	str:'blos',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8400,	str:'bvc',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8500,	str:'bvs',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8700,	str:'bcs',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8700,	str:'blo',	kind:PDP11_KINDS.BR		},
    {	mask:0xFF00,	op:0x8800,	str:'emt',	kind:PDP11_KINDS.TRAP	},
    {	mask:0xFF00,	op:0x8900,	str:'trap',	kind:PDP11_KINDS.TRAP	},
    {	mask:0xFFC0,	op:0x8D00,	str:'mtps',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFC0,	op:0x8D40,	str:'mfpd',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFC0,	op:0x8D80,	str:'mtpd',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0xFFC0,	op:0x8DC0,	str:'mfps',	kind:PDP11_KINDS.SINGLE	},
    {	mask:0x0000,	op:0x0000,	str:'illop',	kind:PDP11_KINDS.ILLOP	},
    {	mask:0x0000,	op:0xFFFF,	str:'.word',	kind:PDP11_KINDS.DATA	}

]

var PDP11_REGS = [
    {	mask:0xFFFF,	op:0x0000,	str:'r0',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0001,	str:'r1',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0002,	str:'r2',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0003,	str:'r3',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0004,	str:'r4',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0005,	str:'r5',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0006,	str:'sp',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0007,	str:'pc',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0006,	str:'r6',	kind:PDP11_KINDS.NONE	},
    {	mask:0xFFFF,	op:0x0007,	str:'r7',	kind:PDP11_KINDS.NONE	}
]

//{ fetch a word from the memory, advance the location counter }
function FetchWord() {
    var word; 
    if ((DISADDR >= ROMSTA) && (DISADDR < (ROM.length+ROMSTA))) {
        word = (((ROM[DISADDR-ROMSTA+1] & 0xFF) << 8) | (ROM[DISADDR-ROMSTA] & 0xFF));
    }
    else if ((DISADDR >= RAMSTA) && (DISADDR < (RAM.length+RAMSTA))) {
        word = (((RAM[DISADDR-RAMSTA+1] & 0xFF) << 8) | (RAM[DISADDR-RAMSTA] & 0xFF));
    }
    else {
        word = null;
    }
    DISADDR+=2;
    return word;
}

function StoreWord(x) {
    if ((DISADDR >= ROMSTA) && (DISADDR < (ROM.length+ROMSTA))) {
        ROM[DISADDR-ROMSTA+1] = (x>>8) & 0xFF;
        ROM[DISADDR-ROMSTA] = x & 0xFF;
    }
    else if ((DISADDR >= RAMSTA) && (DISADDR < (RAM.length+RAMSTA))) {
        RAM[DISADDR-RAMSTA+1] = (x>>8) & 0xFF;
        RAM[DISADDR-RAMSTA] = x & 0xFF;
    }
    DISADDR+=2;
}

//{ DISASSEMBLER FUNCTIONS }

//{ returns the name of the register r }
function preg(r) {
    return PDP11_REGS[r&7].str;
}

//{ returns the addressing mode }
function paddr(m) {
    var r = m & 0x07;
    var s = ((m & 0x08) == 0) ? "" : "@";

    switch(m&0x38) {
        case 0x00:
            return preg(r);

        case 0x08:
            return '(' + preg(r) + ')';

        case 0x10:
        case 0x18:
            return (r == 0x07) ? (s + '#' + FetchWord().toString(DISOCT ? 8 : 16).toUpperCase()) : (s + '(' + preg(r) + ')+');

        case 0x20:
        case 0x28:
            return s + '-(' + preg(r) + ')';
        
        case 0x30:
        case 0x38:
            if (r == 0x07) {
                var t = FetchWord();
                return s + HexOrOct(DISADDR+t, DISOCT);
            }
            else {
                return s + HexOrOct(FetchWord(), DISOCT) + '(' + preg(r) + ')';
            }
    }
}

//{ returns the names of the CCR register bits }
function ccr(x) {
    var s="";
    if ((x & 1) != 0) {s += 'c'};
    if ((x & 2) != 0) {s += 'v'};
    if ((x & 4) != 0) {s += 'z'};
    if ((x & 8) != 0) {s += 'n'};
    return s;
}

//{ returns the index to the 'mnem' table for op-code x }
function ScanMnemTab(x) {
    for (r = 0; r<PDP11_MNEMS.length; r++) {
        if ((x & PDP11_MNEMS[r].mask) == PDP11_MNEMS[r].op) {
            return r;
        }
    }
    return PDP11_MNEMS.length-1;
}

//{ returns the mnemonic }
function Mnemonic (i, size) {
    var res = PDP11_MNEMS[i].str;
    if ((PDP11_MNEMS[i].kind == PDP11_KINDS.SWBYTE) || (PDP11_MNEMS[i].kind == PDP11_KINDS.DOUBLE)) {
        res+=size;
    }
    return res;
}

//{ returns the arguments }
function Arguments (i, x) {
    var res;
    switch (PDP11_MNEMS[i].kind) {
        case PDP11_KINDS.SPL:
            res = DIGITS[(x & 0x07) + 1];
            break;

        case PDP11_KINDS.RTS:
            res = preg(x);
            break;

        case PDP11_KINDS.SINGLE:
        case PDP11_KINDS.SWBYTE:
            res = paddr(x);
            break;

        case PDP11_KINDS.DOUBLE:
        case PDP11_KINDS.ADD:
            res = paddr(Math.floor(x / 64)) + ',' + paddr(x);
            break;

        case PDP11_KINDS.JSR:
            res = preg (Math.floor(x / 64)) + ',' + paddr(x);
            break;

        case PDP11_KINDS.MUL:
            res = paddr(x) + ',' + preg(Math.floor(x / 64));
            break;

        case PDP11_KINDS.BR:
            x &= 0xFF;
            if ((x & 0x80) != 0) {
                x |= 0xFF00;
            }
            res = HexOrOct(DISADDR + 2*x, DISOCT);
            break;

        case PDP11_KINDS.SOB:
            res = preg(Math.floor(x / 64)) + ',' + HexOrOct((DISADDR - 2*(x & 0x3F)), DISOCT);
            break;

        case PDP11_KINDS.MARK:
            res = HexOrOct((x & 0x3F), DISOCT);
            break;

        case PDP11_KINDS.TRAP:
            res = HexOrOct((x & 0xFF), DISOCT);
            break;

        case PDP11_KINDS.CODE:
            res = ccr(x);
            break;

        default:
            res = '';
    }
    return res;
}


//{ ASSEMBLER FUNCTIONS }

//{ compare the string 's' with the 'InBuf' at location 'InIndex' without
//  the case sensitivity,
//  update the 'InIndex' and return True if both string match }
function ParseString(s) {
    if ((ININDEX + s.length-1) > INBUF.length) return false;

    var n = 0;
    var iblc = INBUF.toLowerCase();
    for (; n < s.length; n++) {
        if (s[n] != iblc[ININDEX+n]) return false;
    }
    ININDEX+=n;
    return true;
}

//{ returns index to the table of type 'tab' or -1 if mnemonic not found }
function ParseTable(t, last) {
    for (let r=0; r < last; r++) {
        if (ParseString(t[r].str)) return r;
    }
    return -1;
}

//{ function expects a number in base 'radix',
//  returns count of processed characters,
//  updates the InIndex,
//  places the value of the number in OutBuf[OutIndex] }
function ParseNumber() {
    var x = 0;
    var r = 0;
    while (ININDEX < INBUF.length) {
        y = parseInt(INBUF[ININDEX], DISOCT ? 8 : 16);
        if (isNaN(y)) break;
        x = (x*(DISOCT ? 8 : 16)) + y;
        ININDEX++;
        r++;
    }
    OUTBUF[OUTINDEX] = x;
    return r;
}

// { move the 'InIndex' to the first character different from space,
//  returns True if at least single space processed }
function ParseBlanks() {
    var r = false;
    while (ININDEX < INBUF.length) {
        if (INBUF[ININDEX] != " ") break;
        r = true;
        ININDEX++;
    }
    return r;
}

//{ a specified character expected }
function ParseChar(c) {
    var r = (ININDEX < INBUF.length) && (INBUF[ININDEX] == c);
    if (r) ININDEX++;
    return r;
}

//{ comma expected }
function ParseComma(){
  ParseBlanks();
  var r = ParseChar(',');
  ParseBlanks();
  return r;
}

//{ returns address mode or value > $3F if error }
function ParseAddr() {
    var r = 0x8000;
    if (ParseChar('@')) r |= 0x0008;

    //{ Ri }
    var i = ParseTable(PDP11_REGS, PDP11_REGS.length);
    if (i >= 0) {r |= PDP11_REGS[i].op;}

    //{ #n }
    else if (ParseChar('#')){
        r |= 0x0017;
        if (ParseNumber() == 0) return r;		//{ failure, a number expected }
        OUTINDEX++
    }

    //{ -(Ri) }
    else if (ParseChar('-')){
        if (!ParseChar('(')) return r;	//{ failure, opening bracket expected }
        i = ParseTable(PDP11_REGS, PDP11_REGS.length);
        if (i < 0) return r; //{ failure, register name expected }
        if (!ParseChar(')')) return r;	//{ failure, closing bracket expected }
        r |= 0x0020 | PDP11_REGS[i].op;
    }

    //{ (Ri) or (Ri)+ }
    else if (ParseChar('(')) {
        i = ParseTable(PDP11_REGS, PDP11_REGS.length);
        if (i < 0) return r; //{ failure, register name expected }
        if (!ParseChar(')')) return r;	//{ failure, closing bracket expected }
        r |= PDP11_REGS[i].op;

        if (ParseChar('+')) { //{ (Ri)+ }
            r |= 0x0010;
        }
        else {
            if ((result & 0x0008) == 0){
                r |= 0x0008	 //{ (Ri) = @Ri }
            }
            else {
                r |= 0x0030;	//{ @(Ri) = @0000(Ri) }
                OUTBUF[OUTINDEX] = 0;
                OUTINDEX++;
            }
        }
    }

    //{ n or n(Ri) }

    else if (ParseNumber() > 0) {
        if (ParseChar('(')) {
            i = ParseTable(PDP11_REGS, PDP11_REGS.length);
            if (i < 0) return r; //{ failure, register name expected }
            if (!ParseChar(')')) return r;	//{ failure, closing bracket expected }
            r |= 0x0030 | PDP11_REGS[i].op;
        }
        else {
            OUTBUF[OUTINDEX] = OUTBUF[OUTINDEX] - DISADDR - (2*OUTINDEX) - 2;
            r |= 0x0037;
        }
        OUTINDEX++;
    }

    return r & 0x3F;		//{ success }
}

//{ assemble the instruction in the 'InBuf' and place the result in the OutBuf,
//  expects the address in 'loc', but doesn't update it,
//  on exit 'InIndex' contains the position of an error (warning: it can
//  point past the end of the 'InBuf'!), otherwise 0 }
function Assemble() {
    ININDEX = 0;
    OUTINDEX = 0;

    //{ skip leading blanks }
    ParseBlanks();

    if (ININDEX > INBUF.length) { //{ empty InBuf? }
        ININDEX = 0;
        return "OK - empty buffer";
    }

    // { parse the mnemonic }
    var i = ParseTable(PDP11_MNEMS, PDP11_MNEMS.length);
    if (i < 0) return "PARSMNEM: mnemonic not recognised"; //{ failure, mnemonic not recognised }
    if (PDP11_MNEMS[i].kind == PDP11_KINDS.ILLOP) return "PARSMNEM: invalid mnemonic ('illop')";	//{ failure, invalid mnemonic 'illop' }
    OUTBUF[0] = PDP11_MNEMS[i].op;
    OUTINDEX = 1;
    if ((ININDEX < INBUF.length) && (INBUF[ININDEX].toLowerCase() == 'b')
        && ((PDP11_MNEMS[i].kind == PDP11_KINDS.SWBYTE) || (PDP11_MNEMS[i].kind == PDP11_KINDS.DOUBLE))) {
        ININDEX++;
        OUTBUF[0] |= 0x8000;
    }

    //{ space after mnemonic required, unless an instruction without operands }
    if (!ParseBlanks() && (PDP11_MNEMS[i].kind != PDP11_KINDS.NONE)) return "PARSBLNK: space after mnemonic required";

    // { parse the arguments }
    switch(PDP11_MNEMS[i].kind) {

        case PDP11_KINDS.SPL:
            if (ParseNumber() == 0) return "OP/SPL: a number expected"; //	{ failure, a number expected }
            if (OUTBUF[1] > 7) return "OP/SPL: value out of range";	//{ failure, value out of range }
            OUTBUF[0] |= OUTBUF[1];
            break;
        
        case PDP11_KINDS.RTS:
            i = ParseTable(PDP11_REGS, PDP11_REGS.length);
            if (i < 0) return "OP/RTS: register name expected"; //{ failure, register name expected }
            OUTBUF[0] |= PDP11_REGS[i].op;
            break;

        case PDP11_KINDS.SINGLE:
        case PDP11_KINDS.SWBYTE:
            var x = ParseAddr();
            if (x > 0x3F) return "OP/SINGLE-SWBYTE: failed to parse address mode 1"; //		{ failure }
            OUTBUF[0] |= x;
            break;
        
        case PDP11_KINDS.DOUBLE:
        case PDP11_KINDS.ADD:
            var x = ParseAddr();
            if (x > 0x3F) return "OP/DOUBLE-ADD: failed to parse address mode 1"; //		{ failure }
            OUTBUF[0] |= (x << 6);
            if (!ParseComma()) return "OP/DOUBLE-ADD: comma expected";	//{ failure, comma expected }
            x = ParseAddr();
            if (x > 0x3F) return "OP/DOUBLE-ADD: failed to parse address mode 2"; //		{ failure }
            OUTBUF[0] |= x;
            break;

        case PDP11_KINDS.JSR:
            i = ParseTable(PDP11_REGS, PDP11_REGS.length);
            if (i < 0) return "OP/JSR: register name expected"; //{ failure, register name expected }
            OUTBUF[0] |= (PDP11_REGS[i].op << 6);
            if (!ParseComma()) return "OP/JSR: comma expected";	//{ failure, comma expected }
            var x = ParseAddr();
            if (x > 0x3F) return "OP/JSR: failed to parse address mode 1"; //		{ failure }
            OUTBUF[0] |= x;
            break;
        
        case PDP11_KINDS.MUL:
            var x = ParseAddr();
            if (x > 0x3F) return "OP/MUL: failed to parse address mode 1"; //		{ failure }
            OUTBUF[0] |= x;
            if (!ParseComma()) return "OP/MUL: comma expected";	//{ failure, comma expected }
            i = ParseTable(PDP11_REGS, PDP11_REGS.length);
            if (i < 0) return "OP/MUL: register name expected"; //{ failure, register name expected }
            OUTBUF[0] |= (PDP11_REGS[i].op << 6);
            break;

        case PDP11_KINDS.BR:
            if (ParseNumber() == 0) return "OP/BR: a number expected"; //	{ failure, a number expected }
            var x = (OUTBUF[1] - DISADDR - 2) >> 1;
            if (((x & 0x7F80) != 0) && ((x & 0x7F80) != 0x7F80)) return "OP/BR: branch out of range";  //{ failure, branch out of range }
            OUTBUF[0] |= (x & 0xFF);
            break;
        
        case PDP11_KINDS.SOB:
            i = ParseTable(PDP11_REGS, PDP11_REGS.length);
            if (i < 0) return "OP/SOB: register name expected"; //{ failure, register name expected }
            OUTBUF[0] |= (PDP11_REGS[i].op << 6);
            if (!ParseComma()) return "OP/SOB: comma expected";	//{ failure, comma expected }
            if (ParseNumber() == 0) return "OP/SOB: a number expected"; //	{ failure, a number expected }
            var x = (DISADDR + 2 - OUTBUF[1]) >> 1;
            if ((x & 0x7FC0) != 0) return "OP/SOB: branch out of range"; // { failure, branch out of range }
            OUTBUF[0] |= (x & 0x3F);
            break;

        case PDP11_KINDS.MARK:
            if (ParseNumber() == 0) return "OP/MARK: a number expected"; //	{ failure, a number expected }
            if (OUTBUF[1] > 0x3F) return "OP/MARK: value out of range"; //	{ failure, value out of range }
            OUTBUF[0] |= OUTBUF[1];
            break;
        
        case PDP11_KINDS.TRAP:
            if (ParseNumber() == 0) return "OP/TRAP: a number expected"; //	{ failure, a number expected }
            if (OUTBUF[1] > 0xFF) return "OP/TRAP: value out of range"; //	{ failure, value out of range }
            OUTBUF[0] |= OUTBUF[1];
            break;
        
        case PDP11_KINDS.CODE:
            if (ParseChar('c')) {OUTBUF[0] |= 1};
            if (ParseChar('v')) {OUTBUF[0] |= 2};
            if (ParseChar('z')) {OUTBUF[0] |= 4};
            if (ParseChar('n')) {OUTBUF[0] |= 8};
            break;

        case PDP11_KINDS.DATA:
            if (ParseNumber() == 0) return "OP/DATA: a number expected"; //	{ failure, a number expected }
            OUTBUF[0] = OUTBUF[1];
            break;

    }

    // { the rest of the InBuf is allowed to be padded with spaces only }
    ParseBlanks();
    if (ININDEX == INBUF.length) {ININDEX = 0; return "OK - instruction with operands";}	//{ success }
    return "ENDCHK: rest of string is allowed to be padded with spaces only"; //{ otherwise failure, extra characters encountered }
}