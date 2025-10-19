// src/components/AuthModal.jsx

import React, { useState } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ onClose }) => {
  const [view, setView] = useState('login'); // 'login' or 'register'

  return (
    <Modal title={view === 'login' ? 'Login' : 'Create Account'} onClose={onClose}>
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
    </Modal>
  );
};

export default AuthModal;