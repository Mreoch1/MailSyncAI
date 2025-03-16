import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 16, 2025</p>

      <div className="prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to MailSyncAI ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the MailSyncAI website, applications, APIs, and other online products and services (collectively, the "Services").
        </p>
        <p>
          By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Using MailSyncAI</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">2.1 Account Registration</h3>
        <p>
          To use certain features of the Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and to keep this information updated.
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">2.2 Account Security</h3>
        <p>
          You are responsible for safeguarding your account credentials and for any activity that occurs under your account. You agree to notify us immediately of any unauthorized access to or use of your account.
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">2.3 Email Access</h3>
        <p>
          Our Services require access to your email accounts. By connecting your email account to our Services, you authorize us to access and process your emails in accordance with our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Subscription and Payment</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Free Trial</h3>
        <p>
          We may offer a free trial of our Services. At the end of the trial period, you will be charged for the subscription unless you cancel before the trial ends.
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Subscription Fees</h3>
        <p>
          Subscription fees are charged in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in these Terms.
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">3.3 Changes to Fees</h3>
        <p>
          We may change our subscription fees at any time. We will provide you with advance notice of these changes. If you do not agree to the changes, you may cancel your subscription before the changes take effect.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Content and Intellectual Property</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">4.1 Your Content</h3>
        <p>
          You retain all rights to your content, including your emails and any other information you provide to us. By using our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of providing the Services to you.
        </p>
        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Our Intellectual Property</h3>
        <p>
          The Services, including all content, features, and functionality, are owned by MailSyncAI and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or use our intellectual property without our prior written consent.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Privacy</h2>
        <p>
          Our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> describes how we collect, use, and share your information. By using our Services, you agree to our collection, use, and sharing of your information as described in the Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Termination</h2>
        <p>
          We may terminate or suspend your access to the Services at any time, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Services will immediately cease.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Disclaimers</h2>
        <p>
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>
          WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          IN NO EVENT WILL WE BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless MailSyncAI and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from: (i) your use of and access to the Services; (ii) your violation of any term of these Terms; (iii) your violation of any third-party right, including without limitation any copyright, property, or privacy right; or (iv) any claim that your content caused damage to a third party.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. If we make changes, we will provide notice of such changes, such as by sending an email notification, providing notice through the Services, or updating the "Last Updated" date at the beginning of these Terms. Your continued use of the Services following the posting of updated Terms means that you accept and agree to the changes.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">12. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at <a href="mailto:mailsyncai.legal@gmail.com" className="text-primary hover:underline">mailsyncai.legal@gmail.com</a>.
        </p>
      </div>

      <div className="mt-12 border-t pt-8">
        <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}

export default TermsPage; 