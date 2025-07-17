/**
 * Sanitizes input and maintains cursor position.
 * @param event - Input event
 * @param allowedPattern - RegExp for allowed characters
 * @param setValue - Function to update the bound value
 */
export function inputSanitizer(
  event: Event,
  allowedPattern: RegExp,
  setValue: (val: string) => void
) {
  const target = event.target as HTMLInputElement;
  const oldValue = target.value;
  const oldPos = target.selectionStart ?? 0;

  // Sanitize input
  const newValue = oldValue.replace(allowedPattern, '');

  // Calculate new cursor position
  let newPos = oldPos;

  if (newValue.length < oldValue.length) {
    newPos -= (oldValue.length - newValue.length);
    if (newPos < 0) newPos = 0;
  }

  target.value = newValue;
  setValue(newValue);

  // Restore cursor position
  if (target.type === 'text' && typeof target.setSelectionRange === 'function') {
    target.setSelectionRange(newPos, newPos);
  }
}
