import React from 'react';
import { Download, X, Maximize2 } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  label: string;
  onClear?: () => void;
  isGenerated?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, label, onClear, isGenerated }) => {
  return (
    <div className="relative group w-full h-full min-h-[300px] bg-black/20 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-semibold text-white bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
          {label}
        </span>
        {onClear && (
          <button 
            onClick={onClear}
            className="p-1.5 bg-black/40 text-white hover:bg-red-500/80 rounded-full backdrop-blur-sm border border-white/10 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center p-1">
        <img 
          src={src} 
          alt={label} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
        />
      </div>

      {/* Footer Actions (Only for generated) */}
      {isGenerated && (
        <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-end gap-2 z-10 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <a 
            href={src} 
            download={`nano-edit-${Date.now()}.png`}
            className="p-2 bg-primary/90 hover:bg-primary text-white rounded-lg backdrop-blur-sm shadow-lg transition-transform hover:scale-105 flex items-center text-xs font-bold"
          >
            <Download className="w-4 h-4 mr-1" />
            Save
          </a>
        </div>
      )}
    </div>
  );
};
