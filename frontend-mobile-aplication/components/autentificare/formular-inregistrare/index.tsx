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
import { CaptchaCheckbox } from '@/components/ui/captcha-checkbox';
import { CuloriApp } from '@/constants/culori';
import { useFormularInregistrare } from './use-formular-inregistrare';
import { styles } from './styles';

export function FormularInregistrare() {
  const insets = useSafeAreaInsets();
  const { control, errors, seIncarca, mesajEroare, stergeEroare, trimite, seteazaCaptcha } =
    useFormularInregistrare();

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
          <Text style={styles.titlu}>Create account</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <View style={styles.formular}>
            <Controller
              control={control}
              name="numeUtilizator"
              render={({ field: { onChange, onBlur, value } }) => (
                <CampFormular
                  iconita="person-outline"
                  placeholder="Username"
                  value={value}
                  onChangeText={(v) => {
                    stergeEroare();
                    onChange(v.replace(/[<>"'`]/g, '').slice(0, 100));
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
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

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <CampFormular
                  iconita="mail-outline"
                  placeholder="E-mail"
                  value={value}
                  onChangeText={(v) => {
                    stergeEroare();
                    onChange(v.replace(/[<>"'`\s]/g, '').slice(0, 255));
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  eroare={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="telefon"
              render={({ field: { onChange, onBlur, value } }) => (
                <CampFormular
                  iconita="phone-portrait-outline"
                  placeholder="Mobile"
                  value={value}
                  onChangeText={(v) => {
                    stergeEroare();
                    onChange(v.replace(/[^0-9+]/g, '').slice(0, 16));
                  }}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  eroare={errors.telefon?.message}
                />
              )}
            />

            {mesajEroare !== '' && (
              <Animated.View entering={FadeIn.duration(250)} style={stiluriEroare.container}>
                <Ionicons name="alert-circle" size={20} color={CuloriApp.eroare} />
                <Text style={stiluriEroare.text}>{mesajEroare}</Text>
              </Animated.View>
            )}

            <Controller
              control={control}
              name="captchaValidat"
              render={({ field: { value } }) => (
                <CaptchaCheckbox
                  valoare={value}
                  laSchimbare={seteazaCaptcha}
                  eroare={errors.captchaValidat?.message}
                />
              )}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View style={styles.containerButon}>
            <Buton text="Create" laApasare={trimite} seIncarca={seIncarca} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={styles.containerLink}>
            <Text style={styles.textLink}>Already have an account? </Text>
            <Link href="/(autentificare)/logare" asChild>
              <Pressable>
                <Text style={styles.textLinkActiv}>Sign in</Text>
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
