import { StyleSheet, Platform } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Stare -> fara permisiuni
  stareContainer: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  stareTitlu: {
    fontSize: 22,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
  },
  stareText: {
    fontSize: 14,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    lineHeight: 20,
  },
  stareButon: {
    marginTop: 12,
    backgroundColor: CuloriApp.primar,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  stareButonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  stareButonSec: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  stareButonSecText: {
    color: CuloriApp.textSecundar,
    fontWeight: '600',
    fontSize: 14,
  },

  // Camera
  camera: {
    flex: 1,
  },
  antet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  antetTitlu: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  antetSubtitlu: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  butonAntet: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Ghidaj document
  ghidajContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghidajCadru: {
    width: '86%',
    aspectRatio: 0.707, // A4 portrait
    borderWidth: 0,
    position: 'relative',
  },
  colt: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#0ea5e9',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  coltSS: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  coltSD: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  coltJS: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  coltJD: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },

  ghidajHint: {
    position: 'absolute',
    top: 72,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  ghidajHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Bara de jos cu controale
  bara: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  butonMic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterCerc: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shutterCercIntern: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  shutterCercApasat: {
    opacity: 0.7,
  },

  // Preview
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImagine: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  previewBara: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 12,
  },
  previewRand: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewActiune: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewActiuneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewFinal: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButonSec: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  previewButonSecText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  previewButonPrincipal: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: CuloriApp.primar, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  previewButonPrincipalText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
