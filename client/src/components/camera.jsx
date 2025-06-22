import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Camera = ({ onDataUpdate }) => {
    const videoRef = useRef(null);
    const canvasOutputRef = useRef(null);
    const socket = useRef(null);
    const canvasInputRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const FRAME_HEIGHT = 200;

    const [isStreaming, setIsStreaming] = useState(false);
    const [objectCount, setObjectCount] = useState(0);
    const [annotations, setAnnotations] = useState([]);
    const { isCameraEnabled, setIsCameraEnabled, inFlight, switchSource, setSwitchSource, rtspLink, fps } = useContext(SettingsContext);
    // const s = "http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000";
    

    useEffect(() => {
        let cleanup;
    
        const initializeSocket = async () => {
            if (!isCameraEnabled) {
                console.log(import.meta.env.VITE_WEBSOCKET_URL);
                socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_RTSP_URL);
    
                socket.current.onopen = () => {
                    // clear the canvas when the socket closes
                    if (canvasOutputRef.current) {
                        const ctx = canvasOutputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasOutputRef.current.width, canvasOutputRef.current.height);
                    }
                    if (canvasInputRef.current) {
                        const ctx = canvasInputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasInputRef.current.width, canvasInputRef.current.height);
                    }
                    
                    setSwitchSource(false);
                    console.log("Socket connected to RTSP stream");
                };

                socket.current.onclose = () => {
                    // clear the canvas when the socket closes
                    if (canvasOutputRef.current) {
                        const ctx = canvasOutputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasOutputRef.current.width, canvasOutputRef.current.height);
                    }
                    if (canvasInputRef.current) {
                        const ctx = canvasInputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasInputRef.current.width, canvasInputRef.current.height);
                    }
                    setSwitchSource(false);
                }
    
                socket.current.onmessage = (event) => {

                    inFlight.current = false;
                    const message = JSON.parse(event.data);
                    console.log("RTSP message received:", message);
                    
                    const image = new Image();
                    image.src = `data:image/jpeg;base64,${message.image}`;
                    
                    image.onload = () => {
                        if (!canvasOutputRef.current) return;

                        const ctx = canvasOutputRef.current.getContext('2d');
                        const ratio = image.width / image.height;
                        const width = FRAME_HEIGHT * ratio;
    
                        canvasOutputRef.current.height = FRAME_HEIGHT;
                        canvasOutputRef.current.width = width;
    
                        ctx.clearRect(0, 0, width, FRAME_HEIGHT);
                        ctx.drawImage(image, 0, 0, width, FRAME_HEIGHT);
    
                        message.annotations.forEach(({ x1, y1, x2, y2, label, confidence }) => {
                            ctx.strokeStyle = 'red';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
                            ctx.fillStyle = 'green';
                            ctx.font = '12px Arial';
                            ctx.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                        });
                    };
                    
                    setObjectCount(message.count);
                    setAnnotations(message.annotations);
                    onDataUpdate(message);
                };
    
                // Wait until the socket is open
                await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (socket.current?.readyState === WebSocket.OPEN) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
    
                socket.current.send(JSON.stringify({ action: 'BEGIN_STREAM', stream_url: `${rtspLink}` }));
                setIsStreaming(true);
    
                cleanup = () => {
                    console.log("Cleaning up rtsp socket connection...");
                    setSwitchSource(true);
                    socket.current?.close();
                };
            } else {
                console.log(import.meta.env.VITE_WEBSOCKET_URL);
                socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
    
                socket.current.onopen = () => {
                    // clear the canvas when the socket closes
                    if (canvasOutputRef.current) {
                        const ctx = canvasOutputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasOutputRef.current.width, canvasOutputRef.current.height);
                    }
                    if (canvasInputRef.current) {
                        const ctx = canvasInputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasInputRef.current.width, canvasInputRef.current.height);
                    }

                    setSwitchSource(false);
                    console.log("Webcam Socket connected");
                    setIsStreaming(true);
                };

                socket.current.onclose = () => {
                    // clear the canvas when the socket closes
                    if (canvasOutputRef.current) {
                        const ctx = canvasOutputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasOutputRef.current.width, canvasOutputRef.current.height);
                    }
                    if (canvasInputRef.current) {
                        const ctx = canvasInputRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasInputRef.current.width, canvasInputRef.current.height);
                    }
                    setSwitchSource(false);
                }
    
                socket.current.onmessage = (event) => {
                    inFlight.current = false;
                    const message = JSON.parse(event.data);
                    const image = new Image();
                    image.src = `data:image/jpeg;base64,${message.image}`;
    
                    image.onload = () => {
                        const ctx = canvasOutputRef.current.getContext('2d');
                        const ratio = image.width / image.height;
                        const width = FRAME_HEIGHT * ratio;
    
                        canvasOutputRef.current.height = FRAME_HEIGHT;
                        canvasOutputRef.current.width = width;
    
                        ctx.clearRect(0, 0, width, FRAME_HEIGHT);
                        ctx.drawImage(image, 0, 0, width, FRAME_HEIGHT);
    
                        message.annotations.forEach(({ x1, y1, x2, y2, label, confidence }) => {
                            ctx.strokeStyle = 'red';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
                            ctx.fillStyle = 'green';
                            ctx.font = '12px Arial';
                            ctx.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                        });
                    };
    
                    setObjectCount(message.count);
                    setAnnotations(message.annotations);
                    onDataUpdate(message);
                };
    
                cleanup = () => {
                    console.log("Cleaning up webcam socket connection...");
                    setSwitchSource(true);
                    socket.current?.close();
                    setIsStreaming(false);
                };
            }
        };
    
        initializeSocket();
    
        return () => {
            if (cleanup) cleanup();
        };
    }, [isCameraEnabled]);


    const emitFrameToServer = useCallback(() => {
        if (inFlight.current) return;   // skip if inflight flag is true
        console.log("Emitting camera frame to server...");

        const video = videoRef.current;
        if (video && video.srcObject) {
            inFlight.current = true; // set inflight flag to true


            const stream = video.srcObject;

            const videoTrack = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(videoTrack);
            
            // capture the frame and send it to the server
            imageCapture.grabFrame()
                .then((imageBitmap) => {
                    imageToBlob(imageBitmap).then((blob) => {
                        if (socket.current.readyState === WebSocket.OPEN) {
                            socket.current.send(blob);
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error capturing frame:", error);
                });
        }
    }, []);

    // get access to the camera
    useEffect(() => {
        if (!isCameraEnabled) {
            // Cleanup existing stream when camera is disabled
            if (mediaStreamRef.current) {
                const tracks = mediaStreamRef.current.getTracks();
                tracks.forEach(track => {
                    if (track.enabled) {
                        track.enabled = false;
                    }
                    if (track.readyState === 'live') {
                        track.stop();
                    }
                });
                mediaStreamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
            return;
        } else {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    mediaStreamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch((error) => {
                    console.error("Error accessing media devices.", error);
                    setIsCameraEnabled(false);
                });
        }


        return () => {
            if (isCameraEnabled) {
                if (mediaStreamRef.current) {
                    const tracks = mediaStreamRef.current.getTracks();
                    tracks.forEach(track => {
                        if (track.enabled) {
                            track.enabled = false;
                        }
                        if (track.readyState === 'live') {
                            track.stop();
                        }
                    });
                    mediaStreamRef.current = null;
                }
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.srcObject = null;
                }
            }
        };
    }, [isCameraEnabled]);

    // convert image to blob
    const imageToBlob = (image) => {
        return new Promise((resolve) => {
            const contextCvsInp = canvasInputRef.current.getContext('2d');
            const inputRatio = image.width / image.height
            const inputFrameWidth = image.width;
            const inputFrameHeight = image.height;

            canvasInputRef.current.height = inputFrameHeight;
            canvasInputRef.current.width = inputFrameWidth;

            contextCvsInp.clearRect(0, 0, inputFrameWidth, inputFrameHeight);
            contextCvsInp.drawImage(image, 0, 0, inputFrameWidth, inputFrameHeight);

            contextCvsInp.canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.99);
        });
    };

    // emit frames while attempting to maintain constant FPS
    useEffect(() => {
        console.log("Camera enabled:", isCameraEnabled);
        if (!isCameraEnabled) return;

        const interval = setInterval(emitFrameToServer, 1000 / fps);

        return () => clearInterval(interval);
    }, [emitFrameToServer, isCameraEnabled, fps]);

    return (
        <>
            <section className='camera flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md flex-1'>
                <div>
                    
                    {isStreaming && !switchSource ? (
                        <>
                            {isCameraEnabled ? (
                                <h1 className='text-center text-green-500'>Camera is streaming</h1>
                                ) : (
                                    <h1 className='text-center text-blue-500'>Live/Recorded streaming</h1>
                                )
                            }

                            <h1 className='text-center text-red-500'>FPS set: {fps}</h1>
                            <h2 className='text-center'>Detected Objects: {objectCount}</h2>
                        </>
                    ) : (
                        <h1 className='text-center text-red-500'>Camera is not streaming</h1>
                    )}
                </div>
                
                {isCameraEnabled && !switchSource && (
                    <div className='my-4 flex flex-col items-center'>
                        <h3>Camera</h3>
                        <video
                            ref={videoRef}
                            id='video'
                            autoPlay
                            className='rounded w-full'
                            />
                    </div>
                )}

                
                {!switchSource && (
                    <div className='my-4 flex flex-col items-center hidden'>
                        <h3>Input Frame</h3>
                        <canvas 
                            ref={canvasInputRef} 
                            id='inputCanvas'
                            className='rounded w-full'
                            ></canvas>
                    </div>
                )}

                {!switchSource && (
                    <div className='my-4 flex flex-col items-center'>
                        <h3>Output Frame</h3>
                        <canvas
                            ref={canvasOutputRef} 
                            id='outputCanvas'
                            className='rounded w-full'
                            ></canvas>
                    </div>
                )}
            </section>
        </>
    );
}

export default Camera;
