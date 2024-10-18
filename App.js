import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const API_URL = 'https://social-network-v7j7.onrender.com/api';

// LoadingOverlay Component
const LoadingOverlay = () => (
  <View style={styles.overlay}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

// API Status Check Functions
const checkApiStatus = async () => {
  try {
    const response = await axios.get('https://social-network-v7j7.onrender.com/status');
    return response.data.status === 'Server is running';
  } catch (error) {
    console.error('Error checking API status:', error);
    return false;
  }
};

const ensureApiIsAwake = async (setIsLoading) => {
  setIsLoading(true);
  let isAwake = await checkApiStatus();
  let attempts = 0;
  const maxAttempts = 3;

  while (!isAwake && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 20000));
    isAwake = await checkApiStatus();
    attempts++;
  }

  setIsLoading(false);
  return isAwake;
};

// SignUp Screen
const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setIsLoading(true);
    setError('');

    const isApiAwake = await ensureApiIsAwake(setIsLoading);
    if (!isApiAwake) {
      setError('Unable to connect to the server. Please try again later.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        username,
        email,
        password,
      });
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        navigation.navigate('MainTabs');
      } else {
        setError('Signup successful but no token received');
      }
    } catch (error) {
      setError(error.response ? error.response.data.message : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>SocialApp</Text>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, styles.greenButton]} onPress={handleSignUp} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Signing up...' : 'Sign Up'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
      {isLoading && <LoadingOverlay />}
    </View>
  );
};

// Login Screen
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    const isApiAwake = await ensureApiIsAwake(setIsLoading);
    if (!isApiAwake) {
      setError('Unable to connect to the server. Please try again later.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        navigation.navigate('MainTabs');
      } else {
        setError('Login successful but no token received');
      }
    } catch (error) {
      setError(error.response ? error.response.data.message : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>SocialApp</Text>
      <Text style={styles.title}>Welcome Back!</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
      {isLoading && <LoadingOverlay />}
    </View>
  );
};

// All Posts Screen
const AllPostsScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/posts?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.message === "Post liked." || response.data.message === "Post unliked.") {
        fetchPosts(); 
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.user_id, username: item.username })}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.postUsername}>{item.username}</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
          <Ionicons name={item.likes.includes('currentUserId') ? "heart" : "heart-outline"} size={24} color="#007AFF" />
          <Text style={styles.likeCount}>{item.likes.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isLoading}
          onRefresh={fetchPosts}
        />
      )}
    </View>
  );
};

// Following Screen
const FollowingScreen = ({ navigation }) => {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFeed();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchFeed();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/feed?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeed(response.data);
    } catch (error) {
      console.error('Fetch feed error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.message === "Post liked." || response.data.message === "Post unliked.") {
        // Update the specific post in the feed instead of refetching all posts
        setFeed(currentFeed => currentFeed.map(post =>
          post.id === postId
            ? {
              ...post, likes: post.likes.includes('currentUserId')
                ? post.likes.filter(id => id !== 'currentUserId')
                : [...post.likes, 'currentUserId']
            }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  const renderFeedItem = ({ item }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.user_id, username: item.username })}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.postUsername}>{item.username}</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
          <Ionicons name={item.likes.includes('currentUserId') ? "heart" : "heart-outline"} size={24} color="#007AFF" />
          <Text style={styles.likeCount}>{item.likes.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <FlatList
          data={feed}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isLoading}
          onRefresh={fetchFeed}
        />
      )}
    </View>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
    fetchUserPosts();
  }, []);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/me/posts?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      {userInfo && (
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInfo.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{userInfo.username}</Text>
          <View style={styles.followInfo}>
            <Text>Followers: {userInfo.follower_count}</Text>
            <Text>Following: {userInfo.following_count}</Text>
          </View>
        </View>
      )}
      <FlatList
        data={userPosts}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Text style={styles.postContent}>{item.content}</Text>
            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
                <Ionicons name={item.likes.includes('currentUserId') ? "heart" : "heart-outline"} size={24} color="#007AFF" />
                <Text style={styles.likeCount}>{item.likes.length}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

// User Profile Screen
const UserProfileScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const [userInfo, setUserInfo] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
    fetchUserPosts();
  }, []);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${userId}/posts?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const method = userInfo.is_following ? 'delete' : 'put';
      const response = await axios[method](`${API_URL}/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.message.includes('followed') || response.data.message.includes('unfollowed')) {
        setUserInfo(prevInfo => ({ ...prevInfo, is_following: !prevInfo.is_following }));
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.message === "Post liked." || response.data.message === "Post unliked.") {
        fetchUserPosts(); 
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      {userInfo && (
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.followInfo}>
            <Text>Followers: {userInfo.follower_count}</Text>
            <Text>Following: {userInfo.following_count}</Text>
          </View>
          <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
            <Text style={styles.followButtonText}>
              {userInfo.is_following ? 'Unfollow' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={userPosts}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Text style={styles.postContent}>{item.content}</Text>
            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
                <Ionicons name={item.likes.includes('currentUserId') ? "heart" : "heart-outline"} size={24} color="#007AFF" />
                <Text style={styles.likeCount}>{item.likes.length}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

// Main Tab Navigator

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'All Posts') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Following') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="All Posts" component={AllPostsScreen} />
    <Tab.Screen
      name="Following"
      component={FollowingScreen}
      listeners={({ navigation }) => ({
        tabPress: e => {
          e.preventDefault();
          navigation.navigate('Following', { screen: 'Following' });
        },
      })}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main App Component
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: true }} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={({ route }) => ({
            title: route.params.username,
            headerShown: true,
            headerBackTitleVisible: false,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007AFF',
    marginTop: 15,
  },
  postContainer: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postUsername: {
    fontWeight: 'bold',
  },
  postContent: {
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 5,
    color: '#007AFF',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  greenButton: {
    backgroundColor: '#4CAF50',
  },
  floatingButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  followInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;