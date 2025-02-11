import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ parent }) => {
  console.log("App layout.ts: Waiting for parent...");
  const parentData = await parent();

  return { ...parentData }; // Merges parent data with this layout's data
};
