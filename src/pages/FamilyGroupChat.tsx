import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Plus, Settings, Search } from "lucide-react";

const FamilyGroupChat = () => {
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const mockMessages = [
    {
      id: 1,
      sender: "Mom",
      message: "Don't forget about dinner tonight at 7 PM!",
      time: "2:30 PM",
      avatar: "M",
      isOnline: true
    },
    {
      id: 2,
      sender: "Dad",
      message: "I'll pick up groceries on my way home",
      time: "2:45 PM",
      avatar: "D",
      isOnline: false
    },
    {
      id: 3,
      sender: "Sarah",
      message: "Can someone help me with my homework?",
      time: "3:15 PM",
      avatar: "S",
      isOnline: true
    },
    {
      id: 4,
      sender: "You",
      message: "Sure Sarah, what subject?",
      time: "3:16 PM",
      avatar: "Y",
      isOnline: true,
      isOwn: true
    }
  ];

  const familyMembers = [
    { name: "Mom", status: "online", avatar: "M", lastSeen: "Active now" },
    { name: "Dad", status: "offline", avatar: "D", lastSeen: "2 hours ago" },
    { name: "Sarah", status: "online", avatar: "S", lastSeen: "Active now" },
    { name: "Mike", status: "away", avatar: "M", lastSeen: "30 min ago" }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here would be the logic to send message to backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-wellness-primary/20">
              <Users className="h-6 w-6 text-wellness-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Family Group</h1>
              <p className="text-muted-foreground">4 members • 2 online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Family Members Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Family Members</span>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-wellness-primary/20 text-wellness-primary">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      member.status === 'online' ? 'bg-green-500' : 
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.lastSeen}</p>
                  </div>
                  <Badge variant={member.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                    {member.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[70vh]">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-wellness-primary text-white">F</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Family Chat</CardTitle>
                  <p className="text-sm text-muted-foreground">Last message 2 minutes ago</p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!msg.isOwn && (
                    <Avatar className="mt-1">
                      <AvatarFallback className="bg-wellness-secondary/20 text-wellness-secondary text-xs">
                        {msg.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-1' : ''}`}>
                    {!msg.isOwn && (
                      <p className="text-xs text-muted-foreground mb-1">{msg.sender}</p>
                    )}
                    <div className={`p-3 rounded-lg ${
                      msg.isOwn 
                        ? 'bg-wellness-primary text-white ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">{msg.time}</p>
                  </div>
                  {msg.isOwn && (
                    <Avatar className="mt-1">
                      <AvatarFallback className="bg-wellness-primary text-white text-xs">
                        {msg.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-wellness-primary hover:bg-wellness-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyGroupChat;