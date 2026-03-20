import React from 'react';
import { CrayonCard } from '../ui/CrayonCard';
import { ScribbleIcon } from '../ui/ScribbleIcon';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      title: "Map Every Value",
      description: "Trace the economic contours of the urban landscape with precise valuation modeling.",
      variant: "yellow" as const,
      icon: (
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      )
    },
    {
      title: "Trace the Skies",
      description: "Visualize the invisible corridors of our airspace with real-time flight telemetry.",
      variant: "blue" as const,
      icon: (
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 3 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      )
    },
    {
      title: "Overlay Insight",
      description: "Don’t just view maps—layer them. Combine diverse datasets for multi-dimensional analysis.",
      variant: "pink" as const,
      icon: (
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      )
    }
  ];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <CrayonCard key={idx} colorVariant={feature.variant} className="flex flex-col h-full">
            <div className={`mb-6 p-3 rounded-full w-fit bg-zinc-900 border border-zinc-800 text-crayon-${feature.variant}`}>
              <ScribbleIcon size={32}>
                {feature.icon}
              </ScribbleIcon>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white uppercase tracking-tight">
              {feature.title}
            </h3>
            <p className="text-zinc-400 leading-relaxed font-medium">
              {feature.description}
            </p>
            <div className="mt-auto pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={`text-xs font-bold uppercase tracking-widest text-crayon-${feature.variant}`}>
                Learn More →
              </span>
            </div>
          </CrayonCard>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
