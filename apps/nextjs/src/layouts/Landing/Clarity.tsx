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
      image: "/sections/clarity/3.png",
      alt: "Medical documents icon",
    },
    {
      title: "Find the Right Care Near You",
      body: "Find nearby clinics and hospitals based on your needs, availability, and specialty",
      image: "/sections/clarity/2.png",
      alt: "Magnifying glass icon",
    },
  ];

  return (
    <section className="mt-[100px] flex flex-col gap-[1.4rem]">
      <h2 className="section-header w-max h-auto m-0 text-black tracking-[0px]">
        Clarity From Results to Care
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2.2rem]">
        {clarityItems.map((item, index) => (
          <div 
            key={index} 
            className="bg-white flex flex-col justify-between gap-[1.5rem] rounded-[24px] p-[1.5rem] border border-[#dedede] shadow-[0_4px_8px_0_rgba(0,0,0,0.04)] min-h-[400px] group"
          >
            <div className="flex flex-col gap-[0.75rem]">
              <h3 className="card-title m-0 text-black">{item.title}</h3>
              <p className="card-description m-0 text-[#8C8C8C]">{item.body}</p>
            </div>
            <div className="w-full min-h-[200px] flex items-center justify-center overflow-hidden">
              <Image
                src={item.image}
                alt={item.alt}
                width={228}
                height={228}
                quality={200}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
