CORE ONE - scroll site (GSAP + Lenis + canvas frame sequence)

Run:
  1. Unzip. Keep the "frames" folder next to index.html.
  2. Open the folder in VS Code and use "Live Server", or run:  npx serve .
  3. Open the link in Chrome. Internet is needed (GSAP/Lenis/fonts load from CDN).

Swap in a new video later:
  ffmpeg -i newvideo.mp4 -vf "fps=24,scale=1280:-1" -c:v libwebp -quality 72 frames/frame_%04d.webp
  Then in script.js change FRAME_COUNT to the new number of frames.
  Re-time the text with data-start / data-end (0 to 1) on each <section class="chapter"> in index.html.

Edit text: index.html.  Colors/fonts: top of style.css.
