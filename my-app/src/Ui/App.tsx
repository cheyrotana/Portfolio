import { useEffect, useState } from "react";
import "../index.css";
import { useScroll, useMotionValueEvent } from "framer-motion";
import Profile from "../assets/Profile.png";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import TechStackSection from "./components/TechStackSection";
import ProjectsSection from "./components/ProjectsSection";
import FooterSection from "./components/FooterSection";

function App() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous !== undefined && latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "projects", "contact"];
      const scrollY = window.scrollY + 100; // offset for navbar height
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const name = "Chey Rotana";
  const skills = [
    { name: "Flutter", image: Profile },
    { name: "Dart", image: Profile },
    { name: "React", image: Profile },
    { name: "TypeScript", image: Profile },
  ];

  const socialMedia = [
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/your-profile",
      image: Profile,
    },
    { name: "GitHub", url: "https://github.com/your-username", image: Profile },
    {
      name: "Facebook",
      url: "https://facebook.com/your-profile",
      image: Profile,
    },
  ];

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <HeroSection name={name} activeSection={activeSection} hidden={hidden} />
      <AboutSection greeting={greeting} name={name} socialMedia={socialMedia} />
      <TechStackSection skills={skills} />
      <ProjectsSection />
      <FooterSection socialMedia={socialMedia} />
    </>
  );
}

export default App;
