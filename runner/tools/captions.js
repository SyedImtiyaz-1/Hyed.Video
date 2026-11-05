/*
 * Hyped captions: word cues from the narration, for timing scenes to the voice.
 *
 * The captions themselves are drawn after the video is rendered (from captions.json, in the style the customer picks,
 * and they can change it later), so pages don't draw any. HypedCaptions.create(data, options).render(t) is kept for
 * pages made before that, and draws nothing.
 *
 *   <script src=".hyped/captions.js"></script>      (adjust the path to where your page lives)
 *
 * `data` is the captions.json written by `voice track` (inline it or fetch it before capturing). Keep other text out of
 * the bottom ~18% of the frame (24% for portrait, 28% for vertical), where the captions go.
 *
 * Word cues, for timing scenes to the voice (same captions.json):
 *   const cue = HypedCaptions.cues(data);
 *   cue.line("03")               // { start, end } of line 03 on the final timeline
 *   cue.word("03", "SQL")        // { start, end } of the first "SQL" in line 03 (caption or spoken spelling)
 *   cue.word("03", "Python", 2)  // the second "Python" in that line
 * Start a visual change 0-0.2 s before its word (cue.word("03", "SQL").start - 0.1), never after it. A line or word
 * that isn't there throws, so a typo can't quietly put the video out of sync.
 */
(function () {
  // Captions are drawn after rendering now: pages made before that still call this, and get nothing drawn.
  function create() {
    return { render() {}, element: null };
  }

  function cues(data) {
    const lines = (data && data.lines) || [];
    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
    const find = (id) => {
      const line = lines.find((l) => l.id === id);
      if (!line) throw new Error(`HypedCaptions.cues: no line "${id}" in captions.json`);
      return line;
    };
    return {
      line(id) {
        const l = find(id);
        return { start: l.start, end: l.end };
      },
      word(id, text, nth) {
        const l = find(id);
        const want = norm(text);
        const n = (nth || 1) - 1;
        // Exact matches first, then words that start with it ("dashboard" finds "dashboards,").
        for (const test of [(w) => norm(w.text) === want, (w) => norm(w.text).startsWith(want)])
          for (const list of [l.words || [], l.spoken || []]) {
            const hit = list.filter(test)[n];
            if (hit) return { start: hit.start, end: hit.end };
          }
        throw new Error(`HypedCaptions.cues: line "${id}" has no word "${text}"${n ? ` (number ${n + 1})` : ""}`);
      },
    };
  }

  window.HypedCaptions = { create, cues };
})();
