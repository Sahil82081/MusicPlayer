import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Palette, Spacing } from '@/constants/theme';
import Typography from '@/components/common/Typography';
import Button from '@/components/common/Button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={styles.container}>
        <Typography variant="titleLarge" color={Palette.textPrimary} style={styles.title}>
          Screen Not Found
        </Typography>

        <Typography variant="body" color={Palette.textSecondary} align="center" style={styles.subtitle}>
          This offline route does not exist.
        </Typography>

        <Link href="/" asChild>
          <Button variant="primary" title="Return to Aura Music" style={styles.button} />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.md,
  },
});
