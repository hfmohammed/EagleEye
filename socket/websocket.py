import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from ultralytics import YOLO
import time
import sys
import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import uuid
from dateutil.parser import parse as parse_datetime
import logging
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.config import Config


# logging.basicConfig(level=logging.DEBUG)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key="super-secret")

config = Config('.env')
model = YOLO("yolov8n.pt")

load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
print("supabase::", supabase_key)
supabase: Client = create_client(supabase_url, supabase_key)


def updateDatabase(category_counts, total_item_count, fps, timestamp, index):
    print(category_counts, total_item_count, fps, timestamp, index)
    if fps is None:
        fps = 0

    data = {
        "time": timestamp,
        "objects": category_counts,
        "total_items": total_item_count,
        "fps": fps,
        "index": index,
    }
    response = supabase.table("EagleEye_traffic_data").insert(data).execute()
    print("Database update response", response)

# http://47.51.131.147/-wvhttp-01-/GetOneShot?image_size=1280x720&frame_count=1000000000

@app.websocket("/stream")
async def rtsp_websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("RTSP WebSocket connection established")

    streaming_task = None
    stream_active = False

    async def stream_frames(stream_url, index, desired_fps):
        nonlocal stream_active
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            await ws.send_text(json.dumps({"message": "Failed to open RTSP stream"}))
            return

        frame_times = []
        print("Streaming loop started")

        while stream_active:
            start_time = time.time()
            
            ret, frame = cap.read()
            if not ret:
                await ws.send_text(json.dumps({"message": "Failed to read frame"}))
                continue

            # === Apply YOLO or your processing ===
            try:
                current_time = time.time()
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(current_time))
                
                print("analyzing...")
                results = model(frame, conf=0.2)
                print("analyzed...")
                boxes = results[0].boxes
                print("boxes...")
                count = len(boxes)
                print("len::", count)
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

                frame_times.append(current_time)
                frame_times = [t for t in frame_times if current_time - t <= 60]
                fps = len(frame_times) / (current_time - frame_times[0]) if len(frame_times) > 1 else None

                print("encoding...")
                _, buf = cv2.imencode(".jpeg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                if buf is None:
                    continue

                print("decoding...")
                jpeg_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

                await ws.send_text(json.dumps({
                    "image": jpeg_b64,
                    "count": count,
                    "annotations": annotations,
                    "category_counts": category_counts,
                    "timestamp": timestamp,
                    "fps": fps,
                    "index": index,
                    "camera_id": f"camera {index}"
                }))
                updateDatabase(category_counts, count, fps, timestamp, index)
                print("db updated")

                elapsed = time.time() - start_time
                print("awaiting")
                await asyncio.sleep(max(0, (1 / desired_fps) - elapsed))
                print("waited....")


            except Exception as e:
                print(e)
                await ws.send_text(json.dumps({"message": f"YOLO error: {str(e)}"}))
                break

        cap.release()
        print("Streaming loop ended")

    try:
        while True:
            data = await ws.receive_text()
            message = json.loads(data)
            print("Received message:", message)

            if message.get("action") == "BEGIN_STREAM":
                desired_fps = message.get("fps", 10)
                frame_interval = 1 / desired_fps

                stream_url_list = json.loads(message.get("stream_url"))
                print(stream_url_list)

                if not stream_active:
                    stream_active = True
                    # Start a streaming task for each RTSP URL
                    streaming_task = [
                        asyncio.create_task(stream_frames(url, idx, desired_fps))
                        for idx, url in enumerate(stream_url_list)
                    ]

            elif message.get("action") == "STOP_STREAM":
                if stream_active:
                    stream_active = False
                    if streaming_task:
                        await asyncio.gather(*streaming_task)  # wait for task to finish
                        streaming_task = None

    except WebSocketDisconnect:
        print("RTSP WebSocket disconnected")
        stream_active = False
        if streaming_task:
            await asyncio.gather(*streaming_task)



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

                # cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                # cv2.putText(img, f"{label} {conf:.2f}", (x1, y1-10),
                #             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

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
                "fps": fps,
                "index": 0,
                "camera_id": f"camera {0}"
            }))
            updateDatabase(category_counts, count, fps, timestamp, 0)

    except WebSocketDisconnect:
        print("Client disconnected")


# ================ Models ================

class UserLogin(BaseModel):
    username: str
    password: str
    access_token: str
    refresh_token: str


