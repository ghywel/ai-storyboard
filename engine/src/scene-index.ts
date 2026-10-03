// The scene loader shared by every timeline: scenes/<name>.ts (subfolders allowed, e.g. "myfilm/intro"), falling back
// to the `stub` plate while a plate is still being built.
import type { SceneClass } from './engine/scene';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/**/*.ts');
export const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`] ?? modules['./scenes/stub.ts'];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

