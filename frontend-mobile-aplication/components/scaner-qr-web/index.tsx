/**
 * Scaner QR pentru login-ul web (flux WhatsApp Web-like).
 *  1) Afiseaza camera cu ghidaj patrat peste imagine.
 *  2) Cand expo-camera detecteaza un QR, extragem qr_token.
 *  3) Aratam confirmare -> user alege Aproba / Respinge.
 *  4) Pe Aproba: POST /qr-login/approve -> web-ul e logat automat.
 *
 * Flow-ul e STRIC pt login web (nu confundam cu scanner-ul de documente).
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { CuloriApp } from '@/constants/culori';
import {
  aprobaLoginWeb,
  respingeLoginWeb,
  extrageTokenDinQr,
} from '@/lib/api/serviciu-qr-login';

interface Proprietati {
  vizibil: boolean;
  laInchide: () => void;
  /** Callback opțional după aprobare reușită — poate afișa toast în parent. */
  laAprobat?: () => void;
}

type Etapa = 'scanare' | 'confirmare' | 'trimite' | 'succes' | 'esec';

export function ScanerQrWeb({ vizibil, laInchide, laAprobat }: Proprietati) {
  const [permisiune, cerePermisiune] = useCameraPermissions();
  const [etapa, setEtapa] = useState<Etapa>('scanare');
  const [tokenCitit, setTokenCitit] = useState<string | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);
  // evita trigger-uri repetate la fiecare frame cu acelasi QR
  const ultimaScanare = useRef<{ valoare: string; la: number }>({ valoare: '', la: 0 });

  function reset() {
    setEtapa('scanare');
    setTokenCitit(null);
    setEroare(null);
    ultimaScanare.current = { valoare: '', la: 0 };
  }

  function inchide() {
    reset();
    laInchide();
  }

  const laBarcodeScanned = useCallback((e: { data: string; type: string }) => {
    // CameraView trimite multiple evenimente / sec. Il blocam dupa primul.
    if (etapa !== 'scanare') return;
    const acum = Date.now();
    if (e.data === ultimaScanare.current.valoare && acum - ultimaScanare.current.la < 1500) return;
    ultimaScanare.current = { valoare: e.data, la: acum };

    const token = extrageTokenDinQr(e.data);
    if (!token) {
      // nu e QR-ul nostru -> ignora (poate e un alt cod)
      return;
    }
    setTokenCitit(token);
    setEtapa('confirmare');
  }, [etapa]);

  async function confirmaAprobare() {
    if (!tokenCitit) return;
    setEtapa('trimite');
    setEroare(null);
    try {
      await aprobaLoginWeb(tokenCitit);
      setEtapa('succes');
      laAprobat?.();
    } catch (e: any) {
      setEroare(e?.message || 'Aprobare esuata');
      setEtapa('esec');
    }
  }

  async function confirmaRespingere() {
    if (!tokenCitit) return;
    setEtapa('trimite');
    try {
      await respingeLoginWeb(tokenCitit);
    } catch {
      // ignoram — oricum am respins local
    }
    reset();
  }

  // --- Fara permisiune camera ---
  if (vizibil && !permisiune?.granted) {
    return (
      <Modal visible={vizibil} animationType="slide" onRequestClose={inchide}>
        <View style={stiluri.stareContainer}>
          <Ionicons name="qr-code-outline" size={64} color={CuloriApp.primar} />
          <Text style={stiluri.stareTitlu}>Permisiune camera necesara</Text>
          <Text style={stiluri.stareText}>
            Ca sa te poti loga pe web prin QR, avem nevoie de acces la camera telefonului.
            Datele scanate raman pe dispozitiv — doar tokenul sesiunii merge la server.
          </Text>
          <Pressable
            style={stiluri.stareButon}
            onPress={async () => {
              const rez = await cerePermisiune();
              if (!rez.granted) {
                Alert.alert(
                  'Permisiune refuzata',
                  'Mergi in Setari > Aplicatii > AI-Contabil > Permisiuni si activeaza Camera.',
                );
              }
            }}
          >
            <Text style={stiluri.stareButonText}>Acorda permisiunea</Text>
          </Pressable>
          <Pressable style={stiluri.stareButonSec} onPress={inchide}>
            <Text style={stiluri.stareButonSecText}>Renunta</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={vizibil} animationType="slide" onRequestClose={inchide}>
      <StatusBar barStyle="light-content" />
      <View style={stiluri.container}>
        {etapa === 'scanare' ? (
          <>
            <CameraView
              style={stiluri.camera}
              facing="back"
              autofocus="on"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={laBarcodeScanned}
            />

            {/* Overlay ghidaj patrat + colturi */}
            <View pointerEvents="none" style={stiluri.overlay}>
              <View style={stiluri.overlaySus} />
              <View style={stiluri.overlayMijloc}>
                <View style={stiluri.overlayLateral} />
                <View style={stiluri.patrat}>
                  <View style={[stiluri.colt, stiluri.coltSS]} />
                  <View style={[stiluri.colt, stiluri.coltSD]} />
                  <View style={[stiluri.colt, stiluri.coltJS]} />
                  <View style={[stiluri.colt, stiluri.coltJD]} />
                </View>
                <View style={stiluri.overlayLateral} />
              </View>
              <View style={stiluri.overlayJos} />
            </View>

            {/* Antet */}
            <View
              style={[
                stiluri.antet,
                { paddingTop: Platform.OS === 'ios' ? 56 : 18 },
              ]}
            >
              <Pressable style={stiluri.butonAntet} onPress={inchide} hitSlop={10}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={stiluri.antetTitlu}>Scaneaza QR web</Text>
                <Text style={stiluri.antetSubtitlu}>Aliniaza codul de pe ecran in patrat</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={stiluri.hint}>
              <Ionicons name="information-circle" size={16} color="#fff" />
              <Text style={stiluri.hintText}>
                Deschide pagina de login pe web si afiseaza QR-ul
              </Text>
            </View>
          </>
        ) : etapa === 'confirmare' ? (
          <EcranConfirmare
            onAproba={confirmaAprobare}
            onRespinge={confirmaRespingere}
            onInapoi={reset}
          />
        ) : etapa === 'trimite' ? (
          <View style={stiluri.stareContainerDark}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={stiluri.stareTextDark}>Se trimite aprobarea...</Text>
          </View>
        ) : etapa === 'succes' ? (
          <View style={stiluri.stareContainerDark}>
            <View style={stiluri.iconSucces}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
            <Text style={stiluri.stareTitluDark}>Logat pe web!</Text>
            <Text style={stiluri.stareTextDark}>
              Poti reveni pe laptop — sesiunea e activa.
            </Text>
            <Pressable style={stiluri.butonMare} onPress={inchide}>
              <Text style={stiluri.butonMareText}>Gata</Text>
            </Pressable>
          </View>
        ) : (
          <View style={stiluri.stareContainerDark}>
            <View style={stiluri.iconEroare}>
              <Ionicons name="close" size={44} color="#fff" />
            </View>
            <Text style={stiluri.stareTitluDark}>Nu am putut aproba</Text>
            <Text style={stiluri.stareTextDark}>
              {eroare ||
                'Sesiunea QR poate fi expirata. Reincarca pagina de login pe web si mai incearca.'}
            </Text>
            <Pressable style={stiluri.butonMare} onPress={reset}>
              <Text style={stiluri.butonMareText}>Scaneaza din nou</Text>
            </Pressable>
            <Pressable style={stiluri.stareButonSec} onPress={inchide}>
              <Text style={stiluri.stareButonSecText}>Inchide</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// --- Ecran de confirmare (dupa citirea QR) ---
function EcranConfirmare({
  onAproba,
  onRespinge,
  onInapoi,
}: {
  onAproba: () => void;
  onRespinge: () => void;
  onInapoi: () => void;
}) {
  return (
    <View style={stiluri.stareContainerDark}>
      <View style={stiluri.iconPrincipal}>
        <Ionicons name="laptop" size={44} color="#fff" />
      </View>
      <Text style={stiluri.stareTitluDark}>Conectare pe web?</Text>
      <Text style={stiluri.stareTextDark}>
        Un browser a cerut sa te logheze cu contul tau. Daca tu ai deschis pagina de login,
        apasa „Aproba”. Altfel, respinge.
      </Text>

      <View style={{ height: 18 }} />

      <Pressable style={stiluri.butonAproba} onPress={onAproba}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={stiluri.butonAprobaText}>Aproba si logheaza-ma</Text>
      </Pressable>
      <Pressable style={stiluri.butonRespinge} onPress={onRespinge}>
        <Ionicons name="close-circle" size={20} color={CuloriApp.eroare} />
        <Text style={stiluri.butonRespingeText}>Nu sunt eu — respinge</Text>
      </Pressable>

      <Pressable style={stiluri.stareButonSec} onPress={onInapoi}>
        <Text style={stiluri.stareButonSecText}>Inapoi la scanare</Text>
      </Pressable>
    </View>
  );
}

const stiluri = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  // Overlay cu „ferestruica” transparenta
  overlay: { ...StyleSheet.absoluteFillObject },
  overlaySus: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMijloc: { flexDirection: 'row' },
  overlayLateral: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayJos: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  patrat: {
    width: 260,
    height: 260,
    borderWidth: 0,
    position: 'relative',
  },
  colt: { position: 'absolute', width: 26, height: 26, borderColor: '#0ea5e9' },
  coltSS: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  coltSD: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  coltJS: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  coltJD: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },

  antet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  butonAntet: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  antetTitlu: { color: '#fff', fontSize: 15, fontWeight: '700' },
  antetSubtitlu: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 2 },

  hint: {
    position: 'absolute',
    bottom: 40,
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Stari fara camera (permisiune, succes, eroare, confirmare)
  stareContainer: {
    flex: 1,
    backgroundColor: CuloriApp.fundalSecundar,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  stareContainerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  stareTitlu: { fontSize: 22, fontWeight: '800', color: CuloriApp.textPrimar, textAlign: 'center' },
  stareTitluDark: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  stareText: { fontSize: 14, color: CuloriApp.textSecundar, textAlign: 'center', lineHeight: 20 },
  stareTextDark: { fontSize: 14, color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 20, marginHorizontal: 12 },
  stareButon: {
    marginTop: 6,
    backgroundColor: CuloriApp.primar,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  stareButonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stareButonSec: { paddingHorizontal: 18, paddingVertical: 12 },
  stareButonSecText: { color: 'rgba(255,255,255,0.72)', fontWeight: '600', fontSize: 14 },

  iconPrincipal: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  iconSucces: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: CuloriApp.succes,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  iconEroare: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: CuloriApp.eroare,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },

  butonMare: {
    marginTop: 8,
    backgroundColor: CuloriApp.primar,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 220,
    alignItems: 'center',
  },
  butonMareText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  butonAproba: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.succes,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 260,
  },
  butonAprobaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  butonRespinge: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    minWidth: 260,
  },
  butonRespingeText: { color: '#fecaca', fontWeight: '700', fontSize: 14 },
});
