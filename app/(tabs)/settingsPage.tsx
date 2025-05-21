import * as React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import {
  Layout,
  Text,
  Toggle,
  Divider,
  Icon,
  IconProps,
  Button,
  Card,
  Modal,
  Input} from '@ui-kitten/components';
import { useTheme } from '../../theme/themeContext';
import { ConfigManager } from '@/models/ConfigManager';
import { FileManager } from '@/models/FileManager';
import { R2Config } from '@/types/config';
import { showMessage } from "react-native-flash-message";
import { DatabaseInstance } from '@/models/sqlite/database';
import LoadingModal from '@/components/LoadingModal';
import { CloudflareR2Manager } from '@/models/CloudflareR2Manager';
import { useRouter } from 'expo-router';
import GradientBackground from '@/components/GradientBackground';

// Icons
const CategoryIcon = (props: IconProps) => <Icon {...props} name="folder-outline" />;
const CemeteryIcon = (props: IconProps) => <Icon {...props} name="alert-triangle-outline" />;
const ActionTypeIcon = (props: IconProps) => <Icon {...props} name="droplet-outline" />;
const CloudIcon = (props: IconProps) => <Icon {...props} name="cloud-upload-outline" />;
const FlowerIcon = (props: IconProps) => <Icon {...props} name="keypad-outline" />;
const TrashIcon2 = (props: IconProps) => <Icon {...props} name="trash-outline" />;
const AreaIcon = (props: IconProps) => <Icon {...props} name="home-outline" />;
const LogIcon = (props: IconProps) => <Icon {...props} name="file-text-outline" />;

// Available icon packs for selection
const iconPacks = [
  { text: 'UI Kitten', value: undefined },
  { text: 'Ionicons', value: 'ionicons' },
  { text: 'Material Community', value: 'materialCommunityIcons' },
  { text: 'Feather', value: 'feather' }
];

