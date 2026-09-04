type BackHandler = () => boolean;

const stack: BackHandler[] = [];

/**
 * Registers a handler that intercepts the Android hardware/gesture back
 * action. Return true if the back action was consumed (e.g. stepping back
 * one screen inside a wizard), false to fall through to router navigation.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  stack.push(handler);
  return () => {
    const i = stack.indexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  };
}

export function consumeBackHandler(): boolean {
  if (stack.length === 0) return false;
  return stack[stack.length - 1]();
}
