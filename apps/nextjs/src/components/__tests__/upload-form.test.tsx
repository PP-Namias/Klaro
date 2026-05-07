import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadForm } from '../upload-form';

// Mock navigator.mediaDevices.getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve(new MediaStream())),
  },
  writable: true,
});

describe('UploadForm (camera-first)', () => {
  it('renders video element and capture button', () => {
    render(<UploadForm />);
    const capture = screen.getByRole('button', { name: /capture/i });
    expect(capture).toBeInTheDocument();
  });
});
