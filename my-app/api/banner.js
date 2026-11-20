// GET /api/banner  ->  the GitHub profile banner for the current time of day in Phnom Penh.
// The four scenes live in the profile repo (cheyrotana/cheyrotana, assets/banner/*.svg) and are
// built by its scripts/generate-svgs.js. Add ?phase=dawn|day|dusk|night to force one.

const SCENES = 'https://raw.githubusercontent.com/cheyrotana/cheyrotana/main/assets/banner/';

// Phnom Penh is UTC+7 all year; the sun rises around 6:00 and sets around 18:00.
const PHASES = [['night', 0], ['dawn', 5], ['day', 7], ['dusk', 17], ['night', 19]];
const NAMES = new Set(PHASES.map(([p]) => p));

function currentPhase() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Phnom_Penh' }).format(new Date()));
  return PHASES.filter(([, h]) => hour >= h).pop()[0];
}

export default async function handler(req, res) {
  const asked = String(req.query.phase || '');
  const phase = NAMES.has(asked) ? asked : currentPhase();

  const scene = await fetch(SCENES + phase + '.svg');
  if (!scene.ok) {
    res.status(502).send(`Could not load the ${phase} banner (${scene.status})`);
    return;
  }

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // GitHub's image proxy must not keep an old scene; Vercel's CDN may reuse one for 5 minutes.
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=300');
  res.setHeader('X-Banner-Phase', phase);
  res.status(200).send(await scene.text());
}
