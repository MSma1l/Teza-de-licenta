import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  titlu: {
    fontSize: 26,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 36,
  },
  descriere: {
    fontSize: 16,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 22,
    lineHeight: 24,
  },
  butonCreare: {
    alignSelf: 'center',
    backgroundColor: CuloriApp.fundalButon,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 20,
  },
  textButonCreare: {
    fontSize: 16,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  continutScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  butonCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: CuloriApp.fundalButon,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  textCta: {
    fontSize: 14,
    fontWeight: '600',
    color: CuloriApp.textPrimar,
  },
});
