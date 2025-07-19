import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, Tablet } from 'lucide-react';

export function IconShowcase() {
  const [selectedSize, setSelectedSize] = useState('512');

  const iconSizes = [
    { size: '512', label: 'App Store', desc: 'Main app icon for stores' },
    { size: '192', label: 'Android', desc: 'Home screen launcher' },
    { size: '180', label: 'iOS', desc: 'iPhone home screen' },
    { size: '152', label: 'iPad', desc: 'iPad home screen' },
    { size: '120', label: 'iPhone', desc: 'iPhone retina display' },
    { size: '76', label: 'iPad Mini', desc: 'iPad mini home screen' },
    { size: '48', label: 'Favicon', desc: 'Browser tab icon' },
    { size: '32', label: 'Desktop', desc: 'Desktop applications' }
  ];

  const platforms = [
    {
      platform: 'iOS App Store',
      sizes: ['1024x1024', '512x512', '180x180', '120x120', '76x76'],
      icon: <Smartphone className="h-5 w-5" />
    },
    {
      platform: 'Google Play Store',
      sizes: ['512x512', '192x192', '144x144', '96x96', '72x72', '48x48'],
      icon: <Smartphone className="h-5 w-5" />
    },
    {
      platform: 'Progressive Web App',
      sizes: ['512x512', '192x192', '152x152', '144x144', '128x128'],
      icon: <Monitor className="h-5 w-5" />
    },
    {
      platform: 'Desktop Applications',
      sizes: ['256x256', '128x128', '64x64', '32x32', '16x16'],
      icon: <Monitor className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2E5A87] mb-2">WizSpeek® Mobile App Icon</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Professional launcher icon designed for all mobile platforms and app stores
        </p>
      </div>

      {/* Main Icon Display */}
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>App Icon Preview</span>
            <Badge variant="outline">SVG Vector Format</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8">
            <div className="relative">
              <img 
                src="/app-icon.svg" 
                alt="WizSpeek® App Icon" 
                className={`w-${selectedSize === '512' ? '64' : selectedSize === '192' ? '48' : '32'} h-${selectedSize === '512' ? '64' : selectedSize === '192' ? '48' : '32'} rounded-2xl shadow-lg`}
                style={{ 
                  width: selectedSize === '512' ? '256px' : selectedSize === '192' ? '192px' : '128px',
                  height: selectedSize === '512' ? '256px' : selectedSize === '192' ? '192px' : '128px'
                }}
              />
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border">
                <span className="text-xs font-medium text-[#2E5A87]">{selectedSize}px</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {iconSizes.map((item) => (
              <Button
                key={item.size}
                variant={selectedSize === item.size ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSize(item.size)}
                className="text-xs"
              >
                {item.size}px
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Icon Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-[#2E5A87] rounded-full"></div>
              <span className="font-medium">Brand Identity</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              WizSpeek® blue gradient with security-focused design elements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-[#00FF88] rounded-full"></div>
              <span className="font-medium">Security Theme</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shield, signal bars, and chat bubbles represent secure messaging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-[#FFD700] rounded-full"></div>
              <span className="font-medium">Speed Indicator</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lightning bolt symbolizes fast, real-time communication
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Requirements */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Platform Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <Card key={platform.platform}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  {platform.icon}
                  <span>{platform.platform}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {platform.sizes.map((size) => (
                    <Badge key={size} variant="secondary" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Design Details</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Format:</strong> SVG vector graphics for scalability</li>
                <li>• <strong>Colors:</strong> WizSpeek® brand palette (#2E5A87, #2B3E54)</li>
                <li>• <strong>Corner Radius:</strong> 120px for 512px icon (23.4% rounded)</li>
                <li>• <strong>Typography:</strong> Arial bold for brand name</li>
                <li>• <strong>Elements:</strong> Chat bubbles, shield, signal bars, lightning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Compliance Features</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Original Design:</strong> 100% custom, legally independent</li>
                <li>• <strong>Brand Safe:</strong> No trademark or copyright conflicts</li>
                <li>• <strong>Universal:</strong> Works across all mobile platforms</li>
                <li>• <strong>Accessibility:</strong> High contrast, clear visibility</li>
                <li>• <strong>Professional:</strong> Enterprise-grade visual quality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Formats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The SVG format can be exported to PNG at any resolution for app store submissions and platform requirements.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              512px PNG
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              192px PNG
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              SVG Source
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              All Sizes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}