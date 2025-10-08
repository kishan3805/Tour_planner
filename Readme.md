# GujTrip - AI-Driven Travel Itinerary System

![GujTrip Logo](web/public/logo192.png)

**GujTrip** is an AI-powered travel itinerary system designed to simplify trip planning. It includes a **mobile application** for travelers and a **web admin panel** for managing tourist places, hotels, virtual views, and historical details. The system also features an AI chatbot to provide personalized recommendations.

---

## Features

- Explore historical information and virtual tours of tourist places.
- Check hotel details and search optimized travel routes.
- Calculate distances between locations and plan trips efficiently.
- AI-powered chatbot to assist users with travel queries.
- Web-based admin panel to add, edit, and update data.

---

## Technology Stack

- **Frontend (Mobile App):** React Native  
- **Frontend (Admin Web):** React.js  
- **Backend:** Python (Flask)  
- **Database:** Firebase  
- **AI Chatbot:** Open AI API

---

## Installation & Setup

### 1 Install dependencies for React Native
```bash
cd GujTrip
npm install
```

### 2 Install dependencies for React.js web admin
```bash
cd web
npm install
```

### 3 Start Backend Server
```bash
cd backend
source venv/bin/activate
python backend.py
```

### 4 Start React Native Mobile App
```bash
cd GujTrip
npx react-native run-android
npx react-native start
```

### 5 Start Web Admin Panel
```bash
cd web
npm start
```

