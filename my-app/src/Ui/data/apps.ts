import { projects, type Project, type Splash } from "./projects";

// The apps on the phone: one per project, except projects with separate builds, which get an app each.
export interface PhoneApp {
  id: string;
  title: string;
  client: string;
  logo?: string;
  images: string[];
  stat?: Project["stat"];
  splash?: Splash;
  project: Project;
}

export const APPS = projects.flatMap<PhoneApp>((p) =>
  p.apps
    ? p.apps.map((a) => ({ ...a, project: p }))
    : [{ id: p.id, title: p.title, client: p.client, logo: p.logo, images: p.images, stat: p.stat, splash: p.splash, project: p }],
);

/** The app to launch for a project (its first build). */
export const appOf = (projectId: string) => APPS.find((a) => a.project.id === projectId)?.id ?? projectId;
