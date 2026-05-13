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
            <style>{`
                @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .msg-anim{animation:msgIn .18s ease forwards}
            `}</style>

            {/* â”€â”€ Sidebar â”€â”€ */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex border-b border-white/5">
                    {['channels','people'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeTab===tab ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}>
                            {tab==='channels'?'Chats':'People'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                    {activeTab === 'channels' ? (
                        <>
                            <div>
                                <div className="flex items-center justify-between px-3 mt-3 mb-1.5">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Channels</span>
                                    {user?.role === 'ADMIN' && (
                                        <button onClick={() => setShowCreateModal(true)} className="w-5 h-5 rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 flex items-center justify-center transition-all"><Plus size={11} /></button>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    {channels.map(ch => {
                                        const active = activeChat.type==='channel' && activeChat.id===ch.id;
                                        return (
                                            <button key={ch.id} onClick={() => setActiveChat({type:'channel',id:ch.id,name:ch.name})}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${active?'bg-indigo-600/15 text-indigo-300 font-semibold':'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}>
                                                <Hash size={13} className={active?'text-indigo-400':'text-slate-600'} />
                                                <span className="truncate">{ch.display_name}</span>
                                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-1.5 mt-3">Direct Messages</span>
                                <div className="space-y-0.5">
                                    {dmRooms.map(dm => {
                                        const other = dm.other_user; if (!other) return null;
                                        const isOnline = onlineUsers.has(other.id);
                                        const isActive = activeChat.type==='dm' && activeChat.id===dm.id;
                                        return (
                                            <button key={dm.id} onClick={() => setActiveChat({type:'dm',id:dm.id,name:other.first_name||other.username})}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${isActive?'bg-indigo-600/15 text-indigo-300 font-semibold':'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}>
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white ${isActive?'bg-indigo-600':'bg-white/10'}`}>
                                                        {(other.first_name||other.username)[0].toUpperCase()}
                                                    </div>
                                                    {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />}
                                                </div>
                                                <span className="truncate">{other.first_name||other.username}</span>
                                            </button>
                                        );
                                    })}
                                    {dmRooms.length===0 && <p className="text-xs text-slate-600 px-3 py-2">No DMs yet. Find people in the People tab.</p>}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-1.5 mt-3">All Members</span>
                            <div className="space-y-0.5">
                                {people.map(p => (
                                    <button key={p.id} onClick={() => openDM(p)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/5 group">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-black text-white">
                                                {(p.first_name||p.username)[0].toUpperCase()}
                                            </div>
                                            {onlineUsers.has(p.id) && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />}
                                        </div>
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="truncate text-slate-300 font-semibold text-xs group-hover:text-white transition-colors">{p.first_name||p.username}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${p.role==='STUDENT'?'text-indigo-400':p.role==='ALUMNI'?'text-emerald-400':'text-amber-400'}`}>{p.role}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* â”€â”€ Main Chat â”€â”€ */}
            <div className="flex-1 flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="h-16 px-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-black/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            {activeChat.type==='channel' ? <Hash size={16}/> : <UserIcon size={16}/>}
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">{activeChat.type==='channel'?'#':''}{activeChat.name}</h2>
                            {activeChat.type==='channel' && <p className="text-xs text-slate-500">{channels.find(c=>c.id===activeChat.id)?.description||'Community Channel'}</p>}
                            {activeChat.type==='dm' && (() => {
                                const isOnline = onlineUsers.has(dmRooms.find(r=>r.id===activeChat.id)?.other_user?.id);
                                return <p className="text-xs flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${isOnline?'bg-emerald-500 animate-pulse':'bg-slate-600'}`}/><span className={isOnline?'text-emerald-400':'text-slate-500'}>{isOnline?'Online':'Offline'}</span></p>;
                            })()}
                        </div>
                    </div>
                    {activeChat.type==='dm' && (
                        <div className="flex items-center gap-2">
                            <button onClick={()=>startCall('voice')} title="Voice Call" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/8 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 flex items-center justify-center transition-all"><Phone size={16}/></button>
                            <button onClick={()=>startCall('video')} title="Video Call" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/8 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 flex items-center justify-center transition-all"><Video size={16}/></button>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-full flex-col gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
                            <p className="text-xs text-slate-500">Loading messagesâ€¦</p>
                        </div>
                    ) : messages.length===0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center"><MessageSquare size={28} className="text-indigo-400"/></div>
                            <div className="text-center"><p className="text-slate-300 font-bold">It's quiet here.</p><p className="text-slate-500 text-sm mt-1">Be the first to say hello! ðŸ‘‹</p></div>
                        </div>
                    ) : messages.map((m,idx) => {
                        const isMe = m.sender_id===user?.id;
                        const showHeader = idx===0 || messages[idx-1].sender_id!==m.sender_id;
                        return (
                            <div key={m.id||idx} className={`flex msg-anim ${isMe?'justify-end':'justify-start'}`}>
                                <div className={`flex max-w-[72%] gap-2.5 ${isMe?'flex-row-reverse':''}`}>
                                    {!isMe && showHeader
                                        ? <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/20">{(m.sender_name||'?')[0].toUpperCase()}</div>
                                        : !isMe ? <div className="w-8 flex-shrink-0"/> : null}
                                    <div className="flex flex-col">
                                        {!isMe && showHeader && (
                                            <div className="flex items-baseline gap-2 mb-1 pl-1">
                                                <span className="text-xs font-bold text-slate-300">{m.sender_name}</span>
                                                {m.sender_role && <span className={`text-[9px] font-black uppercase tracking-widest ${m.sender_role==='STUDENT'?'text-indigo-400':m.sender_role==='ALUMNI'?'text-emerald-400':'text-amber-400'}`}>{m.sender_role}</span>}
                                            </div>
                                        )}
                                        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${isMe?'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-indigo-600/20':'bg-white/5 border border-white/8 text-slate-100 rounded-2xl rounded-tl-sm'}`}>{m.content}</div>
                                        <span className={`text-[10px] text-slate-600 mt-1 ${isMe?'text-right pr-1':'pl-1'}`}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef}/>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-md">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 focus-within:border-indigo-500/40 focus-within:bg-indigo-500/5 rounded-xl px-4 py-1.5 transition-all duration-200">
                        <input className="flex-1 bg-transparent py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                            value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                            placeholder={`Message ${activeChat.type==='channel'?'#':''}${activeChat.name}â€¦`}/>
                        <button onClick={sendMessage} disabled={!input.trim()}
                            className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-white/5 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95">
                            <Send size={15} className={input.trim()?'translate-x-0.5 -translate-y-0.5':''}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Channel Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-black border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center"><Hash size={14} className="text-indigo-400"/></div>
                                <h3 className="text-base font-bold text-white">Create New Channel</h3>
                            </div>
                            <button onClick={()=>setShowCreateModal(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"><X size={16}/></button>
                        </div>
                        <form onSubmit={handleCreateChannel} className="p-5 space-y-4">
                            {[{label:'Channel Name (Slug)',field:'name',placeholder:'machine-learning',mono:true},{label:'Display Name',field:'display_name',placeholder:'Machine Learning',mono:false}].map(({label,field,placeholder,mono})=>(
                                <div key={field}>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                                    <input required placeholder={placeholder} className={`w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 rounded-xl text-white text-sm outline-none transition-all ${mono?'font-mono':''}`}
                                        value={newChannel[field]} onChange={e=>setNewChannel({...newChannel,[field]:field==='name'?e.target.value.toLowerCase().replace(/\s+/g,'-'):e.target.value})}/>
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                <textarea className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 rounded-xl text-white text-sm outline-none transition-all resize-none min-h-[80px]"
                                    placeholder="What is this channel about?" value={newChannel.description} onChange={e=>setNewChannel({...newChannel,description:e.target.value})}/>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={()=>setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white font-semibold text-sm transition-all">Cancel</button>
                                <button type="submit" disabled={!newChannel.name||!newChannel.display_name} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">Create Channel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Call Overlay */}
            {callState.status!=='idle' && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6">
                    {callState.status==='connected' ? (
                        <div className="relative w-full h-full max-w-5xl bg-black rounded-3xl overflow-hidden border border-white/10 flex flex-col">
                            <div className="relative flex-1 bg-black flex items-center justify-center">
                                {callState.type==='video' ? (
                                    <>
                                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                                        <div className="absolute top-5 right-5 w-48 aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-10">
                                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-600/30 animate-pulse">{callState.callerName[0]?.toUpperCase()}</div>
                                        <div className="text-center"><h2 className="text-2xl font-black text-white mb-1">{callState.callerName}</h2><p className="text-indigo-400 font-semibold">Voice Call Connected</p></div>
                                        <video ref={remoteVideoRef} autoPlay playsInline className="hidden"/><video ref={localVideoRef} autoPlay playsInline muted className="hidden"/>
                                    </div>
                                )}
                            </div>
                            <div className="h-24 border-t border-white/5 flex items-center justify-center gap-5 bg-black/90 backdrop-blur-xl">
                                <button onClick={toggleMic} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 transition-all"><Mic size={20}/></button>
                                {callState.type==='video' && <button onClick={toggleVideo} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 transition-all"><Video size={20}/></button>}
                                <button onClick={()=>endCall()} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-all"><PhoneOff size={24}/></button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm bg-black border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"/>
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-600/30">{callState.callerName[0]?.toUpperCase()||'?'}</div>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">{callState.callerName}</h2>
                            <p className="text-slate-400 mb-10 text-sm">{callState.status==='dialing'?'Callingâ€¦':callState.isIncoming?`Incoming ${callState.type} callâ€¦`:'Ringingâ€¦'}</p>
                            <div className="flex gap-4 w-full">
                                {callState.isIncoming && callState.status==='ringing' ? (
                                    <>
                                        <button onClick={acceptCall} className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"><Phone size={20}/> Accept</button>
                                        <button onClick={()=>endCall()} className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"><PhoneOff size={20}/> Decline</button>
                                    </>
                                ) : (
                                    <button onClick={()=>endCall()} className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"><PhoneOff size={20}/> Cancel</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
