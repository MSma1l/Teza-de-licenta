import { StyleSheet, Platform } from 'react-native';

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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
