import React from 'react';

const formatTime = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (dt) => new Date(dt).toLocaleDateString([], { month: 'short', day: 'numeric' });

const durationLabel = (dep, arr) => {
  const ms = new Date(arr) - new Date(dep);
  if (ms <= 0) return '-';
  const minutes = Math.floor(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export default function FlightCard({ flight, cheapestPrice, fastestIds, secondFastestId, onBook }) {
  const isRecommended = Number(flight.price) === cheapestPrice;
  const isFastest = fastestIds.includes(flight._id);
  const isSecondFastest = secondFastestId === flight._id;
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden group hover:shadow-lg transition">
      {/* Badges */}
      <div className="px-4 pt-3 flex gap-2 text-xs font-semibold">
        {isRecommended && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Recommended</span>}
        {isFastest && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Fastest</span>}
        {isSecondFastest && !isFastest && <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">2nd Fastest</span>}
      </div>
      <div className="p-4 flex items-center gap-5">
        {/* Airline */}
        <div className="flex flex-col items-center w-24">
          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-500 border">
            {flight.airline?.slice(0,2) || 'FL'}
          </div>
          <div className="mt-2 text-xs text-gray-500">{flight.flightNo}</div>
        </div>
        {/* Times */}
        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
          <div className="col-span-2 flex flex-col">
            <div className="text-lg md:text-xl font-bold">{formatTime(flight.departure)}</div>
            <div className="text-xs text-gray-500">{formatDate(flight.departure)}</div>
            <div className="text-sm font-semibold text-gray-800">{flight.from}</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm text-gray-600">{durationLabel(flight.departure, flight.arrival)}</div>
            <div className="h-0.5 w-16 bg-gray-200 my-1" />
            <div className="text-[10px] text-gray-500">Non-stop</div>
          </div>
          <div className="col-span-2 flex flex-col items-end">
            <div className="text-lg md:text-xl font-bold">{formatTime(flight.arrival)}</div>
            <div className="text-xs text-gray-500">{formatDate(flight.arrival)}</div>
            <div className="text-sm font-semibold text-gray-800">{flight.to}</div>
          </div>
        </div>
        {/* Price & CTA */}
        <div className="min-w-[150px] text-right">
          <div className="text-xl font-bold text-gray-900">₹{Number(flight.price).toLocaleString('en-IN')}</div>
          {isRecommended && <div className="text-[10px] line-through text-gray-400">₹{(Number(flight.price)+350).toLocaleString('en-IN')}</div>}
          <button onClick={() => onBook(flight)} className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-2 rounded-lg transition">
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
