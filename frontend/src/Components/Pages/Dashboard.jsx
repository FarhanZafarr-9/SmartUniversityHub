import icons from '../../assets/icons';
import TypeCard from '../typeCard';

const cardData = [
  {
    size: "20 GB",
    icon: icons.IoImages,
    number: 200,
    title: "Images",
    lastUpdate: "10:15am, 10 Oct"
  },
  {
    size: "12 MB",
    icon: icons.GrDocumentPdf,
    number: "3",
    title: "Documents",
    lastUpdate: "02:35am, 10 Aug"
  },
  {
    size: "27 MB",
    icon: icons.AiFillAudio,
    number: "13",
    title: "Audio",
    lastUpdate: "11:15 pm, 1 Oct"
  },
  {
    size: "1.98 GB",
    icon: icons.MdVideoLibrary,
    number: "270",
    title: "Videos",
    lastUpdate: "12:25 am, 12 Oct"
  }
];

export default function Dashboard() {

  return (
    <>
      <div id='left' className='flex relative flex-col overflow-hidden shadow-lg w-3/5 m-4 bg-dark-dark-card h-[96%] rounded-xl'>

        <div className='w-[10dvw] h-[10dvw] bg-slate-500 rounded-full flex absolute top-[-100px] left-[-100px] blur-lg '></div>

        <div className='heading flex justify-between w-full bg-slate-600 bg-opacity-40 backdrop-blur-lg items-center p-4 border-b-[0.75px]
        border-[#555555]'>

          <h1 className='text-white text-2xl font-semibold'>Dashboard</h1>

          <div className='flex items-center space-x-4'>

            <button className='text-white bg-dark-dark-card rounded-lg p-2 pl-4 pr-4
            border-transparent border-[0.75px] hover:border-[#555555] mr-2 font-semibold
            hover:text-dark-accent-light transition-colors duration-300 ease-in-out'>View All</button>

            <button className='text-white bg-dark-dark-card rounded-lg p-2 pl-4 pr-4
            border-transparent border-[0.75px] hover:border-[#555555] mr-2 font-semibold
            hover:text-dark-accent-light transition-colors duration-300 ease-in-out'>Add New</button>

          </div>

        </div>

        <div className='w-[10dvw] h-[10dvw] bg-slate-950 rounded-full flex absolute right-0 z-[0] blur-md '></div>

        <div className='p-4'>
          {cardData.map((card, index) => (
            <TypeCard
              key={index}
              size={card.size}
              icon={card.icon}
              number={card.number}
              title={card.title}
              lastUpdate={card.lastUpdate}
            />
          ))}
        </div>
      </div>
      <div id='right' className="flex flex-col shadow-lg w-2/5 mr-4 h-[96%] rounded-xl bg-dark-dark-card max-w-full">
        right
      </div>
    </>
  );
}
