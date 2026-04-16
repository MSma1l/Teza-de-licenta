/**
 * Scaner document — modal full-screen:
 *  1) Camera cu ghidaj (cadru A4) si hint de aliniere.
 *  2) La capture -> preview cu rotire, retake si confirmare.
 *  3) La confirmare -> returneaza FisierLocalDocument (JPEG local).
 *
 * Nu facem edge-detection auto (ar cere native/OpenCV). Ghidajul e vizual,
 * iar PaddleOCR pe server compenseaza prin deskew + binarization.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import type { FisierLocalDocument } from '@/types/documente';
import type { InfoTipDocument } from '@/constants/tipuri-documente';
import { stiluri } from './stiluri';

interface Proprietati {
  vizibil: boolean;
  tip: InfoTipDocument;
  laInchide: () => void;
  laCapturat: (fisier: FisierLocalDocument) => void;
}

type Etapa = 'camera' | 'procesare' | 'preview';

export function ScanerDocument({ vizibil, tip, laInchide, laCapturat }: Proprietati) {
  const [permisiune, cerePermisiune] = useCameraPermissions();
  const [fata, setFata] = useState<CameraType>('back');
  const [bliț, setBliț] = useState<FlashMode>('off');
  const [etapa, setEtapa] = useState<Etapa>('camera');
  const [uri, setUri] = useState<string | null>(null);
  const [rotatieTotala, setRotatieTotala] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  function reset() {
    setEtapa('camera');
    setUri(null);
    setRotatieTotala(0);
  }

  function inchide() {
    reset();
    laInchide();
  }

  async function captureaza() {
    if (!cameraRef.current) return;
    try {
      setEtapa('procesare');
      const rezultat = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
        exif: false,
      });
      if (!rezultat?.uri) {
        setEtapa('camera');
        Alert.alert('Eroare', 'Nu am putut captura imaginea. Incearca din nou.');
        return;
      }
      setUri(rezultat.uri);
      setEtapa('preview');
    } catch (e: any) {
      setEtapa('camera');
      Alert.alert('Eroare camera', e?.message || 'Capturare esuata.');
    }
  }

  async function roteste() {
    if (!uri) return;
    try {
      const rezultat = await ImageManipulator.manipulateAsync(
        uri,
        [{ rotate: 90 }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setUri(rezultat.uri);
      setRotatieTotala((r) => (r + 90) % 360);
    } catch (e) {
      Alert.alert('Eroare', 'Nu am putut roti imaginea.');
    }
  }

  function confirma() {
    if (!uri) return;
    // Asiguram extensia + mime corect
    const nume = `scan-${tip.cod}-${Date.now()}.jpg`;
    laCapturat({
      uri,
      nume,
      mimeType: 'image/jpeg',
      sursa: 'scaner',
    });
    reset();
  }

  // --- Fara permisiune ---
  if (vizibil && !permisiune?.granted) {
    return (
      <Modal visible={vizibil} animationType="slide" onRequestClose={inchide}>
        <View style={stiluri.stareContainer}>
          <Ionicons name="camera-outline" size={64} color="#4338ca" />
          <Text style={stiluri.stareTitlu}>Accesul la camera este necesar</Text>
          <Text style={stiluri.stareText}>
            Pentru a scana {tip.eticheta.toLowerCase()} avem nevoie sa pornim camera. Datele
            ramân pe telefonul tau pana apesi „Foloseste”.
          </Text>
          <Pressable
            style={stiluri.stareButon}
            onPress={async () => {
              const rez = await cerePermisiune();
              if (!rez.granted) {
                Alert.alert(
                  'Permisiune refuzata',
                  'Mergi in Setari > Aplicatii > AI-Contabil > Permisiuni si activeaza Camera.'
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
        {etapa !== 'preview' ? (
          <>
            <CameraView
              ref={cameraRef}
              style={stiluri.camera}
              facing={fata}
              flash={bliț}
              autofocus="on"
              animateShutter
            />

            {/* Ghidaj aliniere */}
            <View pointerEvents="none" style={stiluri.ghidajContainer}>
              <View style={stiluri.ghidajHint}>
                <Text style={stiluri.ghidajHintText}>
                  {tip.modRecomandat === 'complex'
                    ? 'Aseaza documentul pe suprafata plana si aliniaza-l in cadru'
                    : 'Asigura-te ca documentul intra complet in cadru'}
                </Text>
              </View>
              <View style={stiluri.ghidajCadru}>
                <View style={[stiluri.colt, stiluri.coltSS]} />
                <View style={[stiluri.colt, stiluri.coltSD]} />
                <View style={[stiluri.colt, stiluri.coltJS]} />
                <View style={[stiluri.colt, stiluri.coltJD]} />
              </View>
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
                <Text style={stiluri.antetTitlu}>Scaneaza {tip.eticheta.toLowerCase()}</Text>
                <Text style={stiluri.antetSubtitlu}>
                  {tip.modRecomandat === 'complex' ? 'Mod detaliat' : 'Mod rapid'}
                </Text>
              </View>
              <Pressable
                style={stiluri.butonAntet}
                onPress={() => setBliț((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))}
                hitSlop={10}
              >
                <Ionicons
                  name={bliț === 'off' ? 'flash-off' : bliț === 'on' ? 'flash' : 'flash-outline'}
                  size={20}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* Bara de jos */}
            <View style={stiluri.bara}>
              <Pressable
                style={stiluri.butonMic}
                onPress={() => setFata((v) => (v === 'back' ? 'front' : 'back'))}
                hitSlop={10}
              >
                <Ionicons name="camera-reverse" size={22} color="#fff" />
              </Pressable>

              <Pressable
                onPress={captureaza}
                disabled={etapa === 'procesare'}
                style={({ pressed }) => [
                  stiluri.shutterCerc,
                  pressed && stiluri.shutterCercApasat,
                ]}
              >
                {etapa === 'procesare' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={stiluri.shutterCercIntern} />
                )}
              </Pressable>

              <View style={{ width: 48 }} />
            </View>
          </>
        ) : (
          <View style={stiluri.previewContainer}>
            {uri && (
              <ImagineRezultat uri={uri} />
            )}
            <View style={[stiluri.previewBara, { paddingTop: 12 }]}>
              <View style={stiluri.previewRand}>
                <Pressable style={stiluri.previewActiune} onPress={roteste}>
                  <Ionicons name="refresh" size={22} color="#fff" />
                  <Text style={stiluri.previewActiuneText}>Roteste</Text>
                </Pressable>
                <Pressable style={stiluri.previewActiune} onPress={reset}>
                  <Ionicons name="camera" size={22} color="#fff" />
                  <Text style={stiluri.previewActiuneText}>Refa poza</Text>
                </Pressable>
              </View>
              <View style={stiluri.previewFinal}>
                <Pressable style={stiluri.previewButonSec} onPress={inchide}>
                  <Text style={stiluri.previewButonSecText}>Renunta</Text>
                </Pressable>
                <Pressable style={stiluri.previewButonPrincipal} onPress={confirma}>
                  <Text style={stiluri.previewButonPrincipalText}>Foloseste imaginea</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Componenta separata ca sa evitam re-import Image in partea de sus
import { Image } from 'expo-image';
function ImagineRezultat({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={stiluri.previewImagine}
      contentFit="contain"
      transition={120}
    />
  );
}
