/**
 * Bottom-sheet de selectare a tipului de document.
 * Arata o lista cu toate tipurile + eticheta „recomandat scanner” pentru cele complexe.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuloriApp } from '@/constants/culori';
import { TIPURI_DOCUMENTE, type InfoTipDocument } from '@/constants/tipuri-documente';

interface Proprietati {
  vizibil: boolean;
  titluEcran: string;
  subtitluEcran?: string;
  laInchide: () => void;
  laSelectat: (tip: InfoTipDocument) => void;
}

export function SelectorTipDocument({
  vizibil,
  titluEcran,
  subtitluEcran,
  laInchide,
  laSelectat,
}: Proprietati) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={vizibil}
      animationType="slide"
      onRequestClose={laInchide}
    >
      <Pressable style={stiluri.fundal} onPress={laInchide} />
      <View style={[stiluri.panou, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={stiluri.maner} />
        <View style={stiluri.antet}>
          <View style={{ flex: 1 }}>
            <Text style={stiluri.titlu}>{titluEcran}</Text>
            {subtitluEcran && <Text style={stiluri.subtitlu}>{subtitluEcran}</Text>}
          </View>
          <Pressable onPress={laInchide} hitSlop={10} style={stiluri.butonInchide}>
            <Ionicons name="close" size={20} color={CuloriApp.textSecundar} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: 460 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {TIPURI_DOCUMENTE.map((tip) => (
            <Pressable
              key={tip.cod}
              onPress={() => laSelectat(tip)}
              style={({ pressed }) => [
                stiluri.rand,
                pressed && { backgroundColor: '#f1f5f9' },
              ]}
            >
              <View
                style={[
                  stiluri.randIcon,
                  {
                    backgroundColor:
                      tip.modRecomandat === 'complex' ? '#eef2ff' : '#ecfdf5',
                  },
                ]}
              >
                <Ionicons
                  name={tip.iconita as any}
                  size={22}
                  color={tip.modRecomandat === 'complex' ? CuloriApp.primar : CuloriApp.succes}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={stiluri.randTitlu}>{tip.eticheta}</Text>
                <Text style={stiluri.randDescr}>{tip.descriere}</Text>
              </View>
              {tip.modRecomandat === 'complex' && (
                <View style={stiluri.tag}>
                  <Ionicons name="sparkles" size={10} color={CuloriApp.primar} />
                  <Text style={stiluri.tagText}>Scanner</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={CuloriApp.textEstompat} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const stiluri = StyleSheet.create({
  fundal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  panou: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CuloriApp.fundalCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
    }),
  },
  maner: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: CuloriApp.bordura,
    marginBottom: 8,
  },
  antet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  titlu: {
    fontSize: 18,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  subtitlu: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  butonInchide: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.fundalInput,
  },
  rand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  randIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  randTitlu: {
    fontSize: 15,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  randDescr: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: CuloriApp.primar,
  },
});
