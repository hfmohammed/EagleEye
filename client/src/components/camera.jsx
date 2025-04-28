import React, { useState, useEffect, useRef, useCallback } from 'react';

const Camera = () => {
    const videoRef = useRef(null);
    const canvasOutputRef = useRef(null);
    const socket = useRef(null);
    const inFlight = useRef(false);
    const canvasInputRef = useRef(null);
    const FRAME_HEIGHT = 200;

    const [isStreaming, setIsStreaming] = useState(false);
    const [objectCount, setObjectCount] = useState(0);

    // Initialize websocket connection
    useEffect(() => {
        console.log(process.env.REACT_APP_WEBSOCKET_URL);
        socket.current = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

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
            }

            setObjectCount(message.count);
        };

        return () => {
            if (socket.current) socket.current.close();
        };
    }, []);

    const emitFrameToServer = useCallback(() => {
        if (inFlight.current) return;   // skip if inflight flag is true

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
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((error) => {
                console.error("Error accessing media devices.", error);
            });
    }, []);    

    // convert image to blob
    const imageToBlob = (image) => {
        return new Promise((resolve) => {
            const contextCvsInp = canvasInputRef.current.getContext('2d');
            const inputRatio = image.width / image.height
            const inputFrameWidth = FRAME_HEIGHT * inputRatio;

            canvasInputRef.current.height = FRAME_HEIGHT;
            canvasInputRef.current.width = inputFrameWidth;

            contextCvsInp.clearRect(0, 0, inputFrameWidth, FRAME_HEIGHT);
            contextCvsInp.drawImage(image, 0, 0, inputFrameWidth, FRAME_HEIGHT);

            contextCvsInp.canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    // emit frames while attempting to main (skips frames if inflight) a constant FPS
    useEffect(() => {
        const interval = setInterval(emitFrameToServer, 1000 / Number(process.env.REACT_APP_FPS) || 2);
        return () => clearInterval(interval);
    }, [emitFrameToServer]);

    return (
        <>
            <section className="camera">
                
                {isStreaming ? <h1>Camera is streaming</h1> : <h1>Camera is not streaming</h1>}
                <h1>FPS: {Number(process.env.REACT_APP_FPS) || 2}</h1>
                <h2>Detected Objects: {objectCount}</h2>

                <video
                    ref={videoRef}
                    id="video"
                    autoPlay
                    height={200}
                    width={500}
                    style={{ display: 'none' }}
                    />

                <canvas ref={canvasInputRef} id="inputCanvas" style={{ display: 'none' }}></canvas>
                <canvas ref={canvasOutputRef} id="outputCanvas"></canvas>
            
            </section>
        </>
    );
}

export default Camera;
