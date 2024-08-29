from pytube import YouTube
from flask import Flask # type: ignore
from flask_socketio import SocketIO, emit # type: ignore
from ultralytics import YOLO
import cv2 as cv
import base64
import sqlite3
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

CONN = connect_db()
CURSOR = CONN.cursor()

def insert_data(frame_number, current_data, uqCategories):
    print('Inserting into Supabase...', frame_number, current_data, uqCategories)
    data = {
        "frame_number": frame_number,
        "timestamp": datetime.now().isoformat(),
        "current_data": str(current_data),
        "uqCategories": str(uqCategories)
    }
    response = supabase.table("videoData").insert(data).execute()
    print("Insert response:", response)


def processData(x: dict):
    uqCategories = set()
    for i in x.values():
        ik = i.keys()
        for j in ik:
            if j != 'Time':
                uqCategories.add(j)

    return ['Frame', 'Time'] + list(uqCategories)

def yolo_annotate(frame):
    results = MODEL(frame)
    return results

def erase_old_data():
    print("Erasing old data...")
    response = supabase.table("videoData").delete().neq("frame_number", 0).execute()
    print("Erase response:", response)

def capture_camera(source):
    erase_old_data()
    socketio.sleep(5)

    print("_____DEBUG 2: called capture_camera_____")

    if source == 'test':
        print("Displaying red frames for testing.")
        while True:
            # Create a red frame
            red_frame = np.zeros((480, 640, 3), dtype=np.uint8)  # Adjust size as needed
            red_frame[:, :, 2] = 255  # Set the red channel to maximum

            # Convert the frame to base64
            _, buffer = cv.imencode('.jpg', red_frame)
            frame_data = base64.b64encode(buffer).decode('utf-8')
            print("_____DEBUG 7: Red frame is converted to binary_____")

            # Emit the frame data to the frontend
            uqCategories = processData(DATA)
            socketio.emit('video_frame', {
                'frame': frame_data,
                'current_data': {},
                'data': DATA,
                'uqCategories': uqCategories,
            })

            socketio.sleep(1)  # Adjust sleep time as needed

    elif "youtube.com" in source or "youtu.be" in source:
        print(f"Downloading video from YouTube: {source}")
        yt = YouTube(source)
        stream = yt.streams.get_highest_resolution()

        video_path = stream.download()
        print(f"Video downloaded to: {video_path}")
        cap = cv.VideoCapture(video_path)

    else:
        if source == "0":
            source = 0
        cap = cv.VideoCapture(source)

    if not cap.isOpened():
        print("_____DEBUG 3: Error: Unable to open video source._____")
        return

    print("_____DEBUG 4: Cap is opened!_____")
    stime = datetime.now()
    frameCount = 1
    while cap.isOpened():
        if frameCount >= 500:
            del DATA[frameCount - 500]

        if source == 0:
            DATA[frameCount] = {
                'Time': str(datetime.now().strftime("%H:%M:%S")),
            }

        else:
            DATA[frameCount] = {
                'Time': str(datetime.now() - stime).split('.')[0],
            }

        ret, frame = cap.read()
        if not ret:
            print("_____DEBUG 5: Failed to grab frame or end of video reached._____")
            break

        # Apply red filter if not in 'test' mode
        if source != 'test':
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

            print("_____DEBUG 6: for loop ended____")
            _, buffer = cv.imencode('.jpg', frame)
            frame_data = base64.b64encode(buffer).decode('utf-8')
            print("_____DEBUG 7: frame is converted to binary_____")

            # Emit the frame data and annotated results to the frontend
            uqCategories = processData(DATA)

            socketio.emit('video_frame', {
                'frame': frame_data,
                'current_data': DATA[frameCount],
                'data': DATA,
                'uqCategories': uqCategories,
            })

            insert_data(frameCount, DATA[frameCount], uqCategories)

        frameCount += 1

    CURSOR.close()
    CONN.close()
    cap.release()

@app.route('/')
def index():
    return "Server is running"


@app.route('/start-server', methods=['POST'])
def start_server():
    source = "../resources/cars.mp4"
    source = "https://www.youtube.com/watch?v=uws-tnl95hc&pp=ygURY2FyIHJhY2luZyAyIG1pbnM%3D"
    source = "test"
    # source = "0"
    print(f"______DEBUG 1: source: {source}______")
    socketio.start_background_task(capture_camera, source)
    return "Server started", 200

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
