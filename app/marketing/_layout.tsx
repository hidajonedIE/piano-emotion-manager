import { Stack } from 'expo-router';

export default function MarketingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="campaigns" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="send" />
    </Stack>
  );
}
