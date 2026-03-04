import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 28,
    backgroundColor: CuloriApp.bannerPrincipal,
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titlu: {
    fontSize: 24,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
    lineHeight: 34,
  },
});
