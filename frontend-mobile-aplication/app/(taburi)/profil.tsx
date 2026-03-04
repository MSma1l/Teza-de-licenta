import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CuloriApp } from '@/constants/culori';
import { useAutentificare } from '@/hooks/use-autentificare';

export default function EcranProfil() {
  const insets = useSafeAreaInsets();
  const { delogare } = useAutentificare();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.titlu}>Profil</Text>
      <Pressable onPress={delogare} style={styles.butonDelogare}>
        <Text style={styles.textDelogare}>Delogare</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  titlu: {
    fontSize: 24,
    fontWeight: '600',
    color: CuloriApp.textPrimar,
  },
  butonDelogare: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  textDelogare: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
