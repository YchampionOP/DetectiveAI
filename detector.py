# detector.py
import base64
import time

import cv2
import numpy as np
from ultralytics import RTDETR


class ObjectDetector:
    def __init__(self):
        self.model = RTDETR('rtdetr-x.pt')
        self.conf_threshold = 0.5
        self.classes = None
        
    def process_frame(self, frame):
        """Process a single frame and return detections"""
        results = self.model(frame, conf=self.conf_threshold)
        return self.draw_detections(frame.copy(), results)

    def draw_detections(self, frame, results):
        # Same as before
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf)
                cls = int(box.cls)
                label = f'{result.names[cls]} {conf:.2f}'
                
                color = (0, int(255 * conf), 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                cv2.rectangle(frame, (x1, y1 - text_size[1] - 10), 
                            (x1 + text_size[0], y1), color, -1)
                cv2.putText(frame, label, (x1, y1 - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return frame

    def process_image(self, image_data):
        """Process base64 image data"""
        # Decode base64 image
        encoded_data = image_data.split(',')[1] if ',' in image_data else image_data
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process the frame
        processed_frame = self.process_frame(frame)
        
        # Encode processed frame to base64
        _, buffer = cv2.imencode('.jpg', processed_frame)
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        
        return f'data:image/jpeg;base64,{encoded_image}'