import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { schemaLogare, TipSchemaLogare } from '@/lib/validari/autentificare';
import { useAutentificare } from '@/hooks/use-autentificare';
import { sanitizeazaInput } from '@/lib/securitate/sanitizare';

export function useFormularLogare() {
  const { logare } = useAutentificare();
  const [seIncarca, setSeIncarca] = useState(false);
  const [mesajEroare, setMesajEroare] = useState('');

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
    setMesajEroare('');
    setSeIncarca(true);
    try {
      // Sanitizare anti-XSS si anti-injection inainte de a trimite la backend
      const dateSanitizate = {
        numeUtilizator: sanitizeazaInput(date.numeUtilizator),
        parola: date.parola, // parola NU se sanitizeaza, ramane raw
      };
      await logare(dateSanitizate);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : 'Logarea a esuat. Verificati datele.';
      setMesajEroare(mesaj);
    } finally {
      setSeIncarca(false);
    }
  };

  return {
    control,
    errors,
    seIncarca,
    mesajEroare,
    stergeEroare: () => setMesajEroare(''),
    trimite: handleSubmit(laTrimitere),
  };
}
