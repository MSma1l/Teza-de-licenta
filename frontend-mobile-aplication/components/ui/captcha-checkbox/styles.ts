import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: CuloriApp.fundalInput,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CuloriApp.borduraInput,
    marginBottom: 16,
  },
  containerEroare: {
    borderColor: CuloriApp.eroare,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CuloriApp.bordura,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.fundal,
  },
  checkboxValidat: {
    backgroundColor: CuloriApp.succes,
    borderColor: CuloriApp.succes,
  },
  checkboxSeVerifica: {
    borderColor: CuloriApp.textEstompat,
  },
  text: {
    fontSize: 15,
    color: CuloriApp.textPrimar,
    flex: 1,
  },
  textEroare: {
    color: CuloriApp.eroare,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});
