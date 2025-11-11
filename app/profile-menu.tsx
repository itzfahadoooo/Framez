import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function ProfileMenuScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    console.log('handleLogout called');
    
    // Use custom modal for web, native Alert for mobile
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => console.log('Logout cancelled')
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              console.log('Logout button in alert pressed');
              performLogout();
            }
          }
        ],
        { cancelable: true }
      );
    }
  };

  const performLogout = async () => {
    console.log('🔵 performLogout called');
    setShowLogoutModal(false);
    setLoggingOut(true);
    
    try {
      console.log('🔵 Calling logout function...');
      const result = await logout();
      console.log('🔵 Logout result received:', JSON.stringify(result));
      
      if (result.success) {
        console.log('✅ Logout successful! Showing toast and redirecting...');
        
        Toast.show({
          type: 'success',
          text1: 'Logged Out',
          text2: 'You have been successfully logged out',
          position: 'top',
          visibilityTime: 1500,
        });
        
        // Redirect to login immediately
        console.log('🔄 Redirecting to login screen...');
        router.replace('/(auth)/login');
      } else {
        console.log('❌ Logout failed:', result.error);
        setLoggingOut(false);
        Toast.show({
          type: 'error',
          text1: 'Logout Failed',
          text2: result.error || 'An error occurred',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Logout error caught:', error);
      setLoggingOut(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to logout',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const menuItems = [
    {
      icon: 'heart-outline',
      title: 'Liked Posts',
      subtitle: 'See posts you\'ve liked',
      onPress: () => router.push('/liked-posts'),
    },
    {
      icon: 'bookmark-outline',
      title: 'Saved Posts',
      subtitle: 'See your saved posts',
      onPress: () => router.push('/saved-posts'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#000" />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          <View style={styles.logoutContent}>
            {loggingOut ? (
              <>
                <ActivityIndicator size="small" color="#ED4956" />
                <Text style={styles.logoutText}>Logging out...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={24} color="#ED4956" />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Custom Logout Modal for Web */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutModalButton]}
                onPress={performLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 15,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#262626',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  divider: {
    height: 8,
    backgroundColor: '#FAFAFA',
    marginVertical: 10,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ED4956',
    marginLeft: 15,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#262626',
  },
  logoutModalButton: {
    backgroundColor: '#ED4956',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});