/*
 * midiio.js — MIDI transport for the Livid editor, built directly on the Web MIDI API.
 *
 * Replaces the older JZZ/Jazz-plugin based version. Main differences:
 *  - MIDI input stays connected when the browser window loses focus (it used to be
 *    closed on blur and never correctly reopened, so the editor went "deaf").
 *  - Outgoing Livid sysex is sent through a paced queue: each settings command waits
 *    for the controller's reply (ACK/NACK or the requested data, with a timeout)
 *    before the next one goes out, so the controller is never flooded.
 *  - Every outgoing message is validated; a bad value is reported instead of throwing.
 *  - Unplugging / re-plugging the controller is detected and the connection restored.
 */

var outports, inports;
var current_in = 0;
var midiAccess = null;
var output_port = null;
var input_port = null;
var selected_port_name = null;
var port_lost = false;

var MIDI_SET_TIMEOUT = 200;   //ms to wait for an ACK after a settings command
var MIDI_REQ_TIMEOUT = 600;   //ms to wait for the reply to a request (CMD 7)

//----------------------------------------------------------------------------------
// Port menus
//----------------------------------------------------------------------------------

function makemidimenu(){
	outports = document.getElementById('outports');
	inports = document.getElementById('inports');
	if(!navigator.requestMIDIAccess){
		var isFF = /firefox/i.test(navigator.userAgent);
		if(isFF && location.protocol == "file:"){
			midiHint("Firefox only allows MIDI for pages served from your computer, not opened as a file.<br>Close this tab and double-click <b>Start editor (Firefox).command</b> in the editor folder.");
		}else{
			midiHint("This browser has no Web MIDI support.<br>Please use <b>Google Chrome</b>, <b>Microsoft Edge</b> or <b>Firefox</b> (Firefox via the start script).");
		}
		return;
	}
	midiHint("Waiting for MIDI permission&hellip;<br><span style='font-size:0.8em'>Allow MIDI / system exclusive access when the browser asks.</span>");
	navigator.requestMIDIAccess({sysex: true}).then(function(access){
		midiAccess = access;
		access.onstatechange = onMidiStateChange;
		populatemidimenu();
	}, function(err){
		console.log("MIDI access refused", err);
		if(/firefox/i.test(navigator.userAgent) && location.protocol == "file:"){
			midiHint("Firefox can't use MIDI on a page opened as a file.<br>Close this tab and double-click <b>Start editor (Firefox).command</b> in the editor folder.");
			return;
		}
		midiHint("MIDI access was refused.<br>Allow MIDI (including system exclusive / \"sysex\" messages) for this page in the browser's site settings, then reload.");
	});
}

function midiHint(html){
	$("#midihint").css({visibility: 'visible'}).html("<h3 style='margin-top:5px'>"+html+"</h3>");
}

function portList(map){
	var list = [];
	if(map) map.forEach(function(p){ list.push(p); });
	return list;
}

function isLividPortName(name){
	return /livid|alias|ohm|block|code|cntrl|base|ds1|guitar ?wing|brain/i.test(name || "");
}

function populatemidimenu(){
	if(!midiAccess) return;
	var outs = portList(midiAccess.outputs);
	var ins = portList(midiAccess.inputs);
	var keep = outports.selectedIndex > 0 ? outports.value : null;

	outports.options.length = 0;
	outports.add(new Option("--Select a Port--", ""));
	outs.forEach(function(p){ outports.add(new Option(p.name, p.name)); });
	inports.options.length = 0;
	inports.add(new Option("Not connected", ""));
	ins.forEach(function(p){ inports.add(new Option(p.name, p.name)); });
	if(keep) outports.value = keep;

	document.getElementById('midiout').className = '';
	if(!outs.length){
		midiHint("No MIDI ports found.<br>Connect your controller &mdash; this list updates automatically.");
		return;
	}
	midiHint("Select a port.");
	//if exactly one port looks like a Livid controller and nothing is selected yet, connect to it straight away
	if(!selected_port_name){
		var livid_outs = outs.filter(function(p){ return isLividPortName(p.name); });
		if(livid_outs.length == 1){
			outports.value = livid_outs[0].name;
			midioutports(livid_outs[0].name);
		}
	}
}

