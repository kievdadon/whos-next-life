import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VoiceAssistant as VoiceAssistantClass } from '@/utils/VoiceAssistant';
import { Mic, MicOff, MessageSquare, Volume2 } from 'lucide-react';
import VoiceDebugHUD from '@/components/VoiceDebugHUD';

interface VoiceAssistantProps {
  onWellnessStandby?: (standby: boolean) => void;
}

const VoiceAssistant = ({ onWellnessStandby }: VoiceAssistantProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [lastToolCall, setLastToolCall] = useState<{ name: string; args: any; timestamp: number } | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const assistantRef = useRef<VoiceAssistantClass | null>(null);

  const handleToolCall = async (toolName: string, args: any): Promise<any> => {
    console.log("Tool called:", toolName, args);
    
    // Track tool call for debug HUD
    setLastToolCall({ name: toolName, args, timestamp: Date.now() });
    
    try {
      switch (toolName) {
        case 'navigate_to_page':
          const pageMap: Record<string, string> = {
            'marketplace': '/marketplace',
            'delivery': '/delivery',
            'gigs': '/gig-browse',
            'business-dashboard': '/business-dashboard',
            'driver-dashboard': '/driver-dashboard',
            'wellness-chat': '/wellness-chat',
            'mission-control': '/mission-control',
            'home': '/'
          };
          navigate(pageMap[args.page] || '/');
          return { success: true, message: `Navigated to ${args.page}` };

        case 'search_marketplace':
          navigate(`/marketplace?search=${encodeURIComponent(args.query)}${args.category ? `&category=${args.category}` : ''}`);
          return { success: true, message: `Searching marketplace for: ${args.query}` };

        case 'search_gigs':
          navigate(`/gig-browse?search=${encodeURIComponent(args.query)}`);
          return { success: true, message: `Searching gigs for: ${args.query}` };

        case 'send_message':
          toast({
            title: "Message Sent",
            description: `Message sent to ${args.type}: ${args.message}`,
          });
          return { success: true, message: "Message sent successfully" };

        case 'add_to_cart':
          // This would integrate with your cart system
          toast({
            title: "Added to Cart",
            description: `Added ${args.quantity} item(s) to cart`,
          });
          return { success: true, message: `Added ${args.quantity} items to cart` };

        case 'update_cart_quantity':
          toast({
            title: "Cart Updated",
            description: `Updated quantity to ${args.quantity}`,
          });
          return { success: true, message: "Cart quantity updated" };

        case 'remove_from_cart':
          toast({
            title: "Removed from Cart",
            description: "Item removed from cart",
          });
          return { success: true, message: "Item removed from cart" };

        case 'initiate_checkout':
          if (args.voiceConfirmed) {
            navigate('/checkout');
            return { success: true, message: "Starting checkout process" };
          } else {
            return { success: false, message: "Voice confirmation required for checkout" };
          }

        case 'check_delivery_status':
          toast({
            title: "Delivery Status",
            description: "Checking your delivery status...",
          });
          return { success: true, status: "In transit", estimatedTime: "15 minutes" };

        case 'cancel_delivery':
          toast({
            title: "Delivery Cancelled",
            description: "Your delivery has been cancelled",
            variant: "destructive",
          });
          return { success: true, message: "Delivery cancelled" };

        case 'go_back':
          navigate(-1);
          return { success: true, message: "Navigated back" };

        case 'go_forward':
          navigate(1);
          return { success: true, message: "Navigated forward" };

        default:
          return { success: false, message: "Unknown tool" };
      }
    } catch (error) {
      console.error("Tool execution error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const handleMessage = (event: any) => {
    console.log('Voice assistant message:', event);
    
    // Update last event and calculate latency
    setLastEvent(event);
    
    if (event.type === 'response.created' && lastRequestTime) {
      setLatency(Date.now() - lastRequestTime);
    }
    
    // Handle different event types
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done' || event.type === 'response.done') {
      setIsSpeaking(false);
    } else if (event.type === 'conversation.item.created') {
      // Add transcript
      const content = event.item?.content?.[0];
      if (content?.type === 'text' || content?.type === 'input_text') {
        setTranscript(prev => [...prev, content.text]);
      }
    } else if (event.type === 'response.audio_transcript.delta') {
      // Assistant speaking
      if (event.delta) {
        setTranscript(prev => {
          const newTranscript = [...prev];
          if (newTranscript.length > 0 && newTranscript[newTranscript.length - 1].startsWith('Assistant: ')) {
            newTranscript[newTranscript.length - 1] += event.delta;
          } else {
            newTranscript.push('Assistant: ' + event.delta);
          }
          return newTranscript;
        });
      }
    } else if (event.type === 'input_audio_buffer.speech_started') {
      setIsListening(true);
      setLastRequestTime(Date.now());
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      setIsListening(false);
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
  };

  const startConversation = async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      assistantRef.current = new VoiceAssistantClass(handleMessage, handleSpeakingChange, handleToolCall);
      await assistantRef.current.init();
      setIsConnected(true);
      setTranscript([]);
      
      // Put wellness chat on standby
      onWellnessStandby?.(true);
      
      toast({
        title: "Voice Assistant Active",
        description: "I'm listening! I can help you navigate, search, shop, and more on WHOSENXT!",
      });
    } catch (error) {
      console.error('Error starting voice assistant:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start voice assistant. Please ensure microphone access is granted.',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    assistantRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    
    // Release wellness chat from standby
    onWellnessStandby?.(false);
    
    toast({
      title: "Voice Assistant Ended",
      description: "Conversation ended. Wellness chat is available again.",
    });
  };

  useEffect(() => {
    return () => {
      assistantRef.current?.disconnect();
    };
  }, []);

  return (
    <>
      {/* Debug HUD */}
      {isConnected && (
        <VoiceDebugHUD
          isConnected={isConnected}
          isListening={isListening}
          isSpeaking={isSpeaking}
          lastEvent={lastEvent}
          lastToolCall={lastToolCall}
          latency={latency}
        />
      )}
      
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
        {/* Transcript Card */}
        {isConnected && transcript.length > 0 && (
          <Card className="w-80 max-h-60 overflow-y-auto shadow-lg border-wellness-primary/20">
            <CardContent className="p-4 space-y-2">
              {transcript.slice(-5).map((text, index) => (
                <div 
                  key={index} 
                  className={`text-sm ${text.startsWith('Assistant: ') ? 'text-wellness-primary' : 'text-foreground'}`}
                >
                  {text}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Status Badges */}
        {isConnected && (
          <div className="flex gap-2">
            {isListening && (
              <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20 animate-pulse">
                <Mic className="mr-1 h-3 w-3" />
                Listening
              </Badge>
            )}
            {isSpeaking && (
              <Badge className="bg-wellness-secondary/10 text-wellness-secondary border-wellness-secondary/20 animate-pulse">
                <Volume2 className="mr-1 h-3 w-3" />
                Speaking
              </Badge>
            )}
          </div>
        )}

        {/* Control Button */}
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            size="lg"
            className="bg-gradient-to-r from-wellness-primary to-wellness-secondary hover:opacity-90 text-white shadow-lg rounded-full w-16 h-16 p-0"
          >
            <Mic className="h-6 w-6" />
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            size="lg"
            variant="secondary"
            className="shadow-lg rounded-full w-16 h-16 p-0"
          >
            <MicOff className="h-6 w-6" />
          </Button>
        )}

        {/* Wellness Note */}
        {isConnected && (
          <div className="text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50">
            <MessageSquare className="inline h-3 w-3 mr-1" />
            Wellness chat on standby
          </div>
        )}
      </div>
    </>
  );
};

export default VoiceAssistant;
