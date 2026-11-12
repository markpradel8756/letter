/* =========================================================================
   A Letter From My Heart: interactions (vanilla JavaScript)
   -------------------------------------------------------------------------
    1. Setup & helpers
    2. Envelope opening & re-sealing
    3. Floating petals and hearts
    4. Dream sky (stars + glowing motes)
    5. Reveal-on-scroll
    6. Reading progress, back-to-top, chapter dots
    7. Memory cards (flip)
    8. Photo placeholders (auto-load real photos if present)
    9. Background music (opt-in only)
   10. Start
   ========================================================================= */

(function () {
  "use strict";

  /* ---------- 1. Setup & helpers ---------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const body = document.body;
  const opening = $("#opening");
  const envelope = $("#envelope");
  const openBtn = $("#openLetterBtn");
  const story = $("#story");
  const storyTitle = $("#storyTitle");
  const statusEl = $("#status");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = () => reducedMotionQuery.matches;

  /** Announce a short message to screen readers. */
  function announce(message) {
    statusEl.textContent = "";
    // A tiny delay makes repeated messages announce reliably
    setTimeout(() => { statusEl.textContent = message; }, 50);
  }

  /** Random number between min and max. */
  const rand = (min, max) => Math.random() * (max - min) + min;


  /* ---------- 2. Envelope opening & re-sealing ---------- */
  let isOpen = false;
  let storyInitialised = false;

  /* The opening plays as a sequence of stages. Each stage adds a class to the
     envelope, and style.css animates it (times in milliseconds):
       is-cracking  → the seal wobbles, cracks in two and falls away
       is-flap-open → the flap swings open and warm light spills out
       is-rising    → the letter rises out of the envelope
       is-unfolding → the envelope slips away; the letter comes forward  */
  const STAGES = [
    { at: 0,    cls: "is-cracking" },
    { at: 650,  cls: "is-flap-open" },
    { at: 1400, cls: "is-rising" },
    { at: 2550, cls: "is-unfolding" }
  ];
  const BURST_AT = 330;   // hearts burst out as the seal splits
  const LEAVE_AT = 3350;  // the whole screen fades into the story
  const SHOW_AT = 4100;
  const STAGE_CLASSES = STAGES.map((s) => s.cls);
  let stageTimers = [];

  function openLetter() {
    if (isOpen) return;
    isOpen = true;
    openBtn.disabled = true;
    opening.classList.add("is-opening");

    if (reduceMotion()) {
      showStory();
      return;
    }

    const later = (fn, ms) => stageTimers.push(setTimeout(fn, ms));
    STAGES.forEach((stage) => later(() => envelope.classList.add(stage.cls), stage.at));
    later(burstFromSeal, BURST_AT);
    later(() => opening.classList.add("is-leaving"), LEAVE_AT);
    later(showStory, SHOW_AT);
  }

  /** Little hearts, petals and gold flecks bursting out of the broken seal. */
  function burstFromSeal() {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const bit = document.createElement("span");
      const kind = i % 3 === 0 ? "" : i % 3 === 1 ? " burst--petal" : " burst--gold burst--petal";
      bit.className = "burst" + kind;

      const angle = (i / count) * Math.PI * 2 + rand(-0.25, 0.25);
      const distance = rand(70, 150);
      bit.style.setProperty("--dx", (Math.cos(angle) * distance).toFixed(0) + "px");
      bit.style.setProperty("--dy", (Math.sin(angle) * distance - 40).toFixed(0) + "px"); // drift upward
      bit.style.setProperty("--scale", rand(0.6, 1.25).toFixed(2));
      bit.style.setProperty("--rot", rand(-200, 200).toFixed(0) + "deg");

      bit.addEventListener("animationend", () => bit.remove());
      envelope.appendChild(bit);
    }
  }

  function showStory() {
    opening.hidden = true;
    story.hidden = false;
    body.classList.remove("is-sealed");
    window.scrollTo(0, 0);

    // Let the browser paint the hidden->visible change before fading in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => story.classList.add("is-visible"));
    });

    storyTitle.focus({ preventScroll: true });
    announce("The letter is open.");

    if (!storyInitialised) {
      storyInitialised = true;
      initReveal();
      initDots();
    }
    updateProgress();
  }

  /** Put the letter back in its envelope and show the opening screen again. */
  function resealLetter() {
    stageTimers.forEach(clearTimeout);
    stageTimers = [];

    story.classList.remove("is-visible");
    story.hidden = true;
    body.classList.add("is-sealed");
    window.scrollTo(0, 0);

    // Reset the envelope while it's still hidden, so it reappears sealed
    // instantly instead of animating backwards
    opening.classList.remove("is-leaving", "is-opening");
    envelope.classList.remove(...STAGE_CLASSES);
    $$(".burst", envelope).forEach((bit) => bit.remove());
    opening.hidden = false;
    openBtn.disabled = false;
    isOpen = false;

    openBtn.focus();
    announce("The letter has been sealed again.");
  }

  openBtn.addEventListener("click", openLetter);
  envelope.addEventListener("click", openLetter);
  $("#resealBtn").addEventListener("click", resealLetter);


  /* ---------- 3. Floating petals and hearts ---------- */
  function createPetals() {
    const layer = $("#petals");
    if (!layer || reduceMotion()) return;

    const count = window.innerWidth < 600 ? 9 : 16;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const petal = document.createElement("span");
      const isHeart = i % 5 === 0; // every fifth one is a tiny heart
      petal.className = isHeart ? "petal petal--heart" : "petal";
      petal.style.setProperty("--x", rand(0, 96) + "vw");
      petal.style.setProperty("--size", rand(10, 18).toFixed(1) + "px");
      petal.style.setProperty("--duration", rand(14, 26).toFixed(1) + "s");
      petal.style.setProperty("--delay", (-rand(0, 26)).toFixed(1) + "s");
      petal.style.setProperty("--drift", rand(-60, 60).toFixed(0) + "px");
      fragment.appendChild(petal);
    }
    layer.appendChild(fragment);
  }


  /* ---------- 4. Dream sky (stars + glowing motes) ---------- */
  function createDreamSky() {
    const sky = $("#dreamSky");
    if (!sky || reduceMotion()) return;

    const fragment = document.createDocumentFragment();
    const starCount = window.innerWidth < 600 ? 40 : 70;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = rand(0, 100) + "%";
      star.style.top = rand(0, 100) + "%";
      star.style.setProperty("--s", rand(1, 3).toFixed(1) + "px");
      star.style.setProperty("--t", rand(2.5, 6).toFixed(1) + "s");
      star.style.setProperty("--d", (-rand(0, 6)).toFixed(1) + "s");
      fragment.appendChild(star);
    }

    for (let i = 0; i < 12; i++) {
      const mote = document.createElement("span");
      mote.className = "mote";
      mote.style.left = rand(0, 100) + "%";
      mote.style.setProperty("--s", rand(6, 14).toFixed(0) + "px");
      mote.style.setProperty("--t", rand(16, 30).toFixed(1) + "s");
      mote.style.setProperty("--d", (-rand(0, 30)).toFixed(1) + "s");
      mote.style.setProperty("--drift", rand(-40, 40).toFixed(0) + "px");
      fragment.appendChild(mote);
    }
    sky.appendChild(fragment);
  }


  /* ---------- 5. Reveal-on-scroll ---------- */
  function initReveal() {
    const items = $$(".reveal");

    if (reduceMotion() || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    // Stagger siblings slightly (memory cards, dream paragraphs)
    $$(".memory-grid li.reveal").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + "ms"; });
    $$(".dream__text .reveal").forEach((el, i) => { el.style.transitionDelay = i * 120 + "ms"; });

    items.forEach((el) => observer.observe(el));
  }


  /* ---------- 6. Reading progress, back-to-top, chapter dots ---------- */
  const progressBar = $("#progressBar");
  const backToTopBtn = $("#backToTopBtn");
  let ticking = false;

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressBar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    backToTopBtn.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.8);
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking && isOpen) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener("resize", () => { if (isOpen) updateProgress(); });

  function scrollToBeginning() {
    window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
    storyTitle.focus({ preventScroll: true });
  }
  backToTopBtn.addEventListener("click", scrollToBeginning);
  $("#readAgainBtn").addEventListener("click", scrollToBeginning);

  /** Highlight the chapter dot for the section currently in view. */
  function initDots() {
    if (!("IntersectionObserver" in window)) return;
    const links = $$("#dots a");
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        const active = byId.get(entry.target.id);
        if (active) { active.classList.add("is-active"); active.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }


  /* ---------- 7. Memory cards (flip) ---------- */
  $$(".memory-card").forEach((card) => {
    card.addEventListener("click", () => {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
    });
  });


  /* ---------- 8. Photo placeholders ----------
     Each .photo has a data-photo path (e.g. images/group-photo.jpg).
     If that file exists, it's shown; otherwise the placeholder stays. */
  function loadPhotos() {
    $$(".photo[data-photo]").forEach((frame) => {
      const img = new Image();
      img.alt = frame.dataset.alt || "";
      img.decoding = "async";
      // (no loading="lazy" here: a lazy image that isn't in the page yet never loads)
      img.onload = () => {
        frame.appendChild(img);
        frame.classList.add("has-photo");
      };
      img.src = frame.dataset.photo;
    });
  }


  /* ---------- 9. Background music (plays automatically, can be paused) ----------
     The page tries to start the music as soon as it loads. Browsers usually
     block sound until the visitor has tapped or clicked once, so if that
     happens the music starts on her first tap (normally opening the letter).
     The music button pauses / resumes it at any time, and once she pauses,
     it never restarts by itself.
     If "assets/music.mp3" exists it is used; otherwise a soft music-box
     melody is generated with the Web Audio API. */
  const Music = (function () {
    const FILE = "assets/music.mp3";
    let audio = null;
    let useSynth = false;
    let playing = false;

    // --- Web Audio music box ---
    let ctx = null;
    let master = null;
    let schedulerId = null;
    let nextNoteTime = 0;
    let step = 0;

    const NOTE_LENGTH = 0.42; // seconds per note (gentle tempo)
    // Four arpeggiated chords (F, Dm, Bb, C) as MIDI note numbers
    const BARS = [
      [65, 72, 77, 81, 84, 81, 77, 72],
      [62, 69, 74, 77, 81, 77, 74, 69],
      [58, 65, 70, 74, 77, 74, 70, 65],
      [60, 67, 72, 76, 79, 76, 72, 67]
    ];
    const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function setupSynth() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();

      master = ctx.createGain();
      master.gain.value = 0;

      // Warm the sound and add a soft echo
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2600;

      const delay = ctx.createDelay();
      delay.delayTime.value = NOTE_LENGTH * 1.5;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;
      const wet = ctx.createGain();
      wet.gain.value = 0.3;

      master.connect(tone);
      tone.connect(ctx.destination);
      tone.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);
      return true;
    }

    function playNote(midi, time, volume) {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      overtone.type = "triangle";
      osc.frequency.value = midiToHz(midi);
      overtone.frequency.value = midiToHz(midi) * 2;

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.value = 0.12;

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(volume, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

      osc.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(master);

      osc.start(time);
      overtone.start(time);
      osc.stop(time + 1.9);
      overtone.stop(time + 1.9);
    }

    function scheduler() {
      while (nextNoteTime < ctx.currentTime + 0.3) {
        const bar = BARS[Math.floor(step / 8) % BARS.length];
        const index = step % 8;
        const volume = index === 0 ? 0.16 : 0.09; // a slightly stronger first beat
        playNote(bar[index], nextNoteTime, volume);
        nextNoteTime += NOTE_LENGTH;
        step++;
      }
    }

    /** True once the browser has seen a tap/click/key press on this page. */
    function hasUserGesture() {
      return !(navigator.userActivation && !navigator.userActivation.hasBeenActive);
    }

    /** Create and wake the audio engine. Call this directly inside a tap
        handler: some browsers (Safari) only allow it there. */
    function unlock() {
      if (!hasUserGesture()) return;
      if (!ctx && !setupSynth()) return;
      if (ctx.state !== "running") ctx.resume().catch(() => {});
    }

    async function startSynth() {
      if (!ctx) {
        if (!hasUserGesture()) return false; // not allowed yet: wait for a tap
        if (!setupSynth()) return false;
      }
      if (ctx.state !== "running") {
        // resume() can hang while sound is blocked, so don't wait forever
        await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 500))]);
      }
      if (ctx.state !== "running") return false;

      nextNoteTime = ctx.currentTime + 0.08;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
      clearInterval(schedulerId);
      schedulerId = setInterval(scheduler, 100);
      scheduler();
      return true;
    }

    function stopSynth() {
      if (!ctx) return;
      clearInterval(schedulerId);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => { if (!playing) ctx.suspend(); }, 700);
    }

    /** Start the music. Resolves true if it is now playing, false if the
        browser is still blocking sound (try again after a tap). */
    async function play() {
      if (!useSynth) {
        try {
          if (!audio) {
            audio = new Audio(FILE);
            audio.loop = true;
            audio.volume = 0.5;
          }
          await audio.play();
          playing = true;
          return true;
        } catch (err) {
          if (err && err.name === "NotAllowedError") return false; // blocked until a tap
          // No music file (or it can't be played): use the music box instead
          useSynth = true;
          audio = null;
        }
      }
      playing = await startSynth();
      return playing;
    }

    function pause() {
      playing = false;
      if (audio) audio.pause();
      if (useSynth) stopSynth();
    }

    return { play, pause, unlock, isPlaying: () => playing };
  })();

  const musicBtn = $("#musicBtn");
  const musicLabel = $("#musicLabel");
  let pausedByVisitor = false; // once she pauses, never restart on our own
  let startingMusic = null;    // the play attempt in progress, if any

  function setMusicUI(on) {
    musicBtn.setAttribute("aria-pressed", String(on));
    musicLabel.textContent = on ? "Pause music" : "Play music";
  }

  /** Try to start the music (no-op if it's already playing or starting). */
  function startMusic() {
    if (Music.isPlaying()) return Promise.resolve(true);
    if (!startingMusic) {
      Music.unlock();
      startingMusic = Music.play().then((ok) => {
        startingMusic = null;
        if (pausedByVisitor) { // she pressed pause while it was starting
          if (ok) Music.pause();
          return false;
        }
        setMusicUI(ok);
        if (ok) stopListeningForFirstTap();
        return ok;
      });
    }
    return startingMusic;
  }

  // Autoplay fallback: start on the first tap, click or key press anywhere
  const FIRST_TAP_EVENTS = ["click", "keydown", "touchend"];

  function onFirstTap(event) {
    if (musicBtn.contains(event.target)) return; // the music button handles itself
    if (!pausedByVisitor) startMusic();
  }
  function stopListeningForFirstTap() {
    FIRST_TAP_EVENTS.forEach((type) => document.removeEventListener(type, onFirstTap, true));
  }
  FIRST_TAP_EVENTS.forEach((type) => document.addEventListener(type, onFirstTap, true));

  musicBtn.addEventListener("click", async () => {
    if (Music.isPlaying()) {
      pausedByVisitor = true;
      Music.pause();
      setMusicUI(false);
      stopListeningForFirstTap();
      announce("Music paused.");
    } else {
      pausedByVisitor = false;
      const ok = await startMusic();
      announce(ok ? "Music playing." : "Sorry, music isn't available on this device.");
    }
  });


  /* ---------- 10. Start ---------- */
  createPetals();
  createDreamSky();
  loadPhotos();
  startMusic(); // try to autoplay right away (works if the browser allows it)
})();
