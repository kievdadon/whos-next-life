import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigate } from 'react-router-dom';
import { Store, Building, Utensils, ShoppingCart, User, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BusinessRegistration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    ownerName: '',
    businessLicense: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const businessTypes = [
    { value: 'clothing', label: 'Clothing Store', icon: Store },
    { value: 'supermarket', label: 'Supermarket', icon: ShoppingCart },
    { value: 'restaurant', label: 'Restaurant', icon: Utensils },
    { value: 'fastfood', label: 'Fast Food Place', icon: Utensils },
    { value: 'personal', label: 'Personal Business', icon: User }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to database
      const { data, error } = await supabase
        .from('business_applications')
        .insert({
          business_name: formData.businessName,
          business_type: formData.businessType,
          contact_name: formData.ownerName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          address: formData.address,
          description: formData.description
        });

      if (error) {
        console.error('Error submitting application:', error);
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your application. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Your business registration has been submitted for review. We'll contact you within 2-3 business days.",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your business registration has been submitted successfully. Our team will review your application and contact you within 2-3 business days.
            </p>
            <Button onClick={() => window.location.href = '/business-marketplace'}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Join Our Business Marketplace
          </h1>
          <p className="text-xl text-purple-200">
            Partner with us to showcase your business and reach new customers
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Business Registration Application</CardTitle>
            <CardDescription className="text-purple-200">
              Fill out the form below to apply for partnership with our marketplace platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-white">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-white">Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-white">Owner/Manager Name *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-white">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="business@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-white">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-white">Business Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  placeholder="123 Business St, City, State 12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicense" className="text-white">Business License Number</Label>
                <Input
                  id="businessLicense"
                  value={formData.businessLicense}
                  onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  placeholder="License number (if applicable)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Business Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 min-h-[120px]"
                  placeholder="Describe your business, products/services, and what makes you unique..."
                />
              </div>

              <div className="bg-purple-900/30 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">What happens next?</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Our team will review your application within 2-3 business days</li>
                  <li>• We'll verify your business information and reach out for any additional details</li>
                  <li>• Once approved, we'll contact you about subscription options and onboarding</li>
                  <li>• You'll gain access to our marketplace platform to showcase your inventory</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !formData.businessName || !formData.businessType || !formData.contactEmail || !formData.contactPhone || !formData.address || !formData.description || !formData.ownerName}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessRegistration;