/*
 * wizard.js — step-by-step setup for the Alias 8 (opened with the "setup wizard" button, never automatically).
 *
 * Alias 8 control ids used here:
 *   knobs top row  = pot 0-7      knobs bottom row = pot 8-15
 *   faders 1-8     = pot 16-23    master fader     = pot 24
 *   buttons top    = btn/led 0-7  buttons bottom   = btn/led 8-15
 */

var WIZ_COLORS = ["off","red","green","yellow","blue","magenta","cyan","white"];
var WIZ_SWATCH = ["#2a2f38","#ff3b3b","#3bff6e","#ffe03b","#3b7bff","#ff3bf0","#3bf3ff","#ffffff"];

var WIZ_TEMPLATES = {
	sequential: {label: "Sequential", desc: "Knobs and faders send CC 1–25 in order, and buttons send notes 0–15. This is the Alias 8 factory layout.",
		knobTop: 1, knobBot: 9, fader: 17, master: 25, btnType: 0, btnTop: 0, btnBot: 8},
	daw: {label: "DAW-friendly", desc: "Only CCs that no instrument uses by default (102–117, 20–28), so MIDI-learn never clashes. Buttons send notes 36–51 (C1 up), which suits drum racks.",
		knobTop: 102, knobBot: 110, fader: 20, master: 28, btnType: 0, btnTop: 36, btnBot: 44},
	ableton: {label: "For the Alias8_Live script", desc: "Only for the Alias8_Live control surface script for Ableton Live (github.com/nygardsvulkanen/alias8-scribble) – for anything else, pick Sequential or DAW-friendly. Sets everything that script needs: factory numbering, momentary buttons, the Ableton colour map, lights controlled by Ableton, and the encoder's CC mode for tempo. Goes straight to the review.",
		knobTop: 1, knobBot: 9, fader: 17, master: 25, btnType: 0, btnTop: 0, btnBot: 8, togTop: 0, togBot: 0, colTop: 0, colBot: 0, banks: "seq", encBank: true, applyTo: "all"},
	current: {label: "Current settings", desc: "Start from what your controller has now and adjust from there."}
};

var wiz = null;   //wizard state
var wiz_step = 0;
var WIZ_STEPS = ["Start", "Knobs & faders", "Buttons", "Lights", "Banks", "Review"];

function wizardReady(){
	$("#wizard_btn").toggle(!!(product_ready && ALIAS8));
}

function wizFromCurrent(){
	var p = function(id){ return livid.pot[id] ? Number(livid.pot[id].nn) : 0; };
	var b = function(id){ return livid.btn[id] ? Number(livid.btn[id].nn) : 0; };
	var col = function(id){ var l = livid.led[id] || {}; return (l.red>0?1:0)+(l.green>0?2:0)+(l.blue>0?4:0); };
	var tog = function(id){ return livid.btn[id] && Number(livid.btn[id].toggle) ? 1 : 0; };
	return {
		knobTop: p(0), knobBot: p(8), fader: p(16), master: p(24),
		btnType: livid.btn[0] ? Number(livid.btn[0].mode) : 0, btnTop: b(0), btnBot: b(8),
		togTop: tog(0), togBot: tog(8),
		colTop: col(0), colBot: col(8)
	};
}

