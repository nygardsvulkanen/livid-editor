# Livid Editor – notes for Claude

Updated Livid online editor (browser, Web MIDI + sysex), made and tested for the **Livid Alias 8**.
Owner: Daniel (writes in Swedish; answer in Swedish, keep code/comments/docs in English).

## Layout
- `Livid Editor.html` – entry page. `app/js/` – editor code: `wizard.js` (setup wizard, e.g. "All 15 banks" for the Alias8_Live script), `midiio.js` (Web MIDI), `lividToSysex.js` / `sysexToLivid.js` (encode/decode), `uitocontroller.js`, `faceplate.js`, `controller_graphics.js`, `globalpanel.js`, `user.js`, `help.js`, `downloadjson.js`. Third-party: jQuery 1.11, jQuery UI 1.10, Raphael, tag-it.
- `Presets/*.json` – saved controller setups.
- `Docs/` – `README.md`, `CHANGES.md` (+ generated `Read me.html`, `Changes.html`).
- `Start editor (Firefox).command` – local server on http://localhost:8642 (Firefox only allows MIDI from localhost). Chrome/Edge can open the html file directly. Safari has no MIDI.

## Working rules
- Every change: add a line to `Docs/CHANGES.md`, regenerate the html docs (python `markdown`, extensions `tables` + `fenced_code`; keep the existing `<head>`), commit.
- Test with `python3 -m http.server 8642` and a browser; MIDI can't be tested without the controller – keep sysex changes small and check them against existing presets.
- Related repo: alias8-live (the Ableton script that uses the banks this editor writes).
