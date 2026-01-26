import Profile from "./assets/Profile.png";
import { useState } from "react";

function App() {
  const name = "Chey Rotana";
  const skills = [
    { name: "Flutter", image: Profile },
    { name: "Dart", image: Profile },
    { name: "React", image: Profile },
    { name: "TypeScript", image: Profile },
  ];
  return (
    <>
      <header className="flex flex-row items-center justify-between bg-green-500 text-white p-12 gap-8">
        <div className="flex-4 pl-24">
          <h1 className="text-5xl font-bold mb-4">
            Hello, I'm <b>{name}</b>
          </h1>
          <p className="text-xl">Welcome to my portfolio</p>
        </div>
        <div className="flex-1 pr-24">
          <img
            src={Profile}
            alt="Profile"
            className="rounded-full w-64px h-64px object-cover"
          />
        </div>
      </header>

      <section className="text-center bg-red-500 text-white">
        <header className="text-3xl pt-5">
          <h1>Skills</h1>
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
                className="w-16 h-16 object-cover rounded-xl"
              />
              <p>{skill.name}</p>
            </div>
          ))}
        </section>
      </section>

      <footer>
          <ContactForm/>
      </footer>
    </>
  );
}

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
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 bg-yellow-500">
      {error && <div className="text-red-500">{error}</div>}
      <p>Name</p>
      <input
        type="text"
        name="name"
        placeholder="Your name"
        value={formData.name}
        onChange={handleChange}
        className="outline-solid outline-2 w-100 p-3"
      />

      <p>Email</p>
      <input
        type="email"
        name="email"
        placeholder="Your email"
        value={formData.email}
        onChange={handleChange}
        className="outline-solid outline-2 w-100 p-3"
      />
      
      <p>Message</p>
      <textarea
        name="message"
        placeholder="Your message"
        value={formData.message}
        onChange={handleChange}
        className="outline-solid outline-2 w-100"
      />

      <button type="submit" className="bg-blue-500 p-4 w-100 m-4">Send</button>
    </form>
  );
}

// export default ContactForm;
export default App;
