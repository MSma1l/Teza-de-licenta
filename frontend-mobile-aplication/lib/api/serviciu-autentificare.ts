import { DateLogare, DateInregistrare, RaspunsAutentificare } from '@/types/autentificare';
import { cerereApi } from './client-api';

interface RaspunsToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface DateUtilizatorBackend {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: string;
}

export async function logareApi(date: DateLogare): Promise<RaspunsAutentificare> {
  /* Obține tokenurile de la backend */
  const tokeni = await cerereApi<RaspunsToken>('/auth/login', {
    metoda: 'POST',
    corp: {
      username: date.numeUtilizator,
      password: date.parola,
    },
    faraAuth: true,
  });

  /* Salvează tokenurile */
  const { salveazaToken, salveazaRefreshToken } = await import('@/lib/stocare/stocare-securizata');
  await salveazaToken(tokeni.access_token);
  await salveazaRefreshToken(tokeni.refresh_token);

  /* Obține datele utilizatorului */
  const user = await cerereApi<DateUtilizatorBackend>('/auth/me', {
    token: tokeni.access_token,
  });

  return {
    utilizator: {
      id: user.id,
      numeUtilizator: user.username,
      email: user.email,
      telefon: user.phone || undefined,
    },
    token: tokeni.access_token,
  };
}

export async function inregistrareApi(
  date: Omit<DateInregistrare, 'captchaValidat'>
): Promise<{ succes: boolean; mesaj: string }> {
  await cerereApi<DateUtilizatorBackend>('/auth/register', {
    metoda: 'POST',
    corp: {
      username: date.numeUtilizator,
      email: date.email,
      password: date.parola,
      phone: date.telefon,
    },
    faraAuth: true,
  });

  return {
    succes: true,
    mesaj: 'Contul a fost creat cu succes!',
  };
}
