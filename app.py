from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from detector import ObjectDetector
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize detector
detector = ObjectDetector()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        image_data = data['image']
        processed_image = detector.process_image(image_data)
        return jsonify({
            'success': True,
            'processed_image': processed_image
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@socketio.on('frame')
def handle_frame(frame_data):
    try:
        # Process the frame
        processed_image = detector.process_image(frame_data)
        # Emit the processed frame back to the client
        emit('processed_frame', {'image': processed_image})
    except Exception as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001, allow_unsafe_werkzeug=True)