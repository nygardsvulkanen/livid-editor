# Fixes to the Livid Online Editor (October 2026)

Open `index.html` in **Google Chrome** or **Microsoft Edge** and allow MIDI / system-exclusive access when asked.
(Safari has no Web MIDI support.)

## MIDI connection (js/midiio.js, rewritten on the browser's Web MIDI API — JZZ.js is no longer used)
- MIDI input no longer dies after switching to another window and back (it used to be closed on blur and reopened on the wrong port).
- Settings messages are sent one at a time: each waits for the controller's reply/ACK (with a timeout), so the controller is never flooded.
- Every outgoing message is checked; an invalid value shows a message instead of crashing the page.
- Unplugging and re-plugging the controller is detected; the editor reconnects and re-reads the settings.
- If only one Livid port is present it is selected automatically. If nothing answers on the chosen port, the port menu comes back with an explanation.
- Clear messages when the browser has no Web MIDI or MIDI permission was refused.

## Reading settings (js/uitocontroller.js)
- Settings are requested one by one with a progress counter, and loading always finishes (even if the controller skips a command).
- Fixed: after loading, the editor used to write almost every setting straight back to the controller (and crash on a missing one).
- Repeated identity replies no longer build the interface twice.
- "Settings loaded" message now appears when the page is opened from disk (the firmware list is built in).
- Removed the expansion-jack request the Alias 8 never answers.

## Editing (js/faceplate.js, js/uitocontroller.js, js/lividToSysex.js)
- Note/CC range checks actually work now (they tested the wrong variable); an invalid entry is rejected and the field reset, instead of sending a broken message.
- Changing one encoder speed no longer changes the other (e.g. 8x became 7x, slow speeds became fast).
- Changing one bank channel no longer drops the other bank channels (only the first 4 of 15 were kept).
- Current-bank field is limited to the real number of banks.
- Pressing "no" in a confirm dialog no longer leaves an invisible box blocking clicks.
- Messages appear below the "save to device" / "defaults" buttons instead of covering them.

## Preset files (js/faceplate.js, js/downloadjson.js)
- Clicking "Choose File" no longer instantly re-applies the previously loaded preset; the same file can be loaded again.
- Stricter preset validation; a preset from another Livid model is refused with a clear message.
- Loading a preset sends it through the paced queue (it was sent before the delay that was meant to precede it).
- "create file" downloads the preset immediately, and no longer stores ACK/NACK junk keys (127/247) in the file.
- Old presets with those junk keys still load fine.

## New look (style.css, index.html)
- Dark theme with a teal accent: header bar with the save (primary) and reset (red outline) buttons, rounded side panels, segmented tabs, card-style inspectors.
- Pill-shaped on/off toggles; the LED R/G/B toggles light up in their own colour; colour-map menus are tinted with the colour they select.
- The controller faceplate is shown in a framed, slightly dimmed card; selected controls glow teal, hovered ones blue.
- Port picker, confirm dialog and notifications are modern cards; settings loading shows a spinner and progress bar.
- The original look is in `_original_backup/style.css` and `_original_backup/index.html` if you ever want it back.

## New features (round 3)
- **Setup wizard** (header button, never starts by itself): templates (Sequential/factory, DAW-friendly, current settings), knob/fader CC ranges, button notes/CCs and momentary/toggle per row, LED colour per row, bank channels, encoder = bank change. Checks for clashes, downloads a backup first, applies live, offers "Save to device".
- **LED colours on the faceplate**: buttons show their current colour after loading, after editing R/G/B, after loading a preset, and when you change bank.
- **Bank changes on the controller are followed**: when the Alias 8 starts sending on another bank's channel, the editor re-reads the bank number and its LED colours (a "Bank n · ch n" badge shows on the faceplate).
- **On-screen selection fixed**: faders, master fader and encoder can now be clicked (they had no clickable area). Clicking a control is no longer overridden by a jittery knob on the hardware.
- **Follow hardware** switch in the header: moving a control on the Alias 8 selects it. It ignores ±1-2 jitter and note-offs, and pauses briefly after you click on screen.
- **Encoder direction (experimental)** in the Global panel (Alias 8 only): flips the encoder's turning direction (command 55). Applied live; only stored with "save to device"; unplug/replug to undo.
- **Hover explanations** for every setting, tab and button.
- **Firefox support** via `Start editor (Firefox).command` (local server on localhost).
- **Dead links removed** (Livid wiki, helpdesk, firmware page, Jazz plugin). An outdated firmware is still flagged in the header.

