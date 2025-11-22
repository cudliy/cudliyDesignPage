import React, { useState } from 'react';

type FaqItem = { question: string; answer: string };

const FAQRow: React.FC<{ item: FaqItem; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="w-full text-left py-2 flex items-start justify-between gap-4 group hover:bg-gray-50 rounded-lg px-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E70A55] focus:ring-opacity-20"
        onClick={toggleOpen}
      >
        <span className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-[#E70A55] transition-colors duration-200 flex-1 pr-4">
          {item.question}
        </span>
        <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 text-gray-600 font-bold text-lg ${open ? 'rotate-45' : 'rotate-0'}`}>
          ＋
        </span>
      </button>
      <div
        id={`faq-panel-${index}`}
        role="region"
        aria-labelledby={`faq-button-${index}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-4 pt-2">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {item.answer}
          </p>
        </div>
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
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-8 sm:mb-12 md:mb-16">
          Frequently Asked Questions
        </h2>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQRow key={index} item={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;