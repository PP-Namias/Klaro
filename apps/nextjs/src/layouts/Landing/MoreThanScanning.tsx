import Image from "next/image";

export function MoreThanScanning() {
  return (
    <section className="mt-[100px] flex w-full flex-col gap-[2.5rem]">
      <h2 className="section-header w-full text-center text-zinc-900">
        More than just Scanning
      </h2>

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Card */}
        <div className="flex min-h-[400px] flex-col rounded-[24px] border border-[#eeeeee] bg-white px-[1.5rem] pt-[1.5rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] md:min-h-[550px] md:pt-[2rem]">
          <h3 className="feature-card-title mb-4 text-center text-zinc-900 md:text-left">
            Intelligent Care Map
          </h3>
          <p className="feature-card-description mx-auto mb-8 max-w-[90%] text-center text-zinc-500 md:mx-0 md:text-left">
            Locate high-quality clinics, labs, and specialized medical centers
            near you. Seamlessly integrated mapping for effortless health
            navigation.
          </p>
          {/* Absolute inset-0 fixes the percentage height collapse bug */}
          <div className="relative min-h-[250px] w-full flex-1 overflow-hidden md:min-h-[300px]">
            <div className="absolute inset-0 p-4 md:p-8">
              <Image
                src="/sections/scanning/1.png"
                alt="Intelligent Care Map"
                fill
                className="object-contain"
                quality={100}
              />
            </div>
          </div>
        </div>

        {/* Right Cards Column */}
        <div className="flex flex-col gap-6">
          {/* Top Right Card */}
          <div className="flex min-h-[400px] flex-1 flex-col items-center gap-6 rounded-[24px] border border-[#eeeeee] bg-white px-[1.5rem] pt-[1.5rem] pb-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] md:min-h-[550px] md:items-start md:pt-[2rem]">
            <div className="flex flex-col py-2 text-center md:text-left">
              <h3 className="feature-card-title mb-4 text-zinc-900">
                Doctor Booking
              </h3>
              <p className="feature-card-description mx-auto text-zinc-500 md:mx-0">
                Book virtual or in-person consultations with trusted
                specialists directly within the app.
              </p>
            </div>
            <div className="relative mt-auto min-h-[200px] w-full flex-1 overflow-hidden md:min-h-[250px]">
              <div className="absolute inset-x-0 bottom-0 top-4 mx-auto w-full max-w-[280px]">
                <Image
                  src="/sections/scanning/2.png"
                  alt="Doctor Booking"
                  fill
                  className="object-contain object-bottom"
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="mt-8 flex flex-col items-center justify-center md:mt-16">
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
        <div className="flex items-center gap-4 md:gap-7">
          <div className="relative flex h-[5rem] w-[5rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#eaeaea] bg-white md:h-[8rem] md:w-[8rem] md:rounded-[2rem]">
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
    </section>
  );
}
