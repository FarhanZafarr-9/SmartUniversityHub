import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default styles

const DatePicker = ({ selectedDate, onDateChange }) => {
    return (
        <>
            <Calendar
                onChange={onDateChange}
                value={selectedDate}
                className="glassmorphic-calendar"
                tileClassName="text-gray-300 hover:bg-[#333] focus:outline-none p-10 rounded-lg"
                prev2Label={null} // Hide the double previous button
                next2Label={null} // Hide the double next button
                showNeighboringMonth={false} // Hide neighboring months
                showFixedNumberOfWeeks={false} // Show only the current month
                minDetail="month" // Disable year and decade views
                maxDetail="month" // Disable year and decade views
                formatMonthYear={(locale, date) => {
                    const options = { month: 'long', year: 'numeric' };
                    return new Intl.DateTimeFormat(locale, options).format(date); // Format month and year
                }}
                formatShortWeekday={(locale, date) => {
                    const options = { weekday: 'short' };
                    return new Intl.DateTimeFormat(locale, options).format(date); // Format short weekday names
                }}
            />
            <style>
                {`
                /* Glassmorphic Calendar Styles */
                .glassmorphic-calendar {
                    background: #282828; /* Semi-transparent background */
                    border-radius: 12px; /* Rounded corners */
                    border: 0.75px solid #55555555; /* Border with transparency */
                    padding: 10px; /* Padding inside the calendar */
                    color: #ffffff; /* Text color */
                }

                /* Add background to the entire dates section */
                .glassmorphic-calendar .react-calendar__month-view__days {
                    background: rgba(255, 255, 255, 0.04); /* Semi-transparent background for all dates */
                    border-radius: 12px; /* Rounded corners for the dates section */
                    padding: 10px; /* Add padding around the dates */
                    margin-top: 10px; /* Remove margin */
                    border: 0.75px solid rgba(255, 255, 255, 0.2); /* Border with transparency */
                }

                .glassmorphic-calendar .react-calendar__tile {
                    background: transparent; /* Transparent tiles */
                    border-radius: 8px; /* Rounded corners for tiles */
                    color: #ffffff; /* Text color for tiles */
                    transition: background 0.3s ease; /* Smooth hover effect */
                }

                .glassmorphic-calendar .react-calendar__tile:hover {
                    background: rgba(255, 255, 255, 0.1); /* Highlight on hover */
                    color: #ffffff; /* Text color on hover */
                }

                .glassmorphic-calendar .react-calendar__tile--active {
                    background: transparent !important; /* Remove the blue background */
                    color: #ffffff !important; /* Ensure the text color is white */
                    font-weight: bold; /* Bold text for active tile */
                    border: 1px solid rgba(255, 255, 255, 0.3); /* Optional: Add a subtle border */
                }

                .glassmorphic-calendar .react-calendar__tile--focus {
                    background: transparent !important; /* Remove the focus background */
                    color: #ffffff !important; /* Ensure the text color is white */
                    border: 1px solid rgba(255, 255, 255, 0.3); /* Optional: Add a subtle border */
                }

                .glassmorphic-calendar .react-calendar__month-view__weekdays {
                    background: rgba(255, 255, 255, 0.04); /* Transparent background for weekdays */
                    color: #ffffff; /* Text color for weekday names */
                    font-weight: bold; /* Bold text for weekday names */
                    text-transform: uppercase; /* Uppercase weekday names */
                    padding: 5px 0; /* Add some padding */
                    border-radius: 8px; /* Rounded corners for weekdays */
                    border: 0.75px solid #55555555; /* Border with transparency */
                }

                .glassmorphic-calendar .react-calendar__navigation {
                    background: transparent; /* Transparent navigation bar */
                    color: #ffffff; /* Navigation text color */
                    background: rgba(255, 255, 255, 0.04); /* Semi-transparent background */
                    font-weight: bold; /* Bold navigation text */
                    border-radius: 8px; /* Rounded corners for navigation */
                    border: 0.75px solid #55555555; /* Border with transparency */
                }

                .glassmorphic-calendar .react-calendar__navigation button {
                    background: transparent; /* Transparent buttons */
                    border-radius: 8px; /* Rounded corners for buttons */
                    color: #ffffff; /* Button text color */
                    border: none; /* Remove button borders */
                    cursor: pointer; /* Pointer cursor for buttons */
                    transition: color 0.3s ease; /* Smooth hover effect */
                }

                .glassmorphic-calendar .react-calendar__navigation button:focus {
                    background: #444444; /* Darker background on active */
                }
                .glassmorphic-calendar .react-calendar__navigation button:hover {
                    background: #444444; /* Darker background on hover */
                }
                `}
            </style>
        </>
    );
};

export default DatePicker;