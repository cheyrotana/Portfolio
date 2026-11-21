import unifinder0 from "../assets/unifinder/0.png";
import unifinder1 from "../assets/unifinder/1.png";
import unifinder2 from "../assets/unifinder/2.webp";
import unifinder3 from "../assets/unifinder/3.png";
import unifinder4 from "../assets/unifinder/4.png";
import unifinder5 from "../assets/unifinder/5.webp";
import unifinder6 from "../assets/unifinder/6.webp";
import unifinder7 from "../assets/unifinder/7.webp";
import unifinder8 from "../assets/unifinder/8.png";
import unifinder9 from "../assets/unifinder/9.webp";
import unifinder10 from "../assets/unifinder/10.png";
import unifinder11 from "../assets/unifinder/11.png";
import unifinder12 from "../assets/unifinder/12.png";
import frostGuard1 from "../assets/frost-guard/1.webp";
import frostGuard2 from "../assets/frost-guard/2.webp";
import frostGuard3 from "../assets/frost-guard/3.webp";
import frostGuard4 from "../assets/frost-guard/4.webp";
import frostGuard5 from "../assets/frost-guard/5.webp";
import modula1 from "../assets/modula/1.webp";
import modula2 from "../assets/modula/2.png";
import modula3 from "../assets/modula/3.png";
import modula4 from "../assets/modula/4.png";
import modula5 from "../assets/modula/5.webp";
import modula6 from "../assets/modula/6.webp";
import modula7 from "../assets/modula/7.png";
import modula8 from "../assets/modula/8.webp";
import modula9 from "../assets/modula/9.png";
import modula10 from "../assets/modula/10.webp";
import modula11 from "../assets/modula/11.png";
import modula12 from "../assets/modula/12.png";
import hrmMlmupc1 from "../assets/hrm/mlmupc-1.webp";
import hrmMlmupc2 from "../assets/hrm/mlmupc-2.webp";
import hrmMlmupc3 from "../assets/hrm/mlmupc-3.webp";
import hrmMlmupc4 from "../assets/hrm/mlmupc-4.webp";
import hrmMlmupc5 from "../assets/hrm/mlmupc-5.jpg";
import hrmNis1 from "../assets/hrm/nis-1.webp";
import hrmNis2 from "../assets/hrm/nis-2.webp";
import hrmNisStore1 from "../assets/hrm/nis-store-1.webp";
import hrmNisStore2 from "../assets/hrm/nis-store-2.webp";
import hrmNisStore3 from "../assets/hrm/nis-store-3.webp";
import faceScan1 from "../assets/face-scan/1.webp";
// App icons, copied from each app's own repo
import faceScanLogo from "../assets/logos/face-scan.svg";
import faceScanGlyph from "../assets/logos/face-scan-glyph.svg";
import hrmMlmupcSplash from "../assets/logos/hrm-mlmupc-splash.png";
import hrmNisSplash from "../assets/logos/hrm-nis-splash.png";
import phumiYerngSplash from "../assets/logos/phumiyerng-splash.png";
import unifinderSplash from "../assets/logos/unifinder-splash.png";
import hrmMlmupcLogo from "../assets/logos/hrm-mlmupc.png";
import hrmNisLogo from "../assets/logos/hrm-nis.png";
import modulaLogo from "../assets/logos/modula.svg";
import frostGuardLogo from "../assets/logos/frost-guard.svg"; // a stand-in: the game has no app icon
import phumiYerngLogo from "../assets/logos/phumiyerng.png";
import unifinderLogo from "../assets/logos/unifinder.png";
import phumiYerng1 from "../assets/phumiyerng/1.webp";
import phumiYerng2 from "../assets/phumiyerng/2.webp";
import phumiYerng3 from "../assets/phumiyerng/3.webp";
import phumiYerng4 from "../assets/phumiyerng/4.webp";
import phumiYerng5 from "../assets/phumiyerng/5.webp";

export type Category = "client" | "mobile" | "web" | "hardware" | "game";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "client", label: "Client work" },
  { id: "mobile", label: "Mobile" },
  { id: "web", label: "Web" },
  { id: "hardware", label: "Hardware" },
  { id: "game", label: "Game" },
];

/** The app's launch screen, as its native splash config sets it: a colour and a centred logo. */
export interface Splash {
  bg: string;
  logo?: string; // without one, the app icon's glyph is drawn in white
}

