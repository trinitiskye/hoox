'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  view?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (view: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5">
        <nav className="flex items-center gap-1 text-sm">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              {item.view && i < items.length - 1 ? (
                <button
                  onClick={() => onNavigate(item.view!)}
                  className="text-gray-400 hover:text-blue-600 transition"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-700 font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
