import React from "react";

export function StubPage({ title, sections }: { title: string, sections: string[] }) {
  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-2xl font-bold text-ink mb-6">{title}</h1>
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section} className="border border-divider p-6 rounded-control bg-surface">
            <h2 className="text-lg font-semibold text-ink-soft mb-4">{section}</h2>
            <div className="h-32 bg-surface-hover border border-divider border-dashed rounded-control flex items-center justify-center">
              <span className="text-ink-muted text-sm">Placeholder for {section}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
