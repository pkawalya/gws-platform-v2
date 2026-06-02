'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings, User, Building2, Palette, Bell, Globe, Shield, Monitor,
  Moon, Sun, Save, RotateCcw, CheckCircle2, Clock3, Database, RefreshCw, HardDrive, Wifi, WifiOff, Cloud, MapPin, Users, Receipt, FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsPageProps {
  darkMode: boolean
  toggleDarkMode: () => void
}

export function SettingsPage({ darkMode, toggleDarkMode }: SettingsPageProps) {
  const [saved, setSaved] = useState(false)

  // User preferences state
  const [userPrefs, setUserPrefs] = useState(() => {
    if (typeof window === 'undefined') return { name: 'Admin User', email: 'admin@gws.co.ug', role: 'Administrator', timezone: 'Africa/Kampala', language: 'en', dateFormat: 'DD/MM/YYYY' }
    return {
      name: localStorage.getItem('gws-settings-name') || 'Admin User',
      email: localStorage.getItem('gws-settings-email') || 'admin@gws.co.ug',
      role: 'Administrator',
      timezone: localStorage.getItem('gws-settings-timezone') || 'Africa/Kampala',
      language: localStorage.getItem('gws-settings-language') || 'en',
      dateFormat: localStorage.getItem('gws-settings-dateFormat') || 'DD/MM/YYYY',
    }
  })

  // Organization settings
  const [orgSettings, setOrgSettings] = useState(() => {
    if (typeof window === 'undefined') return { name: 'GWS Surveyors Ltd', slug: 'gws-surveyors', country: 'Uganda', currency: 'UGX', vatRate: '18', fiscalYear: 'July-June' }
    return {
      name: localStorage.getItem('gws-settings-orgName') || 'GWS Surveyors Ltd',
      slug: 'gws-surveyors',
      country: localStorage.getItem('gws-settings-country') || 'Uganda',
      currency: localStorage.getItem('gws-settings-currency') || 'UGX',
      vatRate: localStorage.getItem('gws-settings-vatRate') || '18',
      fiscalYear: localStorage.getItem('gws-settings-fiscalYear') || 'July-June',
    }
  })

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(() => {
    if (typeof window === 'undefined') return { emailNotifications: true, pushNotifications: true, approvalAlerts: true, projectUpdates: true, invoiceReminders: true, syncAlerts: false }
    return {
      emailNotifications: localStorage.getItem('gws-settings-emailNotif') !== 'false',
      pushNotifications: localStorage.getItem('gws-settings-pushNotif') !== 'false',
      approvalAlerts: localStorage.getItem('gws-settings-approvalAlerts') !== 'false',
      projectUpdates: localStorage.getItem('gws-settings-projectUpdates') !== 'false',
      invoiceReminders: localStorage.getItem('gws-settings-invoiceReminders') !== 'false',
      syncAlerts: localStorage.getItem('gws-settings-syncAlerts') === 'true',
    }
  })

  const handleSave = () => {
    // Save all settings to localStorage
    localStorage.setItem('gws-settings-name', userPrefs.name)
    localStorage.setItem('gws-settings-email', userPrefs.email)
    localStorage.setItem('gws-settings-timezone', userPrefs.timezone)
    localStorage.setItem('gws-settings-language', userPrefs.language)
    localStorage.setItem('gws-settings-dateFormat', userPrefs.dateFormat)
    localStorage.setItem('gws-settings-orgName', orgSettings.name)
    localStorage.setItem('gws-settings-country', orgSettings.country)
    localStorage.setItem('gws-settings-currency', orgSettings.currency)
    localStorage.setItem('gws-settings-vatRate', orgSettings.vatRate)
    localStorage.setItem('gws-settings-fiscalYear', orgSettings.fiscalYear)
    localStorage.setItem('gws-settings-emailNotif', String(notifPrefs.emailNotifications))
    localStorage.setItem('gws-settings-pushNotif', String(notifPrefs.pushNotifications))
    localStorage.setItem('gws-settings-approvalAlerts', String(notifPrefs.approvalAlerts))
    localStorage.setItem('gws-settings-projectUpdates', String(notifPrefs.projectUpdates))
    localStorage.setItem('gws-settings-invoiceReminders', String(notifPrefs.invoiceReminders))
    localStorage.setItem('gws-settings-syncAlerts', String(notifPrefs.syncAlerts))

    setSaved(true)
    toast.success('Settings saved successfully')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    localStorage.clear()
    toast.success('Settings reset to defaults')
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-slate-500">Manage your account and platform preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />Reset
          </Button>
          <Button size="sm" className={`h-8 text-xs ${saved ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'}`} onClick={handleSave}>
            {saved ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="h-9">
          <TabsTrigger value="profile" className="text-xs">
            <User className="w-3.5 h-3.5 mr-1.5" />Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="text-xs">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />Organization
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            <Palette className="w-3.5 h-3.5 mr-1.5" />Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="w-3.5 h-3.5 mr-1.5" />Notifications
          </TabsTrigger>
          <TabsTrigger value="regional" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1.5" />Regional
          </TabsTrigger>
          <TabsTrigger value="offline" className="text-xs">
            <Database className="w-3.5 h-3.5 mr-1.5" />Offline & Sync
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Profile</CardTitle>
              <CardDescription className="text-xs">Your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
                  {userPrefs.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{userPrefs.name}</p>
                  <p className="text-xs text-slate-500">{userPrefs.role}</p>
                  <Badge variant="outline" className="text-[10px] mt-1 text-emerald-700 border-emerald-200 bg-emerald-50">Active</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input className="h-9 text-xs mt-1" value={userPrefs.name} onChange={e => setUserPrefs({ ...userPrefs, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Email Address</Label>
                  <Input className="h-9 text-xs mt-1" type="email" value={userPrefs.email} onChange={e => setUserPrefs({ ...userPrefs, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input className="h-9 text-xs mt-1 bg-slate-50" value={userPrefs.role} disabled />
                </div>
                <div>
                  <Label className="text-xs">Last Login</Label>
                  <Input className="h-9 text-xs mt-1 bg-slate-50" value={new Date().toLocaleString()} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security</CardTitle>
              <CardDescription className="text-xs">Account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-[11px] text-slate-500">Add an extra layer of security</p>
                  </div>
                </div>
                <Switch checked={false} onCheckedChange={() => toast.info('2FA setup coming soon')} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Clock3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Session Timeout</p>
                    <p className="text-[11px] text-slate-500">Auto-logout after inactivity</p>
                  </div>
                </div>
                <Select value="30" onValueChange={() => {}}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Details</CardTitle>
              <CardDescription className="text-xs">Your company information used across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Organization Name</Label>
                  <Input className="h-9 text-xs mt-1" value={orgSettings.name} onChange={e => setOrgSettings({ ...orgSettings, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Slug</Label>
                  <Input className="h-9 text-xs mt-1 bg-slate-50 font-mono" value={orgSettings.slug} disabled />
                </div>
                <div>
                  <Label className="text-xs">Country</Label>
                  <Select value={orgSettings.country} onValueChange={v => setOrgSettings({ ...orgSettings, country: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                      <SelectItem value="Rwanda">Rwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={orgSettings.currency} onValueChange={v => setOrgSettings({ ...orgSettings, currency: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">VAT Rate (%)</Label>
                  <Input className="h-9 text-xs mt-1" type="number" value={orgSettings.vatRate} onChange={e => setOrgSettings({ ...orgSettings, vatRate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Fiscal Year</Label>
                  <Select value={orgSettings.fiscalYear} onValueChange={v => setOrgSettings({ ...orgSettings, fiscalYear: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="January-December">January - December</SelectItem>
                      <SelectItem value="July-June">July - June</SelectItem>
                      <SelectItem value="April-March">April - March</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theme</CardTitle>
              <CardDescription className="text-xs">Customize how the platform looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${!darkMode ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                  onClick={() => { if (darkMode) toggleDarkMode() }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Light</span>
                    {!darkMode && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="h-16 rounded bg-white border border-slate-200 flex items-center justify-center">
                    <div className="space-y-1 w-full px-2">
                      <div className="h-2 bg-slate-200 rounded w-3/4" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                      <div className="h-2 bg-emerald-200 rounded w-1/3" />
                    </div>
                  </div>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${darkMode ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                  onClick={() => { if (!darkMode) toggleDarkMode() }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium">Dark</span>
                    {darkMode && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="h-16 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <div className="space-y-1 w-full px-2">
                      <div className="h-2 bg-slate-700 rounded w-3/4" />
                      <div className="h-2 bg-slate-800 rounded w-1/2" />
                      <div className="h-2 bg-emerald-800 rounded w-1/3" />
                    </div>
                  </div>
                </button>
              </div>

              <Separator />

              <div>
                <Label className="text-xs">Accent Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[
                    { name: 'Emerald', color: 'bg-emerald-500', active: true },
                    { name: 'Teal', color: 'bg-teal-500', active: false },
                    { name: 'Cyan', color: 'bg-cyan-500', active: false },
                    { name: 'Rose', color: 'bg-rose-500', active: false },
                    { name: 'Orange', color: 'bg-orange-500', active: false },
                  ].map(c => (
                    <button
                      key={c.name}
                      className={`w-8 h-8 rounded-full ${c.color} transition-all ${c.active ? 'ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'}`}
                      title={c.name}
                      onClick={() => toast.info(`${c.name} theme coming soon`)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium">Compact Mode</p>
                  <p className="text-[11px] text-slate-500">Reduce spacing for more content</p>
                </div>
                <Switch checked={false} onCheckedChange={() => toast.info('Compact mode coming soon')} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium">Animations</p>
                  <p className="text-[11px] text-slate-500">Enable smooth transitions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: '📧' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications', icon: '🔔' },
                { key: 'approvalAlerts', label: 'Approval Alerts', desc: 'When an approval requires your action', icon: '✅' },
                { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes on your projects', icon: '📍' },
                { key: 'invoiceReminders', label: 'Invoice Reminders', desc: 'Overdue and upcoming invoice alerts', icon: '💰' },
                { key: 'syncAlerts', label: 'Field Sync Alerts', desc: 'When field data syncs complete or fail', icon: '📱' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                    onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, [item.key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Regional Settings</CardTitle>
              <CardDescription className="text-xs">Localization and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Timezone</Label>
                  <Select value={userPrefs.timezone} onValueChange={v => setUserPrefs({ ...userPrefs, timezone: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Kampala">Africa/Kampala (UTC+3)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                      <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (UTC+3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select value={userPrefs.language} onValueChange={v => setUserPrefs({ ...userPrefs, language: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="lg">Luganda</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date Format</Label>
                  <Select value={userPrefs.dateFormat} onValueChange={v => setUserPrefs({ ...userPrefs, dateFormat: v })}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Number Format</Label>
                  <Input className="h-9 text-xs mt-1 bg-slate-50" value="1,234,567.89 (Ugandan)" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Map Defaults</CardTitle>
              <CardDescription className="text-xs">Default map settings for spatial views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Default Center Latitude</Label>
                  <Input className="h-9 text-xs mt-1" value="0.3476" disabled />
                </div>
                <div>
                  <Label className="text-xs">Default Center Longitude</Label>
                  <Input className="h-9 text-xs mt-1" value="32.5825" disabled />
                </div>
                <div>
                  <Label className="text-xs">Default Zoom Level</Label>
                  <Select value="9" onValueChange={() => {}}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 - Country</SelectItem>
                      <SelectItem value="9">9 - Region</SelectItem>
                      <SelectItem value="11">11 - District</SelectItem>
                      <SelectItem value="13">13 - Parish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Default Map Layer</Label>
                  <Select value="street" onValueChange={() => {}}>
                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="street">Street Map</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="topographic">Topographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline & Sync Tab */}
        <TabsContent value="offline" className="space-y-6">
          <OfflineSyncSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Offline & Sync Settings Component ──
function OfflineSyncSettings() {
  const [offlineEnabled, setOfflineEnabled] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [cacheRetention, setCacheRetention] = useState('7')
  const [cacheClients, setCacheClients] = useState(true)
  const [cacheProjects, setCacheProjects] = useState(true)
  const [cacheInvoices, setCacheInvoices] = useState(true)
  const [cacheDocuments, setCacheDocuments] = useState(false)
  const [cacheStats, setCacheStats] = useState<{ cacheSize: number; lastSyncTime: number | null; queueCount: number } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load cache stats
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { getOfflineDB } = await import('@/lib/offline-db')
      const db = getOfflineDB()
      const stats = await db.getCacheStats()
      setCacheStats(stats)
    } catch (e) {
      console.error('Failed to load cache stats:', e)
    }
  }

  const handleClearCache = async () => {
    try {
      const { getOfflineDB } = await import('@/lib/offline-db')
      const db = getOfflineDB()
      await db.clearAll()
      await loadStats()
      toast.success('Cache cleared successfully')
    } catch (e) {
      toast.error('Failed to clear cache')
    }
  }

  const handleSyncNow = async () => {
    setIsSyncing(true)
    try {
      const { processSyncQueue } = await import('@/lib/offline-fetch')
      const result = await processSyncQueue()
      await loadStats()
      if (result.failed > 0) {
        toast.warning(`Synced ${result.processed} items, ${result.failed} failed`)
      } else {
        toast.success(`Synced ${result.processed} items successfully`)
      }
    } catch (e) {
      toast.error('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const formatTime = (time: number | null) => {
    if (!time) return 'Never'
    return new Date(time).toLocaleString()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Offline Mode</CardTitle>
          <CardDescription className="text-xs">Configure offline capabilities for use in areas with unreliable internet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Enable Offline Mode</p>
                <p className="text-[11px] text-slate-500">Cache data locally for offline access</p>
              </div>
            </div>
            <Switch checked={offlineEnabled} onCheckedChange={setOfflineEnabled} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Auto-Sync</p>
                <p className="text-[11px] text-slate-500">Automatically sync queued operations when back online</p>
              </div>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Cache Retention</p>
                <p className="text-[11px] text-slate-500">How long to keep cached data</p>
              </div>
            </div>
            <Select value={cacheRetention} onValueChange={setCacheRetention}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data to Cache</CardTitle>
          <CardDescription className="text-xs">Choose which data types to store locally</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'clients', label: 'Clients', desc: 'Client directory and details', checked: cacheClients, onChange: setCacheClients, icon: Users },
            { key: 'projects', label: 'Survey Projects', desc: 'Project data and locations', checked: cacheProjects, onChange: setCacheProjects, icon: MapPin },
            { key: 'invoices', label: 'Invoices', desc: 'Financial records', checked: cacheInvoices, onChange: setCacheInvoices, icon: Receipt },
            { key: 'documents', label: 'Documents', desc: 'Document metadata (not files)', checked: cacheDocuments, onChange: setCacheDocuments, icon: FileText },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cache & Sync Status</CardTitle>
          <CardDescription className="text-xs">View and manage your offline data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 text-center border">
              <HardDrive className="w-5 h-5 text-slate-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{cacheStats?.cacheSize || 0}</p>
              <p className="text-[11px] text-slate-500">Cached Items</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 text-center border border-amber-100">
              <Cloud className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{cacheStats?.queueCount || 0}</p>
              <p className="text-[11px] text-slate-500">Pending Sync</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 text-center border border-emerald-100">
              <Clock3 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-bold">{formatTime(cacheStats?.lastSyncTime || null)}</p>
              <p className="text-[11px] text-slate-500">Last Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSyncNow}
              disabled={isSyncing || (cacheStats?.queueCount || 0) === 0}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleClearCache}
            >
              <Database className="w-3.5 h-3.5 mr-1" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
