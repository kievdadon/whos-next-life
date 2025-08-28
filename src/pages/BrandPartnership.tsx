import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Globe, 
  Instagram, 
  Facebook,
  Twitter,
  Handshake
} from 'lucide-react';

const BrandPartnership = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    description: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    partnershipType: '',
    experience: ''
  });

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increased Visibility',
      description: 'Get your brand featured across our platform and reach thousands of potential customers'
    },
    {
      icon: Users,
      title: 'Community Access',
      description: 'Connect directly with our engaged user base and build lasting relationships'
    },
    {
      icon: Star,
      title: 'Premium Features',
      description: 'Access exclusive marketing tools and analytics to grow your business'
    },
    {
      icon: Globe,
      title: 'Digital Presence',
      description: 'Comprehensive online store setup and professional brand representation'
    }
  ];

  const partnershipTypes = [
    'Official Brand Partner',
    'Local Business Partner',
    'Influencer/Creator',
    'Service Provider',
    'Product Supplier'
  ];

  const industries = [
    'Fashion & Clothing',
    'Beauty & Personal Care',
    'Food & Beverage',
    'Health & Wellness',
    'Technology',
    'Home & Lifestyle',
    'Sports & Fitness',
    'Entertainment',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.companyName || !formData.contactName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the data to your backend
    toast({
      title: "Application Submitted!",
      description: "We'll review your application and get back to you within 2-3 business days.",
    });

    // Reset form
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      description: '',
      socialMedia: {
        instagram: '',
        facebook: '',
        twitter: ''
      },
      partnershipType: '',
      experience: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Handshake className="h-12 w-12 text-wellness-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
              Brand Partnership
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our community of trusted brands and grow your business with WHOSENXT. 
            Partner with us to reach new customers and expand your digital presence.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-wellness-primary/10">
                      <Icon className="h-8 w-8 text-wellness-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Application Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6 text-wellness-primary" />
              Partnership Application
            </CardTitle>
            <CardDescription>
              Tell us about your brand and how you'd like to partner with us
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Your business name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Social Media Presence</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      placeholder="@yourbrand"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      placeholder="facebook.com/yourbrand"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter/X
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.socialMedia.twitter}
                      onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                      placeholder="@yourbrand"
                    />
                  </div>
                </div>
              </div>

              {/* Partnership Type */}
              <div className="space-y-2">
                <Label htmlFor="partnershipType">Partnership Type</Label>
                <Select onValueChange={(value) => handleInputChange('partnershipType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="What type of partnership are you interested in?" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnershipTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">About Your Brand</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell us about your brand, products/services, and what makes you unique..."
                  rows={4}
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">Partnership Experience</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="Have you partnered with other platforms before? What are your goals for this partnership?"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-wellness-primary hover:bg-wellness-primary/90 text-white"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Partnership Application
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Our team will review your application and contact you within 2-3 business days
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-wellness-primary/5 border-wellness-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-4">
                Join hundreds of successful brands already partnering with WHOSENXT to grow their business and reach new customers.
              </p>
              <Badge className="bg-wellness-primary text-white">
                Partnership Benefits Include: Store Setup, Marketing Support, Analytics & More
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrandPartnership;