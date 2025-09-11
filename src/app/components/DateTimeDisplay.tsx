import React from 'react';

interface DateTimeDisplayProps {
  date: string | Date;
  showTime?: boolean;
  showDate?: boolean;
  shortFormat?: boolean;
  className?: string;
  isHighlighted?: boolean;
}

const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({
  date,
  showTime = true,
  showDate = true,
  shortFormat = false,
  className = '',
  isHighlighted = false,
}) => {
  if (!date) return <span className={className}>-</span>;

  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to DateTimeDisplay:', date);
    return <span className={className}>Invalid date</span>;
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: shortFormat ? 'numeric' : 'short',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  let formattedDate = '';
  
  if (showDate && showTime) {
    formattedDate = `${dateObj.toLocaleDateString('en-US', dateOptions)} ${dateObj.toLocaleTimeString('en-US', timeOptions)}`;
  } else if (showDate) {
    formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);
  } else if (showTime) {
    formattedDate = dateObj.toLocaleTimeString('en-US', timeOptions);
  }

  const highlightClass = isHighlighted ? 'text-danger' : '';
  return <span className={`${className} ${highlightClass}`}>{formattedDate}</span>;
};

export default DateTimeDisplay;
