import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { FurnizorAutentificare } from '@/contexts/context-autentificare';
import { useAutentificare } from '@/hooks/use-autentificare';
import { CuloriApp } from '@/constants/culori';

function ProtectieRute({ children }: { children: React.ReactNode }) {
  const { esteAutentificat, seIncarca } = useAutentificare();
  const segmente = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (seIncarca) return;

    const peEcranAuth = segmente[0] === '(autentificare)';

    if (!esteAutentificat && !peEcranAuth) {
      router.replace('/(autentificare)/logare');
    } else if (esteAutentificat && peEcranAuth) {
      router.replace('/(taburi)');
    }
  }, [esteAutentificat, seIncarca, segmente]);

  if (seIncarca) {
    return (
      <View style={styles.containerIncarcare}>
        <ActivityIndicator size="large" color={CuloriApp.textPrimar} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function LayoutPrincipal() {
  return (
    <FurnizorAutentificare>
      <ProtectieRute>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(autentificare)" />
          <Stack.Screen name="(taburi)" />
        </Stack>
      </ProtectieRute>
      <StatusBar style="auto" />
    </FurnizorAutentificare>
  );
}

const styles = StyleSheet.create({
  containerIncarcare: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.fundal,
  },
});
