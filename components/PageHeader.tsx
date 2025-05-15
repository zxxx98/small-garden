import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Button, Icon, IconProps, Spinner } from '@ui-kitten/components';
import { theme } from '@/theme/theme';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  onRightClick: () => void;
  rightText?: string;
  rightVisible?: boolean;
  isSubmitting?: boolean;
  themeMode?: 'light' | 'dark';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  onRightClick,
  rightText = '保存',
  rightVisible = true,
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
      {rightVisible ? (
        <Button
          appearance="ghost"
          status="primary"
          onPress={onRightClick}
          disabled={isSubmitting}
          accessoryLeft={isSubmitting ? (props) => <Spinner size="small" /> : undefined}
        >
          {rightText}
        </Button>
      ) : (
        <Layout style={styles.placeholder} />
      )}
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
    flex: 1,
  },
  placeholder: {
    width: 40,
    backgroundColor: 'transparent',
  },
});

export default PageHeader; 