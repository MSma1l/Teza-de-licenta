const NewsSection = () => {
  return (
    <section className="px-8 py-12">
      <h2 className="font-heading text-[2rem] font-semibold text-center mb-8">News</h2>

      <div className="grid grid-cols-[280px_1fr] max-md:grid-cols-1 gap-8 max-w-[800px] mx-auto">
        <div className="w-[280px] max-md:w-full h-[280px] max-md:h-[200px] rounded-xl bg-gradient-to-b from-[#d4c4a8] to-[#8a7a5a] flex items-center justify-center overflow-hidden text-neutral-400">
          Imagine știre
        </div>

        <div className="flex flex-col justify-between">
          <p className="text-base text-neutral-black font-semibold leading-relaxed break-all">
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNewsNewsNewsNewsNewsNewsNewsNewsNewsNews
            NewsNews
          </p>

          <div className="mt-4">
            <p className="text-sm font-semibold text-neutral-black">Author</p>
            <p className="text-xs text-neutral-400">Data</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
