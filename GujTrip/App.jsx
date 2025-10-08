// App.tsx - Updated with new design theme
import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HistoryScreen from './components/HistoryScreen';
import HomeScreen from './components/HomeScreen';
import HotelsScreen from './components/HotelScreen';
import LoginScreen from './components/LoginScreen';
import MapScreen from './components/MapScreen';
import OtpVerification from './components/OtpScreen';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import VirtualViewScreen from './components/VirtualViewScreen';
import PlanFormScreen from './components/planFormScreen';
import PlaningScreen from './components/PlanningScreen';
import PlanDisplayScreen from './components/PlanDisplayScreen';
import Search from './components/Search';
import ProfileScreen from './components/ProfileScreen';
import GujjuAI from './components/GujjuAi';

// UI Components
import LoadingSpinner from './components/ui/LoadingSpinner';

// Theme
import { colors } from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (!parsedUser.name || !parsedUser.age || !parsedUser.gender) {
          setNeedsProfileSetup(true);
        }
      }
    } catch (error) {
      console.log('Error reading login status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loggedUser) => {
    try {
      const storedUser = await AsyncStorage.getItem(`user_${loggedUser.phone}`);
      let userData;
      if (storedUser) {
        userData = JSON.parse(storedUser);
      } else {
        userData = {
          phone: loggedUser.phone,
          name: '',
          age: '',
          gender: '',
        };
        await AsyncStorage.setItem(`user_${loggedUser.phone}`, JSON.stringify(userData));
      }

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      if (!userData.name || !userData.age || !userData.gender) {
        setNeedsProfileSetup(true);
      } else {
        setNeedsProfileSetup(false);
      }
    } catch (error) {
      console.log('Error during login:', error);
    }
  };

  const handleProfileUpdate = async (updatedUser) => {
    try {
      setUser(updatedUser);
      setNeedsProfileSetup(false);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`user_${updatedUser.phone}`, JSON.stringify(updatedUser));
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.backgroundPaper,
      elevation: 2,
      shadowOpacity: 0.1,
    },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 18,
    },
    headerBackTitleVisible: false,
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.backgroundPaper} 
      />
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          {!user ? (
            <>
              <Stack.Screen 
                name="Login" 
                options={{ headerShown: false }}
              >
                {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
              </Stack.Screen>
              <Stack.Screen 
                name="OtpVerification" 
                options={{ headerShown: false }}
              >
                {(props) => <OtpVerification {...props} onLogin={handleLogin} />}
              </Stack.Screen>
            </>
          ) : needsProfileSetup ? (
            <Stack.Screen 
              name="ProfileSetup" 
              options={{ headerShown: false }}
            >
              {(props) => (
                <ProfileSetupScreen 
                  {...props} 
                  user={user} 
                  onProfileUpdate={handleProfileUpdate} 
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen 
                name="Home" 
                options={{ headerShown: false }}
              >
                {(props) => (
                  <HomeScreen 
                    {...props} 
                    user={user} 
                    onLogout={handleLogout} 
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Hotel" component={HotelsScreen} />
              <Stack.Screen name="View" component={VirtualViewScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="Planform" component={PlanFormScreen} />
              <Stack.Screen name="Plan" component={PlaningScreen} />
              <Stack.Screen name="PlanDisplay" component={PlanDisplayScreen} />
              <Stack.Screen name="Search" component={Search} />
              <Stack.Screen name="Gujju" component={GujjuAI} />
              <Stack.Screen name="Profile">
                {(props) => (
                  <ProfileScreen 
                    {...props} 
                    user={user} 
                    onLogout={handleLogout} 
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
});
