import { StyleSheet } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundal,
  },
  continutScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  titlu: {
    fontSize: 36,
    fontWeight: '300',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitlu: {
    fontSize: 18,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    marginBottom: 48,
  },
  formular: {
    marginBottom: 24,
  },
  linkParolaUitata: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  textParolaUitata: {
    fontSize: 15,
    color: CuloriApp.textEstompat,
  },
  containerButon: {
    marginTop: 32,
    alignItems: 'center',
  },
  containerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  textLink: {
    fontSize: 16,
    color: CuloriApp.textSecundar,
  },
  textLinkActiv: {
    fontSize: 16,
    color: CuloriApp.textPrimar,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