class UserCreate(BaseModel):
    username: str
    password: str
    email: str


class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str

class Settings(BaseModel):
    username: str
    newFps: int
    newRtspLinks: List[str]
    newInputSource: str

# =============== Auth helpers ===============
ACCESS_SECRET_KEY = "access-secret-key"
REFRESH_SECRET_KEY = "refresh-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password_input: str, expected_value: str):
    return pwd_context.verify(password_input, expected_value)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "jti": str(jti)})
    access_token = jwt.encode(to_encode, ACCESS_SECRET_KEY, algorithm=ALGORITHM)

    # store jti to terminate access token
    supabase.table("blacklisted_jti").insert({
        "username": to_encode["username"], 
        "jti": jti, 
        "blacklist": False,
        "expire_at": expire.isoformat()
    }).execute()

    return access_token

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(token:str):
    print("verifying access token...")

    payload = jwt.decode(token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("username")
    jti: str = payload.get("jti")

    is_revoked = supabase.table("blacklisted_jti").select("*").eq("jti", jti).execute().data
    print(is_revoked)
    if is_revoked:
        expire_at = parse_datetime(is_revoked[0]["expire_at"])
    else:
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED, 
            "detail": "invalid token", 
            "headers": {"WWW-Authenticate": "Bearer"},
        }

    print(expire_at)
    print(is_revoked)

    if username is None or not is_revoked or (is_revoked and (is_revoked[0]["blacklist"] is True or expire_at < datetime.now(timezone.utc))):
        print(username)
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED, 
            "detail": "invalid token", 
            "headers": {"WWW-Authenticate": "Bearer"},
        }
    

    return {
        "status_code": status.HTTP_200_OK,
        "message": username,
        "detail": "authorized", 
        "headers": {"WWW-Authenticate": "Bearer"},
    }


def verify_refresh_token(token:str):
    payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("username")
    expire_at: str = payload.get("exp")
    expire_at = datetime.fromtimestamp(expire_at, tz=timezone.utc)
    print(expire_at)
    
    if expire_at < datetime.now(timezone.utc):
        supabase.table("refresh_tokens").update({"disabled": True}).execute()

    print("username::", username)
    if username is None:
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED, 
            "detail": "invalid token", 
            "headers": {"WWW-Authenticate": "Bearer"},
        }
    
    response = supabase.table("refresh_tokens")\
        .select("disabled")\
        .eq("username", username)\
        .eq("token", token).execute()

    
    if response.data and response.data[0]["disabled"] == True or not response.data:
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED, 
            "detail": "invalid token", 
            "headers": {"WWW-Authenticate": "Bearer"},
        }

    return {
        "status_code": status.HTTP_200_OK,
        "message": username,
        "detail": "authorized", 
        "headers": {"WWW-Authenticate": "Bearer"},
    }


# =============== Auth endpoints ==================

@app.post("/signup")
def signup(user: UserCreate):
    existing_user = supabase.table("users_login").select("username").eq("username", user.username).execute()
    print(existing_user)

    if existing_user.data:
        return {
            "status_code": status.HTTP_400_BAD_REQUEST,
            "message": "User exists",
        }
    
    else:
        logging.warning("user not found")
        user_info = {
            "username": user.username,
            "password": hash_password(user.password),
        }

        response = supabase.table("users_login").insert(user_info).execute()
        print(response)

        access_token = create_access_token(data={"username": user.username})
        refresh_token = create_refresh_token(data={"username": user.username})
        response = supabase.table("refresh_tokens").insert({
            "username": user.username,
            "token": refresh_token,
            "disabled": False,
            "expire_at": datetime.fromtimestamp(
                jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])["exp"],
                tz=timezone.utc
            ).isoformat()
        }).execute()

        response = supabase.table("user_info").insert({
            "username": user.username,
            "email": user.email,
            "fps": 2,
            "rtspLinks": ["resources/cars.mp4", "resources/people.mp4"],
            "inputSource": "rtsp",
        }).execute()

        return {
            "username": user.username,
            "status_code": status.HTTP_201_CREATED,
            "message": "User created",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "fps": 2,
            "rtspLinks": ["resources/cars.mp4", "resources/people.mp4"],
            "inputSource": "rtsp",
            "enableAnnotationsRef": False,
            "token_type": "bearer"
        }
    

