import React, { useState, useEffect } from 'react';
import { getSystemConfigs, updateSystemConfig, deleteSystemConfig, insertSystemConfig } from '../../../services/servicesApi';

const AdminConfigs = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editConfig, setEditConfig] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newConfig, setNewConfig] = useState({
        config_key: '',
        config_value: '',
        description: ''
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [user, setUser] = useState(null);

    // Fetch user from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
        }
    }, []);

    // Fetch all configurations
    const fetchConfigs = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const result = await getSystemConfigs(user.user_id, 'all');
            setConfigs(result || []);
        } catch (err) {
            console.error('Failed to fetch configurations:', err);
            setError('Failed to fetch configurations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchConfigs();
        }
    }, [user]);

    // Handle configuration creation
    const handleCreateConfig = async () => {
        try {
            const exists = configs.some(c => c.config_key === newConfig.config_key);
            if (exists) { console.log('Config already exists'); return; }

            const createdConfig = await insertSystemConfig({
                ...newConfig,
                requestor_id: user.user_id
            });

            // Add the new configuration to the local state
            setConfigs((prevConfigs) => [...prevConfigs, createdConfig]);

            setShowCreateModal(false);
            setNewConfig({
                config_key: '',
                config_value: '',
                description: ''
            });
        } catch (err) {
            console.error('Failed to create configuration:', err);
            setError('Failed to create configuration');
        }
    };

    // Handle configuration update
    const handleUpdateConfig = async () => {
        try {
            //const exists = configs.some(c => c.config_key === editConfig.config_key && c.config_value === editConfig.config_value );
            //if (exists) { console.log('Config already exists'); return; }
            const updatedConfig = await updateSystemConfig({
                config_key: editConfig.config_key,
                config_value: editConfig.config_value,
                description: editConfig.description,
                requestor_id: user.user_id
            });

            // Update the local state
            setConfigs((prevConfigs) =>
                prevConfigs.map((config) =>
                    config.config_key === updatedConfig.config_key ? updatedConfig : config
                )
            );

            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to update configuration:', err);
            setError('Failed to update configuration');
        }
    };

    // Handle configuration deletion
    const handleDeleteConfig = async (configKey) => {
        if (!window.confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await deleteSystemConfig(configKey, user.user_id);

            // Remove the configuration from the local state
            setConfigs((prevConfigs) =>
                prevConfigs.filter((config) => config.config_key !== configKey)
            );
        } catch (err) {
            console.error('Failed to delete configuration:', err);
            setError('Failed to delete configuration');
        }
    };

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">System Configurations</h1>
                <p className="text-sm text-gray-400">View, edit, create, or delete system configurations</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-200"></div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 text-sm bg-green-900/40 hover:bg-green-900/50 text-green-400 rounded border border-green-900/50 hover:border-green-400"
                        >
                            + Create Configuration
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {configs.map((config) => (
                            <div
                                key={config.config_key}
                                className="bg-dark-glassy rounded-xl p-4 border border-[#55555555] hover:border-[#333] transition-all duration-300"
                            >
                                <h3 className="text-lg font-medium text-gray-200">{config.config_key}</h3>
                                <p className="text-sm text-gray-400">Value: {config.config_value}</p>
                                <p className="text-sm text-gray-400">Description: {config.description}</p>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            setEditConfig(config);
                                            setShowEditModal(true);
                                        }}
                                        className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteConfig(config.config_key)}
                                        className="px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded border border-red-900/50 hover:border-red-400"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-glassy rounded-xl p-6 w-full max-w-lg border border-[#55555555]">
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Create Configuration</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Config Key</label>
                                <input
                                    type="text"
                                    value={newConfig.config_key}
                                    onChange={(e) =>
                                        setNewConfig({ ...newConfig, config_key: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Config Value</label>
                                <input
                                    type="text"
                                    value={newConfig.config_value}
                                    onChange={(e) =>
                                        setNewConfig({ ...newConfig, config_value: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={newConfig.description}
                                    onChange={(e) =>
                                        setNewConfig({ ...newConfig, description: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-3 py-1 text-sm bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#55555555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateConfig}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editConfig && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-glassy rounded-xl p-6 w-full max-w-lg border border-[#55555555]">
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Edit Configuration</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Config Key</label>
                                <input
                                    type="text"
                                    value={editConfig.config_key}
                                    disabled
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Config Value</label>
                                <input
                                    type="text"
                                    value={editConfig.config_value}
                                    onChange={(e) =>
                                        setEditConfig({ ...editConfig, config_value: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={editConfig.description}
                                    onChange={(e) =>
                                        setEditConfig({ ...editConfig, description: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-3 py-1 text-sm bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#55555555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateConfig}
                                className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminConfigs;