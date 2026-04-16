/**
 * Modal pentru finalizarea unui upload:
 *  - arata preview al fisierului (imagine / iconita PDF)
 *  - cere titlu (obligatoriu) + descriere (optionala)
 *  - afiseaza tipul ales (read-only)
 *  - buton „Incarca” -> apeleaza laConfirma({titlu, descriere})
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuloriApp } from '@/constants/culori';
import type { FisierLocalDocument } from '@/types/documente';
import type { InfoTipDocument } from '@/constants/tipuri-documente';

interface Proprietati {
  vizibil: boolean;
  fisier: FisierLocalDocument | null;
  tip: InfoTipDocument;
  seIncarca: boolean;
  laInchide: () => void;
  laConfirma: (date: { titlu: string; descriere: string }) => void;
}

export function FormularUploadDocument({
  vizibil,
  fisier,
  tip,
  seIncarca,
  laInchide,
  laConfirma,
}: Proprietati) {
  const insets = useSafeAreaInsets();
  const [titlu, setTitlu] = useState('');
  const [descriere, setDescriere] = useState('');
  const [eroareTitlu, setEroareTitlu] = useState<string | null>(null);

  useEffect(() => {
    if (vizibil) {
      setTitlu(numePropusDupaFisier(fisier, tip));
      setDescriere('');
      setEroareTitlu(null);
    }
  }, [vizibil, fisier, tip]);

  function trimite() {
    const t = titlu.trim();
    if (t.length < 2) {
      setEroareTitlu('Da un titlu scurt documentului (min. 2 caractere).');
      return;
    }
    laConfirma({ titlu: t, descriere: descriere.trim() });
  }

  const estePdf = fisier?.mimeType === 'application/pdf';

  return (
    <Modal visible={vizibil} animationType="slide" onRequestClose={seIncarca ? () => {} : laInchide}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: CuloriApp.fundal }}
      >
        <View style={[stiluri.antet, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={laInchide}
            disabled={seIncarca}
            style={stiluri.butonAntet}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color={CuloriApp.textPrimar} />
          </Pressable>
          <Text style={stiluri.antetTitlu}>Incarca documentul</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview */}
          <View style={stiluri.previewContainer}>
            {estePdf ? (
              <View style={stiluri.previewPdf}>
                <Ionicons name="document-text" size={54} color={CuloriApp.primar} />
                <Text style={stiluri.previewPdfNume} numberOfLines={2}>
                  {fisier?.nume ?? 'Document PDF'}
                </Text>
                {!!fisier?.marime && (
                  <Text style={stiluri.previewPdfMeta}>{marimeCitibila(fisier.marime)}</Text>
                )}
              </View>
            ) : fisier ? (
              <Image
                source={{ uri: fisier.uri }}
                style={stiluri.previewImagine}
                contentFit="cover"
              />
            ) : null}
            <View style={stiluri.badgeSursa}>
              <Ionicons name={iconitaSursa(fisier?.sursa)} size={12} color="#fff" />
              <Text style={stiluri.badgeText}>{etichetaSursa(fisier?.sursa)}</Text>
            </View>
          </View>

          {/* Tip ales */}
          <View style={stiluri.chipTip}>
            <Ionicons name={tip.iconita as any} size={16} color={CuloriApp.primar} />
            <Text style={stiluri.chipText}>{tip.eticheta}</Text>
            <View style={stiluri.chipPunct} />
            <Text style={stiluri.chipModText}>
              {tip.modRecomandat === 'complex' ? 'mod detaliat' : 'mod rapid'}
            </Text>
          </View>

          {/* Titlu */}
          <Text style={stiluri.eticheta}>Titlu</Text>
          <TextInput
            value={titlu}
            onChangeText={(v) => {
              setTitlu(v);
              if (eroareTitlu) setEroareTitlu(null);
            }}
            placeholder="ex: Factura curent electric, martie"
            placeholderTextColor={CuloriApp.textEstompat}
            style={[stiluri.input, !!eroareTitlu && stiluri.inputEroare]}
            maxLength={120}
            editable={!seIncarca}
          />
          {eroareTitlu && <Text style={stiluri.textEroare}>{eroareTitlu}</Text>}

          {/* Descriere */}
          <Text style={[stiluri.eticheta, { marginTop: 16 }]}>Descriere (optional)</Text>
          <TextInput
            value={descriere}
            onChangeText={setDescriere}
            placeholder="Notite pentru contabil..."
            placeholderTextColor={CuloriApp.textEstompat}
            style={[stiluri.input, stiluri.inputMultilinie]}
            multiline
            maxLength={500}
            editable={!seIncarca}
          />

          <Pressable
            onPress={trimite}
            disabled={seIncarca}
            style={({ pressed }) => [
              stiluri.butonPrincipal,
              pressed && { opacity: 0.85 },
              seIncarca && { opacity: 0.75 },
            ]}
          >
            {seIncarca ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={stiluri.butonPrincipalText}>Se incarca...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={stiluri.butonPrincipalText}>Incarca documentul</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function numePropusDupaFisier(
  fisier: FisierLocalDocument | null,
  tip: InfoTipDocument,
): string {
  if (!fisier) return tip.eticheta;
  if (fisier.sursa === 'scaner' || fisier.sursa === 'camera') {
    const d = new Date();
    return `${tip.eticheta} ${d.toLocaleDateString('ro-RO')}`;
  }
  // pdf / galerie -> foloseste numele original fara extensie
  const fara = fisier.nume.replace(/\.[^.]+$/, '');
  return fara || tip.eticheta;
}

function marimeCitibila(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function iconitaSursa(s?: FisierLocalDocument['sursa']): any {
  if (s === 'scaner') return 'scan';
  if (s === 'camera') return 'camera';
  if (s === 'galerie') return 'image';
  return 'document';
}

function etichetaSursa(s?: FisierLocalDocument['sursa']): string {
  if (s === 'scaner') return 'Scanat';
  if (s === 'camera') return 'Poza';
  if (s === 'galerie') return 'Din galerie';
  return 'PDF';
}

const stiluri = StyleSheet.create({
  antet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CuloriApp.separator,
    backgroundColor: CuloriApp.fundal,
  },
  antetTitlu: {
    fontSize: 16,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  butonAntet: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.fundalInput,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  previewImagine: {
    width: '100%',
    height: '100%',
  },
  previewPdf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  previewPdfNume: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
  },
  previewPdfMeta: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
  },
  badgeSursa: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.72)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    marginBottom: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: CuloriApp.primar,
  },
  chipPunct: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: CuloriApp.primar,
    opacity: 0.5,
  },
  chipModText: {
    fontSize: 12,
    color: CuloriApp.primar,
    opacity: 0.75,
  },
  eticheta: {
    fontSize: 13,
    fontWeight: '700',
    color: CuloriApp.textSecundar,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 15,
    color: CuloriApp.textPrimar,
    backgroundColor: CuloriApp.fundal,
  },
  inputMultilinie: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputEroare: {
    borderColor: CuloriApp.eroare,
    backgroundColor: CuloriApp.eroareFundal,
  },
  textEroare: {
    marginTop: 6,
    color: CuloriApp.eroare,
    fontSize: 12,
    fontWeight: '600',
  },
  butonPrincipal: {
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
    }),
  },
  butonPrincipalText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
