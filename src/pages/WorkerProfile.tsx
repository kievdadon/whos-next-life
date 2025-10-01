import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Camera, Upload, Star, Briefcase, Clock, DollarSign, Award, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const WorkerProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    profile_photo_url: "",
    date_of_birth: "",
    phone: "",
    bio: "",
    skills: [] as string[],
    hourly_rate_min: "",
    hourly_rate_max: "",
    availability: "",
    years_experience: "",
    portfolio_url: "",
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    loadWorkerProfile();
  }, []);

  const loadWorkerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasProfile(true);
        setProfileData({
          full_name: data.full_name || "",
          profile_photo_url: data.profile_photo_url || "",
          date_of_birth: data.date_of_birth || "",
          phone: data.phone || "",
          bio: data.bio || "",
          skills: data.skills || [],
          hourly_rate_min: data.hourly_rate_min?.toString() || "",
          hourly_rate_max: data.hourly_rate_max?.toString() || "",
          availability: data.availability || "",
          years_experience: data.years_experience?.toString() || "",
          portfolio_url: data.portfolio_url || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((s) => s !== skill),
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

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

      // Delete old photo if exists
      if (profileData.profile_photo_url) {
        const oldPath = profileData.profile_photo_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("worker-profiles")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("worker-profiles")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("worker-profiles")
        .getPublicUrl(filePath);

      setProfileData({
        ...profileData,
        profile_photo_url: publicUrl,
      });

      toast({
        title: "Photo Uploaded!",
        description: "Your profile photo has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profilePayload = {
        user_id: user.id,
        full_name: profileData.full_name,
        profile_photo_url: profileData.profile_photo_url,
        date_of_birth: profileData.date_of_birth || null,
        phone: profileData.phone,
        bio: profileData.bio,
        skills: profileData.skills,
        hourly_rate_min: profileData.hourly_rate_min ? parseFloat(profileData.hourly_rate_min) : null,
        hourly_rate_max: profileData.hourly_rate_max ? parseFloat(profileData.hourly_rate_max) : null,
        availability: profileData.availability,
        years_experience: profileData.years_experience ? parseInt(profileData.years_experience) : null,
        portfolio_url: profileData.portfolio_url,
      };

      const { error } = hasProfile
        ? await supabase
            .from("worker_profiles")
            .update(profilePayload)
            .eq("user_id", user.id)
        : await supabase
            .from("worker_profiles")
            .insert(profilePayload);

      if (error) throw error;

      toast({
        title: "Success!",
        description: hasProfile ? "Profile updated successfully" : "Profile created successfully",
      });
      setHasProfile(true);
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-wellness-primary" />
              Worker Profile
            </CardTitle>
            <CardDescription>
              Create your profile to start applying for gigs. Show potential clients your skills and experience.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={profileData.years_experience}
                    onChange={(e) => setProfileData({ ...profileData, years_experience: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    {profileData.profile_photo_url ? (
                      <AvatarImage src={profileData.profile_photo_url} alt="Profile photo" />
                    ) : (
                      <AvatarFallback className="bg-wellness-primary/10">
                        <Camera className="h-8 w-8 text-wellness-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or WEBP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell potential clients about yourself, your experience, and what makes you great at what you do..."
                  rows={4}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills
              </h3>

              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  placeholder="Add a skill (e.g., Plumbing, Carpentry, Dog Walking)"
                />
                <Button type="button" onClick={handleAddSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Rates & Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rates & Availability
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate_min">Minimum Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate_min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={profileData.hourly_rate_min}
                    onChange={(e) => setProfileData({ ...profileData, hourly_rate_min: e.target.value })}
                    placeholder="25.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate_max">Maximum Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate_max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={profileData.hourly_rate_max}
                    onChange={(e) => setProfileData({ ...profileData, hourly_rate_max: e.target.value })}
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Textarea
                  id="availability"
                  value={profileData.availability}
                  onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
                  placeholder="Monday-Friday 9AM-5PM, Weekends flexible..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio/Website URL</Label>
                <Input
                  id="portfolio_url"
                  value={profileData.portfolio_url}
                  onChange={(e) => setProfileData({ ...profileData, portfolio_url: e.target.value })}
                  placeholder="https://myportfolio.com"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={loading || !profileData.full_name}
                className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : hasProfile ? "Update Profile" : "Create Profile"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/gig-browse")}>
                Back to Gigs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerProfile;