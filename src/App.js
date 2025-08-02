import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Main App component
function App() {
  // State to manage the current view: 'dashboard' or 'cipherCreator'
  const [currentView, setCurrentView] = useState('dashboard');
  // State to store Firebase authentication and Firestore instances
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  // State to store the current user's ID (Firebase Auth UID)
  const [userId, setUserId] = useState(null);
  // State to indicate if authentication is ready
  const [isAuthReady, setIsAuthReady] = useState(false);
  // State for displaying messages to the user (e.g., login errors)
  const [appMessage, setAppMessage] = useState('');
  // State to manage if a sign-in process is currently active to prevent multiple popups
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      };

      const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'default-app-id';


      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      // Attempt initial sign-in: first with custom token (for Canvas), then anonymously
      const signInInitial = async () => {
      try {
        await signInAnonymously(firebaseAuth);
      } catch (error) {
        console.error("Firebase anonymous sign-in error:", error);
      }
    };

      signInInitial();

      // Set up a listener for authentication state changes
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User signed in:", user.uid);
        } else {
          setUserId(null);
          console.log("User signed out.");
        }
        setIsAuthReady(true); // Mark authentication as ready after initial check
      });

      return () => unsubscribe(); // Cleanup Firebase Auth listener
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setAppMessage("Error initializing Firebase. Please check your console.");
      setIsAuthReady(true);
    }
  }, []); // Runs only once on mount

  // Function to handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (!auth || isSigningIn) {
      if (isSigningIn) {
        setAppMessage("Sign-in process already in progress. Please wait or try again.");
      } else {
        setAppMessage("Firebase Auth not initialized. Please try again.");
      }
      return;
    }

    setIsSigningIn(true);
    setAppMessage('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAppMessage("Successfully signed in with Google!");
    } catch (error) {
      console.error("Google Sign-In error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAppMessage(`Google Sign-In failed: The domain "${window.location.hostname}" is not authorized in your Firebase project. Please add this exact domain in Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAppMessage("Sign-in cancelled: You might have closed the popup or clicked the button multiple times. Please click 'Sign in with Google' once.");
      } else if (error.code === 'auth/popup-blocked') {
        setAppMessage("Sign-in failed: Popup blocked by your browser. Please allow popups for this site and try again.");
      } else {
        setAppMessage(`Google Sign-In failed: ${error.message}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Function to handle user Logout
  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setAppMessage("Signed out successfully.");
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Sign-out error:", error);
      setAppMessage(`Sign-out failed: ${error.message}`);
    }
  };

  // Render loading state until Firebase is ready
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Loading authentication...</div>
      </div>
    );
  }

  // Main application layout
  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Cipher Creator</h1>
        <div className="flex items-center space-x-4">
          {userId ? ( // Show user ID and Logout button if user is logged in
            <>
              <span className="text-gray-600 text-sm">User ID: {userId}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : ( // Show Sign in with Google button if user is not logged in
            <button
              onClick={handleGoogleSignIn}
              disabled={!auth}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md transition-colors flex items-center space-x-2 ${isSigningIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 12.0007c0-.623-.054-1.226-.156-1.812h-10.43v3.571h5.908c-.26 1.385-1.04 2.56-2.227 3.354v2.308h2.977c1.748-1.61 2.756-3.987 2.756-6.421z" fill="#4285F4"></path>
                <path d="M12.245 23.0007c3.153 0 5.8-1.04 7.733-2.834l-2.977-2.308c-.822.544-1.874.869-2.756.869-2.133 0-3.931-1.432-4.588-3.35h-3.085v2.382c1.026 2.02 3.197 3.475 5.673 3.475z" fill="#34A853"></path>
                <path d="M7.657 14.0007c-.206-.544-.323-1.12-.323-1.724s.117-1.18.323-1.724v-2.382h-3.085c-.68 1.34-1.068 2.87-1.068 4.106s.388 2.766 1.068 4.106l3.085-2.382z" fill="#FBBC05"></path>
                <path d="M12.245 5.0007c1.728 0 3.297.66 4.516 1.764l2.648-2.648c-1.83-1.706-4.256-2.816-7.164-2.816-2.476 0-4.647 1.455-5.673 3.475l3.085 2.382c.657-1.918 2.455-3.35 4.588-3.35z" fill="#EA4335"></path>
              </svg>
              <span>{isSigningIn ? 'Signing In...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </header>

      {/* App-level messages */}
      {appMessage && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mx-auto mt-4 max-w-4xl" role="alert">
          <span className="block sm:inline">{appMessage}</span>
        </div>
      )}

      {/* Main content area */}
      <main className="container mx-auto p-6">
        {userId ? ( // If user is logged in, show Dashboard or CipherCreator
          currentView === 'dashboard' ? (
            <Dashboard setCurrentView={setCurrentView} userId={userId} db={db} />
          ) : (
            <CipherCreator setCurrentView={setCurrentView} userId={userId} db={db} />
          )
        ) : ( // If user is not logged in, show welcome message and Google Sign-In button
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto mt-10 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome to Cipher Creator!</h2>
            <p className="text-gray-600 mb-6">Please sign in with your Google account to create and manage your custom ciphers.</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className={`px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium transition-colors flex items-center justify-center space-x-3 mx-auto shadow-lg ${isSigningIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 12.0007c0-.623-.054-1.226-.156-1.812h-10.43v3.571h5.908c-.26 1.385-1.04 2.56-2.227 3.354v2.308h2.977c1.748-1.61 2.756-3.987 2.756-6.421z" fill="#4285F4"></path>
                <path d="M12.245 23.0007c3.153 0 5.8-1.04 7.733-2.834l-2.977-2.308c-.822.544-1.874.869-2.756.869-2.133 0-3.931-1.432-4.588-3.35h-3.085v2.382c1.026 2.02 3.197 3.475 5.673 3.475z" fill="#34A853"></path>
                <path d="M7.657 14.0007c-.206-.544-.323-1.12-.323-1.724s.117-1.18.323-1.724v-2.382h-3.085c-.68 1.34-1.068 2.87-1.068 4.106s.388 2.766 1.068 4.106l3.085-2.382z" fill="#FBBC05"></path>
                <path d="M12.245 5.0007c1.728 0 3.297.66 4.516 1.764l2.648-2.648c-1.83-1.706-4.256-2.816-7.164-2.816-2.476 0-4.647 1.455-5.673 3.475l3.085 2.382c.657-1.918 2.455-3.35 4.588-3.35z" fill="#EA4335"></path>
              </svg>
              <span>{isSigningIn ? 'Signing In...' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// Dashboard Component: Displays a list of user's saved ciphers
function Dashboard({ setCurrentView, userId, db }) {
  const [ciphers, setCiphers] = useState([]);
  const [message, setMessage] = useState(''); // For user messages like "Cipher saved!" or "Cipher deleted!"

  // States for decoding messages (moved from CipherCreator)
  const [cipherTextMessage, setCipherTextMessage] = useState('');
  const [decodeKey, setDecodeKey] = useState('');
  const [decodedMessage, setDecodedMessage] = useState('');
  const [decodeMessage, setDecodeMessage] = useState(''); // Separate message for decode section

  // Helper function to check if a string contains only unique characters
  const hasUniqueChars = (str) => {
    return new Set(str.split('')).size === str.length;
  };

  // Function to generate a substitution map from a keyword (moved from CipherCreator)
  const generateSubstitutionMapFromKeyword = (keyword) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let uniqueChars = '';
    const lowerKeyword = keyword.toLowerCase();

    for (let i = 0; i < lowerKeyword.length; i++) {
      if (alphabet.includes(lowerKeyword[i]) && !uniqueChars.includes(lowerKeyword[i])) {
        uniqueChars += lowerKeyword[i];
      }
    }

    for (let i = 0; i < alphabet.length; i++) {
      if (!uniqueChars.includes(alphabet[i])) {
        uniqueChars += alphabet[i];
      }
    }
    return { inputMap: alphabet, outputMap: uniqueChars };
  };

  // Linear Shift (Caesar Cipher) decoding logic (moved from CipherCreator)
  const linearShiftDecode = (text, shift) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charCode = char.toLowerCase().charCodeAt(0);
      if (charCode >= 97 && charCode <= 122) {
        const isUpperCase = char === char.toUpperCase();
        let shiftedCharCode = ((charCode - 97 - shift + 26 * 2) % 26) + 97; // +26*2 to handle negative results
        result += isUpperCase ? String.fromCharCode(shiftedCharCode).toUpperCase() : String.fromCharCode(shiftedCharCode);
      } else {
        result += char;
      }
    }
    return result;
  };

  // Substitution Cipher decoding logic (moved from CipherCreator)
  const substitutionDecode = (text, inputMap, outputMap) => {
    if (inputMap.length !== outputMap.length || !hasUniqueChars(inputMap) || !hasUniqueChars(outputMap)) {
      setDecodeMessage("Substitution map is invalid for decoding. Input and output maps must have the same length and contain only unique characters.");
      return "";
    }

    const inputMapLower = inputMap.toLowerCase();
    const outputMapLower = outputMap.toLowerCase();
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charLower = char.toLowerCase();
      const index = outputMapLower.indexOf(charLower);

      if (index !== -1) {
        const originalChar = inputMapLower[index];
        result += (char === char.toUpperCase()) ? originalChar.toUpperCase() : originalChar;
      } else {
        result += char;
      }
    }
    return result;
  };

  // Shift + Substitution Cipher decoding logic (moved from CipherCreator)
  const shiftSubstitutionDecode = (text, shift, inputMap, outputMap) => {
    const deSubstitutedText = substitutionDecode(text, inputMap, outputMap);
    if (!deSubstitutedText) return ""; // Propagate error from substitutionDecode
    const deShiftedText = linearShiftDecode(deSubstitutedText, shift);
    return deShiftedText;
  };

  // Handles decoding a message based on the provided key and selected cipher type
  const handleDecode = () => {
    if (cipherTextMessage.trim() === '' || decodeKey.trim() === '') {
      setDecodeMessage('Please enter both the encoded message and the key to decode.');
      return;
    }
    setDecodeMessage(''); // Clear previous messages
    let result = '';
    let usedInputMap = '';
    let usedOutputMap = '';
    let cipherTypeForDecode = ''; // To determine which decode logic to use

    try {
      const parsedKey = JSON.parse(decodeKey);

      cipherTypeForDecode = parsedKey.type;

      if (parsedKey.type === 'linearShift') {
        result = linearShiftDecode(cipherTextMessage, parseInt(parsedKey.shiftAmount) || 0);
      } else if (parsedKey.type === 'substitution' || parsedKey.type === 'shiftSubstitution') {
        if (parsedKey.keyword) {
          const generatedMaps = generateSubstitutionMapFromKeyword(parsedKey.keyword);
          usedInputMap = generatedMaps.inputMap;
          usedOutputMap = generatedMaps.outputMap;
        } else if (parsedKey.inputMap && parsedKey.outputMap) {
          usedInputMap = parsedKey.inputMap;
          usedOutputMap = parsedKey.outputMap;
        } else {
          setDecodeMessage("Invalid decode key for substitution/shift+substitution. Missing keyword or map data.");
          return;
        }

        if (parsedKey.type === 'substitution') {
          result = substitutionDecode(cipherTextMessage, usedInputMap, usedOutputMap);
        } else { // shiftSubstitution
          result = shiftSubstitutionDecode(cipherTextMessage, parseInt(parsedKey.shiftAmount) || 0, usedInputMap, usedOutputMap);
        }
      } else {
        setDecodeMessage("Invalid decode key format or type. Key must be a valid JSON object matching the cipher type.");
        return;
      }
    } catch (e) {
      // If JSON parsing fails, try to interpret the key as a simple number for linear shift
      const numKey = parseInt(decodeKey);
      // If a simple number is provided, assume linear shift
      if (!isNaN(numKey)) {
        result = linearShiftDecode(cipherTextMessage, numKey);
      } else {
        setDecodeMessage("Invalid decode key. Ensure it matches the cipher type (e.g., a number for Linear Shift, or a full JSON for Substitution/Shift+Substitution).");
        return;
      }
    }
    setDecodedMessage(result);
  };

  // Effect hook to fetch ciphers from Firestore in real-time
  useEffect(() => {
    // Only proceed if db and userId are available
    if (!db || !userId) return;

    // Define the collection path for private user data in Firestore
    // This path adheres to Firebase security rules for user-specific data: /artifacts/{appId}/users/{userId}/ciphers
    const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'default-app-id';

    const ciphersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/ciphers`);

    // Set up a real-time listener using onSnapshot
    const unsubscribe = onSnapshot(ciphersCollectionRef, (snapshot) => {
      const fetchedCiphers = snapshot.docs.map(doc => ({
        id: doc.id, // Document ID
        ...doc.data() // All other fields in the document
      }));
      setCiphers(fetchedCiphers); // Update state with fetched ciphers
      console.log("Fetched ciphers:", fetchedCiphers);
    }, (error) => {
      console.error("Error fetching ciphers:", error);
      setMessage("Error loading ciphers. Please try refreshing.");
    });

    // Cleanup function: unsubscribe from the real-time listener when the component unmounts
    return () => unsubscribe();
  }, [db, userId]); // Effect re-runs if db or userId changes

  // Function to handle deleting a cipher from Firestore
  const handleDeleteCipher = async (cipherId) => {
    if (!db || !userId) return; // Ensure db and userId are available
    try {
      const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'default-app-id';

      // Delete the specific document from the user's ciphers collection
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/ciphers`, cipherId));
      setMessage('Cipher deleted successfully!');
      setTimeout(() => setMessage(''), 3000); // Clear the message after 3 seconds
    } catch (error) {
      console.error("Error deleting cipher:", error);
      setMessage('Failed to delete cipher. Please try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto"> {/* Increased max-w to accommodate decode section */}
      <h2 className="text-3xl font-semibold mb-6 text-gray-800 text-center">Your Ciphers</h2>

      {message && ( // Display messages to the user (for general dashboard actions)
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      {/* Button to navigate to the Cipher Creator page */}
      <button
        onClick={() => setCurrentView('cipherCreator')}
        className="w-full bg-blue-600 text-white py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg mb-8"
      >
        Create New Cipher
      </button>

      {/* Display list of saved ciphers or a message if none exist */}
      {ciphers.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mb-8">You haven't created any ciphers yet.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {ciphers.map((cipher) => (
            <div
              key={cipher.id}
              className="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm"
            >
              <div>
                <h3 className="text-xl font-medium text-gray-800">{cipher.name || 'Unnamed Cipher'}</h3>
                <p className="text-gray-600 text-sm">Type: {cipher.type}</p>
              </div>
              <div className="flex space-x-2">
                {/* Button to use/edit a cipher (currently just logs, but could load into creator) */}
                <button
                  onClick={() => {
                    console.log(`Using cipher: ${cipher.name}`);
                    // Ideally, this would load the cipher's configuration into the CipherCreator page
                    setCurrentView('cipherCreator');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                >
                  Use/Edit
                </button>
                {/* Button to delete a cipher */}
                <button
                  onClick={() => handleDeleteCipher(cipher.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section for decoding messages (MOVED HERE) */}
      <div className="p-6 border border-gray-200 rounded-lg">
        <h3 className="text-2xl font-medium mb-4 text-gray-700">Decode Message</h3>
        {decodeMessage && ( // Display messages specific to decode section
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{decodeMessage}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cipherTextMessage" className="block text-gray-700 text-sm font-bold mb-2">Ciphered Message:</label>
            <textarea
              id="cipherTextMessage"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-y"
              placeholder="Paste the encoded message here..."
              value={cipherTextMessage}
              onChange={(e) => setCipherTextMessage(e.target.value)}
            ></textarea>
            <label htmlFor="decodeKey" className="block text-gray-700 text-sm font-bold mb-2 mt-4">Key:</label>
            <input
              type="text"
              id="decodeKey"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Paste the key provided by your friend (e.g., 3 or {'type':'substitution', 'keyword':'SECRET'})"
              value={decodeKey}
              onChange={(e) => setDecodeKey(e.target.value)}
            />
            <button
              onClick={handleDecode}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 transition-colors shadow-md"
            >
              Decode Message
            </button>
          </div>
          <div>
            <label htmlFor="decodedMessage" className="block text-gray-700 text-sm font-bold mb-2">Decoded Message:</label>
            <textarea
              id="decodedMessage"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 bg-gray-50 resize-y"
              readOnly
              value={decodedMessage}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cipher Creator Component: Allows users to define, encode, and decode ciphers
function CipherCreator({ setCurrentView, userId, db }) {
  // State for defining the cipher
  const [cipherName, setCipherName] = useState('');
  const [cipherType, setCipherType] = useState('linearShift'); // Default cipher type
  const [shiftAmount, setShiftAmount] = useState(3); // Default shift for linear shift
  const [substitutionMethod, setSubstitutionMethod] = useState('manual'); // 'manual' or 'keyword'
  const [substitutionKeyword, setSubstitutionKeyword] = useState('secret'); // Default keyword
  const [substitutionMap, setSubstitutionMap] = useState('abcdefghijklmnopqrstuvwxyz'); // Default input map for manual substitution
  const [substitutionMapOutput, setSubstitutionMapOutput] = useState('zyxwuvtsrqponmlkjihgfedcba'); // Default output map for manual substitution

  // State for encoding messages (decode states removed)
  const [plainTextMessage, setPlainTextMessage] = useState('');
  const [encodedMessage, setEncodedMessage] = useState('');
  const [message, setMessage] = useState(''); // General messages to the user (e.g., validation errors)

  // --- Cipher Logic Functions ---

  // Helper function to check if a string contains only unique characters
  const hasUniqueChars = (str) => {
    return new Set(str.split('')).size === str.length;
  };

  // Function to generate a substitution map from a keyword
  const generateSubstitutionMapFromKeyword = (keyword) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let uniqueChars = '';
    const lowerKeyword = keyword.toLowerCase();

    // Add unique characters from the keyword first
    for (let i = 0; i < lowerKeyword.length; i++) {
      if (alphabet.includes(lowerKeyword[i]) && !uniqueChars.includes(lowerKeyword[i])) {
        uniqueChars += lowerKeyword[i];
      }
    }

    // Add remaining unique characters from the alphabet
    for (let i = 0; i < alphabet.length; i++) {
      if (!uniqueChars.includes(alphabet[i])) {
        uniqueChars += alphabet[i];
      }
    }

    // The input map is the standard alphabet
    const inputMap = alphabet;
    // The output map is the generated uniqueChars string
    const outputMap = uniqueChars;

    return { inputMap, outputMap };
  };

  // Linear Shift (Caesar Cipher) encoding logic
  const linearShiftEncode = (text, shift) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charCode = char.toLowerCase().charCodeAt(0);
      // Only shift lowercase letters (ASCII 97-122), preserve original case
      if (charCode >= 97 && charCode <= 122) {
        const isUpperCase = char === char.toUpperCase();
        let shiftedCharCode = ((charCode - 97 + shift) % 26) + 97;
        result += isUpperCase ? String.fromCharCode(shiftedCharCode).toUpperCase() : String.fromCharCode(shiftedCharCode);
      } else {
        result += char; // Keep non-alphabetic characters as is
      }
    }
    return result;
  };

  // Substitution Cipher encoding logic
  const substitutionEncode = (text, inputMap, outputMap) => {
    // Validates substitution maps
    if (inputMap.length !== outputMap.length || !hasUniqueChars(inputMap) || !hasUniqueChars(outputMap)) {
      setMessage("Substitution map is invalid. Input and output maps must have the same length and contain only unique characters.");
      return "";
    }

    const inputMapLower = inputMap.toLowerCase();
    const outputMapLower = outputMap.toLowerCase();
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charLower = char.toLowerCase();
      const index = inputMapLower.indexOf(charLower); // Find character in input map

      if (index !== -1) {
        // If found, substitute with corresponding character from output map, preserving original case
        const substitutedChar = outputMapLower[index];
        result += (char === char.toUpperCase()) ? substitutedChar.toUpperCase() : substitutedChar;
      } else {
        result += char; // Keep character as is if not in map
      }
    }
    return result;
  };

  // Shift + Substitution Cipher encoding logic (combines both)
  const shiftSubstitutionEncode = (text, shift, inputMap, outputMap) => {
    // 1. Apply Linear Shift first
    const shiftedText = linearShiftEncode(text, shift);
    // 2. Then apply Substitution to the shifted text
    const substitutedText = substitutionEncode(shiftedText, inputMap, outputMap);
    return substitutedText;
  };

  // --- Event Handlers ---

  // Handles encoding a message based on the selected cipher type
  const handleEncode = () => {
    if (plainTextMessage.trim() === '') {
      setMessage('Please enter a message to encode.');
      return;
    }
    setMessage(''); // Clear previous messages
    let result = '';
    let currentInputMap = substitutionMap;
    let currentOutputMap = substitutionMapOutput;

    // If keyword-based substitution, generate maps from keyword
    if ((cipherType === 'substitution' || cipherType === 'shiftSubstitution') && substitutionMethod === 'keyword') {
      if (substitutionKeyword.trim() === '') {
        setMessage('Please enter a keyword for substitution.');
        return;
      }
      const generatedMaps = generateSubstitutionMapFromKeyword(substitutionKeyword);
      currentInputMap = generatedMaps.inputMap;
      currentOutputMap = generatedMaps.outputMap;
    }

    if (cipherType === 'linearShift') {
      result = linearShiftEncode(plainTextMessage, parseInt(shiftAmount) || 0);
    } else if (cipherType === 'substitution') {
      result = substitutionEncode(plainTextMessage, currentInputMap, currentOutputMap);
    } else if (cipherType === 'shiftSubstitution') {
      result = shiftSubstitutionEncode(plainTextMessage, parseInt(shiftAmount) || 0, currentInputMap, currentOutputMap);
    }
    setEncodedMessage(result); // Update the encoded message state
  };

  // Handles saving the current cipher definition to Firestore
  const handleSaveCipher = async () => {
    // Ensure Firebase and user are ready for saving
    if (!db || !userId) {
      setMessage("Authentication not ready or user not logged in. Cannot save cipher.");
      return;
    }
    if (cipherName.trim() === '') {
      setMessage("Please give your cipher a name before saving.");
      return;
    }

    // Prepare cipher data object based on the selected cipher type
    const cipherData = {
      name: cipherName,
      type: cipherType,
      createdAt: new Date(), // Timestamp for when the cipher was created
      userId: userId, // Store the user ID to link cipher to the user
    };

    if (cipherType === 'linearShift') {
      cipherData.shiftAmount = parseInt(shiftAmount) || 0;
    } else if (cipherType === 'substitution' || cipherType === 'shiftSubstitution') {
      cipherData.substitutionMethod = substitutionMethod; // Save the method used

      if (substitutionMethod === 'keyword') {
        if (substitutionKeyword.trim() === '') {
          setMessage('Please enter a keyword for substitution.');
          return;
        }
        cipherData.keyword = substitutionKeyword; // Save the keyword
      } else { // manual
        // Validate manual substitution maps
        if (substitutionMap.length === 0 || substitutionMap.length !== substitutionMapOutput.length || !hasUniqueChars(substitutionMap) || !hasUniqueChars(substitutionMapOutput)) {
          setMessage("Manual Substitution map is invalid. Input and output maps must have the same length and contain only unique characters.");
          return;
        }
        cipherData.inputMap = substitutionMap;
        cipherData.outputMap = substitutionMapOutput;
      }

      if (cipherType === 'shiftSubstitution') {
        cipherData.shiftAmount = parseInt(shiftAmount) || 0;
      }
    }

    try {
      // Get the app ID for the Firestore path
      const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'default-app-id';

      // Add the cipher data as a new document to the user's specific collection in Firestore
      const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/ciphers`), cipherData);
      setMessage(`Cipher "${cipherName}" saved successfully with ID: ${docRef.id}`);
      setCipherName(''); // Clear the cipher name input field after saving
      setTimeout(() => setMessage(''), 3000); // Clear the message after 3 seconds
    } catch (error) {
      console.error("Error saving cipher:", error);
      setMessage("Failed to save cipher. Please check your internet connection or Firebase rules.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800 text-center">Cipher Creator</h2>

      {message && ( // Display general messages/errors to the user
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      {/* Button to navigate back to the Dashboard */}
      <button
        onClick={() => setCurrentView('dashboard')}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors mb-6"
      >
        &larr; Back to Dashboard
      </button>

      {/* Section for defining a new cipher */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h3 className="text-2xl font-medium mb-4 text-gray-700">Define Your Cipher</h3>

        {/* Input for Cipher Name */}
        <div className="mb-4">
          <label htmlFor="cipherName" className="block text-gray-700 text-sm font-bold mb-2">Cipher Name:</label>
          <input
            type="text"
            id="cipherName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., My Secret Shift"
            value={cipherName}
            onChange={(e) => setCipherName(e.target.value)}
          />
        </div>

        {/* Dropdown for Cipher Type Selection */}
        <div className="mb-4">
          <label htmlFor="cipherType" className="block text-gray-700 text-sm font-bold mb-2">Cipher Type:</label>
          <select
            id="cipherType"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={cipherType}
            onChange={(e) => setCipherType(e.target.value)}
          >
            <option value="linearShift">Linear Shift (Caesar)</option>
            <option value="substitution">Substitution</option>
            <option value="shiftSubstitution">Shift + Substitution</option>
          </select>
        </div>

        {/* Conditional inputs based on selected Cipher Type */}
        {(cipherType === 'linearShift' || cipherType === 'shiftSubstitution') && (
          <div className="mb-4">
            <label htmlFor="shiftAmount" className="block text-gray-700 text-sm font-bold mb-2">Shift Amount (0-25):</label>
            <input
              type="number"
              id="shiftAmount"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="0"
              max="25"
              value={shiftAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string for clearing input, otherwise parse to int or default to 0
                setShiftAmount(value === '' ? '' : parseInt(value) || 0);
              }}
            />
            <p className="text-xs text-gray-500 mt-1">e.g., 3 for a Caesar cipher (A becomes D)</p>
          </div>
        )}

        {(cipherType === 'substitution' || cipherType === 'shiftSubstitution') && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Substitution Method:</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="substitutionMethod"
                    value="manual"
                    checked={substitutionMethod === 'manual'}
                    onChange={() => setSubstitutionMethod('manual')}
                  />
                  <span className="ml-2 text-gray-700">Manual Map</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="substitutionMethod"
                    value="keyword"
                    checked={substitutionMethod === 'keyword'}
                    onChange={() => setSubstitutionMethod('keyword')}
                  />
                  <span className="ml-2 text-gray-700">Keyword Based</span>
                </label>
              </div>
            </div>

            {substitutionMethod === 'manual' ? (
              <>
                <div className="mb-4">
                  <label htmlFor="substitutionMapInput" className="block text-gray-700 text-sm font-bold mb-2">Input Alphabet (any unique characters):</label>
                  <input
                    type="text"
                    id="substitutionMapInput"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={substitutionMap}
                    onChange={(e) => setSubstitutionMap(e.target.value)}
                    placeholder="e.g., abcdefghijklmnopqrstuvwxyz"
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste any unique characters to define your input alphabet.</p>
                </div>
                <div className="mb-4">
                  <label htmlFor="substitutionMapOutput" className="block text-gray-700 text-sm font-bold mb-2">Output Alphabet (unique characters, corresponding to input):</label>
                  <input
                    type="text"
                    id="substitutionMapOutput"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={substitutionMapOutput}
                    onChange={(e) => setSubstitutionMapOutput(e.target.value)}
                    placeholder="e.g., zyxwvutsrqponmlkjihgfedcba"
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste unique characters that map one-to-one with the input alphabet.</p>
                </div>
              </>
            ) : ( // Keyword Based
              <div className="mb-4">
                <label htmlFor="substitutionKeyword" className="block text-gray-700 text-sm font-bold mb-2">Substitution Keyword:</label>
                <input
                  type="text"
                  id="substitutionKeyword"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={substitutionKeyword}
                  onChange={(e) => setSubstitutionKeyword(e.target.value)}
                  placeholder="e.g., SECRETWORD"
                />
                <p className="text-xs text-gray-500 mt-1">A keyword will be used to generate the substitution alphabet.</p>
              </div>
            )}
          </>
        )}

        {/* Button to save the defined cipher to Firestore */}
        <button
          onClick={handleSaveCipher}
          className="w-full bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 transition-colors shadow-md"
        >
          Save Cipher
        </button>
      </div>

      {/* Section for encoding messages */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h3 className="text-2xl font-medium mb-4 text-gray-700">Encode Message</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plainTextMessage" className="block text-gray-700 text-sm font-bold mb-2">Plain English Message:</label>
            <textarea
              id="plainTextMessage"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-y"
              placeholder="Type your message here..."
              value={plainTextMessage}
              onChange={(e) => setPlainTextMessage(e.target.value)}
            ></textarea>
            <button
              onClick={handleEncode}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              Encode Message
            </button>
          </div>
          <div>
            <label htmlFor="encodedMessage" className="block text-gray-700 text-sm font-bold mb-2">Encoded Message:</label>
            <textarea
              id="encodedMessage"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 bg-gray-50 resize-y"
              readOnly
              value={encodedMessage}
            ></textarea>
            {encodedMessage && (
              <button
                onClick={() => {
                  // Copy encoded message to clipboard
                  const el = document.createElement('textarea');
                  el.value = encodedMessage;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy'); // Deprecated but widely supported for iframes
                  document.body.removeChild(el);
                  setMessage('Encoded message copied to clipboard!');
                  setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
                }}
                className="mt-2 w-full bg-green-500 text-white py-2 rounded-md font-medium hover:bg-green-600 transition-colors shadow-md"
              >
                Copy Encoded Message
              </button>
            )}
            {/* Display the key for sharing with others */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              <p className="font-semibold mb-1">Key to send to your friend:</p>
              <code className="block bg-blue-100 p-2 rounded break-all text-gray-700">
                {/* Dynamically generate key based on cipher type and substitution method */}
                {cipherType === 'linearShift' ?
                  (parseInt(shiftAmount) || 0).toString() :
                  (substitutionMethod === 'keyword' ?
                    JSON.stringify({ type: cipherType, keyword: substitutionKeyword }) :
                    JSON.stringify({ type: cipherType, inputMap: substitutionMap, outputMap: substitutionMapOutput }))
                }
              </code>
              <button
                onClick={() => {
                  // Copy the generated key to clipboard
                  const keyToCopy = cipherType === 'linearShift' ?
                    (parseInt(shiftAmount) || 0).toString() :
                    (substitutionMethod === 'keyword' ?
                      JSON.stringify({ type: cipherType, keyword: substitutionKeyword }) :
                      JSON.stringify({ type: cipherType, inputMap: substitutionMap, outputMap: substitutionMapOutput }));
                  const el = document.createElement('textarea');
                  el.value = keyToCopy;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy'); // Deprecated but widely supported for iframes
                  document.body.removeChild(el);
                  setMessage('Key copied to clipboard!');
                  setTimeout(() => setMessage(''), 3000);
                }}
                className="mt-2 w-full bg-blue-500 text-white py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
              >
                Copy Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


