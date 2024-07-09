from flask import Flask
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2 as cv
import base64

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize YOLO model
MODEL = YOLO("yolov8n")
DATA = []

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

    while cap.isOpened():
        current_data = {}
        ret, frame = cap.read()
        if not ret:
            print("_____DEBUG 5: Failed to grab frame or end of video reached._____")
            break

        results = yolo_annotate(frame)

        for result in results[0].boxes:
            classId = int(result.cls)
            className = MODEL.names[classId]

            if className not in current_data:
                current_data[className] = 0
            current_data[className] += 1

            x1, y1, x2, y2 = map(int, result.xyxy[0])
            conf = result.conf[0]

            cv.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv.putText(frame, f'{className} {conf:.2f}', (x1, y1 - 10), cv.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)


        _, buffer = cv.imencode('.png', frame)
        frame_data = base64.b64encode(buffer).decode('utf-8')
        
        DATA.append(current_data)

        # Emit the frame data and annotated results to the frontend
        socketio.emit('video_frame', 
                      {'frame': frame_data, 'current_data': current_data, 'DATA': DATA})

        # Sleep to reduce the frame rate (optional)
        # socketio.sleep(0.1)

    cap.release()

@app.route('/')
def index():
    return "Server is running"

if __name__ == '__main__':
    source = "../resources/cars.mp4"
    source = "0"
    print(f"______DEBUG 1: source: {source}______")
    socketio.start_background_task(capture_camera, source)
    socketio.run(app, host='0.0.0.0', port=5001)
