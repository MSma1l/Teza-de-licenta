import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: CuloriApp.placeholderImagine,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eticheta: {
    fontSize: 12,
    color: CuloriApp.textEstompat,
    marginTop: 8,
  },
});
