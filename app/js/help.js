/*
 * help.js — hover explanations for every setting in the editor.
 * Texts are looked up by element id, by "<form id>.<input name>", or by a data-help key.
 */

var HELP = {
	//--- header ---
	reload:   "Reload the editor. It reconnects and reads everything from the controller again.",
	follow:   "On: when you touch a knob, fader or button on the Alias 8, it's selected here so you can edit it.",
	wizard:   "Set up all knobs, faders, buttons, colours and banks in a few steps.",
	save:     "Store the settings in the controller so they're still there after unplugging. Until you press this, your changes are lost when you unplug.",
	defaults: "Put the controller back to factory settings. It asks you first.",

	//--- tabs ---
	global_tab:   "Settings for the whole controller.",
	colormap_tab: "Which colour a button shows for each velocity your DAW sends it.",
	midimon_tab:  "Shows the messages the controller sends. Handy for checking what a knob or button sends.",
	inspector_tab:"Settings for the control you clicked on the picture.",

	//--- global panel (other Livid models; the Alias 8 shows its explanations directly) ---
	encspeedA: "How much one click of the encoder changes the value. 1x is normal, higher is faster, fractions are finer.",
	encspeedB: "The second encoder speed setting. 1x is normal, higher is faster, fractions are finer.",
	settingsch: "The channel software uses to switch the lighting settings remotely. Leave it alone unless your software needs it.",
	settingsch_enable: "Off is normal. When on, software can only send remote setting commands on this one channel.",
	omni: "Your DAW can light the buttons on any MIDI channel.",
	merge: "Send the MIDI that comes in on the controller's MIDI input jack on to the computer.",
	xfadeflip: "Make the crossfader work the other way round.",
	atouchspeed: "How often pad pressure is sent. Lower means more messages.",
	ringlocal_abs: "The LED rings follow the encoders by themselves.",
	ringlocal_rel: "The LED rings follow the encoders by themselves (relative mode).",
	ringlocal_slide: "The touch-fader LEDs follow your finger by themselves.",
	btnlocal_mom: "Buttons light up by themselves while you press them.",
	btnlocal_tog: "Toggle buttons stay lit while they're on.",
	agslocal_fsr: "Pads light up by themselves when you hit them.",
	btnlocal: "Buttons light up by themselves when you press them.",
	bank: "Which bank (page) is active.",
	onech: "The MIDI channel the controller sends on.",
	encdet_abs: "Tune the encoder for clicky or smooth knobs.",
	encdet_rel: "Tune the encoder for clicky or smooth knobs.",
	encflip: "Make the encoders turn the other way round.",
	encdir: "Make the encoder turn the other way round. Experimental.",
	localcolor_on: "Use the colours shown now as the 'on' colours.",
	localcolor_off: "Use the colours shown now as the 'off' colours.",

	//--- colour map ---
	color_: "The colour a button shows when your DAW sends it a velocity in this range.",
	bankchs_: "The MIDI channel this bank sends on.",

	//--- button inspector ---
	"btn.nn": "The note number (or CC number) this button sends. 36 = C1, 60 = C3.",
	"btn.mode": "note: the button plays a note. cc: the button sends a controller value (127 = pressed, 0 = released).",
	"btn.toggle": "On: press once to switch on, press again to switch off. Off: on only while you hold it.",
	"btn.special": "Give the button a fixed job instead: 'bank' steps through the banks, 'enc. speed' switches the encoder speed, and 'mmc' sends play, continue or stop to your DAW.",
	lockled: "Locked: the button's light reacts to the same number the button sends. That's usually what you want, so your DAW can light it.",
	"led.nn": "The number your DAW sends to light this button. When locked, it's the same as the button's number.",
	"led.mode": "Whether your DAW lights this button with a note or a CC.",
	"led.onoff": "Turn this light on or off now.",
	"led.red": "The colour this button shows now. Mix them: R+G = yellow, R+B = pink, G+B = cyan, all three = white.",
	"led.green": "The colour this button shows now. Mix them: R+G = yellow, R+B = pink, G+B = cyan, all three = white.",
	"led.blue": "The colour this button shows now. Mix them: R+G = yellow, R+B = pink, G+B = cyan, all three = white.",
	group: "Copy these settings to the rest of the row, counting the numbers up from this one.",

	//--- knobs, faders ---
	"pot.nn": "The CC number this knob or fader sends (0-120).",
	"pot.mode": "cc. is normal. bend makes it send pitch bend.",
	"exp.nn": "The CC number this input sends (0-120).",
	"exp.mode": "cc. is normal. bend makes it send pitch bend.",

	//--- encoder ---
	"enc.nn": "What the encoder sends. 126 is the special value for changing banks.",
	"enc.mode": "Send a note or a CC.",
	"enc.type": "absolute sends 0-127 like a normal knob. relative sends up/down steps; use it if your DAW supports endless knobs.",
	"enc.style": "How the light ring shows the value.",
	"ledring.nn": "The CC number that moves the light ring.",
	"ledring.style": "How the light ring shows the value: one dot, filled, from the centre, or spread.",

	//--- pads / touch sliders (other Livid models) ---
	"fsr.nn": "The note this pad plays.",
	"fsr.nn_enable": "Play a note when the pad is hit.",
	"fsr.nvel_enable": "Always the same velocity, however hard you hit.",
	"fsr.ntog_enable": "Each hit switches the note on or off.",
	"fsr.cc": "The CC number for pad pressure.",
	"fsr.cc_enable": "Send pad pressure as a CC.",
	"fsr.filter": "How sensitive the pad is.",
	"fsr.mode": "What the pressure is sent as.",
	"slide.cc": "The CC number this slider sends.",
	"slide.mode": "What the slider is sent as.",
	"slide.output": "How detailed the slider's output is.",
	"slide.nn": "The note sent when you touch the slider.",
	"slide.sendnote": "Send a note when you touch the slider.",
	"slide.fixvel": "Send the touch note with a fixed velocity.",
	"slide.style": "How the slider lights show the value.",
	"slide.color": "The colour of the slider lights.",

	//--- send MIDI / sysex / presets ---
	"sendmidi.nn": "Send a test message to the controller, for example to see which button lights up and in what colour.",
	"sendmidi.vel": "The velocity of the test message (0-127). It picks the colour (see the Color tab).",
	"sendmidi.bankchs_2": "The channel of the test message.",
	"sendmidi.mode": "Send the test as a note or a CC.",
	sysexvalue: "For experts: send raw system-exclusive bytes, separated by spaces (240 ... 247).",
	presetname: "The name for the preset file.",
	createfile: "Save all settings to a file on your computer.",
	fileInput: "Load a preset file and send it to the controller. Press 'save to device' afterwards to keep it."
};

