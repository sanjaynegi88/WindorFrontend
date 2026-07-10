'use client';

export class GoogleLoginCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleLoginCancelledError';
  }
}

export type { CredentialResponse } from '@react-oauth/google';
