import api from './api';

export const chatApi = {
    // Channels
    getChannels: () => api.get('/chat/channels/'),
    createChannel: (data) => api.post('/chat/channels/', data),
    joinChannel: (id) => api.post(`/chat/channels/${id}/join/`),
    getChannelMembers: (id) => api.get(`/chat/channels/${id}/members/`),
    getChannelMessages: (id) => api.get(`/chat/channels/${id}/messages/`),

    // DMs
    getDMRooms: () => api.get('/chat/rooms/'),
    createDMRoom: (userId) => api.post('/chat/rooms/', { user_id: userId }),
    getDMMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages/`),

    // Users
    getUsers: (role = '') => api.get(`/chat/users/?role=${role}`),
    getOnlineUsers: () => api.get('/chat/users/online/'),
};
