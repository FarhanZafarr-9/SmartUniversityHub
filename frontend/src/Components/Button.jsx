import React from 'react';
import icons from './../assets/icons';

const Button = ({
    text,
    bgColor = 'bg-dark-dark-card',
    width = 'w-auto',
    height = 'h-10',
    textColor = 'text-white',
    borderColor = ' border-2 border-transparent',
    hoverColor = '',
    hoverTextColor = '',
    hoverTransform = 'hover:tracking-widest',
    Icon = icons.FaArrowRight,
    onClick,
    type = '',
    ...rest
}) => {
    return (
        <button
            onClick={onClick}
            type={`${type}`}
            className={`${bgColor} ${textColor} ${width} ${height} ${borderColor} 
        rounded-lg shadow-[2px_2px_0_2px_rgb(109,109,109)] active:shadow-none
        active:translate-y-1 active:translate-x-1  active:border-none
        font-semibold ${hoverColor} ${hoverTextColor} 
        ${hoverTransform}
        transition-all duration-300 ease-in-out`}
            {...rest} // This allows you to pass any other props (like disabled, etc.)
        >
            {text}
            {Icon && <Icon className="inline ml-2" />}
        </button>
    );
};

export default Button;

/*
    border - r - dark - semi - dark border - b - dark - semi - dark
*/