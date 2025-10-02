import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GlassNav from "@/components/GlassNav";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const PricingPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const pricingPlans = [
    {
      name: "Free Plan",
      price: isYearly ? "$0" : "$0",
      period: isYearly ? "/year" : "/month",
      description: "Perfect for discovering the joy of making.",
      buttonText: "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "15 image prompts/month",
        "3 model generations",
        "Text, voice, or sketch input",
        "3D viewer to explore your creations",
        "Save to personal gallery"
      ]
    },
    {
      name: "Creator Plan",
      price: isYearly ? "$12.99" : "$9.99",
      period: isYearly ? "/month billed yearly" : "/1st month then $14.99/month",
      description: "For everyday creators, who want to design with heart.",
      buttonText: "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "1500 image generations/month",
        "75 model generations",
        "Custom textures & colors",
        "Private model library",
        "Advanced Editing Mode",
        "Priority queue",
        "2-3 days product delivery"
      ]
    },
    {
      name: "Studio Plan",
      price: isYearly ? "$59.99" : "$49.99",
      period: isYearly ? "/month billed yearly" : "/month",
      description: "Perfect for studios, and Professional who want to scale their work.",
      buttonText: "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      isPopular: true,
      features: [
        "Priority queue for faster results",
        "200 model generations/month",
        "Advanced editing (resize, fine-tune)",
        "Commercial license to sells",
        "Analytics dashboard",
        "High-poly export options",
        "API access",
        "Exclusive creator showcase"
      ]
    },
    {
      name: "Enterprise & EDU",
      price: "Contact us for Pricing",
      period: "",
      description: "For Offices, schools, Labs, and educators to spark creativity.",
      buttonText: "Contact Us",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "Unlimited Image/month",
        "Unlimited 3D generations/month",
        "Safe Mode filtering",
        "Student galleries for collaboration",
        "Student badges & certificates",
        "24/7 Online Support"
      ]
    }
  ];

  const studentPlan = {
    name: "College Student Plan",
    offer: "Free for the first 3 months, then $7.99/month",
      buttonText: "Get Access",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
    features: [
      "Unlimited Image and model",
      "Unlimited Model generation",
      "Collaboration Mode (share creations)",
      "Education license for distribution",
      "Portfolio mode (export collections)",
      "Student challenges & leaderboards",
      "Verified student access (.edu email)",
      "Full Creation Ownership"
    ]
  };


  return (
    <div className="min-h-screen bg-white">
      <GlassNav />
      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className={`text-3xl md:text-4xl font-bold text-black mb-4 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            Plans for Every{" "}
            <span className="bg-gradient-to-r from-[#E70A55] to-[#F4900C] bg-clip-text text-transparent">
              Creator
            </span>
          </h1>
          <p className={`text-base md:text-lg text-gray-600 max-w-4xl mx-auto mb-8 transform transition-all duration-1000 delay-150 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            Cudliy grows with you, every plan builds on the last, adding more ways to imagine, make, and share your creations.
          </p>
          
          {/* Toggle */}
          <div className={`flex items-center justify-center mb-16 transform transition-all duration-1000 delay-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-full transition-all ${
                  !isYearly ? 'bg-black text-white' : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-full transition-all ${
                  isYearly ? 'bg-black text-white' : 'text-gray-600'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-wrap justify-center gap-1 transform transition-all duration-1000 delay-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative p-6 border ${
                  plan.isPopular ? 'ring-2 ring-[#E70A55] scale-105 bg-white rounded-2xl' : 
                  index === 0 || index === 1 ? 'text-white border-gray-700 rounded-2xl' :
                  index === 3 ? 'text-white border-gray-700 rounded-2xl' : 'bg-white border-gray-200 rounded-2xl'
                }`}
                style={{
                  width: index === 0 || index === 1 ? '290px' : index === 2 ? '349px' : '280px',
                  height: index === 0 || index === 1 ? '699px' : index === 2 ? '841.21px' : '600px',
                  minHeight: index === 0 || index === 1 ? '699px' : index === 2 ? '841.21px' : '600px',
                  borderRadius: index === 0 || index === 1 ? '20px' : index === 2 ? '20px' : '16px',
                  margin: index === 2 ? '11.0px' : '5.0px',
                  backgroundColor: index === 0 || index === 1 || index === 3 ? '#313030' : 'white',
                  boxShadow: index === 2 ? '-8px 4.81px 45px 0px rgba(0, 0, 0, 0.15)' : (index === 0 || index === 1 || index === 3) ? '-4px 4px 30px 0px rgba(0, 0, 0, 0.1)' : 'none',
                  outline: index === 2 ? 'none' : undefined
                }}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-[#E70A55] text-white text-xs font-semibold px-9 py-2 rounded-tr-3xl rounded-bl-3xl" style={{width: '140.61px', height: '31.44px'}}>
                      Best Plan
                    </span>
                  </div>
                )}
                
                <div className="text-left mb-6">
                  <h3 className={`mb-2 ${index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-black'}`} style={{
                    fontFamily: 'Inter',
                    fontWeight: index === 3 ? '600' : 'bold',
                    fontSize: index === 3 ? '18px' : '18px',
                    lineHeight: '100%',
                    letterSpacing: '0%'
                  }}>{plan.name}</h3>
                  <div className="mb-3">
                    <span className={`${index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-black'}`} style={{
                      fontFamily: 'Inter',
                      fontWeight: index === 3 ? '600' : 'bold',
                      fontSize: index === 3 ? '12px' : '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%'
                    }}>{plan.price}</span>
                    <span className={`text-sm ${index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-600'}`}>{plan.period}</span>
                  </div>
                  <div className={`mt-4 mb-4 border-t ${index === 0 || index === 1 || index === 3 ? 'border-gray-600' : 'border-gray-200'}`}></div>
                  <p className={`${index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-600'}`} style={{
                    fontFamily: 'Inter',
                    fontWeight: index === 3 ? '500' : 'normal',
                    fontSize: index === 3 ? '12px' : '12px',
                    lineHeight: '100%',
                    letterSpacing: '0%'
                  }}>{plan.description}</p>
                </div>

                <Button
                  className={`font-semibold text-sm rounded-2xl transition-colors bg-[#E70A55] text-white hover:opacity-90`}
                  style={{
                    width: index === 0 || index === 1 ? '176px' : index === 3 ? '176px' : '252.72px',
                    height: index === 0 || index === 1 ? '45px' : index === 3 ? '45px' : '53.10px',
                    paddingTop: index === 0 || index === 1 || index === 3 ? '15px' : '18.05px',
                    paddingBottom: index === 0 || index === 1 || index === 3 ? '15px' : '18.05px',
                    paddingRight: index === 0 || index === 1 ? '10px' : index === 3 ? '10px' : '40.92px',
                    gap: index === 0 || index === 1 || index === 3 ? '10px' : '12.03px'
                  }}
                >
                  {plan.buttonText}
                </Button>

                <div className="mt-6">
                  <h4 className={`font-bold text-sm mb-4 ${index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-black'}`}>
                    Features
                  </h4>
                  <div className={`border-t mb-4 ${index === 0 || index === 1 || index === 3 ? 'border-gray-600' : 'border-gray-200'}`}></div>

                  <div className="space-y-3 mt-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-2">
                        <img src="/check 1.png" alt="check" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className={`text-xs ${index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Plan */}
      <section className="py-16 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8" style={{
            width: '1300px',
            height: '212px',
            borderRadius: '20px',
            boxShadow: '-8px 4.81px 45px 0px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="flex flex-col lg:flex-row gap-8 h-full">
              {/* Left side - Title, pricing, and button */}
              <div className="lg:w-1/3 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text黑 mb-4">{studentPlan.name}</h3>
                <p className="text-base text-gray-600 mb-6">{studentPlan.offer}</p>
                <Button className="bg-black text-white px-9 py-4 rounded-2xl font-semibold text-sm" style={{width: '211.81px', height: '53.10px'}}>
                  {studentPlan.buttonText}
                </Button>
              </div>

              {/* Right side - Features in two columns */}
              <div className="lg:w-2/3 flex items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {studentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <img src="/check 1.png" alt="check" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row justify-between gap-8 items-center">
              {/* Left content constrained to design width to preserve space for CTA */}
              <div className="flex-1 w-full text-left" style={{maxWidth: '821px'}}>
                <h2 className="font-extrabold text-black mb-4" style={{fontSize: '40px', lineHeight: '100%', textTransform: 'capitalize'}}>
                  Let's chat to get the best{" "}
                  <br/><span className="bg-gradient-to-r ml-[302px] from-[#E70A55] to-[#F4900C] bg-clip-text text-transparent">
                    Fit for you
                  </span>
                </h2>
                <p className="text-base text-gray-600 mb-6">
                  Cudliy scales as you grow. Let's find the right plan that fits your company size.
                </p>
              </div>
              
              {/* Right side - Button and contact info */}
              <div className="flex flex-col items-center lg:items-end space-y-4">
                <Button className="bg-black text-white px-9 py-4 rounded-2xl font-semibold" style={{width: '211.81px', height: '53.10px'}}>
                  Talk to us
                </Button>
                <div className="text-center lg:text-right space-y-2">
                  <p className="text-sm text-gray-500">Get 24/7 Consultation</p>
                  <p className="text-sm text-gray-500">Sales@cudliy.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage;


