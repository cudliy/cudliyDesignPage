import React, { useState } from 'react';

type FaqItem = { question: string; answer: string };

const FAQRow: React.FC<{ item: FaqItem; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="">
      <button
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="w-full text-left py-4 flex items-start justify-between gap-4 group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base sm:text-lg font-medium font-manrope group-hover:text-[#E70A55]">
          {item.question}
        </span>
        <span className={`mt-1 shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>＋</span>
      </button>
      <div
        id={`faq-panel-${index}`}
        role="region"
        className={`overflow-hidden transition-[max-height] duration-300 ease-out ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="pb-4 text-sm sm:text-base text-gray-600 font-manrope pr-8">
          {item.answer}
        </p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const faqs: FaqItem[] = [
      {
        question: "What exactly is Cudliy?",
        answer: "Cudliy is an AI-powered creative platform that transforms your imagination into reality using advanced 3D design technology."
      },
      {
        question: "Do I need any design skills to use Cudliy?",
        answer: "No! Cudliy is designed for everyone. Simply describe what you want, and our AI will create it for you."
      },
      {
        question: "What kind of toys can I create?",
        answer: "You can create virtually any toy or object you can imagine - from simple shapes to complex characters and designs."
      },
      {
        question: "How does the printing and delivery work?",
        answer: "Once your design is ready, we handle the 3D printing and shipping directly to your door with high-quality materials."
      },
      {
        question: "Is Cudliy safe for kids?",
        answer: "Absolutely! All our products are made with child-safe materials and undergo rigorous quality testing."
      }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-abril text-center mb-8 sm:mb-12 md:mb-16">FAQs</h2>
        <div className="rounded-2xl bg-white space-y-2">
          {faqs.map((faq, index) => (
            <FAQRow key={index} item={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;