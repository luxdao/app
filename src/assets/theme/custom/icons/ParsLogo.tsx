import { createIcon } from '@chakra-ui/react';

export const ParsLogo = createIcon({
  displayName: 'ParsLogo',
  viewBox: '0 0 100 100',
  path: (
    <>
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M50 20 L35 45 L50 40 L65 45 Z" fill="currentColor"/>
      <circle cx="50" cy="55" r="12" fill="currentColor"/>
      <path d="M30 65 Q50 80 70 65" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </>
  ),
});

// Pars DAO Logo - Faravahar-inspired symbol
// Circle: represents unity and eternity
// Wing shape: Persian heritage
// Source: Pars DAO branding
