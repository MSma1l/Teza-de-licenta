import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { schemaInregistrare, TipSchemaInregistrare } from '@/lib/validari/autentificare';
import { useAutentificare } from '@/hooks/use-autentificare';
import { sanitizeazaInput, sanitizeazaEmail } from '@/lib/securitate/sanitizare';

export function useFormularInregistrare() {
  const router = useRouter();
  const { inregistrare } = useAutentificare();
  const [seIncarca, setSeIncarca] = useState(false);
  const [mesajEroare, setMesajEroare] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TipSchemaInregistrare>({
    resolver: zodResolver(schemaInregistrare),
    defaultValues: {
      numeUtilizator: '',
      parola: '',
      email: '',
      telefon: '',
      captchaValidat: false,
    },
  });

  const laTrimitere = async (date: TipSchemaInregistrare) => {
    setMesajEroare('');
    setSeIncarca(true);
    try {
      const { captchaValidat: _, ...dateInregistrare } = date;
      // Sanitizare anti-XSS pe campurile vizibile (NU pe parola)
      const dateSanitizate = {
        numeUtilizator: sanitizeazaInput(dateInregistrare.numeUtilizator),
        email: sanitizeazaEmail(dateInregistrare.email),
        telefon: dateInregistrare.telefon.replace(/[^0-9+]/g, ''),
        parola: dateInregistrare.parola,
      };
      const mesaj = await inregistrare(dateSanitizate);
      Alert.alert('Succes', mesaj, [
        { text: 'OK', onPress: () => router.replace('/(autentificare)/logare') },
      ]);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : 'Inregistrarea a esuat. Incercati din nou.';
      setMesajEroare(mesaj);
    } finally {
      setSeIncarca(false);
    }
  };

  const seteazaCaptcha = (validat: boolean) => {
    setValue('captchaValidat', validat, { shouldValidate: true });
  };

  return {
    control,
    errors,
    seIncarca,
    mesajEroare,
    stergeEroare: () => setMesajEroare(''),
    trimite: handleSubmit(laTrimitere),
    seteazaCaptcha,
  };
}
