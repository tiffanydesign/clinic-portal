import React from "react";

export function StubPage({ title, sections }: { title: string, sections: string[] }) {
  return (
    <div className="p-8 w-full h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section} className="border border-gray-300 p-6 rounded-md bg-white">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{section}</h2>
            <div className="h-32 bg-gray-100 border border-gray-200 border-dashed rounded flex items-center justify-center">
              <span className="text-gray-400 text-sm">Placeholder for {section}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
