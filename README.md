# FaceOFF Video

Make **faceless videos** (Shorts, Reels, TikTok, YouTube) in your browser, for free. Nobody has to be on camera.

There are two styles:

- **Whiteboard animation.** A hand with a marker draws each scene on a whiteboard, paper or chalkboard: doodles, sketches of your own images, and handwritten key words, which then get colored in. The board slides along between scenes.
- **Clips & images.** Your footage or photos with animated captions.

### Whiteboard script tips

```
Most people never realize *this about sleep*.

While you sleep, fluid washes through your brain and *clears out waste*. {drop}
```

- Each paragraph is one scene.
- `*stars*` mark spoken words the hand also writes on the board.
- `[square brackets]` are written on the board only: not spoken, not in the captions. Good for labels like `[2026 limit: $7,000]`.
- `{name}` picks a doodle. Without one, a doodle is chosen from your words (e.g. "money" draws a coin, "sleep" a moon).
  There are about 30: idea, brain, heart, star, moon, sun, clock, calendar, money, check, cross, growth, decline, phone, drop, cloud, person, house, book, target, talk, question, warning, coffee, trophy, gear, search, battery, rocket, apple, lock, arrow.
- `{img2}` draws your 2nd uploaded image, and `{none}` leaves out the drawing. Otherwise image 1 goes in scene 1, image 2 in scene 2, and so on.
- Images that work best are simple illustrations or PNGs with a plain or transparent background.

## Steps

1. **Script.** Write or paste it. Each paragraph becomes one scene.
2. **Visuals.** Pick a style. For clips & images, add stock clips, B-roll, screen recordings or images. They play one per scene, in order. Images get a slow zoom and pan. With no visuals, an animated gradient background is used.
3. **Voice & music.** Upload a voiceover or record one with your mic, and add background music. The video is as long as the voiceover. Silence at the start and end is detected so captions line up, and a slider fine-tunes the timing.
4. **Format & captions.** Pick 9:16, 16:9 or 1:1. Animated word-by-word captions come in three styles: bold pop, boxed or clean.
5. **Make video.** Records the finished video (1080p, with audio) and downloads it. You can also download the captions as an `.srt` file.

Everything runs locally in the browser. Files are never uploaded anywhere.

## Run it

It's a static page with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

You can also host it on GitHub Pages (Settings → Pages → deploy from branch, root folder).

## Notes

- Making the video plays it once in real time. Keep the tab open and in front until it finishes, because browsers slow down background tabs.
- Chrome and Edge save **MP4**. Firefox and some other browsers save **WebM**.
- Microphone recording needs `https://` or `localhost`.
- With no voiceover, captions are timed at a natural reading pace (about 2.6 words per second).
