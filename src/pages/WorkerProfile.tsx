import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Camera, Upload, Star, Briefcase, Clock, DollarSign, Award, Plus, X, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const WorkerProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { workerId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
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
    rating: 0,
    total_jobs_completed: 0,
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    loadWorkerProfile();
  }, [workerId]);

  const loadWorkerProfile = async () => {
    try {
      // If workerId is provided, we're viewing someone else's profile
      if (workerId) {
        setIsViewMode(true);
        const { data, error } = await supabase
          .from("worker_profiles")
          .select("*")
          .eq("id", workerId)
          .single();

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
            rating: data.rating || 0,
            total_jobs_completed: data.total_jobs_completed || 0,
          });
        }
        return;
      }

      // Otherwise, load current user's profile for editing
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
          rating: data.rating || 0,
          total_jobs_completed: data.total_jobs_completed || 0,
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

      // Validate required fields
      if (!profileData.full_name) {
        toast({
          title: "Missing Information",
          description: "Please enter your full name",
          variant: "destructive",
        });
        return;
      }

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

      let savedProfile;

      if (hasProfile) {
        const { data, error } = await supabase
          .from("worker_profiles")
          .update(profilePayload)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        savedProfile = data;
      } else {
        const { data, error } = await supabase
          .from("worker_profiles")
          .insert(profilePayload)
          .select()
          .single();

        if (error) throw error;
        savedProfile = data;
      }

      toast({
        title: "Success!",
        description: hasProfile 
          ? "Your worker profile has been updated. Gig posters can now see your updated information." 
          : "Your worker profile has been created! You can now apply to gigs and let posters see your qualifications.",
      });
      
      setHasProfile(true);
      
      // Optional: redirect to gigs after a short delay
      setTimeout(() => {
        toast({
          title: "Ready to Apply!",
          description: "Browse gigs and start applying with your new profile.",
        });
      }, 2000);
      
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
        {isViewMode && (
          <div className="mb-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-wellness-primary" />
              {isViewMode ? "Worker Profile" : "My Worker Profile"}
            </CardTitle>
            <CardDescription>
              {isViewMode 
                ? "View this worker's skills, experience, and qualifications" 
                : "Create your profile to start applying for gigs. Show potential clients your skills and experience."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Header with Photo and Stats */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32">
                {profileData.profile_photo_url ? (
                  <AvatarImage src={profileData.profile_photo_url} alt="Profile photo" />
                ) : (
                  <AvatarFallback className="bg-wellness-primary/10 text-2xl">
                    {profileData.full_name?.charAt(0) || <Camera className="h-12 w-12 text-wellness-primary" />}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{profileData.full_name || "No name provided"}</h2>
                  {isViewMode && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {profileData.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          {profileData.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {profileData.total_jobs_completed} jobs completed
                      </span>
                      {profileData.years_experience && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {profileData.years_experience} years experience
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {profileData.bio && (
                  <div>
                    <h3 className="font-semibold mb-1">About</h3>
                    <p className="text-muted-foreground">{profileData.bio}</p>
                  </div>
                )}

                {!isViewMode && (
                  <div className="space-y-2">
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
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {profileData.skills.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                      {!isViewMode && (
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {!isViewMode && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                      placeholder="Add a skill"
                    />
                    <Button type="button" onClick={handleAddSkill} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Rates & Availability */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rates & Availability
              </h3>
              
              {isViewMode ? (
                <div className="space-y-2 text-sm">
                  {(profileData.hourly_rate_min || profileData.hourly_rate_max) && (
                    <p>
                      <span className="font-medium">Hourly Rate:</span>{" "}
                      ${profileData.hourly_rate_min || "0"} - ${profileData.hourly_rate_max || "0"}/hr
                    </p>
                  )}
                  {profileData.availability && (
                    <p>
                      <span className="font-medium">Availability:</span> {profileData.availability}
                    </p>
                  )}
                  {profileData.portfolio_url && (
                    <p>
                      <span className="font-medium">Portfolio:</span>{" "}
                      <a 
                        href={profileData.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-wellness-primary hover:underline"
                      >
                        {profileData.portfolio_url}
                      </a>
                    </p>
                  )}
                  {profileData.phone && (
                    <p>
                      <span className="font-medium">Phone:</span> {profileData.phone}
                    </p>
                  )}
                </div>
              ) : (
                <>
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

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell potential clients about yourself..."
                      rows={4}
                    />
                  </div>

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
                      placeholder="Monday-Friday 9AM-5PM..."
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
                </>
              )}
            </div>

            {!isViewMode && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerProfile;