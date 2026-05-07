import Image from "next/image";

export function HeroBgTwo() {
  return (
    <div className="pointer-events-none absolute -top-40 left-0 z-0 w-full">
      <Image
        src="/hero-bg-2.png"
        alt="Hero Background"
        width={1920}
        height={1080}
        className="h-auto w-full"
        priority
        unoptimized
      />
    </div>
  );
}
