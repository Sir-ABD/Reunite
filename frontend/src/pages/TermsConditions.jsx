import React from 'react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
        <h1 className="text-4xl font-black mb-8 italic tracking-tighter text-blue-900 dark:text-blue-400 border-l-8 border-blue-600 pl-4">
          Terms & Conditions
        </h1>
        
        <div className="space-y-6 text-base leading-relaxed opacity-90">
          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">1. Agreement to Terms</h2>
            <p>By accessing or using the Reunite portal, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, then you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">2. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">3. Posting Policy</h2>
            <p>When posting items (Lost or Found), you agree to provide accurate and truthful information. Misleading or fraudulent posts may result in account suspension or university disciplinary action.</p>
            <p className="mt-2 font-bold text-red-600 text-xs">Note: Verification via OTP or administrative approval is required for item returns.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">4. Prohibited Activities</h2>
            <p>You may not use the portal for any illegal purpose or in violation of any local, state, or national laws. This includes harassment of other users, posting offensive content, or attempting to compromise the system security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">5. Limitation of Liability</h2>
            <p>Federal University Dutse and the Reunite development team shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 tracking-tight">6. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
