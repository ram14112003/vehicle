import React, { useState } from "react";
import CommonButton from "./CommonButton";

interface CalendarProps {
  show: boolean;
  onClose: () => void;
  fromDate: Date | null;
  toDate: Date | null;
  selectingDateType: "from" | "to";
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  // Corrected type to allow null
  calendarRef: React.RefObject<HTMLDivElement | null>;
}

const Calendar: React.FC<CalendarProps> = ({
  show,
  onClose,
  fromDate,
  toDate,
  selectingDateType,
  onDateSelect,
  currentMonth,
  setCurrentMonth,
  calendarRef,
}) => {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 41 }, (_, i) => 2000 + i);

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);

      const isToday = date.toDateString() === new Date().toDateString();
      const isSelectedFrom = fromDate && date.toDateString() === fromDate.toDateString();
      const isSelectedTo = toDate && date.toDateString() === toDate.toDateString();
      const isInRange =
        fromDate && toDate &&
        date > fromDate && date < toDate &&
        !isSelectedFrom && !isSelectedTo;

      let classes =
        "p-2 text-center rounded-full cursor-pointer transition-colors duration-200 text-sm";

      if (isSelectedFrom || isSelectedTo) {
        classes += " bg-blue-600 text-white font-bold ";
      } else if (isInRange) {
        classes += " bg-blue-100 text-blue-800";
      } else if (isToday) {
        classes += " border-2 border-blue-500 bg-blue-50 text-blue-700 font-semibold";
      } else {
        classes += " hover:bg-gray-200";
      }

      days.push(
        <div key={i} className={classes} onClick={() => onDateSelect(date)}>
          {i}
        </div>
      );
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setShowYearDropdown(false);
  };

  if (!show) return null;

  return (
    <div
      ref={calendarRef}
      className="absolute z-30 bg-white border border-gray-300 p-4 rounded-lg mt-2 w-[290px]"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 relative">
        <span onClick={goToPreviousMonth} className="cursor-pointer text-gray-700 p-2 text-lg">
          &#8592;
        </span>

        <div className="flex flex-col text-center">
          <button
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className="font-semibold text-gray-800 hover:text-blue-600"
          >
            {months[currentMonth.getMonth()]}
          </button>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            {currentMonth.getFullYear()}
          </button>
        </div>

        <span onClick={goToNextMonth} className="cursor-pointer text-gray-700 p-2 text-lg">
          &#8594;
        </span>

        {/* Month Dropdown */}
        {showMonthDropdown && (
          <div className="absolute top-full mt-2 right-4 w-64 bg-white border rounded shadow-md z-40 grid grid-cols-3 gap-2 p-3">
            {months.map((month, index) => (
              <button
                key={month}
                className="text-sm px-2 py-1 rounded hover:bg-blue-100"
                onClick={() => selectMonth(index)}
              >
                {month}
              </button>
            ))}
          </div>
        )}

        {/* Year Dropdown */}
        {showYearDropdown && (
          <div className="absolute top-full mt-2 right-1/4 bg-white border rounded shadow-md z-40 max-h-60 overflow-y-auto">
            {years.map((year) => (
              <button
                key={year}
                className="block w-full text-left px-4 py-1 text-sm hover:bg-blue-100"
                onClick={() => selectYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 text-xs font-bold text-gray-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div className="text-center" key={d}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      {/* Close */}
      <CommonButton
        onClick={onClose}
        variant="danger"
        className="mt-4 w-full text-sm font-semibold"
      >
        Close Calendar
      </CommonButton>
    </div>
  );
};

export default Calendar;