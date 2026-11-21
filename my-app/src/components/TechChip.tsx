// A tech's name with its logo in front (the same icons Retro's Work uses), for the case study and the phone
// in every theme. Techs without a logo show the name alone.
import { TECH_ICONS } from "../themes/retro/retroWorkData";

export function TechLabel({ name }: { name: string }) {
  const Icon = TECH_ICONS[name];
  return (
    <>
      {Icon && <Icon className="tech-icon" aria-hidden="true" />}
      {name}
    </>
  );
}
