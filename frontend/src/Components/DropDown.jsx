import React from 'react';

const DropDown = ({ options, width, height, bgColor, id, ...rest }) => {
    return (
        <>
            <label htmlFor={id}></label>
            <select
                id={id}
                className={`rounded-md ${width} ${height} ${bgColor}
                outline-none border-2 border-transparent rounded-lg
                p-3 text-[#d0d0d0] focus:border-[hsl(0,0%,88%)] shadow-[2px_2px_0_2px_rgb(110,110,110)]
                focus:translate-y-1 focus:translate-x-1 transition-all duration-300 ease-in-out
                focus:shadow-none text-weight-light text-md tracking-wider`}
                {...rest}
            >
                {options.map((option, index) => (
                    <option
                        key={option.id || index} // Use index as fallback if option.id is not available
                        value={option.value}
                        className="bg-dark rounded-md p-2 text-sm tracking-wider"
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </>
    );
};

export default DropDown;
