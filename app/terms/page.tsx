export const metadata = {
  title: 'Terms of Service - AI Travel Agent',
  description: 'Our terms of service outline the rules and guidelines for using AI Travel Agent.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto prose prose-headings:text-primary prose-a:text-primary">
      <h1>Terms of Service</h1>
      <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <p>
        Welcome to AI Travel Agent. Please read these Terms of Service ("Terms") carefully as they contain important
        information about your legal rights, remedies, and obligations. By accessing or using the AI Travel Agent
        platform, you agree to comply with and be bound by these Terms.
      </p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using our platform, you agree to these Terms and our Privacy Policy. If you do not agree
        to these Terms, please do not use our services.
      </p>
      
      <h2>2. Description of Service</h2>
      <p>
        AI Travel Agent provides an AI-powered platform that generates personalized travel itineraries based on
        user preferences, budget, and other criteria. Our service includes trip planning, recommendations for
        destinations, activities, accommodations, and more.
      </p>
      
      <h2>3. User Accounts</h2>
      <p>
        To access certain features of our platform, you may need to create an account. You are responsible for
        maintaining the confidentiality of your account information and for all activities that occur under your account.
        You agree to:
      </p>
      <ul>
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain and promptly update your account information</li>
        <li>Protect your account credentials and not share them with others</li>
        <li>Notify us immediately of any unauthorized use of your account</li>
      </ul>
      
      <h2>4. User Content</h2>
      <p>
        You retain ownership of any content you submit to our platform. By submitting content, you grant us a
        worldwide, non-exclusive, royalty-free license to use, copy, modify, and display your content for the
        purpose of operating and improving our services.
      </p>
      
      <h2>5. Intellectual Property</h2>
      <p>
        The AI Travel Agent platform, including all content, features, and functionality, is owned by us and is
        protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute,
        or reproduce any part of our platform without our prior written consent.
      </p>
      
      <h2>6. Third-Party Services and Links</h2>
      <p>
        Our platform may include links to third-party websites, services, or content that are not owned or controlled
        by us. We do not endorse or assume responsibility for any third-party services or content. Your use of
        third-party services is subject to their terms and policies.
      </p>
      
      <h2>7. Affiliate Disclosure</h2>
      <p>
        Some links on our platform may be affiliate links, which means we may earn a commission if you make a purchase
        through these links. This does not affect your purchase price. We only recommend products or services we
        believe will add value to our users.
      </p>
      
      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly,
        or any loss of data, use, goodwill, or other intangible losses, resulting from:
      </p>
      <ul>
        <li>Your use or inability to use our platform</li>
        <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
        <li>Any errors, mistakes, or inaccuracies in our content</li>
        <li>Any interruption or cessation of transmission to or from our platform</li>
      </ul>
      
      <h2>9. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold us harmless from and against any claims, liabilities, damages,
        losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with
        your access to or use of our platform, your violation of these Terms, or your violation of any third-party rights.
      </p>
      
      <h2>10. Modifications to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. If we make changes, we will provide notice by
        updating the date at the top of these Terms and, in some cases, we may provide additional notice. Your
        continued use of our platform after any changes indicates your acceptance of the modified Terms.
      </p>
      
      <h2>11. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of California,
        without regard to its conflict of law provisions.
      </p>
      
      <h2>12. Contact Information</h2>
      <p>
        If you have any questions about these Terms, please contact us at <a href="mailto:ethan@ingenuitylabs.net">ethan@ingenuitylabs.net</a>.
      </p>
    </div>
  );
} 