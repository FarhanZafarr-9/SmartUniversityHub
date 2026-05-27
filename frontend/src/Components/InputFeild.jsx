import React, { useState } from 'react';

const InputField = ({
    placeholder,
    width,
    height = 'h-12',
    bgColor = 'bg-dark-hover',
    type,
    id,
    name,
    value,
    onChange,
    required,
    margin,
    min,
    max,
    ...rest
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleChange = (e) => {
        const { value } = e.target;
        setHasValue(value.length > 0); // Update hasValue if input contains at least one character
        onChange(e); // Call the passed onChange prop for managing form data
    };

    // Date Validation Logic
    const isDateValid = (dateString) => {
        if (type !== 'date' || !dateString) return true; // Skip validation for non-date inputs or empty values

        const selectedDate = new Date(dateString);
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 100; // 100 years ago
        const maxYear = currentYear; // Current year

        const selectedYear = selectedDate.getFullYear();
        return selectedYear >= minYear && selectedYear <= maxYear;
    };


    return (
        <div className="font-['Segoe_UI'] relative my-4" style={{ width: width, height: height, margin: margin }}>
            {/* Input Field */}
            <input
                type={type || 'text'}
                className={`w-full ${bgColor} text-md py-2 px-3 outline-none border-2 border-transparent rounded-lg focus:border-[hsl(0,0%,88%)] peer shadow-[1.25px_1.25px_0_1.25px_rgb(90,90,90)]
                    tracking-wider focus:translate-y-1 focus:translate-x-1 transition-all duration-300 ease-in-out
                    focus:shadow-none
                    ${type === 'number' && (value < min || value > max) && value ? (
                        'bg-red-800') : ''}
                        ${type === 'date' && !isDateValid(value) ? 'bg-red-800' : ''}
                    `} // Add padding for the calendar icon
                required={required}
                id={id}
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                style={{ height, color: type === 'date' && !isFocused && !hasValue ? 'transparent' : 'inherit' }} // Hide placeholder text for date input
                autoComplete="on"
                min={type === 'number' ? min : undefined} // Apply min only for number inputs
                max={type === 'number' ? max : undefined} // Apply max only for number inputs
                {...rest}
                {...rest}
            />
            {/* Calendar Icon (only for date input) */}

            {/* Label */}
            <label
                htmlFor={id}
                className={`text-base absolute left-0 py-2 px-3 ml-2 pointer-events-none transition-all duration-300 ease-in-out text-[rgb(202,202,202)] 
                    ${isFocused || (!isFocused && hasValue) ? '-translate-y-[90%] -translate-x-[20%] scale-[80%] tracking-widest ' : ''}`}
            >
                {placeholder}
            </label>
        </div>
    );
};

export default InputField;

/*
    border - r - dark - semi - dark border - b - dark - semi - dark
    text-green-500
*/