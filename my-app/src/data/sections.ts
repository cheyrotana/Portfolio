// The page's sections, in order, as the navbar lists them (the hero, "home", comes before these).
// Kept apart from Navbar.tsx so any component can import it without an import cycle.
export const NAV_SECTIONS = [
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;
