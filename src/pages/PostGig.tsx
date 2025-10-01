import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Camera, X, DollarSign, MapPin, Plus } from "lucide-react";

const PostGig = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gigData, setGigData] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    budget_type: "per hour",
    location: "",
    duration_estimate: "",
    urgency: "Next Week",
    requirements: [] as string[],
    image_urls: [] as string[],
  });
  const [newRequirement, setNewRequirement] = useState("");

  const categories = [
    "Home Repair",
    "Moving Help",
    "Tech Support",
    "Photography",
    "Pet Care",
    "Cleaning",
    "Landscaping",
    "Tutoring",
    "Event Help",
    "Delivery",
    "Other",
  ];

  const urgencyOptions = ["ASAP", "This Weekend", "Next Week", "This Month", "Flexible"];

  const handleAddRequirement = () => {
    if (newRequirement.trim() && !gigData.requirements.includes(newRequirement.trim())) {
      setGigData({
        ...gigData,
        requirements: [...gigData.requirements, newRequirement.trim()],
      });
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (requirement: string) => {
    setGigData({
      ...gigData,
      requirements: gigData.requirements.filter((r) => r !== requirement),
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or WEBP image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload image
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gig-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("gig-images")
        .getPublicUrl(filePath);

      setGigData({
        ...gigData,
        image_urls: [...gigData.image_urls, publicUrl],
      });

      toast({
        title: "Image Uploaded!",
        description: "Your gig image has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setGigData({
      ...gigData,
      image_urls: gigData.image_urls.filter((url) => url !== imageUrl),
    });
  };

  const handlePostGig = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to post a gig",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Validate required fields
      if (!gigData.title || !gigData.description || !gigData.category || !gigData.budget_min || !gigData.location) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const gigPayload = {
        posted_by_user_id: user.id,
        title: gigData.title,
        description: gigData.description,
        category: gigData.category,
        budget_min: parseFloat(gigData.budget_min),
        budget_max: gigData.budget_max ? parseFloat(gigData.budget_max) : null,
        budget_type: gigData.budget_type,
        location: gigData.location,
        duration_estimate: gigData.duration_estimate,
        urgency: gigData.urgency,
        requirements: gigData.requirements,
        status: "open",
        image_url: gigData.image_urls[0] || null,
        image_urls: gigData.image_urls,
      };

      const { error } = await supabase
        .from("gigs")
        .insert(gigPayload);

      if (error) throw error;

      toast({
        title: "Gig Posted!",
        description: "Your gig has been posted successfully. People can now apply!",
      });

      navigate("/gig-browse");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/gig-browse")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gigs
          </Button>
          <h1 className="text-3xl font-bold">Post a Gig</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a New Gig</CardTitle>
            <CardDescription>
              Describe what you need help with and find the right person for the job
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Gig Title *</Label>
                <Input
                  id="title"
                  value={gigData.title}
                  onChange={(e) => setGigData({ ...gigData, title: e.target.value })}
                  placeholder="e.g., Help me move furniture this weekend"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={gigData.description}
                  onChange={(e) => setGigData({ ...gigData, description: e.target.value })}
                  placeholder="Provide detailed information about what you need done..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={gigData.category} onValueChange={(value) => setGigData({ ...gigData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={gigData.urgency} onValueChange={(value) => setGigData({ ...gigData, urgency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location & Duration */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={gigData.location}
                    onChange={(e) => setGigData({ ...gigData, location: e.target.value })}
                    placeholder="e.g., Downtown, Suburbs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_estimate">Duration Estimate</Label>
                  <Input
                    id="duration_estimate"
                    value={gigData.duration_estimate}
                    onChange={(e) => setGigData({ ...gigData, duration_estimate: e.target.value })}
                    placeholder="e.g., 2-3 hours, 1 day"
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Minimum Budget ($) *</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={gigData.budget_min}
                    onChange={(e) => setGigData({ ...gigData, budget_min: e.target.value })}
                    placeholder="25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_max">Maximum Budget ($)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={gigData.budget_max}
                    onChange={(e) => setGigData({ ...gigData, budget_max: e.target.value })}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_type">Budget Type</Label>
                  <Select value={gigData.budget_type} onValueChange={(value) => setGigData({ ...gigData, budget_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per hour">Per Hour</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="per day">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Requirements</h3>

              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddRequirement()}
                  placeholder="Add a requirement (e.g., Own tools, Experience required)"
                />
                <Button type="button" onClick={handleAddRequirement} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {gigData.requirements.map((req) => (
                  <Badge key={req} variant="secondary" className="text-sm">
                    {req}
                    <button
                      onClick={() => handleRemoveRequirement(req)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gig Images (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Upload images to show what needs to be done
              </p>

              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              {gigData.image_urls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gigData.image_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gig image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(url)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePostGig}
                disabled={loading}
                className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90"
              >
                {loading ? "Posting..." : "Post Gig"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/gig-browse")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostGig;