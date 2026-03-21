import type { Metadata } from 'next';
import AnalysisPageClient from './AnalysisPageClient';

export const metadata: Metadata = {
  title: 'Spatial Analysis | CapeTown GIS Hub',
  description: 'Advanced geospatial analysis tools for Cape Town property intelligence',
};

export default function AnalysisPage() {
  return <AnalysisPageClient />;
}
