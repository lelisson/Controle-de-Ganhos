import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  checkoutUrl,
  refreshAccessFromApi,
  saveStoredToken,
  showTestHint,
} from './lib/subscriptionWeb';

type Props = {
  onActivated: () => void;
};

export default function PaywallScreen({ onActivated }: Props) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setError(null);
    const t = token.trim();
    if (!t) {
      setError('Cole o token que você recebeu após o pagamento.');
      return;
    }
    setBusy(true);
    const { active } = await refreshAccessFromApi(t);
    setBusy(false);
    if (!active) {
      setError('Token inválido ou assinatura inativa. Confira o pagamento ou fale com o suporte.');
      return;
    }
    saveStoredToken(t);
    onActivated();
  }

  function openCheckout() {
    const url = checkoutUrl();
    if (!url) {
      setError('Link de assinatura ainda não configurado (EXPO_PUBLIC_CHECKOUT_URL).');
      return;
    }
    void Linking.openURL(url);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Assinatura</Text>
        <Text style={styles.body}>
          O Medidor de Ganho na web funciona por mensalidade. Após pagar, você recebe um token de acesso
          (por e-mail ou painel) para colar aqui.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={openCheckout} disabled={busy}>
          <Text style={styles.primaryBtnText}>Assinar / pagar mensalidade</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Token de acesso</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Cole seu token aqui"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
          <Pressable style={styles.secondaryBtn} onPress={activate} disabled={busy}>
            <Text style={styles.secondaryBtnText}>{busy ? 'Verificando…' : 'Ativar'}</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {showTestHint() ? (
          <Text style={styles.hint}>
            Ambiente de teste: use o token configurado no servidor (ex.: motorista-teste) se o Docker estiver
            com TEST_ACCESS_TOKEN igual.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#f0f9ff',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
    marginBottom: 14,
  },
  secondaryBtn: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#fecaca',
    marginTop: 12,
    fontSize: 14,
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});
