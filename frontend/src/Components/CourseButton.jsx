import React from 'react';

const CourseButton = ({ course, isSelected, onClick }) => (
    <button
        onClick={() => onClick(course.course_code)}
        className={`px-2 py-1 rounded-md text-sm text-gray-200 focus:outline-none  ${isSelected ? 'bg-[#1c1c1c] border-[0.75px] border-[#55555555]' : 'bg-[#343434] border-[0.75px] border-[#55555555] hover:bg-[#555555]'} transition-all duration-300`}
    >
        {course.course_code}
    </button>
);

export default CourseButton;
