// actions/formActions.ts
import { setDirty } from '../stores/formStore';

export function trackDirty(node: HTMLElement) {
  const handleInput = () => setDirty(true);
  
  node.addEventListener('input', handleInput);
  
  return {
    destroy() {
      node.removeEventListener('input', handleInput);
    }
  };
}
