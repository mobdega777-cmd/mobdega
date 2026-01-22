import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText,
  ShoppingBag,
  Heart
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document: string | null;
  birthday: string | null;
  cep: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  address_number: string | null;
  complement: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  favoriteStores: number;
}

interface UserDetailsModalProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsModal = ({ user, open, onOpenChange }: UserDetailsModalProps) => {
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteStores: 0,
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserDetails();
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch orders count and total
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('user_id', user.user_id);

    // Fetch favorites count
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user_id);

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user_id);

    setStats({
      totalOrders: orders?.length || 0,
      totalSpent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
      favoriteStores: favoritesCount || 0,
    });

    setRoles(userRoles?.map(r => r.role) || []);
    setLoading(false);
  };

  if (!user) return null;

  const formatAddress = () => {
    const parts = [
      user.address,
      user.address_number,
      user.complement,
      user.neighborhood,
      user.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin':
        return <Badge variant="destructive">Master Admin</Badge>;
      case 'commerce':
        return <Badge variant="secondary">Comerciante</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.full_name}</h3>
              <div className="flex gap-1 mt-1">
                {roles.map(role => (
                  <span key={role}>{getRoleBadge(role)}</span>
                ))}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <ShoppingBag className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Pedidos</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <FileText className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.favoriteStores}</p>
                <p className="text-xs text-muted-foreground">Favoritos</p>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Informações de Contato
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user.document && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{user.document}</span>
                  </div>
                )}

                {user.birthday && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(user.birthday).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>

            {formatAddress() && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Endereço
                  </h4>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{formatAddress()}</p>
                      {user.cep && (
                        <p className="text-muted-foreground">CEP: {user.cep}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {user.bio && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Bio
                  </h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Timestamps */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
              <span>Atualizado em: {new Date(user.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;