export function LandingDemoVideo() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-4 sm:px-8 sm:pb-24 lg:px-10">
      <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
        <video
          className="block h-auto w-full"
          autoPlay
          loop
          playsInline
          controls
          preload="auto"
          disablePictureInPicture
        >
          <source src="/Klara.mp4" type="video/mp4" />
          <track
            kind="captions"
            srcLang="en"
            label="English captions"
            src="/Klara.vtt"
            default
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
