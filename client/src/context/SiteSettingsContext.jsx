import React, { createContext, useContext, useState, useEffect } from 'react';
import siteSettings from '../api/siteSettingsApi';

const SiteSettingsContext = createContext();

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await siteSettings();
        if (data) {
          setSettings(data);
        } else {
          setError('Failed to load site settings');
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
        setError('Failed to load site settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const value = {
    settings,
    loading,
    error,
    refreshSettings: async () => {
      try {
        setLoading(true);
        const data = await siteSettings();
        if (data) {
          setSettings(data);
          setError(null);
        } else {
          setError('Failed to refresh site settings');
        }
      } catch (err) {
        console.error('Error refreshing site settings:', err);
        setError('Failed to refresh site settings');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
