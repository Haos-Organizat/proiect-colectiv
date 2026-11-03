import { z } from 'zod';
import { EVENT_CATEGORIES } from './api';

/*
 * Frontend validation for every form. The backend must enforce the same rules;
 * docs/api-contract.md lists them per endpoint.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email.')
  .email('Enter an email like name@university.ro.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    // Same limits as backend/application/auth/validator.py.
    firstName: z
      .string()
      .trim()
      .min(1, 'Enter your first name.')
      .max(30, 'Keep it under 30 characters.'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Enter your last name.')
      .max(30, 'Keep it under 30 characters.'),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[A-Z]/, 'Add at least one uppercase letter.')
      .regex(/[a-z]/, 'Add at least one lowercase letter.'),
    confirmPassword: z.string().min(1, 'Repeat your password.'),
    isOrganizer: z.boolean(),
    acceptTerms: z.literal(true, { error: 'Accept the terms to create an account.' }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export function orderSchema(maxPerOrder: number, ticketsLeft: number) {
  const max = Math.min(maxPerOrder, ticketsLeft);
  return z.object({
    quantity: z
      .number({ error: 'Choose how many tickets.' })
      .int('Choose a whole number.')
      .min(1, 'Choose at least 1 ticket.')
      .max(max, `You can buy up to ${max} tickets.`),
  });
}
export type OrderInput = z.infer<ReturnType<typeof orderSchema>>;

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(4, 'Give the event a title of at least 4 characters.').max(90),
    category: z.enum(EVENT_CATEGORIES, { error: 'Pick a category.' }),
    description: z
      .string()
      .trim()
      .min(30, 'Describe the event in at least 30 characters.')
      .max(4000, 'Keep the description under 4000 characters.'),
    date: z.string().min(1, 'Pick a date.'),
    startTime: z.string().min(1, 'Pick a start time.'),
    endTime: z.string().min(1, 'Pick an end time.'),
    venue: z.string().trim().min(2, 'Enter the venue.'),
    city: z.string().trim().min(2, 'Enter the city.'),
    price: z
      .number({ error: 'Enter the ticket price, or choose Free.' })
      .min(0, 'Price cannot be negative.')
      .max(10000, 'Price looks too high.'),
    capacity: z
      .number({ error: 'Enter how many people can attend.' })
      .int('Use a whole number.')
      .min(1, 'Capacity must be at least 1.')
      .max(10000, 'Capacity can be at most 10,000.'),
    maxPerOrder: z
      .number({ error: 'Enter a limit per order.' })
      .int('Use a whole number.')
      .min(1, 'Allow at least 1 ticket per order.')
      .max(10, 'Allow at most 10 tickets per order.'),
    // Optional: the backend has no image upload yet.
    imageUrl: z.string(),
  })
  .refine((v) => `${v.venue}, ${v.city}`.length <= 100, {
    path: ['venue'],
    message: 'Venue and city together must be under 100 characters.',
  })
  .refine((v) => v.endTime > v.startTime, {
    path: ['endTime'],
    message: 'End time must be after the start time.',
  })
  .refine((v) => new Date(`${v.date}T${v.startTime}`) > new Date(), {
    path: ['date'],
    message: 'The event must start in the future.',
  });
export type EventFormInput = z.infer<typeof eventFormSchema>;
