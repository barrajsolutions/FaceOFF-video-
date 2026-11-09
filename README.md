# FaceOFF Video

Make **faceless videos** (Shorts, Reels, TikTok, YouTube) in your browser. Nobody has to be on camera.

1. **Script.** Write or paste it. Each paragraph becomes one scene.
2. **Visuals.** Add stock clips, B-roll, screen recordings or images. They play one per scene, in order. Images get a slow zoom and pan. With no visuals, an animated gradient background is used.
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
