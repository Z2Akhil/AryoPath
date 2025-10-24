// src/components/AuthModal.jsx

import React, { useState } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthModal = ({ onClose }) => {
  const [view, setView] = useState('login'); // 'login', 'register', or 'forgot-password'

  const getModalTitle = () => {
    switch (view) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  return (
    <Modal title={getModalTitle()} onClose={onClose}>
      {view === 'login' ? (
        <LoginForm 
          onClose={onClose} 
          onSwitchToRegister={() => setView('register')} 
          onForgotPassword={() => setView('forgot-password')}
        />
      ) : view === 'register' ? (
        <RegisterForm 
          onClose={onClose} 
          onSwitchToLogin={() => setView('login')} 
        />
      ) : (
        <ForgotPasswordForm 
          onClose={onClose} 
          onSwitchToLogin={() => setView('login')} 
        />
      )}
    </Modal>
  );
};

export default AuthModal;
