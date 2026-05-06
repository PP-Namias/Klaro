import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function CTA() {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 pt-16 pb-32 overflow-hidden flex flex-col items-center text-center">
      {/* full-width bg image pinned to bottom with top fade */}
      <div 
        className="absolute bottom-0 inset-x-0 h-[900px] z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 15%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%)'
        }}
      >
        <Image
          src="/sections/cta/cta-bg.png"
          alt=""
          fill
          className="object-bottom object-cover"
          quality={100}
          priority
        />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-[1400px] px-6">
        <h2 className="cta-title text-zinc-900 mb-2">Clear results are just a scan away</h2>
        
        <div className="relative w-[580px] h-[500px] -mt-8 -mb-12">
          <Image
            src="/sections/cta/1.png"
            alt="Klaro App Preview"
            fill
            className="object-contain"
            quality={100}
          />
        </div>

        <p className="cta-description text-zinc-900 mb-6 max-w-[600px]">
          Join thousands of Filipinos decoding their health jargon.<br />
          Take control of your medical journey today.
        </p>
        <div className="flex flex-row gap-4 mb-8">
          <button className="text-[length:var(--text-button)] bg-black text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-colors hover:bg-zinc-800 cursor-pointer">
            Open on Web <ArrowRight size={16} className="ml-2" />
          </button>
          <button className="text-[length:var(--text-button)] bg-white text-zinc-900 px-6 py-2 rounded-lg font-medium border border-[#e5e5e5] flex items-center justify-center transition-colors hover:bg-zinc-50 cursor-pointer">
            Download Mobile
          </button>
        </div>
        <p className="cta-note text-zinc-900 mb-0">Also available on App Store & Google Play. 100% Private</p>
      </div>
    </section>
  );
}
