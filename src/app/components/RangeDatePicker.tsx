import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, addMonths, subMonths, isSameDay, isWithinInterval, 
  isBefore, isAfter, startOfWeek, endOfWeek, subDays, startOfMonth, 
  endOfMonth, startOfDay
} from "date-fns";

type RangeDatePickerProps = {
  initialStart: Date;
  initialEnd: Date;
  initialPreset: string;
  onApply: (start: Date, end: Date, preset: string) => void;
  onCancel: () => void;
};

const PRESETS = [
  { label: "This Week", getRange: () => {
    const today = new Date(2026, 6, 3); // Mock today: 3 Jul 2026
    return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
  }},
  { label: "Last Week", getRange: () => {
    const today = new Date(2026, 6, 3);
    const lastWeek = subDays(today, 7);
    return { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
  }},
  { label: "This Month", getRange: () => {
    const today = new Date(2026, 6, 3);
    return { start: startOfMonth(today), end: endOfMonth(today) };
  }},
  { label: "Last Month", getRange: () => {
    const today = new Date(2026, 6, 3);
    const lastMonth = subMonths(today, 1);
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }},
  { label: "Last 3 Months", getRange: () => {
    const today = new Date(2026, 6, 3);
    const last3Month = subMonths(today, 3);
    // from today back 3 months
    return { start: startOfMonth(last3Month), end: endOfMonth(subMonths(today, 1)) };
  }},
];

export function RangeDatePicker({ initialStart, initialEnd, initialPreset, onApply, onCancel }: RangeDatePickerProps) {
  const [tempStart, setTempStart] = useState<Date | null>(initialStart);
  const [tempEnd, setTempEnd] = useState<Date | null>(initialEnd);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewMonthLeft, setViewMonthLeft] = useState(startOfMonth(subMonths(initialStart || new Date(2026, 6, 1), 1)));
  const viewMonthRight = addMonths(viewMonthLeft, 1);
  const [activePreset, setActivePreset] = useState(initialPreset);

  const todayMock = new Date(2026, 6, 3);

  const handlePrevMonth = () => setViewMonthLeft(subMonths(viewMonthLeft, 1));
  const handleNextMonth = () => setViewMonthLeft(addMonths(viewMonthLeft, 1));

  const handleDateClick = (date: Date) => {
    setActivePreset("Custom Range");
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (isBefore(date, tempStart)) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const { start, end } = preset.getRange();
    setTempStart(start);
    setTempEnd(end);
    setActivePreset(preset.label);
    setViewMonthLeft(startOfMonth(subMonths(end, 1)));
  };

  const renderMonth = (monthDate: Date) => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }); // Sunday start for grid
    const days = [];
    let current = start;
    for (let i = 0; i < 42; i++) {
      days.push(current);
      current = addMonths(current, 0); // Need to add days
      current = new Date(current);
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="w-64">
        <div className="font-bold text-gray-800 mb-4 text-center">{format(monthDate, "MMMM yyyy")}</div>
        <div className="grid grid-cols-7 mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === monthDate.getMonth();
            const isToday = isSameDay(day, todayMock);
            const isStart = tempStart && isSameDay(day, tempStart);
            const isEnd = tempEnd && isSameDay(day, tempEnd);
            const isRangeStartEndSame = isStart && isEnd;
            
            let inRange = false;
            if (tempStart && tempEnd) {
              inRange = isWithinInterval(day, { start: tempStart, end: tempEnd });
            } else if (tempStart && hoverDate) {
              const rStart = isBefore(hoverDate, tempStart) ? hoverDate : tempStart;
              const rEnd = isAfter(hoverDate, tempStart) ? hoverDate : tempStart;
              inRange = isWithinInterval(day, { start: rStart, end: rEnd });
            }

            let bgClass = "bg-transparent";
            let textClass = isCurrentMonth ? "text-gray-700" : "text-gray-300";
            let roundedClass = "";

            if (isStart || isEnd) {
              textClass = "text-white font-bold";
              bgClass = "bg-slate-700";
              roundedClass = "rounded-full";
              // Add range background extension
              if (inRange && tempStart && (tempEnd || hoverDate) && !isRangeStartEndSame) {
                if (isStart) roundedClass = "rounded-l-full rounded-r-none";
                if (isEnd) roundedClass = "rounded-r-full rounded-l-none";
                if (isStart && day.getDay() === 6) roundedClass = "rounded-full"; // wrap logic
                if (isEnd && day.getDay() === 0) roundedClass = "rounded-full";
              }
            } else if (inRange) {
              bgClass = "bg-slate-100";
              if (day.getDay() === 0) roundedClass = "rounded-l-full rounded-r-none";
              if (day.getDay() === 6) roundedClass = "rounded-r-full rounded-l-none";
            }

            return (
              <div 
                key={idx} 
                className={`h-8 flex items-center justify-center relative cursor-pointer ${bgClass} ${roundedClass}`}
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => setHoverDate(day)}
              >
                {/* Ensure the text is always centered within a circle when not range */}
                <div className={`w-8 h-8 flex items-center justify-center ${isStart || isEnd ? 'bg-slate-700 rounded-full z-10' : ''} ${textClass}`}>
                  {day.getDate()}
                </div>
                {isToday && !isStart && !isEnd && <div className="absolute bottom-1 w-1 h-1 bg-slate-600 rounded-full"></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-full left-1/2 -translate-x-[40%] mt-2 bg-white border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-xl z-30 flex overflow-hidden w-[800px]" onClick={e => e.stopPropagation()}>
      {/* Left: Calendars */}
      <div className="flex p-6 border-r border-gray-100 relative">
        <button onClick={handlePrevMonth} className="absolute left-6 top-6 p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
        {renderMonth(viewMonthLeft)}
        <div className="w-6"></div>
        {renderMonth(viewMonthRight)}
        <button onClick={handleNextMonth} className="absolute right-6 top-6 p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Right: Presets */}
      <div className="w-52 bg-gray-50 p-4 flex flex-col space-y-1 relative shrink-0">
        {PRESETS.map(p => (
          <button 
            key={p.label}
            onClick={() => handlePresetClick(p)}
            className={`text-left px-3 py-2 text-sm rounded font-medium transition-colors border-l-[3px]
              ${activePreset === p.label ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-transparent text-gray-600 hover:bg-gray-200'}`}
          >
            {p.label}
          </button>
        ))}
        
        <div className="border-t border-gray-200 my-2"></div>
        
        <button 
          className={`text-left px-3 py-2 text-sm rounded font-medium border-l-[3px] cursor-default
            ${activePreset === "Custom Range" ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-transparent text-gray-600'}`}
        >
          Custom Range
        </button>
        
        <div className="mt-auto pt-4 flex space-x-2">
          <button onClick={onCancel} className="flex-1 py-1.5 bg-transparent rounded text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
          <button 
            onClick={() => { if(tempStart && tempEnd) onApply(tempStart, tempEnd, activePreset); }} 
            disabled={!tempStart || !tempEnd}
            className={`flex-1 py-1.5 rounded text-sm font-bold transition-colors ${tempStart && tempEnd ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
