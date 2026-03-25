import { useState } from "react";
import emailjs from "@emailjs/browser";

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
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return;
    }

    setError("");
    setSending(true);

    try {
      await emailjs.send(
        "service_n31f1lt",
        "template_jh510rc",
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        "zuC8j77Q0CqjMRaNQ"
      );
      setSent(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 4000);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 lg:gap-6">
      {error && (
        <div className="bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-stone-300 text-sm lg:text-base font-medium mb-2">
          Name
        </label>
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300 text-sm lg:text-base"
        />
      </div>

      <div>
        <label className="block text-stone-300 text-sm lg:text-base font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300 text-sm lg:text-base"
        />
      </div>

      <div>
        <label className="block text-stone-300 text-sm lg:text-base font-medium mb-2">
          Message
        </label>
        <textarea
          name="message"
          placeholder="Tell me about your project..."
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300 resize-none text-sm lg:text-base"
        />
      </div>

      {sent && (
        <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-4 py-2 rounded-lg text-center text-sm">
          Message sent! I'll get back to you soon.
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-emerald-600 text-white font-bold py-2.5 px-5 lg:py-3 text-sm lg:text-base rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>

      {/* Social icons */}
      <div className="flex justify-center gap-4 lg:gap-5 mt-4">
        {socialMedia.map((sMedia, index) => (
          <a
            key={index}
            href={sMedia.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 lg:w-13 lg:h-13 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title={sMedia.name}
          >
            <img
              src={sMedia.image}
              alt={sMedia.name}
              className="w-5 h-5 lg:w-6 lg:h-6 object-contain"
            />
          </a>
        ))}
      </div>
    </form>
  );
}

export default ContactForm;