function openWizard(){
	if(!product_ready || !ALIAS8){ alertbox("The setup wizard is made for the Alias 8."); return; }
	if(requesting){ alertbox("Please wait until the settings have been read from the controller."); return; }
	var cur = wizFromCurrent();
	var chs = [];
	for(var i=0;i<15;i++) chs.push(livid.globl.bankchs ? Number(livid.globl.bankchs[i]) : i+1);
	var seq = true; for(var k=0;k<15;k++) if(chs[k] != k+1) seq = false;
	wiz = {
		template: "current", backup: true, applyTo: "current",
		knobTop: cur.knobTop, knobBot: cur.knobBot, fader: cur.fader, master: cur.master,
		btnType: cur.btnType, btnTop: cur.btnTop, btnBot: cur.btnBot,
		togTop: cur.togTop, togBot: cur.togBot,
		colTop: cur.colTop, colBot: cur.colBot,
		banks: seq ? "seq" : "keep", bankCh: chs[0] || 1,
		encBank: livid.enc[0] && Number(livid.enc[0].nn)==126
	};
	wiz_step = 0;
	if(!document.getElementById("wizard")){
		$("body").append('<div id="wizscrim"></div><div id="wizard" role="dialog" aria-modal="true" aria-labelledby="wiztitle">'+
			'<div class="wizhead"><h2 id="wiztitle">Setup wizard</h2><button type="button" class="wizclose" aria-label="Close">&times;</button></div>'+
			'<ol class="wizsteps"></ol><div class="wizbody"></div>'+
			'<div class="wizfoot"><button type="button" class="submitbtn wizback">Back</button><span class="wizspacer"></span><button type="button" class="submitbtn importantbtn wiznext">Next</button></div></div>');
		$("#wizard .wizclose, #wizscrim").on("click", closeWizard);
		$("#wizard .wizback").on("click", function(){
			wizRead();
			if(wiz.template=="ableton" && wiz_step==WIZ_STEPS.length-1){ wiz_step = 0; wizRender(); return; }
			if(wiz_step>0){ wiz_step--; wizRender(); }
		});
		$("#wizard .wiznext").on("click", function(){
			wizRead();
			if(wiz_step==0 && wiz.template=="ableton"){ wizApplyTemplate("ableton"); wiz_step = WIZ_STEPS.length-1; wizRender(); }
			else if(wiz_step < WIZ_STEPS.length-1){ wiz_step++; wizRender(); }
			else if(wiz_step == WIZ_STEPS.length-1){ wizApply(); }
			else { closeWizard(); }
		});
		$(document).on("keydown.wiz", function(e){ if(e.key=="Escape" && $("#wizard").is(":visible")) closeWizard(); });
	}
	wizRender();
	$("#wizscrim, #wizard").fadeIn(150);
}

function closeWizard(){
	$("#wizscrim, #wizard").fadeOut(150);
}

function wizNum(name, val, min, max){
	return '<input type="number" class="wiznum" name="'+name+'" value="'+val+'" min="'+min+'" max="'+max+'">';
}
function wizRange(start, n){ return start+"–"+(Number(start)+n-1); }
function wizSwatches(name, sel){
	var h = '<div class="swatches" data-name="'+name+'">';
	for(var i=0;i<8;i++){
		h += '<button type="button" class="swatch'+(i==sel?' on':'')+'" data-c="'+i+'" title="'+WIZ_COLORS[i]+'" style="--sw:'+WIZ_SWATCH[i]+'"><span>'+WIZ_COLORS[i]+'</span></button>';
	}
	return h+'</div>';
}
function wizRadio(name, val, cur, label, desc){
	return '<label class="wizopt'+(val==cur?' on':'')+'"><input type="radio" name="'+name+'" value="'+val+'"'+(val==cur?' checked':'')+'><span><b>'+label+'</b>'+(desc?'<small>'+desc+'</small>':'')+'</span></label>';
}

