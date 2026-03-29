console.log('Testing react-native-webview import...');
try {
  require('react-native-webview');
  console.log('SUCCESS: react-native-webview can be imported');
} catch(e) {
  console.log('ERROR:', e.message);
}