import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO

app = FastAPI()
model = YOLO("yolov8n.pt")

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    frame_idx = 0

    try:
        while True:
            # wait for image data
            data = await ws.receive_bytes()
            frame_idx += 1

            # prepare image
            img = Image.open(io.BytesIO(data)).convert("RGB")
            img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            img = cv2.flip(img, 1)

            # run YOLO
            results = model(img, conf=0.5)
            boxes = results[0].boxes

            # handle data
            count = len(boxes)
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls]

                cv2.rectangle(img, (x1, y1), (x2, y2), (0,0,255), 2)
                cv2.putText(img, f"{label} {conf:.2f}", (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)

            # encode annotated image
            _, buf = cv2.imencode(".jpeg", img)
            jpeg_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

            # send data to the client
            await ws.send_text(json.dumps({
                "image": jpeg_b64,
                "count": count
            }))

    except WebSocketDisconnect:
        print("Client disconnected")
