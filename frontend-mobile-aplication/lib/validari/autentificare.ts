import { z } from 'zod';

export const schemaLogare = z.object({
  numeUtilizator: z
    .string()
    .min(1, 'Username-ul este obligatoriu')
    .min(3, 'Username-ul trebuie sa aiba minim 3 caractere'),
  parola: z
    .string()
    .min(1, 'Parola este obligatorie')
    .min(6, 'Parola trebuie sa aiba minim 6 caractere'),
});

export const schemaInregistrare = z
  .object({
    numeUtilizator: z
      .string()
      .min(1, 'Username-ul este obligatoriu')
      .min(3, 'Username-ul trebuie sa aiba minim 3 caractere'),
    parola: z
      .string()
      .min(1, 'Parola este obligatorie')
      .min(6, 'Parola trebuie sa aiba minim 6 caractere'),
    email: z
      .string()
      .min(1, 'Email-ul este obligatoriu')
      .email('Adresa de email nu este valida'),
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
