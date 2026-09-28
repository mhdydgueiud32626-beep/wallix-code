import React from 'react';
import { 
  Zap, 
  Globe, 
  Sparkles, 
  Box, 
  Compass, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { CategoryInfo } from '../types';

interface CategoriesViewProps {
  categories: CategoryInfo[];
  onSelectCategory: (catId: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <div id="categories-view" className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
          Wallpaper Categories
        </h2>
        <p className="text-sm text-slate-400">
          Browse by curated aesthetics, 3D render styles, and live shader categories.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id === 'all' ? 'all' : cat.name)}
            className="group relative h-48 rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20"
          >
            {/* Background Image */}
            <img
              src={cat.bannerImage}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1016] via-[#0F1016]/70 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    {cat.count} Wallpapers
                  </span>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/10 group-hover:bg-cyan-500 group-hover:text-black text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
