/**
 * Ecran Securitate 2FA
 *
 * Afiseaza provocarile 2FA in asteptare.
 * Cand userul vrea sa faca o actiune sensibila pe Web,
 * web genereaza un cod 10-99, apare aici, user introduce codul.
 *
 * Acest tab inlocuieste fostul "Notificari" pentru ca rolul mobile e
 * de a fi confirmare 2FA pentru Web.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CuloriApp } from '@/constants/culori';
import {
  obtineProvocariPending,
  verificaCod2FA,
  type ProvocarePending,
} from '@/lib/api/serviciu-2fa';
import { OpenOnWeb } from '@/components/open-on-web';

const TRADUCERI_ACTIUNI: Record<string, string> = {
  create_report: 'Creare raport',
  delete_document: 'Stergere document',
  delete_report: 'Stergere raport',
  modify_settings: 'Modificare setari',
  change_password: 'Schimbare parola',
  approve_document: 'Aprobare document',
};

function formateazaTimpRamas(expiresAt: string): string {
  const expirare = new Date(expiresAt).getTime();
  const acum = Date.now();
  const diff = Math.max(0, Math.floor((expirare - acum) / 1000));
  if (diff <= 0) return 'Expirat';
  const min = Math.floor(diff / 60);
  const sec = diff % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function CardProvocare({
  provocare,
  laVerificare,
}: {
  provocare: ProvocarePending;
  laVerificare: () => void;
}) {
  const [cod, setCod] = useState('');
  const [seVerifica, setSeVerifica] = useState(false);
  const [eroare, setEroare] = useState('');
  const [timpRamas, setTimpRamas] = useState(formateazaTimpRamas(provocare.expires_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimpRamas(formateazaTimpRamas(provocare.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [provocare.expires_at]);

  const trimite = async () => {
    setEroare('');
    const codNumar = parseInt(cod, 10);
    if (Number.isNaN(codNumar) || codNumar < 10 || codNumar > 99) {
      setEroare('Codul trebuie sa aiba 2 cifre (10-99)');
      return;
    }
    setSeVerifica(true);
    try {
      await verificaCod2FA(provocare.id, codNumar);
      Alert.alert('Confirmat', 'Actiunea a fost autorizata pe web', [
        { text: 'OK', onPress: laVerificare },
      ]);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : 'Cod incorect';
      setEroare(mesaj);
    } finally {
      setSeVerifica(false);
    }
  };

  const titlu = TRADUCERI_ACTIUNI[provocare.action_type] || provocare.action_type;
  const expirat = timpRamas === 'Expirat';

  return (
    <View style={stiluri.cardProvocare}>
      <View style={stiluri.cardAntet}>
        <View style={stiluri.cardIconWrap}>
          <Ionicons name="shield-checkmark" size={22} color={CuloriApp.primar} />
        </View>
        <View style={stiluri.cardAntetText}>
          <Text style={stiluri.cardTitlu}>{titlu}</Text>
          {provocare.action_description && (
            <Text style={stiluri.cardDescriere} numberOfLines={2}>
              {provocare.action_description}
            </Text>
          )}
        </View>
        <View style={[stiluri.cardTimer, expirat && stiluri.cardTimerExpirat]}>
          <Ionicons
            name="time-outline"
            size={12}
            color={expirat ? CuloriApp.eroare : CuloriApp.primar}
          />
          <Text
            style={[
              stiluri.cardTimerText,
              expirat && { color: CuloriApp.eroare },
            ]}
          >
            {timpRamas}
          </Text>
        </View>
      </View>

      <View style={stiluri.separator} />

      <Text style={stiluri.instructiune}>
        Introdu codul de pe pagina web pentru a confirma actiunea
      </Text>

      <View style={stiluri.inputCodWrap}>
        <TextInput
          style={stiluri.inputCod}
          value={cod}
          onChangeText={(v) => setCod(v.replace(/[^0-9]/g, '').slice(0, 2))}
          placeholder="00"
          placeholderTextColor={CuloriApp.textEstompat}
          keyboardType="number-pad"
          maxLength={2}
          editable={!expirat && !seVerifica}
        />
      </View>

      {eroare !== '' && <Text style={stiluri.eroareText}>{eroare}</Text>}

      <TouchableOpacity
        style={[stiluri.butonConfirma, (expirat || seVerifica || cod.length < 2) && stiluri.butonDezactivat]}
        onPress={trimite}
        disabled={expirat || seVerifica || cod.length < 2}
        activeOpacity={0.85}
      >
        {seVerifica ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={stiluri.butonConfirmaText}>Confirma actiunea</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function EcranSecuritate() {
  const insets = useSafeAreaInsets();
  const [provocari, setProvocari] = useState<ProvocarePending[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [reincarcare, setReincarcare] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const incarca = useCallback(async () => {
    try {
      const date = await obtineProvocariPending();
      setProvocari(date);
    } catch {
      setProvocari([]);
    } finally {
      setSeIncarca(false);
      setReincarcare(false);
    }
  }, []);

  useEffect(() => {
    incarca();
    intervalRef.current = setInterval(incarca, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [incarca]);

  return (
    <View style={[stiluri.container, { paddingTop: insets.top }]}>
      <View style={stiluri.antet}>
        <View style={stiluri.antetIconWrap}>
          <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={stiluri.antetTitlu}>Securitate</Text>
          <Text style={stiluri.antetSubtitlu}>Confirma actiuni de pe web</Text>
        </View>
        <OpenOnWeb cale="/signin" varianta="icon" />
      </View>

      <ScrollView
        style={stiluri.scroll}
        contentContainerStyle={stiluri.continutScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={reincarcare}
            onRefresh={() => {
              setReincarcare(true);
              incarca();
            }}
            tintColor={CuloriApp.primar}
            colors={[CuloriApp.primar]}
          />
        }
      >
        {seIncarca ? (
          <View style={stiluri.stareIncarcare}>
            <ActivityIndicator color={CuloriApp.primar} size="large" />
          </View>
        ) : provocari.length === 0 ? (
          <>
            <View style={stiluri.stareGoala}>
              <View style={stiluri.stareGoalaIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={48} color={CuloriApp.primar} />
              </View>
              <Text style={stiluri.stareGoalaTitlu}>Nicio actiune in asteptare</Text>
              <Text style={stiluri.stareGoalaText}>
                Cand vei face o actiune sensibila pe web, va aparea aici un cod de confirmare pe care va trebui sa il introduci.
              </Text>
              <View style={stiluri.cardInfo}>
                <Ionicons name="information-circle" size={18} color={CuloriApp.info} />
                <Text style={stiluri.cardInfoText}>
                  Acest sistem 2FA protejeaza contul de actiuni neautorizate
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <OpenOnWeb
                cale="/signin"
                varianta="card"
                text="Logare pe web prin QR"
                descriere="Deschide pagina de login pe web pentru a o scana"
              />
            </View>
          </>
        ) : (
          provocari.map((p) => (
            <CardProvocare key={p.id} provocare={p} laVerificare={incarca} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
  },
  antet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  antetIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  antetTitlu: {
    fontSize: 22,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  antetSubtitlu: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  continutScroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stareIncarcare: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  stareGoala: {
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  stareGoalaIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stareGoalaTitlu: {
    fontSize: 17,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    marginBottom: 8,
    textAlign: 'center',
  },
  stareGoalaText: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CuloriApp.infoFundal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cardInfoText: {
    flex: 1,
    fontSize: 12,
    color: CuloriApp.info,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Card provocare
  cardProvocare: {
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardAntet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAntetText: {
    flex: 1,
  },
  cardTitlu: {
    fontSize: 16,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardDescriere: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 4,
    lineHeight: 16,
  },
  cardTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardTimerExpirat: {
    backgroundColor: CuloriApp.eroareFundal,
  },
  cardTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: CuloriApp.primar,
  },
  separator: {
    height: 1,
    backgroundColor: CuloriApp.separator,
    marginVertical: 16,
  },
  instructiune: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginBottom: 14,
    textAlign: 'center',
  },
  inputCodWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  inputCod: {
    width: 120,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CuloriApp.bordura,
    backgroundColor: CuloriApp.fundalInput,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
    letterSpacing: 4,
  },
  eroareText: {
    fontSize: 12,
    color: CuloriApp.eroare,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  butonConfirma: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CuloriApp.primar,
    height: 50,
    borderRadius: 14,
  },
  butonDezactivat: {
    backgroundColor: CuloriApp.textEstompat,
  },
  butonConfirmaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
