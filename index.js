import 'react-native-url-polyfill/auto';
import React, { Component } from 'react';
import { registerRootComponent } from 'expo';
import { LogBox, Text, View, Button, StyleSheet } from 'react-native';

// Import the main App component
import App from './App';

// Import the SimpleApp component for testing (uncomment to use for debugging white screen issues)
// import SimpleApp from './SimpleApp';

// --- ErrorBoundary Component ---
// This component will catch JavaScript errors anywhere in its child component tree,
// log those errors, and display a fallback UI instead of the component tree that crashed.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in App:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // This is a simple way to attempt a reload.
    // For a more robust solution, you might need to involve native capabilities
    // or use a library like expo-updates.
    // For now, we'll just reset the error state, which might allow the app to retry rendering.
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Ideally, you'd re-register the root component or force a reload.
    // As a simple measure, we can try to force a re-render by re-registering.
    // Note: This might not always work as expected for all types of errors.
    // registerRootComponent(AppWithBoundary); // Re-registering the app might be too aggressive or cause issues.
                                          // A better approach for web might be window.location.reload();
                                          // For native, a library like expo-updates might be needed.
                                          // For now, just resetting state.
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
          <Text style={styles.errorMessage}>
            We encountered an error and are working to fix it. Please try reloading the app.
          </Text>
          {this.state.error && (
            <Text style={styles.errorDetails}>
              Error: {this.state.error.toString()}
            </Text>
          )}
          {/* 
          // Uncomment to display more detailed error info for debugging
          {this.state.errorInfo && (
            <Text style={styles.errorDetails}>
              Component Stack: {this.state.errorInfo.componentStack}
            </Text>
          )}
          */}
          <Button title="Reload App" onPress={this.handleReload} color="#007AFF" />
        </View>
      );
    }

    return this.props.children; 
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8d7da', // Light red background for errors
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#721c24', // Dark red text
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#721c24',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: '#721c24',
    textAlign: 'left',
    alignSelf: 'stretch',
    backgroundColor: '#f5c6cb',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    maxHeight: 200, // Limit height for long error messages
  },
});

// --- End ErrorBoundary Component ---


// Ignore specific warnings that might be caused by dependencies
LogBox.ignoreLogs([
  'Asyncstorage has been extracted from react-native', // Common warning in Expo
  'Constants.manifest', // Related to Expo updates/manifest
  'The provided value \'moz', // Often related to react-native-web
  'The provided value \'ms-stream', // Often related to react-native-web
  'Setting a timer', // Can be noisy, especially with long-running tasks or animations
  'Possible Unhandled Promise Rejection', // Useful for debugging, but can be ignored if handled elsewhere
  'EMFILE: too many open files, watch', // Metro bundler issue on some systems
]);

// --- Debugging Instructions ---
// If you are seeing a white screen or the app crashes immediately:
// 1. Uncomment the `SimpleApp` import above.
// 2. Comment out the `App` import above.
// 3. Change `registerRootComponent(AppWithBoundary)` to `registerRootComponent(SimpleApp)` below.
// This will load a very basic component. If `SimpleApp` works, the issue is likely within the main `App` component or its children.
// Check the console logs in your browser (for web) or Metro bundler terminal for errors.

const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register the main application component, wrapped with an ErrorBoundary
registerRootComponent(AppWithBoundary);

// To test with SimpleApp (for debugging white screen issues):
// 1. Uncomment the SimpleApp import: `import SimpleApp from './SimpleApp';`
// 2. Comment out the App import: `// import App from './App';`
// 3. Comment out `registerRootComponent(AppWithBoundary);`
// 4. Uncomment the line below:
// registerRootComponent(SimpleApp);
