import { build } from 'vite';

async function customBuild() {
  try {
    await build();
  } catch (error) {
    console.error('Build failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1); // Exit with error code
  }
}

customBuild();
