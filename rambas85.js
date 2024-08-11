// RAM <-> BASIC MK85 module
// Allows to convert data from BASIC code listing into RAM image and vice versa
// Also allows to show decoded variables allocated in memory
// module ported from C (Piotr Piątek) to JS (Bs0Dd)

// 2024 (c) Bs0Dd

/* character codes 0x00 to 0xBF, tilde marks unprintable characters, "|" marks >0xFFFF unicode characters */
var CCODES =
`~||||||{}Ø…○∑°△_\
×÷♠♥♦♣μΩ↓←→¥□·Ъъ\
 !"#$%&'()*+,-./\
0123456789:;<=>?\
@ABCDEFGHIJKLMNO\
PQRSTUVWXYZ[≠]↑≤\
~abcdefghijklmno\
pqrstuvwxyzᵉπ⁻≥█\
юабцдефгхийклмно\
пярстужвьызшэщчё\
ЮАБЦДЕФГХИЙКЛМНО\
ПЯРСТУЖВЬЫЗШЭЩЧЁ`;

var SUCODES = ["🮟", "🮞", "🮝", "🮜", "🮚", "🮛"]

var TOKENS = [
	"SIN ",		"COS ",		"TAN ",		"ASN ",
	"ACS ",		"ATN ",		"LOG ",		"LN ",
	"EXP ",		"SQR ",		"ABS ",		"INT ",
	"SGN ",		"FRAC ",	"VAL ",		"LEN ",
	"CHR ",		"ASCI ",	"RND ",		"MID ",
	"GETC ",	"RAN#",		"KEY",		"CSR ",
	"NEXT ",	"GOTO ",	"GOSUB ",	"RETURN",
	"IF ",		"FOR ",		"PRINT ",	"INPUT ",
	" THEN ",	" TO ",		" STEP ",	"STOP",
	"END",		"LETC ",	"DEFM ",	"VAC",
	"MODE ",	"SET ",		"DRAWC ",	"DRAW ",
	"RUN ",		"LIST ",	"AUTO ",	"CLEAR ",
	"TEST",		"WHO"
];

var KEYWRD = [
  [ // 2-char tokens
    {name:"TO", code:0xE1}, {name:"IF", code:0xDC}, {name:"LN", code:0xC7}, {name:"<=", code:0x5F},
    {name:"=<", code:0x5F}, {name:"=>", code:0x7E}, {name:">=", code:0x7E}, {name:"<>", code:0x5C},
    {name:"><", code:0x5C}, {name:"!=", code:0x5C}, {name:"PI", code:0x7C}],

  [ // 3-char tokens
    {name:"SIN", code:0xC0}, {name:"COS", code:0xC1}, {name:"TAN", code:0xC2}, {name:"ASN", code:0xC3},
    {name:"ACS", code:0xC4}, {name:"ATN", code:0xC5}, {name:"LOG", code:0xC6}, {name:"EXP", code:0xC8},
    {name:"SQR", code:0xC9}, {name:"ABS", code:0xCA}, {name:"INT", code:0xCB}, {name:"SGN", code:0xCC},
    {name:"VAL", code:0xCE}, {name:"LEN", code:0xCF}, {name:"CHR", code:0xD0}, {name:"RND", code:0xD2},
    {name:"MID", code:0xD3}, {name:"KEY", code:0xD6}, {name:"CSR", code:0xD7}, {name:"FOR", code:0xDD},
    {name:"END", code:0xE4}, {name:"VAC", code:0xE7}, {name:"SET", code:0xE9}, {name:"RUN", code:0xEC},
    {name:"WHO", code:0xF1}],

  [ // 4-char tokens
    {name:"FRAC", code:0xCD}, {name:"ASCI", code:0xD1}, {name:"NEXT", code:0xD8}, {name:"GETC", code:0xD4},
    {name:"RAN#", code:0xD5}, {name:"GOTO", code:0xD9}, {name:"THEN", code:0xE0}, {name:"STEP", code:0xE2},
    {name:"STOP", code:0xE3}, {name:"LETC", code:0xE5}, {name:"DEFM", code:0xE6}, {name:"MODE", code:0xE8},
    {name:"DRAW", code:0xEB}, {name:"LIST", code:0xED}, {name:"AUTO", code:0xEE}, {name:"TEST", code:0xF0}],

  [ // 5-char tokens
    {name:"GOSUB", code:0xDA}, {name:"INPUT", code:0xDF}, {name:"PRINT", code:0xDE}, {name:"DRAWC", code:0xEA},
    {name:"CLEAR", code:0xEF}]

]

