import z from 'zod';
import sanitizeHtml from 'sanitize-html';

export const trustEmailDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'aol.com',
  'zoho.com',
  'yandex.com',
  'live.com',
  'msn.com',
  'me.com',
  'mac.com',
  'googlemail.com',
];

export const safeHtmlTags = [
  'b',
  'i',
  'em',
  'strong',
  'p',
  'ul',
  'ol',
  'li',
  'br',
];

const regexes = {
  phoneNumber: /^\+?[0-9\s\-().]{10,}$/,
  phoneDigits: /[0-9]{10,15}/,
  username: /^[a-zA-Z0-9_]+$/,
  letter: /[A-Za-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

export const sharedDtoSchema = {
  phoneNumber: () =>
    z
      .string('Phone number is required')
      .trim()
      .refine(
        (val) =>
          //? This regex checks for a valid phone number format (E.164) and ensures it contains 10 to 15 digits after removing non-digit characters.
          regexes.phoneNumber.test(val) &&
          regexes.phoneDigits.test(val.replace(/\D/g, '')),
        'Invalid phone number format. Accepted format: E.164 (+1234567890)',
      )
      .transform((val) => `+${val.replace(/\D/g, '')}`), // Normalize to E.164 format

  name: (options = { field: 'Name' }) =>
    z
      .string()
      .min(2, `${options.field} must be at least 2 characters`)
      .max(50, `${options.field} must be at most 50 characters`),

  password: (options = { level: 'weak' as 'weak' | 'medium' | 'strong' }) =>
    z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password must be at most 32 characters')
      .superRefine((val, ctx) => {
        if (options.level === 'weak') return;

        const hasLetter = regexes.letter.test(val);
        const hasNumber = regexes.number.test(val);
        const hasSpecial = regexes.special.test(val);

        if (options.level === 'medium' && !(hasLetter && hasNumber)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Password must contain at least one letter and one number',
          });
        }

        if (
          options.level === 'strong' &&
          !(hasLetter && hasNumber && hasSpecial)
        ) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Password must contain at least one letter, one number, and one special character',
          });
        }
      }),

  email: (options = { trustCheck: true }) =>
    z
      .email('Invalid email address')
      .max(255, 'Email must be at most 255 characters')
      .refine(
        (email) => {
          let isValid = true;

          if (options.trustCheck) {
            const domain = email.split('@')[1]?.toLowerCase();
            isValid = domain ? trustEmailDomains.includes(domain) : false;
          }

          return isValid;
        },
        `Email domain must be one of: ${trustEmailDomains.join(', ')}`,
      )
      .toLowerCase(),

  username: () =>
    z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        regexes.username,
        'Username can only contain letters, numbers, and underscores',
      )
      .toLowerCase(),

  otp: (length = 6) =>
    z.string().length(length, `OTP should be ${length} digits`),

  notes: (maxLength = 255) =>
    z.string().max(maxLength, `Notes must be at most ${maxLength} characters`),

  htmlString: (
    options = {
      maxLength: 5000,
      field: 'HTML string',
    },
  ) =>
    z
      .string()
      .max(
        options.maxLength,
        `${options.field} must be at most ${options.maxLength} characters`,
      )
      .transform((val) =>
        sanitizeHtml(val, {
          allowedTags: safeHtmlTags,
          allowedAttributes: {},
        }),
      ),

  date: (
    options = {
      removeTime: false,
    },
  ) =>
    z.iso.date().transform((date) => {
      const dateObj = new Date(date);

      if (options.removeTime) {
        dateObj.setHours(0, 0, 0, 0);
      }

      return dateObj;
    }),

  boolean: () =>
    z.union([z.string().transform((val) => val === 'true'), z.boolean()]),
};
