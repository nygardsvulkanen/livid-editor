/*
 * globalpanel.js — a clearer "Global" panel for the Alias 8.
 * Rearranges the existing inputs (same ids/names, so the rest of the editor keeps working)
 * into plain-language sections, each setting with a short explanation under it.
 * Called from product() before the form handlers are attached. Other Livid models keep the old panel.
 */

function gRow(id, title, desc, extraClass){
	//moves the existing input (+ its label) into a new row
	var $in = $("#"+id);
	if(!$in.length) return null;
	var $row = $('<div class="grow'+(extraClass?' '+extraClass:'')+'"><div class="gtext"><div class="gtitle"></div><div class="gdesc"></div></div><div class="gctl"></div></div>');
	$row.find(".gtitle").html(title);
	$row.find(".gdesc").html(desc);
	var $lab = $in.next("label");
	$row.find(".gctl").append($in);
	if($in.is(":checkbox")){
		if(!$lab.length) $lab = $('<label for="'+id+'"></label>');
		$lab.addClass("gswitch").attr("aria-label", $("<div>").html(title).text()).text("");
		$row.find(".gctl").append($lab);
	}
	return $row;
}

function organizeGlobalPanel(){
	if(!ALIAS8 || $("#global_div").hasClass("gpanel")) return;
	var $div = $("#global_div").addClass("gpanel");
	var $form = $("#globl");
	var $old = $form.children("ul");

	//the active bank becomes a menu 1-15 (same id/name, so loading/sending works as before)
	var $bank = $("#bank");
	var $bankSel = $('<select type="menu" name="bank" class="menu" id="bank"></select>');
	for(var b=1;b<=15;b++) $bankSel.append('<option>'+b+'</option>');
	$bank.replaceWith($bankSel);

	var $s1 = $('<section class="gsec"><h5>Buttons &amp; lights</h5></section>');
	$s1.append(gRow("btnlocal_mom", "Light up while pressed", "Momentary buttons light up by themselves while you hold them. When off, only your DAW lights them."));
	$s1.append(gRow("btnlocal_tog", "Show the on/off state", "Toggle buttons stay lit while they're on. When off, only your DAW lights them."));
	$s1.append(gRow("omni", "Accept lights on any channel", "Your DAW can light the buttons on any MIDI channel, not just the active bank's channel."));

	var $s2 = $('<section class="gsec"><h5>Encoder</h5></section>');
	$s2.append(gRow("encspeedA", "Speed A <span class=\"gnote\">CC mode</span>", "How far one click moves the value. Factory: 8x. Higher is faster, fractions are finer."));
	$s2.append(gRow("encspeedB", "Speed B <span class=\"gnote\">bank mode</span>", "Factory: 1x, so one click = one bank. (Livid never said which speed is which; the factory values suggest this.)"));
	var $dir = gRow("encdir", "Reverse direction <span class=\"exp\">experimental</span>", "Flips which way is up, including for changing banks. It's kept only after you press <b>save to device</b>; unplug and replug to undo.");
	if($dir){ $dir.find("#encdir").attr("data-local","1"); $s2.append($dir); }

	var $s3 = $('<section class="gsec"><h5>Banks</h5></section>');
	$s3.append(gRow("bank", "Active bank", "The Alias 8 has 15 banks (pages). Switch with the encoder or here."));
	var $chRow = $('<div class="grow"><div class="gtext"><div class="gtitle">MIDI channels</div><div class="gdesc" id="bankch_summary"></div></div>'+
		'<div class="gctl"><button type="button" class="submitbtn gsmall" id="bankch_toggle" data-local="1" aria-expanded="false">Change</button></div></div>');
	var $grid = $('<div class="bankgrid" id="bankgrid" hidden></div>');
	for(var i=0;i<15;i++){
		var $sel = $("#bankchs_"+i);
		var $cell = $('<label class="bankcell"><span>Bank '+(i+1)+'</span></label>');
		$cell.append($sel);
		$grid.append($cell);
	}
	$grid.append('<div class="bankgrid_foot"><button type="button" class="submitbtn gsmall" id="bankch_reset" data-local="1">Reset to 1&ndash;15</button>'+
		'<span>Only needed if another device already uses some of these channels, or you want banks to share a channel.</span></div>');
	$s3.append($chRow, $grid);

	var $adv = $('<details class="gsec gadv"><summary>Advanced</summary></details>');
	$adv.append(gRow("settingsch_enable", "Use a remote-command channel", "Off is normal. When on, software can only switch the local lighting and \"any channel\" settings above on this one channel."));
	$adv.append(gRow("settingsch", "Remote-command channel", "The channel used when the setting above is on."));

	$form.prepend($s1, $s2, $s3, $adv);
	$old.remove();                       //leftover rows (merge, unused headings) are not used by the Alias 8
	$div.children("ul").remove();        //old "encoder hardware" list (its encoder-direction row was moved above)
	$div.children("h4").first().text("Global settings");
	$("#firmware").appendTo($div);

	//bank channel summary + editor
	$("#bankch_toggle").on("click", function(){
		var open = $("#bankgrid").prop("hidden");
		$("#bankgrid").prop("hidden", !open);
		$(this).text(open ? "Done" : "Change").attr("aria-expanded", open);
	});
	$("#bankch_reset").on("click", function(){
		var chs = {};
		for(var i=0;i<15;i++){ chs[i] = i+1; $("#bankchs_"+i).val(String(i+1)); }
		livid.globl.bankchs = chs;
		obToSx([23]);
		cmdout([23]);
		dumpmap();
		updateBankSummary();
		alertbox("Bank channels reset to 1&ndash;15.");
	});
	$grid.on("change", "select", function(){ setTimeout(updateBankSummary, 0); });
}

//"Bank 1–15 use channels 1–15", or a short list of exceptions
function updateBankSummary(){
	if(!document.getElementById("bankch_summary") || !livid.globl.bankchs) return;
	var chs = livid.globl.bankchs, diff = [];
	for(var i=0;i<15;i++){ if(Number(chs[i]) != i+1) diff.push("bank "+(i+1)+" &rarr; ch "+chs[i]); }
	var txt = diff.length ? (diff.length > 3 ? "Custom: "+diff.slice(0,3).join(", ")+" &hellip;" : "Standard, except "+diff.join(", ")) :
		"Standard: bank 1&ndash;15 send on channels 1&ndash;15, so your DAW can tell the banks apart.";
	$("#bankch_summary").html(txt);
}
