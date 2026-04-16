/**
 * Ecran Securitate 2FA — toggle activare + lista provocari in asteptare.
 * Direct in aplicatia mobila.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CuloriApp } from '@/constants/culori';
import {
  obtineProvocariPending,
  verificaCod2FA,
  type ProvocarePending,
} from '@/lib/api/serviciu-2fa';
import { ScanerQrWeb } from '@/components/scaner-qr-web';

interface Props {
  laInchidere: () => void;
}

export function EcranSecuritate2FA({ laInchidere }: Props) {
  const insets = useSafeAreaInsets();
  const [provocari, setProvocari] = useState<ProvocarePending[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [coduri, setCoduri] = useState<Record<string, string>>({});
  const [verificareInCurs, setVerificareInCurs] = useState<string | null>(null);
  const [vizibilScanerQr, setVizibilScanerQr] = useState(false);

  const incarcaProvocari = useCallback(async () => {
    setSeIncarca(true);
    try {
      const lista = await obtineProvocariPending();
      setProvocari(lista);
    } catch { /* ignore */ }
    finally { setSeIncarca(false); }
  }, []);

  useEffect(() => {
    incarcaProvocari();
    // Refresh la 5 sec pentru a vedea provocari noi
    const interval = setInterval(incarcaProvocari, 5000);
    return () => clearInterval(interval);
  }, [incarcaProvocari]);

  const handleVerifica = async (id: string) => {
    const cod = coduri[id];
    if (!cod || cod.length !== 6) {
      Alert.alert('Eroare', 'Introdu codul de 6 cifre');
      return;
    }
    setVerificareInCurs(id);
    try {
      await verificaCod2FA(id, parseInt(cod, 10));
      Alert.alert('Succes', 'Provocarea a fost confirmata!');
      incarcaProvocari();
    } catch (err) {
      Alert.alert('Eroare', err instanceof Error ? err.message : 'Cod incorect');
    } finally {
      setVerificareInCurs(null);
    }
  };

  const renderProvocare = ({ item }: { item: ProvocarePending }) => {
    const timpRamas = Math.max(0, Math.floor((new Date(item.expires_at).getTime() - Date.now()) / 1000));
    const min = Math.floor(timpRamas / 60);
    const sec = timpRamas % 60;

    return (
      <View style={s.cardProvocare}>
        <View style={s.cardHeader}>
          <View style={s.cardIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitlu}>{item.action_type === 'login_2fa' ? 'Confirmare logare' : item.action_type}</Text>
            {item.action_description && <Text style={s.cardDescriere}>{item.action_description}</Text>}
          </View>
          <Text style={s.timer}>{min}:{sec.toString().padStart(2, '0')}</Text>
        </View>

        {/* Input cod */}
        <View style={s.codRow}>
          <View style={s.codInputWrap}>
            <Ionicons name="keypad-outline" size={18} color={CuloriApp.textEstompat} />
            <View style={s.codInput}>
              {/* TextInput nativ */}
              <Text style={s.codLabel}>Cod 6 cifre:</Text>
              <Pressable style={s.codField}>
                <Text
                  style={[s.codValue, !coduri[item.id] && { color: CuloriApp.textEstompat }]}
                  onPress={() => {
                    Alert.prompt?.(
                      'Introdu codul',
                      'Codul de 6 cifre afisat pe web:',
                      (text) => setCoduri((p) => ({ ...p, [item.id]: text.replace(/\D/g, '').slice(0, 6) })),
                      'plain-text',
                      coduri[item.id] || '',
                      'number-pad',
                    ) || setCoduri((p) => ({ ...p, [item.id]: prompt('Codul de 6 cifre:') || '' }));
                  }}
                >
                  {coduri[item.id] || '______'}
                </Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => handleVerifica(item.id)}
            disabled={verificareInCurs === item.id}
            style={({ pressed }) => [s.butonConfirma, pressed && { opacity: 0.8 }]}
          >
            {verificareInCurs === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      <View style={s.header}>
        <Pressable onPress={laInchidere} hitSlop={16} style={s.butonInapoi}>
          <Ionicons name="arrow-back" size={22} color={CuloriApp.textPrimar} />
        </Pressable>
        <Text style={s.titlu}>Securitate 2FA</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <View style={s.infoCard}>
        <Ionicons name="information-circle" size={20} color={CuloriApp.info} />
        <Text style={s.infoText}>
          Cand faci o actiune sensibila pe web (logare, schimbare parola, descarcare raport), aici apare un cod de confirmare.
        </Text>
      </View>

      {/* Card conectare web prin QR */}
      <Pressable
        onPress={() => setVizibilScanerQr(true)}
        style={({ pressed }) => [s.cardQr, pressed && { opacity: 0.9 }]}
      >
        <View style={s.cardQrIcon}>
          <Ionicons name="qr-code" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardQrTitlu}>Conecteaza web prin QR</Text>
          <Text style={s.cardQrDescriere}>
            Scaneaza QR-ul din pagina de login web si intra instant, fara parola
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </Pressable>

      <Text style={s.subtitlu}>
        Provocari in asteptare ({provocari.length})
      </Text>

      {seIncarca && provocari.length === 0 ? (
        <View style={s.centrat}>
          <ActivityIndicator size="large" color={CuloriApp.primar} />
        </View>
      ) : provocari.length === 0 ? (
        <View style={s.centrat}>
          <Ionicons name="shield-checkmark-outline" size={56} color={CuloriApp.textEstompat} />
          <Text style={s.golText}>Nicio actiune in asteptare</Text>
          <Text style={s.golSubtext}>Totul este in ordine</Text>
        </View>
      ) : (
        <FlatList
          data={provocari}
          keyExtractor={(item) => item.id}
          renderItem={renderProvocare}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <ScanerQrWeb
        vizibil={vizibilScanerQr}
        laInchide={() => setVizibilScanerQr(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CuloriApp.fundalSecundar, paddingHorizontal: 20, paddingBottom: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, minHeight: 44,
  },
  butonInapoi: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: CuloriApp.fundalCard,
    borderWidth: 1, borderColor: CuloriApp.bordura,
  },
  titlu: { fontSize: 20, fontWeight: '800', color: CuloriApp.textPrimar },
  subtitlu: { fontSize: 14, fontWeight: '700', color: CuloriApp.textSecundar, marginBottom: 12 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: CuloriApp.infoFundal, borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#bae6fd',
  },
  infoText: { flex: 1, fontSize: 13, color: CuloriApp.textSecundar, lineHeight: 18 },
  centrat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 40 },
  golText: { fontSize: 16, fontWeight: '700', color: CuloriApp.textEstompat },
  golSubtext: { fontSize: 13, color: CuloriApp.textEstompat },
  cardProvocare: {
    backgroundColor: CuloriApp.fundalCard, borderRadius: 18, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: CuloriApp.primar, alignItems: 'center', justifyContent: 'center',
  },
  cardTitlu: { fontSize: 15, fontWeight: '700', color: CuloriApp.textPrimar },
  cardDescriere: { fontSize: 12, color: CuloriApp.textSecundar, marginTop: 2 },
  timer: { fontSize: 13, fontWeight: '700', color: CuloriApp.eroare },
  codRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  codInput: { flex: 1 },
  codLabel: { fontSize: 11, color: CuloriApp.textEstompat },
  codField: {
    backgroundColor: CuloriApp.fundalInput, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: CuloriApp.bordura, marginTop: 4,
  },
  codValue: { fontSize: 20, fontWeight: '800', color: CuloriApp.textPrimar, letterSpacing: 6, textAlign: 'center' },
  butonConfirma: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: CuloriApp.succes, alignItems: 'center', justifyContent: 'center',
  },

  cardQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CuloriApp.primar,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  cardQrIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardQrTitlu: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardQrDescriere: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 16 },
});