function wizRender(){
	var s = wiz_step, h = "";
	var steps = "";
	for(var i=0;i<WIZ_STEPS.length;i++) steps += '<li class="'+(i<s?'done':(i==s?'cur':''))+'"><span>'+(i+1)+'</span>'+WIZ_STEPS[i]+'</li>';
	$("#wizard .wizsteps").html(steps);
	if(s==0){
		h += '<p class="wizlead">Set up the whole Alias 8 in a few steps. Nothing is sent until you press <b>Apply</b> on the last step.</p>';
		h += '<div class="wizgroup"><h3>Start from</h3>';
		for(var t in WIZ_TEMPLATES) h += wizRadio("template", t, wiz.template, WIZ_TEMPLATES[t].label, WIZ_TEMPLATES[t].desc);
		h += '</div><label class="wizcheck"><input type="checkbox" name="backup"'+(wiz.backup?' checked':'')+'> Download a backup of the current settings before applying</label>';
	}else if(s==1){
		h += '<p class="wizlead">Each row counts up from its start number, one per control.</p>';
		h += '<div class="wizgrid">';
		h += '<div class="wizrow"><span>Knobs, top row</span>CC '+wizNum("knobTop",wiz.knobTop,0,113)+'<em data-r="knobTop:8"></em></div>';
		h += '<div class="wizrow"><span>Knobs, bottom row</span>CC '+wizNum("knobBot",wiz.knobBot,0,113)+'<em data-r="knobBot:8"></em></div>';
		h += '<div class="wizrow"><span>Faders 1–8</span>CC '+wizNum("fader",wiz.fader,0,113)+'<em data-r="fader:8"></em></div>';
		h += '<div class="wizrow"><span>Master fader</span>CC '+wizNum("master",wiz.master,0,120)+'<em data-r="master:1"></em></div>';
		h += '</div>'+wizMini();
	}else if(s==2){
		h += '<div class="wizgroup"><h3>Buttons send</h3><div class="seg">'+
			'<label class="'+(wiz.btnType==0?'on':'')+'"><input type="radio" name="btnType" value="0"'+(wiz.btnType==0?' checked':'')+'>Notes</label>'+
			'<label class="'+(wiz.btnType==1?'on':'')+'"><input type="radio" name="btnType" value="1"'+(wiz.btnType==1?' checked':'')+'>CCs</label></div></div>';
		h += '<div class="wizgrid">';
		h += '<div class="wizrow"><span>Top row</span>from '+wizNum("btnTop",wiz.btnTop,0,120)+'<em data-r="btnTop:8"></em>'+
			'<select name="togTop" class="menu"><option value="0"'+(wiz.togTop?'':' selected')+'>momentary</option><option value="1"'+(wiz.togTop?' selected':'')+'>toggle</option></select></div>';
		h += '<div class="wizrow"><span>Bottom row</span>from '+wizNum("btnBot",wiz.btnBot,0,120)+'<em data-r="btnBot:8"></em>'+
			'<select name="togBot" class="menu"><option value="0"'+(wiz.togBot?'':' selected')+'>momentary</option><option value="1"'+(wiz.togBot?' selected':'')+'>toggle</option></select></div>';
		h += '</div><p class="wizhint">Each button\'s LED listens to the same number, so your DAW can light it.</p>';
	}else if(s==3){
		h += '<p class="wizlead">Colour the buttons light up in now. You see it on the controller right after Apply.</p>';
		h += '<div class="wizgroup"><h3>Top row</h3>'+wizSwatches("colTop", wiz.colTop)+'</div>';
		h += '<div class="wizgroup"><h3>Bottom row</h3>'+wizSwatches("colBot", wiz.colBot)+'</div>';
		h += wizMini();
	}else if(s==4){
		h += '<p class="wizlead">The Alias 8 has 15 banks (pages). Each bank sends the same notes/CCs on its own MIDI channel.</p>';
		h += '<div class="wizgroup">'+
			wizRadio("banks","seq",wiz.banks,"Bank 1–15 on channels 1–15","Recommended. Your DAW can tell the banks apart.")+
			wizRadio("banks","one",wiz.banks,"All banks on one channel",'Channel '+wizNum("bankCh",wiz.bankCh,1,16)+' &mdash; every bank sends the same thing.')+
			wizRadio("banks","keep",wiz.banks,"Keep the current bank channels","")+'</div>';
		h += '<label class="wizcheck"><input type="checkbox" name="encBank"'+(wiz.encBank?' checked':'')+'> The encoder changes bank (factory behaviour)</label>';
		h += '<div class="wizgroup" style="margin-top:16px"><h3>Apply this setup to</h3>'+
			'<p class="wizhint" style="margin:-2px 0 8px">Each bank keeps its own knob, fader and button numbers.</p>'+
			wizRadio("applyTo","current",wiz.applyTo,"Only the active bank (bank "+wizBankNow()+")","")+
			wizRadio("applyTo","12345",wiz.applyTo,"Banks 1-5","For example: five pages of a control surface script.")+
			wizRadio("applyTo","all",wiz.applyTo,"All 15 banks","Recommended for the Alias8_Live script: every page (bank) you put in its PAGE_ORDER works.")+'</div>';
	}else if(s==5){
		var errs = wizCheck();
		h += '<div class="wizsummary">'+
			'<div><span>Knobs top</span><b>CC '+wizRange(wiz.knobTop,8)+'</b></div>'+
			'<div><span>Knobs bottom</span><b>CC '+wizRange(wiz.knobBot,8)+'</b></div>'+
			'<div><span>Faders 1–8</span><b>CC '+wizRange(wiz.fader,8)+'</b></div>'+
			'<div><span>Master</span><b>CC '+wiz.master+'</b></div>'+
			'<div><span>Buttons top</span><b>'+(wiz.btnType?'CC ':'Note ')+wizRange(wiz.btnTop,8)+' · '+(wiz.togTop?'toggle':'momentary')+' · <i class="dot" style="--sw:'+WIZ_SWATCH[wiz.colTop]+'"></i>'+WIZ_COLORS[wiz.colTop]+'</b></div>'+
			'<div><span>Buttons bottom</span><b>'+(wiz.btnType?'CC ':'Note ')+wizRange(wiz.btnBot,8)+' · '+(wiz.togBot?'toggle':'momentary')+' · <i class="dot" style="--sw:'+WIZ_SWATCH[wiz.colBot]+'"></i>'+WIZ_COLORS[wiz.colBot]+'</b></div>'+
			'<div><span>Banks</span><b>'+(wiz.banks=="seq"?'channels 1–15':(wiz.banks=="one"?'all on channel '+wiz.bankCh:'unchanged'))+(wiz.encBank?' · encoder changes bank':'')+'</b></div>'+
			'<div><span>Applied to</span><b>'+({current:"bank "+wizBankNow()+" only", "12345":"banks 1-5", "123456":"banks 1-6", all:"all 15 banks"}[wiz.applyTo])+'</b></div>'+
			(wiz.template=="ableton" ?
			'<div><span>Colour map</span><b>Alias8_Live script (velocity 1 red, 4 green, 8 yellow, 16 blue, 32 pink, 64 cyan, 127 white)</b></div>'+
			'<div><span>Button lights</span><b>controlled by Ableton (local lighting off, any-channel off)</b></div>'+
			'<div><span>Encoder, CC mode</span><b>CC 42, relative (tempo in the script)</b></div>' : '')+
			'</div>';
		if(errs.length) h += '<div class="wizerr"><b>Please fix:</b><ul><li>'+errs.join('</li><li>')+'</li></ul></div>';
		else h += '<p class="wizhint">Apply sends everything to the controller now. To keep it after unplugging, press <b>Save to device</b> afterwards.</p>';
	}
	$("#wizard .wizbody").html(h);
	$("#wizard .wizback").css("visibility", s==0 ? "hidden" : "visible");
	var last = s==WIZ_STEPS.length-1;
	$("#wizard .wiznext").text(last ? "Apply" : "Next").prop("disabled", last && wizCheck().length>0);
	//live bits
	$("#wizard .wizbody input[type=radio]").on("change", function(){
		var n = this.name;
		$('#wizard input[name="'+n+'"]').closest("label").removeClass("on");
		$(this).closest("label").addClass("on");
		if(n=="template"){ wizRead(); wizApplyTemplate(this.value); }
	});
	$("#wizard .swatch").on("click", function(){
		var $s = $(this).closest(".swatches");
		$s.find(".swatch").removeClass("on"); $(this).addClass("on");
		wiz[$s.data("name")] = Number($(this).data("c"));
		wizUpdateMini();
	});
	$("#wizard .wiznum").on("input", function(){ wizRead(); wizUpdateRanges(); wizUpdateMini(); });
	wizUpdateRanges();
	wizUpdateMini();
}

