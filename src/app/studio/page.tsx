'use client';

import { CephalometricStudio } from '@/components/cephalometric-studio';
import { useAuthProtection } from '@/hooks/use-auth-protection';

export default function StudioPage() {
  useAuthProtection();
  return <CephalometricStudio />;
}
