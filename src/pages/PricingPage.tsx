import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import GlassNav from "@/components/GlassNav";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import SEO from "@/components/SEO";

const PricingPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const userId = sessionStorage.getItem('user_id');
    const token = sessionStorage.getItem('token');
    setIsAuthenticated(!!(userId && token));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubscriptionUpgrade = async (planName: string) => {
    try {
      // Check if user is logged in
      const userId = sessionStorage.getItem('user_id');
      const token = sessionStorage.getItem('token');
      
      if (!userId || !token || !isAuthenticated) {
        // Redirect to signin if not logged in
        navigate('/signin');
        return;
      }

      // Map plan names to backend plan types
      const planMapping: { [key: string]: string } = {
        'Creator Plan': 'premium',
        'Studio Plan': 'pro'
      };

      const planType = planMapping[planName];
      if (!planType) {
        alert('Invalid plan selected. Please try again.');
        return;
      }

      // Create subscription via API
      const response = await apiService.createSubscription(
        userId,
        planType,
        isYearly ? 'year' : 'month'
      );

      if (response.success && response.data) {
        if (response.data.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = response.data.checkoutUrl;
        } else {
          alert('Subscription creation failed. Please try again.');
        }
      } else {
        alert(`Subscription creation failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while creating your subscription. Please try again.');
    }
  };

  const pricingPlans = [
    {
      name: "Free Plan",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      period: isYearly ? "/year" : "/month",
      description: "Perfect for discovering the joy of making.",
      buttonText: isAuthenticated ? "Current Plan" : "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "3 image generations/month",
        "1 model generation/month",
        "Text, voice, or sketch input",
        "3D viewer to explore your creations",
        "Save to personal gallery"
      ]
    },
    {
      name: "Creator Plan",
      monthlyPrice: "$14.99",
      yearlyPrice: "$12.99",
      period: isYearly ? "/month (billed yearly)" : "/month",
      yearlyNote: isYearly ? "Save $24 annually" : "First month $9.99",
      description: "For everyday creators, who want to design with heart.",
      buttonText: isAuthenticated ? "Upgrade Now" : "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "100 image generations/month",
        "50 model generations/month",
        "Custom textures & colors",
        "Private model library",
        "Advanced Editing Mode",
        "Priority queue",
        "2-3 days product delivery"
      ]
    },
    {
      name: "Studio Plan",
      monthlyPrice: "$49.99",
      yearlyPrice: "$39.99",
      period: isYearly ? "/month (billed yearly)" : "/month",
      yearlyNote: isYearly ? "Save $120 annually" : "",
      description: "Perfect for studios, and Professional who want to scale their work.",
      buttonText: isAuthenticated ? "Upgrade Now" : "Create a free account",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      isPopular: true,
      features: [
        "Unlimited image generations/month",
        "200 model generations/month",
        "Advanced editing (resize, fine-tune)",
        "Commercial license to sell",
        "Analytics dashboard",
        "High-poly export options",
        "API access",
        "Exclusive creator showcase"
      ]
    },
    {
      name: "Enterprise & EDU",
      monthlyPrice: "Contact us for Pricing",
      yearlyPrice: "Contact us for Pricing",
      period: "",
      description: "For Offices, schools, Labs, and educators to spark creativity.",
      buttonText: "Contact Us",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
      features: [
        "Unlimited image generations/month",
        "Unlimited 3D model generations/month",
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
      buttonText: isAuthenticated ? "Upgrade Now" : "Get Access",
      buttonStyle: "bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white",
    features: [
      "Unlimited image generations",
      "Unlimited model generations",
      "Collaboration Mode (share creations)",
      "Education license for distribution",
      "Portfolio mode (export collections)",
      "Student challenges & leaderboards",
      "Verified student access (.edu email)",
      "Full Creation Ownership"
    ]
  };


  return (
    <>
      <SEO 
        title="Pricing Plans - Choose Your Creative Journey"
        description="Explore Cudliy's flexible pricing plans. From free basic access to professional studio plans. Start creating custom 3D toys today with plans starting at just $9.99/month."
        keywords="pricing, subscription plans, toy design pricing, 3D printing plans, creator plan, studio plan, student discount, enterprise pricing"
        url="/pricing"
      />
      <div className="min-h-screen bg-white overflow-x-hidden transition-colors duration-300">
        <GlassNav />
      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-8 overflow-x-hidden">
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
      <section className="py-16 px-4 md:px-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Cards - Stack Layout */}
          <div className={`md:hidden space-y-6 px-4 transform transition-all duration-1000 delay-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative w-full max-w-sm mx-auto transform transition-all duration-700 ease-out ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{
                  transitionDelay: `${600 + index * 150}ms`
                }}
              >
                <div
                  className={`relative rounded-2xl overflow-hidden ${
                    plan.isPopular 
                      ? 'bg-gradient-to-br from-white to-gray-50 border-2 border-[#E70A55] shadow-xl' 
                      : index === 0 || index === 1 || index === 3
                        ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-lg'
                        : 'bg-white border border-gray-200 shadow-lg'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.isPopular && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-[#E70A55] to-[#F4900C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform rotate-12">
                        ⭐ Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h3 className={`text-xl font-bold mb-2 ${
                        index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-gray-900'
                      }`}>
                        {plan.name}
                      </h3>
                      
                      {/* Price */}
                      <div className="mb-3">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-3xl font-bold ${
                            index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-gray-900'
                          }`}>
                            {plan.monthlyPrice === 'Contact us for Pricing' ? 'Custom' : (isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                          </span>
                          {plan.monthlyPrice !== '$0' && plan.monthlyPrice !== 'Contact us for Pricing' && (
                            <span className={`text-sm ${
                              index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {plan.period}
                            </span>
                          )}
                        </div>
                        {plan.yearlyNote && (
                          <p className="text-green-600 text-xs font-medium mt-1">{plan.yearlyNote}</p>
                        )}
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${
                        index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {plan.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className={`text-sm font-semibold mb-3 ${
                        index === 0 || index === 1 || index === 3 ? 'text-white' : 'text-gray-900'
                      }`}>
                        What's included:
                      </h4>
                      <ul className="space-y-2.5">
                        {plan.features.slice(0, 6).map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className={`text-sm leading-relaxed ${
                              index === 0 || index === 1 || index === 3 ? 'text-gray-200' : 'text-gray-700'
                            }`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                        {plan.features.length > 6 && (
                          <li className={`text-sm ${
                            index === 0 || index === 1 || index === 3 ? 'text-gray-400' : 'text-gray-500'
                          } text-center pt-2 font-medium`}>
                            +{plan.features.length - 6} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <button 
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                        plan.isPopular 
                          ? 'bg-gradient-to-r from-[#E70A55] to-[#F4900C] hover:from-[#d10950] hover:to-[#e8850b] text-white shadow-pink-200' 
                          : index === 0 || index === 1 || index === 3 
                            ? 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-white hover:border-gray-100' 
                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-300'
                      }`}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/signin');
                        } else if (plan.name === 'Free Plan') {
                          navigate('/dashboard');
                        } else if (plan.name === 'Creator Plan' || plan.name === 'Studio Plan') {
                          handleSubscriptionUpgrade(plan.name);
                        } else if (plan.name === 'Enterprise & EDU') {
                          window.location.href = 'mailto:sales@cudliy.com?subject=Enterprise Pricing Inquiry';
                        }
                      }}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layout */}
          <div className={`hidden md:flex md:flex-row md:flex-wrap justify-center gap-4 md:gap-1 transform transition-all duration-1000 delay-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative p-6 border transform transition-all duration-1000 delay-${600 + index * 100} ease-out w-full md:w-auto ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                } ${
                  plan.isPopular ? 'ring-2 ring-[#E70A55] md:scale-105 bg-white rounded-2xl' : 
                  index === 0 || index === 1 ? 'text-white border-gray-700 rounded-2xl' :
                  index === 3 ? 'text-white border-gray-700 rounded-2xl' : 'bg-white border-gray-200 rounded-2xl'
                }`}
                style={{
                  maxWidth: '100%',
                  width: window.innerWidth < 768 ? '100%' : (index === 0 || index === 1 ? '290px' : index === 2 ? '349px' : '280px'),
                  height: 'auto',
                  minHeight: window.innerWidth < 768 ? 'auto' : (index === 0 || index === 1 ? '699px' : index === 2 ? '841.21px' : '600px'),
                  borderRadius: index === 0 || index === 1 ? '20px' : index === 2 ? '20px' : '16px',
                  margin: window.innerWidth < 768 ? '0' : (index === 2 ? '11.0px' : '5.0px'),
                  backgroundColor: index === 0 || index === 1 || index === 3 ? '#313030' : 'white',
                  boxShadow: index === 2 ? '-8px 4.81px 45px 0px rgba(0, 0, 0, 0.15)' : (index === 0 || index === 1 || index === 3) ? '-4px 4px 30px 0px rgba(0, 0, 0, 0.1)' : '0px 2px 8px 0px rgba(0, 0, 0, 0.1)',
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
                    }}>{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                    <span className={`text-sm ${index === 0 || index === 1 || index === 3 ? 'text-gray-300' : 'text-gray-600'}`}>{plan.period}</span>
                  </div>
                  {plan.yearlyNote && (
                    <p className="text-green-600 text-xs font-medium mb-2">{plan.yearlyNote}</p>
                  )}
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
                  className={`font-semibold text-sm rounded-2xl transition-colors text-white`}
                  style={{
                    width: '176px',
                    height: '45px',
                    borderRadius: '15px',
                    gap: '10px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    background: '#E70A55',
                    opacity: 1
                  }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      // Not logged in - redirect to signin
                      navigate('/signin');
                    } else if (plan.name === 'Free Plan') {
                      // Already on free plan - redirect to dashboard
                      navigate('/dashboard');
                    } else if (plan.name === 'Creator Plan' || plan.name === 'Studio Plan') {
                      // Handle subscription upgrade
                      handleSubscriptionUpgrade(plan.name);
                    } else if (plan.name === 'Enterprise & EDU') {
                      // Handle contact for enterprise
                      window.location.href = 'mailto:sales@cudliy.com?subject=Enterprise Pricing Inquiry';
                    }
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
      <section className="py-12 md:py-16 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className={`bg-white rounded-2xl p-6 md:p-8 transform transition-all duration-1000 delay-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{
            maxWidth: '100%',
            width: '100%',
            height: 'auto',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-full">
              {/* Left side - Title, pricing, and button */}
              <div className="lg:w-1/3 flex flex-col justify-center text-center lg:text-left">
                <h3 className="text-lg md:text-2xl font-bold text-black mb-3 md:mb-4">{studentPlan.name}</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">{studentPlan.offer}</p>
                <Button 
                  className="bg-black text-white px-6 md:px-9 py-3 md:py-4 rounded-2xl font-semibold text-sm w-full lg:w-auto mx-auto lg:mx-0" 
                  style={{maxWidth: '211.81px', height: '53.10px'}}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/signin');
                    } else {
                      alert('Student plan upgrade - please contact sales@cudliy.com with your .edu email for verification');
                    }
                  }}
                >
                  {studentPlan.buttonText}
                </Button>
              </div>

              {/* Right side - Features in responsive grid */}
              <div className="lg:w-2/3 flex items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
                  {studentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 md:gap-3">
                      <div className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg transform transition-all duration-1000 delay-1200 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex flex-col lg:flex-row justify-between gap-6 md:gap-8 items-center text-center lg:text-left">
              {/* Left content */}
              <div className="flex-1 w-full" style={{maxWidth: '821px'}}>
                <h2 className="font-extrabold text-black mb-4 text-xl md:text-4xl leading-tight">
                  Let's chat to get the best{" "}
                  <span className="bg-gradient-to-r from-[#E70A55] to-[#F4900C] bg-clip-text text-transparent block sm:inline">
                    Fit for you
                  </span>
                </h2>
                <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed">
                  Cudliy scales as you grow. Let's find the right plan that fits your company size.
                </p>
              </div>
              
              {/* Right side - Button and contact info */}
              <div className="flex flex-col items-center lg:items-end space-y-4 w-full lg:w-auto">
                <Button 
                  className="bg-black text-white px-6 md:px-9 py-3 md:py-4 rounded-2xl font-semibold w-full sm:w-auto transition-all duration-300 hover:bg-gray-800" 
                  style={{maxWidth: '211.81px', height: '53.10px'}}
                  onClick={() => window.location.href = 'mailto:sales@cudliy.com?subject=Consultation Request'}
                >
                  Talk to us
                </Button>
                <div className="text-center lg:text-right space-y-1">
                  <p className="text-xs md:text-sm text-gray-500">Get 24/7 Consultation</p>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Sales@cudliy.com</p>
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
    </>
  );
};

export default PricingPage;


