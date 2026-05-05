import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="flex flex-col items-center text-center mt-24 mb-24">
      <h2 className="text-[length:var(--text-hero-title)] leading-tight font-serif font-normal text-black mb-12">Clear results are just a scan away</h2>
      <div className="w-[400px] h-[400px] bg-gray-200 rounded-3xl mb-12"></div>
      <p className="text-xl text-black font-medium leading-relaxed mb-8">
        Join thousands of Filipinos decoding their health jargon.<br />
        Take control of your medical journey today.
      </p>
      <div className="flex flex-row gap-4 mb-8">
        <button className="text-[length:var(--text-button)] bg-black text-white px-6 py-2 rounded-lg flex items-center justify-center cursor-pointer border-none">Open on Web <ArrowRight size={16} className="ml-2" /></button>
        <button className="text-[length:var(--text-button)] bg-white text-black px-6 py-2 rounded-lg flex items-center justify-center cursor-pointer border border-gray-300">Download Mobile</button>
      </div>
      <p className="text-base text-gray-500 font-normal m-0">Also available on App Store & Google Play. 100% Private</p>
    </section>
  );
}
