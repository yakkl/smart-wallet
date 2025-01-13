import { getSettings, syncStoresToStorage } from '$lib/common/stores';
import { goto } from '$app/navigation';

export async function load() {
  try {
    const yakklSettings = await getSettings();

    if (!yakklSettings) {
      goto('/register'); // Navigate to registration
      return;
    }

    if (yakklSettings.init) {
      await syncStoresToStorage(); // Sync stores
      goto('/login/Login'); // Navigate to login
      return;
    }

    if (!yakklSettings.legal?.termsAgreed) {
      goto('/legal'); // Navigate to legal terms
      return;
    }

    return { yakklSettings, error: null } as { yakklSettings: any; error: string | null }; // Explicit typing
  } catch (err) {
    let errorMessage = 'An unknown error occurred';

    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return { yakklSettings: null, error: errorMessage }; // Pass error to the page
  }
}
