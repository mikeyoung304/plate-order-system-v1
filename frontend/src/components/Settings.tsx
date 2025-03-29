import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Cog6ToothIcon,
  BellIcon,
  KeyIcon,
  MicrophoneIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Settings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  voice_recognition_enabled: boolean;
  analytics_enabled: boolean;
  api_key: string;
  deepgram_api_key: string;
}

export const Settings: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: currentSettings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axios.get<Settings>('/api/settings');
      return response.data;
    },
  });

  // Update settings when currentSettings changes
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Settings) => {
      const response = await axios.put<Settings>('/api/settings', newSettings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsEditing(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    },
    onError: () => {
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    },
  });

  const handleSave = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  const handleCancel = () => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
    setIsEditing(false);
  };

  const handleChange = (key: keyof Settings, value: boolean | string) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : null);
    setIsEditing(true);
  };

  const settingsSections = [
    {
      title: 'General Settings',
      icon: Cog6ToothIcon,
      description: 'Configure basic application preferences',
      settings: [
        {
          key: 'notifications_enabled',
          label: 'Enable Notifications',
          type: 'toggle',
          description: 'Receive notifications for new orders and updates',
        },
        {
          key: 'sound_enabled',
          label: 'Enable Sound',
          type: 'toggle',
          description: 'Play sound effects for notifications',
        },
      ],
    },
    {
      title: 'Voice Recognition',
      icon: MicrophoneIcon,
      description: 'Configure voice input and transcription settings',
      settings: [
        {
          key: 'voice_recognition_enabled',
          label: 'Enable Voice Recognition',
          type: 'toggle',
          description: 'Allow voice input for orders',
        },
        {
          key: 'deepgram_api_key',
          label: 'Deepgram API Key',
          type: 'password',
          description: 'API key for voice recognition service',
        },
      ],
    },
    {
      title: 'Analytics',
      icon: ChartBarIcon,
      description: 'Configure data collection and usage analytics',
      settings: [
        {
          key: 'analytics_enabled',
          label: 'Enable Analytics',
          type: 'toggle',
          description: 'Collect usage data for improvement',
        },
      ],
    },
    {
      title: 'API Settings',
      icon: KeyIcon,
      description: 'Manage API keys and authentication',
      settings: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          description: 'Key for accessing the API',
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <nav className="space-y-1">
                {settingsSections.map((section, index) => (
                  <button
                    key={section.title}
                    onClick={() => setActiveSection(index)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeSection === index
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {settingsSections[activeSection].title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {settingsSections[activeSection].description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Save Changes
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                {settingsSections[activeSection].settings.map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between">
                    <div className="flex-1 pr-8">
                      <label
                        htmlFor={setting.key}
                        className="block text-sm font-medium text-gray-700"
                      >
                        {setting.label}
                      </label>
                      <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <div className="flex items-center">
                      {setting.type === 'toggle' ? (
                        <button
                          type="button"
                          id={setting.key}
                          role="switch"
                          aria-checked={Boolean(settings?.[setting.key as keyof Settings])}
                          onClick={() =>
                            handleChange(
                              setting.key as keyof Settings,
                              !settings?.[setting.key as keyof Settings]
                            )
                          }
                          className={`${
                            settings?.[setting.key as keyof Settings]
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                          <span
                            aria-hidden="true"
                            className={`${
                              settings?.[setting.key as keyof Settings]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      ) : (
                        <div className="relative">
                          <input
                            type={setting.type}
                            id={setting.key}
                            value={String(settings?.[setting.key as keyof Settings] || '')}
                            onChange={(e) =>
                              handleChange(setting.key as keyof Settings, e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              Settings saved successfully
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {showErrorToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <XMarkIcon className="h-5 w-5 mr-2" />
              Failed to save settings
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 