function helpFor(el){
	var $el = $(el);
	var id = el.id || "";
	if($el.attr("data-help") && HELP[$el.attr("data-help")]) return HELP[$el.attr("data-help")];
	if(id && HELP[id]) return HELP[id];
	var form = $el.closest("form").attr("id");
	if(form && el.name && HELP[form+"."+el.name]) return HELP[form+"."+el.name];
	if(/^color_\d/.test(id)) return HELP.color_;
	if(/^bankchs_\d/.test(id)) return HELP.bankchs_;
	return "";
}

var help_timer = null;
function initHelp(){
	if(!document.getElementById("tip")) $("body").append('<div id="tip" role="tooltip"></div>');
	//buttons without ids
	$("#save input").attr("data-help","save");
	$("#defaults input").attr("data-help","defaults");
	$(".group_btn").attr("data-help","group");
	$("#container input[type=text]").attr("data-help","presetname");
	$("#container button").attr("data-help","createfile");
	//attach a help text to every settings row (so hovering the label works too)
	$("input, select, button, label.hwfollow, a[data-help]").each(function(){
		var t = helpFor(this);
		if(!t && this.tagName=="LABEL") t = HELP[$(this).attr("data-help")];
		if(!t) return;
		var $row = $(this).closest("li");
		var $target = ($row.length && $row.find("input:not([type=hidden]), select").length <= 1 && !$row.hasClass("bankli")) ? $row : $(this);
		if(this.type == "checkbox" && $(this).next("label").length && !$row.length) $target = $(this).next("label");
		if(!$target.attr("data-tip")) $target.attr("data-tip", t);
	});
	$(document).on("mouseover", "[data-tip]", function(e){
		var el = this;
		clearTimeout(help_timer);
		help_timer = setTimeout(function(){ showTip(el); }, 350);
		e.stopPropagation();
	});
	$(document).on("mouseout", "[data-tip]", function(){
		clearTimeout(help_timer);
		$("#tip").removeClass("show");
	});
	$(document).on("mousedown", function(){ clearTimeout(help_timer); $("#tip").removeClass("show"); });
}

function showTip(el){
	var $tip = $("#tip");
	$tip.text($(el).attr("data-tip"));
	var r = el.getBoundingClientRect();
	var tw = Math.min(300, window.innerWidth - 24);
	$tip.css({width: "auto", maxWidth: tw});
	var w = $tip.outerWidth(), h = $tip.outerHeight();
	var left = Math.max(12, Math.min(r.left + r.width/2 - w/2, window.innerWidth - w - 12));
	var top = r.bottom + 8;
	if(top + h > window.innerHeight - 8) top = r.top - h - 8;
	$tip.css({left: left, top: top}).addClass("show");
}

$(function(){ initHelp(); });