function wizBankNow(){
	var b = sx[26] && sx[26].length ? Number(sx[26][0]) + 1 : Number(livid.globl.bank) || 1;
	return b;
}

//which banks (0-based) the setup is written to
function wizBankList(){
	if(wiz.applyTo == "all"){ var l = []; for(var i=0;i<15;i++) l.push(i); return l; }
	if(wiz.applyTo == "123456") return [0, 1, 2, 3, 4, 5];
	if(/^12/.test(wiz.applyTo)) return [0, 1, 2, 3, 4];
	return [wizBankNow() - 1];
}

function wizApplyTemplate(t){
	wiz.template = t;
	var T = t=="current" ? wizFromCurrent() : WIZ_TEMPLATES[t];
	["knobTop","knobBot","fader","master","btnType","btnTop","btnBot"].forEach(function(k){ wiz[k] = T[k]; });
	if(t=="current" || t=="ableton"){ wiz.togTop = T.togTop; wiz.togBot = T.togBot; wiz.colTop = T.colTop; wiz.colBot = T.colBot; }
	if(t=="ableton"){ wiz.banks = T.banks; wiz.encBank = T.encBank; wiz.applyTo = T.applyTo; }
}

function wizRead(){
	var $b = $("#wizard .wizbody");
	$b.find("input.wiznum").each(function(){ wiz[this.name] = parseInt(this.value, 10); });
	$b.find("input[type=radio]:checked").each(function(){ wiz[this.name] = (this.name=="btnType") ? Number(this.value) : this.value; });
	$b.find("input[type=checkbox]").each(function(){ wiz[this.name] = this.checked; });
	$b.find("select").each(function(){ wiz[this.name] = Number(this.value); });
}

