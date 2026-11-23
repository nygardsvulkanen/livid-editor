# Livid Online Editor (updated)

Editor for Livid controllers (made and tested for the **Alias 8**).

## Starting it

**Chrome or Edge:** double-click **`Livid Editor.html`** (or drag it onto the browser). Allow MIDI / "system exclusive" access when asked.

**Firefox:** Firefox only allows MIDI for pages served from your own computer, not for files opened directly.
Double-click **`Start editor (Firefox).command`**. It starts a small local web server and opens the editor in Firefox at
`http://localhost:8642`. Allow MIDI access when Firefox asks. Keep the Terminal window open while you use the editor.
(If macOS says the file can't be opened: right-click it → Open. If it asks to install "Command Line Developer Tools", accept and try again.)

**Safari** has no MIDI support.

See `CHANGES.md` for what was fixed and added.

## What's in the folder

- **Livid Editor.html** – the editor
- **Start editor (Firefox).command** – starts it in Firefox
- **app/** – the editor's code, styles and pictures (leave it next to the page)
- **Ableton/** – the Alias8_Live control surface script for Ableton Live 12 and its instructions
- **Presets/** – preset files you can load in the editor
- **Docs/** – this file and the change list
- **Old files/** – parts of the original download that the editor doesn't use any more (safe to delete)
