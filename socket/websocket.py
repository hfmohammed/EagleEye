import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import os
import asyncio

load_dotenv()
print("Current working dir:", os.getcwd())


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()
model = YOLO("yolov8n.pt")

# Track active connections
active_connections = {}

def cleanup_connection(connection_id):
    """Helper function to clean up a connection"""
    if connection_id in active_connections:
        print(f"Cleaning up connection {connection_id}")
        del active_connections[connection_id]


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


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connection_id = id(ws)
    active_connections[connection_id] = {"type": "webcam", "ws": ws}
    frame_idx = 0
    frame_times = []

    try:
        while True:
            try:
                # Check if connection is still active
                if connection_id not in active_connections or active_connections[connection_id]["type"] != "webcam":
                    print("Webcam connection type changed or closed")
                    break

                # Check for termination message first
                try:
                    # Try to receive any pending text message (termination signal)
                    data = await ws.receive_text()
                    message = json.loads(data)
                    if "terminate" in message:
                        print("Received webcam termination request")
                        cleanup_connection(connection_id)
                        print("Webcam connection terminated")
                        break
                except:
                    # If no text message, proceed with binary frame data
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
                _, buf = cv2.imencode(
                    ".jpeg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
                jpeg_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

                # calculate FPS dynamically over the last 1 minute
                current_time = time.time()
                frame_times.append(current_time)

                # Remove frame times older than 1 minute
                frame_times = [
                    t for t in frame_times if current_time - t <= 60]

                # Determine the time window to use
                elapsed_time = current_time - \
                    frame_times[0] if frame_times else 0

                if elapsed_time >= 60:
                    fps = len(frame_times) / 60
                elif elapsed_time >= 10:
                    recent_times = [
                        t for t in frame_times if current_time - t <= 5]
                    elapsed_recent = current_time - \
                        recent_times[0] if len(recent_times) > 1 else 0
                    fps = len(recent_times) / \
                        elapsed_recent if elapsed_recent > 0 else None
                elif elapsed_time >= 3:
                    recent_times = [
                        t for t in frame_times if current_time - t <= 3]
                    elapsed_recent = current_time - \
                        recent_times[0] if len(recent_times) > 1 else 0
                    fps = len(recent_times) / \
                        elapsed_recent if elapsed_recent > 0 else None

                else:
                    fps = None

                # send data to the client
                timestamp = time.strftime(
                    "%Y-%m-%d %H:%M:%S", time.localtime(current_time))
                await ws.send_text(json.dumps({
                    "image": jpeg_b64,
                    "count": count,
                    "annotations": annotations,
                    "category_counts": category_counts,
                    "timestamp": timestamp,
                    "fps": fps
                }))

                updateDatabase(category_counts, count, fps, timestamp)

            except Exception as e:
                print(f"Error in webcam processing: {str(e)}")
                break

    except WebSocketDisconnect:
        print("Webcam client disconnected")
    finally:
        cleanup_connection(connection_id)


@app.websocket("/rtsp")
async def rtsp_websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("RTSP WebSocket connection established")
    connection_id = id(ws)
    active_connections[connection_id] = {"type": "rtsp", "ws": ws}
    cap = None

    try:
        while True:
            try:
                # Check if connection is still active
                if connection_id not in active_connections or active_connections[connection_id]["type"] != "rtsp":
                    print("RTSP connection type changed or closed")
                    if cap is not None:
                        cap.release()
                        cap = None
                    break

                # wait for message
                data = await ws.receive_text()
                message = json.loads(data)

                # Handle termination immediately
                if "terminate" in message:
                    print("Received RTSP termination request")
                    if cap is not None:
                        cap.release()
                        cap = None
                    cleanup_connection(connection_id)
                    print("RTSP connection terminated")
                    break

                rtsp_link = message.get("rtspLink")
                print("Received RTSP link:", rtsp_link)

                if not rtsp_link:
                    await ws.send_text(json.dumps({"error": "No RTSP link provided"}))
                    continue

                # Close previous capture if exists
                if cap is not None:
                    cap.release()

                # Create new capture
                cap = cv2.VideoCapture(rtsp_link)

                if not cap.isOpened():
                    error_msg = "Failed to open RTSP stream. Please check the URL and try again."
                    print(error_msg)
                    await ws.send_text(json.dumps({"error": error_msg}))
                    continue

                print("Successfully connected to RTSP stream")
                frame_times = []

                while cap.isOpened():
                    # Check connection status inside the streaming loop
                    if connection_id not in active_connections or active_connections[connection_id]["type"] != "rtsp":
                        print("Connection type changed during streaming")
                        break

                    ret, frame = cap.read()
                    if not ret:
                        error_msg = "Failed to read frame from stream. Reconnecting..."
                        print(error_msg)
                        await ws.send_text(json.dumps({"error": error_msg}))
                        break

                    # Process frame with YOLO
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

                            category_counts[label] = category_counts.get(
                                label, 0) + 1
                            cv2.rectangle(frame, (x1, y1),
                                          (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1-10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

                        # Calculate FPS
                        current_time = time.time()
                        frame_times.append(current_time)
                        frame_times = [
                            t for t in frame_times if current_time - t <= 60]

                        fps = len(frame_times) / (current_time -
                                                  frame_times[0]) if len(frame_times) > 1 else None

                        # Encode and send frame
                        _, buf = cv2.imencode(
                            ".jpeg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                        if buf is None:
                            continue

                        jpeg_b64 = base64.b64encode(
                            buf.tobytes()).decode("utf-8")
                        timestamp = time.strftime(
                            "%Y-%m-%d %H:%M:%S", time.localtime(current_time))

                        await ws.send_text(json.dumps({
                            "image": jpeg_b64,
                            "count": count,
                            "annotations": annotations,
                            "category_counts": category_counts,
                            "timestamp": timestamp,
                            "fps": fps
                        }))

                        # Update database
                        updateDatabase(category_counts, count, fps, timestamp)

                    except Exception as e:
                        print(f"Error processing frame: {str(e)}")
                        continue

            except json.JSONDecodeError:
                await ws.send_text(json.dumps({"error": "Invalid JSON format"}))
                continue
            except Exception as e:
                print(f"Error in RTSP stream: {str(e)}")
                await ws.send_text(json.dumps({"error": str(e)}))
                continue

    except WebSocketDisconnect:
        print("RTSP client disconnected")
    finally:
        cleanup_connection(connection_id)
        if cap is not None:
            cap.release()