//strip the decorations some OSes add, so "MIDIOUT2 (Alias 8)" can be matched with "MIDIIN2 (Alias 8)" etc.
function basePortName(n){
	return (n || "").toLowerCase().replace(/midi(in|out)\d*\s*\(([^)]*)\)/, "$2").replace(/\b(in|out|input|output)\b/g, "").replace(/\s+/g, " ").trim();
}

function findPort(map, name){
	var exact = null, loose = null;
	map.forEach(function(p){
		if(p.name === name) exact = p;
		else if(!loose && basePortName(p.name) === basePortName(name)) loose = p;
	});
	return exact || loose;
}

//select an out port (and the matching in port)
function midioutports(theport){
	var name = theport || outports.options[outports.selectedIndex].value;
	if(!name || !midiAccess) return;
	console.log("port selected: "+name);
	var out = findPort(midiAccess.outputs, name);
	var inp = findPort(midiAccess.inputs, name);
	if(!out){
		alertbox("That MIDI port is not available any more. Please pick another one.");
		return;
	}
	if(!inp){
		alertbox("There is no MIDI input matching \""+name+"\".<br>The editor needs both directions to talk to the controller. Check the cable and the port name.", 1);
		return;
	}
	selected_port_name = name;
	attachPorts(out, inp);
	inselected();
}

function attachPorts(out, inp){
	if(input_port && input_port !== inp) input_port.onmidimessage = null;
	output_port = out;
	input_port = inp;
	top.output_port = out;
	top.input_port = inp;
	input_port.onmidimessage = function(ev){ midiProc(ev.data); };
	if(output_port.open) output_port.open();
	current_in = inp.name;
	for(var i=0;i<inports.length;i++){
		if(inports[i].value == inp.name) inports[i].selected = 1;
	}
	port_lost = false;
	MidiQ.reset();
}

//only used for testing without hardware (SPOOF)
function midiinports(){}

function inselected(){
	$("#midiio").fadeOut(1000);
	$("#midihint").css({visibility : 'hidden'});
	$("#midiioscrim").fadeOut(1000);
	$("#left_container").css({'opacity' : 1});
	$("#right_container").css({'opacity' : 1});
	inquire(); //send inquiry to find out what controller is on this port
}

//bring the port selector back, e.g. when nothing answered on the chosen port
function showPortSelector(msg){
	selected_port_name = null;
	if(input_port) input_port.onmidimessage = null;
	input_port = output_port = null;
	$("#midiio").stop(true,true).fadeIn(300);
	$("#midiioscrim").stop(true,true).fadeIn(300);
	$("#left_container").css({'opacity' : 0.1});
	$("#right_container").css({'opacity' : 0.1});
	outports.selectedIndex = 0;
	midiHint(msg || "Select a port.");
}

//hot-plug handling
function onMidiStateChange(e){
	var p = e.port;
	if(!p) return;
	if(!selected_port_name){
		populatemidimenu();
		return;
	}
	var ours = basePortName(p.name) === basePortName(selected_port_name);
	if(!ours) return;
	if(p.state === "disconnected" && !port_lost){
		port_lost = true;
		MidiQ.reset();
		alertbox("The controller was disconnected.<br>Plug it back in &mdash; the editor will reconnect by itself.", 1);
	}else if(p.state === "connected" && port_lost){
		var out = findPort(midiAccess.outputs, selected_port_name);
		var inp = findPort(midiAccess.inputs, selected_port_name);
		if(out && inp && out.state === "connected" && inp.state === "connected"){
			attachPorts(out, inp);
			alertbox("Controller reconnected. Reading its settings again&hellip;");
			if(typeof product_ready != "undefined" && product_ready){
				request();
			}else{
				inquire();
			}
		}
	}
}

//kept for compatibility with code that used to close/reopen the input
function connectMidiIn(){}
function disconnectMidiIn(){}

//----------------------------------------------------------------------------------
// Output: validation + paced queue
//----------------------------------------------------------------------------------

function flattenMidiArgs(args){
	var a = Array.prototype.slice.call(args, 0);
	if(a.length == 1 && a[0] && typeof a[0] == "object") a = Array.prototype.slice.call(a[0], 0);
	var out = [];
	for(var i=0;i<a.length;i++){
		if(a[i] && typeof a[i] == "object" && a[i].length !== undefined){
			for(var j=0;j<a[i].length;j++) out.push(a[i][j]);
		}else{
			out.push(a[i]);
		}
	}
	return out;
}