function wizUpdateRanges(){
	$("#wizard em[data-r]").each(function(){
		var p = $(this).data("r").split(":"), v = wiz[p[0]], n = Number(p[1]);
		var bad = isNaN(v) || v<0 || v+n-1 > (p[0].indexOf("btn")==0 && !wiz.btnType ? 127 : 120);
		$(this).text(isNaN(v) ? "" : (n>1 ? "→ "+wizRange(v,n) : "")).toggleClass("bad", bad);
	});
}

//small Alias 8 diagram used in the wizard
function wizMini(){
	var h = '<div class="wizmini">';
	for(var r=0;r<2;r++){ h += '<div class="mrow">'; for(var i=0;i<8;i++) h += '<i class="knob" data-k="'+(r*8+i)+'"></i>'; h += '</div>'; }
	h += '<div class="mrow faders">'; for(var f=0;f<8;f++) h += '<i class="fader" data-f="'+f+'"></i>'; h += '<i class="fader master"></i></div>';
	for(var r2=0;r2<2;r2++){ h += '<div class="mrow">'; for(var j=0;j<8;j++) h += '<i class="pad" data-b="'+(r2*8+j)+'"></i>'; h += '</div>'; }
	return h + '</div>';
}
function wizUpdateMini(){
	$("#wizard .wizmini .knob").each(function(){
		var k = Number($(this).data("k")); var v = (k<8 ? wiz.knobTop+k : wiz.knobBot+k-8);
		$(this).attr("data-v", isNaN(v)?"":v);
	});
	$("#wizard .wizmini .fader").each(function(){
		var f = $(this).data("f"); var v = $(this).hasClass("master") ? wiz.master : wiz.fader + Number(f);
		$(this).attr("data-v", isNaN(v)?"":v);
	});
	$("#wizard .wizmini .pad").each(function(){
		var b = Number($(this).data("b")); var c = b<8 ? wiz.colTop : wiz.colBot;
		this.style.setProperty("--sw", c ? WIZ_SWATCH[c] : "transparent"); //(jQuery 1.11 can't set CSS variables)
		$(this).toggleClass("lit", c>0);
	});
}