@app.post("/login")
def login(user: UserLogin):
    existing_user = supabase.table("users_login").select("*").eq("username", user.username).execute()
    try:
        if user.access_token and user.refresh_token:
            logging.warning("access and refresh token were given")
            if verify_refresh_token(user.refresh_token)["status_code"] != status.HTTP_200_OK:
                print("Invalid refresh token")
                raise ValueError("Invalid credentials or session")
            print("refresh token verification successful")

            if verify_access_token(user.access_token)["status_code"] != status.HTTP_200_OK:
                print("Invalid access token")
                raise ValueError("Invalid credentials or session")
            
            print("access token verification successful")

            response = supabase.table("user_info").select("*").eq("username", user.username).execute()
            print(response)
            if response.data:
                return {
                    "status_code": status.HTTP_200_OK,
                    "message": "Login successful",
                    "username": jwt.decode(user.access_token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM]).get("username"),
                    "access_token": user.access_token,
                    "refresh_token": user.refresh_token,
                    "token_type": "bearer",
                    "fps": response.data[0]["fps"],
                    "rtspLinks": response.data[0]["rtspLinks"],
                    "inputSource": response.data[0]["inputSource"],
                    "enableAnnotationsRef": response.data[0]["enableAnnotationsRef"],
                }
        
        else:
            raise ValueError("Required parameters were not provided")

    except:
        logging.warning("logging in with password")

        if existing_user.data and verify_password(user.password, existing_user.data[0]['password']):
            access_token = create_access_token(data={"username": user.username})
            refresh_token = create_refresh_token(data={"username": user.username})

            supabase.table("refresh_tokens").insert({
                "username": user.username,
                "token": refresh_token,
                "disabled": False,
                "expire_at": datetime.fromtimestamp(
                    jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])["exp"],
                    tz=timezone.utc
                ).isoformat()
            }).execute()

            response = supabase.table("user_info").select("*").eq("username", user.username).execute()
            print(response)
            if response.data:
                return {
                    "fps": response.data[0]["fps"],
                    "rtspLinks": response.data[0]["rtspLinks"],
                    "inputSource": response.data[0]["inputSource"],
                    "enableAnnotationsRef": response.data[0]["enableAnnotationsRef"],
                    "status_code": status.HTTP_200_OK,
                    "message": "Login successful",
                    "username": user.username,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer"
                }
            else:
                raise Exception("no response from user_info")
        else:
            return {
                "status_code": status.HTTP_401_UNAUTHORIZED,
                "message": "Invalid credentials or session",
            }


