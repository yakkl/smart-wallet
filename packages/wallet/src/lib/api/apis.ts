
// Fetch a given key using the API
export async function apiKeyFetch(apiUrl: string, keyId: string) {
  try {
    const response = await fetch(`${apiUrl}/api/syek/${keyId}`);
    const data = await response.json();
    return data.key;
  } catch (error) {
    console.log("Error fetching key:", keyId);
    throw error;
  }
}
