import { createContext, useState, useEffect, useCallback } from 'react';
import { Utilizator } from '@/types/utilizator';
import { DateLogare, DateInregistrare } from '@/types/autentificare';
import { logareApi, inregistrareApi } from '@/lib/api/serviciu-autentificare';
import { salveazaToken, citesteToken, stergeToken } from '@/lib/stocare/stocare-securizata';

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
        // TODO: Verifica tokenul cu backend-ul si obtine datele utilizatorului
        // Pentru moment, setam un utilizator mock daca exista token
        setUtilizator({
          id: '1',
          numeUtilizator: 'Utilizator',
          email: 'user@example.com',
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
