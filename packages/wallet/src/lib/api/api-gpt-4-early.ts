import { log } from "$lib/plugins/Logger";
import { isOnline } from "$lib/utilities/utilities";

const API_ENDPOINT = 'https://api.openai.com/v1/engines/gpt-4/completions';

export async function fetchGPT4Response(prompt: string) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GPT_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      max_tokens: 50,
      n: 1,
      stop: null,
      temperature: 0.7,
    }),
  };

  try {
    const response = await fetch(API_ENDPOINT, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      if (await isOnline()) {
        throw new Error(`Error ${response.status}: ${data.message}`);
      } else {
        throw new Error('Internet connection appears to be disabled.');
      }
    }

    return data.choices[0].text.trim();
  } catch (error) {
    log.error('Error fetching GPT-4 response:', false, error);
    throw error;
  }
}
