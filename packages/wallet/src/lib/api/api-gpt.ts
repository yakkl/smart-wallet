import { getYakklGPTKeyStore } from "$lib/common/stores";
import { log } from "$lib/plugins/Logger";
import OpenAI from "openai";


/**
 * @param {string} prompt
 */
export async function fetchGPT4Response(prompt: string) {
  let response = null;
  const apiKey = getYakklGPTKeyStore();

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // NOTE: This is required for the browser to work. This is a security risk. //TODO: Remove this!!! before pushing to production.
    });

    response = await openai.chat.completions.create({
      model: "gpt-4o",

      // NOTE: Add a mission statement to the prompt around crypto. Make sure that no one can change the mission statement.
      // NOTE: Set context and provide an answer to the question such as "I can't answer the question right now, but I can tell you about crypto."
      // NOTE: Prepend the prompt before passing in the prompt.
      messages: [{role: "user", content: prompt}],
    });

    // Example usage:
    // "usage": {
    //   "prompt_tokens": 9,
    //   "completion_tokens": 12,
    //   "total_tokens": 21
    // }

    return {"usage": response.usage, "content": response.choices[0].message.content};
  } catch (error) {
    log.error("Error fetching GPT response:", false, error);
    log.error("Response:", false, response);

    throw {error: error, response: response};
  }
}

