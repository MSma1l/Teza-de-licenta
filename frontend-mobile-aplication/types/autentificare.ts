import { Utilizator } from './utilizator';

export interface DateLogare {
  numeUtilizator: string;
  parola: string;
}

export interface DateInregistrare {
  numeUtilizator: string;
  parola: string;
  email: string;
  telefon: string;
  captchaValidat: boolean;
}

export interface RaspunsAutentificare {
  utilizator: Utilizator;
  token: string;
}

export interface StareAutentificare {
  utilizator: Utilizator | null;
  token: string | null;
  esteAutentificat: boolean;
  seIncarca: boolean;
}
