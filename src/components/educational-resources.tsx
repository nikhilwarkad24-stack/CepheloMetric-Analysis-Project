
'use client';

import Link from 'next/link';
import { Button } from './ui/button';

const resources = [
  {
    title: 'AAO Cephalometric Reference',
    description: 'Official guides from the American Association of Orthodontists.',
    href: 'https://www.aaoinfo.org/',
  },
  {
    title: 'Introduction to Steiner Analysis',
    description: 'A foundational guide to one of the most common analyses.',
    href: 'https://www.jaypeedigital.com/e-books/9789352703487/chapter/ch35#',
  },
  {
    title: 'Soft Tissue Analysis Landmarks',
    description: 'A visual guide to key soft tissue points of interest.',
    href: 'https://www.orthodontics.com/wp-content/uploads/2021/01/Soft-Tissue-Cephalometric-Analysis.pdf',
  },
];

export function EducationalResources() {
  return (
    <ul className="space-y-3">
      {resources.map((resource) => (
        <li key={resource.title} className="p-3 rounded-lg border flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{resource.title}</h4>
            <p className="text-xs text-muted-foreground">{resource.description}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={resource.href} target="_blank" rel="noopener noreferrer">
              View
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
