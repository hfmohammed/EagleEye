from flask_cors import CORS
import numpy as np
from flask import Flask
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2 as cv
import base64
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
print(SUPABASE_PROJECT_URL, SUPABASE_KEY)

supabase: Client = create_client(SUPABASE_PROJECT_URL, SUPABASE_KEY)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://dasboard-construction-mhbt-qnam88gu3.vercel.app/"}})
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

FRAME_COUNT = 0
S_TIME = -1
SOURCE = 0

# Initialize YOLO model
MODEL = YOLO("yolov8n")
DATA = {}


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


def erase_old_data():
    print("Erasing old data...")
    response = supabase.table("videoData").delete().neq("frame_number", 0).execute()
    print("Erase response:", response)


@socketio.on('frame')
def handle_frame(frame):
    global FRAME_COUNT, S_TIME, SOURCE, MODEL, DATA

    erase_old_data()

    print("DEBUG 121: processing image...")
    base64_image = frame.get('image')

    if base64_image:
        print("DEBUG 122: base64 image received")

        # Decode base64 to bytes
        image_data = base64.b64decode(base64_image.split(',')[1])
        # Convert bytes to numpy array
        np_array = np.frombuffer(image_data, dtype=np.uint8)
        # Decode numpy array to image
        image = cv.imdecode(np_array, cv.IMREAD_COLOR)

        if image is not None:
            FRAME_COUNT += 1
            if FRAME_COUNT >= 500:
                del DATA[FRAME_COUNT - 500]

            if SOURCE == 0:
                DATA[FRAME_COUNT] = {
                    'Time': str(datetime.now().strftime("%H:%M:%S")),
                }

            else:
                if S_TIME == -1:
                    S_TIME = datetime.now()
                DATA[FRAME_COUNT] = {
                    'Time': str(datetime.now() - S_TIME).split('.')[0],
                }

            results = MODEL(image)
            for result in results[0].boxes:
                classId = int(result.cls)
                className = MODEL.names[classId]

                if className not in DATA[FRAME_COUNT]:
                    DATA[FRAME_COUNT][className] = 0
                DATA[FRAME_COUNT][className] += 1

                x1, y1, x2, y2 = map(int, result.xyxy[0])
                conf = result.conf[0]

                cv.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv.putText(image, f'{className} {conf:.2f}', (x1, y1 - 10), cv.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)

            print("_____DEBUG 6: for loop ended____")
            _, buffer = cv.imencode('.jpg', image)
            frame_data = base64.b64encode(buffer).decode('utf-8')
            print("_____DEBUG 7: frame is converted to binary_____")

            # Emit the frame data and annotated results to the frontend
            uqCategories = processData(DATA)

            socketio.emit('video_frame', {
                'frame': frame_data,
                'current_data': DATA[FRAME_COUNT],
                'data': DATA,
                'uqCategories': uqCategories,

            })

            insert_data(FRAME_COUNT, DATA[FRAME_COUNT], uqCategories)
            
        else:
            print("DEBUG 125: Failed to decode image")

    else:
        print("DEBUG 123: No base64 image in data")


@app.route('/')
def index():
    return "Server is running"


@app.route('/start-server', methods=['POST'])
def start_server():
    return "Server started", 200

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
