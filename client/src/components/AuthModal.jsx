// src/components/AuthModal.jsx

import React, { useState } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ onClose }) => {
  const [view, setView] = useState('login'); // 'login' or 'register'

  return (
    <Modal onClose={onClose} showCloseButton={true}>
      <div className="grid md:grid-cols-2">

        {/* Left Column: Form */}
        <div className="p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
             {view === 'login' ? 'Login' : 'Create Account'}
          </h2>
          {view === 'login' ? (
            <LoginForm
              onClose={onClose}
              onSwitchToRegister={() => setView('register')}
            />
          ) : (
            <RegisterForm
              onClose={onClose}
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>

        {/* Right Column: Thyrocare Message & Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8 md:p-12 text-center rounded-r-lg">
          {/* MODIFIED: Use a health/diagnostics related illustration */}
          <img
            src="https://img.freepik.com/free-vector/health-professional-team-concept-illustration_114360-1624.jpg?w=740&t=st=1720000000~exp=1720000600~hmac=..." // Replace with a high-quality illustration URL
            alt="Health Illustration"
            className="w-64 h-auto mb-6"
          />
          {/* MODIFIED: Updated Titles */}
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {view === 'login' ? 'Welcome Back!' : 'Manage Your Health'}
          </h3>
          {/* MODIFIED: Updated Messages */}
          <p className="text-gray-600">
            {view === 'login'
              ? 'Access your Thyrocare reports and manage your health profile.'
              : 'Sign up to easily book tests, view reports, and track your health journey.'}
          </p>
        </div>

      </div>
    </Modal>
  );
};

export default AuthModal;