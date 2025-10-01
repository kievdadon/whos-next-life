import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Star,
  User,
  Calendar,
  Briefcase,
  Plus,
  Eye,
  MessageCircle,
  Wrench,
  Home,
  Car,
  Laptop,
  Camera,
  Scissors
} from "lucide-react";

const GigBrowse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasWorkerProfile, setHasWorkerProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedGig, setSelectedGig] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    cover_message: "",
    proposed_rate: "",
    estimated_completion_time: "",
  });

  useEffect(() => {
    checkWorkerProfile();
  }, []);

  const checkWorkerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setHasWorkerProfile(!!data);
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setCheckingProfile(false);
    }
  };
  const categories = [
    { name: "Home Repair", icon: Home, count: 45, color: "wellness-primary" },
    { name: "Moving Help", icon: Car, count: 32, color: "wellness-secondary" },
    { name: "Tech Support", icon: Laptop, count: 28, color: "wellness-accent" },
    { name: "Photography", icon: Camera, count: 19, color: "wellness-warm" },
    { name: "Pet Care", icon: "🐕", count: 37, color: "wellness-primary" },
    { name: "Cleaning", icon: "🧹", count: 52, color: "wellness-secondary" }
  ];

  const featuredGigs = [
    {
      id: 1,
      posted_by_user_id: "00000000-0000-0000-0000-000000000001", // Mock user ID
      title: "Help me move my furniture this weekend",
      description: "Need 2-3 people to help move furniture from my apartment to a new house. Heavy lifting involved.",
      category: "Moving Help",
      budget: { min: 25, max: 40, type: "per hour" },
      location: "Downtown",
      distance: "1.2 miles",
      timePosted: "2 hours ago",
      duration: "4-6 hours",
      urgency: "This Weekend",
      poster: {
        name: "Sarah Chen",
        rating: 4.8,
        verified: true
      },
      requirements: ["Physical strength", "Own transportation preferred"],
      applicants: 8
    },
    {
      id: 2,
      posted_by_user_id: "00000000-0000-0000-0000-000000000002", // Mock user ID
      title: "Fix my leaky kitchen faucet",
      description: "Kitchen faucet has been dripping for weeks. Need someone experienced with plumbing repairs.",
      category: "Home Repair",
      budget: { min: 50, max: 80, type: "fixed" },
      location: "Suburbs",
      distance: "3.5 miles",
      timePosted: "5 hours ago",
      duration: "1-2 hours",
      urgency: "ASAP",
      poster: {
        name: "Mike Rodriguez",
        rating: 4.9,
        verified: true
      },
      requirements: ["Plumbing experience", "Own tools"],
      applicants: 12
    },
    {
      id: 3,
      posted_by_user_id: "00000000-0000-0000-0000-000000000003", // Mock user ID
      title: "Dog walking for the week",
      description: "Going out of town and need someone reliable to walk my golden retriever twice daily.",
      category: "Pet Care",
      budget: { min: 20, max: 25, type: "per walk" },
      location: "Park District",
      distance: "0.8 miles",
      timePosted: "1 day ago",
      duration: "7 days",
      urgency: "Next Week",
      poster: {
        name: "Emma Wilson",
        rating: 5.0,
        verified: true
      },
      requirements: ["Love dogs", "Reliable schedule"],
      applicants: 15
    },
    {
      id: 4,
      posted_by_user_id: "00000000-0000-0000-0000-000000000004", // Mock user ID
      title: "Event photography for birthday party",
      description: "Need a photographer for my daughter's 10th birthday party. 2-3 hours of coverage needed.",
      category: "Photography",
      budget: { min: 150, max: 250, type: "fixed" },
      location: "Westside",
      distance: "4.2 miles",
      timePosted: "3 days ago",
      duration: "3 hours",
      urgency: "Next Saturday",
      poster: {
        name: "David Park",
        rating: 4.7,
        verified: false
      },
      requirements: ["Portfolio required", "Own equipment"],
      applicants: 6
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "ASAP": return "wellness-accent";
      case "This Weekend": return "wellness-warm";
      case "Next Week": return "wellness-primary";
      default: return "wellness-secondary";
    }
  };

  const handleApplyToGig = async (gig: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for gigs.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!hasWorkerProfile) {
      toast({
        title: "Profile Required",
        description: "Create your worker profile first to apply for gigs.",
      });
      navigate("/worker-profile");
      return;
    }

    setSelectedGig(gig);
    setShowApplicationDialog(true);
  };

  const handleMessagePoster = async (gig: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to message gig posters.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check if conversation already exists for this gig
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("gig_id", gig.id)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (existingConversation) {
        // Navigate to existing conversation
        navigate(`/marketplace-chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          buyer_id: user.id,
          seller_id: gig.posted_by_user_id,
          gig_id: gig.id,
          subject: `Regarding: ${gig.title}`,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Chat Started",
        description: `Opening conversation about "${gig.title}"`,
      });

      navigate(`/marketplace-chat/${newConversation.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const submitApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get worker profile
      const { data: profile } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Worker profile not found",
          variant: "destructive",
        });
        return;
      }

      // Submit application
      const { error } = await supabase
        .from("gig_applications")
        .insert({
          gig_id: selectedGig.id,
          applicant_user_id: user.id,
          worker_profile_id: profile.id,
          cover_message: applicationData.cover_message,
          proposed_rate: applicationData.proposed_rate ? parseFloat(applicationData.proposed_rate) : null,
          estimated_completion_time: applicationData.estimated_completion_time,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Applied",
            description: "You've already applied to this gig.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Application Submitted!",
        description: `Your application for "${selectedGig.title}" has been submitted successfully.`,
      });

      setShowApplicationDialog(false);
      setApplicationData({
        cover_message: "",
        proposed_rate: "",
        estimated_completion_time: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                🛠️ WHOSENXT GIG
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/worker-profile")}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                {hasWorkerProfile ? "My Profile" : "Create Profile"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/my-gig-applications")}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                My Applications
              </Button>
              <Button 
                size="sm" 
                className="bg-wellness-primary hover:bg-wellness-primary/90"
                onClick={() => navigate("/post-gig")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a Gig
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search gigs by skill, location, or keyword..." 
                className="pl-10 h-12 bg-card/50 border-border/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
              <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <DollarSign className="h-4 w-4 mr-2" />
                Budget
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/20">
                <CardContent className="p-6 text-center">
                  <div className="mb-3 group-hover:scale-110 transition-transform duration-300">
                    {typeof category.icon === 'string' ? (
                      <div className="text-3xl">{category.icon}</div>
                    ) : (
                      <div className="w-8 h-8 mx-auto">
                        <category.icon className="w-8 h-8 text-wellness-primary" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count} gigs</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gigs */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Gigs</h2>
            <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
              View All
            </Button>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {featuredGigs.map((gig) => (
              <Card key={gig.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`bg-${getUrgencyColor(gig.urgency)}/10 text-${getUrgencyColor(gig.urgency)} border-${getUrgencyColor(gig.urgency)}/20`}>
                      {gig.urgency}
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{gig.timePosted}</span>
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-wellness-primary transition-colors">
                    {gig.title}
                  </CardTitle>
                  
                  <CardDescription className="line-clamp-2">
                    {gig.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Budget and Duration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-wellness-primary" />
                      <span className="font-semibold text-lg">
                        ${gig.budget.min}
                        {gig.budget.max && gig.budget.max !== gig.budget.min && `-$${gig.budget.max}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {gig.budget.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{gig.duration}</span>
                    </div>
                  </div>
                  
                  {/* Location and Distance */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{gig.location}</span>
                    </div>
                    <span className="text-wellness-primary font-medium">{gig.distance} away</span>
                  </div>
                  
                  {/* Requirements */}
                  <div>
                    <p className="text-sm font-medium mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {gig.requirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-wellness-primary/30">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Poster Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-wellness-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-wellness-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{gig.poster.name}</span>
                          {gig.poster.verified && (
                            <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{gig.poster.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{gig.applicants} applied</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90"
                      onClick={() => handleApplyToGig(gig)}
                      disabled={checkingProfile}
                    >
                      Apply Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                      onClick={() => handleMessagePoster(gig)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for Gig</DialogTitle>
            <DialogDescription>
              Submit your application for: {selectedGig?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cover_message">Cover Message *</Label>
              <Textarea
                id="cover_message"
                value={applicationData.cover_message}
                onChange={(e) => setApplicationData({ ...applicationData, cover_message: e.target.value })}
                placeholder="Tell them why you're the right person for this job..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed_rate">Your Proposed Rate ($)</Label>
              <Input
                id="proposed_rate"
                type="number"
                min="0"
                step="0.01"
                value={applicationData.proposed_rate}
                onChange={(e) => setApplicationData({ ...applicationData, proposed_rate: e.target.value })}
                placeholder="25.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_completion_time">Estimated Completion Time</Label>
              <Input
                id="estimated_completion_time"
                value={applicationData.estimated_completion_time}
                onChange={(e) => setApplicationData({ ...applicationData, estimated_completion_time: e.target.value })}
                placeholder="2-3 hours"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitApplication}
                disabled={!applicationData.cover_message}
                className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90"
              >
                Submit Application
              </Button>
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Gig CTA */}
      <section className="py-12 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Need Help? Post a Gig</h2>
            <p className="text-lg text-muted-foreground">
              From home repairs to pet sitting, find skilled people in your community ready to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-wellness-primary hover:bg-wellness-primary/90">
                <Plus className="mr-2 h-5 w-5" />
                Post Your Gig
              </Button>
              <Button variant="outline" size="lg" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <Wrench className="mr-2 h-5 w-5" />
                Browse Workers
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GigBrowse;