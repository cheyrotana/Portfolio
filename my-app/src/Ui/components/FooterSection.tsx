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
    <footer
      id="contact"
      className="flex flex-col lg:flex-row min-h-screen lg:min-h-[600px]"
    >
      <div className="flex-1 flex flex-col justify-center bg-gradient-to-br from-green-400 to-green-600 gap-4 sm:gap-6 p-6 sm:p-8 md:p-12 hidden lg:flex">
        <h3 className="text-white text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4">
          Connect With Me
        </h3>
        <div className="flex flex-col gap-3 sm:gap-4 max-w-md mx-auto w-full">
          {socialMedia.map((sMedia, index) => (
            <a
              key={index}
              href={sMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            >
              <img
                src={sMedia.image}
                alt={sMedia.name}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-md border-2 border-white/30 group-hover:border-white transition-colors"
              />
              <span className="text-white text-sm sm:text-base font-medium group-hover:text-yellow-200 transition-colors">
                {sMedia.name}
              </span>
            </a>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-yellow-500 flex items-center justify-center">
        <ContactForm socialMedia={socialMedia} />
      </div>
    </footer>
  );
}

export default FooterSection;
