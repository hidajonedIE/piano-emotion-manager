import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: 'Arkhip' },
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
