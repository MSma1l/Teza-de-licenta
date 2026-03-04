import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  card: {
    width: 300,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  titluCard: {
    fontSize: 20,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
    marginBottom: 20,
  },
  elementBifat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CuloriApp.separator,
  },
  textBifat: {
    fontSize: 16,
    color: CuloriApp.textSecundar,
    flex: 1,
  },
});
