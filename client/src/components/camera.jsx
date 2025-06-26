import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { DataContext } from '../context/DataContext';

const Camera = ({ onDataUpdate }) => {
    const videoRef = useRef(null);
    const canvasOutputRef = useRef({});
    const socket = useRef(null);
    const canvasInputRef = useRef({});
    const mediaStreamRef = useRef(null);
    const FRAME_HEIGHT = 200;

    const [isStreaming, setIsStreaming] = useState(false);
    const [objectCount, setObjectCount] = useState([]);
    const [annotations, setAnnotations] = useState({});
    const { isCameraEnabled, setIsCameraEnabled, inFlight, switchSource, setSwitchSource, rtspLinks, fps, enableAnnotations } = useContext(SettingsContext);
    const { setCameraData } = useContext(DataContext)
    // http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000

    useEffect(() => {
        let cleanup;

        const initializeSocket = async () => {
            if (!isCameraEnabled) {
                console.log(import.meta.env.VITE_WEBSOCKET_URL);
                socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_RTSP_URL);
                let lastDrawTime = 0;

                socket.current.onopen = () => {
                    setSwitchSource(false);
                    console.log("Socket connected to RTSP stream");
                };

                socket.current.onclose = () => {
                    Object.values(canvasOutputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    Object.values(canvasInputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    setSwitchSource(false);
                }

                socket.current.onmessage = (event) => {
                    const now = Date.now();
                    // if (now - lastDrawTime < 1000 / fps) {
                    //     console.log("ignoring", now - lastDrawTime)
                    //     return;
                    // }

                    console.log("success")
                    lastDrawTime = now;

                    inFlight.current = false;
                    const message = JSON.parse(event.data);
                    console.log("RTSP message received:", message);

                    const image = new Image();
                    image.src = `data:image/jpeg;base64,${message.image}`;

                    image.onload = () => {
                        const index = message.index;
                        const outputCanvas = canvasOutputRef.current[index];
                        const ctx = outputCanvas?.getContext('2d');

                        if (!ctx || !outputCanvas) return;
                        const ratio = image.width / image.height;
                        const width = FRAME_HEIGHT * ratio;

                        outputCanvas.height = FRAME_HEIGHT;
                        outputCanvas.width = width;

                        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                        ctx.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height);
                        
                        // if (enableAnnotations) {
                            message.annotations.forEach(({ x1, y1, x2, y2, label, confidence }) => {
                                ctx.strokeStyle = 'red';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                                ctx.fillStyle = 'green';
                                ctx.font = '12px Arial';
                                ctx.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                            });
                        // }
                    };

                    setObjectCount(prev => {
                        const copy = [...prev];
                        copy[message.index] = message.count;
                        return copy;
                    });

                    setAnnotations(prev => {
                        const copy = { ...prev };
                        copy[message.index] = message.annotations;
                        return copy;
                    });

                    onDataUpdate(message);
                };

                await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (socket.current?.readyState === WebSocket.OPEN) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });

                socket.current.send(JSON.stringify({ 
                    action: 'BEGIN_STREAM',
                    stream_url: `${JSON.stringify(rtspLinks)}`,
                    fps: fps
                }));
                setIsStreaming(true);

                cleanup = () => {
                    console.log("Cleaning up rtsp socket connection...");
                    setSwitchSource(true);
                    socket.current?.close();
                };
            } else {
                socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);

                socket.current.onopen = () => {
                    Object.values(canvasOutputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    Object.values(canvasInputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    setSwitchSource(false);
                    setIsStreaming(true);
                };

                socket.current.onclose = () => {
                    Object.values(canvasOutputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    Object.values(canvasInputRef.current).forEach((canvas) => {
                        const ctx = canvas?.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    });

                    setSwitchSource(false);
                }

                socket.current.onmessage = (event) => {
                    inFlight.current = false;
                    const message = JSON.parse(event.data);
                    const image = new Image();
                    image.src = `data:image/jpeg;base64,${message.image}`;

                    image.onload = () => {
                        const outputCanvas = canvasOutputRef.current[0];
                        const ctx = outputCanvas?.getContext('2d');
                        const ratio = image.width / image.height;
                        const width = FRAME_HEIGHT * ratio;

                        outputCanvas.height = FRAME_HEIGHT;
                        outputCanvas.width = width;

                        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                        ctx.drawImage(image, 0, 0, outputCanvas.width, outputCanvas.height);

                        message.annotations.forEach(({ x1, y1, x2, y2, label, confidence }) => {
                            ctx.strokeStyle = 'red';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                            ctx.fillStyle = 'green';
                            ctx.font = '12px Arial';
                            ctx.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                        });
                    };

                    setObjectCount([message.count]);
                    setAnnotations([message.annotations]);
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
        
        setCameraData({})
        initializeSocket();

        return () => {
            if (cleanup) cleanup();
        };
    }, [isCameraEnabled, rtspLinks]);

    const emitFrameToServer = useCallback(() => {
        if (inFlight.current) return;
        const video = videoRef.current;
        if (video && video.srcObject) {
            inFlight.current = true;
            const stream = video.srcObject;
            const videoTrack = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(videoTrack);

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

    useEffect(() => {
        if (!isCameraEnabled) {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
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
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
        };
    }, [isCameraEnabled]);

    const imageToBlob = (image) => {
        return new Promise((resolve) => {
            const inputCanvas = canvasInputRef.current[0];
            const contextCvsInp = inputCanvas.getContext('2d');

            inputCanvas.height = image.height;
            inputCanvas.width = image.width;

            contextCvsInp.clearRect(0, 0, image.width, image.height);
            contextCvsInp.drawImage(image, 0, 0, image.width, image.height);

            contextCvsInp.canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.99);
        });
    };

    useEffect(() => {
        console.log("aaaa")
        if (!isCameraEnabled) return;
        console.log("bbbb")
        const interval = setInterval(emitFrameToServer, 1000 / fps);
        return () => clearInterval(interval);
    }, [emitFrameToServer, isCameraEnabled, fps]);

    return (
        <section className='camera grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md flex-1'>
            {!isCameraEnabled && (
                rtspLinks.map((rtspLink, index) => (
                    <div key={index} id={rtspLink}
                        className={`flex flex-col items-center bg-white p-4 rounded shadow ${
                        rtspLinks.length % 2 === 1 && index === rtspLinks.length - 1 ? 'col-span-full justify-center' : ''
                    }`}>
                        <div>
                            {isStreaming && !switchSource ? (
                                <>
                                    {isCameraEnabled ? (
                                        <h1 className='text-center text-green-500'>Camera is streaming</h1>
                                    ) : (
                                        <h1 className='text-center text-blue-500'>Live/Recorded streaming</h1>
                                    )}
                                    <h1 className='text-center text-red-500'>FPS set: {fps}</h1>
                                    <h2 className='text-center'>Detected Objects: {objectCount[index]}</h2>
                                </>
                            ) : (
                                <h1 className='text-center text-red-500'>Camera is not streaming</h1>
                            )}
                        </div>

                        {isCameraEnabled && !switchSource && (
                            <div className='my-4 flex flex-col items-center hidden'>
                                <h3>Camera</h3>
                                <video ref={videoRef} id='video' autoPlay className='rounded w-full' />
                            </div>
                        )}

                        {!switchSource && (
                            <div className='my-4 flex flex-col items-center hidden'>
                                <h3>Input Frame</h3>
                                <canvas ref={(el) => canvasInputRef.current[index] = el} id='inputCanvas' className='rounded w-full'></canvas>
                            </div>
                        )}

                        {!switchSource && (
                            <div className='my-4 flex flex-col items-center'>
                                <h3>Output Frame</h3>
                                <canvas ref={(el) => canvasOutputRef.current[index] = el} id='outputCanvas' className='rounded w-full'></canvas>
                            </div>
                        )}
                    </div>
                ))
            )}

            {isCameraEnabled && (
                <div 
                    key={0} 
                    id={"webcam"}
                    className={`flex flex-col items-center bg-white p-4 rounded shadow col-span-full justify-center`}
                >
                    <div>
                        {isStreaming && !switchSource ? (
                            <>
                                {isCameraEnabled ? (
                                    <h1 className='text-center text-green-500'>Camera is streaming</h1>
                                ) : (
                                    <h1 className='text-center text-blue-500'>Live/Recorded streaming</h1>
                                )}
                                <h1 className='text-center text-red-500'>FPS set: {fps}</h1>
                                <h2 className='text-center'>Detected Objects: {objectCount[0]}</h2>
                            </>
                        ) : (
                            <h1 className='text-center text-red-500'>Camera is not streaming</h1>
                        )}
                    </div>

                    {isCameraEnabled && !switchSource && (
                        <div className='my-4 flex flex-col items-center hidden'>
                            <h3>Camera</h3>
                            <video ref={videoRef} id='video' autoPlay className='rounded w-full' />
                        </div>
                    )}

                    {!switchSource && (
                        <div className='my-4 flex flex-col items-center hidden'>
                            <h3>Input Frame</h3>
                            <canvas ref={(el) => canvasInputRef.current[0] = el} id='inputCanvas' className='rounded w-full'></canvas>
                        </div>
                    )}

                    {!switchSource && (
                        <div className='my-4 flex flex-col items-center'>
                            <h3>Output Frame</h3>
                            <canvas ref={(el) => canvasOutputRef.current[0] = el} id='outputCanvas' className='rounded w-full'></canvas>
                        </div>
                    )}
                </div>            
            )}
        </section>
    );
}

export default Camera;
