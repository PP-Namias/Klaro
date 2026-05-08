import Image from "next/image";

export function MoreThanScanning() {
  return (
    <section className="-mx-4 rounded-[40px] bg-[#fafafa] px-4 py-24 md:-mx-16 md:px-16">
      <div className="w-full">
        <h2 className="section-header mb-[2.5rem] text-center text-zinc-900">
          More than just Scanning
        </h2>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr]">
          {/* Arrow from card 1 to card 2 */}
          <div className="absolute top-[20%] left-[62%] z-20 hidden h-[150px] w-[220px] md:block">
            <Image
              src="/sections/scanning/arrow-1.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          {/* Arrow from card 2 to card 3 */}
          <div className="absolute top-[86%] left-[64%] z-20 hidden h-[100px] w-[160px] md:block">
            <Image
              src="/sections/scanning/arrow-2.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          {/* Left Card */}
          <div className="flex min-h-[650px] flex-col rounded-[24px] border border-[#eeeeee] bg-white px-[1.5rem] pt-[1rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <h3 className="feature-card-title mb-2 text-zinc-900">
              PhilHealth Integration
            </h3>
            <p className="feature-card-description mb-8 max-w-[90%] text-zinc-500">
              Easily filter for PhilHealth-accredited clinics and hospitals. Get
              benefits and save on medical costs.
            </p>
            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-[16px] pb-12">
              <div className="relative h-[80%] w-[80%]">
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
            <div className="flex flex-1 flex-row gap-6 rounded-[24px] border border-[#eeeeee] bg-white px-[1.5rem] pt-[1rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
              <div className="flex flex-1 flex-col py-2">
                <h3 className="feature-card-title mb-2 text-zinc-900">
                  Doctor Booking
                </h3>
                <p className="feature-card-description max-w-[280px] text-zinc-500">
                  Book virtual or in-person consultations with trusted
                  specialists directly within the app.
                </p>
              </div>
              <div className="relative min-h-[180px] w-48 shrink-0 self-stretch overflow-hidden rounded-[16px] md:w-64">
                <Image
                  src="/sections/scanning/2.png"
                  alt="Doctor Booking"
                  fill
                  className="object-contain object-center"
                  quality={100}
                />
              </div>
            </div>

            {/* Bottom Right Card */}
            <div className="flex flex-1 flex-row gap-6 rounded-[24px] border border-[#eeeeee] bg-white px-[1.5rem] pt-[1rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
              <div className="flex flex-1 flex-col py-2">
                <h3 className="feature-card-title mb-2 text-zinc-900">
                  Secure Medical <br /> History
                </h3>
                <p className="feature-card-description max-w-[280px] text-zinc-500">
                  One encrypted vault for all your labs, prescriptions, and
                  discharge summaries.
                </p>
              </div>
              <div className="relative min-h-[180px] w-56 shrink-0 self-stretch overflow-hidden rounded-[16px] md:w-72">
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
          <h3 className="quote-text mb-10 w-full max-w-[90%] text-center text-zinc-900 md:max-w-none">
            “Health is complex.{" "}
            <span className="relative z-10 inline-block leading-[1]">
              Understanding
              <Image
                src="/understanding-underline.png"
                alt=""
                width={200}
                height={30}
                className="pointer-events-none absolute top-[30%] left-[-1%] -z-10 w-[102%] max-w-none"
              />
            </span>{" "}
            it shouldn't be.”
          </h3>
          <div className="flex items-center gap-7">
            <div className="relative flex h-[7rem] w-[7rem] items-center justify-center overflow-hidden rounded-[2rem] border border-[#eaeaea] bg-white md:h-[8rem] md:w-[8rem]">
              <Image
                src="/clara.png"
                quality={100}
                alt="Clara"
                fill
                className="object-cover"
              />
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
