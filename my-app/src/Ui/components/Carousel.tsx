import { useEffect, useState } from "react";
import Profile from "../../assets/Profile.png";

const images = [Profile, Profile, Profile];

function Carousel() {
  const [active, setActive] = useState(0);
  const [paused, setpaused] = useState(false);
  const intervalDuration = 1000;

  const next = () => setActive((prev) => (prev + 1) % images.length);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, intervalDuration);
    return () => clearInterval(interval);
  }, [paused, intervalDuration]);

  const getPosition = (index: number) => {
    if (index === active) return "center";
    if (index === (active - 1 + images.length) % images.length) return "left";
    if (index === (active + 1) % images.length) return "right";
    return "hidden";
  };

  return (
    <div
      className="relative w-full h-[480px] lg:h-[580px] xl:h-[650px] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setpaused(true)}
      onMouseLeave={() => setpaused(false)}
    >
      {images.map((img, index) => {
        const position = getPosition(index);

        return (
          <img
            key={index}
            src={img}
            className={`
              absolute transition-all duration-800 ease-out w-[300px] h-[400px] lg:w-[360px] lg:h-[480px] xl:w-[400px] xl:h-[530px] object-cover rounded-xl
              ${position === "center" && "scale-100 z-20 opacity-100"}
              ${position === "left" && "-translate-x-25 scale-75 opacity-50 z-10 -rotate-10"}
              ${position === "right" && "translate-x-25 scale-75 opacity-50 z-10 rotate-10"}
              ${position === "hidden" && "opacity-0 scale-50"}
            `}
          />
        );
      })}
    </div>
  );
}

export default Carousel;
