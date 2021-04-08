from flask_cors import CORS
from flask import Flask, request, render_template, json, jsonify, send_from_directory
import json
import cv2
import numpy as np
import io
import base64

app = Flask(__name__)
CORS(app)


@app.route('/model')
def model():
    json_data = json.load(open("model/facemo.json"))
    return jsonify(json_data)


@app.route('/image', methods=['POST'])
def mask_image():
    img_base64 = ""
    with open(request.form['image'], "rb") as image_file:
        img_base64 = base64.b64encode(image_file.read())
    return jsonify({'status': str(img_base64)})


@app.route('/<path:path>')
def load_shards(path):
    return send_from_directory('model', path)


if __name__ == "__main__":
    app.run()
