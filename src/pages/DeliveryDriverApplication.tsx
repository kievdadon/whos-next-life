import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Shield, User, Phone, MapPin, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DeliveryDriverApplication = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    insuranceProvider: "",
    emergencyContact: "",
    emergencyPhone: "",
    availability: [],
    experience: "",
    agreedToTerms: false
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    driversLicense: null,
    secondaryId: null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'driversLicense' | 'secondaryId', file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
    toast({
      title: "File uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in your first and last name.",
        variant: "destructive"
      });
      return;
    }

    if (!uploadedFiles.driversLicense || !uploadedFiles.secondaryId) {
      toast({
        title: "Error", 
        description: "Please upload both required identification documents.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions.",
        variant: "destructive"
      });
      return;
    }

    // Here would be the backend submission logic
    console.log("Application submitted:", formData, uploadedFiles);
    
    toast({
      title: "Application Submitted!",
      description: "We'll review your application and get back to you within 2-3 business days.",
    });
  };

  const availabilityOptions = [
    "Monday Morning", "Monday Evening", "Tuesday Morning", "Tuesday Evening",
    "Wednesday Morning", "Wednesday Evening", "Thursday Morning", "Thursday Evening",
    "Friday Morning", "Friday Evening", "Saturday", "Sunday"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-wellness-primary/20">
              <Car className="h-8 w-8 text-wellness-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">WHOSENXT Delivery Driver Application</h1>
          <p className="text-muted-foreground">Join our delivery team and start earning money with flexible hours</p>
          <Badge className="mt-2 bg-wellness-primary/20 text-wellness-primary">Applications processed within 48 hours</Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-wellness-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-wellness-primary" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-wellness-primary" />
                Required Identification Documents
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please upload clear, readable copies of both documents
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Driver's License */}
              <div>
                <Label className="text-base font-medium">1. Driver's License * (Required)</Label>
                <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a clear photo of your valid driver's license
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('driversLicense', file);
                      }}
                      className="hidden"
                      id="driversLicense"
                    />
                    <Label htmlFor="driversLicense" className="cursor-pointer">
                      <Button type="button" variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                    </Label>
                    {uploadedFiles.driversLicense && (
                      <p className="text-sm text-wellness-primary mt-2">
                        ✓ {uploadedFiles.driversLicense.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Secondary ID */}
              <div>
                <Label className="text-base font-medium">2. Secondary Identification * (Choose one)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Birth Certificate OR Social Security Card
                </p>
                <div className="mt-2 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload birth certificate or social security card
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('secondaryId', file);
                      }}
                      className="hidden"
                      id="secondaryId"
                    />
                    <Label htmlFor="secondaryId" className="cursor-pointer">
                      <Button type="button" variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                    </Label>
                    {uploadedFiles.secondaryId && (
                      <p className="text-sm text-wellness-primary mt-2">
                        ✓ {uploadedFiles.secondaryId.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-wellness-primary" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vehicleMake">Make *</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                    placeholder="Toyota, Honda, Ford, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleModel">Model *</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                    placeholder="Camry, Civic, F-150, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Year *</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                    placeholder="State Farm, Geico, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-wellness-primary" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="experience">Previous Delivery Experience (Optional)</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="Tell us about any previous delivery or driving experience..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked.toString())}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the terms and conditions *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you agree to our terms of service, privacy policy, and driver requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              className="bg-wellness-primary hover:bg-wellness-primary/90 text-white px-8 py-3"
            >
              Submit Application
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              We'll review your application and contact you within 2-3 business days
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryDriverApplication;