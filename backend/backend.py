from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import openrouteservice
from itertools import permutations
import time
import os
import uuid
from functools import lru_cache
import math
from twilio.rest import Client
import random

app = Flask(__name__)

# Enable CORS for relevant routes
CORS(app, resources={
    r"/upload": {
        "origins": ["http://localhost:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/optimize-route": {
        "origins": ["*"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    },
    r"/send-otp": {
        "origins": ["*"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})

# OpenRouteService client initialization
client = openrouteservice.Client(
    key='YOUR_KEY',
    timeout=10
)

# Twilio configuration (replace with your actual credentials)
TWILIO_ACCOUNT_SID = 'YOUR_ACCOUNT_SID'
TWILIO_AUTH_TOKEN = 'YOUR_AUTH_TOKEN'
TWILIO_PHONE_NUMBER = 'YOUR_PHONE_NUMBER'

# Initialize Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# OTP storage (for demo purposes, should use a DB in production)
otp_storage = {}

# Folder for media uploads
MEDIA_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "media")
os.makedirs(MEDIA_FOLDER, exist_ok=True)

@app.route('/media/<path:filename>')
def serve_media(filename):
    return send_from_directory(MEDIA_FOLDER, filename)

@app.route("/upload", methods=["POST", "OPTIONS"])
def upload_file():
    if request.method == "OPTIONS":
        return jsonify({"status": "preflight"}), 200
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        filename = request.form.get('filename', str(uuid.uuid4()))
        ext = os.path.splitext(file.filename)[1]
        safe_filename = f"{filename}{ext}"
        file_path = os.path.join(MEDIA_FOLDER, safe_filename)
        file.save(file_path)

        if not os.path.exists(file_path):
            return jsonify({"error": "File save failed"}), 500

        return jsonify({
            "status": "success",
            "path": f"/media/{safe_filename}"
        }), 200
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        data = request.get_json()
        phone_number = data.get('phone_number')
        if not phone_number:
            return jsonify({'error': 'Phone number is required'}), 400

        normalized_phone = phone_number.replace(' ', '').replace('-', '')

        otp = str(random.randint(100000, 999999))

        # For a specific number, send real OTP via Twilio, else demo mode
        if normalized_phone == '+919104558700':
            try:
                message = twilio_client.messages.create(
                    body=f'Your OTP for verification is: {otp}',
                    from_=TWILIO_PHONE_NUMBER,
                    to=normalized_phone
                )
                print(f"OTP sent via Twilio to {normalized_phone}. Message SID: {message.sid}")
            except Exception as e:
                print(f"Twilio error: {str(e)}")
                return jsonify({
                    'error': 'Failed to send OTP via Twilio',
                    'details': str(e)
                }), 500
        else:
            print(f"Demo OTP for {normalized_phone}: {otp}")

        # Store OTP with timestamp (valid 10 minutes)
        otp_storage[normalized_phone] = {
            'otp': otp,
            'timestamp': time.time(),
            'attempts': 0  # track failed attempts
        }

        return jsonify({
            'success': True,
            'message': 'OTP sent successfully' if normalized_phone == '+919104558700' else 'Demo OTP generated'
        }), 200

    except Exception as e:
        print(f"Error sending OTP: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        data = request.get_json()
        phone_number = data.get('phone_number')
        otp_attempt = data.get('otp')
        if not phone_number or not otp_attempt:
            return jsonify({'error': 'Phone number and OTP are required'}), 400

        if phone_number not in otp_storage:
            return jsonify({'error': 'No OTP found for this phone number'}), 400

        otp_data = otp_storage[phone_number]

        # Check expiration (10 minutes)
        if time.time() - otp_data['timestamp'] > 600:
            del otp_storage[phone_number]
            return jsonify({'error': 'OTP has expired'}), 400

        # Too many attempts
        if otp_data['attempts'] >= 3:
            del otp_storage[phone_number]
            return jsonify({'error': 'Too many failed attempts'}), 400

        # Demo mode acceptance
        if phone_number != '+919104558700' and otp_attempt == '123456':
            del otp_storage[phone_number]
            return jsonify({'success': True, 'message': 'OTP verified successfully'}), 200

        # Actual OTP check for specific number
        if otp_attempt == otp_data['otp']:
            del otp_storage[phone_number]
            return jsonify({'success': True, 'message': 'OTP verified successfully'}), 200
        else:
            otp_storage[phone_number]['attempts'] += 1
            return jsonify({'error': 'Invalid OTP'}), 400

    except Exception as e:
        print(f"Error verifying OTP: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon/2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def estimate_travel_time(distance_km):
    # Average speed assumption 40km/h, converted to minutes
    return (distance_km / 40) * 60

@lru_cache(maxsize=128)
def get_route_info(coord1, coord2):
    try:
        coords = [coord1[::-1], coord2[::-1]]  # (lng, lat)
        res = client.directions(coords, profile='driving-car')
        dist_km = res['routes'][0]['summary']['distance'] / 1000
        duration_min = res['routes'][0]['summary']['duration'] / 38
        return round(dist_km, 2), round(duration_min, 2)
    except Exception as e:
        print(f"Route API error: {e}. Falling back to Haversine.")
        distance = haversine_distance(coord1[0], coord1[1], coord2[0], coord2[1])
        time_estimate = estimate_travel_time(distance)
        return round(distance, 2), round(time_estimate, 2)

def get_full_route(coordinates):
    try:
        response = client.directions(
            coordinates,
            profile='driving-car',
            format='geojson',
            optimize_waypoints=True
        )
        return response['features'][0]['geometry']['coordinates']
    except Exception as e:
        print(f"Error getting full route geometry: {e}")
        return [[coord[0], coord[1]] for coord in coordinates]

@app.route('/optimize-route', methods=['POST'])
def optimize_route():
    start_time = time.time()
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        data = request.get_json()
        places = data.get('places', [])
        initial_point = data.get('initial_point')

        if not places:
            return jsonify({'error': 'No places provided'}), 400

        if not initial_point:
            initial_point = places[0]
        else:
            initial_point_name = initial_point.get('name')
            if not any(p.get('name') == initial_point_name for p in places):
                places.append(initial_point)

        # Validate places
        for i, place in enumerate(places):
            if 'name' not in place:
                place['name'] = f"Place_{i+1}"
            if 'latitude' not in place or 'longitude' not in place or \
               place['latitude'] is None or place['longitude'] is None:
                return jsonify({'error': f'Place {place.get("name", "unknown")} invalid coordinates'}), 400
            if 'duration' not in place:
                place['duration'] = 30  # default 30 minutes

        if len(places) == 1:
            total_duration = places[0]['duration']
            return jsonify({
                'path': [places[0]['name']],
                'coordinates': [[places[0]['latitude'], places[0]['longitude']]],
                'total_distance': 0,
                'total_time': total_duration,
                'geometry': [[places[0]['longitude'], places[0]['latitude']]],
                'outward_distance': 0,
                'outward_time': total_duration,
                'round_trip_distance': 0,
                'round_trip_time': total_duration,
                'total_visit_time': total_duration
            })

        if len(places) > 8:
            return jsonify({
                'error': 'Too many locations (max 8 supported)',
                'suggestion': 'Please reduce the number or split routes'
            }), 400

        # Build graph with distances and times
        graph = {}
        place_names = [p['name'] for p in places]
        place_coords = {p['name']: (float(p['latitude']), float(p['longitude'])) for p in places}
        place_durations = {p['name']: int(p.get('duration', 30)) for p in places}

        for src in place_names:
            graph[src] = {}
            for dst in place_names:
                if src != dst:
                    dist, time_ = get_route_info(place_coords[src], place_coords[dst])
                    graph[src][dst] = {'distance': dist, 'time': time_}

        initial_point_name = initial_point['name'] if isinstance(initial_point, dict) else initial_point
        other_places = [p for p in place_names if p != initial_point_name]

        best_path = None
        min_time = float('inf')

        # Try all permutations for shortest route including return
        for perm in permutations(other_places):
            current_path = [initial_point_name] + list(perm) + [initial_point_name]
            try:
                total_time = sum(graph[current_path[i]][current_path[i+1]]['time']
                                 for i in range(len(current_path) -1))
                total_time += sum(place_durations[p] for p in current_path[:-1])  # visit time
                if total_time < min_time:
                    min_time = total_time
                    best_path = current_path
            except KeyError as e:
                continue

        if not best_path:
            return jsonify({'error': 'Could not calculate optimal route'}), 500

        total_visit_time = sum(place_durations[p] for p in best_path[:-1])
        round_trip_travel_time = sum(graph[best_path[i]][best_path[i+1]]['time']
                                    for i in range(len(best_path) -1))
        round_trip_distance = round(sum(graph[best_path[i]][best_path[i+1]]['distance']
                                   for i in range(len(best_path) -1)), 2)
        round_trip_time = round(round_trip_travel_time + total_visit_time, 2)

        outward_path = best_path[:-1]
        outward_route_coords = [place_coords[p][::-1] for p in outward_path]
        outward_route_geometry = get_full_route(outward_route_coords)
        outward_coordinates = [[place_coords[p][0], place_coords[p][1]] for p in outward_path]

        outward_travel_time = sum(graph[outward_path[i]][outward_path[i+1]]['time']
                                  for i in range(len(outward_path) -1))
        outward_distance = round(sum(graph[outward_path[i]][outward_path[i+1]]['distance']
                                     for i in range(len(outward_path) -1)), 2)
        outward_time = round(outward_travel_time + total_visit_time, 2)

        response_data = {
            'path': outward_path,
            'coordinates': outward_coordinates,
            'geometry': outward_route_geometry,
            'outward_distance': outward_distance,
            'outward_time': outward_time,
            'round_trip_distance': round_trip_distance,
            'round_trip_time': round_trip_time,
            'total_visit_time': total_visit_time,
            'travel_time_only': round(outward_travel_time, 2),
            'waypoints': [
                {
                    'name': p,
                    'coordinates': [place_coords[p][0], place_coords[p][1]],
                    'duration': place_durations[p]
                } for p in outward_path
            ]
        }

        print(f"Response data: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        print(f"Server error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'timestamp': time.time()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
