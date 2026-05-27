import React from 'react';

const AttendanceRow = ({ record, index }) => (
    <tr
        key={`${record.date}-${record.attendance_id}`}
        className="hover:bg-[#363636] bg-dark-glassy transition-colors duration-300"
    >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#444444] ">
            {index + 1}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 tracking-wider border-r-[0.75px] border-[#444444]">
            {new Date(record.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                weekday: 'short',
            })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap ">
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                    ? 'bg-green-900/30 text-green-400'
                    : record.status === 'leave'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}
            >
                {record.status}
            </span>
        </td>
    </tr>
);

export default AttendanceRow;