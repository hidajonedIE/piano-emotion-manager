
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/contexts/language-context';
import { trpc } from '@/utils/trpc';

export default function LanguageSettings() {
  const { supportedLanguages } = useLanguage();
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>([]);
  const [allEnabled, setAllEnabled] = useState(false);

  const { data, isLoading, refetch } = trpc.language.getPartnerLanguageConfig.useQuery();

  useEffect(() => {
    if (data) {
      setEnabledLanguages(data.supportedLanguages);
      setAllEnabled(data.allLanguagesEnabled);
    }
  }, [data]);

  const updateMutation = trpc.language.updatePartnerSupportedLanguages.useMutation({
    onSuccess: () => refetch(),
  });

  const handleToggleAll = () => {
    const newAllEnabled = !allEnabled;
    setAllEnabled(newAllEnabled);
    updateMutation.mutate({ languages: [], enableAll: newAllEnabled });
  };

  const handleToggleLanguage = (code: string) => {
    const newEnabledLanguages = enabledLanguages.includes(code)
      ? enabledLanguages.filter(lang => lang !== code)
      : [...enabledLanguages, code];
    setEnabledLanguages(newEnabledLanguages);
    updateMutation.mutate({ languages: newEnabledLanguages, enableAll: false });
  };

  if (isLoading) {
    return <ThemedText>Loading...</ThemedText>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Language Settings</ThemedText>
      <View style={styles.row}>
        <ThemedText>Enable All Languages</ThemedText>
        <Switch value={allEnabled} onValueChange={handleToggleAll} />
      </View>
      {!allEnabled && supportedLanguages.map(lang => (
        <View key={lang.code} style={styles.row}>
          <ThemedText>{lang.nativeName}</ThemedText>
          <Switch
            value={enabledLanguages.includes(lang.code)}
            onValueChange={() => handleToggleLanguage(lang.code)}
          />
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
});
