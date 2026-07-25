import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

document.execCommand = () => true;

Object.defineProperty(URL, 'createObjectURL', { writable: true, value: () => 'blob:resumeforge-test' });
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: () => {} });
