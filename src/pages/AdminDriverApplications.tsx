import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Eye, Calendar, Phone, Mail, MapPin, Car, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface DriverApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  license_number: string;
  insurance_provider: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  availability: string;
  experience: string;
  status: string;
  created_at: string;
  drivers_license_url: string;
  secondary_id_url: string;
}

const AdminDriverApplications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);

  // Check if user is admin (you'll need to implement proper admin role checking)
  const isAdmin = user?.email === "jameskiev16@gmail.com";

  useEffect(() => {
    if (!isAdmin) return;
    fetchApplications();
  }, [isAdmin]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch applications: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('driver_applications')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Send email notification
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        await supabase.functions.invoke('send-driver-status-update', {
          body: {
            email: application.email,
            fullName: application.full_name,
            status
          }
        });
      }

      toast({
        title: "Success",
        description: `Application ${status} successfully!`,
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
            <p>You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading applications...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Driver Applications</h1>
        <p className="text-muted-foreground">Review and manage driver applications</p>
      </div>

      <div className="grid gap-6">
        {applications.map((application) => (
          <Card key={application.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{application.full_name}</h3>
                <p className="text-muted-foreground">{application.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(application.status)}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Driver Application Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedApplication && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Personal Information
                              </h4>
                              <div className="space-y-2 mt-2">
                                <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                                <p><strong>Email:</strong> {selectedApplication.email}</p>
                                <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth}</p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Address
                              </h4>
                              <div className="space-y-2 mt-2">
                                <p>{selectedApplication.address}</p>
                                <p>{selectedApplication.city}, {selectedApplication.state} {selectedApplication.zip_code}</p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Emergency Contact
                              </h4>
                              <div className="space-y-2 mt-2">
                                <p><strong>Name:</strong> {selectedApplication.emergency_contact_name}</p>
                                <p><strong>Phone:</strong> {selectedApplication.emergency_contact_phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                Vehicle Information
                              </h4>
                              <div className="space-y-2 mt-2">
                                <p><strong>Type:</strong> {selectedApplication.vehicle_type}</p>
                                <p><strong>Make:</strong> {selectedApplication.vehicle_make}</p>
                                <p><strong>Model:</strong> {selectedApplication.vehicle_model}</p>
                                <p><strong>Year:</strong> {selectedApplication.vehicle_year}</p>
                                <p><strong>License Plate:</strong> {selectedApplication.license_number}</p>
                                <p><strong>Insurance:</strong> {selectedApplication.insurance_provider}</p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold">Availability</h4>
                              <p className="mt-2">{selectedApplication.availability}</p>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold">Experience</h4>
                              <p className="mt-2">{selectedApplication.experience}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Documents</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {selectedApplication.drivers_license_url && (
                              <div>
                                <p className="font-medium mb-2">Driver's License</p>
                                <img 
                                  src={`https://iosdtunxezeccsfxvvqn.supabase.co/storage/v1/object/public/driver-documents/${selectedApplication.drivers_license_url}`}
                                  alt="Driver's License"
                                  className="w-full max-w-sm rounded border"
                                />
                              </div>
                            )}
                            {selectedApplication.secondary_id_url && (
                              <div>
                                <p className="font-medium mb-2">Secondary ID</p>
                                <img 
                                  src={`https://iosdtunxezeccsfxvvqn.supabase.co/storage/v1/object/public/driver-documents/${selectedApplication.secondary_id_url}`}
                                  alt="Secondary ID"
                                  className="w-full max-w-sm rounded border"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{application.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{application.city}, {application.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{application.vehicle_type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Applied: {new Date(application.created_at).toLocaleDateString()}</span>
            </div>

            {application.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => updateApplicationStatus(application.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  onClick={() => updateApplicationStatus(application.id, 'rejected')}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))}

        {applications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">Driver applications will appear here when submitted.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDriverApplications;