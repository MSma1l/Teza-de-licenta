import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { CampFormular } from '@/components/ui/camp-formular';
import { Buton } from '@/components/ui/buton';
import { CuloriApp } from '@/constants/culori';
import { useFormularLogare } from './use-formular-logare';
import { styles } from './styles';

export function FormularLogare() {
  const insets = useSafeAreaInsets();
  const { control, errors, seIncarca, mesajEroare, stergeEroare, trimite } = useFormularLogare();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[
          styles.continutScroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.titlu}>Nice to see you</Text>
          <Text style={styles.subtitlu}>Sign in to your account</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <View style={styles.formular}>
            <Controller
              control={control}
              name="numeUtilizator"
              render={({ field: { onChange, onBlur, value } }) => (
                <CampFormular
                  iconita="person-outline"
                  placeholder="Username sau Email"
                  value={value}
                  onChangeText={(v) => {
                    stergeEroare();
                    onChange(v.replace(/[<>"'`]/g, '').slice(0, 255));
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  eroare={errors.numeUtilizator?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="parola"
              render={({ field: { onChange, onBlur, value } }) => (
                <CampFormular
                  iconita="lock-closed-outline"
                  placeholder="Password"
                  value={value}
                  onChangeText={(v) => {
                    stergeEroare();
                    onChange(v.slice(0, 128));
                  }}
                  onBlur={onBlur}
                  secureTextEntry
                  eroare={errors.parola?.message}
                />
              )}
            />

            {mesajEroare !== '' && (
              <Animated.View entering={FadeIn.duration(250)} style={stiluriEroare.container}>
                <Ionicons name="alert-circle" size={20} color={CuloriApp.eroare} />
                <Text style={stiluriEroare.text}>{mesajEroare}</Text>
              </Animated.View>
            )}

            <Pressable style={styles.linkParolaUitata}>
              <Text style={styles.textParolaUitata}>Forgot your password?</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View style={styles.containerButon}>
            <Buton text="Sign in" laApasare={trimite} seIncarca={seIncarca} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={styles.containerLink}>
            <Text style={styles.textLink}>Don't have an account? </Text>
            <Link href="/(autentificare)/inregistrare" asChild>
              <Pressable>
                <Text style={styles.textLinkActiv}>Create</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stiluriEroare = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CuloriApp.eroareFundal,
    borderWidth: 1,
    borderColor: CuloriApp.eroare,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: CuloriApp.eroare,
    fontWeight: '600',
    lineHeight: 18,
  },
});