//returns a list of problems (empty = OK)
function wizCheck(){
	var e = [];
	var ranges = [["Knobs top row",wiz.knobTop,8],["Knobs bottom row",wiz.knobBot,8],["Faders",wiz.fader,8],["Master fader",wiz.master,1]];
	ranges.forEach(function(r){
		if(isNaN(r[1]) || r[1]<0 || r[1]+r[2]-1>120) e.push(r[0]+": the numbers must stay between 0 and 120.");
	});
	var maxb = wiz.btnType ? 120 : 127;
	[["Top row buttons",wiz.btnTop],["Bottom row buttons",wiz.btnBot]].forEach(function(r){
		if(isNaN(r[1]) || r[1]<0 || r[1]+7>maxb) e.push(r[0]+": the numbers must stay between 0 and "+maxb+".");
	});
	if(wiz.banks=="one" && !(wiz.bankCh>=1 && wiz.bankCh<=16)) e.push("Bank channel must be 1–16.");
	//overlaps between CC ranges
	var used = {}, clash = {};
	var add = function(name, start, n){
		for(var i=0;i<n;i++){
			var k=start+i;
			if(used[k] && used[k]!=name){ var key = used[k]+" and "+name; (clash[key] = clash[key] || []).push(k); }
			used[k]=name;
		}
	};
	ranges.forEach(function(r){ add(r[0], r[1], r[2]); });
	if(wiz.btnType){ add("Top row buttons", wiz.btnTop, 8); add("Bottom row buttons", wiz.btnBot, 8); }
	else{
		for(var i=0;i<8;i++) if(wiz.btnTop+i >= wiz.btnBot && wiz.btnTop+i < wiz.btnBot+8){ e.push("Top and bottom row buttons share notes."); break; }
	}
	for(var c in clash){
		var l = clash[c];
		e.push(c+" both use CC "+(l.length>1 ? l[0]+"–"+l[l.length-1] : l[0])+".");
	}
	if(wiz.encBank && wiz.btnType){
		for(var j=0;j<8;j++) if(wiz.btnTop+j==126 || wiz.btnBot+j==126) e.push("CC 126 is reserved for bank change.");
	}
	//de-duplicate messages
	return e.filter(function(m,i){ return e.indexOf(m)==i; }).slice(0,6);
}

function wizBackup(){
	var preset = {};
	for(var k in sx){ if(/^\d+$/.test(k) && Number(k)<126 && sx[k] && sx[k].length) preset[k] = sx[k].slice(0); }
	var d = new Date();
	var stamp = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)+"_"+("0"+d.getHours()).slice(-2)+("0"+d.getMinutes()).slice(-2);
	preset.name = "alias8-backup-"+stamp+".json"; preset.id = pid; preset.mfg = mfg;
	var a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([JSON.stringify(preset,null,'\t')], {type:"application/json"}));
	a.download = preset.name;
	document.body.appendChild(a); a.click();
	setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
	return preset.name;
}

