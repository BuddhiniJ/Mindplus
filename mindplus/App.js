import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { GlobalAudioPlayerProvider } from './src/context/GlobalAudioPlayerContext';
import GlobalMiniPlayer from './src/components/GlobalMiniPlayer';

export default function App() {
  return (
    <NavigationContainer>
      <GlobalAudioPlayerProvider>
        <AppNavigator />
        <GlobalMiniPlayer />
      </GlobalAudioPlayerProvider>
    </NavigationContainer>
  );
}
