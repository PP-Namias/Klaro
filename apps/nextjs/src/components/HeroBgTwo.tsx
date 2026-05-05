import Image from "next/image";

export function HeroBgTwo() {
  return (
    <div className="absolute -top-40 left-0 w-full z-0 pointer-events-none">
      <Image
        src="/hero-bg-2.png"
        alt="Hero Background"
        width={1920}
        height={1080}
        className="w-full h-auto"
        priority
        unoptimized
      />
    </div>
  );
}
