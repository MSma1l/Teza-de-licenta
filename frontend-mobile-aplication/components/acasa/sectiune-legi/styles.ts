import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titluSectiune: {
    fontSize: 22,
    fontWeight: '600',
    color: CuloriApp.textPrimar,
    marginBottom: 18,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  continutScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cardLege: {
    width: 260,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  titluLege: {
    fontSize: 17,
    fontWeight: '600',
    color: CuloriApp.textPrimar,
    marginTop: 12,
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  descriereLege: {
    fontSize: 15,
    color: CuloriApp.textSecundar,
    lineHeight: 22,
  },
  butonCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 16,
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
