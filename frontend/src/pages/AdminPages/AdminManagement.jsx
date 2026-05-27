import React, { useState, useEffect } from 'react';
import {
    getAllRooms,
    insertRoom,
    updateRoom,
    deleteRoom,
    getAllSlots,
    insertSlot,
    updateSlot,
    deleteSlot
} from '../../../services/servicesApi';

const AdminManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newRoom, setNewRoom] = useState({ room_number: '', capacity: '', is_lab: false });
    const [newSlot, setNewSlot] = useState({ day_of_week: '', start_time: '', end_time: '' });

    const [editingRoom, setEditingRoom] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);

    const adminId = JSON.parse(localStorage.getItem('currentUser'))?.user?.user_id;

    // Fetch all rooms and slots
    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedRooms, fetchedSlots] = await Promise.all([
                getAllRooms(adminId),
                getAllSlots(adminId)
            ]);
            console.log('Fetched Rooms:', fetchedRooms);
            console.log('Fetched Slots:', fetchedSlots);
            setRooms(fetchedRooms || []);
            setSlots(fetchedSlots || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Add a new room
    const handleAddRoom = async () => {
        try {
            const exists = rooms.some(c => c.room_number === newRoom.room_number);
            if (exists) { console.log('Room already exists'); return; }

            const response = await insertRoom({
                ...newRoom,
                requestor_id: adminId,
                room_type: newRoom.is_lab
            });

            if (response?.recordset?.[0]) {
                // Add the new room to the state
                setRooms((prev) => [...prev, response.recordset[0]]);
                setNewRoom({ room_number: '', capacity: '', is_lab: false }); // Reset the form
            } else {
                setError('Failed to add room');
            }
        } catch (err) {
            console.error('Failed to add room:', err);
            setError(err.message || 'Failed to add room');
        }
    };
    // Update an existing room
    const handleUpdateRoom = async () => {
        console.log('Updating Room:', editingRoom);
        try {
            //restraint check yet to be implemented
            const response = await updateRoom({
                ...editingRoom,
                requestor_id: adminId,
                room_type: editingRoom.is_lab
            });

            if (response?.recordset?.[0]) {
                setRooms((prev) =>
                    prev.map((room) =>
                        room.room_id === response.recordset[0].room_id ? response.recordset[0] : room
                    )
                );
                setEditingRoom(null);
            } else {
                setError('Failed to update room');
            }
        } catch (err) {
            console.error('Failed to update room:', err);
            setError(err.message || 'Failed to update room');
        }
    };

    const handleUpdateSlot = async () => {
        console.log('Updating Slot:', editingSlot);
        try {
            const formattedSlot = {
                ...editingSlot,
                start_time: editingSlot.start_time.includes(':') ? editingSlot.start_time : editingSlot.start_time + ':00',
                end_time: editingSlot.end_time.includes(':') ? editingSlot.end_time : editingSlot.end_time + ':00',
                requestor_id: adminId
            };

            const response = await updateSlot(formattedSlot);

            if (response?.recordset?.[0]) {
                setSlots((prev) =>
                    prev.map((slot) =>
                        slot.slot_id === response.slot_id ? response : slot
                    )
                );
                setEditingSlot(null);
            } else {
                setError('Failed to update slot');
            }
        } catch (err) {
            console.error('Failed to update slot:', err);
            setError(err.message || 'Failed to update slot');
        }
    };

    // Add a new slot
    const handleAddSlot = async () => {
        try {
            const exists = slots.some(c => c.day_of_week === newSlot.day_of_week && c.start_time === newSlot.start_time && c.end_time === newSlot.end_time);
            if (exists) { console.log('Slot already exists'); return; }
            // Format time properly
            const formattedSlot = {
                ...newSlot,
                start_time: newSlot.start_time + ':00', // Add seconds if needed
                end_time: newSlot.end_time + ':00',
                requestor_id: adminId
            };

            const response = await insertSlot(formattedSlot);

            if (response?.recordset?.[0]) {
                // Add the new slot to the state
                setSlots((prev) => [...prev, response.recordset[0]]);
                setNewSlot({ day_of_week: '', start_time: '', end_time: '' }); // Reset the form
            } else {
                setError('Failed to add slot');
            }
        } catch (err) {
            console.error('Failed to add slot:', err);
            setError(err.message || 'Failed to add slot');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        console.log('Deleting Room ID:', roomId);
        try {
            const response = await deleteRoom(roomId, adminId);
            console.log('Delete Room Response:', response);
            setRooms((prevRooms) => prevRooms.filter((room) => room.room_id !== response.room_id));
        } catch (err) {
            console.error('Failed to delete room:', err);
            setError('Failed to delete room');
        }
    };

    const handleDeleteSlot = async (slotId) => {
        console.log('Deleting Slot ID:', slotId);
        try {
            const response = await deleteSlot(slotId, adminId);
            setSlots((prevSlots) => prevSlots.filter((slot) => slot.slot_id !== response.slot_id));
        } catch (err) {
            console.error('Failed to delete slot:', err);
            setError('Failed to delete slot');
        }
    };

    // Edit Modals
    const renderEditModals = () => (
        <>
            {/* Room Edit Modal */}
            {editingRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
                    <div className="bg-dark-semi-dark rounded-xl p-6 w-full max-w-md overflow-hidden">
                        <h3 className="text-lg font-medium mb-4">Edit Room</h3>
                        <input
                            type="text"
                            placeholder="Room Number"
                            value={editingRoom.room_number}
                            onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                        />
                        <input
                            type="number"
                            placeholder="Capacity"
                            min="10"
                            max="50"
                            value={editingRoom.capacity}
                            onChange={(e) => {
                                let value = parseInt(e.target.value) || 0;
                                if (value < 10) value = 10;
                                if (value > 50) value = 50;
                            
                                setEditingRoom({ ...editingRoom, capacity: e.target.value })
                            }}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                        />
                        <select
                            value={editingRoom?.is_lab ?? 'false'} // Default to 'false' if null or undefined
                            onChange={(e) => setEditingRoom({ ...editingRoom, is_lab: e.target.value === 'true' })}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-4"
                        >
                            <option value="false">Classroom</option>
                            <option value="true">Lab</option>
                        </select>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingRoom(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRoom}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slot Edit Modal */}
            {editingSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-semi-dark rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">Edit Time Slot</h3>
                        <input
                            type="text"
                            placeholder="Day of Week"
                            value={editingSlot.day_of_week}
                            onChange={(e) => setEditingSlot({ ...editingSlot, day_of_week: e.target.value })}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                        />
                        <input
                            type="time"
                            placeholder="Start Time"
                            value={editingSlot.start_time}
                            onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                        />
                        <input
                            type="time"
                            placeholder="End Time"
                            value={editingSlot.end_time}
                            onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                            className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingSlot(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSlot}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Admin Management</h1>
                <p className="text-sm text-gray-400">Manage Rooms and Slots</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="float-right text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-200"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rooms Management */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Rooms</h2>
                        <div className="space-y-4">
                            {rooms.map((room) => (
                                <div key={room.room_id} className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                                    <p className="text-sm text-gray-400">Room Number: {room.room_number}</p>
                                    <p className="text-sm text-gray-400">Capacity: {room.capacity}</p>
                                    <p className="text-sm text-gray-400">Type: {room.is_lab ? 'Lab' : 'Classroom'}</p>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => setEditingRoom(room)}
                                            className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoom(room.room_id)}
                                            className="px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded border border-red-900/50 hover:border-red-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm text-gray-400 mb-2">Add New Room</h3>
                            <input
                                type="text"
                                placeholder="Room Number"
                                value={newRoom.room_number}
                                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                                className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                            />
                            <input
                                type="number"
                                placeholder="Capacity"
                                min="10"
                                max="50"
                                value={newRoom.capacity}
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value) || 0;
                                        if (value < 10) value = 10;
                                        if (value > 50) value = 50;
                                        setNewRoom({ ...newRoom, capacity: e.target.value })
                                    }}
                                className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                            />
                                <select
                                    value={newRoom?.is_lab ?? 'false'} // Default to 'false' if null or undefined
                                    onChange={(e) => setNewRoom({ ...newRoom, is_lab: e.target.value === 'true' })}
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                                >
                                    <option value="false">Classroom</option>
                                    <option value="true">Lab</option>
                                </select>
                            <button
                                onClick={handleAddRoom}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Add Room
                            </button>
                        </div>
                    </div>

                    {/* Slots Management */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Slots</h2>
                        <div className="space-y-4">
                                {slots.map((slot) => (
                                    <div key={slot.slot_id} className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                                        <p className="text-sm text-gray-400">Day: {slot.day_of_week}</p>
                                        <p className="text-sm text-gray-400">
                                            Start Time: {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            End Time: {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                onClick={() => setEditingSlot(slot)}
                                                className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSlot(slot.slot_id)}
                                                className="px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded border border-red-900/50 hover:border-red-400"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm text-gray-400 mb-2">Add New Slot</h3>
                            <input
                                type="text"
                                placeholder="Day of Week"
                                value={newSlot.day_of_week}
                                onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                                className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                            />
                            <input
                                type="time"
                                placeholder="Start Time"
                                value={newSlot.start_time}
                                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                                className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                            />
                            <input
                                type="time"
                                placeholder="End Time"
                                value={newSlot.end_time}
                                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                                className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555] mb-2"
                            />
                            <button
                                onClick={handleAddSlot}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Add Slot
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Render edit modals */}
            {renderEditModals()}
        </div>
    );
};

export default AdminManagement;