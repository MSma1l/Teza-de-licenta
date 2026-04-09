/**
 * OpenOnWeb - buton elegant care deschide pagina echivalenta pe web.
 *
 * Mobile e companion app pentru Web. Acest buton apare in fiecare ecran
 * si trimite utilizatorul direct la sectiunea corespunzatoare din web.
 *
 * Variante:
 *   - 'icon' (default): doar iconita rotunda mica (pentru header)
 *   - 'pill':           buton cu text si iconita (pentru locuri vizibile)
 *   - 'card':           card mare cu titlu si descriere
 *
 * URL-ul web se citeste din EXPO_PUBLIC_WEB_URL sau default localhost:5173.
 */
import { Linking, Pressable, Text, View, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CuloriApp } from '@/constants/culori';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173';

interface OpenOnWebProps {
  /** Calea relativa pe web (ex: '/documents', '/reports', '/settings'). */
  cale?: string;
  /** Variante vizuale */
  varianta?: 'icon' | 'pill' | 'card';
  /** Pentru variantele 'pill' / 'card' */
  text?: string;
  /** Pentru varianta 'card' */
  descriere?: string;
}

export function OpenOnWeb({
  cale = '/',
  varianta = 'icon',
  text = 'Deschide pe web',
  descriere,
}: OpenOnWebProps) {
  const url = WEB_URL + (cale.startsWith('/') ? cale : '/' + cale);

  const laApasare = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  };

  if (varianta === 'icon') {
    return (
      <Pressable onPress={laApasare} style={stiluri.iconWrap} hitSlop={8}>
        <Ionicons name="open-outline" size={18} color={CuloriApp.primar} />
      </Pressable>
    );
  }

  if (varianta === 'pill') {
    return (
      <Pressable onPress={laApasare} style={({ pressed }) => [stiluri.pill, pressed && stiluri.pressed]}>
        <Ionicons name="globe-outline" size={16} color={CuloriApp.primar} />
        <Text style={stiluri.pillText}>{text}</Text>
        <Ionicons name="open-outline" size={14} color={CuloriApp.primar} />
      </Pressable>
    );
  }

  // card
  return (
    <Pressable onPress={laApasare} style={({ pressed }) => [stiluri.card, pressed && stiluri.pressed]}>
      <View style={stiluri.cardIconWrap}>
        <Ionicons name="globe-outline" size={22} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={stiluri.cardTitlu}>{text}</Text>
        {descriere && <Text style={stiluri.cardDescriere}>{descriere}</Text>}
      </View>
      <Ionicons name="arrow-forward" size={20} color={CuloriApp.primar} />
    </Pressable>
  );
}

const stiluri = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  pillText: {
    fontSize: 12,
    color: CuloriApp.primar,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CuloriApp.fundalCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: CuloriApp.bordura,
    ...Platform.select({
      ios: {
        shadowColor: CuloriApp.primar,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: CuloriApp.primar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitlu: {
    fontSize: 14,
    fontWeight: '700',
    color: CuloriApp.textPrimar,
  },
  cardDescriere: {
    fontSize: 12,
    color: CuloriApp.textSecundar,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
