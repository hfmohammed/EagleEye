import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Camera = ({ onDataUpdate }) => {
    const videoRef = useRef(null);
    const canvasOutputRef = useRef(null);
    const socket = useRef(null);
    const inFlight = useRef(false);
    const canvasInputRef = useRef(null);
    const FRAME_HEIGHT = 200;

    const [isStreaming, setIsStreaming] = useState(false);
    const [objectCount, setObjectCount] = useState(0);
    const [annotations, setAnnotations] = useState([]);
    const [error, setError] = useState(null);

    const { fps, rtspLink, inputSource } = useContext(AppContext);
    const reconnectTimeout = useRef(null);
    const previousInputSource = useRef(inputSource);
    const frameInterval = useRef(null);
    const isCleaningUp = useRef(false);

    // Handle source switching
    useEffect(() => {
        const handleSourceChange = async () => {
            console.log(`Switching from ${previousInputSource.current} to ${inputSource}`);
            
            // Set cleanup flag to prevent race conditions
            isCleaningUp.current = true;
            
            // Force terminate any existing connections
            const cleanupExistingConnection = async () => {
                // Clear any existing timeouts
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }

                // Clear frame emission interval
                if (frameInterval.current) {
                    clearInterval(frameInterval.current);
                    frameInterval.current = null;
                }

                if (socket.current) {
                    try {
                        // Send termination signal if socket is still open
                        if (socket.current.readyState === WebSocket.OPEN) {
                            console.log(`Sending termination signal for ${previousInputSource.current}`);
                            socket.current.send(JSON.stringify({ terminate: true }));
                            
                            // Wait a bit for the server to process the termination
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }

                        // Force close the socket
                        socket.current.close();
                        
                        // Wait for socket to fully close
                        await new Promise(resolve => {
                            const maxWait = 2000; // Maximum 2 seconds
                            const startTime = Date.now();
                            const checkClosed = setInterval(() => {
                                if (socket.current.readyState === WebSocket.CLOSED || 
                                    Date.now() - startTime > maxWait) {
                                    clearInterval(checkClosed);
                                    resolve();
                                }
                            }, 50);
                        });
                    } catch (error) {
                        console.error("Error during socket cleanup:", error);
                    } finally {
                        socket.current = null;
                    }
                }

                // Clean up video stream if exists
                if (videoRef.current?.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
            };

            // Clean up existing connection
            await cleanupExistingConnection();

            // Reset states
            setError(null);
            setIsStreaming(false);
            setObjectCount(0);
            setAnnotations([]);
            
            // Additional delay to ensure complete cleanup
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Clear cleanup flag
            isCleaningUp.current = false;
            
            // Initialize new connection only if we're not cleaning up
            if (!isCleaningUp.current) {
                await connectWebSocket();
            }
            
            previousInputSource.current = inputSource;
        };

        // Only handle source change if it actually changed
        if (previousInputSource.current !== inputSource) {
            handleSourceChange();
        }
    }, [inputSource]);

    const connectWebSocket = async () => {
        // Don't connect if we're in the middle of cleanup
        if (isCleaningUp.current) {
            console.log("Skipping connection - cleanup in progress");
            return;
        }

        // Ensure no existing connection
        if (socket.current) {
            console.warn("Existing socket found during connect, cleaning up first");
            socket.current.close();
            socket.current = null;
        }

        try {
            const wsUrl = inputSource === "rtsp" 
                ? import.meta.env.VITE_RTSP_WEBSOCKET_URL 
                : import.meta.env.VITE_WEBSOCKET_URL;

            console.log(`Connecting to WebSocket at ${wsUrl} for ${inputSource}`);
            socket.current = new WebSocket(wsUrl);

            socket.current.onopen = async () => {
                // Double check we're not cleaning up
                if (isCleaningUp.current) {
                    console.log("Connection opened but cleanup in progress, closing");
                    socket.current.close();
                    return;
                }

                console.log(`WebSocket connected for ${inputSource}`);
                setIsStreaming(true);
                setError(null);

                if (inputSource === "rtsp" && rtspLink) {
                    const message = JSON.stringify({ rtspLink });
                    console.log("Sending RTSP link:", message);
                    socket.current.send(message);
                } else if (inputSource === "webcam") {
                    await initializeWebcam();
                }
            };

            socket.current.onclose = (event) => {
                console.log(`WebSocket closed for ${inputSource}:`, event.code);
                setIsStreaming(false);
                
                // Only reconnect if this is still the current input source and we're not cleaning up
                if (previousInputSource.current === inputSource && !isCleaningUp.current) {
                    console.log("Scheduling reconnection in 5 seconds");
                    reconnectTimeout.current = setTimeout(() => {
                        if (!isCleaningUp.current) {
                            connectWebSocket();
                        }
                    }, 5000);
                }
            };

            socket.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                setError("Connection error occurred");
            };

            socket.current.onmessage = handleWebSocketMessage;

        } catch (error) {
            console.error("Connection error:", error);
            setError("Failed to connect to server");
        }
    };

    const handleWebSocketMessage = (event) => {
        // Don't process messages if we're cleaning up
        if (isCleaningUp.current) {
            return;
        }

        try {
            const message = JSON.parse(event.data);
            
            if (message.error) {
                console.error("Server error:", message.error);
                setError(message.error);
                return;
            }

            inFlight.current = false;

            const image = new Image();
            image.src = `data:image/jpeg;base64,${message.image}`;

            image.onload = () => {
                if (!canvasOutputRef.current || isCleaningUp.current) return;
                
                const contextCvsOtp = canvasOutputRef.current.getContext('2d');
                const outputRatio = image.width / image.height;
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

                    contextCvsOtp.fillStyle = 'red';
                    contextCvsOtp.font = '12px Arial';
                    contextCvsOtp.fillText(`${label} (${confidence.toFixed(2)})`, x1, y1 - 5);
                });
            };

            setObjectCount(message.count);
            setAnnotations(message.annotations);
            onDataUpdate(message);
        } catch (error) {
            console.error("Error processing message:", error);
            setError("Error processing video frame");
        }
    };

    const initializeWebcam = async () => {
        try {
            console.log("Requesting webcam access");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            if (videoRef.current && !isCleaningUp.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                console.log("Webcam initialized successfully");
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setError("Failed to access webcam. Please grant camera permissions.");
            return false;
        }
    };

    const imageToBlob = (imageBitmap) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageBitmap, 0, 0);
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
    };

    const emitFrameToServer = useCallback(() => {
        if (inputSource !== "webcam" || 
            !socket.current || 
            socket.current.readyState !== WebSocket.OPEN ||
            isCleaningUp.current) {
            return;
        }

        if (inFlight.current) return;

        const video = videoRef.current;
        if (video?.srcObject) {
            const stream = video.srcObject;
            const videoTrack = stream.getVideoTracks()[0];
            
            if (videoTrack) {
                const imageCapture = new ImageCapture(videoTrack);
                imageCapture.grabFrame()
                    .then((imageBitmap) => {
                        imageToBlob(imageBitmap).then((blob) => {
                            if (socket.current?.readyState === WebSocket.OPEN && !isCleaningUp.current) {
                                inFlight.current = true;
                                socket.current.send(blob);
                            }
                        });
                    })
                    .catch((error) => {
                        console.error("Error capturing frame:", error);
                    });
            }
        }
    }, [inputSource]);

    // Emit frames at specified FPS for webcam
    useEffect(() => {
        // Clear any existing interval
        if (frameInterval.current) {
            clearInterval(frameInterval.current);
            frameInterval.current = null;
        }

        if (inputSource === "webcam" && videoRef.current?.srcObject && !isCleaningUp.current) {
            frameInterval.current = setInterval(emitFrameToServer, 1000 / (fps || 2));
        }

        return () => {
            if (frameInterval.current) {
                clearInterval(frameInterval.current);
                frameInterval.current = null;
            }
        };
    }, [emitFrameToServer, inputSource, fps]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isCleaningUp.current = true;
            
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            
            if (frameInterval.current) {
                clearInterval(frameInterval.current);
            }
            
            if (socket.current) {
                if (socket.current.readyState === WebSocket.OPEN) {
                    socket.current.send(JSON.stringify({ terminate: true }));
                }
                socket.current.close();
            }
            
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <>
            <section className="camera flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-md flex-1">
                <div>
                    {error ? (
                        <h1 className="text-center text-red-500">{error}</h1>
                    ) : isStreaming ? (
                        <h1 className="text-center text-green-500">Camera is streaming</h1>
                    ) : (
                        <h1 className="text-center text-yellow-500">Connecting to stream...</h1>
                    )}
                    <h1 className="text-center text-gray-700">FPS set: {fps || 2}</h1>
                    <h2 className="text-center">Detected Objects: {objectCount}</h2>
                </div>

                <video
                    ref={ videoRef }
                    id="video"
                    autoPlay
                    height={ 200 }
                    width={ 500 }
                    style={{ display: 'none' }}
                    />

                <canvas ref={canvasInputRef} id="inputCanvas" style={{ display: 'none' }}></canvas>
                <canvas ref={canvasOutputRef} id="outputCanvas" className="rounded w-full"></canvas>
            </section>
        </>
    );
}

export default Camera;
