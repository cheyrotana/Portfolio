import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import {
  SiAngular, SiDart, SiExpress, SiFigma, SiFlutter, SiGit, SiGithub, SiGitlab, SiJavascript,
  SiNestjs, SiPostgresql, SiPython, SiRaspberrypi, SiReact, SiSequelize, SiSocketdotio,
  SiTailwindcss, SiTypescript, SiUnity,
} from "react-icons/si";
import { TbBrandCSharp } from "react-icons/tb";

export const profile = {
  name: "Chey Rotana",
  role: "Mobile & Full-Stack Developer",
  location: "Phnom Penh, Cambodia",
  education: "B.Sc. Computer Science · CADT",
  year: "Year 4",
  currently: "Fourth-year student at CADT",
  internship: "Interned 3 months with the Digital Revolution team at MLMUPC",
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
  date: string;
  title: string;
  org: string;
  text: string;
  kind: "study" | "project" | "work" | "next";
  projectId?: string; // links the stop to its card in the Work section
}

// Stops on the Journey flight path, oldest first (dates from each project's git history).
export const journey: JourneyStop[] = [
  {
    date: "Year 1",
    title: "Took off at CADT",
    org: "B.Sc. Computer Science",
    text: "Started my Computer Science degree at the Cambodia Academy of Digital Technology.",
    kind: "study",
  },
  {
    date: "Nov 2025",
    title: "Modula",
    org: "CADT team project",
    text: "Frontend for a modular point-of-sale system for small food & beverage businesses, in Flutter web.",
    kind: "project",
    projectId: "modula",
  },
  {
    date: "Dec 2025",
    title: "Frost Guard",
    org: "CADT team project",
    text: "A tower defense game built in Unity and C#.",
    kind: "project",
    projectId: "frost-guard",
  },
  {
    date: "Dec 2025",
    title: "UniFinder",
    org: "CADT team project",
    text: "Offline Flutter app that helps rural students choose their university major.",
    kind: "project",
    projectId: "unifinder",
  },
  {
    date: "Apr 2026",
    title: "Internship (3 months)",
    org: "MLMUPC · Digital Revolution team",
    text: "Three months on the HRM platform, building the Flutter app and Angular web app used by MLMUPC and NIS.",
    kind: "work",
    projectId: "hrm",
  },
  {
    date: "Sep 2026",
    title: "Face Scan Connector",
    org: "HRM · MLMUPC & NIS",
    text: "Linked Raspberry Pi face scanners to HRM so every scan becomes an attendance record.",
    kind: "work",
    projectId: "face-scan",
  },
  {
    date: "Oct 2026",
    title: "PhumiYerng",
    org: "LASED III communities",
    text: "Started the Flutter app for a community marketplace and tourism platform.",
    kind: "work",
    projectId: "phumiyerng",
  },
  {
    date: "Now",
    title: "Where to next?",
    org: "Final year at CADT",
    text: "Finishing my degree and always up for the next project worth building.",
    kind: "next",
  },
];
