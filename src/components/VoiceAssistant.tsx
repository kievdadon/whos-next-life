import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { VoiceAssistant as VoiceAssistantClass } from '@/utils/VoiceAssistant';
import { Mic, MicOff, MessageSquare, Volume2 } from 'lucide-react';

interface VoiceAssistantProps {
  onWellnessStandby?: (standby: boolean) => void;
}

const VoiceAssistant = ({ onWellnessStandby }: VoiceAssistantProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const assistantRef = useRef<VoiceAssistantClass | null>(null);

  const handleMessage = (event: any) => {
    console.log('Voice assistant message:', event);
    
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

      assistantRef.current = new VoiceAssistantClass(handleMessage, handleSpeakingChange);
      await assistantRef.current.init();
      setIsConnected(true);
      setTranscript([]);
      
      // Put wellness chat on standby
      onWellnessStandby?.(true);
      
      toast({
        title: "Voice Assistant Active",
        description: "I'm listening! How can I help you with WHOSENXT?",
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
  );
};

export default VoiceAssistant;
