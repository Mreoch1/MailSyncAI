import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 16, 2025</p>

      <div className="prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At MailSyncAI ("we," "our," or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, applications, and services (collectively, the "Services").
        </p>
        <p>
          Please read this Privacy Policy carefully. By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">2.1 Personal Information</h3>
        <p>
          We may collect personal information that you provide directly to us, such as:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Name</li>
          <li>Email address</li>
          <li>Account credentials</li>
          <li>Payment information</li>
          <li>Any other information you choose to provide</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">2.2 Email Data</h3>
        <p>
          When you connect your email account to our Services, we access and process your emails to provide our Services. This includes:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Email content</li>
          <li>Sender and recipient information</li>
          <li>Subject lines</li>
          <li>Timestamps</li>
          <li>Attachments</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">2.3 Usage Information</h3>
        <p>
          We automatically collect certain information about your use of our Services, such as:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Operating system</li>
          <li>Pages visited</li>
          <li>Time and date of your visit</li>
          <li>Time spent on pages</li>
          <li>Referring website</li>
          <li>Other statistics</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>
          We use the information we collect for various purposes, including to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide, maintain, and improve our Services</li>
          <li>Process and complete transactions</li>
          <li>Send you technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Develop new products and services</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
          <li>Personalize and improve your experience</li>
          <li>Facilitate contests, sweepstakes, and promotions</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Email Processing</h3>
        <p>
          We process your emails to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Generate summaries of your emails</li>
          <li>Categorize and prioritize your emails</li>
          <li>Identify important information in your emails</li>
          <li>Provide insights and analytics about your email usage</li>
        </ul>
        <p>
          We use artificial intelligence and machine learning technologies to process your emails. Our AI systems are designed to respect your privacy and handle your data securely.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. How We Share Your Information</h2>
        <p>
          We may share your information in the following circumstances:
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">4.1 With Your Consent</h3>
        <p>
          We may share your information when you direct us to do so.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Service Providers</h3>
        <p>
          We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">4.3 Legal Requirements</h3>
        <p>
          We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">4.4 Business Transfers</h3>
        <p>
          We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Security</h2>
        <p>
          We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Retention</h2>
        <p>
          We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
        </p>
        <p>
          For email data, we retain processed data for a limited period to provide our Services. Raw email content is not permanently stored unless necessary for troubleshooting or improving our Services, and in such cases, it is anonymized whenever possible.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, such as:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>The right to access your personal information</li>
          <li>The right to rectify inaccurate personal information</li>
          <li>The right to request the deletion of your personal information</li>
          <li>The right to restrict the processing of your personal information</li>
          <li>The right to data portability</li>
          <li>The right to object to the processing of your personal information</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information provided in the "Contact Information" section below.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
        <p>
          Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Third-Party Links</h2>
        <p>
          Our Services may contain links to third-party websites and services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Information</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@mailsyncai.com" className="text-primary hover:underline">privacy@mailsyncai.com</a>.
        </p>
      </div>

      <div className="mt-12 border-t pt-8">
        <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}

export default PrivacyPage; 