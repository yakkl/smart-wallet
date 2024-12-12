import { browser } from '$app/environment';
import { goto } from '$app/navigation';

export function safeGoto(url: string) {
  if (browser) {
    goto(url);
  }
}
