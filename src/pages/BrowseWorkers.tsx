import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  DollarSign,
  Briefcase,
  User,
  Award,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BrowseWorkers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load worker profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      worker.full_name?.toLowerCase().includes(searchLower) ||
      worker.bio?.toLowerCase().includes(searchLower) ||
      worker.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                👷 Browse Workers
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/worker-profile")}
              >
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Button>
              <Button 
                size="sm" 
                className="bg-wellness-primary hover:bg-wellness-primary/90"
                onClick={() => navigate("/gig-browse")}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Gigs
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, skill, or keyword..." 
                className="pl-10 h-12 bg-card/50 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                onClick={fetchWorkers}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Workers Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Available Workers</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading workers...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "No workers found matching your search." : "No worker profiles available yet."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((worker) => (
                <Card 
                  key={worker.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/30"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {worker.profile_photo_url ? (
                          <AvatarImage src={worker.profile_photo_url} alt={worker.full_name} />
                        ) : (
                          <AvatarFallback className="bg-wellness-primary/10">
                            <User className="h-8 w-8 text-wellness-primary" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-wellness-primary transition-colors">
                          {worker.full_name}
                        </CardTitle>
                        {worker.is_verified && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {worker.bio && (
                      <CardDescription className="line-clamp-2 mt-3">
                        {worker.bio}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    {worker.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-wellness-warm text-wellness-warm" />
                        <span className="font-semibold">{worker.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({worker.total_jobs_completed} jobs)
                        </span>
                      </div>
                    )}

                    {/* Hourly Rate */}
                    {(worker.hourly_rate_min || worker.hourly_rate_max) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-wellness-primary" />
                        <span className="font-semibold">
                          {worker.hourly_rate_min && worker.hourly_rate_max
                            ? `$${worker.hourly_rate_min}-$${worker.hourly_rate_max}/hr`
                            : worker.hourly_rate_min
                            ? `From $${worker.hourly_rate_min}/hr`
                            : `Up to $${worker.hourly_rate_max}/hr`}
                        </span>
                      </div>
                    )}

                    {/* Experience */}
                    {worker.years_experience && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>{worker.years_experience} years experience</span>
                      </div>
                    )}

                    {/* Skills */}
                    {worker.skills && worker.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {worker.skills.slice(0, 4).map((skill: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs border-wellness-primary/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {worker.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{worker.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Availability */}
                    {worker.availability && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{worker.availability}</span>
                      </div>
                    )}

                    {/* Portfolio Link */}
                    {worker.portfolio_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(worker.portfolio_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Portfolio
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Are You a Worker?</h2>
            <p className="text-lg text-muted-foreground">
              Create your profile and start connecting with people who need your skills.
            </p>
            <Button 
              size="lg" 
              className="bg-wellness-primary hover:bg-wellness-primary/90"
              onClick={() => navigate("/worker-profile")}
            >
              <User className="mr-2 h-5 w-5" />
              Create Worker Profile
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrowseWorkers;
