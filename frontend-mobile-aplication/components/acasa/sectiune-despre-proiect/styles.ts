import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: 'center',
  },
  titlu: {
    fontSize: 30,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    marginBottom: 18,
    textAlign: 'center',
  },
  descriere: {
    fontSize: 17,
    color: CuloriApp.textPrimar,
    lineHeight: 26,
    textAlign: 'center',
  },
});
