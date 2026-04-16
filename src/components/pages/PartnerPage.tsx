'use client';

import { useState } from 'react';
import { Handshake, Eye, EyeOff } from 'lucide-react';
import AddressSelector, { AddressValue } from '@/components/ui/AddressSelector';
import AddressSelector, { AddressValue } from '@/components/ui/AddressSelector';

interface PartnerPageProps {
  onNavigate: (view: string) => void;
}

export default function PartnerPage({ onNavigate }: PartnerPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    contactName: '', organization: '',
    phone: '', website: '', message: '', email: '', password: '', confirmPassword: '',
  });
  const [address, setAddress] = useState<AddressValue>({
    address: '', country: 'US', state: '', city: '', zip: '',
  });
  const [address, setAddress] = useState<AddressValue>({
    address: '', country: 'US', state: '', city: '', zip: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.contactName || !form.email || !form.password) {
      alert('Please fill in required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-6">Thank you for your interest in partnering with HOOX. We'll review your application and reach out within 2-3 business days.</p>
          <button onClick={() => onNavigate('home')} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 py-14 px-4 text-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Handshake className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Become a Partner</h1>
        <p className="text-blue-100 text-lg max-w-lg mx-auto">Join our network of tournament partners and sponsors to reach thousands of passionate anglers</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Partner with us!</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Join our network of tournament partners</p>

          {/* Section: About You */}
          <h3 className="font-semibold text-gray-800 mb-4">Tell us about you</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Enter contact person name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
              <input name="organization" value={form.organization} onChange={handleChange} placeholder="Enter your organization name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <AddressSelector
                value={address}
                onChange={setAddress}
                inputClass="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                labelClass="block text-sm font-medium text-gray-700 mb-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 123-4567" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL *</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://www.example.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your organization and sponsorship interests" rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>
          </div>

          {/* Section: Create Account */}
          <h3 className="font-semibold text-gray-800 mb-4">Create an account</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter your email" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Enter password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
                <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition mb-3">
            Submit Application & Create Account
          </button>
          <button onClick={() => onNavigate('login')} className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm">
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}
