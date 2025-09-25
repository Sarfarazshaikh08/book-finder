// src/setupTests.js
import '@testing-library/jest-dom';

// Mock localStorage
beforeAll(() => {
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn(() => {});
});
