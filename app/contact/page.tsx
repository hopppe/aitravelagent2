import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Contact - AI Travel Agent',
  description: 'Get in touch with our team for support, feedback, or partnership opportunities.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-primary mb-6">Contact Us</h1>
        <p className="text-xl text-gray-700 mb-6">
          Have questions or feedback? We'd love to hear from you.
        </p>
        <p className="text-gray-600">
          Our team is ready to assist you with any questions, suggestions, or concerns you may have about our AI Travel Agent platform.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <ContactCard 
          icon={<FaEnvelope />} 
          title="Email Us" 
          info="ethan@ingenuitylabs.net"
          cta="Send an email"
          link="mailto:ethan@ingenuitylabs.net"
        />
        <ContactCard 
          icon={<FaMapMarkerAlt />} 
          title="Location" 
          info="California, USA"
          cta="View on map"
          link="#"
        />
        <ContactCard 
          icon={<FaPhoneAlt />} 
          title="Support Hours" 
          info="Monday-Friday: 9AM-5PM PST"
          cta="Learn more"
          link="#"
        />
      </div>

      <section className="bg-white p-8 rounded-lg shadow-sm mb-12">
        <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
        <form className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="How can we help you?"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="Your message here..."
              required
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Send Message
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FAQItem 
            question="How does AI Travel Agent work?" 
            answer="Our platform uses advanced AI to generate personalized travel itineraries based on your preferences, budget, and travel style. Simply fill out our trip questionnaire, and our AI will create a detailed day-by-day plan for your trip."
          />
          <FAQItem 
            question="Is AI Travel Agent free to use?" 
            answer="We offer both free and premium options. You can create basic itineraries for free, while our premium features offer more detailed recommendations, offline access, and additional customization options."
          />
          <FAQItem 
            question="Can I modify my itinerary after it's generated?" 
            answer="Absolutely! Your generated itinerary is fully customizable. You can add or remove activities, adjust timings, and make any changes to ensure your trip plan perfectly matches your preferences."
          />
          <FAQItem 
            question="How can I provide feedback about my experience?" 
            answer="We value your feedback! You can share your thoughts through the contact form on this page, or email us directly at ethan@ingenuitylabs.net."
          />
        </div>
      </section>
    </div>
  );
}

function ContactCard({ 
  icon, 
  title, 
  info, 
  cta, 
  link 
}: { 
  icon: React.ReactNode;
  title: string;
  info: string;
  cta: string;
  link: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
      <div className="text-primary text-3xl mx-auto mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{info}</p>
      <a
        href={link}
        className="text-primary hover:underline font-medium"
      >
        {cta}
      </a>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="font-bold text-lg mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
} 