export interface ProjectApp {
  id: string;
  title: string;
  client: string;
  logo: string;
  images: string[];
  stat?: { value: string; label: string };
  splash?: Splash;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  builtAt?: string; // the team it was built with
  year: string;
  role: string;
  status?: string;
  categories: Category[];
  featured?: boolean;
  summary: string;
  description: string;
  highlights: string[];
  stat?: { value: string; label: string };
  tech: string[];
  images: string[];
  logo?: string; // app icon; without one, ProjectPhone draws one from an icon and a colour
  // Separate builds shown as their own apps on the project phone
  apps?: ProjectApp[];
  splash?: Splash;
  githubUrl?: string;
  demoUrl?: string;
}

export const projects: Project[] = [
  {
    id: "hrm-mlmupc",
    title: "MLMUPC HRM",
    client: "MLMUPC",
    builtAt: "Digital Revolution team, MLMUPC (internship)",
    year: "2026",
    role: "Mobile & Web Developer (intern)",
    categories: ["client", "mobile", "web"],
    featured: true,
    summary: "A ministry-wide HR platform that takes civil-servant administration digital, on web and mobile.",
    description:
      "HRM for the Ministry of Land Management, Urban Planning and Construction (MLMUPC). Officers check in, request leave and missions, and manage their records from the mobile app, while administrators run the ministry from the web app. I built on both during my internship with the Digital Revolution team.",
    highlights: [
      "Built attendance tracking in the Flutter app, with daily, weekly, monthly and yearly reports",
      "Built mission and leave requests, plus organization admin screens with QR features",
      "Hosted the app as a Telegram Mini App with automatic sign-in",
      "Worked on the Angular web app: officer CVs and profiles, organization statistics, attendance timelines and settings",
      "Shipped a Khmer and English interface throughout",
    ],
    stat: { value: "~3,000", label: "officers at MLMUPC" },
    tech: ["Flutter", "Angular", "NestJS", "PostgreSQL", "Socket.IO"],
    images: [hrmMlmupc1, hrmMlmupc2, hrmMlmupc3, hrmMlmupc4, hrmMlmupc5],
    logo: hrmMlmupcLogo,
    splash: { bg: "#0C7EA5", logo: hrmMlmupcSplash },
  },
  {
    id: "hrm-nis",
    title: "NIS HRM",
    client: "NIS",
    builtAt: "CamCyber Digital Tech Team",
    year: "2026",
    role: "Full-Stack Developer",
    categories: ["client", "web"],
    featured: true,
    summary: "A government HR platform with on-site face-scanner check-ins connected to the cloud.",
    description:
      "HRM for the National Institute of Statistics (NIS), Ministry of Planning, built at the CamCyber Digital Tech Team. I work full-stack on it: the Angular web app and the NestJS backend, with face scanners on site sending check-ins in real time.",
    highlights: [
      "Work full-stack on the Angular web app and the NestJS backend",
      "Connected on-site face scanners to HRM, so every scan becomes a real-time check-in",
      "Worked on attendance, leave and personnel records for the institute's officers",
    ],
    stat: { value: "500+", label: "officers at NIS" },
    tech: ["Angular", "NestJS", "PostgreSQL", "Socket.IO"],
    images: [hrmNisStore1, hrmNisStore2, hrmNisStore3, hrmNis1, hrmNis2],
    logo: hrmNisLogo,
    splash: { bg: "#FFFFFF", logo: hrmNisSplash },
  },
  {
    id: "face-scan",
    title: "Face Scan Connector",
    client: "NIS HRM",
    builtAt: "CamCyber Digital Tech Team",
    year: "2026",
    role: "Full-Stack Developer",
    categories: ["client", "hardware"],
    summary: "Pairs on-site face scanners with HRM so every scan becomes an attendance record.",
    description:
      "Connects Raspberry Pi face-scanner machines and Dahua face terminals to the HRM system. Each machine registers itself and shows a pairing QR code; administrators pair it and assign staff from the web app, and their faces are synced to the scanner automatically.",
    highlights: [
      "Built the Python connector that registers each Raspberry Pi and shows its pairing QR code in kiosk mode",
      "Built the NestJS worker that syncs staff face photos to the Dahua scanner and reports back to HRM",
      "Built the Angular screens where admins create and pair machines, then assign staff",
      "Added a per-machine monitor page limited to its assigned users, with retry on temporary API failures",
      "Wrote the setup manual and deployment checklist for staff and future developers",
    ],
    tech: ["Python", "Raspberry Pi", "NestJS", "Angular", "PostgreSQL"],
    logo: faceScanLogo,
    splash: { bg: "#1d4ed8", logo: faceScanGlyph },
    images: [faceScan1],
  },
  {
    id: "phumiyerng",
    title: "PhumiYerng",
    client: "LASED III communities",
    builtAt: "CamCyber Digital Tech Team",
    year: "2026",
    role: "Mobile Developer",
    status: "In development",
    categories: ["client", "mobile"],
    featured: true,
    summary: "Marketplace and community-tourism app for rural communities in Cambodia's LASED III program.",
    description:
      "PhumiYerng (ភូមិយើង, \"Our Village\") brings LASED III communities onto one platform to sell their products, promote trips and homestays, and share news through their own community pages. I'm building the Flutter mobile app.",
    highlights: [
      "Set up the Flutter app from scratch with MVVM and separate dev, UAT and production builds",
      "Built the customer flows: product catalog, cart and checkout, trips and homestays",
      "Built community pages with posts and a project tab, plus OTP sign-in",
      "Added live notifications over WebSockets",
    ],
    stat: { value: "19", label: "partner communities" },
    tech: ["Flutter", "Dart", "MVVM", "NestJS", "Socket.IO"],
    logo: phumiYerngLogo,
    splash: { bg: "#2E7D32", logo: phumiYerngSplash },
    images: [phumiYerng1, phumiYerng2, phumiYerng3, phumiYerng4, phumiYerng5],
  },
  {
    id: "unifinder",
    title: "UniFinder",
    client: "CADT team project",
    year: "2025",
    role: "Frontend Developer",
    categories: ["mobile"],
    summary: "Offline app that helps rural students find their best-fit university majors.",
    description:
      "A Flutter mobile application that helps students, especially those living in rural areas of Cambodia, find their best-fit university majors and plan their academic futures — 100% offline.",
    highlights: [
      "Built the Flutter frontend, with go_router for navigation",
      "Built the screens that guide students to their best-fit university majors",
      "Made it work 100% offline, for students in rural areas of Cambodia",
    ],
    tech: ["Flutter", "Dart", "go_router"],
    logo: unifinderLogo,
    splash: { bg: "#FFFFFF", logo: unifinderSplash },
    images: [
      unifinder1, unifinder2, unifinder3, unifinder4, unifinder5, unifinder6, unifinder0,
      unifinder7, unifinder8, unifinder9, unifinder10, unifinder11, unifinder12,
    ],
    githubUrl: "https://github.com/Ra-Fat/UniFinder.git",
    demoUrl: "https://youtu.be/luuqpryOJ3g?si=PzYM49oHuPeBR9P_",
  },
  {
    id: "modula",
    title: "Modula",
    client: "CADT team project",
    year: "2025 — 2026",
    role: "Frontend Developer",
    categories: ["web"],
    summary: "Modular point-of-sale system for small food & beverage businesses.",
    description:
      "Modula is a modular POS designed to help small F&B businesses manage daily operations efficiently. The Flutter frontend is web-first, with mobile support planned.",
    highlights: [
      "Built the Flutter frontend, web-first with mobile support planned",
      "Built the screens small food & beverage businesses use to run their day",
      "Managed state with Riverpod and local data with Drift",
    ],
    tech: ["Flutter", "Riverpod", "Drift"],
    logo: modulaLogo,
    splash: { bg: "#3A3A3A", logo: modulaLogo },
    images: [
      modula1, modula2, modula3, modula4, modula5, modula6,
      modula7, modula8, modula9, modula10, modula11, modula12,
    ],
    githubUrl: "https://github.com/Zorng/ModulaFrontend.git",
    demoUrl: "https://youtu.be/JI82H8Xl9lM",
  },
  {
    id: "frost-guard",
    title: "Frost Guard",
    client: "CADT team project",
    year: "2025",
    role: "Game Developer",
    categories: ["game"],
    summary: "Tower defense game set in an endless, magical winter.",
    description:
      "The Winter Siege is a tower defense strategy game where players defend their castle from waves of enemies in a magical, endless winter world. Players place and upgrade towers, manage resources, and plan strategically to survive increasingly difficult enemy waves.",
    highlights: [
      "Built a tower defense game in Unity and C#",
      "Built the towers players place and upgrade to hold the castle",
      "Built the resources and enemy waves that get harder as the game goes on",
    ],
    tech: ["Unity", "C#"],
    logo: frostGuardLogo,
    splash: { bg: "#0b1530" },
    images: [frostGuard1, frostGuard2, frostGuard3, frostGuard4, frostGuard5],
    githubUrl: "https://github.com/Ra-Fat/Frost-Guard.git",
    demoUrl: "https://youtu.be/mIUvftuUees?si=5U4Ct_zm97CKRLN2",
  },
];
