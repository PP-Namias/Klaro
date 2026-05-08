import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      <h2 className="section-header m-0 h-auto w-max tracking-[0px] text-black">
        Clarity From Results to Care
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column - Stacked Cards */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Connect to Real Doctors */}
          <div className="group flex flex-1 flex-row gap-8 rounded-[24px] border border-[#eeeeee] bg-white p-6 shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <div className="flex flex-1 flex-col">
              <h3 className="card-title mb-2 whitespace-nowrap text-zinc-900">
                {item1.title}
              </h3>
              <p className="card-description text-zinc-500">{item1.body}</p>
            </div>
            <div className="relative -left-10 flex w-48 shrink-0 items-center justify-center self-stretch md:w-64">
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
          <div className="group flex flex-1 flex-row gap-8 rounded-[24px] border border-[#eeeeee] bg-white p-6 shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <div className="flex flex-1 flex-col">
              <h3 className="card-title mb-2 whitespace-nowrap text-zinc-900">
                {item2.title}
              </h3>
              <p className="card-description text-zinc-500">{item2.body}</p>
            </div>
            <div className="relative -left-10 flex w-48 shrink-0 items-center justify-center self-stretch md:w-64">
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
        <div className="group flex min-h-[650px] flex-col justify-between rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
          <div className="flex flex-col">
            <h3 className="card-title mb-2 whitespace-nowrap text-zinc-900">
              {item3.title}
            </h3>
            <p className="card-description mb-4 text-zinc-500">{item3.body}</p>
          </div>
          <div className="relative w-full flex-1 overflow-hidden rounded-[16px]">
            <Image
              src={item3.image}
              alt={item3.alt}
              fill
              className="object-contain p-8 transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <Link
            href="/maps"
            className="feature-card-description mt-8 inline-flex items-center gap-2 font-medium text-black transition-all group-hover:translate-x-1"
          >
            Try it out{" "}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
