"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Testimonials() {
  return (
    <motion.section 
      className="mt-[100px] flex flex-col gap-[2rem]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h2 className="section-header w-full text-left tracking-[0px] text-black">
        People helped by Klaro
      </h2>

      <div className="flex flex-col gap-6">
        {/* Top Wide Card */}
        <div className="group flex min-h-[400px] flex-col overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] md:flex-row md:gap-[2.2rem]">
          <div className="flex flex-1 flex-col py-[0.5rem]">
            <div className="mb-2">
              <h3 className="testimonial-name mb-1 text-black">
                Bea Nessa P. Naldoza
              </h3>
              <p className="testimonial-role text-[#8C8C8C]">
                Student Nurse - BSN
              </p>
            </div>
            <p className="testimonial-quote mb-6 max-w-[90%] text-black">
              “Klaro simplifies complex lab results and medical jargon,
              preventing confusion. It’s medically accurate and responsibly
              designed, focusing on professional guidance rather than
              self-medication.”
            </p>
            <a
              href="#"
              className="testimonial-role inline-flex w-fit items-center gap-2 font-medium text-black transition-all group-hover:translate-x-1"
            >
              Read Full Story{" "}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[16px] md:w-[480px]">
            <Image
              src="/sections/testimonial/1.png"
              alt="Maria Santos"
              fill
              className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Bottom 3 Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Juan */}
          <div className="flex h-full flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <div>
              <h3 className="testimonial-name-small mb-1 text-black">
                Catherine Lozano
              </h3>
              <p className="testimonial-role-small text-[#8C8C8C]">
                Science Teacher - SEAIT
              </p>
            </div>
            <p className="testimonial-quote-small text-black">
              Overall, the process is solid and they’ve got backup plans and
              guardrails for errors, which is great.
            </p>
            <div className="relative mt-auto h-64 w-full overflow-hidden rounded-[16px]">
              <Image
                src="/sections/testimonial/2.png"
                alt="Juan Dela Cruz"
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Dr Elena */}
          <div className="flex h-full flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <div>
              <h3 className="testimonial-name-small mb-1 text-black">
                Christel Señadan
              </h3>
              <p className="testimonial-role-small text-[#8C8C8C]">
                Student Nurse - BSN
              </p>
            </div>
            <p className="testimonial-quote-small text-black">
              The system is well-planned and carefully developed. The developers
              ensured ethical boundaries were respected while prioritizing the
              confidentiality and privacy of patients’ data.
            </p>
            <div className="relative mt-auto h-64 w-full overflow-hidden rounded-[16px]">
              <Image
                src="/sections/testimonial/3.png"
                alt="Dr. Elena Reyes"
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Paolo */}
          <div className="flex h-full flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)]">
            <div>
              <h3 className="testimonial-name-small mb-1 text-black">
                Trisha Mae Belista
              </h3>
              <p className="testimonial-role-small text-[#8C8C8C]">
                Student Nurse - BSN
              </p>
            </div>
            <p className="testimonial-quote-small text-black">
              As a nursing student, malaking help siya sa efficiency instead of
              manually decoding medical jargon or lab results, mas napapadali
              yung understanding and workflow.
            </p>
            <div className="relative mt-auto h-64 w-full overflow-hidden rounded-[16px]">
              <Image
                src="/sections/testimonial/4.png"
                alt="Paolo Gomez"
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
