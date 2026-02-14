import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemUpdate {
  id: string;
  type: string;
  module: string;
  description: string;
  published_at: string;
}

const AdminSystemUpdates = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState("update");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from("system_updates")
      .select("id, type, module, description, published_at")
      .order("published_at", { ascending: false });
    setUpdates((data as SystemUpdate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchUpdates(); }, []);

  const handleAdd = async () => {
    if (!module.trim() || !description.trim()) {
      toast.error("Preencha o módulo e a descrição.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("system_updates").insert({
      type,
      module: module.trim(),
      description: description.trim(),
      published_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Erro ao salvar atualização.");
    } else {
      toast.success("Atualização publicada!");
      setModule("");
      setDescription("");
      fetchUpdates();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("system_updates").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar.");
    } else {
      toast.success("Removida!");
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "create": return <Badge className="bg-green-500/20 text-green-500 border-none">Novo</Badge>;
      case "update": return <Badge className="bg-blue-500/20 text-blue-500 border-none">Atualização</Badge>;
      case "config": return <Badge className="bg-purple-500/20 text-purple-500 border-none">Config</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Atualizações do Sistema</h2>
        <p className="text-muted-foreground">Publique implementações e melhorias da plataforma visíveis para os comércios.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Atualização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Novo (funcionalidade)</SelectItem>
                <SelectItem value="update">Atualização (melhoria)</SelectItem>
                <SelectItem value="config">Configuração</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Módulo (ex: Treinamento, Estoque, Pedidos)" value={module} onChange={(e) => setModule(e.target.value)} />
          </div>
          <Textarea placeholder="Descreva a implementação ou melhoria realizada..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Publicar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Histórico ({updates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização registrada.</p>
          ) : (
            <div className="space-y-2">
              {updates.map((u) => (
                <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getTypeBadge(u.type)}
                      <span className="text-xs font-medium">{u.module}</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {format(new Date(u.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{u.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemUpdates;
