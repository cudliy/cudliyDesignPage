import React, { useState } from 'react';

type FaqItem = { question: string; answer: string };

const FAQRow: React.FC<{ item: FaqItem; index: number }> = ({ item }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        className="w-full text-left py-4 px-6 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base sm:text-lg font-semibold text-gray-900 hover:text-[#E70A55] transition-colors duration-200 flex-1 pr-4">
          {item.question}
        </span>
        <span className={`flex-shrink-0 text-2xl font-bold text-gray-500 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      
      {open && (
        <div className="px-6 pb-4">
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
              {item.answer}
            </p>
          </div>
        </div>
      )}
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
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-black text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQRow key={index} item={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;