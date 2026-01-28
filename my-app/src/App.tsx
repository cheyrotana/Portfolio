import Profile from "./assets/Profile.png";
import { useEffect, useState } from "react";
import "./index.css";
import { animate, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
// import { useInView } from "react-intersection-observer";

function App() {
  const name = "CHEY ROTANA";
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
      <motion.section
        className="flex flex-col min-h-screen bg-green-500 text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ amount: 0.3 }}
      >
        <motion.header 
          className="fixed top-5 z-10 shadow-lg pr-6 pt-4 pb-4 flex justify-center items-center rounded-full bg-white max-w-4xl mx-auto left-1/2 transform -translate-x-1/2"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <nav className="flex gap-6 ml-8">
            <a
              href="#home"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              About
            </a>
            <a
              href="#projects"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="text-gray-700 hover:text-green-500 transition-colors"
            >
              Contact
            </a>
          </nav>            
        </motion.header>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -100 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: "easeOut" },
              },
            }}
          >
            <h1 className="text-8xl font-bold mb-4 text-center uppercase">
              <b>{greeting}</b>
            </h1>

            <motion.p
              className="text-xl text-center"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { delay: 0.5, duration: 0.7, ease: "easeOut" },
                },
              }}
            >
              Welcome to my portfolio
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          className="flex items-center justify-center pb-8 text-white rounded-full"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { delay: 0.5, ease: "easeInOut" },
            },
          }}
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ArrowDown size={32} />
        </motion.div>
      </motion.section>

      <section className="text-center bg-red-500 text-white">
        <header className="text-3xl pt-5">
          <h1>Tech Stacks</h1>
        </header>
        <section className="grid grid-cols-4 gap-8 pl-12 pb-12 pt-10">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center gap-2"
            >
              <img
                src={skill.image}
                alt="technology"
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded-xl"
              />
              <p>{skill.name}</p>
            </div>
          ))}
        </section>
      </section>
      <section className="bg-pink-500 text-center">
        <header className="text-3xl pt-5 text-white">
          <h1>Projects</h1>
        </header>

        <div className="flex flex-col gap-10 p-12">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Project 1</h2>
            <div className="flex flex-row">
              <div className="flex justify-start bg-blue-500">
                <img
                  src={Profile}
                  alt="Project"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-cover"
                />
              </div>
              <div className="ml-24 bg-red-500">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Project 2</h2>
            <div className="flex flex-row">
              <div className="mr-24 bg-red-500">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
              <div className=" justify-end bg-green-500">
                <img
                  src={Profile}
                  alt="Project"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Project 3</h2>
            <div className="flex flex-row">
              <div className="flex justify-start bg-blue-500">
                <img
                  src={Profile}
                  alt="Project"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-cover"
                />
              </div>
              <div className="ml-24 bg-red-500">
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="flex flex-row  ">
        <div className="flex-1 flex flex-col justify-center bg-gradient-to-br from-green-400 to-green-600 gap-6 p-8">
          <h3 className="text-white text-xl font-bold text-center mb-4">
            Connect With Me
          </h3>
          <div className="flex flex-col gap-4">
            {socialMedia.map((sMedia, index) => (
              <a
                key={index}
                href={sMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                <img
                  src={sMedia.image}
                  alt={sMedia.name}
                  className="w-10 h-10 object-cover rounded-md border-2 border-white/30 group-hover:border-white transition-colors"
                />
                <span className="text-white font-medium group-hover:text-yellow-200 transition-colors">
                  {sMedia.name}
                </span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-yellow-500 items-center justify-center">
          <ContactForm />
        </div>
      </footer>
    </>
  );
  // Close AboutMe component
}

// return <AboutMe name={name} />;

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [error, setError] = useState("");

  interface ChangeEventType extends React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement
  > {}

  const handleChange = (e: ChangeEventType) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return;
    }

    setError("");
    console.log("Form submitted:", formData);

    // Reset form
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 ">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-6 bg-yellow-500 p-8 rounded-2xl "
      >
        <h3 className="text-white text-2xl font-bold text-center mb-2">
          Get In Touch
        </h3>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-white px-4 py-2 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Message</label>
            <textarea
              name="message"
              placeholder="Tell me about your project..."
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-white text-yellow-600 font-bold py-3 px-6 rounded-lg hover:bg-yellow-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

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
      className="relative w-full h-[300px] flex items-center justify-center overflow-hidden"
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
              absolute transition-all duration-800 ease-out w-[200px] h-[250px] object-cover 
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

// export default ContactForm;
export default App;
