import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ProctoringMonitor = ({ testId, onViolation }) => {
    const webcamRef = useRef(null);
    const [model, setModel] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [statusText, setStatusText] = useState("Initializing Proctoring...");
    const noFaceDurationRef = useRef(0);
    const noiseDurationRef = useRef(0);
    const apiCooldownRef = useRef(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const onViolationRef = useRef(onViolation);

    useEffect(() => {
        onViolationRef.current = onViolation;
    }, [onViolation]);

    // Initialize TensorFlow Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                setStatusText("Loading AI Models...");
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                setStatusText("Active");
                setIsDetecting(true);
            } catch (err) {
                console.error("Failed to load COCO-SSD:", err);
                setStatusText("Proctoring Failed");
            }
        };
        loadModel();
    }, []);

    // Detection Loop
    useEffect(() => {
        let interval;

        const detect = async () => {
            if (!model || !webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) {
                return;
            }

            const video = webcamRef.current.video;
            const stream = streamRef.current;
            
            // Check hardware disconnects
            let isHardwareDisconnected = false;
            if (stream) {
                 const tracks = stream.getTracks();
                 if (tracks.some(track => track.readyState === 'ended' || !track.enabled)) {
                      isHardwareDisconnected = true;
                 }
            }

            if (isHardwareDisconnected) {
                if (onViolationRef.current) onViolationRef.current({ type: 'hardware_disconnect', msg: "Camera or Microphone disconnected.", severity: 'severe' });
                return;
            }

            // Audio Noise Detection
            let isNoisy = false;
            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                
                // Using a relative threshold depending on Mic sensitivity, normally ~40 is talk volume
                if (average > 35) {
                    noiseDurationRef.current += 2; // runs every 2s
                    isNoisy = noiseDurationRef.current > 6; // 6 seconds of continuous loud noise
                } else {
                    noiseDurationRef.current = 0;
                }
            }

            const predictions = await model.detect(video);

            let personCount = 0;
            let phoneDetected = false;

            predictions.forEach(prediction => {
                if (prediction.class === 'person') personCount++;
                if (prediction.class === 'cell phone') phoneDetected = true;
            });

            // Rules Processing
            let currentViolation = null;

            if (phoneDetected) {
                currentViolation = { type: 'phone_detected', msg: "Phone detected. Please remove the device.", severity: 'severe' };
                noFaceDurationRef.current = 0;
            } else if (personCount > 1) {
                currentViolation = { type: 'multiple_persons', msg: "Multiple persons detected.", severity: 'severe' };
                noFaceDurationRef.current = 0;
            } else if (isNoisy) {
                currentViolation = { type: 'continuous_noise', msg: "Continuous loud noise or voices detected.", severity: 'severe' };
                noFaceDurationRef.current = 0;
            } else if (personCount === 0) {
                noFaceDurationRef.current += 2; // runs every 2s
                if (noFaceDurationRef.current > 10) {
                    currentViolation = { type: 'no_face_detected', msg: "Face not detected. Please stay in frame.", severity: 'warning' };
                }
            } else {
                noFaceDurationRef.current = 0;
            }

            if (currentViolation && !apiCooldownRef.current) {
                apiCooldownRef.current = true;
                
                // Fire UI Warning & Log
                if (onViolationRef.current) onViolationRef.current(currentViolation);

                // Send to backend (Optional Legacy support/Can be removed if purely relying on end-of-test log)
                try {
                    await api.post('/interviews/proctoring/violation/', {
                        test_id: testId,
                        violation_type: currentViolation.type
                    });
                } catch (e) {
                    // Ignore backend fail for individual pings
                }

                // Cooldown to prevent spamming the API every 2 seconds for the same standing violation
                setTimeout(() => {
                    apiCooldownRef.current = false;
                }, 5000); 
            }
        };

        if (isDetecting) {
            interval = setInterval(detect, 2000);
        }

        return () => {
             clearInterval(interval);
        };
    }, [model, isDetecting, testId]);

    useEffect(() => {
        return () => {
             if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                 audioContextRef.current.close().catch(e => console.log(e));
             }
        };
    }, []);

    const handleUserMedia = (stream) => {
        streamRef.current = stream;
        
        try {
             // Set up AudioContext for noise detection
             const AudioContext = window.AudioContext || window.webkitAudioContext;
             const audioContext = new AudioContext();
             const analyser = audioContext.createAnalyser();
             const microphone = audioContext.createMediaStreamSource(stream);
             
             analyser.smoothingTimeConstant = 0.8;
             analyser.fftSize = 1024;
             microphone.connect(analyser);
             
             audioContextRef.current = audioContext;
             analyserRef.current = analyser;
        } catch (err) {
             console.log("Audio detection initialization failed", err);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col w-56">
            <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                    {isDetecting ? <Camera size={14} className="text-emerald-400" /> : <CameraOff size={14} className="text-slate-500" />}
                    <span>AI Proctor</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        {isDetecting && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isDetecting ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                </div>
            </div>
            
            <div className="relative bg-black aspect-video">
                <Webcam
                    ref={webcamRef}
                    audio={true}
                    muted={true}
                    width={224}
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full object-cover scale-x-[-1]"
                    onUserMedia={handleUserMedia}
                    onUserMediaError={() => setStatusText("Camera Denied")}
                />
                {!isDetecting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-center p-4">
                        <AlertTriangle className="text-amber-500 mb-2" size={24} />
                        <p className="text-xs text-amber-200 mt-1">{statusText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProctoringMonitor;
