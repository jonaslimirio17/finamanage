import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: "ebook" | "article" | "video";
  file_url?: string;
  thumbnail_url?: string;
  content_body?: string;
  tags?: string[];
  duration_minutes?: number;
  author?: string;
  is_published: boolean;
}

interface EditEducationalContentDialogProps {
  content: Content | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentUpdated: () => void;
}

export const EditEducationalContentDialog = ({
  content,
  open,
  onOpenChange,
  onContentUpdated,
}: EditEducationalContentDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<"article" | "video" | "ebook">("article");
  const [contentBody, setContentBody] = useState("");
  const [author, setAuthor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>();
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setDescription(content.description);
      setContentType(content.content_type);
      setContentBody(content.content_body || "");
      setAuthor(content.author || "");
      setDurationMinutes(content.duration_minutes);
      setTags(content.tags?.join(", ") || "");
      setIsPublished(content.is_published);
      setFile(null);
      setThumbnail(null);
    }
  }, [content]);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content) return;
    
    if (!title || !description || !contentType) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = content.file_url;
      let thumbnailUrl = content.thumbnail_url;

      if (file) {
        const newFileUrl = await uploadFile(file, "educational-files");
        if (newFileUrl) {
          fileUrl = newFileUrl;
        }
      }

      if (thumbnail) {
        const newThumbnailUrl = await uploadFile(thumbnail, "educational-thumbnails");
        if (newThumbnailUrl) {
          thumbnailUrl = newThumbnailUrl;
        }
      }

      const { error } = await supabase
        .from("educational_content")
        .update({
          title,
          description,
          content_type: contentType,
          content_body: contentBody || null,
          author: author || null,
          duration_minutes: durationMinutes || null,
          tags: tags ? tags.split(",").map(t => t.trim()) : [],
          is_published: isPublished,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", content.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso!",
      });

      onOpenChange(false);
      onContentUpdated();
    } catch (error: any) {
      console.error("Error updating content:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar conteúdo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conteúdo Educacional</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do conteúdo"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-description">Descrição *</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do conteúdo"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-contentType">Tipo de Conteúdo *</Label>
              <Select value={contentType} onValueChange={(v: "article" | "video" | "ebook") => setContentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artigo</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-author">Autor</Label>
              <Input
                id="edit-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor"
              />
            </div>

            <div>
              <Label htmlFor="edit-duration">Duração (minutos)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={durationMinutes || ""}
                onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 15"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="investimentos, poupança, orçamento"
              />
            </div>

            {contentType === "article" && (
              <div className="col-span-2">
                <Label htmlFor="edit-contentBody">Conteúdo do Artigo (HTML)</Label>
                <Textarea
                  id="edit-contentBody"
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                  placeholder="<p>Conteúdo do artigo...</p>"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="edit-file">Arquivo (PDF/Vídeo)</Label>
              <div className="space-y-2">
                {content?.file_url && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo atual: <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver arquivo</a>
                  </p>
                )}
                <Input
                  id="edit-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept={contentType === "video" ? "video/*" : ".pdf"}
                />
                {file && (
                  <span className="text-sm text-muted-foreground">
                    Novo arquivo: {file.name}
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-thumbnail">Thumbnail</Label>
              <div className="space-y-2">
                {content?.thumbnail_url && (
                  <img src={content.thumbnail_url} alt="Thumbnail atual" className="w-32 h-20 object-cover rounded" />
                )}
                <Input
                  id="edit-thumbnail"
                  type="file"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  accept="image/*"
                />
                {thumbnail && (
                  <span className="text-sm text-muted-foreground">
                    Nova thumbnail: {thumbnail.name}
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="edit-published">Publicado</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
