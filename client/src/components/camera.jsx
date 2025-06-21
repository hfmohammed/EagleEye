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
    const { isCameraEnabled, setIsCameraEnabled, toggleCamera, inFlight } = useContext(SettingsContext);
    

    // Initialize websocket connection
    useEffect(() => {
        if (!isCameraEnabled) return;

        console.log(import.meta.env.VITE_WEBSOCKET_URL);
        socket.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);

        socket.current.onopen = () => {
            console.log("Socket connected");
            setIsStreaming(true);
        }

        socket.current.onmessage = (event) => {
            inFlight.current = false; // reset inflight flag

            // convert incoming message to image and display it
            const message = JSON.parse(event.data);
            const image = new Image();
            image.src = `data:image/jpeg;base64,${message.image}`;

            image.onload = () => {
                const contextCvsOtp = canvasOutputRef.current.getContext('2d');
                const outputRatio = image.width / image.height
                const outputFrameWidth = FRAME_HEIGHT * outputRatio;

                canvasOutputRef.current.height = FRAME_HEIGHT;
                canvasOutputRef.current.width = outputFrameWidth;

                contextCvsOtp.clearRect(0, 0, outputFrameWidth, FRAME_HEIGHT);
                contextCvsOtp.drawImage(image, 0, 0, outputFrameWidth, FRAME_HEIGHT);

                // Draw annotations
                message.annotations.forEach(annotation => {
                    const { x1, y1, x2, y2, label, confidence } = annotation;
                    contextCvsOtp.strokeStyle = 'red';
                    contextCvsOtp.lineWidth = 2;
                    contextCvsOtp.strokeRect(x1, y1, x2 - x1, y2 - y1);

                    contextCvsOtp.fillStyle = 'green';
                    contextCvsOtp.font = '12px Arial';
                    contextCvsOtp.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                });
            }

            setObjectCount(message.count);
            setAnnotations(message.annotations);

            // Pass data to the parent component
            onDataUpdate(message);
        };

        return () => {
            if (socket.current) {
                socket.current.close();
                setIsStreaming(false);
            }
        };
    }, [isCameraEnabled]);

    const emitFrameToServer = useCallback(() => {
        console.log("Attempting to emit frame to server...");
        console.log("In-flight status:", inFlight.current);
        if (inFlight.current) return;   // skip if inflight flag is true
        console.log("Emitting frame to server...");

        const video = videoRef.current;
        if (video && video.srcObject) {
            const stream = video.srcObject;

            const videoTrack = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(videoTrack);
            
            // capture the frame and send it to the server
            imageCapture.grabFrame()
                .then((imageBitmap) => {
                    imageToBlob(imageBitmap).then((blob) => {
                        if (socket.current.readyState === WebSocket.OPEN) {
                            inFlight.current = true;    // inflight flag set to true
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
        }

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

        return () => {
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

        const interval = setInterval(emitFrameToServer, 1000 / Number(import.meta.env.VITE_FPS) || 2);

        return () => clearInterval(interval);
    }, [emitFrameToServer, isCameraEnabled]);

    const _toggleCamera = () => {
        toggleCamera();
        inFlight.current = false;
    };

    return (
        <>
            <section className='camera flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md flex-1'>
                <div>
                    <button
                        onClick={_toggleCamera}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            isCameraEnabled
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                    >
                        {isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                    </button>
                    
                    {isStreaming ? (
                        <h1 className='text-center text-green-500'>Camera is streaming</h1>
                    ) : (
                        <h1 className='text-center text-red-500'>Camera is not streaming</h1>
                    )}
                    <h1 className='text-center text-red-500'>FPS set: {Number(import.meta.env.VITE_FPS) || 2}</h1>
                    <h2 className='text-center'>Detected Objects: {objectCount}</h2>
                </div>
                
                {isCameraEnabled && (
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

                
                {isCameraEnabled && (
                    <div className='my-4 flex flex-col items-center hidden'>
                        <h3>Input Frame</h3>
                        <canvas 
                            ref={canvasInputRef} 
                            id='inputCanvas'
                            className='rounded w-full'
                            ></canvas>
                    </div>
                )}

                {isCameraEnabled && (
                    <div className='my-4 flex flex-col items-center'>
                        <h3>Output Frame</h3>
                        <canvas
                            ref={canvasOutputRef} 
                            id='outputCanvas'
                            class='rounded w-full'
                            ></canvas>
                    </div>
                )}
            </section>
        </>
    );
}

export default Camera;
