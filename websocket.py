import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO
import time

app = FastAPI()
model = YOLO("yolov8n.pt")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    frame_idx = 0
    frame_times = []

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
            results = model(img, conf=0.2)
            boxes = results[0].boxes

            # handle data
            count = len(boxes)
            annotations = []
            category_counts = {}
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls]

                annotations.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "label": label, "confidence": conf
                })

                category_counts[label] = category_counts.get(label, 0) + 1

                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(img, f"{label} {conf:.2f}", (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            # encode annotated image without resizing
            _, buf = cv2.imencode(".jpeg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            jpeg_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

            # calculate FPS dynamically over the last 1 minute
            current_time = time.time()
            frame_times.append(current_time)

            # Remove frame times older than 1 minute
            frame_times = [t for t in frame_times if current_time - t <= 60]
            
            # Determine the time window to use
            elapsed_time = current_time - frame_times[0] if frame_times else 0

            if elapsed_time >= 60:
                fps = len(frame_times) / 60
            elif elapsed_time >= 5:
                recent_times = [t for t in frame_times if current_time - t <= 5]
                elapsed_recent = current_time - recent_times[0] if len(recent_times) > 1 else 0
                fps = len(recent_times) / elapsed_recent if elapsed_recent > 0 else None
            else:
                fps = None

            # send data to the client
            await ws.send_text(json.dumps({
                "image": jpeg_b64,
                "count": count,
                "annotations": annotations,
                "category_counts": category_counts,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(current_time)),
                "fps": fps
            }))

    except WebSocketDisconnect:
        print("Client disconnected")
