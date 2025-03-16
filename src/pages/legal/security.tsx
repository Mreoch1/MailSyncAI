import { Link } from 'react-router-dom';

export function SecurityPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Security Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 16, 2025</p>

      <div className="prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At MailSyncAI, we understand the importance of security when it comes to your email data. This Security Policy outlines the measures we take to protect your information and ensure the security of our Services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Data Protection</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">2.1 Encryption</h3>
        <p>
          We use industry-standard encryption protocols to protect your data:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>All data transmitted between your device and our servers is encrypted using TLS 1.3</li>
          <li>Data at rest is encrypted using AES-256 encryption</li>
          <li>Email content is processed in secure, isolated environments</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">2.2 Access Controls</h3>
        <p>
          We implement strict access controls to ensure that only authorized personnel can access your data:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Role-based access control (RBAC) for all systems</li>
          <li>Multi-factor authentication (MFA) for all staff</li>
          <li>Principle of least privilege for all access permissions</li>
          <li>Regular access reviews and audits</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">2.3 Data Minimization</h3>
        <p>
          We follow data minimization principles:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>We only collect and process the data necessary to provide our Services</li>
          <li>Raw email content is not permanently stored</li>
          <li>Processed data is retained only for the period necessary to provide our Services</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Infrastructure Security</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Cloud Security</h3>
        <p>
          Our infrastructure is hosted on secure cloud platforms with the following security measures:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Virtual private clouds (VPCs) with strict network isolation</li>
          <li>Firewalls and network access control lists (ACLs)</li>
          <li>Regular security patching and updates</li>
          <li>Intrusion detection and prevention systems</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Monitoring and Logging</h3>
        <p>
          We maintain comprehensive monitoring and logging systems:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Real-time monitoring of all systems and services</li>
          <li>Automated alerts for suspicious activities</li>
          <li>Secure, immutable audit logs</li>
          <li>Regular log reviews and analysis</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Application Security</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">4.1 Secure Development</h3>
        <p>
          Our development practices include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Secure coding guidelines and training for all developers</li>
          <li>Regular code reviews and static code analysis</li>
          <li>Dependency scanning for vulnerabilities</li>
          <li>Separation of development, testing, and production environments</li>
        </ul>

        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Testing and Validation</h3>
        <p>
          We regularly test our security measures:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Automated security testing in our CI/CD pipeline</li>
          <li>Regular penetration testing by third-party security experts</li>
          <li>Vulnerability scanning of all systems</li>
          <li>Bug bounty program to encourage responsible disclosure</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Email Provider Security</h2>
        <p>
          When connecting to your email provider, we:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Use OAuth 2.0 for secure authentication whenever possible</li>
          <li>Never store your email password in plain text</li>
          <li>Use secure, scoped API permissions</li>
          <li>Regularly validate and refresh authentication tokens</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Incident Response</h2>
        <p>
          In the event of a security incident:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>We have a documented incident response plan</li>
          <li>Our team is trained to quickly identify and respond to security incidents</li>
          <li>We will notify affected users in accordance with applicable laws and regulations</li>
          <li>We conduct post-incident reviews to prevent similar incidents in the future</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Compliance</h2>
        <p>
          We maintain compliance with relevant security standards and regulations:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Regular security assessments and audits</li>
          <li>Compliance with data protection regulations such as GDPR and CCPA</li>
          <li>Vendor security assessments for all third-party services</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Employee Security</h2>
        <p>
          Our team follows strict security protocols:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Background checks for all employees</li>
          <li>Regular security awareness training</li>
          <li>Secure device management and endpoint protection</li>
          <li>Clear security policies and procedures</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Your Responsibilities</h2>
        <p>
          To help maintain the security of your account, we recommend that you:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Use strong, unique passwords for your MailSyncAI account</li>
          <li>Enable two-factor authentication when available</li>
          <li>Keep your devices and software up to date</li>
          <li>Be cautious of phishing attempts and suspicious emails</li>
          <li>Review connected applications regularly and revoke access when no longer needed</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Updates to This Policy</h2>
        <p>
          We may update this Security Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Security Policy on this page and updating the "Last Updated" date.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Information</h2>
        <p>
          If you have any questions about our security practices or if you believe you have identified a security vulnerability, please contact our security team at <a href="mailto:security@mailsyncai.com" className="text-primary hover:underline">security@mailsyncai.com</a>.
        </p>
      </div>

      <div className="mt-12 border-t pt-8">
        <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}

export default SecurityPage; 