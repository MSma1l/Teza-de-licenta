import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { schemaLogare, TipSchemaLogare } from '@/lib/validari/autentificare';
import { useAutentificare } from '@/hooks/use-autentificare';

export function useFormularLogare() {
  const { logare } = useAutentificare();
  const [seIncarca, setSeIncarca] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TipSchemaLogare>({
    resolver: zodResolver(schemaLogare),
    defaultValues: {
      numeUtilizator: '',
      parola: '',
    },
  });

  const laTrimitere = async (date: TipSchemaLogare) => {
    setSeIncarca(true);
    try {
      await logare(date);
    } catch {
      Alert.alert('Eroare', 'Logarea a esuat. Verificati datele.');
    } finally {
      setSeIncarca(false);
    }
  };

  return {
    control,
    errors,
    seIncarca,
    trimite: handleSubmit(laTrimitere),
  };
}
