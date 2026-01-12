import { PermissionsAndroid, Platform } from 'react-native';

export const requestMediaPermissions = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //   PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);

    return Object.values(results).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.warn('Error requesting permissions:', err);
    return false;
  }
};