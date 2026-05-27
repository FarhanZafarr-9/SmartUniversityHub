import React from 'react';

const Divider = ({ height = '2px', color = '#454545', width = '70%', margin = '' }) => {
    const style = {
        height: height,
        width: width,
        margin: margin,
        backgroundColor: color,
    };

    return <div style={style}></div>;
};

export default Divider;