function get_word(offs)
{
  return (((RAM[offs+1] & 0xFF) << 8) | (RAM[offs] & 0xFF));
}

function get_byte(offs)
{
  return (RAM[offs] & 0xFF);
}

/* The procedure converts an FP number to a string. It implements the original
 algorithm from the MK-85 ROM, found at address 28CC. */

function fp2str (offset, spec_precision) {
    var buffer = new Uint8Array(16);
    var result = "";
    var bufptr = 0;
    var act_precision = -spec_precision;
    var x;

    buffer[bufptr++] = '0'.charCodeAt(0);

    var exponent = get_word(offset);
    var sign = exponent & 0x8000;
    exponent &= 0x7FFF;
    exponent -= 0x1000;		/* remove the exponent bias */

    /* 28F8: */
    if (spec_precision >= 0 || act_precision > 10)
    {
      act_precision = 10;		/* default printing precision */
    }

    /* 290E: convert act_precision+1 digits of the mantissa to ASCII,
    done differently than in the original code, but gives the same result */
    for (let i=0; i<=act_precision; ++i)
      {
        if (i % 2 == 0)
        {
          x = get_byte(offset+((2+i/2) ^ 1));
        }
        buffer[bufptr++] = ('0'.charCodeAt(0) + ((x>>4) & 0x0F));
        x = x << 4;
      }


    /* 292C: rounding (the last digit will be dropped) */
    if (buffer[--bufptr] >= '5'.charCodeAt(0))
      {
        while (++(buffer[--bufptr]) > '9'.charCodeAt(0)) {
          ;
        }
        ++bufptr;
      }

    /* 293C: remove trailing zeros */
    do {
      buffer[bufptr] = 0;	/* truncate the string */
      if (buffer[--bufptr] != '0'.charCodeAt(0))
      {
      /* 294A: remove the leading zero */
        bufptr = 0;
        if (buffer[bufptr++] != '0'.charCodeAt(0))
        {
          --bufptr;
          ++exponent;
        }
        break;
      }
    } while (bufptr > 0);

    /* 2958: output the minus sign for negative numbers */
    result = '-';
    if ((sign &= 0x8000) == 0)
    {
    /* 2966: space before a positive number, unless maximal precision set */
    result = ' ';
      if (spec_precision >= 0)
      {
        result = '';
      }
    }

    /* 2972: */
    var i = exponent;	/* r2 in the original code */

    if (i > 0)		/* is the absolute value of the number >= 1 ? */
    {
      if (i <= act_precision)
      {
        exponent = 0;
      }
    }

    else if (i == -0x1000) /* is the number = 0 ? */
    {
      exponent = 0;
    }
  
    else if ((i = -i) <= 2) /* is the absolute value of the number >= 0.001 ? */
    {
      /* 2988: */
      if (spec_precision >= 0)
      {
        act_precision -= i;
        if (result.length != 0)
        {
          --act_precision;
        }
      }
      /* 2998: fractional number in normal (not scientific) display format */
      result += '0';
      result +=  '.';
      /* 29A0: zeros between the decimal point and the mantissa */
      while (--i >= 0)
      {
        result += '0';
      }
      if (i <= act_precision)
      {
        exponent = 0;
      }
    }

    /* otherwise scientific notation */

    if (exponent != 0)		/* scientific notation? */
    {
    /* 29B4: */
      if (spec_precision >= 0)
      {
        act_precision = 3;
        if (result.length == 0)
        {
          ++act_precision;
        }
        /* 29C6: count the digits of the exponent and adjust act_precision accordingly,
          original loop unrolled */
        if (i < 1000)
        {
          ++act_precision;
          if (i < 100)
          {
            ++act_precision;
            if (i < 10)
            {
              ++act_precision;
            }
          }
        }
      }

      /* 29D6: */
        --exponent;
        i = 1;
      }

    /* 29DE: this loop outputs act_precision digits of the the mantissa,
     i = number of digits before the decimal point */
    do {
      result += String.fromCharCode(buffer[bufptr++]);
      if (buffer[bufptr] == 0)
      {
    /* 29F0: this loop outputs trailing zeros */
        while (--i > 0)
        {
          result += '0';
        }
        break;
      }
    /* 29E4: */
      if (--i == 0)
      {
        result += '.';
      }
    /* 29EC: */
    } while (--act_precision != 0);

    /* 29F8: output the exponent */
    if (exponent != 0)
      {
      /* there's no need to treat positive and negative values separately */
        result += (exponent > 0 ? "ᵉ" : "ᵉ⁻") + Math.abs(exponent);
      }
  
    return result;
}

