# A Letter From My Heart

A small personal website that opens like a sealed love letter and unfolds into a handwritten story, scrapbook memories, and a quiet message of appreciation.

It is built with plain HTML, CSS, and JavaScript only, so there is no framework or build step.

## Project structure

```text
index.html   – the full letter content and page structure
style.css    – the vintage paper, envelope, and animation styling
script.js    – envelope opening, reveal animations, card interactions, and music
images/      – optional photo assets used in the scrapbook section
```

## Run it locally

### Option 1: open directly

Double-click `index.html` in your file explorer. It will open in the browser and work without any setup.

### Option 2: use a tiny local server

From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also use:

```bash
npx serve .
```

Then open the URL shown in the terminal.

> The page loads Google Fonts for the elegant lettering and serif styling. If you are offline, it falls back to similar system fonts automatically.

## Add your own photos

The scrapbook section uses two image slots. Put your files in an `images` folder beside `index.html`:

```text
images/mawab-trip.jpg
images/kh.jpg
```

These are the expected filenames used by the page:

- `images/mawab-trip.jpg` → "Our trip to Mawab"
- `images/kh.jpg` → "The group photo at the Kingdom Hall"

Until a file exists, the page shows a polished placeholder instead. Keep your images reasonably sized, ideally around 1200 pixels wide and under about 500 KB each for a fast, smooth page.

If you want to use different file names, update the `data-photo` values in `index.html`.

## Customize the letter

### Change the greeting

Search for `Dear you,` in `index.html` and replace it with a name or a more personal phrase.

### Change the story text

Everything is written directly in `index.html` in the letter and sections below. You can edit any paragraph, heading, or caption there.

### Replace the music

The site includes a soft generated music-box melody by default, but you can add your own track:

```text
assets/music.mp3
```

If no custom file is present, the built-in melody will still play.

> Browsers require a user interaction before audio starts, so the music begins after the visitor taps the envelope or the music button.

## Notes

- The scripture quotes used in the letter are from the New World Translation.
- The design includes reduced-motion support for users who prefer less animation.
- The page is keyboard accessible and supports the same interactions with a mouse, touch, or keyboard.

## License

This project is for personal use and customization. If you are using it for a personal gift or keepsake, feel free to adapt it however you like.
