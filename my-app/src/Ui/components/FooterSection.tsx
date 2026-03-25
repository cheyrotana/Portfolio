import ContactForm from "./ContactForm";

interface SocialMedia {
  name: string;
  url: string;
  image: string;
}

interface FooterSectionProps {
  socialMedia: SocialMedia[];
}

function FooterSection({ socialMedia }: FooterSectionProps) {
  return (
    <footer id="contact" className="bg-stone-900">
      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-8 py-12 sm:py-16 lg:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-3 lg:mb-5">
          Get In Touch
        </h2>
        <p className="text-stone-400 text-center text-sm sm:text-base lg:text-lg mb-8 sm:mb-10">
          Have a project in mind or just want to say hi? Feel free to reach out.
        </p>

        <ContactForm socialMedia={socialMedia} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6">
        <p className="text-stone-500 text-sm text-center">
          &copy; {new Date().getFullYear()} Chey Rotana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default FooterSection;
