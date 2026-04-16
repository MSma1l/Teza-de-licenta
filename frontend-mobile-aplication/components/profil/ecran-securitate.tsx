/**
 * Ecran „Securitate” — hub accesibil direct din Profil.
 * Actiuni de securitate la un singur tap:
 *   - Conecteaza web prin QR  (scanner instant)
 *   - Provocari 2FA           (confirmari actiuni web)
 *
 * Separat de ecranul 2FA ca sa nu fie nevoie sa navighezi prin el ca sa scanezi QR-ul.
 */
import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuloriApp } from '@/constants/culori';
import { ScanerQrWeb } from '@/components/scaner-qr-web';

interface Props {
  laInchidere: () => void;
  laDeschide2FA: () => void;
}

export function EcranSecuritate({ laInchidere, laDeschide2FA }: Props) {
  const insets = useSafeAreaInsets();
  const [vizibilScaner, setVizibilScaner] = useState(false);

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable onPress={laInchidere} hitSlop={16} style={s.butonInapoi}>
            <Ionicons name="arrow-back" size={22} color={CuloriApp.textPrimar} />
          </Pressable>
          <Text style={s.titlu}>Securitate</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={s.subtitlu}>Actiuni rapide pentru contul tau</Text>

        {/* Card principal: login web prin QR */}
        <Pressable
          onPress={() => setVizibilScaner(true)}
          style={({ pressed }) => [s.cardMare, pressed && { opacity: 0.92 }]}
        >
          <View style={s.cardMareIcon}>
            <Ionicons name="qr-code" size={30} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardMareTitlu}>Conecteaza web prin QR</Text>
            <Text style={s.cardMareDescriere}>
              Scaneaza codul de pe pagina de login si intra pe laptop instant, fara parola.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </Pressable>

        {/* Card 2FA */}
        <Pressable
          onPress={laDeschide2FA}
          style={({ pressed }) => [s.cardItem, pressed && { opacity: 0.85 }]}
        >
          <View style={[s.cardIcon, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={CuloriApp.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitlu}>Provocari 2FA</Text>
            <Text style={s.cardDescriere}>
              Confirma actiuni sensibile initiate pe web (logare, schimbare parola, descarcare).
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={CuloriApp.textEstompat} />
        </Pressable>

        {/* Info box */}
        <View style={s.info}>
          <Ionicons name="information-circle" size={18} color={CuloriApp.info} />
          <Text style={s.infoText}>
            Datele scanate raman pe telefon — la server trimitem doar tokenul sesiunii
            pe care o aprobi tu.
          </Text>
        </View>
      </ScrollView>

      <ScanerQrWeb
        vizibil={vizibilScaner}
        laInchide={() => setVizibilScaner(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 44,
  },
  butonInapoi: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderWidth: 1, borderColor: CuloriApp.bordura,
  },
  titlu: { fontSize: 20, fontWeight: '800', color: CuloriApp.textPrimar },
  subtitlu: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginBottom: 18,
  },

  cardMare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CuloriApp.primar,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  cardMareIcon: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardMareTitlu: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardMareDescriere: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    lineHeight: 17,
  },

  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitlu: { fontSize: 15, fontWeight: '700', color: CuloriApp.textPrimar },
  cardDescriere: { fontSize: 12, color: CuloriApp.textSecundar, marginTop: 2, lineHeight: 16 },

  info: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: CuloriApp.infoFundal,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: CuloriApp.textSecundar,
    lineHeight: 17,
  },
});
