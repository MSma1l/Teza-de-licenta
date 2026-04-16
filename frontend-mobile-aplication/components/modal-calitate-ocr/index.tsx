/**
 * Modal ce apare cand OCR-ul a fost slab (confidence scazuta sau cuvinte flagged).
 * Ofera 3 optiuni:
 *  - Reia scanarea cu scannerul (mod detaliat)
 *  - Trimite asa cum e (-> ramane la contabil)
 *  - Sterge si reincarca altfel
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';

interface Proprietati {
  vizibil: boolean;
  confidence: number | null;
  laReia: () => void;
  laTrimiteAsa: () => void;
  laRenunta: () => void;
}

export function ModalCalitateOcr({
  vizibil,
  confidence,
  laReia,
  laTrimiteAsa,
  laRenunta,
}: Proprietati) {
  const procent = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <Modal transparent visible={vizibil} animationType="fade" onRequestClose={laRenunta}>
      <View style={stiluri.fundal}>
        <View style={stiluri.carte}>
          <View style={stiluri.iconRing}>
            <Ionicons name="alert" size={28} color={CuloriApp.avertizare} />
          </View>
          <Text style={stiluri.titlu}>Documentul e greu de citit</Text>
          <Text style={stiluri.text}>
            {procent != null
              ? `Am inteles doar ~${procent}% din text. `
              : 'Calitatea OCR e slaba. '}
            Pentru un rezultat mai bun, reia scanarea cu modul detaliat: lumina buna,
            fara umbre si documentul in intregime in cadru.
          </Text>

          <Pressable
            style={({ pressed }) => [stiluri.butonPrincipal, pressed && { opacity: 0.85 }]}
            onPress={laReia}
          >
            <Ionicons name="scan" size={18} color="#fff" />
            <Text style={stiluri.butonPrincipalText}>Reia cu scannerul</Text>
          </Pressable>

          <Pressable style={stiluri.butonSec} onPress={laTrimiteAsa}>
            <Text style={stiluri.butonSecText}>Trimite asa cum e</Text>
          </Pressable>

          <Pressable style={stiluri.butonLink} onPress={laRenunta}>
            <Text style={stiluri.butonLinkText}>Renunta</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const stiluri = StyleSheet.create({
  fundal: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  carte: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 10 },
    }),
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CuloriApp.avertizareFundal,
    marginBottom: 12,
  },
  titlu: {
    fontSize: 18,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
    textAlign: 'center',
    marginBottom: 6,
  },
  text: {
    fontSize: 13.5,
    color: CuloriApp.textSecundar,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  butonPrincipal: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: CuloriApp.primar,
    marginBottom: 8,
  },
  butonPrincipalText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  butonSec: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CuloriApp.fundalInput,
    alignItems: 'center',
    marginBottom: 4,
  },
  butonSecText: {
    color: CuloriApp.textPrimar,
    fontWeight: '700',
    fontSize: 14,
  },
  butonLink: {
    paddingVertical: 8,
  },
  butonLinkText: {
    color: CuloriApp.textSecundar,
    fontSize: 13,
    fontWeight: '600',
  },
});
