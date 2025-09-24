import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Users, FileText } from 'lucide-react';

const CommunityGuidelines: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">WHOSENXT Community Guidelines</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Creating a safe, professional, and inclusive marketplace for everyone
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> All content on WHOSENXT is monitored by AI and human moderators. 
          Violations may result in warnings, content removal, or permanent account suspension.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Respect and Professionalism
            </CardTitle>
            <CardDescription>
              Maintain a professional and respectful environment for all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-green-600">✅ Do:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use professional language in all communications</li>
                <li>Provide accurate business and product descriptions</li>
                <li>Treat all users with respect and courtesy</li>
                <li>Report inappropriate behavior through proper channels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-600">❌ Don't:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use offensive, discriminatory, or hateful language</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Share inappropriate or explicit content</li>
                <li>Impersonate other individuals or businesses</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Standards
            </CardTitle>
            <CardDescription>
              Guidelines for business listings, product descriptions, and all platform content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Business Listings</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Provide truthful and accurate business information</li>
                <li>Use appropriate business names and descriptions</li>
                <li>Include valid contact information</li>
                <li>Upload appropriate business imagery</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Product Descriptions</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Describe products accurately and honestly</li>
                <li>Use clear, professional language</li>
                <li>Include relevant product specifications</li>
                <li>Set fair and competitive pricing</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Prohibited Content
            </CardTitle>
            <CardDescription>
              Content that is strictly forbidden on the WHOSENXT platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge variant="destructive">Hate Speech</Badge>
                <p className="text-sm">Content promoting discrimination, hatred, or violence against individuals or groups</p>
              </div>
              <div className="space-y-2">
                <Badge variant="destructive">Harassment</Badge>
                <p className="text-sm">Bullying, threatening, or intimidating behavior toward other users</p>
              </div>
              <div className="space-y-2">
                <Badge variant="destructive">Spam</Badge>
                <p className="text-sm">Repetitive, irrelevant, or unsolicited content</p>
              </div>
              <div className="space-y-2">
                <Badge variant="destructive">Fraud</Badge>
                <p className="text-sm">Deceptive practices, false information, or scam activities</p>
              </div>
              <div className="space-y-2">
                <Badge variant="destructive">Explicit Content</Badge>
                <p className="text-sm">Sexual, violent, or otherwise inappropriate material</p>
              </div>
              <div className="space-y-2">
                <Badge variant="destructive">Illegal Activities</Badge>
                <p className="text-sm">Content promoting or facilitating illegal activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enforcement Actions</CardTitle>
            <CardDescription>
              How we respond to community guideline violations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Warning</h4>
                  <p className="text-sm text-muted-foreground">First-time minor violations receive a warning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Content Removal</h4>
                  <p className="text-sm text-muted-foreground">Inappropriate content will be removed from the platform</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Temporary Suspension</h4>
                  <p className="text-sm text-muted-foreground">3-7 day suspension for repeated or serious violations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-800 mt-2"></div>
                <div>
                  <h4 className="font-semibold">Permanent Ban</h4>
                  <p className="text-sm text-muted-foreground">Permanent removal for severe violations or repeated offenses</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appeal Process</CardTitle>
            <CardDescription>
              How to appeal moderation decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              If you believe a moderation action was taken in error, you can appeal by:
            </p>
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li>Contacting our support team at <strong>support@whosenxt.com</strong></li>
              <li>Providing your account email and details about the disputed action</li>
              <li>Explaining why you believe the action was incorrect</li>
              <li>Waiting for our review team to investigate (typically 2-5 business days)</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 p-6 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          By using WHOSENXT, you agree to follow these community guidelines. 
          We reserve the right to update these guidelines at any time.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default CommunityGuidelines;