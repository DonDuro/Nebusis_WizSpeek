import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Palette, 
  Image, 
  Database, 
  Accessibility, 
  Globe, 
  HelpCircle, 
  RefreshCw,
  Users,
  Shield,
  Bell,
  Camera,
  Upload,
  Trash2,
  Eye,
  Volume2,
  Contrast,
  Type,
  Smartphone
} from 'lucide-react';
import { User as UserType } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [voiceEnhancement, setVoiceEnhancement] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const themes = [
    { id: 'blue', name: 'WizSpeek® Blue', color: '#2E5A87' },
    { id: 'dark', name: 'Midnight Pro', color: '#1a1a1a' },
    { id: 'ocean', name: 'Ocean Depths', color: '#0f4c75' },
    { id: 'forest', name: 'Forest Secure', color: '#2d5016' },
    { id: 'sunset', name: 'Sunset Glow', color: '#8b4513' },
    { id: 'royal', name: 'Royal Purple', color: '#663399' }
  ];

  const wallpapers = [
    { id: 'default', name: 'WizSpeek® Default', preview: 'Linear gradient' },
    { id: 'geometric', name: 'Geometric Patterns', preview: 'Abstract shapes' },
    { id: 'particles', name: 'Particle Flow', preview: 'Animated dots' },
    { id: 'waves', name: 'Digital Waves', preview: 'Flowing lines' },
    { id: 'minimal', name: 'Minimal Clean', preview: 'Simple texture' },
    { id: 'cyberpunk', name: 'Cyber Grid', preview: 'Neon grid' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2E5A87]">
            WizSpeek® Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Groups</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
            <TabsTrigger value="wallpapers" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Backgrounds</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-1">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Access</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 overflow-y-auto max-h-[60vh]">
            {/* Profile & Avatar Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile & Avatar Creator</h3>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || user.avatar} />
                      <AvatarFallback className="text-xl">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={user.username} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={user.email} />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Selfie
                  </Button>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Generate Avatar
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Privacy Controls</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Show Online Status</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Allow Profile Views</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SecureLink™ Notifications</Label>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Groups Management Tab */}
            <TabsContent value="groups" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">People & Groups Manager</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Group Controls</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Create SecureGroup™
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Group Privacy
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Bell className="h-4 w-4 mr-2" />
                        Group Notifications
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Contact Management</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Invite to WizSpeek®
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Block Management
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Group Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Auto-join Groups</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Admin Message Priority</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Group Media Auto-download</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Themes Tab */}
            <TabsContent value="themes" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">WizSpeek® Theme Studio</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTheme === theme.id
                          ? 'border-[#2E5A87] bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      <div
                        className="w-full h-16 rounded-md mb-2"
                        style={{ backgroundColor: theme.color }}
                      />
                      <h4 className="font-medium text-sm">{theme.name}</h4>
                      {selectedTheme === theme.id && (
                        <Badge className="mt-1">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Theme Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Auto Dark Mode</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>System Theme Sync</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Theme Animations</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Wallpapers Tab */}
            <TabsContent value="wallpapers" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Chat Backgrounds</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wallpapers.map((wallpaper) => (
                    <div
                      key={wallpaper.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedWallpaper === wallpaper.id
                          ? 'border-[#2E5A87] bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWallpaper(wallpaper.id)}
                    >
                      <div className="w-full h-16 rounded-md mb-2 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-sm">{wallpaper.name}</h4>
                      <p className="text-xs text-gray-500">{wallpaper.preview}</p>
                      {selectedWallpaper === wallpaper.id && (
                        <Badge className="mt-1">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Custom
                  </Button>
                  <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-2" />
                    Create Gradient
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Storage & Data Tab */}
            <TabsContent value="storage" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Storage & Data Management</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">Storage Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Messages</span>
                        <span>2.3 GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Media Files</span>
                        <span>1.8 GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Voice Notes</span>
                        <span>450 MB</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Used</span>
                        <span>4.55 GB / 15 GB</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Manage Media
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Data
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Auto-backup</Label>
                        <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Data Sync</Label>
                        <Switch checked={dataSync} onCheckedChange={setDataSync} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Media Auto-download</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Accessibility Tab */}
            <TabsContent value="accessibility" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Accessibility & Comfort</h3>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Visual Accessibility</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>High Contrast Mode</Label>
                        <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Large Text</Label>
                        <Switch checked={largeText} onCheckedChange={setLargeText} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Screen Reader Support</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Audio & Voice</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Voice Enhancement</Label>
                        <Switch checked={voiceEnhancement} onCheckedChange={setVoiceEnhancement} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Audio Descriptions</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Vibration Alerts</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Interaction</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Tap to Speak</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Voice Commands</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Gesture Navigation</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Language & Region</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language-select">App Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language-select">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Regional Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Auto-detect Language</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>24-hour Time Format</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Regional Number Format</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Translation</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Auto-translate Messages</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Translation Suggestions</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Help Tab */}
            <TabsContent value="help" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Help & Support</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Getting Started</h4>
                    <Button variant="outline" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      WizSpeek® Tutorial
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Group Management
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Support</h4>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">App Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>WizSpeek® v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Build:</span>
                      <span>2025.01.07</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span>Progressive Web App</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Updates
                    </Button>
                    <Button variant="outline" size="sm">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#2E5A87] hover:bg-[#2B3E54]">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}