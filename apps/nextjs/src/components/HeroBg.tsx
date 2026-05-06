import Image from "next/image";

export function HeroBg() {
  return (
    <div className="pointer-events-none absolute -top-[180px] left-1/2 z-0 w-[1920px] -translate-x-1/2 overflow-hidden">
      <div
        style={{
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 60%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 60%, transparent 80%)",
        }}
      >
        <Image
          src="/hero-bg.png"
          alt="Hero Background"
          width={1920}
          height={1080}
          className="h-auto w-full"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
