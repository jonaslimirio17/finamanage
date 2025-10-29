import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText, Clock, Eye } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContentViewerProps {
  content: {
    id: string;
    title: string;
    description: string;
    contentType: "ebook" | "article" | "video";
    fileUrl?: string;
    contentBody?: string;
    tags?: string[];
    durationMinutes?: number;
    viewCount?: number;
    author?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentViewer = ({ content, isOpen, onClose }: ContentViewerProps) => {
  useEffect(() => {
    if (content && isOpen) {
      // Increment view count
      supabase
        .from("educational_content")
        .update({ view_count: (content.viewCount || 0) + 1 })
        .eq("id", content.id)
        .then();
    }
  }, [content, isOpen]);

  if (!content) return null;

  const getIcon = () => {
    switch (content.contentType) {
      case "ebook":
        return <BookOpen className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "article":
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderContent = () => {
    if (content.contentType === "video" && content.fileUrl) {
      return (
        <video 
          controls 
          className="w-full rounded-lg"
          src={content.fileUrl}
        >
          Seu navegador não suporta vídeo.
        </video>
      );
    }

    if (content.contentType === "ebook" && content.fileUrl) {
      return (
        <iframe
          src={content.fileUrl}
          className="w-full h-[600px] rounded-lg"
          title={content.title}
        />
      );
    }

    if (content.contentBody) {
      return (
        <div 
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content.contentBody }}
        />
      );
    }

    return <p className="text-muted-foreground">Conteúdo não disponível.</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {getIcon()}
            <Badge variant="secondary">
              {content.contentType === "ebook" ? "E-book" : 
               content.contentType === "video" ? "Vídeo" : "Artigo"}
            </Badge>
          </div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-2">
            {content.author && <span>Por {content.author}</span>}
            {content.durationMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {content.durationMinutes} min
              </div>
            )}
            {content.viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {content.viewCount} visualizações
              </div>
            )}
          </div>
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