const SettingsPage = () => {
  const router = useRouter();
  // Theme context
  const { themeMode, toggleTheme } = useTheme();
  // R2 configuration state
  const [r2ConfigModalVisible, setR2ConfigModalVisible] = React.useState(false);
  const [r2Config, setR2Config] = React.useState<R2Config>({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: ''
  });
  const [useR2Storage, setUseR2Storage] = React.useState(false);
  // PlantNet API key state
  const [plantNetApiKey, setPlantNetApiKey] = React.useState<string>('');
  const [plantNetApiKeyModalVisible, setPlantNetApiKeyModalVisible] = React.useState(false);

  // Load PlantNet API key
  const loadPlantNetApiKey = async () => {
    try {
      const configManager = ConfigManager.getInstance();
      const apiKey = await configManager.getPlantNetApiKey();
      if (apiKey) {
        setPlantNetApiKey(apiKey);
      }
    } catch (error) {
      console.error('Failed to load PlantNet API key:', error);
      showMessage({
        message: '加载PlantNet API key失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
    }
  };

  // Load R2 configuration when the component mounts
  React.useEffect(() => {
    loadR2Config();
    loadPlantNetApiKey();
  }, []);

  // Render main settings section
  const renderMainSection = () => (
    <ScrollView style={styles.container}>
      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>外观</Text>
        <Layout style={styles.settingItem}>
          <Text>暗色模式</Text>
          <Toggle checked={themeMode === 'dark'} onChange={toggleTheme} />
        </Layout>
      </Layout>

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>数据管理</Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/category-management')}
        >
          <Layout style={styles.navItemInner}>
            <CategoryIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">植物类别管理</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除植物类别</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/area-management')}
        >
          <Layout style={styles.navItemInner}>
            <AreaIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">植物区域管理</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除植物区域</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/action-type-management')}
        >
          <Layout style={styles.navItemInner}>
            <ActionTypeIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">行为类型管理</Text>
              <Text appearance="hint" category="p2">添加、编辑或删除自定义行为类型</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/cemetery')}
        >
          <Layout style={styles.navItemInner}>
            <CemeteryIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">植物墓地</Text>
              <Text appearance="hint" category="p2">管理已标记为死亡的植物</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/logs')}
        >
          <Layout style={styles.navItemInner}>
            <LogIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">系统日志</Text>
              <Text appearance="hint" category="p2">查看应用操作记录和系统日志</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={handleClearCache}
        >
          <Layout style={styles.navItemInner}>
            <TrashIcon2 fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">清理图片缓存</Text>
              <Text appearance="hint" category="p2">清理所有已缓存的图片，释放存储空间</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>

        <Button
          appearance="ghost"
          status="danger"
          accessoryLeft={(props) => <Icon {...props} name="refresh-outline" />}
          onPress={() => {
            Alert.alert(
              '重置数据库',
              '确定要重置数据库结构吗？这可能会修复一些应用错误，但不会删除您的数据。',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '确定',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      LoadingModal.show("重置中...");
                      await DatabaseInstance.resetSchema();
                      LoadingModal.hide();
                      showMessage({
                        message: '数据库结构已重置',
                        duration: 1000,
                        type: "success"
                      });
                    } catch (error) {
                      LoadingModal.hide();
                      showMessage({
                        message: '重置失败',
                        duration: 1000,
                        type: "danger"
                      });
                      console.error("Reset schema error:", error);
                    }
                  }
                }
              ]
            );
          }}
          style={styles.navigationButton}
        >
          修复数据库
        </Button>
      </Layout>

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>云存储</Text>
        <Layout style={styles.settingRow}>
          <Layout style={styles.settingInfo}>
            <Text category="s1">使用Cloudflare R2存储</Text>
            <Text appearance="hint" category="p2">将图片保存到云端而非本地设备</Text>
          </Layout>
          <Toggle
            checked={useR2Storage}
            onChange={toggleR2Storage}
            status="primary"
          />
        </Layout>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setR2ConfigModalVisible(true)}
        >
          <Layout style={styles.navItemInner}>
            <CloudIcon fill="#3366FF" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">Cloudflare R2配置</Text>
              <Text appearance="hint" category="p2">设置R2账户信息和访问凭证</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>
      </Layout>

      <Divider />

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>API配置</Text>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setPlantNetApiKeyModalVisible(true)}
        >
          <Layout style={styles.navItemInner}>
            <FlowerIcon fill="#00C781" style={styles.navItemIcon} />
            <Layout style={styles.navItemContent}>
              <Text category="s1">PlantNet API Key</Text>
              <Text appearance="hint" category="p2">设置用于植物识别的API密钥</Text>
            </Layout>
            <Icon name="chevron-right-outline" fill="#8F9BB3" width={24} height={24} />
          </Layout>
        </TouchableOpacity>
      </Layout>

      <Divider />

      <Layout style={styles.section}>
        <Text category="h6" style={styles.sectionTitle}>关于</Text>
        <Layout style={styles.aboutContent}>
          <Text category="s1" style={styles.appName}>小花园应用</Text>
          <Text appearance="hint" category="p2">版本 1.0.4</Text>
          <Text appearance="hint" category="p2" style={styles.copyright}>© 2023 小花园团队</Text>
        </Layout>
      </Layout>
    </ScrollView>
  );

  // Load R2 configuration when the component mounts
  React.useEffect(() => {
    loadR2Config();
    loadPlantNetApiKey();
  }, []);

  // Load R2 configuration
  const loadR2Config = async () => {
    try {
      const configManager = ConfigManager.getInstance();

      // Load toggle state
      const useR2 = await configManager.getUseR2Storage();
      setUseR2Storage(useR2);

      // Load configuration
      const config = await configManager.getR2Config();
      if (config) {
        setR2Config(config);
      }
    } catch (error) {
      console.error('Failed to load R2 configuration:', error);
      showMessage({
        message: '加载R2配置失败',
        duration: 1000,
        type: "warning"
      });
    } finally {
    }
  };

  // Toggle R2 storage
  const toggleR2Storage = async (checked: boolean) => {
    try {
      // If turning on R2, check if we have valid configuration
      if (checked) {
        const configValid = isR2ConfigValid();
        if (!configValid) {
          Alert.alert(
            'R2配置不完整',
            '请先完成Cloudflare R2的配置后再启用',
            [{ text: '确定', onPress: () => setR2ConfigModalVisible(true) }]
          );
          return;
        }
      }

      await ConfigManager.getInstance().setUseR2Storage(checked);
      setUseR2Storage(checked);

      // Update FileManager config
      await FileManager.getInstance().updateStorageConfig();

      showMessage({
        message: `已${checked ? '启用' : '禁用'}Cloudflare R2存储`,
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to toggle R2 storage:', error);
      showMessage({
        message: '更改R2存储设置失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Check if R2 configuration is valid
  const isR2ConfigValid = (): boolean => {
    return !!(
      r2Config.accountId &&
      r2Config.accessKeyId &&
      r2Config.secretAccessKey &&
      r2Config.bucketName
    );
  };

  // Handle saving R2 configuration
  const handleSaveR2Config = async () => {
    if (!r2Config.accountId || !r2Config.accessKeyId ||
      !r2Config.secretAccessKey || !r2Config.bucketName || !r2Config.publicUrl) {
      showMessage({
        message: '请填写所有必填字段',
        duration: 1000,
        type: "warning"
      });
      return;
    }

    try {
      await ConfigManager.getInstance().saveR2Config(r2Config);
      setR2ConfigModalVisible(false);
      showMessage({
        message: 'R2配置已保存',
        duration: 1000,
        type: "success"
      });

      // If R2 storage is enabled, update FileManager config
      if (useR2Storage) {
        await FileManager.getInstance().updateStorageConfig();
      }
    } catch (error) {
      console.error('Failed to save R2 config:', error);
      showMessage({
        message: '保存R2配置失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Render R2 configuration modal
  const renderR2ConfigModal = () => (
    <Modal
      visible={r2ConfigModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setR2ConfigModalVisible(false)}
    >
      <Card
        disabled
        style={[
          styles.r2ConfigModalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>Cloudflare R2配置</Text>

        <ScrollView style={styles.configScrollView}>
          <Text style={styles.fieldLabel} category="s1">Account ID</Text>
          <Input
            placeholder="Account ID"
            value={r2Config.accountId}
            onChangeText={(text) => setR2Config({ ...r2Config, accountId: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Access Key ID</Text>
          <Input
            placeholder="Access Key ID"
            value={r2Config.accessKeyId}
            onChangeText={(text) => setR2Config({ ...r2Config, accessKeyId: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Secret Access Key</Text>
          <Input
            placeholder="Secret Access Key"
            value={r2Config.secretAccessKey}
            onChangeText={(text) => setR2Config({ ...r2Config, secretAccessKey: text })}
            style={styles.input}
            secureTextEntry={true}
          />

          <Text style={styles.fieldLabel} category="s1">Bucket Name</Text>
          <Input
            placeholder="Bucket Name"
            value={r2Config.bucketName}
            onChangeText={(text) => setR2Config({ ...r2Config, bucketName: text })}
            style={styles.input}
          />

          <Text style={styles.fieldLabel} category="s1">Public URL</Text>
          <Input
            placeholder="例如: https://your-domain.com"
            value={r2Config.publicUrl}
            onChangeText={(text) => setR2Config({ ...r2Config, publicUrl: text })}
            style={styles.input}
          />

          <Text appearance="hint" category="c1" style={styles.configHint}>
            这些信息可以在Cloudflare控制台的R2部分找到。您需要创建一个API令牌才能使用此功能。
          </Text>
        </ScrollView>

        <Button onPress={handleSaveR2Config} style={styles.saveButton}>
          保存配置
        </Button>
      </Card>
    </Modal>
  );

  // Handle saving PlantNet API key
  const handleSavePlantNetApiKey = async () => {
    if (!plantNetApiKey.trim()) {
      showMessage({
        message: '请输入PlantNet API Key',
        duration: 1000,
        type: "info"
      });
      return;
    }

    try {
      await ConfigManager.getInstance().setPlantNetApiKey(plantNetApiKey);
      setPlantNetApiKeyModalVisible(false);
      showMessage({
        message: 'PlantNet API Key已保存',
        duration: 1000,
        type: "success"
      });
    } catch (error) {
      console.error('Failed to save PlantNet API key:', error);
      showMessage({
        message: '保存PlantNet API Key失败',
        duration: 1000,
        type: "warning"
      });
    }
  };

  // Render PlantNet API key configuration modal
  const renderPlantNetApiKeyModal = () => (
    <Modal
      visible={plantNetApiKeyModalVisible}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setPlantNetApiKeyModalVisible(false)}
    >
      <Card
        disabled
        style={[
          styles.modalCard,
          { backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(43, 50, 65, 0.98)' }
        ]}
      >
        <Text category="h6" style={styles.modalTitle}>PlantNet API Key</Text>

        <Text style={styles.fieldLabel} category="s1">API Key</Text>
        <Input
          placeholder="请输入API Key"
          value={plantNetApiKey}
          onChangeText={setPlantNetApiKey}
          style={styles.input}
          secureTextEntry={false}
        />

        <Text appearance="hint" category="c1" style={styles.configHint}>
          可在PlantNet官网申请API Key，该功能用于植物识别功能
        </Text>

        <Button onPress={handleSavePlantNetApiKey} style={styles.saveButton}>
          保存
        </Button>
      </Card>
    </Modal>
  );

  // Determine background colors based on theme
  const gradientColors = themeMode === 'light'
    ? ['#F5F5F5', '#F3E5F5', '#F5F5F5'] as const
    : ['#222B45', '#1A2138', '#222B45'] as const;

  // 清理缓存的方法
  const handleClearCache = async () => {
    try {
      LoadingModal.show("正在清理缓存...");

      // 清理R2缓存
      const r2Manager = CloudflareR2Manager.getInstance();
      await r2Manager.clearCache();

      LoadingModal.hide();
      showMessage({
        message: "缓存清理成功",
        description: "已清理所有图片缓存",
        type: "success",
      });
    } catch (error) {
      console.error("清理缓存失败:", error);
      LoadingModal.hide();
      showMessage({
        message: "清理缓存失败",
        description: "请稍后重试",
        type: "danger",
      });
    }
  };

  return (
    <GradientBackground
      colors={gradientColors}
      style={styles.container}>
      <>
        <Layout style={styles.header}>
          <Text category="h1">设置</Text>
        </Layout>
        <ScrollView style={styles.scrollView}>
          {renderMainSection()}
        </ScrollView>
      </>
      {renderR2ConfigModal()}
      {renderPlantNetApiKeyModal()}
    </GradientBackground>
  );
};

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
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  settingInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navItem: {
    paddingVertical: 12,
  },
  navItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navItemIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  navItemContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  appName: {
    marginBottom: 8,
  },
  copyright: {
    marginTop: 16,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  categoryItemActions: {
    flexDirection: 'row',
  },
  categoryActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  deadPlantImageContainer: {
    marginRight: 12,
  },
  deadPlantImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F7F9FC',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  cemeteryEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  cemeteryEmptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  cemeteryEmptyText: {
    textAlign: 'center',
  },
  resurrectText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  resurrectButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  resurrectButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionTypeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  actionTypeIcon: {
    width: 24,
    height: 24
  },
  actionTypeModalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 4,
    maxHeight: 500,
  },
  customImageContainer: {
    marginBottom: 16,
  },
  customImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  customImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  selectLabel: {
    marginBottom: 8,
  },
  select: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  customIconPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  pickImageButton: {
    marginTop: 8,
  },
  r2ConfigModalCard: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 4,
    maxHeight: 500,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 12,
  },
  configHint: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  configScrollView: {
    maxHeight: 380,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  navigationButton: {
    paddingVertical: 12,
  },
});

export default SettingsPage;