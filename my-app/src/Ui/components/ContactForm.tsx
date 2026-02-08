import { useState } from "react";

interface SocialMedia {
  name: string;
  url: string;
  image: string;
}

interface ContactFormProps {
  socialMedia: SocialMedia[];
}

function ContactForm({ socialMedia }: ContactFormProps) {
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

        <div className="flex justify-center gap-4 mt-6 lg:hidden">
          {socialMedia.map((sMedia, index) => (
            <a
              key={index}
              href={sMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
              title={sMedia.name}
            >
              <img
                src={sMedia.image}
                alt={sMedia.name}
                className="w-6 h-6 object-cover rounded-full"
              />
            </a>
          ))}
        </div>
      </form>
    </div>
  );
}

export default ContactForm;
