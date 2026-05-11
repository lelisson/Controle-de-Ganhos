import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import MedidorScreen from './MedidorScreen';
import PaywallScreen from './PaywallScreen';
import {
  isSkipPaywall,
  loadStoredToken,
  refreshAccessFromApi,
  requireSubscription,
} from './lib/subscriptionWeb';

export default function App() {
  const needPay = Platform.OS === 'web' && requireSubscription();
  const [ready, setReady] = useState(!needPay);
  const [active, setActive] = useState(!needPay);

  useEffect(() => {
    if (!needPay) return;
    let cancelled = false;
    (async () => {
      if (isSkipPaywall()) {
        if (!cancelled) {
          setActive(true);
          setReady(true);
        }
        return;
      }
      const t = loadStoredToken();
      const ok = t ? (await refreshAccessFromApi(t)).active : false;
      if (!cancelled) {
        setActive(ok);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needPay]);

  if (Platform.OS !== 'web') {
    return <MedidorScreen />;
  }

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0f172a',
        }}
      >
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  if (!active) {
    return <PaywallScreen onActivated={() => setActive(true)} />;
  }

  return <MedidorScreen onLogout={needPay ? () => setActive(false) : undefined} />;
}
