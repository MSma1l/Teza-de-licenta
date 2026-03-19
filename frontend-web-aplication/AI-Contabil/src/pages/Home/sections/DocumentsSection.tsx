const documentsData = [
  {
    name: 'DocumentName',
    items: ['the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.'],
  },
  {
    name: 'DocumentName',
    items: ['the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.'],
  },
  {
    name: 'DocumentName',
    items: ['the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.', 'the necessary information.'],
  },
];

const DocumentsSection = () => {
  return (
    <section className="px-8 py-12 text-center border-t border-neutral-200">
      <p className="text-sm text-accent font-medium mb-2">Document</p>

      <h2 className="font-heading text-[2rem] font-semibold text-neutral-black mb-4">
        The most often generated documents
      </h2>

      <p className="text-sm text-neutral-500 mb-6 max-w-[500px] mx-auto">
        The following are the most often generated documents and the necessary information.
      </p>

      <button className="px-6 py-3 bg-accent-bg text-neutral-black rounded-full text-sm font-semibold mb-8 transition-all duration-200 hover:bg-accent hover:text-white">
        Create document
      </button>

      <div className="grid grid-cols-3 max-md:grid-cols-1 border border-neutral-200 rounded-lg overflow-hidden text-left max-w-[900px] mx-auto">
        {documentsData.map((doc, index) => (
          <div key={index} className="border-r border-neutral-200 last:border-r-0 max-md:border-r-0 max-md:border-b max-md:border-neutral-200">
            <div className="p-6 font-bold text-sm border-b border-neutral-200">{doc.name}</div>
            {doc.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 last:border-b-0 text-xs text-neutral-500">
                <span className="text-neutral-black text-sm">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentsSection;
