<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resonance Logo</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #030306;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    gap: 36px;
    padding: 40px 56px;
    background: #030306;
    border-radius: 20px;
  }

  /* ── ICON ── */
  .icon-wrap {
    position: relative;
    width: 110px;
    height: 110px;
    flex-shrink: 0;
  }

  .icon-wrap svg {
    width: 110px;
    height: 110px;
    overflow: visible;
  }

  /* Outer glow pulse */
  .glow-ring {
    fill: none;
    stroke: rgba(196,154,40,0.18);
    stroke-width: 10;
    animation: glowPulse 3s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%,100% { stroke-width: 8; opacity: 0; }
    50%      { stroke-width: 18; opacity: 1; }
  }

  /* The arc itself — drawn on load */
  .arc-track {
    fill: none;
    stroke: rgba(255,255,255,0.07);
    stroke-width: 5;
    stroke-linecap: round;
  }

  .arc-main {
    fill: none;
    stroke: #EBEBED;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 285;
    stroke-dashoffset: 285;
    animation: drawArc 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
    animation-delay: 0.1s;
  }
  @keyframes drawArc {
    to { stroke-dashoffset: 0; }
  }

  /* Amber accent arc (short trailing highlight) */
  .arc-accent {
    fill: none;
    stroke: #C49A28;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 50 235;
    stroke-dashoffset: 285;
    animation: drawArc 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
    animation-delay: 0.15s;
  }

  /* Spinning shimmer overlay */
  .arc-shimmer {
    fill: none;
    stroke: rgba(255,255,255,0.22);
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 30 255;
    stroke-dashoffset: 0;
    opacity: 0;
    animation:
      fadeInShimmer 0.4s ease forwards 1.1s,
      spinShimmer 4s linear infinite 1.1s;
  }
  @keyframes fadeInShimmer { to { opacity: 1; } }
  @keyframes spinShimmer {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -285; }
  }

  /* Arrow head at gap end */
  .arrow-head {
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
    animation-delay: 0.95s;
  }
  @keyframes fadeIn { to { opacity: 1; } }

  /* Red accent dot */
  .dot-ember {
    fill: #CC2020;
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
    animation-delay: 0.85s;
  }

  /* ── TEXT COLUMN ── */
  .text-col {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .wordmark {
    display: flex;
    align-items: baseline;
    gap: 0;
    line-height: 1;
    margin-bottom: 8px;
  }

  .letter {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: 88px;
    color: #EBEBED;
    letter-spacing: 0.1em;
    opacity: 0;
    transform: translateY(16px);
    display: inline-block;
    animation: riseIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  .l1{animation-delay:0.05s} .l2{animation-delay:0.12s} .l3{animation-delay:0.19s}
  .l4{animation-delay:0.26s} .l5{animation-delay:0.33s} .l6{animation-delay:0.40s}
  .l7{animation-delay:0.47s} .l8{animation-delay:0.54s} .l9{animation-delay:0.61s}

  @keyframes riseIn {
    to { opacity: 1; transform: translateY(0); }
  }

  .underline-svg {
    display: block;
    overflow: visible;
    margin-bottom: 10px;
  }

  .underline-path {
    stroke: #C49A28;
    stroke-width: 1.8;
    stroke-linecap: round;
    fill: none;
    stroke-dasharray: 420;
    stroke-dashoffset: 420;
    animation: drawLine 0.75s cubic-bezier(0.22,1,0.36,1) forwards;
    animation-delay: 0.72s;
  }
  @keyframes drawLine { to { stroke-dashoffset: 0; } }

  .tagline {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11.5px;
    letter-spacing: 0.48em;
    text-transform: uppercase;
    color: #55555E;
    opacity: 0;
    animation: fadeIn 0.6s ease forwards;
    animation-delay: 0.95s;
  }

  /* ── WAVEFORM ── */
  .waveform-col {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 68px;
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
    animation-delay: 0.9s;
    margin-left: 16px;
    align-self: flex-end;
    margin-bottom: 22px;
  }

  .bar {
    width: 5px;
    border-radius: 3px 3px 0 0;
    transform-origin: bottom;
  }

  .bar-grey  { background: #C8C8CC; }
  .bar-amber { background: #C49A28; }
  .bar-ember { background: #CC2020; }

  /* Heights */
  .h1{height:20px}.h2{height:26px}.h3{height:36px}.h4{height:23px}.h5{height:28px}
  .h6{height:42px}.h7{height:49px}.h8{height:44px}.h9{height:30px}.h10{height:24px}
  .h11{height:38px}.h12{height:25px}.h13{height:21px}.h14{height:28px}.h15{height:16px}
  .h16{height:23px}.h17{height:18px}.h18{height:24px}.h19{height:20px}.h20{height:15px}

  /* Pulse animations */
  .b1 {animation:p1 1.2s ease-in-out infinite 0.00s}
  .b2 {animation:p1 1.4s ease-in-out infinite 0.10s}
  .b3 {animation:pa 1.0s ease-in-out infinite 0.20s}
  .b4 {animation:p1 1.6s ease-in-out infinite 0.05s}
  .b5 {animation:p1 1.3s ease-in-out infinite 0.15s}
  .b6 {animation:pa 1.1s ease-in-out infinite 0.25s}
  .b7 {animation:pe 1.8s ease-in-out infinite 0.30s}
  .b8 {animation:pa 1.4s ease-in-out infinite 0.06s}
  .b9 {animation:p1 1.3s ease-in-out infinite 0.18s}
  .b10{animation:p1 1.0s ease-in-out infinite 0.28s}
  .b11{animation:pa 1.3s ease-in-out infinite 0.35s}
  .b12{animation:p1 1.5s ease-in-out infinite 0.08s}
  .b13{animation:p1 1.2s ease-in-out infinite 0.13s}
  .b14{animation:p1 1.5s ease-in-out infinite 0.23s}
  .b15{animation:p1 1.2s ease-in-out infinite 0.33s}
  .b16{animation:p1 1.4s ease-in-out infinite 0.43s}
  .b17{animation:p1 1.1s ease-in-out infinite 0.08s}
  .b18{animation:p1 1.3s ease-in-out infinite 0.18s}
  .b19{animation:p1 1.2s ease-in-out infinite 0.28s}
  .b20{animation:p1 1.0s ease-in-out infinite 0.38s}

  @keyframes p1 {
    0%,100%{transform:scaleY(1);opacity:0.5}
    50%    {transform:scaleY(1.7);opacity:1}
  }
  @keyframes pa {
    0%,100%{transform:scaleY(0.8);opacity:0.7}
    50%    {transform:scaleY(2.4);opacity:1}
  }
  @keyframes pe {
    0%,100%{transform:scaleY(0.6);opacity:0.4}
    50%    {transform:scaleY(2.0);opacity:0.9}
  }
</style>
</head>
<body>
<div class="logo-wrap">

  <!-- ── ICON ── -->
  <div class="icon-wrap">
    <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- subtle radial glow behind icon -->
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#C49A28" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#C49A28" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- glow backdrop -->
      <circle cx="55" cy="55" r="54" fill="url(#bgGlow)"/>

      <!-- pulsing outer glow ring -->
      <circle class="glow-ring" cx="55" cy="55" r="50"/>

      <!--
        Arc drawn from ~210° to ~150° going clockwise (330° sweep),
        leaving a ~30° gap at top-right where the "arrow" tip is.
        We use a standard SVG arc path.

        Center (55,55), radius 42.
        Start: 210° → x = 55 + 42·cos(210°) = 55 - 36.37 = 18.63, y = 55 + 42·sin(210°) = 55 - 21 = 34
        End:   150° → x = 55 + 42·cos(150°) = 55 - 36.37 = 18.63, y = 55 + 42·sin(150°) = 55 + 21 = 76
        Actually let's replicate the logo: open circle with gap at ~top-right.
        Gap from ~30° to ~80° (about 50° gap) — arc is ~310° sweep.

        Start at 80° (gap end, where arrowhead is):
          x = 55 + 42·cos(80°) = 55 + 7.29 = 62.29
          y = 55 - 42·sin(80°) = 55 - 41.36 = 13.64   (SVG y-down, sin positive downward)
          Actually SVG: y = 55 + 42·sin(80°·π/180) but sin measured from x-axis clockwise
          Let's define angle from 3-o'clock, going clockwise:
          x = cx + r·cos(θ), y = cy + r·sin(θ)  (θ in radians, 0=right, π/2=down)

        Gap: θ from -90+30 = -60° to -90+80 = -10°  (top-right area, referencing 0=right)
        Arc runs from -10° (≈350°) clockwise all the way to -60° (≈300°) = 310° sweep.

        Start at 350°:
          x = 55 + 42·cos(350°·π/180) = 55 + 41.36 = 96.36 → but that's right side... too far
        
        Looking at the actual logo image: it's a circle with a gap at the top-right, 
        roughly from 1 o'clock (30°) to 3 o'clock (90°) → ~60° gap, 300° arc.
        Arrow points right/downward at gap start (~90°, 3-o'clock).

        Start: 90° (3-o'clock, bottom of gap): x=55+42=97, y=55
        End:   30° (1-o'clock, top of gap):   x=55+42·cos(30°)=55+36.37=91.37, y=55-42·sin(30°)=55-21=34
        Large arc: 1, sweep: 1 (clockwise), going 300°.
      -->

      <!-- faint track ring -->
      <circle class="arc-track" cx="55" cy="55" r="42"/>

      <!-- main arc: 300° clockwise, gap at top-right -->
      <path class="arc-main"
        d="M 97 55
           A 42 42 0 1 0 91.37 34"
      />

      <!-- amber accent — same path, offset dash -->
      <path class="arc-accent"
        d="M 97 55
           A 42 42 0 1 0 91.37 34"
      />

      <!-- shimmer sweep -->
      <path class="arc-shimmer"
        d="M 97 55
           A 42 42 0 1 0 91.37 34"
      />

      <!-- arrowhead at the end of arc (~30°, top-right) pointing clockwise tangent -->
      <!-- tangent at 30° going counter-clockwise (the arc's travel direction reversed at end) 
           tangent direction at end of arc (coming from clockwise): perpendicular to radius at 30°
           radius at 30°: (cos30°, -sin30°) = (0.866, -0.5) → tangent (ccw): (0.5, 0.866) rotated...
           Actually for clockwise arc ending at 30°, tangent direction = (sin30°, -cos30°) = (0.5, -0.866)
           Arrow tip at (91.37, 34), pointing in direction (0.5, -0.866), size ~8px -->
      <g class="arrow-head">
        <!-- arrowhead: small triangle -->
        <polygon
          points="91.37,34  84.5,31.5  88.8,39.2"
          fill="#EBEBED"
        />
      </g>

      <!-- Red ember dot at ~210° (bottom-left of arc) -->
      <circle class="dot-ember" cx="18.5" cy="76" r="4.5"/>

    </svg>
  </div>

  <!-- ── TEXT + UNDERLINE + TAGLINE ── -->
  <div class="text-col">
    <div class="wordmark">
      <span class="letter l1">R</span>
      <span class="letter l2">E</span>
      <span class="letter l3">S</span>
      <span class="letter l4">O</span>
      <span class="letter l5">N</span>
      <span class="letter l6">A</span>
      <span class="letter l7">N</span>
      <span class="letter l8">C</span>
      <span class="letter l9">E</span>
    </div>

    <svg class="underline-svg" width="420" height="4" viewBox="0 0 420 4">
      <path class="underline-path" d="M0 2 L420 2"/>
    </svg>

    <span class="tagline">Your music · your mood</span>
  </div>

  <!-- ── WAVEFORM ── -->
  <div class="waveform-col">
    <div class="bar bar-grey  h1  b1"></div>
    <div class="bar bar-grey  h2  b2"></div>
    <div class="bar bar-amber h3  b3"></div>
    <div class="bar bar-grey  h4  b4"></div>
    <div class="bar bar-grey  h5  b5"></div>
    <div class="bar bar-amber h6  b6"></div>
    <div class="bar bar-ember h7  b7"></div>
    <div class="bar bar-amber h8  b8"></div>
    <div class="bar bar-grey  h9  b9"></div>
    <div class="bar bar-grey  h10 b10"></div>
    <div class="bar bar-amber h11 b11"></div>
    <div class="bar bar-grey  h12 b12"></div>
    <div class="bar bar-grey  h13 b13"></div>
    <div class="bar bar-grey  h14 b14"></div>
    <div class="bar bar-grey  h15 b15"></div>
    <div class="bar bar-grey  h16 b16"></div>
    <div class="bar bar-grey  h17 b17"></div>
    <div class="bar bar-grey  h18 b18"></div>
    <div class="bar bar-grey  h19 b19"></div>
    <div class="bar bar-grey  h15 b20"></div>
  </div>

</div>
</body>
</html>

# Resonance.io (v0.2.1)

**An institutional-grade ecosystem integrating predictive AI analytics, real-time sync engines, and immersive interfaces.** Resonance is architected for modular distribution, cross-platform playback consistency, and deep feature-level analytics.

---

## 🌐 Ecosystem Architecture

The Resonance platform is broken down into highly specialized sub-systems to maintain separation of concerns, rapid testability, and isolated deployment vectors:
