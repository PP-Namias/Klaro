import Image from "next/image";

export function HeroBg() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        <Image
          src="/hero-bg.png"
          alt="Hero Background"
          fill
          className="object-cover object-top md:object-center"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