function sv2str (offset, maxlen) {
  var quot = 0;
  var plus = 0;
  var j = (maxlen > 8) ? -1 : 1;

  var result = "";

  for (i=0; i<maxlen; i++)
    {
      c = get_byte(offset++);
      if (i != j)		/* skip the string variable identifier */
      {
  
  /* end of the string? */
        if (c == 0)
        {
          if (result == '') {
            result = '""';
          }
          break;
        }
        
  /* printable special unicode character? */
        else if (c < 0xC0 && CCODES[c] == '|')
          {
            if (plus != 0)
            {
              result+= "+";
              plus = 0;
            }
            if (quot == 0)
            {
              result+= '\x22';
              quot = 1;
            }
            result+= SUCODES[c-1];
          }
  
  /* printable character? */
        else if (c < 0xC0 && CCODES[c] != '~')
          {
            if (plus != 0)
            {
              result+= "+";
              plus = 0;
            }
            if (quot == 0)
            {
              result+= '\x22';
              quot = 1;
            }
            if (c == 0x7D) { //negative e
              result+= CCODES[0x7B];
            }
            result+= CCODES[c];
          }
  
  /* unprintable character */
        else
        {
          if (quot != 0)
          {
            result+= '\x22';
            quot = 0;
            plus = 1;
          }
          if (plus != 0)
          {
            result+= '+';
          }
          result += `CHR ${c}`
          plus = 1;
        }
      }
    }
  
    if (quot != 0)
    {
      result += '\x22';
    }
  
    return result;
}


// trying to tokenize characters

function basic_token(LINE, LPTR) {
  eptr = LPTR+6;

  if (LINE.substring(LPTR, eptr).toUpperCase() == "RETURN") { //only one 6-char token
    return [eptr, 0xDB];
  }

  eptr--;

  while (eptr != (LPTR+1)) {
    //console.log(eptr-LPTR-2, KEYWRD[eptr-LPTR-2], KEYWRD[eptr-LPTR-2].length);
    for (let i=0; i < KEYWRD[eptr-LPTR-2].length; i++) {
      //console.log(LINE.substring(LPTR, eptr).toUpperCase(), KEYWRD[eptr-LPTR-2][i].name);
      if (LINE.substring(LPTR, eptr).toUpperCase() == KEYWRD[eptr-LPTR-2][i].name) {
        return [eptr, KEYWRD[eptr-LPTR-2][i].code];
      }
    }
    eptr--;
  }

  return -1;
}

// convert Unicode character to MK character

function conv_char(chr) {
  var c1 = chr[0];

  for (let i=0; i < CCODES.length; i++) {
    if (c1 == CCODES[i]) {
      return i;
    }
  }

  for (let i=0; i < SUCODES.length; i++) { // >0xFFFF characters
    if (chr == SUCODES[i]) {
      return i+1;
    }
  }

  return -1;
}

