import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { schemaInregistrare, TipSchemaInregistrare } from '@/lib/validari/autentificare';
import { useAutentificare } from '@/hooks/use-autentificare';

export function useFormularInregistrare() {
  const router = useRouter();
  const { inregistrare } = useAutentificare();
  const [seIncarca, setSeIncarca] = useState(false);

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
    setSeIncarca(true);
    try {
      const { captchaValidat, ...dateInregistrare } = date;
      const mesaj = await inregistrare(dateInregistrare);
      Alert.alert('Succes', mesaj, [
        { text: 'OK', onPress: () => router.replace('/(autentificare)/logare') },
      ]);
    } catch {
      Alert.alert('Eroare', 'Inregistrarea a esuat. Incercati din nou.');
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
    trimite: handleSubmit(laTrimitere),
    seteazaCaptcha,
  };
}