function wizApply(){
	if(wizCheck().length) return;
	var backupName = wiz.backup ? wizBackup() : "";
	var i;
	//knobs & faders
	for(i=0;i<8;i++){
		wizSet("pot", i,    {nn: wiz.knobTop+i, mode: 0});
		wizSet("pot", 8+i,  {nn: wiz.knobBot+i, mode: 0});
		wizSet("pot", 16+i, {nn: wiz.fader+i,   mode: 0});
	}
	wizSet("pot", 24, {nn: wiz.master, mode: 0});
	//buttons + their LEDs (LED follows the button's number)
	for(i=0;i<16;i++){
		var top = i<8;
		var nn = (top ? wiz.btnTop : wiz.btnBot) + (i%8);
		wizSet("btn", i, {nn: nn, mode: wiz.btnType, toggle: (top ? wiz.togTop : wiz.togBot) ? 1 : 0});
		var c = top ? wiz.colTop : wiz.colBot;
		wizSet("led", i, {nn: nn, mode: wiz.btnType, red: c&1 ? 1:0, green: c&2 ? 1:0, blue: c&4 ? 1:0});
	}
	//bank channels
	if(wiz.banks != "keep"){
		var chs = {};
		for(i=0;i<15;i++) chs[i] = wiz.banks=="seq" ? i+1 : Number(wiz.bankCh);
		livid.globl.bankchs = chs;
	}
	//build the sysex
	obToSx([10, 11, 54, 4, 23]);
	wizRebuildLedMaps();
	if(wiz.encBank && sx[16] && sx[16].length >= 2){ sx[16][0] = 126; sx[16][1] = 1; if(livid.enc[0]){ livid.enc[0].nn = 126; livid.enc[0].mode = 1; } }
	var cmdlist = [10, 11, 54, 35, 36, 16, 23, 4];
	if(wiz.template == "ableton"){
		//colour map: velocity ranges 0 / 1-3 / 4-7 / 8-15 / 16-31 / 32-63 / 64-126 / 127
		sx[34] = [0,1,2,3,4,5,6,7];
		livid.colormap = sx[34].slice(0);
		if(typeof colormapToUI == "function") colormapToUI();
		//encoder CC mode (encoder slot 1): CC 42, relative
		if(sx[16] && sx[16].length >= 4){ sx[16][2] = 42; sx[16][3] = 1; }
		if(!livid.enc[1]) livid.enc[1] = {};
		livid.enc[1].nn = 42; livid.enc[1].mode = 1; livid.enc[1].type = 1;
		if(sx[17] && sx[17].length){ sx[17][0] = sx[17][0] | 2; }
		cmdlist.push(17, 34);
	}
	//write the setup to every chosen bank: select the bank (CMD 26), then send the maps for it
	var origBank = wizBankNow() - 1;
	var banks = wizBankList();
	var multi = !(banks.length == 1 && banks[0] == origBank);
	for(var bi=0; bi<banks.length; bi++){
		sx[26] = [banks[bi]];
		somesysex(multi ? [26].concat(cmdlist) : cmdlist);
	}
	if(multi){
		sx[26] = [origBank];
		midi_o(head.concat([26, origBank], eom)); //back to the bank you were on
	}
	if(wiz.template == "ableton"){
		//Ableton lights the buttons: switch off local lighting and "any channel"
		livid.globl.btnlocal_mom = 0; livid.globl.btnlocal_tog = 0; livid.globl.omni = 0;
		omniout();
		localout();
	}
	MidiQ.after(function(){
		clonesx();
		globalsToUI();
		dumpmap();
		paintLeds();
		if(selected){ var t = selected.split("_"); updatectlinspector(t[0], parseInt(t[1])); }
		$("#wizard .wizsteps").html("");
		$("#wizard .wizbody").html('<div class="wizdone"><div class="tick">&#10003;</div><h3>Applied to your Alias 8</h3>'+
			'<p>Written to '+({current:"bank "+(origBank+1), "12345":"banks 1-5", "123456":"banks 1-6", all:"all 15 banks"}[wiz.applyTo])+'. Try it now. It stays until you unplug the controller.<br>To keep it, press <b>Save to device</b>.</p>'+
			(backupName ? '<p class="wizhint">Backup downloaded as <code>'+backupName+'</code></p>' : '')+
			'<button type="button" class="submitbtn importantbtn wizsave">Save to device now</button></div>');
		$("#wizard .wizsave").on("click", function(){ saveclicked = 1; savetobrain(); closeWizard(); });
		$("#wizard .wizback").css("visibility","hidden");
		$("#wizard .wiznext").text("Close").prop("disabled", false);
		wiz_step = WIZ_STEPS.length; //next click closes
		alertbox("Setup applied. Press <b>save to device</b> to keep it after unplugging.");
	});
}

function wizSet(type, id, vals){
	if(!livid[type][id]) livid[type][id] = {};
	for(var k in vals) livid[type][id][k] = vals[k];
}

//LED note/CC maps (35 = notes, 36 = CCs): clear the old positions of the 16 button LEDs, then set the new ones.
function wizRebuildLedMaps(){
	var crs = [];
	for(var id=0; id<16; id++) crs.push(IDtocr[pid][id]);
	[35,36].forEach(function(CMD){
		if(!sx[CMD]) return;
		for(var n=0;n<sx[CMD].length;n++) if(crs.indexOf(sx[CMD][n]) >= 0) sx[CMD][n] = 127;
	});
	for(var id2=0; id2<16; id2++){
		var l = livid.led[id2];
		var CMD2 = Number(l.mode) ? 36 : 35;
		if(sx[CMD2]) sx[CMD2][Number(l.nn)] = IDtocr[pid][id2];
	}
}

//---------------- small UI hooks (header buttons, encoder direction) ----------------
$(function(){
	$("#wizard_btn").hide().on("click", openWizard);
	$("#follow_hw").on("change", function(){ follow_hw = this.checked; });
	$("#encdir").on("change", function(){ encdir_set(this.checked); });
});
