import { StyleSheet, Platform } from 'react-native';
import { CuloriApp } from '@/constants/culori';

export const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
  },
  scroll: {
    flex: 1,
  },
  continutScroll: {
    paddingBottom: 120,
  },

  // Header
  antet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  antetText: {
    flex: 1,
  },
  salutare: {
    fontSize: 14,
    color: CuloriApp.textSecundar,
    fontWeight: '500',
  },
  numeUtilizator: {
    fontSize: 24,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Banner AI
  bannerAi: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: CuloriApp.primar,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bannerAiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CuloriApp.secundar,
    opacity: 0.45,
  },
  bannerAiContinut: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  bannerAiIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAiText: {
    flex: 1,
  },
  bannerAiTitlu: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerAiSubtitlu: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 18,
  },

  // Actiuni rapide
  actiuniRapide: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 28,
    gap: 12,
  },
  actiuneRapida: {
    flex: 1,
    alignItems: 'center',
  },
  actiuneIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actiuneText: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    fontWeight: '600',
  },

  // Sectiune conversatii
  sectiuneConversatii: {
    paddingHorizontal: 20,
  },
  antetSectiune: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titluSectiune: {
    fontSize: 18,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  linkVeziToate: {
    fontSize: 14,
    color: CuloriApp.primar,
    fontWeight: '600',
  },

  // Stari
  stareIncarcare: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  stareIncarcareText: {
    color: CuloriApp.textSecundar,
    fontSize: 14,
  },
  stareGoala: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  stareGoalaIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stareGoalaTitlu: {
    fontSize: 16,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    marginBottom: 6,
  },
  stareGoalaText: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Card conversatie
  cardConversatie: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContinut: {
    flex: 1,
  },
  cardAntet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitlu: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardData: {
    fontSize: 11,
    color: CuloriApp.textEstompat,
    marginLeft: 8,
  },
  cardMesaj: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    lineHeight: 18,
  },
  eticheta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: CuloriApp.avertizareFundal,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  etichetaText: {
    fontSize: 10,
    color: CuloriApp.avertizare,
    fontWeight: '700',
  },
  cardContabil: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: CuloriApp.fundalCard,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardContabilIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardContabilTitlu: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: CuloriApp.textPrimar,
  },
  cardContabilSubtitlu: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
});
