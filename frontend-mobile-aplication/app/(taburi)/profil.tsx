/**
 * Tab Profil - cont, setari rapide, link-uri spre web, delogare
 */
import { StyleSheet, View, Text, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CuloriApp } from '@/constants/culori';
import { useAutentificare } from '@/hooks/use-autentificare';
import { OpenOnWeb } from '@/components/open-on-web';

export default function EcranProfil() {
  const insets = useSafeAreaInsets();
  const { utilizator, delogare } = useAutentificare();

  const numeUtilizator = utilizator?.numeUtilizator || 'Utilizator';
  const email = utilizator?.email || '';
  const initiala = numeUtilizator.charAt(0).toUpperCase();
  const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173';

  const deschideWeb = (cale: string) => Linking.openURL(WEB_URL + cale);

  return (
    <View style={[stiluri.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={stiluri.scroll}
        contentContainerStyle={stiluri.continutScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header cu avatar mare */}
        <View style={stiluri.antet}>
          <View style={stiluri.avatarMare}>
            <Text style={stiluri.avatarText}>{initiala}</Text>
          </View>
          <Text style={stiluri.numeUtilizator}>{numeUtilizator}</Text>
          {email !== '' && <Text style={stiluri.email}>{email}</Text>}
        </View>

        {/* Card cont */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Contul meu</Text>

          <Pressable style={({ pressed }) => [stiluri.cardItem, pressed && { opacity: 0.7 }]} onPress={() => deschideWeb('/settings')}>
            <View style={[stiluri.cardItemIcon, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="person-outline" size={20} color={CuloriApp.primar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardItemTitlu}>Date personale</Text>
              <Text style={stiluri.cardItemDescriere}>Modifica numele si telefonul</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={CuloriApp.textEstompat} />
          </Pressable>

          <Pressable style={({ pressed }) => [stiluri.cardItem, pressed && { opacity: 0.7 }]} onPress={() => deschideWeb('/settings')}>
            <View style={[stiluri.cardItemIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="key-outline" size={20} color={CuloriApp.secundar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardItemTitlu}>Schimba parola</Text>
              <Text style={stiluri.cardItemDescriere}>Pentru securitate, schimba periodic</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={CuloriApp.textEstompat} />
          </Pressable>

          <Pressable style={({ pressed }) => [stiluri.cardItem, pressed && { opacity: 0.7 }]} onPress={() => deschideWeb('/settings')}>
            <View style={[stiluri.cardItemIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={CuloriApp.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={stiluri.cardItemTitlu}>Securitate 2FA</Text>
              <Text style={stiluri.cardItemDescriere}>Confirma actiuni de pe web</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={CuloriApp.textEstompat} />
          </Pressable>
        </View>

        {/* Link-uri rapide spre web */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.titluSectiune}>Aplicatia web</Text>
          <View style={{ gap: 12 }}>
            <OpenOnWeb
              cale="/settings"
              varianta="card"
              text="Setari avansate"
              descriere="Modifica datele companiei si preferinte"
            />
            <OpenOnWeb
              cale="/reports"
              varianta="card"
              text="Rapoarte"
              descriere="Vezi si descarca rapoartele in PDF"
            />
            <OpenOnWeb
              cale="/training"
              varianta="card"
              text="Antrenare AI"
              descriere="Imbunatateste modelul prin corectii"
            />
          </View>
        </View>

        {/* Delogare */}
        <View style={stiluri.sectiune}>
          <Pressable
            onPress={delogare}
            style={({ pressed }) => [stiluri.butonDelogare, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={stiluri.textDelogare}>Delogare</Text>
          </Pressable>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },
  avatarMare: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  numeUtilizator: {
    fontSize: 22,
    fontWeight: '800',
    color: CuloriApp.textPrimar,
  },
  email: {
    fontSize: 13,
    color: CuloriApp.textSecundar,
    marginTop: 4,
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
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
  },
  cardItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemTitlu: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardItemDescriere: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  butonDelogare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CuloriApp.eroare,
    paddingVertical: 14,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.eroare,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  textDelogare: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
