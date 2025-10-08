# step 1 : Install dependency for react native
cd GujTrip
npm install

# step 2 : Install dependency for react js
cd web
npm install

# step 3 : start backend server
cd backend
source venv/bin/activate
python backend.py

# step 4 : start react native application
cd GujTrip
npx react-native run-android
npx react-native start

# step 5 : start web for admin
cd web
npm start