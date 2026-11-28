const paths = {
  star: '<path d="m12 2 2.7 6.5L22 12l-7.3 3.5L12 22l-2.7-6.5L2 12l7.3-3.5Z"/>',
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  earth: '<circle cx="12" cy="12" r="9"/><path d="m5 5 5 2 1 4-4 1-2 4m15-8-6 2 1 5 4 2M12 20l-1-5"/>',
  moon: '<path d="M20.6 14A9 9 0 0 1 10 3.4 9 9 0 1 0 20.6 14Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  planet: '<circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.4" transform="rotate(-22 12 12)"/>',
  crater: '<ellipse cx="12" cy="13" rx="10" ry="6"/><path d="M5 13c2 5 12 5 14 0M9 13l3-4 3 4"/>',
  rock: '<path d="m3 15 3-10 10-2 6 10-5 8-10-1Z"/><path d="m6 5 5 8 11 0m-11 0-4 7m4-7 5-10"/>',
  lab: '<path d="M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  motion: '<path d="M3 7h10m-8 5h15M2 17h10"/><circle cx="18" cy="6" r="3"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m2.8-9.8a9 9 0 0 1 0 12.6"/>',
  soundOff: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m21 9-6 6m0-6 6 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
