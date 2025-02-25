import type { Load } from '@sveltejs/kit';
import { log } from '$plugins/Logger';

export const load: Load = async ({ parent }) => {
  log.info("App layout.ts: Waiting for parent...");
  const parentData = await parent();

  return { ...parentData }; // Merges parent data with this layout's data
};
