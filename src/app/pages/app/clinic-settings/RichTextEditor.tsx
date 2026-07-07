import React, { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Link2 } from "lucide-react";

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection alive
      onClick={onClick}
      className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
    >
      {icon}
    </button>
  );
}

// Lightweight contentEditable rich-text field. Uncontrolled by design: the
// DOM is only re-synced from `value` when it diverges from what's already
// there, so typing never fights React for the caret position.
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 90,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  const handleLink = () => {
    const url = window.prompt("Link URL (e.g. https://example.com)");
    if (url) exec("createLink", url);
  };

  return (
    <div className="border border-gray-300 rounded overflow-hidden focus-within:border-slate-500 transition-colors bg-white">
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 bg-gray-50">
        <ToolbarButton icon={<Bold className="w-3.5 h-3.5" />} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={<Italic className="w-3.5 h-3.5" />} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={<Underline className="w-3.5 h-3.5" />} label="Underline" onClick={() => exec("underline")} />
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton icon={<Heading2 className="w-3.5 h-3.5" />} label="Heading" onClick={() => exec("formatBlock", "h3")} />
        <ToolbarButton icon={<List className="w-3.5 h-3.5" />} label="Bullet List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={<ListOrdered className="w-3.5 h-3.5" />} label="Numbered List" onClick={() => exec("insertOrderedList")} />
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton icon={<Link2 className="w-3.5 h-3.5" />} label="Link" onClick={handleLink} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="px-3 py-2 text-sm text-gray-800 outline-none leading-relaxed [&_p]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-slate-600 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}
