import { Stack } from 'expo-router';

export default function TeamsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: 'Arkhip' },
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}
