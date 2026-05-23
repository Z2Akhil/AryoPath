'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does online consultation work?',
    a: 'Book a slot, fill in your symptoms, and connect via video or audio at the scheduled time. You receive a digital prescription right after the consultation.',
  },
  {
    q: 'Is my health data safe?',
    a: 'Yes. All consultations are end-to-end encrypted. We never share your personal health data with third parties.',
  },
  {
    q: 'Can I get a prescription online?',
    a: 'Yes, our doctors issue valid digital prescriptions after every consultation, accepted at all major pharmacies across India.',
  },
  {
    q: 'What is the free follow-up policy?',
    a: 'You can consult the same doctor again within 7 days for the same health issue, completely free of charge.',
  },
  {
    q: 'What if no doctor is available immediately?',
    a: 'You can schedule an appointment for a future slot. We also offer instant consultation with doctors who are currently online.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${open ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-gray-900 leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '200px' : '0px' }}>
        <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function ConsultFAQ() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
      </div>
    </section>
  );
}
