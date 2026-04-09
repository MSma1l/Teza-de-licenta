import { StyleSheet, Platform } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: 40,
    height: 64,
    width: '100%',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  containerWeb: {
    backgroundColor: 'rgba(242, 242, 242, 0.85)',
  },
  suprapunereBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === 'android'
        ? 'rgba(242, 242, 242, 0.70)'
        : 'rgba(242, 242, 242, 0.30)',
  },
  butonTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  butonCreare: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cercCreare: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CuloriApp.primar,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
