import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Volume2, Clock, Globe, Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeviceConfig {
  ttsVolume: number;
  ttsRate: number;
  defaultLanguage: string;
  recordingTimeout: number;
  autoPlayResponse: boolean;
  showTranscript: boolean;
  kioskMode: boolean;
}

const defaultConfig: DeviceConfig = {
  ttsVolume: 1,
  ttsRate: 0.9,
  defaultLanguage: 'ne',
  recordingTimeout: 30,
  autoPlayResponse: true,
  showTranscript: true,
  kioskMode: false,
};

export default function DeviceSettings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<DeviceConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'device_config')
        .single();

      if (data && !error) {
        setConfig({ ...defaultConfig, ...(data.value as object) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Check if exists first
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'device_config')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: JSON.parse(JSON.stringify(config)),
            category: 'device',
            description: 'Voice device / kiosk configuration settings'
          })
          .eq('key', 'device_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert([{
            key: 'device_config',
            value: JSON.parse(JSON.stringify(config)),
            category: 'device',
            description: 'Voice device / kiosk configuration settings'
          }]);
        if (error) throw error;
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testTTS = () => {
    const utterance = new SpeechSynthesisUtterance(
      config.defaultLanguage === 'ne' 
        ? 'नमस्ते, म कृषि मित्र हुँ।' 
        : 'Hello, I am Krishi Mitra.'
    );
    utterance.volume = config.ttsVolume;
    utterance.rate = config.ttsRate;
    utterance.lang = config.defaultLanguage === 'ne' ? 'ne-NP' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/device')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Device Settings</h1>
              <p className="text-sm text-muted-foreground">Configure voice booth / kiosk</p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Voice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Settings
            </CardTitle>
            <CardDescription>
              Configure text-to-speech output settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{Math.round(config.ttsVolume * 100)}%</span>
              </div>
              <Slider
                value={[config.ttsVolume]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, ttsVolume: value }))}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Speech Rate</Label>
                <span className="text-sm text-muted-foreground">{config.ttsRate}x</span>
              </div>
              <Slider
                value={[config.ttsRate]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, ttsRate: value }))}
                min={0.5}
                max={1.5}
                step={0.1}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-play Response</Label>
                <p className="text-sm text-muted-foreground">Automatically speak AI responses</p>
              </div>
              <Switch
                checked={config.autoPlayResponse}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoPlayResponse: checked }))}
              />
            </div>

            <Button variant="outline" onClick={testTTS}>
              <Volume2 className="h-4 w-4 mr-2" />
              Test Voice
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Settings
            </CardTitle>
            <CardDescription>
              Set default language for voice interaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select
                value={config.defaultLanguage}
                onValueChange={(value) => setConfig(prev => ({ ...prev, defaultLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ne">नेपाली (Nepali)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recording Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recording Settings
            </CardTitle>
            <CardDescription>
              Configure microphone and recording behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Recording Timeout</Label>
                <span className="text-sm text-muted-foreground">{config.recordingTimeout} seconds</span>
              </div>
              <Slider
                value={[config.recordingTimeout]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, recordingTimeout: value }))}
                min={10}
                max={120}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Live Transcript</Label>
                <p className="text-sm text-muted-foreground">Display text while speaking</p>
              </div>
              <Switch
                checked={config.showTranscript}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showTranscript: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Display Mode
            </CardTitle>
            <CardDescription>
              Configure kiosk display behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Kiosk Mode</Label>
                <p className="text-sm text-muted-foreground">Hide navigation and settings access</p>
              </div>
              <Switch
                checked={config.kioskMode}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, kioskMode: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              API keys are managed securely in the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">OpenAI API Key</p>
                  <p className="text-sm text-muted-foreground">For voice AI processing</p>
                </div>
                <span className="text-sm text-success">Configured ✓</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">ElevenLabs API Key</p>
                  <p className="text-sm text-muted-foreground">For high-quality TTS</p>
                </div>
                <span className="text-sm text-success">Configured ✓</span>
              </div>
              <p className="text-sm text-muted-foreground">
                To update API keys, go to the Admin Dashboard → Settings section.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
