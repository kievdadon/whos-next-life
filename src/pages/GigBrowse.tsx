import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState({
    cover_message: "",
    proposed_rate: "",
    estimated_completion_time: "",
  });
const [searchTerm, setSearchTerm] = useState("");
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetRange, setBudgetRange] = useState({ min: "", max: "" });
  const [urgencyFilter, setUrgencyFilter] = useState<string | null>(null);
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<string | null>(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState<number>(10);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    checkWorkerProfile();
    fetchGigs();
  }, []);

  const fetchGigs = async (category?: string | null) => {
    try {
      setLoading(true);
      let query = supabase
        .from("gigs")
        .select("*")
        .eq("status", "open");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setGigs(data || []);
    } catch (error) {
      console.error("Error fetching gigs:", error);
      toast({
        title: "Error",
        description: "Failed to load gigs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGigs = gigs.filter((gig) => {
    // Search filter
    if (searchTerm && !gig.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !gig.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !gig.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Budget filter
    if (budgetRange.min && gig.budget_min < parseFloat(budgetRange.min)) {
      return false;
    }
    if (budgetRange.max && gig.budget_min > parseFloat(budgetRange.max)) {
      return false;
    }

    // Budget type filter
    if (budgetTypeFilter && gig.budget_type !== budgetTypeFilter) {
      return false;
    }

    // Urgency filter
    if (urgencyFilter && gig.urgency !== urgencyFilter) {
      return false;
    }

    // Near Me filter (distance in miles)
    if (nearMeEnabled) {
      if (!userLocation || gig.latitude == null || gig.longitude == null) return false;
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 3958.8; // earth radius in miles
      const lat1 = userLocation.lat;
      const lon1 = userLocation.lng;
      const lat2 = typeof gig.latitude === 'number' ? gig.latitude : parseFloat(gig.latitude);
      const lon2 = typeof gig.longitude === 'number' ? gig.longitude : parseFloat(gig.longitude);
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      if (distance > nearMeRadius) return false;
    }

    return true;
  });

  const handleNearMe = () => {
    if (nearMeEnabled) {
      setNearMeEnabled(false);
      setUserLocation(null);
      toast({ title: "Near Me Disabled", description: "Showing all gigs" });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Getting your location...", description: "Please allow location access" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setNearMeEnabled(true);
        toast({
          title: "Near Me Enabled",
          description: `Filtering within ${nearMeRadius} miles of your location`,
        });
      },
      () => {
        toast({
          title: "Location Error",
          description: "Unable to get your location",
          variant: "destructive",
        });
      }
    );
  };

  const applyBudgetFilter = () => {
    setShowBudgetDialog(false);
    toast({
      title: "Budget Filter Applied",
      description: `Showing gigs between $${budgetRange.min || "0"} - $${budgetRange.max || "∞"}`,
    });
  };

  const clearBudgetFilter = () => {
    setBudgetRange({ min: "", max: "" });
    setShowBudgetDialog(false);
  };

  const applyFilters = () => {
    setShowFiltersDialog(false);
    toast({
      title: "Filters Applied",
      description: urgencyFilter ? `Showing ${urgencyFilter} gigs` : "All filters cleared",
    });
  };

  const clearFilters = () => {
    setUrgencyFilter(null);
    setShowFiltersDialog(false);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      // If clicking the same category, clear the filter
      setSelectedCategory(null);
      fetchGigs(null);
    } else {
      setSelectedCategory(categoryName);
      fetchGigs(categoryName);
    }
  };

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
        navigate(`/marketplace/chat/${existingConversation.id}`);
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

      navigate(`/marketplace/chat/${newConversation.id}`);
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                onClick={() => setShowFiltersDialog(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {urgencyFilter && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>}
              </Button>
              <Button 
                variant="outline" 
                className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                onClick={handleNearMe}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {nearMeEnabled ? `Near Me • ${nearMeRadius}mi` : "Near Me"}
              </Button>
              <Button 
                variant="outline" 
                className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                onClick={() => setShowBudgetDialog(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Budget
                {(budgetRange.min || budgetRange.max) && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>}
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
              <Card 
                key={index} 
                className={`group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                  selectedCategory === category.name 
                    ? 'bg-gradient-to-br from-wellness-primary/20 to-wellness-secondary/20 border-wellness-primary' 
                    : 'bg-gradient-to-br from-card to-wellness-calm/20'
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
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
            <div>
              <h2 className="text-2xl font-bold">Available Gigs</h2>
              {selectedCategory && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {selectedCategory} gigs • <button onClick={() => handleCategoryClick(selectedCategory)} className="text-wellness-primary hover:underline">Clear filter</button>
                </p>
              )}
            </div>
            <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5" onClick={() => fetchGigs(selectedCategory)}>
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading gigs...</p>
            </div>
          ) : filteredGigs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {gigs.length === 0 ? "No gigs available yet. Be the first to post one!" : "No gigs match your filters. Try adjusting your search."}
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredGigs.map((gig) => (
                <Card key={gig.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/30">
                  {gig.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={gig.image_url} 
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`bg-${getUrgencyColor(gig.urgency)}/10 text-${getUrgencyColor(gig.urgency)} border-${getUrgencyColor(gig.urgency)}/20`}>
                        {gig.urgency}
                      </Badge>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(gig.created_at).toLocaleDateString()}</span>
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
                          ${gig.budget_min}
                          {gig.budget_max && gig.budget_max !== gig.budget_min && `-$${gig.budget_max}`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {gig.budget_type}
                        </span>
                      </div>
                      {gig.duration_estimate && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{gig.duration_estimate}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{gig.location}</span>
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    {gig.requirements && gig.requirements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Requirements:</p>
                        <div className="flex flex-wrap gap-2">
                          {gig.requirements.map((req: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs border-wellness-primary/30">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Category */}
                    <div className="pt-2 border-t border-border/50">
                      <Badge variant="secondary" className="text-xs">
                        {gig.category}
                      </Badge>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90" 
                        size="sm"
                        onClick={() => handleApplyToGig(gig)}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
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
          )}
        </div>
      </section>

      {/* Filters Dialog */}
      <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Gigs</DialogTitle>
            <DialogDescription>
              Refine your search with additional filters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Urgency</Label>
              <div className="flex flex-wrap gap-2">
                {["ASAP", "This Weekend", "Next Week", "Flexible"].map((urgency) => (
                  <Badge
                    key={urgency}
                    variant={urgencyFilter === urgency ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setUrgencyFilter(urgencyFilter === urgency ? null : urgency)}
                  >
                    {urgency}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={applyFilters} className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Budget Range</DialogTitle>
            <DialogDescription>
              Filter gigs by your budget range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="min_budget">Minimum Budget ($)</Label>
              <Input
                id="min_budget"
                type="number"
                min="0"
                step="1"
                value={budgetRange.min}
                onChange={(e) => setBudgetRange({ ...budgetRange, min: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_budget">Maximum Budget ($)</Label>
              <Input
                id="max_budget"
                type="number"
                min="0"
                step="1"
                value={budgetRange.max}
                onChange={(e) => setBudgetRange({ ...budgetRange, max: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={applyBudgetFilter} className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90">
                Apply
              </Button>
              <Button variant="outline" onClick={clearBudgetFilter}>
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Button asChild variant="outline" size="lg" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <Link to="/browse-workers" aria-label="Browse Workers">
                  <Wrench className="mr-2 h-5 w-5" />
                  Browse Workers
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GigBrowse;