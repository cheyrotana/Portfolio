import unifinder0 from "../../assets/Unifinder pictures/0.png";
import unifinder1 from "../../assets/Unifinder pictures/1.png";
import unifinder2 from "../../assets/Unifinder pictures/2.png";
import unifinder3 from "../../assets/Unifinder pictures/3.png";
import unifinder4 from "../../assets/Unifinder pictures/4.png";
import unifinder5 from "../../assets/Unifinder pictures/5.png";
import unifinder6 from "../../assets/Unifinder pictures/6.png";
import unifinder7 from "../../assets/Unifinder pictures/7.png";
import unifinder8 from "../../assets/Unifinder pictures/8.png";
import unifinder9 from "../../assets/Unifinder pictures/9.png";
import unifinder10 from "../../assets/Unifinder pictures/10.png";
import unifinder11 from "../../assets/Unifinder pictures/11.png";
import unifinder12 from "../../assets/Unifinder pictures/12.png";
import frostGuard1 from "../../assets/Frost Guard/1.png";
import frostGuard2 from "../../assets/Frost Guard/2.png";
import frostGuard3 from "../../assets/Frost Guard/3.png";
import frostGuard4 from "../../assets/Frost Guard/4.png";
import frostGuard5 from "../../assets/Frost Guard/5.png";
import modula1 from "../../assets/Modula/1.png";
import modula2 from "../../assets/Modula/2.png";
import modula3 from "../../assets/Modula/3.png";
import modula4 from "../../assets/Modula/4.png";
import modula5 from "../../assets/Modula/5.png";
import modula6 from "../../assets/Modula/6.png";
import modula7 from "../../assets/Modula/7.png";
import modula8 from "../../assets/Modula/8.png";
import modula9 from "../../assets/Modula/9.png";
import modula10 from "../../assets/Modula/10.png";
import modula11 from "../../assets/Modula/11.png";
import modula12 from "../../assets/Modula/12.png";
import hrmMlmupc1 from "../../assets/HRM/mlmupc-1.jpg";
import hrmMlmupc2 from "../../assets/HRM/mlmupc-2.jpg";
import hrmMlmupc3 from "../../assets/HRM/mlmupc-3.jpg";
import hrmMlmupc4 from "../../assets/HRM/mlmupc-4.jpg";
import hrmMlmupc5 from "../../assets/HRM/mlmupc-5.jpg";
import hrmNis1 from "../../assets/HRM/nis-1.jpg";
import hrmNis2 from "../../assets/HRM/nis-2.jpg";
import faceScan1 from "../../assets/FaceScan/1.jpg";
// App icons, copied from each app's own repo
import faceScanLogo from "../../assets/logos/face-scan.svg";
import faceScanGlyph from "../../assets/logos/face-scan-glyph.svg";
import hrmMlmupcSplash from "../../assets/logos/hrm-mlmupc-splash.png";
import hrmNisSplash from "../../assets/logos/hrm-nis-splash.png";
import phumiYerngSplash from "../../assets/logos/phumiyerng-splash.png";
import unifinderSplash from "../../assets/logos/unifinder-splash.png";
import hrmMlmupcLogo from "../../assets/logos/hrm-mlmupc.png";
import hrmNisLogo from "../../assets/logos/hrm-nis.png";
import modulaLogo from "../../assets/logos/modula.svg";
import phumiYerngLogo from "../../assets/logos/phumiyerng.png";
import unifinderLogo from "../../assets/logos/unifinder.png";
import phumiYerng1 from "../../assets/PhumiYerng/1.jpg";
import phumiYerng2 from "../../assets/PhumiYerng/2.jpg";
import phumiYerng3 from "../../assets/PhumiYerng/3.jpg";
import phumiYerng4 from "../../assets/PhumiYerng/4.jpg";
import phumiYerng5 from "../../assets/PhumiYerng/5.jpg";

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
  // Separate builds shown as their own apps on the project phone (HRM has one per institution)
  apps?: ProjectApp[];
  splash?: Splash;
  githubUrl?: string;
  demoUrl?: string;
}

export const projects: Project[] = [
  {
    id: "hrm",
    title: "HRM System",
    client: "MLMUPC & NIS",
    year: "2026",
    role: "Mobile & Web Developer",
    categories: ["client", "mobile", "web"],
    featured: true,
    summary: "Government HR platform for attendance, leave and officer records, on web and mobile.",
    description:
      "A human resource management platform for the Ministry of Land Management, Urban Planning and Construction (MLMUPC) and the National Institute of Statistics (NIS). Officers check in, request leave and missions, and manage their records from the mobile app, while administrators run the organization from the web app.",
    highlights: [
      "Built attendance tracking in the Flutter app, with daily, weekly, monthly and yearly reports",
      "Built mission and leave requests, plus organization admin screens with QR features",
      "Hosted the app as a Telegram Mini App with automatic sign-in",
      "Worked on the Angular web app: officer CVs and profiles, organization statistics, attendance timelines and settings",
      "Khmer and English interface throughout",
    ],
    stat: { value: "500+", label: "officers at NIS" },
    tech: ["Flutter", "Angular", "NestJS", "PostgreSQL", "Socket.IO"],
    images: [hrmMlmupc1, hrmMlmupc2, hrmMlmupc3, hrmMlmupc4, hrmMlmupc5, hrmNis1, hrmNis2],
    apps: [
      {
        id: "hrm-mlmupc",
        title: "HRM · MLMUPC",
        client: "MLMUPC",
        logo: hrmMlmupcLogo,
        splash: { bg: "#0C7EA5", logo: hrmMlmupcSplash },
        images: [hrmMlmupc1, hrmMlmupc2, hrmMlmupc3, hrmMlmupc4, hrmMlmupc5],
      },
      {
        id: "hrm-nis",
        title: "HRM · NIS",
        client: "NIS",
        logo: hrmNisLogo,
        splash: { bg: "#FFFFFF", logo: hrmNisSplash },
        images: [hrmNis1, hrmNis2],
        stat: { value: "500+", label: "officers at NIS" },
      },
    ],
  },
  {
    id: "face-scan",
    title: "Face Scan Connector",
    client: "HRM · MLMUPC & NIS",
    year: "2026",
    role: "Full-Stack Developer",
    categories: ["client", "hardware"],
    summary: "Pairs on-site face scanners with HRM so every scan becomes an attendance record.",
    description:
      "Connects Raspberry Pi face-scanner machines and Dahua face terminals to the HRM system. Each machine registers itself and shows a pairing QR code; administrators pair it and assign staff from the web app, and their faces are synced to the scanner automatically.",
    highlights: [
      "Python connector registers each Raspberry Pi and shows its pairing QR code in Chromium kiosk mode",
      "Admins create and pair machines from the Angular web app, then assign staff",
      "NestJS worker syncs staff face photos to the Dahua scanner and reports success or failure back to HRM",
      "Per-machine monitor page limited to its assigned users, with retry on temporary API failures",
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
      "Customer flows: product catalog, cart and checkout, trips and homestays",
      "Community pages with posts and a project tab, plus OTP sign-in",
      "Live notifications over WebSockets",
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
    highlights: [],
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
    highlights: [],
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
    highlights: [],
    tech: ["Unity", "C#"],
    splash: { bg: "#0b1530" },
    images: [frostGuard1, frostGuard2, frostGuard3, frostGuard4, frostGuard5],
    githubUrl: "https://github.com/Ra-Fat/Frost-Guard.git",
    demoUrl: "https://youtu.be/mIUvftuUees?si=5U4Ct_zm97CKRLN2",
  },
];
