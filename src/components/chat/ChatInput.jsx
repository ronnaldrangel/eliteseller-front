import { Loader2, Paperclip, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ChatInput = ({ 
    centered = false,
    input,
    setInput,
    isLoading,
    isUploading,
    handleSubmit,
    attachments,
    removeAttachment,
    fileInputRef,
    handleFileSelect,
    selectedModel,
    setSelectedModel,
    isWidget
}) => (
    <div className={cn(
        "relative flex flex-col w-full overflow-hidden rounded-[2rem] border bg-muted/40 transition-all hover:bg-muted/60 focus-within:ring-1 focus-within:ring-ring/50 focus-within:bg-muted/60",
        centered ? "shadow-lg" : "shadow-sm"
    )}>
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-2 p-3 pb-0 px-4 overflow-x-auto">
                {attachments.map((file, i) => (
                    <div key={i} className="relative group shrink-0">
                        <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                            {file.type.startsWith('image/') ? (
                                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                            ) : (
                                <Paperclip className="h-6 w-6 text-muted-foreground" />
                            )}
                        </div>
                        <button
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Escribe un mensaje..."}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-6 py-4 text-lg placeholder:text-muted-foreground/50 h-auto min-h-[60px]"
            disabled={isLoading || isUploading}
            autoFocus={!isWidget}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
        />

        <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full h-9 px-3 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    <span className={cn("text-xs font-medium", isWidget ? "hidden sm:inline" : "")}>Adjuntar</span>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-auto h-9 gap-2 border-0 bg-transparent shadow-none focus:ring-0 font-medium hover:bg-muted/50 rounded-full px-3 text-muted-foreground hover:text-foreground transition-colors text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
                    onClick={handleSubmit}
                    className={cn(
                        "h-9 w-9 rounded-full transition-all hover:bg-background/50",
                        (input.trim() || attachments.length > 0) ? "opacity-100 text-primary" : "opacity-0"
                    )}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    </div>
);

export default ChatInput;
