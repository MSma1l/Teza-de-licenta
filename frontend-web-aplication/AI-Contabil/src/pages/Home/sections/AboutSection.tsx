import GavelIcon from '@mui/icons-material/Gavel';
import BalanceIcon from '@mui/icons-material/Balance';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const lawsData = [
  {
    icon: <GavelIcon />,
    title: 'Laws 12.1',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <BalanceIcon />,
    title: 'Laws 12.2',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <GroupsIcon />,
    title: 'Laws 12.3',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Laws 12/2',
    text: 'texttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttexttext',
  },
];

const AboutSection = () => {
  return (
    <section className="px-8 py-12">
      <h2 className="font-heading text-[2rem] font-semibold text-neutral-black mb-4">About Project</h2>
      <p className="text-base text-neutral-500 mb-4 max-w-[600px]">About Project Text</p>
      <p className="text-base text-neutral-black font-medium mb-6">The main laws in the field</p>

      <div className="w-full h-px bg-neutral-200 my-4" />

      <div className="flex gap-6 mb-12 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {lawsData.map((law, index) => (
          <div
            key={index}
            className="flex-[0_0_46%] max-md:flex-[0_0_85%] snap-start flex flex-col gap-3 px-6 py-4 bg-neutral-100 rounded-xl transition-all duration-200 cursor-grab hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-neutral-black text-2xl mb-1 [&_svg]:text-[2rem]">{law.icon}</div>
            <h3 className="text-lg font-bold text-neutral-black underline">{law.title}</h3>
            <p className="text-base text-neutral-500 leading-relaxed">{law.text}</p>
          </div>
        ))}
      </div>

      <div className="w-full h-[350px] rounded-xl bg-gradient-to-br from-[#1a4a8a] via-[#2a6ab0] to-[#8a6a2a] mb-8 flex items-center justify-center text-white text-lg overflow-hidden">
        Imagine - Ciocan judecătoresc
      </div>
    </section>
  );
};

export default AboutSection;