## Clearer Global panel (round 4, js/globalpanel.js)
- Alias 8 Global panel reorganised into "Buttons & lights", "Encoder", "Banks" and a collapsed "Advanced" section. Every setting has a plain-language title and a short explanation shown under it; on/off settings are switches.
- Bank channels collapsed into one summary line ("Standard: bank 1-15 on channels 1-15") with a "Change" button and "Reset to 1-15". The active bank is now a 1-15 menu.
- MIDI merge no longer shows on the Alias 8 (it has no MIDI jacks; a selector typo kept it visible).
- "Use settings channel" off now really sends "not used" (it used to send channel 1).
- All hover texts rewritten in plain language.

## Ableton Live 12 script (round 5, folder `Ableton/`)
- New control surface script **Alias8_Live**: tracks 1-8 → rack macros 1-2 (page 1) / sends A-B (page 2), faders = volume, master = master volume, top buttons = mute (red; yellow row on page 2), bottom buttons = track colour + select, encoder CC mode = tempo. See `Ableton/README.md`.
- Setup wizard: new **Ableton script** option that prepares the controller for it in one go (numbering, momentary buttons, colour map, Ableton-controlled lights, encoder CC 42 relative).
- Alias8_Live: bottom buttons blink dark on every note that reaches a track as MIDI (incoming MIDI + clip notes).
- Alias8_Live: encoder CC mode scrolls the 8 columns through the tracks when the set has more than 8 (Ableton's coloured box shows which), tempo otherwise.
- Alias8_Live: columns 7-8 always show Return A and B (knobs = rack macros 1-2, fader = macro 3, on both pages; mute, colour, select); columns 1-6 scroll through the tracks.
- Setup wizard: choose which banks to write the setup to (active bank / banks 1-2 / all 15). The Ableton option writes banks 1 and 2, so the script's send page works.
- Alias8_Live page 3 (bank 3, blue top row): top knobs = Master track rack macros 1-8, second row = selected track's rack macros 1-8 (pickup); faders and buttons as on pages 1-2. The wizard's Ableton option now writes banks 1-3.
- Alias8_Live page 4 (bank 4, green top row): top knobs = pan, second row = Send C, top buttons = solo (blue), bottom buttons = record arm (red); faders as on the other pages. The selected track's bottom button blinks every second on all pages. The wizard's Ableton option now writes banks 1-4.
- Alias8_Live return columns 7-8: page 1 = macros 1-2 (filter/resonance) + return volume on the fader; page 2 = macros 3-4 on the knobs and macro 5 on the fader; pages 3-4 faders = return volume.
- Alias8_Live page 3: second row of knobs = Master rack macros 9-16 (was: selected track's macros 1-8).
- Alias8_Live page 2: faders 1-6 = Send C (was track volume).
- Alias8_Live: selected-track blink has separate on and off times (SELECT_BLINK_ON / SELECT_BLINK_OFF); the note blink (MIDI input / clip notes) was removed.
- Alias8_Live page 5 (bank 5, pink top row): all 16 knobs = macros 1-16 of the selected track's rack (pickup). Page 4: second row = Send D; columns 7-8 second knob = Return C volume / Return C macro 1; armed tracks blink fast. The wizard's Ableton option now writes banks 1-5.
- Alias8_Live page 2: top buttons = solo (blue while soloed, otherwise yellow), was mute.
- Alias8_Live page 5: top buttons = solo (blue while soloed, otherwise pink), was mute.
- Alias8_Live: pages reordered: 1 tracks, 2 sends, 3 track rack (pink), 4 master (blue), 5 mix & record (green). The page colours move with their content.
- Alias8_Live: top buttons on every page: tap = mute, hold (0.4 s) = solo (HOLD_SECONDS, TAP_MUTE_HOLD_SOLO in logic.py).
- Alias8_Live: only return tracks named with the # prefix are used (columns 7-8, Return C, Send A-D follow them); RETURN_PREFIX in logic.py.
- Alias8_Live: return columns are dynamic: one column per #-return (0-4) on the right, the rest are tracks; updates live when returns are renamed, added or removed. MAX_RETURN_COLUMNS in logic.py.
- Alias8_Live: a tap on a soloed track ends the solo without changing mute.
- Alias8_Live page 3: the selected track's sends to the #-returns take the last knobs (A first, max 8, MAX_SEND_KNOBS); the knobs before them stay rack macros.
- Alias8_Live: status bar shows the controlled parameter and value; pickup hints ("turn up to …") and a white flash when a control catches; all knobs/faders handled by the script.
- Alias8_Live: bottom buttons on every page: tap = select, hold = arm/disarm (groups: fold/unfold); armed tracks blink on every page.
- Alias8_Live: tracks named "-…" and tracks in folded groups are skipped; scroll position saved per Live set.
- Alias8_Live return columns: pages 1-2 = macros 1/2/3 (knob, knob, fader), page 5 = macros 4/5/6; return volume on the page 3-4 faders (RETURN_MACROS in logic.py).
- Alias8_Live: encoder CC mode = tempo on the master page, scroll on all other pages (ENCODER_MODE = "page"); page 5 faders = Send E; page 3 return faders = return macro 1.
- Alias8_Live page 6 (bank 6, cyan): the "!" and "#" returns on the right; 16 knobs = the selected return's macros 1-16, faders = return volume. The wizard writes banks 1-6.
- Alias8_Live returns: "!" = column on pages 1, 2, 3, 5 (macros 1/2/3), "#" = send only; Send A-E go to both in Live's order. Page 4 = 8 tracks, no returns. Page 3 second row = the selected track's sends, the fader below each = that return's macro 1.
- Alias8_Live: pages reordered: 5 = returns (pink), 6 = mix (green); page 3 track rack is teal.
- Alias8_Live page 5: faders = the selected return's send to the return in each column; the selected return's own column = its volume. A send that's turned off in Live shows a hint instead of moving.
- Alias8_Live page 5: the return columns are centred (5 returns = columns 2-6).
- Alias8_Live fix: returns are found again; Live's letter in front of return names ("A-#Shimmer") hid the ! and # marks.
- Alias8_Live page 3: the bottom buttons below the send knobs light in their return's colour.
- Alias8_Live page 3: the bottom buttons below the send knobs belong to their returns - tap selects the return and all 16 knobs show its macros.
- Alias8_Live page 5: the return columns start from the far left.
- Alias8_Live page 1 return columns: top knob = the selected track's send to that return, 2nd knob = macro 1, fader = macro 2 (RETURN_MACROS[0] = ("send", 1, 2)).
- Alias8_Live page 3: all 16 knobs = the selected track's macros; the faders in the return columns = the selected track's sends to those returns.
- Alias8_Live page 2 return columns: top knob = macro 1, 2nd knob = macro 2, fader = the selected track's send to that return (RETURN_MACROS[1] = (1, 2, "send")).
- Alias8_Live, new 5-page layout (banks 1-5): 1 Perform (filter / resonance / volume; "!" returns: macro 1 / macro 2 / volume; hold a return's bottom button = the track faders set the sends to it), 2 Track (16 macros, return-column faders = the selected track's sends), 3 Returns (yellow; 16 macros of the selected return, faders = return-to-return sends), 4 Master, 5 Mix (pan / width = rack macro 8 / volume). The wizard's Ableton option writes banks 1-5.
- Alias8_Live: page 1 send layer can be locked with a double-tap (tap again to go back); the tracks' top buttons blink yellow while it's on; page 1 return buttons no longer change Live's selected track. Page 2: a return column's top button mutes/solos the return.
- Alias8_Live: all settings moved to settings.py (contents list, one section per topic); logic.py is code only. Renamed PAGE2_PICKUP -> PICKUP, MAX_SEND_KNOBS -> MAX_TRACK_PAGE_RETURNS; removed the old 6-page modes (TAP_MUTE_HOLD_SOLO, SOLO_TOP_PAGES, BOTTOM_HOLD_ARM). The readme has a "Changing things" table.
- Alias8_Live: status bar messages are mirrored as JSON over UDP (port 9877); new Ableton/Status viewer (status_viewer.py + viewer.html + start file) shows them in big text in the browser. settings.py section 12.
- Status viewer: pickup meter (control position vs. parameter value, distance to go, "caught"); the script sends both positions with each knob/fader message. Repeated messages from one control share a history line.
- Status viewer: controller map (8 columns of the current page in the button colours, selected track bright, page colour line); the script sends the column state over UDP and follows the Alias 8's bank-change sysex, so the viewer knows the page.
- Status viewer: "Float on top" button (Chrome/Edge Document Picture-in-Picture): the viewer moves into a small always-on-top window.
- Status viewer: foldable Macros panel (16 knobs with values and names) and Sends panel (one tube per return in its colour, the selected track's send as a rising bar). The script adds macros and sends to the state it sends (also follows changes made with the mouse, ~5 times a second).
- Alias8_Live page 3: shows every return except those named "-..." (RETURN_SKIP_PREFIX), regardless of ! and #.
- Rack layout spec: page 5 width = macro 13 (MIX_WIDTH_MACRO); macros with nothing mapped are empty (EMPTY_MACROS_OFF); status viewer shows the macros in the four colour groups (Tone blue, Character orange, Dynamics green, Space purple). Readme has the rack layout table.
- Status viewer: Auto / Landscape / Portrait layout (button or key L); portrait for a standing 16:9 screen (e.g. 7" at 600 x 1024). The column map now sits under the macro knobs, like on the controller.
- Folded groups: tracks inside a folded group now really leave the columns (the script walks the groups itself instead of trusting is_visible, and re-checks after Live has folded).
- Status viewer: no message log; buttons at the bottom in the tracks' true colours with a volume bar each; overview boxes of all tracks (left) and returns (right) with the current page highlighted; bigger arm dot; knobs in four rows in portrait; only knobs/faders change the big text (other messages show briefly in the top bar); value on its own line; the knob being turned lights up; Tint option (key B).
- Folded groups: the script also checks the fold states itself every 0.2 s and rebuilds the columns if they changed (in case Live's notification is missed); selecting a track hidden in a folded group no longer errors.
- Status viewer: buttons dull with the selected one bright again, volume as a brighter fill in the same tone, 0 dB mark; fixed the bright line at the top of the buttons; larger return boxes with the selected track's send as a bar.
- Status viewer: group names turned on the left of each macro group, bigger knobs and names, smaller margins; no folding and no separate sends panel (the return boxes show the sends); pickup shown on the knob's arc (yellow = your knob / the way to go, white = the value).
- settings.py: new section 0 PAGE_ORDER reorders (or drops) pages; PAGE_COLORS is per page name, so each page keeps its colour; the script sends page names and colours to the viewer. Status viewer: a divider line where the return columns begin.
- Status viewer: the turned knob is shown with a subtle lighter background (no outline) and its arc keeps the group colour; the pickup arc uses the group colour instead of white; in portrait there is a gap after the first 8 knobs, where the Alias 8's top knob row ends.
- Status viewer: "Start status viewer.command" only starts the local server and no longer opens a browser; open http://localhost:8643 yourself.
- Alias8_Live: MIDI Effect Racks are left out (SKIP_MIDI_RACKS in settings.py section 4); the first instrument, drum or audio effect rack on the track is used instead.
- Status viewer: level meters, a thin strip on the right side of each button (green / yellow / red, with a peak line); the script sends the levels Live already shows, about 10 times a second and only while something plays (STATUS_METERS, settings.py section 12). Restart the status viewer for this.
- Status viewer: ⚙ Settings window (key S) with switches: knob number 0–100 or the macro value as in Live, knob highlight, pickup on the knob, pickup bar, level meters, peak line, overview, top-bar messages, tint, layout, theme (incl. "like the computer"). Saved in the browser.
- Status viewer: with "Macro value (as in Live)" the knob shows the number on top in large text and its type (kHz, dB, %, ms ...) underneath in smaller text.
- Perform page: double-tap a bottom button = go to the Track page (track) or the Returns page (return); the script switches the Alias 8 bank by sysex (PERFORM_DOUBLE_TAP_JUMP, ALIAS8_SET_BANK_SYSEX). The double-tap lock of the send layer is removed (hold only). Status viewer on Perform: two rows of knobs (each column's macro 1 and 2, returns with their own macro names) above the buttons, in the track colours.
- Status viewer: time graphics left of time values (LFO sine with a running dot, delay echoes, envelope ramp, blinking dot), moving at the real time; synced values use Live's tempo, which the script now sends. Synced values like 1/8 or 16th are now recognised as values. Settings switch "Time graphics".
- Status viewer, Returns page: the knob groups are Space 1–4 (purple), Colour 5–8 (blue), Sidechain 9–12 (green), Output 13–16 (orange), the return rack layout; settings.py and the readme describe it.
- Returns page send layer: hold a return (or double-tap to lock) = top buttons are the 8 tracks in their colours (tap = mute/dark, hold = solo), faders = their sends to that return, the return blinks in its colour; locked: tap again = off, tap another return = the lock moves (RETURNS_SEND_LAYER). Viewer shows the tracks with their sends and "Sends → …".
- Status viewer: fader legend above the buttons (what the faders do, per column group: volume grey, return volume / page sends in the page colour, sends in the return's colour, LOCKED tag); replaces the "Sends →" line. The script sends each fader's role. Perform send layer: the button bars show the sends.
- Gain reduction: new Max for Live devices A8 GR Pre / A8 GR Post (Ableton/Max for Live); the viewer shows the gain reduction in the Dynamics/Sidechain group (A), on the buttons (C) and optionally under the value (B, Settings). status_viewer.py accepts the devices' OSC messages (restart it).
- Status viewer: a bare number on a macro with "Rate" in its name (Live's synced rates 8 … 1.5, 1, then 3/4 … 1/64) counts as a synced rate in bars: time graphic at the tempo, "bars" under the number on the knob.
- Status viewer: the knob panel rack's "Rate" macros are always shown at the top right (LFO graphic + value), whatever knob you turn; Settings switch. Portrait knobs slightly smaller so all four groups fit with the fader legend.
- Status viewer: rate box graphics and text left-aligned in columns (the graphics stay put); a frequency counts as an LFO rate only on a macro named Rate/LFO/Speed … and not on EQ/pass/cut names (EQ Eight high-pass no longer shows an LFO).
- Status viewer: changing track (or page) shows that track's last turned macro with its current value (and lights its knob); if none was turned on it yet, the big text is empty.
- Status viewer, Master page: knob groups named Filter / Drive / Glue / Output (track colours); the master rack layout is in settings.py and the readme.
- Status viewer, Mix page: two rows of knobs above the buttons like Perform: pan (arc from the centre, value as Live shows it, e.g. C / 25L) and width (macro 13) for each track, instead of the 16-macro panel.
- Fix: scrolling with the encoder no longer switches the page to Perform (the encoder's MIDI channel isn't used to tell the page any more; the current page decides scroll vs. tempo).
- Status viewer: the track name above the big text is always shown, also on a track where no knob was turned yet and right after opening the viewer.
- Status viewer: the tracks on the controller are marked with a blue rectangle in the overview strip (like Live's box), one straight box also around tracks folded away in between; returns on the page get a blue box too. Fixed group tracks in the strip picking up the macro panel's style.
- Clean-up (no change in behaviour): removed leftovers (unused send helper, a duplicate Returns-page fader branch, the old sends panel styles, unused state fields "sends" and "led", an unused pattern); code comments and names now use page names instead of page numbers.
- Status viewer, Perform and Mix pages: a muted box in the track's colour behind each knob, so each column is easy to match with the controller.
- Status viewer: bigger track swatches in the overview strip (easier to see where you are scrolled).
- Fix: A8 GR Pre/Post passed no audio (a mistake in how the files were generated left out the audio objects); rebuilt.
- A8 GR Pre/Post: the level before the compressor now goes from Pre to Post through a shared Max dictionary instead of a named signal send (which never arrived, so the gain reduction stayed at 0). Pre shows its input level; Post shows a "Pre found" light.
- Status viewer: smoother graphics. The time graphics no longer read the page's colours on every frame (that forced the browser to recalculate the whole page many times a second and made everything else lag) and run at 30 frames a second; the gain reduction and level meters move with cheap transforms and only write what changed; the Perform/Mix knobs are updated in place instead of rebuilt on every update.
- A8 GR Pre/Post: Post now measures the level before and after the compressor at the same moment (Pre sends its level as a signal; the send~/receive~ pair is created by the devices' code), so with the compressor off it reads 0 dB instead of drifting around -2.5 dB.
- A8 GR Pre/Post: back to the shared dictionary (the signal link between the two devices did not carry audio in Live), now in sync: Pre stores its last half second of readings with their times (50 a second) and Post uses Pre's level at the exact moment of its own reading; the make-up reference ignores outliers (95th percentile).
- Status viewer, Returns page: the groups use the same colours by position as the track racks again (Space blue, Colour orange, Sidechain green, Output purple).
- Status viewer: colour square before the track name and the name in the track's Live colour (both names for a send), two Settings switches; return names shown without ! / # everywhere in the viewer.
- Status viewer: fast LFO rates (shorter than a quarter second, e.g. 1/16 at 120 BPM) are drawn as a clean wave line with 2–4 cycles and a bright stretch sweeping along it, instead of flickering dots.
- Status viewer: slow LFO rates use the same thin wave line as the fast ones (one cycle, with the bright stretch and dot running along it).
- Status viewer: the Tint button moved into ⚙ Settings (key B still works); the Float button is just its ⧉ symbol.
- Status viewer: with Tint on, the knob panels keep their own dark base (no longer washed out); the layout and settings buttons are symbols (▭/▯ with a small A for automatic, ⚙), and "connected" shows as the green dot only, so the top bar fits on one line in portrait.
- Status viewer: in portrait, Perform and Mix split into two halves of four columns (knobs 1–4, knobs 9–12, legend, buttons 1–4, then 5–8) instead of eight narrow columns; knob names that are too long shrink to fit instead of being cut off; pan values read as one piece (1L, C, 2R) in "macro value" mode.
- Status viewer: in portrait, Perform and Mix show channel strips (two knobs + tall volume bar + name, column number top left; grey = muted, blue S = solo, white outline = selected), two rows of four with a fader legend each; replaces the split rows.
- Status viewer: bigger layout, settings and float symbols in the top bar.
- Status viewer: the fader legend text may use two lines before it is cut off; narrower return boxes in the overview strip.
- Status viewer: Settings "Knob groups in portrait": 1–4, 5–8, 9–12, 13–16 (as before) or 1–4, 9–12, 5–8, 13–16 (the left half of the controller first); the gap follows.
- New rack layout: Tone 1–4, Dynamics 5–8, Character 9–12, Space 13–16 (Master: Filter, Glue, Drive, Output). The viewer's groups follow, coloured by role (Tone/Filter blue, Dynamics/Glue green, Character/Drive orange, Space/Output purple); the gain reduction meter and the GR bar follow the compressor group wherever it is. settings.py and the readme describe the new layout.
- Double-tap a track button on the Master and Mix pages too: the controller and the viewer go to the Track page with that track (DOUBLE_TAP_JUMP_PAGES in settings.py replaces PERFORM_DOUBLE_TAP_JUMP).
- Fix: in portrait the 16-knob panel no longer shows behind the channel strips on Perform and Mix.
- PAGE_ORDER can repeat a page (up to 15 banks): every bank with the same name works like that page (knobs, faders, buttons, encoder, viewer), e.g. Master on banks 4–14. Your order is now Track, Returns, Mix, Master ×11, Perform (bank 15). The editor wizard's Ableton setup now writes all 15 banks by default.
- settings.py: UNLIT_VIEWER_COLOR (section 6) sets how a page with OFF looks in the status viewer; now a darker grey (#4a4f57).
- Hide the return columns: ◀ / ▶ RET at the end of the fader legend on the Perform and Track pages hides or shows the return columns, on the controller too (all 8 columns tracks). New: the viewer can send commands to the script (status_viewer.py POST /control → UDP 9878; STATUS_CONTROL_PORT, HIDE_RETURN_COLUMNS in settings.py). Restart the status viewer.
- Hide the return columns: separate for the Perform and the Track page (each its own ◀ / ▶ RET); HIDE_RETURN_COLUMNS is now a list of pages, e.g. ("perform",).
- Fix: on the Track page the return (send) columns no longer cover tracks: the track columns are the ones left of all its return columns, and scrolling goes far enough for the last track to show there (on Perform, with fewer return columns, the last column can then be empty).

## 2026-11-23 – License
- Added an MIT license (`LICENSE`) for the changes in this repo; third-party libraries keep their own licenses.

## 2026-11-23 – Generic read-me
- README rewritten for any Livid controller: which models are supported and tested, how to start it on any system, what the wizard templates do.
- Wizard: the Ableton template is now called "For the Alias8_Live script" and says it is only for that script.
- README: screenshots of the editor with the Alias 8, OhmRGB, CNTRL:R, Base II, DS1 and Code (`screenshots/`).
