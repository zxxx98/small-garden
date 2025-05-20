import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Layout, Text, Icon, Button } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { rootStore } from '@/stores/RootStore';
import { useTheme } from '@/theme/themeContext';
import GradientBackground from '@/components/GradientBackground';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { showMessage } from 'react-native-flash-message';

const LogsPage = observer(() => {
  const router = useRouter();
  const { themeMode } = useTheme();
  const [logs, setLogs] = React.useState(rootStore.logStore.logs);

  // 加载日志
  React.useEffect(() => {
    rootStore.logStore.loadLogs();
  }, []);

  // 清空日志
  const handleClearLogs = () => {
    rootStore.logStore.clearLogs();
    setLogs([]);
    showMessage({
      message: '日志已清空',
      type: 'success',
      duration: 2000,
    });
  };

  // 渲染日志项
  const renderLogItem = (log: any) => {
    const date = new Date(log.timestamp);
    const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });

    return (
      <Layout key={log.id} style={styles.logItem}>
        <Layout style={styles.logHeader}>
          <Text category="s1">{log.message}</Text>
          <Text appearance="hint" category="c1">{formattedDate}</Text>
        </Layout>
        {log.details && (
          <Text appearance="hint" category="p2" style={styles.logDetails}>
            {JSON.stringify(log.details, null, 2)}
          </Text>
        )}
      </Layout>
    );
  };

  return (
    <GradientBackground
      colors={themeMode === 'light'
        ? ['#F5F5F5', '#E8F5E9', '#F5F5F5']
        : ['#222B45', '#1A2138', '#222B45']}
      style={styles.container}
    >
      <Layout style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" style={styles.backIcon} fill="#3366FF" />
        </TouchableOpacity>
        <Text category="h1">系统日志</Text>
        <Button
          size="small"
          status="danger"
          onPress={handleClearLogs}
          accessoryLeft={(props) => <Icon {...props} name="trash-outline" />}
        >
          清空
        </Button>
      </Layout>

      <ScrollView style={styles.content}>
        {logs.length === 0 ? (
          <Layout style={styles.emptyContainer}>
            <Text appearance="hint">暂无日志记录</Text>
          </Layout>
        ) : (
          logs.map(renderLogItem)
        )}
      </ScrollView>
    </GradientBackground>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  logDetails: {
    marginTop: 8,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
});

export default LogsPage; 