@app.post("/refresh")
def refresh_access_token(req: RefreshRequest):
    # make sure refresh token exists
    refresh_token_verification = verify_refresh_token(req.refresh_token)
    if refresh_token_verification["status_code"] != status.HTTP_200_OK:
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED,
            "access_token": req.refresh_token,
            "message": "Invalid refresh token",
            "token_type": "bearer"
        }

    username = refresh_token_verification["message"]
    response = supabase.table("refresh_tokens").select("*")\
        .eq("username", username)\
        .eq("token", req.refresh_token).execute()

    if not response.data:
        return {
            "status_code": status.HTTP_401_UNAUTHORIZED,
            "access_token": req.refresh_token,
            "message": "Invalid refresh token",
            "token_type": "bearer"
        }



    # generate new access token
    new_access_token = create_access_token(data={"username": username})
    new_refresh_token = create_refresh_token(data={"username": username})

    # invalidate current refresh token
    supabase.table("refresh_tokens").update({"disabled": True})\
        .eq("username", username).eq("token", req.refresh_token).execute()

    # store the new refresh token
    supabase.table("refresh_tokens").insert({
        "username": username,
        "token": new_refresh_token,
        "disabled": False,
        "expire_at": jwt.decode(new_refresh_token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM]).get("exp"),
    }).execute()

    return {
        "status_code": status.HTTP_200_OK,
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@app.post("/terminate_tokens/{username}")
def terminate_tokens(username: str):
    supabase.table("blacklisted_jti").update({"blacklist": True})\
        .eq("username", username).execute()

    # mark all refresh tokens as disabled
    response = supabase.table("refresh_tokens")\
        .update({"disabled": True})\
        .eq("username", username).execute()

    return {
        "status_code": status.HTTP_200_OK,
        "message": "tokens deleted"
    }

@app.post("/logout")
def logout_session(tokens: Tokens):
    print("logging out")
    payload = jwt.decode(tokens.access_token, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
    jti: str = payload.get("jti")

    supabase.table("blacklisted_jti").update({"blacklist": True})\
        .eq("jti", jti).execute()

    # mark all refresh tokens as disabled
    response = supabase.table("refresh_tokens")\
        .update({"disabled": True})\
        .eq("token", tokens.refresh_token).execute()

    return {
        "status_code": status.HTTP_200_OK,
        "message": "tokens deleted"
    }

@app.post("/cleanup-tokens")
def cleanup_tokens():
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("blacklisted_jti").delete().lt("expire_at", now).execute()
    supabase.table("refresh_tokens").delete().lt("expire_at", now).execute()

    supabase.table("blacklisted_jti").delete().eq("blacklist", True).execute()
    supabase.table("refresh_tokens").delete().eq("disabled", True).execute()
    return {
        "status_code": status.HTTP_200_OK,
        "message": "Expired jti entries and refresh tokens",
    }

@app.put("/saveSettings")
def save_settings(settings: Settings):
    print("saving settings........", settings.newFps, settings.newInputSource, settings.newRtspLinks)

    response = supabase.table("user_info").update({
        "fps": settings.newFps,
        "inputSource": settings.newInputSource,
        "rtspLinks": settings.newRtspLinks
    }).eq("username", settings.username).execute()

    print("saveSettings called:", response)

    return {
        "status_code": status.HTTP_200_OK,
        "message": "Settings saved successfully",
    }

oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=os.getenv("VITE_GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("VITE_GOOGLE_CLIENT_SEC"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={"scope": "openid email profile"},
)

@app.get("/auth/login")
async def oauth_login(request: Request):
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        print("Token response:", token)
    except Exception as e:
        print("Failed to authorize access token:", e)
        return JSONResponse({"error": "OAuth authorization failed"}, status_code=400)

    try:
        userinfo = token.get("userinfo")
        print("Userinfo:::", userinfo)

        if not userinfo or "email" not in userinfo:
            return JSONResponse({"error": "Invalid user info"}, status_code=400)

        user_email = userinfo.get("email")

        # Check if user exists
        existing_user_info = supabase.table("user_info").select("*").eq("username", user_email).execute()
        existing_user_login = supabase.table("users_login").select("*").eq("username", user_email).execute()

        if not existing_user_login.data and not existing_user_info.data:
            print("Creating new user in Supabase...")
            supabase.table("users_login").insert({
                "username": user_email,
                "password": hash_password("oauth_dummy"),
            }).execute()
            print("created user login")

            supabase.table("user_info").insert({
                "username": user_email,
                "email": user_email,
                "fps": 2,
                "rtspLinks": ["resources/cars.mp4", "resources/people.mp4"],
                "inputSource": "rtsp",
                "enableAnnotationsRef": False
            }).execute()
            print("created user login")


        # === Issue JWT tokens ===
        access_token = create_access_token({"username": user_email})
        refresh_token = create_refresh_token({"username": user_email})

        # Store refresh token in DB
        supabase.table("refresh_tokens").insert({
            "username": user_email,
            "token": refresh_token,
            "disabled": False,
            "expire_at": datetime.fromtimestamp(
                jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])["exp"],
                tz=timezone.utc
            ).isoformat()
        }).execute()

        # Store in session
        request.session["user"] = {
            "email": user_email,
            "access_token": access_token,
            "refresh_token": refresh_token
        }

        return RedirectResponse("http://localhost:5173/oauth")

    except Exception as e:
        print("OAuth callback error:", e)
        return JSONResponse({"error": str(e)}, status_code=400)


@app.get("/auth/user")
def get_user(request: Request):
    user = request.session.get("user")
    if not user:
        return {"error": "Not logged in"}

    username = user["email"]
    settings = supabase.table("user_info").select("*").eq("username", username).execute()
    data = settings.data[0] if settings.data else {}

    return {
        "email": username,
        "access_token": user["access_token"],
        "refresh_token": user["refresh_token"],
        "fps": data.get("fps", 2),
        "rtspLinks": data.get("rtspLinks", []),
        "inputSource": data.get("inputSource", "rtsp"),
        "enableAnnotationsRef": data.get("enableAnnotationsRef", False)
    }
