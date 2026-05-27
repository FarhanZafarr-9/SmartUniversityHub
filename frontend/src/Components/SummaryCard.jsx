import React from 'react';

const SummaryCard = ({ label, count, bgColor, borderColor, textColor, rounded }) => (
    <div
        className={`${bgColor} border border-${borderColor} flex justify-between py-2 px-4 mx-2 ${rounded}
        items-center shadow-md `}
    >
        <div className={`text-sm font-medium text-${textColor} mb-2`}>{label}</div>
        <div className={`text-md font-bold text-${textColor}`}>{count}</div>
    </div>
);

export default SummaryCard;