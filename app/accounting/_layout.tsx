import { Stack } from 'expo-router';

export default function AccountingLayout() {
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