//returns an error string, or "" if the message is valid MIDI
function midiError(msg){
	if(!msg.length) return "empty message";
	for(var i=0;i<msg.length;i++){
		var v = msg[i];
		if(typeof v != "number" || isNaN(v) || v !== Math.floor(v)) return "byte "+i+" is not a number ("+v+")";
		if(v < 0 || v > 255) return "byte "+i+" out of range ("+v+")";
	}
	if(msg[0] == 240){
		if(msg[msg.length-1] != 247) return "sysex without end byte";
		for(var k=1;k<msg.length-1;k++){
			if(msg[k] > 127) return "sysex data byte "+k+" is "+msg[k]+" (max 127)";
		}
	}else if(msg[0] < 128){
		return "message does not start with a status byte";
	}
	return "";
}

function isLividSysex(m){
	return m.length > 5 && m[0]==240 && m[1]==0 && m[2]==1 && m[3]==97;
}

var MidiQ = {
	q: [],
	waiting: null,  //{match: fn, timer: id}
	reset: function(){
		if(this.waiting) clearTimeout(this.waiting.timer);
		this.waiting = null;
		this.q = [];
	},
	push: function(item){
		this.q.push(item);
		this.pump();
	},
	//run fn once everything queued before it has been sent and answered
	after: function(fn){
		this.push({fn: fn});
	},
	pump: function(){
		while(!this.waiting && this.q.length){
			var item = this.q.shift();
			if(item.fn){
				try{ item.fn(); }catch(e){ console.error(e); }
				continue;
			}
			if(!output_port){
				console.log("midi out dropped (no port)", item.msg);
				continue;
			}
			try{
				output_port.send(item.msg);
			}catch(e){
				console.error("MIDI send failed", e, item.msg);
				continue;
			}
			if(item.wait){
				var self = this;
				this.waiting = {match: item.wait, timer: setTimeout(function(){
					if(item.onTimeout) item.onTimeout();
					self.waiting = null;
					self.pump();
				}, item.timeout)};
			}
		}
	},
	//called for every incoming message
	incoming: function(m){
		if(this.waiting && this.waiting.match(m)){
			clearTimeout(this.waiting.timer);
			this.waiting = null;
			var self = this;
			setTimeout(function(){ self.pump(); }, 0);
		}
	}
};

function midi_o(){
	var msg = flattenMidiArgs(arguments);
	var err = midiError(msg);
	if(err){
		console.error("NOT sent - invalid MIDI ("+err+"): "+msg);
		alertbox("A value could not be sent to the controller ("+err+").<br>Please check the value you entered.");
		return false;
	}
	var item = {msg: msg};
	if(isLividSysex(msg)){
		var h = msg.slice(0,5);
		var sameDevice = function(r){ return isLividSysex(r) && r[4]==h[4]; };
		if(msg[5] == 7){ //request: wait for the matching reply (or a NACK)
			var want = msg[6];
			item.wait = function(r){ return sameDevice(r) && (r[5]==want || r[5]==126); };
			item.timeout = MIDI_REQ_TIMEOUT;
			item.onTimeout = function(){ console.log("no reply to request "+want+" ("+(cmdfriendly[want]||"")+")"); };
		}else{ //settings command: wait for the ACK/NACK
			item.wait = function(r){ return sameDevice(r); };
			item.timeout = MIDI_SET_TIMEOUT;
		}
	}
	if(DEBUGMIDI) console.log("midi out: "+msg);
	MidiQ.push(item);
	return true;
}

//----------------------------------------------------------------------------------
// Input
//----------------------------------------------------------------------------------

var sysexbuffer = [];
var issysex = false;

