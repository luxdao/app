import { createIcon } from '@chakra-ui/react';

export const LuxTriangle = createIcon({
  displayName: 'LuxTriangle',
  viewBox: '0 0 100 100',
  path: (
    <path
      d="M50 85 L15 25 L85 25 Z"
      fill="currentColor"
    />
  ),
});

// Lux Triangle Logo (inverted/downward-pointing):
// Top left: (15, 25)
// Top right: (85, 25)
// Bottom vertex: (50, 85)
// Source: ~/work/lux/logo/dist/lux-logo.svg