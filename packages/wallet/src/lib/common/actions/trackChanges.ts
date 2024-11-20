// actions/trackChanges.ts
import { setDirty } from '../stores/formStore';

export function trackChanges(node: HTMLElement) {
  const handleChange = () => setDirty(true);
  
  node.addEventListener('change', handleChange);
  node.addEventListener('input', handleChange);
  
  return {
    destroy() {
      node.removeEventListener('change', handleChange);
      node.removeEventListener('input', handleChange);
    }
  };
}
