/**
 * Tab „Creare” - pune la dispozitie 3 moduri de a adauga un document:
 *   1) Scaner — camera cu ghidaj A4 (recomandat pentru facturi/contracte/extrase)
 *   2) Camera rapida / Galerie — poza normala sau alegere din galerie
 *   3) PDF — import fisier existent
 *
 * Flux complet:
 *   selecteaza mod -> alege tip document -> obtine fisier local ->
 *   formular titlu/descriere -> upload -> astept OCR -> daca e slab,
 *   ofer reluare scanare (rescan pe acelasi document_id).
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { CuloriApp } from '@/constants/culori';
import { OpenOnWeb } from '@/components/open-on-web';
import { SelectorTipDocument } from '@/components/selector-tip-document';
import { ScanerDocument } from '@/components/scaner-document';
import { FormularUploadDocument } from '@/components/formular-upload-document';
import { ModalCalitateOcr } from '@/components/modal-calitate-ocr';
import type { InfoTipDocument } from '@/constants/tipuri-documente';
import { PRAG_CONFIDENCE_OCR } from '@/constants/tipuri-documente';
import type { FisierLocalDocument, RaspunsDocument } from '@/types/documente';
import {
  uploadDocumentApi,
  rescanDocumentApi,
  asteaptaProcesareOCR,
} from '@/lib/api/serviciu-documente';

type Mod = 'scaner' | 'camera' | 'galerie' | 'pdf';

export default function EcranCreare() {
  const insets = useSafeAreaInsets();

  // Pas 1: ce mod a ales utilizatorul
  const [modCurent, setModCurent] = useState<Mod | null>(null);
  // Pas 2: tip document
  const [tipAles, setTipAles] = useState<InfoTipDocument | null>(null);
  // Pas 3: fisier local obtinut
  const [fisier, setFisier] = useState<FisierLocalDocument | null>(null);
  // Pas 4: formular upload
  const [vizibilFormular, setVizibilFormular] = useState(false);
  const [seIncarca, setSeIncarca] = useState(false);
  // Pas 5: retry dupa OCR slab
  const [docRezultat, setDocRezultat] = useState<RaspunsDocument | null>(null);
  const [vizibilRetry, setVizibilRetry] = useState(false);

  // Scanner e Modal separat — controlam vizibilitatea explicit
  const [vizibilScaner, setVizibilScaner] = useState(false);

  // --- Pornirea flux-ului ---
  function deschideSelector(mod: Mod) {
    setModCurent(mod);
    // resetam restul ca sa avem flux curat
    setFisier(null);
    setDocRezultat(null);
  }

  function inchideSelector() {
    setModCurent(null);
  }

  // --- Dupa ce user-ul a ales tipul ---
  async function dupaAlesTip(tip: InfoTipDocument) {
    setTipAles(tip);
    const mod = modCurent;
    setModCurent(null);
    if (!mod) return;

    if (mod === 'scaner') {
      setVizibilScaner(true);
      return;
    }
    if (mod === 'camera') {
      await pornesteCameraRapid();
      return;
    }
    if (mod === 'galerie') {
      await pornesteGalerie();
      return;
    }
    if (mod === 'pdf') {
      await pornestePdf();
      return;
    }
  }

  // --- Sursele de fisiere ---
  async function pornesteCameraRapid() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permisiune necesara', 'Activati camera din setari.');
      return;
    }
    const rez = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      exif: false,
    });
    if (rez.canceled || !rez.assets?.[0]) return;
    const a = rez.assets[0];
    setFisier({
      uri: a.uri,
      nume: a.fileName || `poza-${Date.now()}.jpg`,
      mimeType: a.mimeType || 'image/jpeg',
      marime: a.fileSize,
      sursa: 'camera',
    });
    setVizibilFormular(true);
  }

  async function pornesteGalerie() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permisiune necesara', 'Activati accesul la galerie din setari.');
      return;
    }
    const rez = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.95,
      exif: false,
    });
    if (rez.canceled || !rez.assets?.[0]) return;
    const a = rez.assets[0];
    setFisier({
      uri: a.uri,
      nume: a.fileName || `galerie-${Date.now()}.jpg`,
      mimeType: a.mimeType || 'image/jpeg',
      marime: a.fileSize,
      sursa: 'galerie',
    });
    setVizibilFormular(true);
  }

  async function pornestePdf() {
    const rez = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (rez.canceled || !rez.assets?.[0]) return;
    const a = rez.assets[0];
    setFisier({
      uri: a.uri,
      nume: a.name,
      mimeType: a.mimeType || 'application/pdf',
      marime: a.size,
      sursa: 'pdf',
    });
    setVizibilFormular(true);
  }

  function dupaScanerCapturat(f: FisierLocalDocument) {
    setVizibilScaner(false);
    if (docRezultat) {
      // flux retry: documentul exista deja, il rescannam
      dupaRetryCapturat(f);
    } else {
      setFisier(f);
      setVizibilFormular(true);
    }
  }

  // --- Upload efectiv ---
  async function trimiteUpload(date: { titlu: string; descriere: string }) {
    if (!fisier || !tipAles) return;
    try {
      setSeIncarca(true);
      const doc = await uploadDocumentApi({
        fisier,
        titlu: date.titlu,
        descriere: date.descriere,
        tipDocument: tipAles.cod,
      });
      setDocRezultat(doc);
      setVizibilFormular(false);

      // astept sa se proceseze OCR pe server
      const finalDoc = await asteaptaProcesareOCR(doc.id);
      setDocRezultat(finalDoc);

      if (ocrSlab(finalDoc)) {
        setVizibilRetry(true);
      } else {
        Alert.alert('Gata!', 'Documentul a fost incarcat si procesat cu succes.', [
          { text: 'Bine', onPress: reseteazaTot },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Eroare', e?.message || 'Upload-ul a esuat.');
    } finally {
      setSeIncarca(false);
    }
  }

  // --- Retry cu scannerul ---
  function deschideRetrayScaner() {
    setVizibilRetry(false);
    setVizibilScaner(true); // va re-captura; la confirm -> trimiteRescan
  }

  async function dupaRetryCapturat(f: FisierLocalDocument) {
    setVizibilScaner(false);
    if (!docRezultat) return;
    try {
      setSeIncarca(true);
      const actualizat = await rescanDocumentApi(docRezultat.id, f);
      setDocRezultat(actualizat);
      const finalDoc = await asteaptaProcesareOCR(actualizat.id);
      setDocRezultat(finalDoc);
      if (ocrSlab(finalDoc)) {
        setVizibilRetry(true);
      } else {
        Alert.alert('Gata!', 'Documentul a fost procesat cu succes.', [
          { text: 'Bine', onPress: reseteazaTot },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Eroare', e?.message || 'Rescanarea a esuat.');
    } finally {
      setSeIncarca(false);
    }
  }

  function reseteazaTot() {
    setFisier(null);
    setDocRezultat(null);
    setTipAles(null);
    setVizibilRetry(false);
  }

  return (
    <View style={[stiluri.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={stiluri.scroll}
        contentContainerStyle={stiluri.continutScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={stiluri.antet}>
          <View style={{ flex: 1 }}>
            <Text style={stiluri.antetTitlu}>Creare</Text>
            <Text style={stiluri.antetSubtitlu}>Adauga un document nou</Text>
          </View>
          <OpenOnWeb cale="/documents" varianta="icon" />
        </View>

        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Scanner inteligent</Text>

          <Pressable
            onPress={() => deschideSelector('scaner')}
            style={({ pressed }) => [stiluri.cardMare, pressed && { opacity: 0.9 }]}
          >
            <View style={stiluri.cardMareIcon}>
              <Ionicons name="scan" size={30} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardMareTitlu}>Scaneaza cu camera</Text>
              <Text style={stiluri.cardMareDescriere}>
                Ghidaj A4 pe ecran + procesare OCR. Recomandat pentru facturi, contracte, extrase.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Alte moduri</Text>

          <CardActiune
            icon="camera"
            culoareFundal="#eef2ff"
            culoareIcon={CuloriApp.primar}
            titlu="Poza rapida"
            descriere="Pentru bonuri fiscale, chitante, documente simple"
            laApasare={() => deschideSelector('camera')}
          />

          <CardActiune
            icon="image"
            culoareFundal="#e0f2fe"
            culoareIcon={CuloriApp.secundar}
            titlu="Din galerie"
            descriere="Alege o imagine salvata pe telefon"
            laApasare={() => deschideSelector('galerie')}
          />

          <CardActiune
            icon="document"
            culoareFundal="#f3e8ff"
            culoareIcon={CuloriApp.accent}
            titlu="Document PDF"
            descriere="Importa un PDF deja existent"
            laApasare={() => deschideSelector('pdf')}
          />
        </View>

        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Sau pe web</Text>
          <OpenOnWeb
            cale="/documents"
            varianta="card"
            text="Upload avansat pe web"
            descriere="Pentru fisiere multiple, Excel sau Word"
          />
          <View style={{ height: 12 }} />
          <OpenOnWeb
            cale="/reports"
            varianta="card"
            text="Genereaza raport"
            descriere="Creeaza rapoarte contabile complexe"
          />
        </View>
      </ScrollView>

      {/* Selector tip document */}
      <SelectorTipDocument
        vizibil={modCurent !== null}
        titluEcran="Ce fel de document scanezi?"
        subtitluEcran={subtitluPentruMod(modCurent)}
        laInchide={inchideSelector}
        laSelectat={dupaAlesTip}
      />

      {/* Scanner */}
      {tipAles && (
        <ScanerDocument
          vizibil={vizibilScaner}
          tip={tipAles}
          laInchide={() => setVizibilScaner(false)}
          laCapturat={dupaScanerCapturat}
        />
      )}

      {/* Formular upload */}
      {tipAles && (
        <FormularUploadDocument
          vizibil={vizibilFormular}
          fisier={fisier}
          tip={tipAles}
          seIncarca={seIncarca}
          laInchide={() => {
            if (seIncarca) return;
            setVizibilFormular(false);
            reseteazaTot();
          }}
          laConfirma={trimiteUpload}
        />
      )}

      {/* Retry calitate OCR */}
      <ModalCalitateOcr
        vizibil={vizibilRetry}
        confidence={docRezultat?.avg_ocr_confidence ?? null}
        laReia={deschideRetrayScaner}
        laTrimiteAsa={() => {
          setVizibilRetry(false);
          reseteazaTot();
          Alert.alert(
            'Trimis contabilului',
            'Documentul va fi revizuit manual de contabilul tau.'
          );
        }}
        laRenunta={() => {
          setVizibilRetry(false);
          reseteazaTot();
        }}
      />
    </View>
  );
}

