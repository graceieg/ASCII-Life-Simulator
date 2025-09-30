import React from 'react';

interface LegendItem {
  symbol: string;
  name: string;
  description: string;
  color?: string;
}

interface LegendGroup {
  title: string;
  items: LegendItem[];
}

const GameLegend: React.FC = () => {
  const allItems = [
    { symbol: "@", name: "Player", color: "text-blue-700" },
    { symbol: "&", name: "NPC", color: "text-green-700" },
    { symbol: "E", name: "Enemy", color: "text-red-700" },
    { symbol: "#", name: "Wall", color: "text-gray-700" },
    { symbol: "D", name: "Door", color: "text-amber-700" },
    { symbol: "T", name: "Teleporter", color: "text-purple-700" },
    { symbol: "S", name: "Switch", color: "text-cyan-700" },
    { symbol: "*", name: "Item", color: "text-gray-600" },
    { symbol: "K", name: "Key", color: "text-yellow-600" },
    { symbol: "P", name: "Potion", color: "text-pink-600" },
    { symbol: "W", name: "Weapon", color: "text-orange-600" },
    { symbol: "$", name: "Treasure", color: "text-emerald-600" }
  ];

  return (
    <div className="bg-gray-100 p-3 rounded border border-gray-200 text-xs">
      <div className="mb-3">
        <h4 className="text-gray-800 mb-1">Legend & Controls</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
        {allItems.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className={`font-mono ${item.color || 'text-gray-800'} bg-white px-1 rounded text-center w-5 h-5 flex items-center justify-center`}>
              {item.symbol}
            </span>
            <span className="text-gray-700 truncate">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-300 pt-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
          <span><kbd className="bg-gray-200 px-1 rounded">↑↓←→</kbd> Move</span>
          <span>Walk into enemies to attack</span>
          <span><kbd className="bg-gray-200 px-1 rounded">R</kbd> Restart</span>
          <span className="text-amber-600">Collect all treasures + defeat all enemies to advance</span>
        </div>
      </div>
    </div>
  );
};

export default GameLegend;