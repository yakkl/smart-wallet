import * as yup from 'yup';
import { writable } from 'svelte/store';

// Define the schema
export const sendFormSchema = yup.object().shape({
  toAddress: yup
    .string()
    .required('Please enter a recipient address.')
    .matches(/^(0x)?[0-9a-fA-F]{40}$|^.*\.eth$/, 'Must be a valid Ethereum address or ENS name.'),
  amount: yup
    .number()
    .required('Please enter the amount to send.')
    .moreThan(0, 'Amount must be greater than 0.'),
});

// Stores for data and errors
export const formData = writable({
  toAddress: '',
  amount: '',
});

export const formErrors = writable<Record<string, string | undefined>>({});

// Validation function
export async function validateForm(data: Record<string, any>): Promise<boolean> {
  try {
    formErrors.set({});
    await sendFormSchema.validate(data, { abortEarly: false });
    return true;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string | undefined> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      formErrors.set(errors);
    }
    return false;
  }
}
