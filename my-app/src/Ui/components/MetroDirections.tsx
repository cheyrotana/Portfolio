import { ArrowLeft, ArrowRight } from "lucide-react";
import { RIDE_STOPS } from "../metroRide";

/**
 * Metro theme: the platform direction boards beside a section's station sign — where the line came
 * from and where it goes next, like the arrows on a real platform. Renders only in Metro.
 */
export function MetroDirections({ stop }: { stop: number }) {
  const prev = RIDE_STOPS[stop - 1];
  const next = RIDE_STOPS[stop + 1];
  return (
    <span className="only-metro">
      <span className="metro-dirs">
        {prev && (
          <a href={`#${prev.id}`} data-jump className="metro-dir" aria-label={`Previous station: ${prev.label}`}>
            <ArrowLeft size={14} aria-hidden="true" />
            {prev.label}
          </a>
        )}
        {next ? (
          <a href={`#${next.id}`} data-jump className="metro-dir is-next" aria-label={`Next station: ${next.label}`}>
            {next.label}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        ) : (
          <span className="metro-dir is-end">End of the line</span>
        )}
      </span>
    </span>
  );
}
