import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@piano_emotion_whats_new_version';
const CURRENT_VERSION = '1.5.0'; // Actualizar cuando se añadan nuevas funcionalidades

export function useWhatsNew() {
  const [hasUnseenUpdates, setHasUnseenUpdates] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const lastSeenVersion = await AsyncStorage.getItem(STORAGE_KEY);
      setHasUnseenUpdates(lastSeenVersion !== CURRENT_VERSION);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const markAsSeen = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
      setHasUnseenUpdates(false);
    } catch (error) {
    }
  };

  return {
    hasUnseenUpdates,
    loading,
    markAsSeen,
    currentVersion: CURRENT_VERSION,
  };
}
