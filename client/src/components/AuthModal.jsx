// src/components/AuthModal.jsx

import React, { useState } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ onClose }) => {
  const [view, setView] = useState('login'); // 'login' or 'register'

  return (
    // Modal component provides the outer white box
    <Modal onClose={onClose} showCloseButton={true}>
      {/* Two-column layout using Grid */}
      <div className="grid md:grid-cols-2">

        {/* Left Column: Form */}
        {/* MODIFIED: Added bg-white and rounded-l-lg */}
        <div className="p-8 md:p-12 bg-white rounded-l-lg"> {/* Added bg-white here */}
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

        {/* Right Column: Welcome Message & Illustration */}
        {/* This column already has its light gradient background */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8 md:p-12 text-center rounded-r-lg">
          <img
            src="https://img.freepik.com/free-vector/health-professional-team-concept-illustration_114360-1624.jpg?w=740&t=st=1720000000~exp=1720000600~hmac=..." // Replace with your illustration URL
            alt="Health Illustration"
            className="w-64 h-auto mb-6"
          />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {view === 'login' ? 'Welcome Back!' : 'Manage Your Health'}
          </h3>
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