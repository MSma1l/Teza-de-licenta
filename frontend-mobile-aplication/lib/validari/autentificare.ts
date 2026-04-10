import { z } from 'zod';

export const schemaLogare = z.object({
  numeUtilizator: z
    .string()
    .min(1, 'Username-ul sau email-ul este obligatoriu')
    .max(255, 'Campul nu poate depasi 255 caractere'),
  parola: z
    .string()
    .min(1, 'Parola este obligatorie')
    .max(128, 'Parola nu poate depasi 128 caractere'),
});

export const schemaInregistrare = z
  .object({
    numeUtilizator: z
      .string()
      .min(1, 'Username-ul este obligatoriu')
      .min(3, 'Username-ul trebuie sa aiba minim 3 caractere')
      .max(100, 'Username-ul nu poate depasi 100 caractere'),
    parola: z
      .string()
      .min(1, 'Parola este obligatorie')
      .min(8, 'Parola trebuie sa aiba minim 8 caractere')
      .max(128, 'Parola nu poate depasi 128 caractere')
      .regex(/[A-Z]/, 'Parola trebuie sa contina cel putin o majuscula')
      .regex(/[a-z]/, 'Parola trebuie sa contina cel putin o minuscula')
      .regex(/\d/, 'Parola trebuie sa contina cel putin o cifra'),
    email: z
      .string()
      .min(1, 'Email-ul este obligatoriu')
      .email('Adresa de email nu este valida')
      .max(255, 'Email-ul nu poate depasi 255 caractere'),
    telefon: z
      .string()
      .min(1, 'Numarul de telefon este obligatoriu')
      .regex(/^\+?[0-9]{7,15}$/, 'Numarul de telefon nu este valid'),
    captchaValidat: z
      .boolean()
      .refine((val) => val === true, 'Confirma ca nu esti robot'),
  });

export type TipSchemaLogare = z.infer<typeof schemaLogare>;
export type TipSchemaInregistrare = z.infer<typeof schemaInregistrare>;
