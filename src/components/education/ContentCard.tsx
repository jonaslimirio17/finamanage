import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  contentType: "ebook" | "article" | "video";
  thumbnailUrl?: string;
  tags?: string[];
  durationMinutes?: number;
  viewCount?: number;
  onView: (id: string) => void;
}

export const ContentCard = ({
  id,
  title,
  description,
  contentType,
  thumbnailUrl,
  tags,
  durationMinutes,
  viewCount,
  onView
}: ContentCardProps) => {
  const getIcon = () => {
    switch (contentType) {
      case "ebook":
        return <BookOpen className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "article":
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (contentType) {
      case "ebook":
        return "E-book";
      case "video":
        return "Vídeo";
      case "article":
        return "Artigo";
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
      <CardHeader>
        {thumbnailUrl && (
          <div className="w-full h-48 mb-4 overflow-hidden rounded-md">
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <Badge variant="secondary">{getTypeLabel()}</Badge>
          </div>
          {viewCount !== undefined && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              {viewCount}
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-3">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags?.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        {durationMinutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            {durationMinutes} min
          </div>
        )}
        <Button 
          className="w-full" 
          onClick={() => onView(id)}
        >
          {contentType === "video" ? "Assistir" : "Ler"}
        </Button>
      </CardContent>
    </Card>
  );
};
