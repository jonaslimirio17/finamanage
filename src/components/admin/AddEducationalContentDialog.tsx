import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Upload, Loader2 } from "lucide-react";

interface AddEducationalContentDialogProps {
  onContentAdded: () => void;
}

export const AddEducationalContentDialog = ({ onContentAdded }: AddEducationalContentDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContentType("article");
    setContentBody("");
    setAuthor("");
    setDurationMinutes(undefined);
    setTags("");
    setIsPublished(true);
    setFile(null);
    setThumbnail(null);
  };

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
      let fileUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      if (file) {
        fileUrl = await uploadFile(file, "educational-files");
        if (!fileUrl) {
          throw new Error("Falha ao fazer upload do arquivo");
        }
      }

      if (thumbnail) {
        thumbnailUrl = await uploadFile(thumbnail, "educational-thumbnails");
        if (!thumbnailUrl) {
          throw new Error("Falha ao fazer upload da thumbnail");
        }
      }

      const { error } = await supabase
        .from("educational_content")
        .insert({
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
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conteúdo educacional criado com sucesso!",
      });

      resetForm();
      setOpen(false);
      onContentAdded();
    } catch (error: any) {
      console.error("Error creating content:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar conteúdo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo Educacional</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do conteúdo"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do conteúdo"
                required
              />
            </div>

            <div>
              <Label htmlFor="contentType">Tipo de Conteúdo *</Label>
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
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes || ""}
                onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 15"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="investimentos, poupança, orçamento"
              />
            </div>

            {contentType === "article" && (
              <div className="col-span-2">
                <Label htmlFor="contentBody">Conteúdo do Artigo (HTML)</Label>
                <Textarea
                  id="contentBody"
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                  placeholder="<p>Conteúdo do artigo...</p>"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="file">Arquivo (PDF/Vídeo)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept={contentType === "video" ? "video/*" : ".pdf"}
                  className="flex-1"
                />
                {file && (
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {file.name}
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="thumbnail"
                  type="file"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="flex-1"
                />
                {thumbnail && (
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {thumbnail.name}
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="published">Publicar imediatamente</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
                  <Upload className="w-4 h-4 mr-2" />
                  Criar Conteúdo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
