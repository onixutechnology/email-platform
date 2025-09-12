import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const EmailContext = createContext();

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

export const EmailProvider = ({ children }) => {
  const [mailboxes, setMailboxes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener buzones
  const fetchMailboxes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mailboxes');
      setMailboxes(response.data);
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
    }
    setLoading(false);
  };

  // Enviar correo
  const sendEmail = async (emailData) => {
    try {
      const response = await api.post('/send-email', emailData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error enviando correo' 
      };
    }
  };

  const value = {
    mailboxes,
    messages,
    loading,
    fetchMailboxes,
    sendEmail
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};
