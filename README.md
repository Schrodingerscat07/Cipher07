Cipher Creator
Cipher Creator is a web application built with React and Firebase that allows users to create, manage, and use various ciphers to encode and decode messages. Users can sign in with their Google account, save their custom cipher configurations, and share keys with friends to securely exchange messages.

Features
Google Authentication: Securely sign in with your Google account using Firebase Authentication.

User Dashboard: A central place to view, manage, and delete all your saved ciphers.

Cipher Creation:

Linear Shift (Caesar Cipher): Create a simple substitution cipher by shifting the alphabet by a set amount.

Substitution Cipher: Define a custom character-for-character substitution map, either manually or by using a keyword to generate the map.

Shift + Substitution Cipher: Combine both a linear shift and a substitution map for a more complex cipher.

Real-time Database: Ciphers are saved to and fetched from Firestore in real-time.

Encode & Decode:

Encode messages using any of your defined ciphers.

Decode messages received from others directly on your dashboard by pasting the message and the corresponding key.

Shareable Keys: The app automatically generates a key (either a simple number or a JSON object) that you can copy and send to a friend along with your encoded message.

Responsive Design: A clean and responsive user interface built with Tailwind CSS.

Tech Stack
Frontend: React (using functional components and hooks)

Backend & Services:

Firebase Authentication: For Google Sign-In and user management.

Firestore: As the real-time NoSQL database for storing user-specific cipher configurations.

Styling: Tailwind CSS

How It Works
1. Authentication
The application uses Firebase Authentication to manage user sessions. When a user is not logged in, they are prompted to sign in with Google. Once authenticated, their unique userId is used to store and retrieve their personal data from Firestore.

2. Data Storage
Each user's cipher configurations are stored securely in a dedicated collection in Firestore. The path is structured to ensure that users can only access their own data:
/artifacts/{appId}/users/{userId}/ciphers

The application uses onSnapshot to listen for real-time changes, so the dashboard is always up-to-date with the latest saved ciphers.

3. Cipher Logic
Encoding: Based on the selected cipher type and its configuration (shift amount, substitution map, etc.), the application processes a plain text message and converts it into a ciphered message.

Decoding: The process is reversed. For a linear shift, the shift is subtracted. For a substitution, the output map is used to find the corresponding character in the input map.

Keys:

For a Linear Shift, the key is simply the shift amount (e.g., 3).

For Substitution and Shift + Substitution ciphers, the key is a JSON object containing the necessary information (e.g., {"type":"substitution", "keyword":"SECRET"}). This allows the decoding function to reconstruct the exact cipher used for encoding.

Setup and Installation
To run this project locally, you will need to set up a Firebase project.

Prerequisites
Node.js and npm

A Google account for Firebase

Steps
Clone the repository:

git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name

Install dependencies:

npm install

Create a Firebase Project:

Go to the Firebase Console.

Click "Add project" and follow the setup steps.

Once your project is created, go to the Project Settings and add a new Web App.

Copy the firebaseConfig object provided.

Configure Firebase Services:

In the Firebase Console, navigate to Authentication.

Go to the Sign-in method tab and enable Google as a sign-in provider.

Navigate to Firestore Database and create a database. Start in test mode for initial development (but be sure to secure your rules for production).

Set Up Environment:
This application is designed to work in an environment where Firebase configuration variables are injected globally. To simulate this for local development, you can add the following script tag to your public/index.html file, just before the </body> tag:

<script>
  // WARNING: For local development only. Do not expose your config in production builds.
  window.__firebase_config = JSON.stringify({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  });
  window.__app_id = 'your-local-app-id'; // Can be any string for local testing
  // __initial_auth_token is not needed for local testing with Google Sign-In
</script>

Important: Replace the placeholder values with your actual Firebase project configuration.

Start the development server:

npm start

The application should now be running on http://localhost:3000.
