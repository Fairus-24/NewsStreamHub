import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Newspaper } from 'lucide-react';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn, 
  FaPaperPlane
} from 'react-icons/fa';

const categories = [
  { slug: 'politics', name: 'Politics' },
  { slug: 'business', name: 'Business' },
  { slug: 'technology', name: 'Technology' },
  { slug: 'entertainment', name: 'Entertainment' },
  { slug: 'science', name: 'Science' },
  { slug: 'health', name: 'Health' },
  { slug: 'sports', name: 'Sports' },
];

const quickLinks = [
  { href: '#', name: 'About Us' },
  { href: '#', name: 'Contact' },
  { href: '#', name: 'Privacy Policy' },
  { href: '#', name: 'Terms of Use' },
  { href: '#', name: 'Advertise' },
  { href: '#', name: 'Careers' },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Newspaper className="text-white text-3xl mr-2" />
              <h2 className="font-headline font-bold text-2xl">NewsHub</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Your trusted source for comprehensive news coverage, in-depth analysis, 
              and timely updates from around the globe.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-accent" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="#" className="text-white hover:text-accent" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#" className="text-white hover:text-accent" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" className="text-white hover:text-accent" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-headline font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`}>
                    <a className="text-gray-300 hover:text-white">{category.name}</a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-300 hover:text-white">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline font-bold text-lg mb-4">Subscribe</h3>
            <p className="text-gray-300 mb-4">Get weekly updates and breaking news alerts.</p>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="rounded-l-md rounded-r-none border-0 text-text"
              />
              <Button type="submit" variant="accent" size="icon" className="rounded-l-none">
                <FaPaperPlane />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} NewsHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
