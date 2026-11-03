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
    name: z.string().trim().min(2, 'Enter your full name.').max(80, 'Keep it under 80 characters.'),
    email,
    university: z.string().trim().max(120, 'Keep it under 120 characters.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/\d/, 'Add at least one number.'),
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
      .max(100000),
    maxPerOrder: z
      .number({ error: 'Enter a limit per order.' })
      .int('Use a whole number.')
      .min(1, 'Allow at least 1 ticket per order.')
      .max(10, 'Allow at most 10 tickets per order.'),
    imageUrl: z.string().min(1, 'Add a cover photo.'),
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
