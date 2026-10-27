# DTPR surfaces — slide exports

Slides that show the ways one DTPR record can be expressed, exported as 3840×2160 PNGs (16:9, 4K) for
reuse in other decks. Rendered from the live Slidev decks with headless Chrome; the record and the
mocks are the same as in the source decks.

The idea behind all of them: the **datachain is the canonical record**, and everything a person sees is
a **disclosure** drawn from it, in whatever form fits where they are.

| File | What it shows | Source |
|---|---|---|
| `01-levels-of-disclosure.png` | Overview: Canvas → Card → Footer, plus non-digital and machine-readable tracks | `webinar-oct-2026` slide 20 |
| `02-canvas-full-record.png` | **Level 1 · Canvas** — the whole datachain for a fictional face-matching fare gate (MT-FG-104) | `webinar-oct-2026` slide 21 (`DtprCanvas`) |
| `03-card.png` | **Level 2 · Card** — the same record folded to headline facts | `webinar-oct-2026` slide 22 (`CanvasCard`) |
| `04-footer-line.png` | **Level 3 · Footer** — one line under a chatbot's input box | `webinar-oct-2026` slide 23 (`ChatFooter`) |
| `05-footer-expanded-to-card.png` | The footer tapped open into a card (layered notice) | `webinar-oct-2026` slide 23, click 1 |
| `06-decision-letter-paper.png` | The card printed in a school-placement decision letter, with QR to the record | `webinar-oct-2026` slide 24, click 1 (`DecisionLetter`) |
| `07-hiring-notice-email.png` | The same grammar in an email: an automated hiring-tool notice (NYC LL 144) | `webinar-oct-2026` slide 25 (`HiringNotice`) |
| `08-document-mark.png` | A "Made with AI assistance" mark on a document, with a record reference | `webinar-oct-2026` slide 26 (`DocumentMark`) |
| `09-beyond-screens-voice-and-machine.png` | A spoken disclosure on a 311 call, and an HTTP header + `.well-known/dtpr.json` | `webinar-oct-2026` slide 27 |
| `10-register-header.png` | Register-entry header for a real system (CBSA Traveller Compliance Indicator) | `metagov-oct-2026` slide 3 (`AlgorithmHeader`) |
| `11-canvas-rights-focus.png` | Canvas with the risks / rights / actions rows highlighted | `metagov-oct-2026` slide 5 |
| `12-one-record-many-surfaces.png` | Alternate overview copy: Canvas / Card / Line | `metagov-oct-2026` slide 6 |
| `13-canvas-use-case-with-blanks.png` | Canvas used internally to describe a staff AI use case; the gaps are marked in red | `metagov-oct-2026` slide 11 |
| `14-register-line.png` | Internal registry list beside the public register (live iframe of canada.clarable.ai) | `metagov-oct-2026` slide 12 (`RegistryLine`) |

Notes:

- 02–09 are speculative mocks except the canvas, which is a port of `prototypes/canvas`. All copy is
  hardcoded; the organisations (Metro Transit, City Benefits Office, Fulton Analytics) are fictional.
- 06 crops the letter's signature off the bottom on purpose: it's a letter, not a slide.
- 01 and 12 cover the same overview. 01 says "Footer"; 12 says "Line".
- 14 includes a live iframe, so it shows whatever the register served at export time.

## Re-exporting

Start the source deck (`pnpm dev:talk:metagov`, or `slidev --port 3141` in `talks/webinar-oct-2026`)
and then:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --window-size=1920,1082 --force-device-scale-factor=2 --hide-scrollbars \
  --virtual-time-budget=15000 --screenshot="$PWD/out.png" "http://localhost:3141/23?clicks=1"
```

Then crop 2px off the top and bottom to get exactly 3840×2160 and drop the letterbox hairline.
