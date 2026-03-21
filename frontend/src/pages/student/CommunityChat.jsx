import { useEffect, useState, useRef } from 'react';
import { 
    Send, Hash, MessageSquare, Users, Plus, 
    MoreVertical, Circle, User as UserIcon, X,
    Phone, Video, PhoneOff, Mic, MicOff, VideoOff,
    Maximize2, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '../../services/chatApi';

export default function CommunityChat({ user }) {
    // activeChat format: { type: 'channel' | 'dm', id: number | string, name: string }
    const [activeChat, setActiveChat] = useState({ type: 'channel', id: 'general', name: 'general' });
    const [channels, setChannels] = useState([]);
    const [dmRooms, setDmRooms] = useState([]);
    const [people, setPeople] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    
    // UI state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('channels'); // channels | people
    
    // Admin state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChannel, setNewChannel] = useState({ name: '', display_name: '', description: '' });

    // Calling state
    const [callState, setCallState] = useState({
        status: 'idle', // idle, dialing, ringing, connected
        isIncoming: false,
        callerId: null,
        callerName: '',
        type: 'video', // video, voice
    });
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const pcRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const ringtoneRef = useRef(new Audio('/assets/sounds/slack_ringtone.mp3'));
    const dialingRef = useRef(new Audio('/assets/sounds/slack_ringtone.mp3'));

    // Configure Audio
    useEffect(() => {
        ringtoneRef.current.loop = true;
        dialingRef.current.loop = true;
        return () => {
            ringtoneRef.current.pause();
            dialingRef.current.pause();
        };
    }, []);

    // Sync streams with video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localVideoRef.current, localStream, callState.status]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteVideoRef.current, remoteStream, callState.status]);

    // Refs
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    // --- Data Loading ---
    useEffect(() => {
        loadSidebarData();
        const pollOnline = setInterval(loadOnlineUsers, 10000);
        return () => clearInterval(pollOnline);
    }, []);

    const loadSidebarData = async () => {
        try {
            const [chRes, dmRes, pplRes] = await Promise.all([
                chatApi.getChannels(),
                chatApi.getDMRooms(),
                chatApi.getUsers()
            ]);
            setChannels(chRes.data);
            setDmRooms(dmRes.data);
            setPeople(pplRes.data);
            
            // Set initial chat to the general channel's ID if available
            if (activeChat.id === 'general' && chRes.data.length > 0) {
                const gen = chRes.data.find(c => c.name === 'general') || chRes.data[0];
                setActiveChat({ type: 'channel', id: gen.id, name: gen.name });
            }
            await loadOnlineUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const loadOnlineUsers = async () => {
        try {
            const res = await chatApi.getOnlineUsers();
            setOnlineUsers(new Set(res.data.map(o => o.user.id)));
        } catch {}
    };

    // --- Room / WebSocket Management ---
    useEffect(() => {
        if (!activeChat.id || activeChat.id === 'general') return;
        
        // 1. Load history
        loadMessageHistory();
        
        // 2. Connect WebSocket
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [activeChat.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessageHistory = async () => {
        setLoading(true);
        try {
            if (activeChat.type === 'channel') {
                const res = await chatApi.getChannelMessages(activeChat.id);
                setMessages(res.data);
            } else {
                const res = await chatApi.getDMMessages(activeChat.id);
                setMessages(res.data);
            }
        } catch {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Determine URL based on room type
        let wsUrl = '';
        if (activeChat.type === 'channel') {
            const ch = channels.find(c => c.id === activeChat.id);
            if (!ch) return;
            wsUrl = `ws://localhost:8000/ws/chat/channel/${ch.name}/?token=${token}`;
        } else {
            wsUrl = `ws://localhost:8000/ws/chat/dm/${activeChat.id}/?token=${token}`;
        }

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'chat_message') {
                setMessages(prev => [...prev, data]);
            } else if (data.type === 'call_signal') {
                handleCallSignal(data);
            } else if (data.type === 'user_status') {
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    if (data.is_online) next.add(data.user_id);
                    else next.delete(data.user_id);
                    return next;
                });
            }
        };

        ws.onclose = () => {
            console.log('Chat disconnected');
        };

        wsRef.current = ws;
    };

    const handleCallSignal = async (data) => {
        const { signal, sender_id } = data;
        const isMe = sender_id === user.id;
        if (isMe) return;

        if (signal.type === 'offer') {
            setCallState({
                status: 'ringing',
                isIncoming: true,
                callerId: sender_id,
                callerName: signal.callerName || 'Unknown',
                type: signal.callType || 'video',
                offer: signal.offer
            });
            ringtoneRef.current.play().catch(console.error);
        } else if (signal.type === 'answer') {
            dialingRef.current.pause();
            dialingRef.current.currentTime = 0;
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
            }
        } else if (signal.type === 'ice') {
            if (pcRef.current) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } else if (signal.type === 'hangup') {
            endCall(false);
        }
    };

    const startCall = async (type = 'video') => {
        setCallState({ status: 'dialing', isIncoming: false, callerId: null, callerName: activeChat.name, type });
        dialingRef.current.play().catch(console.error);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: type === 'video', 
                audio: true 
            });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = createPeerConnection(stream);
            pcRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            wsRef.current.send(JSON.stringify({
                type: 'call_signal',
                signal: {
                    type: 'offer',
                    offer,
                    callerName: user.first_name || user.username,
                    callType: type
                }
            }));
        } catch (err) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                toast.error('Permission denied. Please allow camera and mic access.');
            } else if (err.name === 'NotFoundError') {
                toast.error('No camera or microphone found to start the call.');
            } else {
                toast.error('Could not start call');
            }
            setCallState({ status: 'idle', isIncoming: false, callerId: null, callerName: '', type: 'video' });
        }
    };

    const acceptCall = async () => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: callState.type === 'video', 
                audio: true 
            });
            setLocalStream(stream);
            setCallState(prev => ({ ...prev, status: 'connected' }));

            const pc = createPeerConnection(stream);
            pcRef.current = pc;

            await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            wsRef.current.send(JSON.stringify({
                type: 'call_signal',
                signal: { type: 'answer', answer }
            }));
        } catch (err) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                toast.error('Permission denied. Please allow camera and mic access.');
            } else if (err.name === 'NotFoundError') {
                toast.error('No camera or microphone found to accept the call.');
            } else {
                toast.error('Could not accept call');
            }
            endCall();
        }
    };

    const createPeerConnection = (stream) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
            setRemoteStream(e.streams[0]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
            setCallState(prev => ({ ...prev, status: 'connected' }));
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                wsRef.current.send(JSON.stringify({
                    type: 'call_signal',
                    signal: { type: 'ice', candidate: e.candidate }
                }));
            }
        };

        return pc;
    };

    const endCall = (notify = true) => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        dialingRef.current.pause();
        dialingRef.current.currentTime = 0;

        if (notify && wsRef.current) {
            wsRef.current.send(JSON.stringify({
                type: 'call_signal',
                signal: { type: 'hangup' }
            }));
        }

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        setRemoteStream(null);
        setCallState({ status: 'idle', isIncoming: false, callerId: null, callerName: '', type: 'video' });
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
        }
    };

    const sendMessage = () => {
        if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        wsRef.current.send(JSON.stringify({
            type: 'chat_message',
            content: input
        }));
        
        setInput('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // --- Actions ---
    const openDM = async (otherUser) => {
        try {
            const res = await chatApi.createDMRoom(otherUser.id);
            const room = res.data;
            // Update dm room list if new
            if (!dmRooms.find(r => r.id === room.id)) {
                setDmRooms([room, ...dmRooms]);
            }
            setActiveChat({ type: 'dm', id: room.id, name: otherUser.first_name || otherUser.username });
        } catch {
            toast.error('Could not open chat');
        }
    };

    // --- Helper UI ---
    const getRoleBadge = (role) => {
        if (role === 'STUDENT') return 'badge-indigo';
        if (role === 'ALUMNI') return 'badge-emerald';
        if (role === 'PROFESSIONAL' || role === 'HR') return 'badge-amber';
        return 'badge-slate';
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannel.name || !newChannel.display_name) return;
        try {
            const res = await chatApi.createChannel({
                ...newChannel,
                is_public: true
            });
            setChannels([...channels, res.data]);
            setShowCreateModal(false);
            setNewChannel({ name: '', display_name: '', description: '' });
            setActiveChat({ type: 'channel', id: res.data.id, name: res.data.name });
            toast.success('Channel created!');
        } catch {
            toast.error('Failed to create channel');
        }
    };

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-4">
            {/* Left Sidebar (Channels / DMs / People) */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab('channels')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'channels' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                        Chats
                    </button>
                    <button onClick={() => setActiveTab('people')} className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'people' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                        People
                    </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {activeTab === 'channels' ? (
                        <>
                            {/* Public Channels */}
                            <div>
                                <div className="flex items-center justify-between px-3 mt-2 mb-1">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Channels</h3>
                                    {user?.role === 'ADMIN' && (
                                        <button onClick={() => setShowCreateModal(true)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                            <Plus size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    {channels.map(ch => (
                                        <button key={ch.id} onClick={() => setActiveChat({ type: 'channel', id: ch.id, name: ch.name })}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${activeChat.type === 'channel' && activeChat.id === ch.id ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                            <Hash size={14} className={activeChat.id === ch.id ? 'text-indigo-400' : 'text-slate-500'} />
                                            {ch.display_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Direct Messages */}
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 mt-4">Direct Messages</h3>
                                <div className="space-y-0.5">
                                    {dmRooms.map(dm => {
                                        const other = dm.other_user;
                                        if (!other) return null;
                                        const isOnline = onlineUsers.has(other.id);
                                        const isActive = activeChat.type === 'dm' && activeChat.id === dm.id;
                                        
                                        return (
                                            <button key={dm.id} onClick={() => setActiveChat({ type: 'dm', id: dm.id, name: other.first_name || other.username })}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-indigo-600/10 text-indigo-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                                <div className="relative">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                                        {other.first_name ? other.first_name[0].toUpperCase() : other.username[0].toUpperCase()}
                                                    </div>
                                                    {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>}
                                                </div>
                                                <span className="truncate">{other.first_name || other.username}</span>
                                            </button>
                                        );
                                    })}
                                    {dmRooms.length === 0 && (
                                        <p className="text-xs text-slate-500 px-3 py-2">No active DMs. Find people in the People tab.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 mt-2">All Members</h3>
                            <div className="space-y-1">
                                {people.map(p => (
                                    <button key={p.id} onClick={() => openDM(p)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800">
                                        <div className="relative">
                                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                                {p.first_name ? p.first_name[0].toUpperCase() : p.username[0].toUpperCase()}
                                            </div>
                                            {onlineUsers.has(p.id) && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>}
                                        </div>
                                        <div className="flex flex-col items-start flex-1 overflow-hidden">
                                            <span className="truncate text-slate-300 font-medium">{p.first_name || p.username}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${p.role === 'STUDENT' ? 'text-indigo-400' : p.role === 'ALUMNI' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {p.role}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                            {activeChat.type === 'channel' ? <Hash size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">
                                {activeChat.type === 'channel' ? '#' : ''}{activeChat.name}
                            </h2>
                            {activeChat.type === 'channel' && (
                                <p className="text-xs text-slate-500">
                                    {channels.find(c => c.id === activeChat.id)?.description || 'Community Channel'}
                                </p>
                            )}
                            {activeChat.type === 'dm' && (
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${onlineUsers.has(dmRooms.find(r => r.id === activeChat.id)?.other_user?.id) ? 'bg-green-400' : 'hidden'}`}></span>
                                      <span className={`relative inline-flex rounded-full h-2 w-2 ${onlineUsers.has(dmRooms.find(r => r.id === activeChat.id)?.other_user?.id) ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                                    </span>
                                    {onlineUsers.has(dmRooms.find(r => r.id === activeChat.id)?.other_user?.id) ? 'Online' : 'Offline'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Call Actions (only for DM) */}
                    {activeChat.type === 'dm' && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => startCall('voice')}
                                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
                                title="Voice Call"
                            >
                                <Phone size={18} />
                            </button>
                            <button 
                                onClick={() => startCall('video')}
                                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
                                title="Video Call"
                            >
                                <Video size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                <MessageSquare size={20} className="text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-medium">It's quiet in here.</p>
                            <p className="text-slate-500 text-sm mt-1">Be the first to say hello!</p>
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isMe = m.sender_id === user?.id;
                            const prevMessage = idx > 0 ? messages[idx - 1] : null;
                            const showHeader = !prevMessage || prevMessage.sender_id !== m.sender_id;
                            
                            return (
                                <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex max-w-[75%] gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        
                                        {/* Avatar area */}
                                        {!isMe && showHeader ? (
                                            <div className="relative w-8 flex-shrink-0 mt-1">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {(m.sender_name || '?')[0].toUpperCase()}
                                                </div>
                                            </div>
                                        ) : !isMe ? (
                                            <div className="w-8 flex-shrink-0"></div> // Spacer for subsequent messages from same sender
                                        ) : null}

                                        {/* Message bubble */}
                                        <div className="flex flex-col">
                                            {!isMe && showHeader && (
                                                <div className="flex items-baseline gap-2 mb-1 pl-1">
                                                    <span className="text-xs font-medium text-slate-300">{m.sender_name}</span>
                                                    {m.sender_role && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                            {m.sender_role}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className={`px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm
                                                ${isMe 
                                                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                                    : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm border border-slate-700/50'
                                                }`}>
                                                {m.content}
                                            </div>
                                            
                                            <span className={`text-[10px] text-slate-500 mt-1 ${isMe ? 'text-right pr-1' : 'pl-1'}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:bg-slate-800 transition-all">
                        <input 
                            className="flex-1 bg-transparent px-3 py-2 text-[15px] text-white placeholder:text-slate-500 focus:outline-none" 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey} 
                            placeholder={`Message ${activeChat.type === 'channel' ? '#' : ''}${activeChat.name}...`} 
                        />
                        <button 
                            onClick={sendMessage} 
                            disabled={!input.trim()} 
                            className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 transition-all flex-shrink-0">
                            <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Channel Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-white">Create New Channel</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Channel Name (Slug)</label>
                                <input required className="input-field w-full font-mono text-sm" placeholder="e.g. machine-learning"
                                    value={newChannel.name} onChange={e => setNewChannel({...newChannel, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Display Name</label>
                                <input required className="input-field w-full" placeholder="e.g. Machine Learning"
                                    value={newChannel.display_name} onChange={e => setNewChannel({...newChannel, display_name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                                <textarea className="input-field w-full resize-none min-h-[80px]" placeholder="What is this channel about?"
                                    value={newChannel.description} onChange={e => setNewChannel({...newChannel, description: e.target.value})} />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={!newChannel.name || !newChannel.display_name} className="btn-primary flex-1">Create Channel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Calling Interface */}
            {callState.status !== 'idle' && (
                <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6">
                    {/* Active Call UI */}
                    {callState.status === 'connected' ? (
                        <div className="relative w-full h-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
                            {/* Videos */}
                            <div className="relative flex-1 bg-black flex items-center justify-center">
                                {callState.type === 'video' ? (
                                    <>
                                        <video 
                                            ref={remoteVideoRef} 
                                            autoPlay 
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-6 right-6 w-48 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl z-10">
                                            <video 
                                                ref={localVideoRef} 
                                                autoPlay 
                                                playsInline
                                                muted 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl animate-pulse">
                                            {callState.callerName[0].toUpperCase()}
                                        </div>
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-white mb-1">{callState.callerName}</h2>
                                            <p className="text-indigo-400 font-medium">Voice Call Connected</p>
                                        </div>
                                        {/* Hidden videos to handle audio streams for voice calls */}
                                        <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                                        <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="h-24 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-6">
                                <button 
                                    onClick={toggleMic}
                                    className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700"
                                >
                                    <Mic size={20} />
                                </button>
                                {callState.type === 'video' && (
                                    <button 
                                        onClick={toggleVideo}
                                        className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700"
                                    >
                                        <Video size={20} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => endCall()}
                                    className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                >
                                    <PhoneOff size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Dialing / Ringing / Incoming UI */
                        <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                    {callState.callerName[0]?.toUpperCase() || '?' }
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">{callState.callerName}</h2>
                            <p className="text-slate-400 mb-10 font-medium">
                                {callState.status === 'dialing' ? 'Calling...' : 
                                 callState.status === 'ringing' && callState.isIncoming ? `Incoming ${callState.type} call...` : 
                                 'Ringing...'}
                            </p>

                            <div className="flex gap-4 w-full">
                                {callState.isIncoming && callState.status === 'ringing' ? (
                                    <>
                                        <button 
                                            onClick={acceptCall}
                                            className="flex-1 h-14 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                        >
                                            <Phone size={20} /> Accept
                                        </button>
                                        <button 
                                            onClick={() => endCall()}
                                            className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                        >
                                            <PhoneOff size={20} /> Decline
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => endCall()}
                                        className="w-full h-14 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        <PhoneOff size={20} /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
