svgNS = "http://www.w3.org/2000/svg";

function composeGUI() {
	var root = createSVG(760,330,"background-color:gainsboro");
	
	createImageOn(root);
	createButtonsOn(root);
	createOverlayOn(root);
	
	return root;
}

function createSVG(w,h,style) {
	var svg = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS(null,"width",  w);
	svg.setAttributeNS(null,"height", h);
	//svg.setAttributeNS(null,"style", style); // "background-color:gainsboro"
	
	return svg;
}

function createOverlayOn(svg){
	for (let i=1; i < 4; i++){
		var svgimg = document.createElementNS(svgNS,'image');
		svgimg.setAttributeNS(null,"id",`ovl${i}`);
		svgimg.setAttributeNS(null,'height','8');
		svgimg.setAttributeNS(null,'width','491');
		svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/ovl${i}.png`);
		svgimg.setAttributeNS(null,'x','11');
		svgimg.setAttributeNS(null,'y',(190+(42*(i-1))));
		svgimg.setAttributeNS(null, "opacity", 0);
		svgimg.setAttributeNS(null, 'visibility', 'visible');
		svg.append(svgimg);
	}
}

function createImageOn(svg){
	var svgimg = document.createElementNS(svgNS,'image');
	svgimg.setAttributeNS(null,'height','330');
	svgimg.setAttributeNS(null,'width','760');
	svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/face.png`);
	svgimg.setAttributeNS(null,'x','0');
	svgimg.setAttributeNS(null,'y','0');
	svgimg.setAttributeNS(null, 'visibility', 'visible');
	svg.append(svgimg);

	var svglab = document.createElementNS(svgNS,'image');
	svglab.setAttributeNS(null,"id","mktype");
	svglab.setAttributeNS(null,'height','17');
	svglab.setAttributeNS(null,'width','102');
	svglab.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/label.png`);
	svglab.setAttributeNS(null,'x','638');
	svglab.setAttributeNS(null,'y','49');
	svglab.setAttributeNS(null, 'visibility', 'visible');
	svg.append(svglab);
}

function createButtonsOn(svg) {
	var g = document.createElementNS(svgNS, "g");
	g.setAttributeNS(null,"cursor","pointer");
	g.setAttributeNS(null,"id", "powersw");
	g.setAttributeNS(null,"class", "mk85btn");

	var svgimg = document.createElementNS(svgNS,'image');
	svgimg.setAttributeNS(null,"id", "swi");
	svgimg.setAttributeNS(null,'height','31');
	svgimg.setAttributeNS(null,'width','29');
	svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/swi.png`);
	svgimg.setAttributeNS(null,'x','83');
	svgimg.setAttributeNS(null,'y','149');
	svgimg.setAttributeNS(null, "opacity", 0);
	svgimg.setAttributeNS(null, 'visibility', 'visible');
	svg.append(svgimg);
	g.appendChild(svgimg);

	g.addEventListener("touchstart", GUIKeyPress, false);
	g.addEventListener("touchend", GUIKeyRelease, false);

	g.addEventListener("mousedown",GUIKeyPress, false);
	g.addEventListener("mouseup",GUIKeyRelease, false);
	g.addEventListener("mouseout",GUIKeyRelease, false);

	svg.appendChild(g);

	for(var keyKey in faceKeys) {
		var key = faceKeys[keyKey];	// no pun intended =)

		var g = document.createElementNS(svgNS, "g");
		g.setAttributeNS(null,"cursor","pointer");
		g.setAttributeNS(null,"id", keyKey);
		g.setAttributeNS(null,"class", "mk85btn");

		switch(key.type) {
			case 0: // small white thing with labels above
			{
				var rect = document.createElementNS(svgNS, "image");
				var blockType = blockTypes[key.type];
				
				var x = blockType.off_x+blockType.mul_x*(key.posCode&0xf);
				var y = blockType.off_y+blockType.mul_y*((key.posCode>>4)&0xf);
				
				rect.setAttributeNS(null,"x",x);
				rect.setAttributeNS(null,"y",y);
				rect.setAttributeNS(null,"width",  36);
				rect.setAttributeNS(null,"height", 21);
				rect.setAttributeNS(null, "opacity", 0);
				rect.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/t0but.png`);
				rect.setAttributeNS(null, 'visibility', 'visible');

				svg.appendChild(rect);
				g.appendChild(rect);
				
				break;
			}
			case 1:		// numpad buttons
			{
				var rect = document.createElementNS(svgNS, "image");
				var blockType = blockTypes[key.type];
				
				var x = blockType.off_x+blockType.mul_x*(key.posCode&0xf);
				var y = blockType.off_y+blockType.mul_y*((key.posCode>>4)&0xf);
				
				var width = 36;
				if(typeof key.doubleWidth != 'undefined') {
					width += blockType.mul_x;
					rect.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/t1butw.png`);
				}
				else
					rect.setAttributeNS('http://www.w3.org/1999/xlink','href', `${BASEPATH}/bitmaps/t1but.png`);
				
				rect.setAttributeNS(null,"x",x);
				rect.setAttributeNS(null,"y",y);
				rect.setAttributeNS(null,"width",  width);
				rect.setAttributeNS(null,"height", 28);
				rect.setAttributeNS(null, "opacity", 0);
				rect.setAttributeNS(null, 'visibility', 'visible');
				svg.appendChild(rect);
				g.appendChild(rect);
				
				break;
			}
			default:
			{
				console.log("unsupported type");
				break;
			}
		}
		// bind functions
		g.addEventListener("touchstart", GUIKeyPress, false);
		g.addEventListener("touchend", GUIKeyRelease, false);

		g.addEventListener("mousedown",GUIKeyPress, false);
		g.addEventListener("mouseup",GUIKeyRelease, false);
		g.addEventListener("mouseout",GUIKeyRelease, false);

		svg.appendChild(g);
	}
}
