import React, { FC, useEffect, useState, useRef,ReactNode } from "react";
import Calendar from "./Calender";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Option {
  value: string;
  label: string;
}

interface InputBoxProps {
  label?: string | ReactNode;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?:boolean;
  value?: string | boolean;
  onChange?: (name: string, value: string) => void;
  onValueChange?: (value: string | boolean | File | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  options?: string[] | Option[];
  defaultValue?: string | boolean;
  isTextarea?: boolean;
  icon?: IconDefinition | React.ReactElement;
  error?: string; // Added error prop here
  onWheel?: React.WheelEventHandler<HTMLInputElement>;
  onEnterPress?: () => void; 
}

const formStore: Record<string, any> = {};
export const getFormStore = () => formStore;

const InputBox: FC<InputBoxProps> = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
  readOnly = false,
  value,
  onChange,
  onValueChange,
  options,
  defaultValue,
  isTextarea = false,
  icon,
  error, 
  onEnterPress, 
}) => {
  const initial = value ?? defaultValue ?? (type === "checkbox" ? false : "");
  const [inputValue, setInputValue] = useState<string | boolean | File | null>(initial);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null!);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectingDateType, setSelectingDateType] = useState<"from" | "to">("from");
  const [currentMonth, setCurrentMonth] = useState(new Date());
useEffect(() => {
  if (value !== undefined) {
    setInputValue(value);
  }
}, [value]);
  useEffect(() => {
    if (type === "date-range" && typeof initial === "string" && initial.includes(" - ")) {
      const [fromStr, toStr] = initial.split(" - ");
      const [fD, fM, fY] = fromStr.split("-").map(Number);
      const [tD, tM, tY] = toStr.split("-").map(Number);
      const from = new Date(fY, fM - 1, fD);
      const to = new Date(tY, tM - 1, tD);
      setFromDate(from);
      setToDate(to);
    }
  }, [initial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleDateSelect = (date: Date) => {
    if (selectingDateType === "from") {
      setFromDate(date);
      setToDate(null);
      setSelectingDateType("to");
    } else {
      if (fromDate && date >= fromDate) {
        setToDate(date);
        setShowCalendar(false);
        const formatted = `${formatDate(fromDate)} - ${formatDate(date)}`;
        setInputValue(formatted);
        formStore[name] = formatted;
        onChange?.(name, formatted);
        onValueChange?.(formatted);
      } else {
        alert("End date must be after start date");
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let rawValue: string | boolean | File | null;

    if (type === "checkbox") {
      rawValue = (e.target as HTMLInputElement).checked;
    } else if (type === "file") {
      rawValue = (e.target as HTMLInputElement).files?.[0] || null;
    } else {
      rawValue = e.target.value;
    }

    setInputValue(rawValue);
    formStore[name] = rawValue;
    onChange?.(name, String(rawValue));
    onValueChange?.(rawValue);
  };

  const renderOptions = () => {
    if (!options) return null;
    return options.map((opt) =>
      typeof opt === "string" ? (
        <option key={opt} value={opt}>{opt}</option>
      ) : (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      )
    );
  };
  
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "object" && 'iconName' in icon) {
      return <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />;
    }
    return <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>;
  }

  return (
    
    <div className="mb-4 relative">
      {type !== "checkbox" && (
        <label htmlFor={name} className="block mb-1 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {type === "date-range" ? (
  <>
    <div className="relative flex gap-2 items-center border border-gray-300 rounded px-4 py-2 bg-white cursor-pointer w-[290px]">
      <span
        onClick={() => {
          setShowCalendar(true);
          setSelectingDateType("from");
        }}
        className="hover:text-blue-600 text-sm font-medium"
      >
        From: {fromDate ? formatDate(fromDate) : "Select"}
      </span>
      <span className="text-gray-400">|</span>
      <span
        onClick={() => {
          setShowCalendar(true);
          setSelectingDateType("to");
        }}
        className="hover:text-blue-600 text-sm font-medium"
      >
        To: {toDate ? formatDate(toDate) : "Select"}
      </span>
      <FontAwesomeIcon
        icon={faCalendarAlt}
        className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
        onClick={() => {
          setShowCalendar(true);
          setSelectingDateType("from");
        }}
      />
    </div>

    <Calendar
      show={showCalendar}
      onClose={() => setShowCalendar(false)}
      fromDate={fromDate}
      toDate={toDate}
      selectingDateType={selectingDateType}
      onDateSelect={(date) => {
        if (selectingDateType === "from") {
          if (toDate && date > toDate) {
            alert("Start date must be before end date");
            return;
          }
          setFromDate(date);
        } else {
          if (fromDate && date < fromDate) {
            alert("End date must be after start date");
            return;
          }
          setToDate(date);
        }
        const updatedFrom = selectingDateType === "from" ? date : fromDate;
        const updatedTo = selectingDateType === "to" ? date : toDate;
        if (updatedFrom && updatedTo) {
          const formatted = `${formatDate(updatedFrom)} - ${formatDate(updatedTo)}`;
          setInputValue(formatted);
          formStore[name] = formatted;
          onChange?.(name, formatted);
          onValueChange?.(formatted);
          setShowCalendar(false);
        }
      }}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      calendarRef={calendarRef}
    />
  </>
) : options ? (
        <div className="relative">
          {renderIcon()}
          <select
            id={name}
            name={name}
            value={inputValue as string}
            onChange={handleChange}
             onKeyDown={(e) => {
    if (e.key === "Enter") onEnterPress?.(); // 🔥 Enter press triggers callback
  }}
            required={required}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded px-4 py-2 focus:ring-orange-500 ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''}`}
          >
            <option value="">-- Select --</option>
            {renderOptions()}
          </select>
        </div>
      ) : isTextarea ? (
        <div className="relative">
          {renderIcon()}
          <textarea
            id={name}
            name={name}
            value={inputValue as string}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded px-4 py-2 h-20 focus:ring-orange-500 ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''}`}
          />
        </div>
      ) : type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={Boolean(inputValue)}
            onChange={handleChange}
            className="w-5 h-5"
          />
          <label htmlFor={name} className="font-medium">{label}</label>
        </div>
      ) : type === "file" ? (
        <input
          id={name}
          name={name}
          type="file"
          onChange={handleChange}
          disabled={disabled}
          className={`w-full px-4 py-2 ${error ? 'border-red-500' : ''}`}
        />
      ) : (
        <div className="relative">
          {renderIcon()}
        <input
  id={name}
  name={name}
  type={type}
  value={inputValue as string}
  onChange={handleChange}
  placeholder={placeholder}
  required={required}
  disabled={disabled}
  readOnly={readOnly} 
  onWheel={(e) => e.currentTarget.blur()} 
   onKeyDown={(e) => {
    if (e.key === "Enter") onEnterPress?.(); // 🔥 Enter press triggers callback
  }}
  className={`w-full border border-gray-300 rounded px-4 py-2 focus:ring-orange-500 ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}`}
/>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><FontAwesomeIcon icon={faCircleExclamation} /> {error}</p>}
    </div>
  );
};

export default InputBox;