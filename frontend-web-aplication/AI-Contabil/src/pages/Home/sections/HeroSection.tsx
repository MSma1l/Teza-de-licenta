const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] md:min-h-[60vh] flex items-center justify-center text-center overflow-hidden bg-gradient-to-br from-[#f5f5f0] via-[#e8e8e0] to-[#d8d8d0] bg-cover bg-center animate-fade-in">
      <div className="absolute inset-0 bg-white/30 z-[1]" />

      <div className="relative z-[2] max-w-[800px] px-8 py-12">
        <h1
          className="font-heading text-[3.5rem] md:text-[2rem] font-normal leading-[1.2] text-neutral-black"
          style={{ textShadow: '0 1px 4px rgba(255,255,255,0.5)' }}
        >
          Smart financial management solutions
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
