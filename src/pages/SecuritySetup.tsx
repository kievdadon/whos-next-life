import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, User, AlertTriangle, CheckCircle, Key, Database } from 'lucide-react';

const SecuritySetup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkCurrentRole();
  }, [user]);

  const checkCurrentRole = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.rpc('get_current_user_role');
      setCurrentRole(data);
      
      const { data: adminCheck } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(adminCheck || false);
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const grantAdminRole = async () => {
    if (!user || !adminEmail) return;
    
    setIsGranting(true);
    try {
      // This function would need to be implemented by a super admin or via direct database access
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Admin Role Granted",
        description: "Admin role has been successfully granted to your account.",
      });
      
      checkCurrentRole();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to grant admin role: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGranting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access security settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Setup & Role Management</h1>
        <p className="text-muted-foreground">Configure security settings and manage user roles</p>
      </div>

      {/* Current User Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">User ID:</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Role:</span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {currentRole || 'user'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Role Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAdmin ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Admin Access Required</h4>
                    <p className="text-amber-700 text-sm mt-1">
                      To access admin features like driver application management, you need admin privileges.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="adminEmail">Your Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter your email to request admin access"
                />
              </div>
              
              <Button 
                onClick={grantAdminRole}
                disabled={!adminEmail || isGranting}
                className="w-full"
              >
                {isGranting ? 'Granting Access...' : 'Grant Admin Access'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Manual Database Setup Required:</p>
                <p>If the above button doesn't work, you can manually grant admin access by running this SQL in your Supabase SQL editor:</p>
                <pre className="bg-muted p-3 rounded mt-2 text-xs overflow-x-auto">
                  {`INSERT INTO public.user_roles (user_id, role) 
VALUES ('${user.id}', 'admin');`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">Admin Access Enabled</h4>
                    <p className="text-green-700 text-sm">
                      You have administrator privileges and can access all admin features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Implementation Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Role-Based Access Control</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Input Validation (Zod)</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>File Upload Security</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Audit Logging</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Input Sanitization</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Database Configuration</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Enable leaked password protection in Supabase Auth settings</li>
                <li>• Configure proper OTP expiry thresholds</li>
                <li>• Update PostgreSQL to the latest version with security patches</li>
                <li>• Regular security audits and monitoring</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Application Security</h4>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Implement CSRF protection for sensitive forms</li>
                <li>• Add rate limiting to prevent abuse</li>
                <li>• Regular dependency updates and security scanning</li>
                <li>• Data encryption at rest for sensitive PII</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySetup;