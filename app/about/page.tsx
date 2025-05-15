import { FaLightbulb, FaUserFriends, FaShieldAlt, FaMagic } from 'react-icons/fa';

export const metadata = {
  title: 'About - AI Travel Agent',
  description: 'Learn about our AI-powered travel planning platform and our mission to make travel planning effortless.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-primary mb-6">About AI Travel Agent</h1>
        <p className="text-xl text-gray-700 mb-6">
          AI Travel Agent is an innovative platform that uses artificial intelligence to create personalized travel itineraries tailored to your preferences, budget, and travel style.
        </p>
        <p className="text-gray-600">
          Our mission is to make travel planning effortless and enjoyable, allowing you to focus on the excitement of your upcoming adventures rather than the stress of planning them.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary mb-6">Our Mission</h2>
        <p className="text-gray-600 mb-4">
          We believe that travel should be accessible and stress-free for everyone. Our AI-powered platform is designed to eliminate the overwhelming aspects of trip planning by providing personalized recommendations and detailed itineraries that match your unique preferences.
        </p>
        <p className="text-gray-600">
          Whether you're planning a weekend getaway, a family vacation, or a months-long adventure around the world, our goal is to make your travel planning experience seamless and enjoyable.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary mb-6">How It Works</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="space-y-6">
            <li className="flex items-start">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tell Us About Your Trip</h3>
                <p className="text-gray-600">
                  Fill out a simple survey about your destination, travel dates, budget, preferences, and any must-see attractions.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Our AI Creates Your Itinerary</h3>
                <p className="text-gray-600">
                  Our advanced AI technology analyzes your preferences and combines them with our extensive travel database to create a customized travel plan just for you.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Review and Customize</h3>
                <p className="text-gray-600">
                  Receive a detailed day-by-day itinerary that you can review, edit, and save for your trip. Make adjustments as needed to perfect your travel plans.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary mb-6">Why Choose Us</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            icon={<FaLightbulb />}
            title="Smart Recommendations"
            description="Our AI understands your preferences and recommends experiences that match your interests."
          />
          <FeatureCard
            icon={<FaUserFriends />}
            title="Personalized Experience"
            description="No two travelers are the same, and no two itineraries should be either. Every plan is unique to you."
          />
          <FeatureCard
            icon={<FaShieldAlt />}
            title="Time-Saving"
            description="Skip hours of research and planning. Get a comprehensive itinerary in minutes."
          />
          <FeatureCard
            icon={<FaMagic />}
            title="Continuously Improving"
            description="Our AI gets smarter with every trip planned, constantly improving recommendations."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-primary text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
} 