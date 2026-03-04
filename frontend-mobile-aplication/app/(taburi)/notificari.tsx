import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CuloriApp } from '@/constants/culori';

export default function EcranNotificari() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.titlu}>Notificari</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlu: {
    fontSize: 24,
    fontWeight: '600',
    color: CuloriApp.textPrimar,
  },
});
