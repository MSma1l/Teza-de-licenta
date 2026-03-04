import { View, Pressable, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';

let BlurView: React.ComponentType<any> | null = null;
let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  BlurView = require('expo-blur').BlurView;
  Haptics = require('expo-haptics');
}

const ICONITE_TAB: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  meniu: 'menu-outline',
  creare: 'add',
  notificari: 'notifications-outline',
  profil: 'people-outline',
};

const TABURI_ASCUNSE = ['explore'];

function ContainerBlur({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web' || !BlurView) {
    return <View style={[styles.container, styles.containerWeb]}>{children}</View>;
  }

  return (
    <BlurView intensity={60} tint="light" style={styles.container}>
      <View style={styles.suprapunereBlur} />
      {children}
    </BlurView>
  );
}

export function BaraNavigare({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const ruteVizibile = state.routes.filter(
    (ruta) => !TABURI_ASCUNSE.includes(ruta.name)
  );

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <ContainerBlur>
        {ruteVizibile.map((ruta) => {
          const esteActiv = state.index === state.routes.indexOf(ruta);
          const esteCreare = ruta.name === 'creare';
          const numeIconita = ICONITE_TAB[ruta.name];

          const laApasare = () => {
            if (Platform.OS === 'ios' && Haptics) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const eveniment = navigation.emit({
              type: 'tabPress',
              target: ruta.key,
              canPreventDefault: true,
            });

            if (!esteActiv && !eveniment.defaultPrevented) {
              navigation.navigate(ruta.name);
            }
          };

          if (esteCreare) {
            return (
              <Pressable key={ruta.key} onPress={laApasare} style={styles.butonCreare}>
                <View style={styles.cercCreare}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable key={ruta.key} onPress={laApasare} style={styles.butonTab}>
              <Ionicons
                name={numeIconita}
                size={24}
                color={esteActiv ? '#1A1A1A' : '#999999'}
              />
            </Pressable>
          );
        })}
      </ContainerBlur>
    </View>
  );
}
