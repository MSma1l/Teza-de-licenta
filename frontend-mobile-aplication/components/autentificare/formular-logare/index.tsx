import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CampFormular } from '@/components/ui/camp-formular';
import { Buton } from '@/components/ui/buton';
import { useFormularLogare } from './use-formular-logare';
import { styles } from './styles';

export function FormularLogare() {
  const insets = useSafeAreaInsets();
  const { control, errors, seIncarca, trimite } = useFormularLogare();

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
                  placeholder="Username"
                  value={value}
                  onChangeText={onChange}
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
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  eroare={errors.parola?.message}
                />
              )}
            />

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
