import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { GlobalAudioPlayerProvider } from './src/context/GlobalAudioPlayerContext';
import GlobalMiniPlayer from './src/components/GlobalMiniPlayer';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './src/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

function SyncAuthUser() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const authUid = user.uid;
          const stored = await AsyncStorage.getItem('userId');
          if (!stored || stored !== authUid) {
            await AsyncStorage.setItem('userId', authUid);
            console.log('[SyncAuthUser] Synchronized AsyncStorage userId to auth UID');
          }
        }
      } catch (e) {
        console.warn('[SyncAuthUser] Failed to sync userId', e);
      }
    });

    return () => unsub();
  }, []);

  return null;
}

export default function App() {
  return (
    <NavigationContainer>
      <SyncAuthUser />
      <GlobalAudioPlayerProvider>
        <AppNavigator />
        <GlobalMiniPlayer />
      </GlobalAudioPlayerProvider>
    </NavigationContainer>
  );
}
