import Image from "next/image";

export function Clarity() {
  const clarityItems = [
    {
      title: "Connect to Real Doctors",
      body: "Consult licensed Filipino doctors via chat or video and get guidance based on your results",
      image: "/sections/clarity/1.png",
      alt: "Stethoscope icon",
    },
    {
      title: "Understand Your Results",
      body: "Upload your medical documents and get clear explanations with key insights",
      image: "/sections/clarity/2.png",
      alt: "Medical documents icon",
    },
    {
      title: "Find the Right Care Near You",
      body: "Find nearby clinics and hospitals based on your needs, availability, and specialty",
      image: "/sections/clarity/3.png",
      alt: "Magnifying glass icon",
    },
  ];

  const item1 = clarityItems[0]!;
  const item2 = clarityItems[1]!;
  const item3 = clarityItems[2]!;

  return (
    <section className="mt-[100px] flex flex-col gap-[2.5rem]">
      <h2 className="section-header w-max h-auto m-0 text-black tracking-[0px]">
        Clarity From Results to Care
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Stacked Cards */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Connect to Real Doctors */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-row gap-8 flex-1 group">
            <div className="flex flex-col flex-1">
              <h3 className="card-title text-zinc-900 mb-2 whitespace-nowrap">{item1.title}</h3>
              <p className="card-description text-zinc-500">
                {item1.body}
              </p>
            </div>
            <div className="w-48 md:w-64 self-stretch shrink-0 flex items-center justify-center relative -left-10">
               <Image
                src={item1.image}
                alt={item1.alt}
                width={200}
                height={200}
                quality={200}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Card 2: Understand Your Results */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-row gap-8 flex-1 group">
            <div className="flex flex-col flex-1">
              <h3 className="card-title text-zinc-900 mb-2 whitespace-nowrap">{item2.title}</h3>
              <p className="card-description text-zinc-500">
                {item2.body}
              </p>
            </div>
            <div className="w-48 md:w-64 self-stretch shrink-0 flex items-center justify-center relative -left-10">
               <Image
                src={item2.image}
                alt={item2.alt}
                width={200}
                height={200}
                quality={200}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Tall Card */}
        {/* Card 3: Find the Right Care Near You */}
        <div className="bg-white rounded-[24px] p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-col justify-between min-h-[650px] group">
          <div className="flex flex-col">
            <h3 className="card-title text-zinc-900 mb-2 whitespace-nowrap">{item3.title}</h3>
            <p className="card-description text-zinc-500 mb-4">
              {item3.body}
            </p>
          </div>
          <div className="bg-[#F7F7F7] rounded-[16px] flex-1 w-full">
            {/* Placeholder Empty */}
          </div>
        </div>
      </div>
    </section>
  );
}