function midiProc(data){
	var m = Array.prototype.slice.call(data, 0);
	if(!m.length) return;
	if(m[0] >= 248) return; //realtime (clock, active sensing...) - ignore
	//Web MIDI delivers complete sysex messages, but keep a small reassembly buffer just in case
	if(m[0] == 240 && m[m.length-1] != 247){
		sysexbuffer = m; issysex = true; return;
	}
	if(issysex){
		sysexbuffer = sysexbuffer.concat(m);
		if(m[m.length-1] != 247) return;
		m = sysexbuffer; sysexbuffer = []; issysex = false;
	}
	if(m[0] == 240){
		MidiQ.incoming(m);
		if(m[5] == 7 && isLividSysex(m)) return; //a request echoed back (e.g. through a MIDI loop) - ignore
		var ohmblockfilter = (m[5]==9 && !requesting); //the ohm & block confirm an rx of cmd 9 with a tx of cmd 9
		if(!ohmblockfilter){
			procSysex(m); //in uitocontroller.js
		}
	}else{
		highlight(m[0], m[1], m[2]);
		viewmidi(midiString(m));
	}
}

//-----------MIDI of the non-sysex variety-------------
var pvsID = -1;
var hw_last = {};   //last value seen per control, to ignore jitter from worn knobs/faders
//select the control that was touched on the hardware (if "follow hardware" is on)
function highlight(){
	var a = Array.prototype.slice.call(arguments, 0);
	if(a.length == 1) a = Array.prototype.slice.call(a[0], 0);
	var status = a[0], d1 = a[1], d2 = a[2];
	if(typeof product_ready == "undefined" || !product_ready || requesting) return;
	checkBankFromChannel(status);
	if(typeof follow_hw != "undefined" && !follow_hw) return;
	var kind = status >> 4;
	if(kind == 8 || (kind == 9 && !d2)) return;                 //note off / release: don't move the selection
	if(typeof last_screen_select != "undefined" && Date.now() - last_screen_select < 1500) return; //user just clicked on screen
	var key = status | (d1 << 8);
	if(typeof miditoID == "undefined" || !miditoID[key]) return;
	if(kind == 11){ //CC: only react to a real movement (3+ steps from where it rested), not to +/-1 jitter
		var anchor = hw_last[key];
		if(anchor === undefined){ hw_last[key] = d2; return; }
		if(Math.abs(anchor - d2) < 3) return;
		hw_last[key] = d2;
	}
	var id = miditoID[key][0];
	var type = miditoID[key][1];
	if(type+"_"+id != pvsID){
		selctl(pid, type+"_"+id);
	}
	pvsID = type+"_"+id;
}

//The Alias 8 changes bank (= MIDI channel) with its encoder. If messages suddenly arrive on the channel of
//another bank, re-read the bank number and its LED colours so the screen follows.
var bank_check_timer = null;
function checkBankFromChannel(status){
	if(status < 128 || status >= 240 || typeof livid == "undefined" || !livid.globl || !livid.globl.bankchs) return;
	var ch = (status & 15) + 1;
	var cur = Number(livid.globl.bank) - 1;
	var chs = livid.globl.bankchs;
	if(chs[cur] == ch) return;
	var matches = 0;
	for(var b in chs) if(chs[b] == ch) matches++;
	if(!matches) return;
	clearTimeout(bank_check_timer);
	bank_check_timer = setTimeout(function(){ refreshBankState(); }, 150);
}

function midiString(){
	var arg = Array.prototype.slice.call(arguments, 0);
	if(arg.length == 1) arg = Array.prototype.slice.call(arg[0], 0);
	var a = arg[0], b = arg[1], c = arg[2];
	var cmd = a >> 4;
	var note = b;
	var notename = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][note%12] + (Math.floor(note/12) - 2);
	var channel = 1 + (a % 16);
	var str = "CH "+channel+" | ";
	if(cmd == 8)       str += "NoteOff ("+notename+") "+note+" "+c;
	else if(cmd == 9)  str += (c ? "Note" : "NoteOff")+" ("+notename+") "+note+" "+c;
	else if(cmd == 10) str += "Polytouch "+note+" ("+notename+") "+c;
	else if(cmd == 11) str += "CC "+b+" "+c;
	else if(cmd == 12) str += "Program "+b;
	else if(cmd == 13) str += "Aftertouch "+b;
	else if(cmd == 14) str += "Pitch Wheel "+((c<<7|b)-8192);
	else str = arg.join(" ");
	return str;
}

function testmidiio(){
	console.log("midiio.js is here!");
}
