import Image from "next/image";

export function MoreThanScanning() {
  return (
    <section className="bg-[#fafafa] py-24 -mx-4 px-4 md:-mx-16 md:px-16 rounded-[40px]">
      <div className="w-full">
        <h2 className="section-header text-center mb-[2.5rem] text-zinc-900">More than just Scanning</h2>
        
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
          {/* Arrow from card 1 to card 2 */}
          <div className="hidden md:block absolute top-[20%] left-[62%] z-20 w-[220px] h-[150px]">
            <Image src="/sections/scanning/arrow-1.png" alt="" fill className="object-contain" quality={100} />
          </div>

          {/* Arrow from card 2 to card 3 */}
          <div className="hidden md:block absolute top-[86%] left-[64%] z-20 w-[160px] h-[100px]">
            <Image src="/sections/scanning/arrow-2.png" alt="" fill className="object-contain" quality={100} />
          </div>

          {/* Left Card */}
          <div className="bg-white rounded-[24px] pt-[1rem] px-[1.5rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-col min-h-[650px]">
            <h3 className="feature-card-title text-zinc-900 mb-2">PhilHealth Integration</h3>
            <p className="feature-card-description text-zinc-500 mb-8 max-w-[90%]">
              Easily filter for PhilHealth-accredited clinics and hospitals. Get benefits and save on medical costs.
            </p>
            <div className="relative rounded-[16px] flex-1 w-full flex items-center justify-center overflow-hidden pb-12">
              <div className="relative w-[80%] h-[80%]">
                <Image
                  src="/sections/scanning/1.png"
                  alt="PhilHealth Integration"
                  fill
                  className="object-contain"
                  quality={100}
                />
              </div>
            </div>
          </div>

          {/* Right Cards */}
          <div className="flex flex-col gap-6">
            {/* Top Right Card */}
            <div className="bg-white rounded-[24px] pt-[1rem] px-[1.5rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-row gap-6 flex-1">
              <div className="flex flex-col flex-1 py-2">
                <h3 className="feature-card-title text-zinc-900 mb-2">Local Payments</h3>
                <p className="feature-card-description text-zinc-500 max-w-[280px]">
                  Pay for consultations and tests directly using GCash or Maya.
                </p>
              </div>
              <div className="relative rounded-[16px] w-48 md:w-64 self-stretch shrink-0 min-h-[180px] overflow-hidden">
                <Image
                  src="/sections/scanning/2.png"
                  alt="Local Payments"
                  fill
                  className="object-contain object-center"
                  quality={100}
                />
              </div>
            </div>

            {/* Bottom Right Card */}
            <div className="bg-white rounded-[24px] pt-[1rem] px-[1.5rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] border border-[#eeeeee] flex flex-row gap-6 flex-1">
              <div className="flex flex-col flex-1 py-2">
                <h3 className="feature-card-title text-zinc-900 mb-2">Secure Medical <br /> History</h3>
                <p className="feature-card-description text-zinc-500 max-w-[280px]">
                  One encrypted vault for all your labs, prescriptions, and discharge summaries.
                </p>
              </div>
              <div className="relative rounded-[16px] w-56 md:w-72 self-stretch shrink-0 min-h-[180px] overflow-hidden">
                <Image
                  src="/sections/scanning/3.png"
                  alt="Secure Medical History"
                  fill
                  className="object-contain object-center"
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Quote Section */}
        <div className="mt-28 flex flex-col items-center justify-center">
          <h3 className="quote-text text-zinc-900 text-center mb-10 w-full max-w-[90%] md:max-w-none">
            “Health is complex. <span className="relative inline-block z-10 leading-[1]">Understanding<Image src="/understanding-underline.png" alt="" width={200} height={30} className="absolute top-[30%] left-[-1%] w-[102%] max-w-none pointer-events-none -z-10" /></span> it shouldn't be.”
          </h3>
          <div className="flex items-center gap-7">
            <div className="w-[7rem] h-[7rem] md:w-[8rem] md:h-[8rem] rounded-[2rem] overflow-hidden border border-[#eaeaea] flex items-center justify-center bg-white relative">
              <Image src="/clara.png" quality={100} alt="Clara" fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <p className="avatar-name text-zinc-900">Clara</p>
              <p className="avatar-role text-zinc-400">Klaro's AI doctor</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
