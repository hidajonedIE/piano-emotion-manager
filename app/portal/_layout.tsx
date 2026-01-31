import { Stack } from 'expo-router';

export default function PortalLayout() {
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
