import { getSettings, syncStoresToStorage } from '$lib/common/stores';
import { PATH_LEGAL, PATH_LOGIN, PATH_REGISTER, type Settings } from '$lib/common';

interface LoadReturnType {
  yakklSettings: Settings | null;
  paths: {
    legal: string;
    register: string;
    login: string;
  } | null;
  error: string | null;
}

export async function load(): Promise<LoadReturnType> {
  try {
    const yakklSettings = await getSettings();

    // Return navigation paths for the page to handle redirection
    const paths = {
      legal: PATH_LEGAL,
      register: PATH_REGISTER,
      login: PATH_LOGIN,
    };

    if (!yakklSettings) {
      return { yakklSettings: null, paths, error: 'Settings not found' };
    }

    if (!yakklSettings.legal?.termsAgreed) {
      return { yakklSettings, paths, error: null }; // Render legal page
    }

    if (!yakklSettings.init) {
      return { yakklSettings, paths, error: null }; // Render registration page
    }

    await syncStoresToStorage();
    return { yakklSettings, paths, error: null };
  } catch (err) {
    let errorMessage = 'An unknown error occurred';

    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return { yakklSettings: null, paths: null, error: errorMessage };
  }
}
