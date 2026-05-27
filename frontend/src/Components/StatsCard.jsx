import React from 'react';

const StatsCard = ({ label, value, isRounded }) => (
    <div
        className={`flex justify-between bg-[#333] mx-2 p-3 ${
            isRounded === 't' ? 'rounded-t-lg' : isRounded === 'b' ? 'rounded-b-lg' : ''
        } hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300`}
    >
        <div className="text-sm font-medium text-gray-300">{label}</div>
        <div className="text-md font-bold text-white">{value}</div>
    </div>
);

export default StatsCard;