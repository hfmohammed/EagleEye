import cv2

def test_rtsp_stream():
    # Print OpenCV version and build information
    print(f"OpenCV Version: {cv2.__version__}")
    print(f"OpenCV Build Info: {cv2.getBuildInformation()}")
    
    # Alternative public test stream
    rtsp_url = "resources/cars.mp4"
    
    # Create VideoCapture object
    print(f"Attempting to connect to stream: {rtsp_url}")
    cap = cv2.VideoCapture(rtsp_url)
    
    try:
        # Check if stream is opened successfully
        if not cap.isOpened():
            print("Failed to open RTSP stream")
            return False
        
        print("Successfully connected to RTSP stream")
        
        # Create a window to display the stream
        cv2.namedWindow('RTSP Stream', cv2.WINDOW_NORMAL)
        
        frame_count = 0
        while True:
            # Read frame
            ret, frame = cap.read()
            
            if not ret:
                print(f"Failed to read frame from stream after {frame_count} frames")
                continue
                
            frame_count += 1
            # Display the frame
            cv2.imshow('RTSP Stream', frame)
            
            # Break the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
        return True
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return False
        
    finally:
        # Release the VideoCapture object and destroy windows
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    test_rtsp_stream()