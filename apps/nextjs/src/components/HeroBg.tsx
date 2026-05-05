import Image from "next/image";

export function HeroBg() {
  return (
    <div className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[1920px] z-0 pointer-events-none overflow-hidden">
      <div 
        style={{
          maskImage: "radial-gradient(ellipse at 50% 0%, black 60%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 60%, transparent 80%)",
        }}
      >
        <Image
          src="/hero-bg.png"
          alt="Hero Background"
          width={1920}
          height={1080}
          className="w-full h-auto"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