function ocrSlab(doc: RaspunsDocument): boolean {
  if (doc.status === 'ocr_failed' || doc.status === 'requires_manual') return true;
  const c = doc.avg_ocr_confidence;
  if (c != null && c < PRAG_CONFIDENCE_OCR) return true;
  if (doc.has_flagged_fields) return true;
  return false;
}

function subtitluPentruMod(mod: Mod | null): string | undefined {
  if (mod === 'scaner') return 'Scannerul iti afiseaza un ghidaj A4';
  if (mod === 'camera') return 'Poza rapida pentru acte simple';
  if (mod === 'galerie') return 'Importa o imagine salvata';
  if (mod === 'pdf') return 'Alege un fisier PDF de pe telefon';
  return undefined;
}

// --- UI helper ---
interface CardActiuneProps {
  icon: string;
  culoareFundal: string;
  culoareIcon: string;
  titlu: string;
  descriere: string;
  laApasare: () => void;
}

function CardActiune({
  icon,
  culoareFundal,
  culoareIcon,
  titlu,
  descriere,
  laApasare,
}: CardActiuneProps) {
  return (
    <Pressable
      style={({ pressed }) => [stiluri.cardActiune, pressed && { opacity: 0.85 }]}
      onPress={laApasare}
    >
      <View style={[stiluri.cardActiuneIcon, { backgroundColor: culoareFundal }]}>
        <Ionicons name={icon as any} size={26} color={culoareIcon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={stiluri.cardActiuneTitlu}>{titlu}</Text>
        <Text style={stiluri.cardActiuneDescriere}>{descriere}</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color={culoareIcon} />
    </Pressable>
  );
}

const stiluri = StyleSheet.create({
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
  antet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  antetTitlu: {
    fontSize: 24,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  antetSubtitlu: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  sectiune: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  titluSectiune: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textSecundar,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardMare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CuloriApp.primar,
    borderRadius: 22,
    padding: 18,
    marginBottom: 8,
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
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardMareTitlu: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  cardMareDescriere: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    lineHeight: 17,
  },
  cardActiune: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardActiuneIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActiuneTitlu: {
    fontSize: 15,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardActiuneDescriere: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
});
