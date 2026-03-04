import { DateLogare, DateInregistrare, RaspunsAutentificare } from '@/types/autentificare';

// TODO: Inlocuieste cu cereri reale catre backend
// import { cerereApi } from './client-api';

export async function logareApi(date: DateLogare): Promise<RaspunsAutentificare> {
  // Simulare raspuns backend - inlocuieste cu cerereApi('/auth/login', { metoda: 'POST', corp: date })
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    utilizator: {
      id: '1',
      numeUtilizator: date.numeUtilizator,
      email: 'user@example.com',
    },
    token: 'mock_jwt_token_' + Date.now(),
  };
}

export async function inregistrareApi(
  date: Omit<DateInregistrare, 'captchaValidat'>
): Promise<{ succes: boolean; mesaj: string }> {
  // Simulare raspuns backend - inlocuieste cu cerereApi('/auth/register', { metoda: 'POST', corp: date })
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    succes: true,
    mesaj: 'Contul a fost creat cu succes!',
  };
}
