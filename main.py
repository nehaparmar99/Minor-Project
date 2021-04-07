from flask_cors import CORS
from flask import Flask, request, render_template, json, jsonify, send_from_directory
import json
import cv2
import numpy as np
import io

app = Flask(__name__)
CORS(app)


@app.route('/model')
def model():
    json_data = json.load(open("tf_models/model.json"))
    return jsonify(json_data)


@app.route('/<path:path>')
def load_shards(path):
    return send_from_directory('tf_models', path)


if __name__ == "__main__":
    app.run()
