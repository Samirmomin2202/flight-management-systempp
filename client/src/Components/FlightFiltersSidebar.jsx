import React from "react";

const FlightFiltersSidebar = ({
  showAll,
  onToggleShowAll,
  timeOfDay,
  setTimeOfDay,
  airlineFilter,
  setAirlineFilter,
  airlineOptions = [],
  sortBy,
  sortOrder,
  onSort,
  onReload,
  priceRange,
  onPriceChange,
}) => {
  const absMin = priceRange?.absMin ?? 0;
  const absMax = priceRange?.absMax ?? 100000;
  const curMin = priceRange?.min ?? absMin;
  const curMax = priceRange?.max ?? absMax;
  const span = Math.max(1, absMax - absMin);
  const startPct = Math.max(0, Math.min(100, ((curMin - absMin) / span) * 100));
  const endPct = Math.max(0, Math.min(100, ((curMax - absMin) / span) * 100));
  return (
    <aside className="bg-white rounded-xl shadow border border-gray-100 p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        <button
          type="button"
          onClick={onReload}
          className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50"
        >
          Reload
        </button>
      </div>

      {/* Show all toggle */}
      <label className="flex items-center gap-2 text-sm py-2 border-b">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => onToggleShowAll(e.target.checked)}
        />
        Show all (incl. past)
      </label>

      {/* Time of day */}
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Departure time</div>
        <div className="flex flex-wrap gap-2">
          {["All", "Morning", "Afternoon", "Evening", "Night"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeOfDay(t)}
              className={`px-3 py-1 rounded-full border text-sm ${timeOfDay === t ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Airline filter */}
      <div className="mt-5">
        <div className="text-sm font-medium text-gray-700 mb-2">Airline</div>
        <select
          value={airlineFilter}
          onChange={(e) => setAirlineFilter(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="All">All airlines</option>
          {airlineOptions.map((air) => (
            <option key={air} value={air}>{air}</option>
          ))}
        </select>
      </div>

      {/* Price (dual-thumb slider) */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">Price</div>
          <div className="text-xs text-gray-700 font-medium">₹{curMin} — ₹{curMax}</div>
        </div>
        <div className="relative h-8">
          {/* Track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-200 rounded" />
          {/* Selected range highlight */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded"
            style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
          />
          {/* Dual thumbs (two overlapping range inputs) */}
          <input
            type="range"
            min={absMin}
            max={absMax}
            step={1000}
            value={curMin}
            onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), curMax) })}
            className="absolute inset-0 w-full bg-transparent cursor-pointer"
          />
          <input
            type="range"
            min={absMin}
            max={absMax}
            step={1000}
            value={curMax}
            onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), curMin) })}
            className="absolute inset-0 w-full bg-transparent cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
          <span>0</span>
          <span>100000</span>
        </div>
      </div>

      {/* Sort */}
      <div className="mt-5">
        <div className="text-sm font-medium text-gray-700 mb-2">Sort by</div>
        <div className="flex flex-col gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm text-left ${sortBy === "price" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
            onClick={() => onSort("price")}
          >
            Price {sortBy === "price" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm text-left ${sortBy === "duration" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
            onClick={() => onSort("duration")}
          >
            Duration {sortBy === "duration" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm text-left ${sortBy === "departure" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
            onClick={() => onSort("departure")}
          >
            Departure {sortBy === "departure" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FlightFiltersSidebar;
