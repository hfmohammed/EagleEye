import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO
import time
import sys
import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv


app = FastAPI()
model = YOLO("yolov8n.pt")

load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


def updateDatabase(category_counts, total_item_count, fps, timestamp):
    print(category_counts, total_item_count, fps, timestamp)
    if fps is None:
        fps = 0

    data = {
        "time": timestamp,
        "objects": category_counts,
        "total_items": total_item_count,
        "fps": fps,
    }
    response = supabase.table("EagleEye_traffic_data").insert(data).execute()
    print("Database update response:", response)

# http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000

@app.websocket("/stream")
async def rtsp_websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("RTSP WebSocket connection established")

    streaming_task = None
    stream_active = False

    async def stream_frames(stream_url, index):
        nonlocal stream_active
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            await ws.send_text(json.dumps({"error": "Failed to open RTSP stream"}))
            return

        frame_times = []
        print("Streaming loop started")

        while stream_active:
            ret, frame = cap.read()
            if not ret:
                await ws.send_text(json.dumps({"error": "Failed to read frame"}))
                break

            # === Apply YOLO or your processing ===
            try:
                results = model(frame, conf=0.2)
                boxes = results[0].boxes
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

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

                current_time = time.time()
                frame_times.append(current_time)
                frame_times = [t for t in frame_times if current_time - t <= 60]
                fps = len(frame_times) / (current_time - frame_times[0]) if len(frame_times) > 1 else None

                _, buf = cv2.imencode(".jpeg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                if buf is None:
                    continue

                jpeg_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(current_time))

                await ws.send_text(json.dumps({
                    "image": jpeg_b64,
                    "count": count,
                    "annotations": annotations,
                    "category_counts": category_counts,
                    "timestamp": timestamp,
                    "fps": fps,
                    "index": index
                }))
                updateDatabase(category_counts, count, fps, timestamp)

                await asyncio.sleep(0.1)

            except Exception as e:
                await ws.send_text(json.dumps({"error": f"YOLO error: {str(e)}"}))
                break

        cap.release()
        print("Streaming loop ended")

    try:
        while True:
            data = await ws.receive_text()
            message = json.loads(data)
            print("Received message:", message)

            if message.get("action") == "BEGIN_STREAM":
                stream_url = json.loads(message.get("stream_url"))
                for rtsp_index in range(len(stream_url)):
                    print(stream_url)

                    if not stream_active:
                        stream_active = True
                        streaming_task = asyncio.create_task(stream_frames(stream_url[rtsp_index], rtsp_index))

            elif message.get("action") == "STOP_STREAM":
                if stream_active:
                    stream_active = False
                    if streaming_task:
                        await streaming_task  # wait for task to finish
                        streaming_task = None

    except WebSocketDisconnect:
        print("RTSP WebSocket disconnected")
        stream_active = False
        if streaming_task:
            await streaming_task



@app.websocket("/webcam")
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
            results = model(img, conf=0.2, iou=0.1)
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
            elif elapsed_time >= 10:
                recent_times = [t for t in frame_times if current_time - t <= 5]
                elapsed_recent = current_time - recent_times[0] if len(recent_times) > 1 else 0
                fps = len(recent_times) / elapsed_recent if elapsed_recent > 0 else None
            elif elapsed_time >= 3:
                recent_times = [t for t in frame_times if current_time - t <= 3]
                elapsed_recent = current_time - recent_times[0] if len(recent_times) > 1 else 0
                fps = len(recent_times) / elapsed_recent if elapsed_recent > 0 else None

            else:
                fps = None

            # send data to the client
            print("-- webcam Frame sent to client --")
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(current_time))
            await ws.send_text(json.dumps({
                "image": jpeg_b64,
                "count": count,
                "annotations": annotations,
                "category_counts": category_counts,
                "timestamp": timestamp,
                "fps": fps
            }))
            updateDatabase(category_counts, count, fps, timestamp)

    except WebSocketDisconnect:
        print("Client disconnected")
