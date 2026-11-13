export const professorPipArt = `
<svg class="teacher-svg" viewBox="0 0 160 190" aria-hidden="true">
  <defs>
    <radialGradient id="teacherHelmetGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#7bf5d0"/>
      <stop offset="40%" stop-color="#2ba882"/>
      <stop offset="90%" stop-color="#144d3b"/>
      <stop offset="100%" stop-color="#0a2a20"/>
    </radialGradient>
    <linearGradient id="teacherVisorShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <text x="18" y="32" font-size="12" fill="#ffd23f" opacity="0.8">✦</text>
  <text x="136" y="110" font-size="10" fill="#3ee6b5" opacity="0.7">★</text>
  <text x="24" y="155" font-size="8" fill="#ffd23f" opacity="0.6">✦</text>

  <path d="M 42 126 C 42 115 118 115 118 126 L 130 186 C 130 192 30 192 30 186 Z" fill="#241d5b" stroke="#3ee6b5" stroke-width="2.5"/>
  <rect x="60" y="132" width="40" height="42" rx="8" fill="#141038" stroke="#ffd23f" stroke-width="1.5"/>
  <circle cx="80" cy="144" r="7" fill="#3ee6b5"/>
  <polygon points="80,139 82,143 86,143 83,146 84,150 80,147 76,150 77,146 74,143 78,143" fill="#ffd23f"/>

  <g class="teacher-wave-hand">
    <path d="M 40 138 C 26 130 12 118 16 108 C 20 98 32 108 36 120 Z" fill="#2a2468" stroke="#3ee6b5" stroke-width="2"/>
    <circle cx="16" cy="106" r="10" fill="#ffffff" stroke="#241d5b" stroke-width="2"/>
    <ellipse cx="14" cy="98" rx="3.5" ry="5" fill="#ffffff" stroke="#241d5b" stroke-width="1.5" transform="rotate(-15 14 98)"/>
    <ellipse cx="20" cy="100" rx="3.5" ry="5" fill="#ffffff" stroke="#241d5b" stroke-width="1.5" transform="rotate(10 20 100)"/>
  </g>

  <line x1="114" y1="140" x2="152" y2="68" stroke="#d49445" stroke-width="4" stroke-linecap="round"/>
  <polygon class="pointer-star" points="152,60 155,66 161,67 156,71 158,77 152,73 146,77 148,71 143,67 149,66" fill="#ffd23f" stroke="#fff" stroke-width="1"/>
  <circle cx="114" cy="140" r="9" fill="#ffffff" stroke="#241d5b" stroke-width="2"/>

  <circle cx="80" cy="80" r="46" fill="url(#teacherHelmetGrad)" stroke="#3ee6b5" stroke-width="3.5"/>
  <ellipse cx="60" cy="62" rx="16" ry="9" fill="url(#teacherVisorShine)" transform="rotate(-30 60 62)"/>

  <circle cx="80" cy="82" r="35" fill="#ffe2c4"/>
  <circle cx="56" cy="90" r="6" fill="#ff708d" opacity="0.6"/>
  <circle cx="104" cy="90" r="6" fill="#ff708d" opacity="0.6"/>

  <ellipse class="teacher-eye" cx="64" cy="78" rx="7" ry="9" fill="#1b1744"/>
  <circle cx="62" cy="75" r="3" fill="#ffffff"/>
  <circle cx="66" cy="81" r="1.5" fill="#ffffff"/>

  <ellipse class="teacher-eye" cx="96" cy="78" rx="7" ry="9" fill="#1b1744"/>
  <circle cx="94" cy="75" r="3" fill="#ffffff"/>
  <circle cx="98" cy="81" r="1.5" fill="#ffffff"/>

  <circle cx="64" cy="78" r="13" fill="none" stroke="#ffd23f" stroke-width="2.5"/>
  <circle cx="96" cy="78" r="13" fill="none" stroke="#ffd23f" stroke-width="2.5"/>
  <path d="M 77 78 Q 80 75 83 78" fill="none" stroke="#ffd23f" stroke-width="2.5"/>

  <path class="teacher-mouth" d="M 72 96 Q 80 104 88 96" fill="none" stroke="#8b263e" stroke-width="3" stroke-linecap="round"/>

  <polygon points="80,14 135,28 80,42 25,28" fill="#16123d" stroke="#ffd23f" stroke-width="2.5"/>
  <path d="M 50 32 Q 80 44 110 32 L 110 42 Q 80 54 50 42 Z" fill="#272063" stroke="#ffd23f" stroke-width="1"/>
  <circle cx="80" cy="28" r="4.5" fill="#ffd23f"/>
  <g class="teacher-tassel">
    <path d="M 80 28 Q 112 34 122 56 Q 124 72 121 82" stroke="#ffd23f" stroke-width="2.5" fill="none"/>
    <circle cx="121" cy="84" r="3.5" fill="#ffd23f"/>
  </g>
</svg>
`;
