import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPage = () => {
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
              <h1 className="text-2xl font-bold text-black">Privacy Policy</h1>
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
          <h2 className="text-3xl font-bold text-black mb-8">Privacy Policy</h2>
          
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">1. Information We Collect</h3>
              <p className="text-gray-700 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>Name and email address</li>
                <li>Account credentials</li>
                <li>Profile information</li>
                <li>Content you create or upload</li>
                <li>Communications with us</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">2. How We Use Your Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Communicate with you about products, services, and events</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">3. Information Sharing and Disclosure</h3>
              <p className="text-gray-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>With service providers who assist us in operating our website and conducting our business</li>
                <li>When we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety</li>
                <li>In connection with a merger, acquisition, or sale of all or a portion of our assets</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">4. Data Security</h3>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">5. Cookies and Tracking Technologies</h3>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">6. Third-Party Services</h3>
              <p className="text-gray-700 leading-relaxed">
                Our service may contain links to third-party websites or services that are not owned or controlled by Cudliy. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">7. Data Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">8. Your Rights and Choices</h3>
              <p className="text-gray-700 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Opt out of certain communications from us</li>
                <li>Request a copy of your data</li>
                <li>Object to the processing of your personal information</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">9. Children's Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">10. International Data Transfers</h3>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We will take appropriate measures to ensure that your personal information receives an adequate level of protection in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">11. Changes to This Privacy Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-black mb-4">12. Contact Us</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@cudliy.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;


