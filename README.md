# Chey Rotana — Portfolio

My personal portfolio website, showcasing my projects, tech stack and contact info.

🌐 **Live site:** https://cheyrotana.vercel.app

## Features
- Animated hero, about and tech-stack sections (scrolling marquee of tools I use)
- Project showcase with image galleries, a full-screen photo viewer and demo video links
- Contact form and social links
- Fully responsive, from phones to wide screens

## Tech
React · TypeScript · Tailwind CSS · Framer Motion · Vite · deployed on Vercel

## Project structure
The site lives in `my-app/`. It has three themes (Retro, Metro, Persona) over the same content.

```
my-app/src/
  App.tsx, main.tsx
  data/          the content: profile, journey, projects, skills
  sections/      the page sections every theme shares (About, Journey, Skills, Work, Contact)
  components/    shared pieces: navbar, settings, terminal, case study, gallery, contact form…
  themes/
    retro/       the 70s listening room: 3D room (RetroRoom + roomTextures), section components,
                 styles/ (one stylesheet per section, loaded by retro.css)
    metro/       the city line: 3D city, map, departure board, metro.css
    persona/     Persona decorations
  hooks/, lib/   smooth scroll, events, sound, music, weather, theme, achievements
  styles/        index.css: Tailwind, shared tokens and the Persona look
  assets/        project screenshots and logos
```

## Run locally
```bash
cd my-app
npm install
npm run dev
```
