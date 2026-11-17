// Small window events so any part of the page (command palette, terminal, Journey route…)
// can ask another section to do something without wiring props through the whole tree.

export const SHOW_PROJECT_EVENT = "portfolio:show-project"; // scroll to a project's card and highlight it
export const OPEN_PROJECT_EVENT = "portfolio:open-project"; // open a project's case study
export const SPIN_EVENT = "portfolio:spin"; // pull the slot machine's lever
export const SET_VEHICLE_EVENT = "portfolio:set-vehicle"; // switch the Journey vehicle
export const OPEN_TERMINAL_EVENT = "portfolio:open-terminal"; // open the terminal window

const emit = (name: string, detail?: string) => window.dispatchEvent(new CustomEvent(name, { detail }));

export const showProject = (projectId: string) => emit(SHOW_PROJECT_EVENT, projectId);
export const openProject = (projectId: string) => emit(OPEN_PROJECT_EVENT, projectId);
export const spinSlotMachine = () => emit(SPIN_EVENT);
export const openTerminalWindow = () => emit(OPEN_TERMINAL_EVENT);
export const setJourneyVehicle = (vehicle: "plane" | "car") => emit(SET_VEHICLE_EVENT, vehicle);

/** Smoothly scroll to a section by id. */
export function goTo(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
