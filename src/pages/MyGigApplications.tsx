import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, DollarSign, MapPin, Calendar, MessageCircle } from "lucide-react";

interface Application {
  id: string;
  cover_message: string;
  proposed_rate: number | null;
  estimated_completion_time: string | null;
  status: string;
  created_at: string;
  gig_id: string;
}

interface GigDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number | null;
  budget_type: string;
  urgency: string;
  posted_by_user_id: string;
}

const MyGigApplications = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<(Application & { gig: GigDetails })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch applications with gig details
      const { data: applicationsData, error } = await supabase
        .from("gig_applications")
        .select(`
          id,
          cover_message,
          proposed_rate,
          estimated_completion_time,
          status,
          created_at,
          gig_id
        `)
        .eq("applicant_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch gig details for each application
      const gigIds = applicationsData.map(app => app.gig_id);
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .in("id", gigIds);

      if (gigsError) throw gigsError;

      // Combine applications with gig details
      const combinedData = applicationsData.map(app => {
        const gig = gigsData?.find(g => g.id === app.gig_id);
        return {
          ...app,
          gig: gig || {
            id: app.gig_id,
            title: "Gig Not Found",
            description: "",
            category: "",
            location: "",
            budget_min: 0,
            budget_max: null,
            budget_type: "per hour",
            urgency: "",
            posted_by_user_id: "",
          }
        };
      });

      setApplications(combinedData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default: // pending
        return "bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleMessagePoster = async (gigId: string, posterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if conversation exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("gig_id", gigId)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (existingConversation) {
        navigate(`/marketplace-chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          buyer_id: user.id,
          seller_id: posterId,
          gig_id: gigId,
          subject: "Regarding your gig application",
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/marketplace-chat/${newConversation.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/gig-browse")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gigs
          </Button>
          <h1 className="text-3xl font-bold">My Applications</h1>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                You haven't applied to any gigs yet.
              </p>
              <Button onClick={() => navigate("/gig-browse")} className="bg-wellness-primary hover:bg-wellness-primary/90">
                Browse Available Gigs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{application.gig.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                        <Badge variant="outline" className="border-wellness-primary/20">
                          {application.gig.category}
                        </Badge>
                        <Badge variant="outline" className="border-wellness-accent/20">
                          {application.gig.urgency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Gig Details */}
                  <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-border/30">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-wellness-primary" />
                      <span>
                        ${application.gig.budget_min}
                        {application.gig.budget_max && `-$${application.gig.budget_max}`} {application.gig.budget_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-wellness-secondary" />
                      <span>{application.gig.location}</span>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Your Cover Message:</h4>
                      <p className="text-sm text-muted-foreground">{application.cover_message}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {application.proposed_rate && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Your Proposed Rate:</h4>
                          <p className="text-sm">${application.proposed_rate}</p>
                        </div>
                      )}
                      {application.estimated_completion_time && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Estimated Time:</h4>
                          <p className="text-sm">{application.estimated_completion_time}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Applied {new Date(application.created_at).toLocaleDateString()} at{" "}
                        {new Date(application.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleMessagePoster(application.gig_id, application.gig.posted_by_user_id)}
                      className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Poster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGigApplications;