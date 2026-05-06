
import { ArrowRight } from "lucide-react";

export function Testimonials() {
  return (
    <section className="mt-[100px] flex flex-col gap-[2rem]">
      <h2 className="section-header w-full text-left tracking-[0px] text-black">
        People helped by Klaro
      </h2>

      <div className="flex flex-col gap-6">
        {/* Top Wide Card */}
        <div className="group flex min-h-[400px] flex-col overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] md:flex-row md:gap-[2.2rem]">
          <div className="flex flex-1 flex-col py-[0.5rem]">
            <div className="mb-6">
              <h3 className="testimonial-name text-black mb-1">Maria Santos</h3>
              <p className="testimonial-role text-[#8C8C8C]">Mother of two, Patient</p>
            </div>
            <p className="testimonial-quote text-black max-w-[90%] mb-6">
              “I used to spend hours Googling my lab results and just getting more worried. With Klaro, I got a clear explanation in Tagalog in seconds. It’s like having a doctor in my pocket..”
            </p>
            <a
              href="#"
              className="testimonial-role w-fit inline-flex items-center gap-2 font-medium text-black transition-all group-hover:translate-x-1"
            >
              Read Full Story <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <div className="w-full md:w-[320px] aspect-square shrink-0 rounded-[16px] bg-[#F7F7F7]">
            {/* Placeholder Empty */}
          </div>
        </div>

        {/* Bottom 3 Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Juan */}
          <div className="flex flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] h-full">
            <div>
              <h3 className="testimonial-name-small text-black mb-1">Juan Dela Cruz</h3>
              <p className="testimonial-role-small text-[#8C8C8C]">Family Caregiver</p>
            </div>
            <p className="testimonial-quote-small text-black">
              Now everything is in one secure place and actually makes sense.
            </p>
            <div className="h-48 w-full rounded-[16px] bg-[#F7F7F7] mt-auto">
              {/* Placeholder Empty */}
            </div>
          </div>

          {/* Dr Elena */}
          <div className="flex flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] h-full">
            <div>
              <h3 className="testimonial-name-small text-black mb-1">Dr. Elena Reyes, MD</h3>
              <p className="testimonial-role-small text-[#8C8C8C]">General Physician</p>
            </div>
            <p className="testimonial-quote-small text-black">
              We spend less time explaining jargon and more time on the treatment plan.
            </p>
            <div className="h-48 w-full rounded-[16px] bg-[#F7F7F7] mt-auto">
              {/* Placeholder Empty */}
            </div>
          </div>

          {/* Paolo */}
          <div className="flex flex-col gap-[1rem] rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] h-full">
            <div>
              <h3 className="testimonial-name-small text-black mb-1">Paolo Gomez</h3>
              <p className="testimonial-role-small text-[#8C8C8C]">WFH Professional</p>
            </div>
            <p className="testimonial-quote-small text-black">
              I scan my results as soon as I get them. No waiting for the next day to know if I'm okay. Instant peace of mind.
            </p>
            <div className="h-48 w-full rounded-[16px] bg-[#F7F7F7] mt-auto">
              {/* Placeholder Empty */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
