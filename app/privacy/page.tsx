export const metadata = {
  title: 'Privacy Policy - AI Travel Agent',
  description: 'Our privacy policy explains how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto prose prose-headings:text-primary prose-a:text-primary">
      <h1>Privacy Policy</h1>
      <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <p>
        AI Travel Agent ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
        how we collect, use, disclose, and safeguard your information when you use our website and services.
        Please read this Privacy Policy carefully. By accessing or using our platform, you acknowledge that you
        have read, understood, and agree to be bound by all the terms of this Privacy Policy.
      </p>
      
      <h2>1. Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      
      <h3>Personal Information</h3>
      <p>
        When you create an account, we collect information such as your name, email address, and password. We may
        also collect additional information such as your travel preferences, location, and payment information if
        you choose to provide it.
      </p>
      
      <h3>Usage Information</h3>
      <p>
        We automatically collect information about your interactions with our platform, including the pages you visit,
        the time you spend on our platform, your IP address, browser type, device information, and operating system.
      </p>
      
      <h3>Travel Information</h3>
      <p>
        When you use our services to plan trips, we collect information about your travel preferences, destinations,
        dates, budget, and other details you provide to generate personalized travel recommendations.
      </p>
      
      <h2>2. How We Use Your Information</h2>
      <p>We may use the information we collect for various purposes, including to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Generate personalized travel itineraries and recommendations</li>
        <li>Process your transactions and manage your account</li>
        <li>Send you service-related communications</li>
        <li>Respond to your comments, questions, and requests</li>
        <li>Monitor and analyze usage patterns and trends</li>
        <li>Protect the security and integrity of our platform</li>
        <li>Comply with legal obligations</li>
      </ul>
      
      <h2>3. How We Share Your Information</h2>
      <p>We may share your information in the following circumstances:</p>
      
      <h3>Service Providers</h3>
      <p>
        We may share your information with third-party service providers who perform services on our behalf,
        such as data hosting, analytics, payment processing, and customer service.
      </p>
      
      <h3>Business Transfers</h3>
      <p>
        If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information
        may be transferred as part of that transaction.
      </p>
      
      <h3>Legal Requirements</h3>
      <p>
        We may disclose your information if required to do so by law or in response to valid requests by public
        authorities (e.g., a court or government agency).
      </p>
      
      <h3>With Your Consent</h3>
      <p>
        We may share your information with third parties when you have given us your consent to do so.
      </p>
      
      <h2>4. Cookies and Tracking Technologies</h2>
      <p>
        We use cookies and similar tracking technologies to collect information about your browsing activities
        and to improve your experience on our platform. You can control cookies through your browser settings
        and other tools. However, if you block certain cookies, you may not be able to use all the features of our platform.
      </p>
      
      <h2>5. Data Security</h2>
      <p>
        We implement appropriate security measures to protect your information from unauthorized access, alteration,
        disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is
        100% secure, and we cannot guarantee absolute security.
      </p>
      
      <h2>6. Your Rights and Choices</h2>
      <p>Depending on your location, you may have certain rights regarding your personal information:</p>
      <ul>
        <li>Access: You can request access to your personal information we hold</li>
        <li>Correction: You can request that we correct inaccurate information</li>
        <li>Deletion: You can request deletion of your personal information</li>
        <li>Opt-out: You can opt out of certain uses of your information</li>
        <li>Portability: You can request a copy of your information in a structured, machine-readable format</li>
      </ul>
      <p>
        To exercise these rights, please contact us at <a href="mailto:ethan@ingenuitylabs.net">ethan@ingenuitylabs.net</a>.
      </p>
      
      <h2>7. Children's Privacy</h2>
      <p>
        Our platform is not directed to children under the age of 13. We do not knowingly collect personal information
        from children under 13. If you are a parent or guardian and believe that your child has provided us with
        personal information, please contact us.
      </p>
      
      <h2>8. International Data Transfers</h2>
      <p>
        Your information may be transferred to, and maintained on, computers located outside of your state, province,
        country, or other governmental jurisdiction where the data protection laws may differ. If you are located
        outside the United States and choose to provide information to us, please note that we transfer the information
        to the United States and process it there.
      </p>
      
      <h2>9. Changes to This Privacy Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
        Privacy Policy on this page and updating the "Last Updated" date at the top. You are advised to review this
        Privacy Policy periodically for any changes.
      </p>
      
      <h2>10. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:ethan@ingenuitylabs.net">ethan@ingenuitylabs.net</a>.
      </p>
    </div>
  );
} 