import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const generalSettingsSchema = z.object({
  siteName: z.string().min(2, 'Site name must be at least 2 characters.'),
  siteDescription: z.string().min(10, 'Site description must be at least 10 characters.'),
  articlesPerPage: z.coerce.number().int().min(1).max(50),
  featuredArticlesCount: z.coerce.number().int().min(1).max(10),
  enableComments: z.boolean().default(true),
  requireModeration: z.boolean().default(true),
});

const userSettingsSchema = z.object({
  defaultUserRole: z.enum(['user', 'contributor', 'editor']),
  allowUserRegistration: z.boolean().default(true),
  allowGuestComments: z.boolean().default(false),
});

export default function SettingsPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoadingAuth && user && user.role !== 'admin' && user.role !== 'developer') {
      setLocation('/');
    }
  }, [user, isLoadingAuth, setLocation]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
    return null; // Will redirect in useEffect
  }

  const isDeveloper = user && user.role === 'developer';
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
  });
  
  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: settings?.general?.siteName || 'NewsHub',
      siteDescription: settings?.general?.siteDescription || 'Your trusted source for news',
      articlesPerPage: settings?.general?.articlesPerPage || 10,
      featuredArticlesCount: settings?.general?.featuredArticlesCount || 3,
      enableComments: settings?.general?.enableComments !== false,
      requireModeration: settings?.general?.requireModeration !== false,
    },
  });
  
  const userForm = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      defaultUserRole: settings?.users?.defaultUserRole || 'user',
      allowUserRegistration: settings?.users?.allowUserRegistration !== false,
      allowGuestComments: settings?.users?.allowGuestComments || false,
    },
  });
  
  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      generalForm.reset({
        siteName: settings.general?.siteName || 'NewsHub',
        siteDescription: settings.general?.siteDescription || 'Your trusted source for news',
        articlesPerPage: settings.general?.articlesPerPage || 10,
        featuredArticlesCount: settings.general?.featuredArticlesCount || 3,
        enableComments: settings.general?.enableComments !== false,
        requireModeration: settings.general?.requireModeration !== false,
      });
      
      userForm.reset({
        defaultUserRole: settings.users?.defaultUserRole || 'user',
        allowUserRegistration: settings.users?.allowUserRegistration !== false,
        allowGuestComments: settings.users?.allowGuestComments || false,
      });
    }
  }, [settings, generalForm, userForm]);
  
  const onSubmitGeneral = async (data: z.infer<typeof generalSettingsSchema>) => {
    try {
      await apiRequest('POST', '/api/admin/settings/general', data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Settings updated',
        description: 'General settings have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };
  
  const onSubmitUser = async (data: z.infer<typeof userSettingsSchema>) => {
    try {
      await apiRequest('POST', '/api/admin/settings/users', data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Settings updated',
        description: 'User settings have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="users">User Settings</TabsTrigger>
          {isDeveloper && <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="general">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                <FormField
                  control={generalForm.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your news site that appears in the header.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generalForm.control}
                  name="siteDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A brief description of your site for SEO and the footer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={generalForm.control}
                    name="articlesPerPage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Articles Per Page</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={50} {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of articles to display per page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="featuredArticlesCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Articles Count</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of articles to feature on the homepage.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={generalForm.control}
                  name="enableComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Comments</FormLabel>
                        <FormDescription>
                          Allow users to comment on articles.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generalForm.control}
                  name="requireModeration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Require Comment Moderation</FormLabel>
                        <FormDescription>
                          Comments will require approval before being published.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button type="submit">Save General Settings</Button>
              </form>
            </Form>
          )}
        </TabsContent>
        
        <TabsContent value="users">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-6">
                <FormField
                  control={userForm.control}
                  name="defaultUserRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default User Role</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="user">User</option>
                          <option value="contributor">Contributor</option>
                          <option value="editor">Editor</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        The default role assigned to new users.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userForm.control}
                  name="allowUserRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow User Registration</FormLabel>
                        <FormDescription>
                          Allow new users to register on the site.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userForm.control}
                  name="allowGuestComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Guest Comments</FormLabel>
                        <FormDescription>
                          Allow non-registered users to comment on articles.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button type="submit">Save User Settings</Button>
              </form>
            </Form>
          )}
        </TabsContent>
        
        {isDeveloper && (
          <TabsContent value="advanced">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Changes to these settings can significantly impact the site's performance and functionality.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Cache Management</h3>
                <p className="mb-6 text-sm text-gray-600">Manage the site's cache settings to improve performance.</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Clear All Caches</p>
                      <p className="text-sm text-gray-500">Purge all cached data from the system</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Handle cache clearing
                        apiRequest('POST', '/api/admin/cache/clear', {})
                          .then(() => {
                            toast({
                              title: 'Cache cleared',
                              description: 'All caches have been successfully purged',
                            });
                          })
                          .catch(() => {
                            toast({
                              title: 'Error',
                              description: 'Failed to clear cache',
                              variant: 'destructive',
                            });
                          });
                      }}
                    >
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Database Management</h3>
                <p className="mb-6 text-sm text-gray-600">Manage database operations and maintenance.</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Run Database Maintenance</p>
                      <p className="text-sm text-gray-500">Optimize database tables and clean up old records</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Handle database maintenance
                        apiRequest('POST', '/api/admin/database/maintenance', {})
                          .then(() => {
                            toast({
                              title: 'Maintenance complete',
                              description: 'Database maintenance has been successfully completed',
                            });
                          })
                          .catch(() => {
                            toast({
                              title: 'Error',
                              description: 'Failed to run database maintenance',
                              variant: 'destructive',
                            });
                          });
                      }}
                    >
                      Run Maintenance
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Site Appearance</h3>
                <p className="mb-6 text-sm text-gray-600">Customize the site's appearance and theme.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="w-full h-24 bg-primary rounded-md mb-2"></div>
                    <p className="font-medium text-center">Default Theme</p>
                  </div>
                  <div className="border rounded p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="w-full h-24 bg-gray-800 rounded-md mb-2"></div>
                    <p className="font-medium text-center">Dark Theme</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </AdminLayout>
  );
}
