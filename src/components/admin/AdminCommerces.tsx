import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ban,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type CommerceStatus = Database['public']['Enums']['commerce_status'];

interface Commerce {
  id: string;
  fantasy_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string | null;
  document_type: string;
  document: string;
  status: CommerceStatus;
  created_at: string;
  plans: { name: string; price: number } | null;
}

const AdminCommerces = () => {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCommerce, setSelectedCommerce] = useState<Commerce | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCommerces();
  }, []);

  const fetchCommerces = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('commerces')
      .select('*, plans(name, price)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commerces:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar comércios',
        description: error.message,
      });
    } else {
      setCommerces(data || []);
    }
    setIsLoading(false);
  };

  const updateStatus = async (commerceId: string, status: CommerceStatus, reason?: string) => {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }
    if (reason) {
      updateData.rejection_reason = reason;
    }

    const { error } = await supabase
      .from('commerces')
      .update(updateData)
      .eq('id', commerceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } else {
      const statusMessages = {
        approved: 'Comércio aprovado com sucesso!',
        rejected: 'Comércio rejeitado.',
        suspended: 'Comércio suspenso.',
        pending: 'Status alterado para pendente.',
      };
      toast({
        title: statusMessages[status],
      });
      fetchCommerces();
    }
  };

  const handleReject = () => {
    if (selectedCommerce && rejectReason) {
      updateStatus(selectedCommerce.id, 'rejected', rejectReason);
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedCommerce(null);
    }
  };

  const filteredCommerces = commerces.filter(commerce => {
    const matchesSearch = 
      commerce.fantasy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commerce.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || commerce.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CommerceStatus) => {
    const config = {
      pending: { label: "Pendente", variant: "warning" as const, icon: Clock },
      approved: { label: "Aprovado", variant: "success" as const, icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
      suspended: { label: "Suspenso", variant: "secondary" as const, icon: Ban },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const statusCounts = {
    all: commerces.length,
    pending: commerces.filter(c => c.status === 'pending').length,
    approved: commerces.filter(c => c.status === 'approved').length,
    rejected: commerces.filter(c => c.status === 'rejected').length,
    suspended: commerces.filter(c => c.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Adegas / Tabacarias
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os comércios cadastrados
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "pending", label: "Pendentes" },
          { key: "approved", label: "Aprovados" },
          { key: "rejected", label: "Rejeitados" },
          { key: "suspended", label: "Suspensos" },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(key)}
            className="gap-2"
          >
            {label}
            <span className="bg-background/20 px-1.5 py-0.5 rounded text-xs">
              {statusCounts[key as keyof typeof statusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commerces List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="border-border/50">
            <CardContent className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : filteredCommerces.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum comércio encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredCommerces.map((commerce) => (
            <Card key={commerce.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                      {commerce.fantasy_name.charAt(0)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-foreground">
                          {commerce.fantasy_name}
                        </h3>
                        {getStatusBadge(commerce.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {commerce.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {commerce.phone}
                        </span>
                        {commerce.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {commerce.city}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {commerce.document_type.toUpperCase()}: {commerce.document}
                        </span>
                        {commerce.plans && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            {commerce.plans.name} - R$ {commerce.plans.price}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {commerce.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          className="gap-1"
                          onClick={() => updateStatus(commerce.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => {
                            setSelectedCommerce(commerce);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {commerce.status !== 'approved' && (
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => updateStatus(commerce.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </DropdownMenuItem>
                        )}
                        {commerce.status !== 'suspended' && (
                          <DropdownMenuItem 
                            className="gap-2 text-yellow-500"
                            onClick={() => updateStatus(commerce.id, 'suspended')}
                          >
                            <Ban className="w-4 h-4" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Comércio</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedCommerce?.fantasy_name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite o motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCommerces;
