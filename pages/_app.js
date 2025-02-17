// pages/_app.js
import { useEffect } from 'react';
import { ToastNotification } from '../components/ToastNotification';
import { AccountVerificationFormProvider } from '../components/AccountVerificationForm';
import '../styles.css';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Trigger the socket.io initialization endpoint when the app loads
    fetch('/api/socketio');
  }, []);

  return (
    <>
      <AccountVerificationFormProvider>
        <Component {...pageProps} />
      </AccountVerificationFormProvider>
      <ToastNotification />
    </>
  );
}
