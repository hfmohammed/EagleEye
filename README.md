# EagleEye
- Real-time CCTV and object detection platform

### run frontend
```bash
cd client/
npm run dev
```

### run WebSocket
```bash
cd socker/
uvicorn websocket:app --host 0.0.0.0 --port 5700 --reload
```
