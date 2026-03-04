import { Stack } from 'expo-router';

export default function LayoutAutentificare() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="logare" />
      <Stack.Screen name="inregistrare" />
    </Stack>
  );
}
