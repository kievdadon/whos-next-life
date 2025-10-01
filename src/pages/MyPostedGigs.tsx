import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, DollarSign, Clock, Briefcase, User, Star } from "lucide-react";

interface Application {
  id: string;
  cover_message: string;
  proposed_rate: number | null;
  estimated_completion_time: string;
  status: string;
  created_at: string;
  applicant_user_id: string;
  worker_profile_id: string;
}

interface WorkerProfile {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  bio: string | null;
  skills: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  rating: number;
  total_jobs_completed: number;
  years_experience: number | null;
  phone: string | null;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number | null;
  budget_type: string;
  urgency: string;
  status: string;
  created_at: string;
  applications?: (Application & { worker_profile: WorkerProfile })[];
}

const MyPostedGigs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPostedGigs();
  }, []);

  const loadPostedGigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch gigs posted by the user
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("posted_by_user_id", user.id)
        .order("created_at", { ascending: false });

      if (gigsError) throw gigsError;

      if (!gigsData || gigsData.length === 0) {
        setGigs([]);
        setLoading(false);
        return;
      }

      // Fetch applications for each gig
      const gigsWithApplications = await Promise.all(
        gigsData.map(async (gig) => {
          const { data: applicationsData, error: appsError } = await supabase
            .from("gig_applications")
            .select("*")
            .eq("gig_id", gig.id)
            .order("created_at", { ascending: false });

          if (appsError) throw appsError;

          // Fetch worker profiles for each application
          if (applicationsData && applicationsData.length > 0) {
            const applicationsWithProfiles = await Promise.all(
              applicationsData.map(async (app) => {
                const { data: profileData, error: profileError } = await supabase
                  .from("worker_profiles")
                  .select("*")
                  .eq("id", app.worker_profile_id)
                  .single();

                if (profileError) {
                  console.error("Error fetching worker profile:", profileError);
                  return { ...app, worker_profile: null };
                }

                return { ...app, worker_profile: profileData };
              })
            );

            return { ...gig, applications: applicationsWithProfiles.filter(app => app.worker_profile) };
          }

          return { ...gig, applications: [] };
        })
      );

      setGigs(gigsWithApplications);
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

  const handleViewProfile = (workerId: string) => {
    navigate(`/worker-profile/${workerId}`);
  };

  const handleMessageApplicant = async (applicantUserId: string, gigId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing conversation
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("seller_id", applicantUserId)
        .eq("gig_id", gigId)
        .maybeSingle();

      if (existingConvo) {
        navigate(`/marketplace-chat?conversation=${existingConvo.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          buyer_id: user.id,
          seller_id: applicantUserId,
          gig_id: gigId,
          subject: "Gig Application Discussion",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/marketplace-chat?conversation=${newConvo.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "accepted": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <p className="text-lg">Loading your posted gigs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/gig-browse")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">My Posted Gigs</h1>
        </div>

        {gigs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg mb-4">You haven't posted any gigs yet</p>
              <Button onClick={() => navigate("/post-gig")}>
                Post Your First Gig
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {gigs.map((gig) => (
              <Card key={gig.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{gig.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 items-center">
                        <Badge variant="outline">{gig.category}</Badge>
                        <Badge variant="outline" className={getStatusColor(gig.status)}>
                          {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {gig.location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {gig.budget_min}
                        {gig.budget_max && `-$${gig.budget_max}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{gig.budget_type}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                      <TabsTrigger value="applications" className="flex-1">
                        Applications ({gig.applications?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">{gig.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {gig.urgency}
                        </span>
                      </div>
                    </TabsContent>

                    <TabsContent value="applications" className="mt-4">
                      {!gig.applications || gig.applications.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No applications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {gig.applications.map((app) => (
                            <Card key={app.id} className="border-2">
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={app.worker_profile?.profile_photo_url || undefined} />
                                    <AvatarFallback>
                                      {app.worker_profile?.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold text-lg">
                                          {app.worker_profile?.full_name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          {app.worker_profile?.rating > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                              {app.worker_profile.rating.toFixed(1)}
                                            </span>
                                          )}
                                          <span>
                                            {app.worker_profile?.total_jobs_completed} jobs completed
                                          </span>
                                        </div>
                                      </div>
                                      <Badge className={getStatusColor(app.status)}>
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                      </Badge>
                                    </div>

                                    {app.worker_profile?.bio && (
                                      <p className="text-sm text-muted-foreground">
                                        {app.worker_profile.bio}
                                      </p>
                                    )}

                                    {app.worker_profile?.skills && app.worker_profile.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {app.worker_profile.skills.slice(0, 5).map((skill) => (
                                          <Badge key={skill} variant="secondary" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                      <p className="text-sm font-semibold">Application Details</p>
                                      {app.cover_message && (
                                        <p className="text-sm text-muted-foreground">
                                          {app.cover_message}
                                        </p>
                                      )}
                                      <div className="flex gap-4 text-sm">
                                        {app.proposed_rate && (
                                          <span className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            ${app.proposed_rate}/hr
                                          </span>
                                        )}
                                        {app.estimated_completion_time && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {app.estimated_completion_time}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleViewProfile(app.worker_profile_id)}
                                      >
                                        View Full Profile
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMessageApplicant(app.applicant_user_id, gig.id)}
                                      >
                                        Message
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostedGigs;
