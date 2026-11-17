import { motion, type MotionValue } from "framer-motion";

// Vehicle drawings for the Journey section, both facing right.
// The car is drawn with the point where its wheels touch the road at (0, 0) so it sits on the route;
// the paper plane is centred on (0, 0).

function Wheel({ cx, cy, r, spin }: { cx: number; cy: number; r: number; spin?: MotionValue<number> }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g style={spin ? { rotate: spin } : undefined}>
        <circle className="veh-dark" r={r} />
        <circle className="veh-light" r={r * 0.4} />
        <line className="veh-spoke" x1={-r * 0.75} y1={0} x2={r * 0.75} y2={0} />
        <line className="veh-spoke" x1={0} y1={-r * 0.75} x2={0} y2={r * 0.75} />
      </motion.g>
    </g>
  );
}

export function PaperPlaneSprite() {
  return (
    <svg viewBox="-42 -30 84 60" className="w-16 h-12 sm:w-20 sm:h-[60px] overflow-visible" aria-hidden="true">
      {/* top sheet, the fold underneath, and the crease */}
      <path className="paper-top" d="M -34 -22 L 40 0 L -34 22 L -18 0 Z" />
      <path className="paper-fold" d="M -18 0 L 40 0 L -28 12 Z" />
      <path className="paper-crease" d="M -18 0 L 40 0" />
    </svg>
  );
}

export function CarSprite({ spin }: { spin?: MotionValue<number> }) {
  return (
    <svg viewBox="-46 -60 92 120" className="w-[72px] h-[94px] sm:w-[84px] sm:h-[110px] overflow-visible" aria-hidden="true">
      <path
        className="veh-main veh-outline"
        d="M -38 -12 L -38 -20 C -38 -24 -35 -26 -31 -26 L -19 -26 L -9 -39 C -7 -41 -5 -42 -2 -42 L 14 -42 C 18 -42 20 -41 22 -38 L 30 -27 L 36 -26 C 40 -25 42 -22 42 -18 L 42 -12 C 42 -10 40 -9 38 -9 L -35 -9 C -37 -9 -38 -10 -38 -12 Z"
      />
      <path className="veh-light veh-outline" d="M -14 -27 L -6 -38 L 4 -38 L 4 -27 Z" />
      <path className="veh-light veh-outline" d="M 8 -27 L 8 -38 L 15 -38 C 17 -38 18 -37 19 -36 L 25 -27 Z" />
      <rect className="veh-light" x="37" y="-22" width="4" height="4" rx="1" />
      <rect className="veh-dark" x="-38" y="-20" width="3" height="5" rx="1" />
      <Wheel cx={-22} cy={-8} r={8} spin={spin} />
      <Wheel cx={24} cy={-8} r={8} spin={spin} />
    </svg>
  );
}
