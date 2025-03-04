import { log } from "$lib/plugins/Logger";

// Fetch a given key using the API
export async function apiKeyFetch(apiUrl: string, keyId: string) {
  try {
    const response = await fetch(`${apiUrl}/api/syek/${keyId}`);
    const data = await response.json();
    return data.key;
  } catch (error) {
    log.error("Error fetching key:", false, keyId);
    throw error;
  }
}
