import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/Asset 12 1 (1).png"
                alt="Cudliy Logo"
                className="h-8 w-auto"
              />
              <h1 className="text-2xl font-bold text-black">Terms of Service</h1>
            </div>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-gray-300"
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`max-w-4xl mx-auto px-8 py-12 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-8">Terms of Service</h2>
          
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">1. Acceptance of Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Cudliy, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">2. Use License</h3>
              <p className="text-gray-700 leading-relaxed">
                Permission is granted to temporarily download one copy of Cudliy per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">3. User Accounts</h3>
              <p className="text-gray-700 leading-relaxed">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">4. Content</h3>
              <p className="text-gray-700 leading-relaxed">
                Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">5. Prohibited Uses</h3>
              <p className="text-gray-700 leading-relaxed">
                You may not use our service:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">6. Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">7. Disclaimer</h3>
              <p className="text-gray-700 leading-relaxed">
                The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms relating to our website and the use of this website.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">8. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                In no event shall Cudliy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">9. Governing Law</h3>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which Cudliy operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">10. Changes</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">11. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at support@cudliy.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;


