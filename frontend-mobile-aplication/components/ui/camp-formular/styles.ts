import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CuloriApp.fundalInput,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CuloriApp.borduraInput,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  containerInputFocus: {
    borderColor: CuloriApp.borduraInputFocus,
  },
  containerInputEroare: {
    borderColor: CuloriApp.eroare,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: CuloriApp.textPrimar,
  },
  textEroare: {
    color: CuloriApp.eroare,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});
