import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const stagesData = [
  { number: '01', text: 'Selecti the type of document', imageLabel: 'Selectare tip document', imageColor: '#d4e6f1' },
  { number: '02', text: 'Entering the necessary data and scan the document with the mobile application', imageLabel: 'Introducere date & scanare', imageColor: '#d5f5e3' },
  { number: '03', text: 'Confirmation and validation of data with the Moobile application', imageLabel: 'Confirmare & validare date', imageColor: '#fdebd0' },
  { number: '04', text: 'The generation of the act and the programming at the office for signature', imageLabel: 'Generare act & programare', imageColor: '#e8daef' },
  { number: '05', text: 'The request sent successfully', imageLabel: 'Cerere trimisă cu succes', imageColor: '#d4efdf' },
];

const StagesSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  return (
    <section className="px-8 py-12 grid grid-cols-2 max-md:grid-cols-1 gap-16 items-center">
      <div className="flex flex-col">
        <h2 className="font-heading text-[2rem] font-semibold italic text-neutral-black mb-8 leading-[1.3]">
          Stages of creating a document
        </h2>

        <div className="flex flex-col gap-2">
          {stagesData.map((stage, index) => (
            <div
              key={stage.number}
              className={`flex items-start gap-4 p-4 rounded-md cursor-pointer transition-all duration-300 border-l-[3px] ${
                activeStep === index
                  ? 'bg-accent-bg border-l-accent'
                  : 'border-transparent hover:bg-neutral-100'
              }`}
              onClick={() => setActiveStep(index)}
            >
              <span className={`text-lg font-bold min-w-[30px] transition-colors duration-200 ${
                activeStep === index ? 'text-primary' : 'text-accent'
              }`}>
                {stage.number}
              </span>
              <span className={`text-sm leading-relaxed transition-all duration-200 ${
                activeStep === index ? 'text-neutral-black font-medium' : 'text-neutral-600'
              }`}>
                {stage.text}
              </span>
            </div>
          ))}
        </div>

        <button
          className="mt-8 px-6 py-4 bg-accent-bg text-neutral-black rounded-full text-sm font-semibold self-start border-2 border-accent transition-all duration-200 hover:bg-accent hover:text-white hover:-translate-y-0.5 cursor-pointer"
          onClick={() => navigate('/documents')}
        >
          Create document
        </button>
      </div>

      <div className="w-full h-[400px] max-md:h-[300px] bg-neutral-100 rounded-xl flex items-center justify-center border-2 border-neutral-200 animate-stage-fade" key={activeStep}>
        <div
          className="w-[70%] h-[75%] rounded-xl border-2 border-neutral-200 flex flex-col items-center justify-center gap-4 transition-colors duration-300"
          style={{ backgroundColor: stagesData[activeStep].imageColor }}
        >
          <span className="text-sm text-neutral-500 font-medium text-center px-4">
            {stagesData[activeStep].imageLabel}
          </span>
          <span className="font-heading text-[2.5rem] font-bold text-black/10">
            {stagesData[activeStep].number}
          </span>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
