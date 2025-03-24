'use client';
import { useState } from 'react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // In a real implementation, you would send this data to your backend
      // For now, we'll simulate a successful submission
      console.log('Form submitted:', formData);
      console.log('Would send to: anik3d@gmail.com');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear form
      setFormData({ name: '', email: '', message: '' });
      setSubmitStatus('success');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-5xl font-bold mb-16 text-center uppercase tracking-wider font-montreal text-black">Contact Us</h2>
        
        <div className="max-w-2xl mx-auto">
          {submitStatus === 'success' ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="text-2xl font-medium mb-3 text-black font-montreal">Message Sent</h3>
              <p className="text-lg mb-8 text-black font-montreal">Thank you for reaching out. We'll get back to you soon.</p>
              <button 
                onClick={() => setSubmitStatus('idle')} 
                className="text-black border-b-2 border-black px-4 py-2 hover:px-6 transition-all duration-300 font-montreal"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label htmlFor="name" className="block mb-3 text-sm uppercase tracking-wider font-light text-black font-montreal">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-0 py-3 bg-transparent border-b-2 border-black focus:outline-none focus:border-gray-600 transition-colors text-black placeholder:text-gray-400 font-montreal"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="group">
                  <label htmlFor="email" className="block mb-3 text-sm uppercase tracking-wider font-light text-black font-montreal">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-0 py-3 bg-transparent border-b-2 border-black focus:outline-none focus:border-gray-600 transition-colors text-black placeholder:text-gray-400 font-montreal"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="group">
                <label htmlFor="message" className="block mb-3 text-sm uppercase tracking-wider font-light text-black font-montreal">
                  Your Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-black focus:outline-none focus:border-gray-600 transition-colors resize-none text-black placeholder:text-gray-400 font-montreal"
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-black font-montreal">
                  <p>Or email us directly at: <a href="mailto:anik3d@gmail.com" className="border-b border-black hover:border-gray-600 transition-colors">anik3d@gmail.com</a></p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex items-center gap-3 px-6 py-3 border-b-2 border-black text-black hover:gap-5 transition-all duration-300 disabled:opacity-50 font-montreal"
                >
                  <span className="text-lg font-medium">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              </div>
              
              {submitStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg font-montreal">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}