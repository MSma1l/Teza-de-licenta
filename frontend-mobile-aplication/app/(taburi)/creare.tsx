/**
 * Tab Creare - punct de start pentru actiuni rapide:
 * - Scanare document cu camera (urmeaza)
 * - Upload rapid din galerie (urmeaza)
 * - Pentru actiuni complexe -> deschide pe web
 */
import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CuloriApp } from '@/constants/culori';
import { OpenOnWeb } from '@/components/open-on-web';

export default function EcranCreare() {
  const insets = useSafeAreaInsets();

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

        {/* Actiuni rapide */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Actiuni rapide</Text>

          <Pressable style={({ pressed }) => [stiluri.cardActiune, pressed && { opacity: 0.85 }]}>
            <View style={[stiluri.cardActiuneIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="camera" size={26} color={CuloriApp.primar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardActiuneTitlu}>Scaneaza cu camera</Text>
              <Text style={stiluri.cardActiuneDescriere}>Fotografie rapida + OCR automat</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={CuloriApp.primar} />
          </Pressable>

          <Pressable style={({ pressed }) => [stiluri.cardActiune, pressed && { opacity: 0.85 }]}>
            <View style={[stiluri.cardActiuneIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="image" size={26} color={CuloriApp.secundar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardActiuneTitlu}>Din galerie</Text>
              <Text style={stiluri.cardActiuneDescriere}>Alege un fisier de pe telefon</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={CuloriApp.secundar} />
          </Pressable>

          <Pressable style={({ pressed }) => [stiluri.cardActiune, pressed && { opacity: 0.85 }]}>
            <View style={[stiluri.cardActiuneIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="document" size={26} color={CuloriApp.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardActiuneTitlu}>Document PDF</Text>
              <Text style={stiluri.cardActiuneDescriere}>Importa un PDF deja existent</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={CuloriApp.accent} />
          </Pressable>
        </View>

        {/* Pentru creare complexa - deschide web */}
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
    </View>
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
