import React from 'react'
import PageLinks from './utils/PageLinks'
import { AuthProvider } from './context/AuthContext';


const App = () => {
  return (
    <AuthProvider>
      <PageLinks />
    </AuthProvider>
  );
};

export default App
