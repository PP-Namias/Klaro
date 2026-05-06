import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Security() {
  return (
    <section className="-mt-4 flex flex-col w-full">
      <h2 className="section-header text-left mb-16 text-zinc-900">Secure by Design</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="w-full flex justify-center md:justify-end md:pr-20">
          <Image 
            src="/sections/security/1.png"
            alt="Medical-grade vault"
            width={500}
            height={500}
            className="w-full max-w-[400px] h-auto object-contain"
          />
        </div>
        <div className="flex flex-col justify-center">
           <h3 className="showcase-heading text-zinc-900 mb-6">Medical-grade privacy</h3>
           <p className="showcase-body text-zinc-500 mb-24 max-w-[90%]">
             Your health data belongs to you. Every document is encrypted with AES-256 standards, the same used by banks. We comply with the Data Privacy Act to ensure your medical history stays in your hands only.
           </p>
           <a href="#" className="font-geist font-medium text-[1.32rem] text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-3 group">
             How we protect you <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors translate-y-[1px]" />
           </a>
        </div>
      </div>
    </section>
  );
}