// Parse string with BASIC code

function bas_parser(BUF, PTR, LINE, PREVN) {
  var sptr = PTR;

  // parse line number

  var linum = 0;
  var lptr = 4;
  while (isNaN(linum = Number(LINE.substring(0, lptr)))) {
    if (lptr == 1) {
      return [PTR, PREVN]; // failed to get line number, just skipping (treated as a comment line)
    }
    lptr--;
  }

  if (linum == 0) {
    return "LNUMPAR: line number cannot be zero";
  }
  else if (linum <= PREVN) {
    return "LNUMPAR: line number cannot be lower or equal to previous";
  }

  while (LINE[lptr] == ' ') {
    lptr++;
  }

  if (!isNaN(LINE[lptr])) {
    return "LNUMPAR: line number cannot be bigger than 9999";
  }

  BUF[PTR++] = linum & 0xFF
  BUF[PTR++] = (linum>>8) & 0xFF;

  var isquote = false;
  var iscomment = false;
  var isdigit = false;

  while (lptr < LINE.length) {

      if (LINE[lptr] == '"')
      {
        isquote = !isquote;
      }

      if (isquote || iscomment) {
        var code = LINE[lptr].charCodeAt(0);
        if ((code > 0x1F) && (code != 0x7F)) {
          var char;
          if ((LINE[lptr] == "ᵉ") && (LINE[lptr+1] == "⁻")) {
            char = 0x7D;
            lptr++;
          }
          else {
            char = conv_char(LINE[lptr]+LINE[lptr+1]);
          }
          if (char < 0) {
            return "CHARPAR: invalid character, position "+lptr;
          }
          if ((char >= 1) && (char <= 6)) {
            lptr++;
          }
          BUF[PTR++] = char;
        }
        lptr++;
        isdigit = false;
      }

      else {
        if (LINE[lptr] == ' ') {
          lptr++;
          continue;
        }

        var token = basic_token(LINE, lptr);

        if (token != -1) {
          BUF[PTR++] = token[1];
          lptr = token[0];
          isdigit = false;
        }

        else if (LINE[lptr] == '!') {
            BUF[PTR++] = '!'.charCodeAt(0);
            lptr++;
            iscomment = true;
            isdigit = false;
        }

        else if (isdigit && LINE[lptr] == 'E'){
            lptr++;
            if (LINE[lptr] == '-')
            {
              BUF[PTR++] = 0x7d;
              lptr++;
            }
            else
            {
              BUF[PTR++] = 0x7b;
            }
            isdigit = false;
        }

        else {
          if (LINE[lptr] == "^") {
            char = "^".charCodeAt(0);
          }
          else if ((LINE[lptr] == "ᵉ") && (LINE[lptr+1] == "⁻")) {
            char = 0x7D;
            lptr++;
          }
          else {
            var char = conv_char(LINE[lptr].toUpperCase()+LINE[lptr+1]);
            if (char < 0) {
              return "CHARPAR: invalid character, position "+lptr;
            }
            if ((char >= 1) && (char <= 6)) {
              lptr++;
            }
          }

          BUF[PTR++] = char;
          isdigit = ((char >= 0x30) && (char <= 0x39));
          lptr++;
        }
      }

    if (PTR >= BUF.length) {
      return "FREESP: program size exceeds RAM size";
    }
  }

  if (PTR+1 == BUF.length) {
    return "FREESP: program size exceeds RAM size";
  }

  // a line without spaces cannot exceed 63 characters (ERR! message)
  var destrl = linum.toString().length;
  for (let i=sptr+2; i<PTR; i++) {
    if (BUF[i] >= 0xC0 && BUF[i] <= 0xF1) {
      destrl+= TOKENS[BUF[i]-0xC0].trim().length;
    }
    else {
      destrl++;
    }
  }
  console.log(destrl);
  if (destrl > 63) { 
    return `LLENCHK: a line without spaces cannot exceed 63 characters, line have `+destrl;
  }

  return [PTR+1, linum]; // zero termination of the "string"
}
