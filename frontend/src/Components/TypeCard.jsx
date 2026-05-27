import React from 'react';
import '../styles/tailwindComponents.css';

const TypeCard = ({ size, icon: Icon, number, title, lastUpdate }) => {
    return (
        <div className='card'>
            <Icon className='w-8 h-8' />
            <div className='card-title'>{title}</div>
            <div className='card-number'>{number}</div>
            <div className='card-size'>{size}</div>
            <div className='card-updated'>{lastUpdate}</div>
        </div>
    );
};

export default TypeCard;
