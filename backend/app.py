from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2 as cv
import base64
import sqlite3
import numpy as np
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
print(SUPABASE_PROJECT_URL, SUPABASE_KEY)

supabase: Client = create_client(SUPABASE_PROJECT_URL, SUPABASE_KEY)

DB_PATH = "video_data.db"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# Initialize YOLO model
MODEL = YOLO("yolov8n")
DATA = {}

def connect_db():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def create_table():
    with connect_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS videoData;")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS videoData (
                frame_number INTEGER PRIMARY KEY NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                current_data TEXT NOT NULL,
                uqCategories TEXT NOT NULL
            );
        """)
        conn.commit()

def insert_data(frame_number, current_data, uqCategories):
    try:
        print('Inserting into Supabase...', frame_number, current_data, uqCategories)
        data = {
            "frame_number": frame_number,
            "timestamp": datetime.now().isoformat(),
            "current_data": str(current_data),
            "uqCategories": str(uqCategories)
        }
        response = supabase.table("videoData").insert(data).execute()
        print("Insert response:", response)
    except Exception as e:
        print(f"Error inserting data: {e}")

def process_frame(frame_data):
    # Decode the incoming base64 frame
    frame = base64.b64decode(frame_data)
    np_arr = np.frombuffer(frame, np.uint8)
    frame = cv.imdecode(np_arr, cv.IMREAD_COLOR)

    # Process the frame with YOLO
    results = MODEL(frame)

    # Draw the bounding boxes and labels on the frame
    for result in results[0].boxes:
        classId = int(result.cls)
        className = MODEL.names[classId]
        x1, y1, x2, y2 = map(int, result.xyxy[0])
        conf = result.conf[0]
        cv.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv.putText(frame, f'{className} {conf:.2f}', (x1, y1 - 10), cv.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)

    # Encode the frame back to base64
    _, buffer = cv.imencode('.jpg', frame)
    processed_frame_data = base64.b64encode(buffer).decode('utf-8')
    return processed_frame_data

@socketio.on('upload_frame')
def handle_upload_frame(data):
    try:
        frame_data = data.get('frame')
        if frame_data:
            processed_frame_data = process_frame(frame_data)
            emit('processed_frame', {'frame': processed_frame_data})
    except Exception as e:
        print(f"Error processing frame: {e}")

def erase_old_data():
    try:
        print("Erasing old data...")
        response = supabase.table("videoData").delete().neq("frame_number", 0).execute()
        print("Erase response:", response)
    except Exception as e:
        print(f"Error erasing data: {e}")

def capture_camera(source):
    erase_old_data()
    socketio.sleep(5)

    if source == "0":
        source = 0

    cap = cv.VideoCapture(source)
    if not cap.isOpened():
        print("Error: Unable to open video source.")
        return
    
    stime = datetime.now()
    frameCount = 1
    while cap.isOpened():
        if frameCount >= 500:
            del DATA[frameCount - 500]

        DATA[frameCount] = {
            'Time': str(datetime.now() - stime).split('.')[0],
        }

        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame or end of video reached.")
            break

        results = MODEL(frame)
        for result in results[0].boxes:
            classId = int(result.cls)
            className = MODEL.names[classId]
            if className not in DATA[frameCount]:
                DATA[frameCount][className] = 0
            DATA[frameCount][className] += 1
            x1, y1, x2, y2 = map(int, result.xyxy[0])
            conf = result.conf[0]
            cv.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv.putText(frame, f'{className} {conf:.2f}', (x1, y1 - 10), cv.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)

        _, buffer = cv.imencode('.jpg', frame)
        frame_data = base64.b64encode(buffer).decode('utf-8')

        uqCategories = processData(DATA)
        socketio.emit('video_frame', {
            'frame': frame_data,
            'current_data': DATA[frameCount],
            'data': DATA,
            'uqCategories': uqCategories,
        })

        insert_data(frameCount, DATA[frameCount], uqCategories)
        frameCount += 1

    cap.release()

@app.route('/')
def index():
    return "Server is running"

@app.route('/start-server', methods=['POST'])
def start_server():
    source = "0"  # Change to video file path if needed
    print(f"Starting camera capture with source: {source}")
    socketio.start_background_task(capture_camera, source)
    return "Server started", 200

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
