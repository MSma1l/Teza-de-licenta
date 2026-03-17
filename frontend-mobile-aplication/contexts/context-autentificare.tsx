import { createContext, useState, useEffect, useCallback } from 'react';
import { Utilizator } from '@/types/utilizator';
import { DateLogare, DateInregistrare } from '@/types/autentificare';
import { logareApi, inregistrareApi } from '@/lib/api/serviciu-autentificare';
import { salveazaToken, citesteToken, stergeToken } from '@/lib/stocare/stocare-securizata';
import { cerereApi } from '@/lib/api/client-api';

interface DateUtilizatorBackend {
  id: string;
  username: string;
  email: string;
  phone: string | null;
}

interface ValoareContextAutentificare {
  utilizator: Utilizator | null;
  esteAutentificat: boolean;
  seIncarca: boolean;
  logare: (date: DateLogare) => Promise<void>;
  inregistrare: (date: Omit<DateInregistrare, 'captchaValidat'>) => Promise<string>;
  delogare: () => Promise<void>;
}

export const ContextAutentificare = createContext<ValoareContextAutentificare>({
  utilizator: null,
  esteAutentificat: false,
  seIncarca: true,
  logare: async () => {},
  inregistrare: async () => '',
  delogare: async () => {},
});

export function FurnizorAutentificare({ children }: { children: React.ReactNode }) {
  const [utilizator, setUtilizator] = useState<Utilizator | null>(null);
  const [seIncarca, setSeIncarca] = useState(true);

  useEffect(() => {
    verificaTokenSalvat();
  }, []);

  async function verificaTokenSalvat() {
    try {
      const token = await citesteToken();
      if (token) {
        /* Verifică token-ul cu backend-ul și obține datele utilizatorului */
        const user = await cerereApi<DateUtilizatorBackend>('/auth/me', { token });
        setUtilizator({
          id: user.id,
          numeUtilizator: user.username,
          email: user.email,
          telefon: user.phone || undefined,
        });
      }
    } catch {
      await stergeToken();
    } finally {
      setSeIncarca(false);
    }
  }

  const logare = useCallback(async (date: DateLogare) => {
    const raspuns = await logareApi(date);
    await salveazaToken(raspuns.token);
    setUtilizator(raspuns.utilizator);
  }, []);

  const inregistrare = useCallback(
    async (date: Omit<DateInregistrare, 'captchaValidat'>) => {
      const raspuns = await inregistrareApi(date);
      return raspuns.mesaj;
    },
    []
  );

  const delogare = useCallback(async () => {
    await stergeToken();
    setUtilizator(null);
  }, []);

  return (
    <ContextAutentificare.Provider
      value={{
        utilizator,
        esteAutentificat: !!utilizator,
        seIncarca,
        logare,
        inregistrare,
        delogare,
      }}>
      {children}
    </ContextAutentificare.Provider>
  );
}
