import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Activity, Zap, MessageSquare } from "lucide-react";

interface VoiceDebugHUDProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  lastEvent: any;
  lastToolCall: { name: string; args: any; timestamp: number } | null;
  latency: number | null;
}

const VoiceDebugHUD = ({
  isConnected,
  isListening,
  isSpeaking,
  lastEvent,
  lastToolCall,
  latency,
}: VoiceDebugHUDProps) => {
  return (
    <Card className="fixed top-20 right-4 w-80 p-4 bg-background/95 backdrop-blur-sm border-border/50 z-50">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Voice Debug
          </h3>
          <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {/* State Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
            <span className="text-xs text-muted-foreground">Listening</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`} />
            <span className="text-xs text-muted-foreground">Speaking</span>
          </div>
        </div>

        {/* Latency */}
        {latency !== null && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Latency</span>
            </div>
            <span className="text-xs font-mono text-foreground">{latency}ms</span>
          </div>
        )}

        {/* Last Event */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span>Last Event</span>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <code className="text-[10px] text-foreground break-all">
              {lastEvent?.type || 'None'}
            </code>
          </div>
        </div>

        {/* Last Tool Call */}
        {lastToolCall && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>Last Tool Call</span>
            </div>
            <div className="p-2 bg-muted/50 rounded space-y-1">
              <div className="text-xs font-semibold text-foreground">{lastToolCall.name}</div>
              <code className="text-[10px] text-muted-foreground break-all block">
                {JSON.stringify(lastToolCall.args, null, 2)}
              </code>
              <div className="text-[10px] text-muted-foreground">
                {new Date(lastToolCall.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Raw Event Details */}
        {lastEvent && (
          <details className="text-[10px]">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Raw Event Data
            </summary>
            <pre className="mt-2 p-2 bg-muted/50 rounded overflow-auto max-h-32 text-foreground">
              {JSON.stringify(lastEvent, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Card>
  );
};

export default VoiceDebugHUD;
