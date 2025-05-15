import Link from 'next/link';
import { FaPlane, FaEnvelope, FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-4">
              <FaPlane className="text-2xl" />
              <span>AI Travel Agent</span>
            </Link>
            <p className="text-gray-300 text-sm">
              Your AI-powered travel companion for creating personalized trip itineraries.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/trips" className="hover:text-accent transition-colors">My Trips</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <a 
              href="mailto:ethan@ingenuitylabs.net" 
              className="flex items-center gap-2 hover:text-accent transition-colors mb-4"
            >
              <FaEnvelope />
              <span>ethan@ingenuitylabs.net</span>
            </a>
            <div className="flex gap-4 text-xl">
              <a href="#" className="hover:text-accent transition-colors"><FaTwitter /></a>
              <a href="#" className="hover:text-accent transition-colors"><FaInstagram /></a>
              <a href="#" className="hover:text-accent transition-colors"><FaFacebook /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {currentYear} AI Travel Agent. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 