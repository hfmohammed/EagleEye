from flask import Flask # type: ignore
from flask_socketio import SocketIO, emit # type: ignore
from ultralytics import YOLO
import cv2 as cv
import base64

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize YOLO model
MODEL = YOLO("yolov8n")
DATA = {}


def processData(x: dict):
    uqCategories = set()
    for i in x.values():
        ik = i.keys()
        for j in ik:
            uqCategories.add(j)
    
    return list(uqCategories)

def yolo_annotate(frame):
    results = MODEL(frame)
    return results

def capture_camera(source):
    print("_____DEBUG 2: called capture_camera_____")
    if source == "0":
        source = 0

    cap = cv.VideoCapture(source)
    if not cap.isOpened():
        print("_____DEBUG 3: Error: Unable to open video source._____")
        return
    
    print("_____DEBUG 4: Cap is opened!_____")

    frameCount = 0
    while cap.isOpened():
        DATA[frameCount] = {}
        ret, frame = cap.read()
        if not ret:
            print("_____DEBUG 5: Failed to grab frame or end of video reached._____")
            socketio.start_background_task(capture_camera, source)


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
        print(uqCategories)

        socketio.emit('video_frame', {
            'frame': frame_data,
            'current_data': DATA[frameCount],
            'data': DATA,
            'uqCategories': uqCategories,

        })

        # Sleep to reduce the frame rate (optional)
        # socketio.sleep(0.1)
        frameCount += 1

    cap.release()

@app.route('/')
def index():
    return "Server is running"

if __name__ == '__main__':
    source = "../resources/cars.mp4"
    # source = "0"
    print(f"______DEBUG 1: source: {source}______")
    socketio.start_background_task(capture_camera, source)
    socketio.run(app, host='0.0.0.0', port=5001)
