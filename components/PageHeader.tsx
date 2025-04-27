import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Button, Icon, IconProps, Spinner } from '@ui-kitten/components';
import { theme } from '@/theme/theme';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
  themeMode?: 'light' | 'dark';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  onSave,
  isSubmitting = false,
  themeMode = 'light'
}) => {
  return (
    <Layout style={[styles.header, { backgroundColor: 'transparent' }]}>
      <Button
        appearance="ghost"
        status="basic"
        accessoryLeft={(props) => <Icon {...props} name="arrow-back-outline" />}
        onPress={onBack}
      />
      <Text category="h5" style={styles.headerTitle}>
        {title}
      </Text>
      <Button
        appearance="ghost"
        status="primary"
        onPress={onSave}
        disabled={isSubmitting}
        accessoryLeft={isSubmitting ? (props) => <Spinner size="small" /> : undefined}
      >
        保存
      </Button>
    </Layout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    textAlign: 'center',
  },
});

export default PageHeader; 