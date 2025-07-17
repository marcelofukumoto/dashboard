import { inputSanitizer } from '../inputSanitizer';

function createInputEvent(initialValue: string, selectionStart = 0): Event & { target: HTMLInputElement } {
  const input = document.createElement('input');

  input.value = initialValue;
  input.selectionStart = selectionStart;
  input.selectionEnd = selectionStart;

  return { target: input } as Event & { target: HTMLInputElement };
}

describe('inputSanitizer', () => {
  it('removes disallowed characters and keeps cursor position', () => {
    let sanitizedValue = '';
    const event = createInputEvent('1a,2', 2);

    inputSanitizer(event, /[^\d,]/g, (val) => {
      sanitizedValue = val;
    });

    expect(sanitizedValue).toBe('1,2');
    expect(event.target.value).toBe('1,2');
    expect(event.target.selectionStart).toBe(1); // Cursor should move left after removing 'a'
  });

  it('does not change value if all characters are allowed', () => {
    let sanitizedValue = '';
    const event = createInputEvent('123,456', 4);

    inputSanitizer(event, /[^\d,]/g, (val) => {
      sanitizedValue = val;
    });

    expect(sanitizedValue).toBe('123,456');
    expect(event.target.value).toBe('123,456');
    expect(event.target.selectionStart).toBe(4);
  });

  it('handles empty input', () => {
    let sanitizedValue = '';
    const event = createInputEvent('', 0);

    inputSanitizer(event, /[^\d,]/g, (val) => {
      sanitizedValue = val;
    });

    expect(sanitizedValue).toBe('');
    expect(event.target.value).toBe('');
    expect(event.target.selectionStart).toBe(0);
  });
});
