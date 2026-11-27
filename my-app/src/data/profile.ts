import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import {
  SiAngular, SiDart, SiExpress, SiFigma, SiFlutter, SiGit, SiGithub, SiGitlab, SiJavascript,
  SiNestjs, SiPostgresql, SiPython, SiRaspberrypi, SiReact, SiSequelize, SiSocketdotio,
  SiTailwindcss, SiTypescript, SiUnity,
} from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";
import camcyberLogo from "../assets/logos/camcyber.png";
import cadtLogo from "../assets/logos/cadt.png";

export const profile = {
  name: "Chey Rotana",
  role: "Mobile & Full-Stack Developer",
  location: "Phnom Penh, Cambodia",
  education: "B.Sc. Computer Science · CADT",
  studying: "Feb 2024 – Present",
  currently: "Full-Stack Developer Intern at CamCyber",
  internship: "Mobile Developer Intern on the CamCyber Digital Tech Team, Apr – Jun 2026",
};

// Where I study, work and interned, with the dates: every theme's About, hero and board read these
export const places = {
  study: { place: "CADT", detail: "B.Sc. Computer Science", when: "Feb 2024 – Present" },
  work: { place: "CamCyber", detail: "Full-Stack Developer Intern", when: "Jul 2026 – Present" },
  intern: { place: "CamCyber", detail: "Mobile Developer Intern", when: "Apr – Jun 2026" },
};

export interface SocialLink {
  name: string;
  url: string;
  icon: IconType;
}

export const socials: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/cheyrotana", icon: FaGithub },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/rotana-chey-92b572396/", icon: FaLinkedin },
];

export interface Skill {
  name: string;
  icon: IconType;
  // Brand colour, shown in the colourful themes. Omitted for black logos so they follow the text colour.
  color?: string;
  // Used on every project (version control, design), so it isn't listed in each project's tech
  everywhere?: boolean;
}

export interface SkillGroup {
  title: string;
  blurb: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Mobile",
    blurb: "Cross-platform apps for Android, iOS and the web.",
    skills: [
      { name: "Flutter", icon: SiFlutter, color: "#47c5fb" },
      { name: "Dart", icon: SiDart, color: "#00b4ab" },
    ],
  },
  {
    title: "Frontend",
    blurb: "Responsive dashboards and sites.",
    skills: [
      { name: "React", icon: SiReact, color: "#61dafb" },
      { name: "Angular", icon: SiAngular, color: "#dd0031" },
      { name: "TypeScript", icon: SiTypescript, color: "#3178c6" },
      { name: "JavaScript", icon: SiJavascript, color: "#f7df1e" },
      { name: "Tailwind", icon: SiTailwindcss, color: "#38bdf8" },
    ],
  },
  {
    title: "Backend & Data",
    blurb: "APIs, realtime and databases.",
    skills: [
      { name: "NestJS", icon: SiNestjs, color: "#e0234e" },
      { name: "Express", icon: SiExpress },
      { name: "Socket.IO", icon: SiSocketdotio },
      { name: "PostgreSQL", icon: SiPostgresql, color: "#4169e1" },
      { name: "Sequelize", icon: SiSequelize, color: "#52b0e7" },
    ],
  },
  {
    title: "Hardware & Games",
    blurb: "Devices, scripts and game worlds.",
    skills: [
      { name: "Python", icon: SiPython, color: "#3776ab" },
      { name: "Raspberry Pi", icon: SiRaspberrypi, color: "#c51a4a" },
      { name: "Unity", icon: SiUnity },
      { name: "C#", icon: TbBrandCSharp, color: "#9b4f96" },
    ],
  },
  {
    title: "Tools",
    blurb: "How the work gets done.",
    skills: [
      { name: "Git", icon: SiGit, color: "#f05032", everywhere: true },
      { name: "GitHub", icon: SiGithub, everywhere: true },
      { name: "GitLab", icon: SiGitlab, color: "#fc6d26", everywhere: true },
      { name: "Figma", icon: SiFigma, color: "#f24e1e", everywhere: true },
    ],
  },
];

export interface JourneyStop {
  date: string; // short, for the radio dial
  range?: string; // from when to when, on the stop itself
  title: string;
  org: string;
  text: string;
  kind: "study" | "project" | "work" | "next";
  projectId?: string; // links the stop to its card in the Work section
  logo?: string; // the organisation's own logo, shown on the stop instead of the project's app icon
}

// Stops on the Journey: the career path, oldest first. The projects themselves live in the Work section.
export const journey: JourneyStop[] = [
  {
    date: "Feb 2024",
    range: "Feb 2024 – Present",
    title: "CADT",
    org: "B.Sc. Computer Science",
    text: "Started my Computer Science degree at the Cambodia Academy of Digital Technology.",
    kind: "study",
    logo: cadtLogo,
  },
  {
    date: "Apr 2026",
    range: "Apr – Jun 2026",
    title: "CamCyber",
    org: "Mobile Developer Intern · Digital Tech Team",
    text: "Joined the CamCyber Digital Tech Team as a mobile developer intern, building the HR system for the Ministry of Land Management, Urban Planning and Construction (MLMUPC), used by about 3,000 officers. In the Flutter app: attendance with daily to yearly reports, leave and mission requests, and a Telegram Mini App with automatic sign-in. In the Angular web app: officer CVs and profiles, organization statistics and attendance timelines, all in Khmer and English.",
    kind: "work",
    projectId: "hrm-mlmupc",
    logo: camcyberLogo,
  },
  {
    date: "Jul 2026",
    range: "Jul 2026 – Present",
    title: "CamCyber",
    org: "Full-Stack Developer Intern · Digital Tech Team",
    text: "Stayed on as a full-stack developer intern, building platforms for government and the communities they serve: HRM for the National Institute of Statistics (Angular web app and NestJS backend), a Raspberry Pi connector that turns on-site face scans into real-time check-ins, and the Flutter app for PhumiYerng, a marketplace and community-tourism app for the World Bank-backed LASED III program.",
    kind: "work",
    projectId: "hrm-nis",
    logo: camcyberLogo,
  },
  {
    date: "Now",
    title: "Where to next?",
    org: "Final year at CADT",
    text: "Finishing my degree and always up for the next project worth building.",
    kind: "next",
  },
];
