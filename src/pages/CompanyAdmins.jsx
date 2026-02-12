import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserCog, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import AdminDialog from "../components/admins/AdminDialog";
import { useTheme } from "../components/common/ThemeWrapper";

export default function CompanyAdmins() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperAdmin = !currentUser?.company_id;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: !!currentUser,
  });

  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  // Mostrar todos los usuarios excepto el super admin actual
  const companyAdmins = users.filter(u => u.id !== currentUser?.id);

  const handleInviteAdmin = async (data) => {
    try {
      await base44.users.inviteUser(data.email, "user");
      toast.success(`Invitación enviada a ${data.email}. Una vez que acepte, asígnale la empresa desde esta pantalla.`);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error("Error al enviar la invitación");
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setSelectedAdmin(null);
    },
  });

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    if (selectedAdmin) {
      updateMutation.mutate({ id: selectedAdmin.id, data });
    } else {
      await handleInviteAdmin(data);
    }
  };

  const filteredAdmins = companyAdmins.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesCompany = companyFilter === "all" || u.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Administradores de Empresa" 
          description="Gestiona los administradores de cada empresa"
          actions={
            <Button 
              onClick={() => { setSelectedAdmin(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invitar Administrador
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-10", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-yellow-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className={cn("w-full sm:w-52", theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900')}>
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Admins Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-44 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
            ))}
          </div>
        ) : filteredAdmins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmins.map(admin => {
              const company = companiesMap[admin.company_id];
              return (
                <div 
                  key={admin.id}
                  onClick={() => handleEdit(admin)}
                  className={cn("group relative overflow-hidden rounded-2xl border p-5 cursor-pointer backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <StatusBadge status={admin.status || 'active'} />
                  </div>
                  
                  <h3 className={cn("text-lg font-semibold mb-1", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {admin.full_name || 'Sin nombre'}
                  </h3>
                  
                  <div className={cn("flex items-center gap-2 text-sm mb-3", theme === 'dark' ? 'text-slate-400' : 'text-gray-600')}>
                    <Mail className={cn("w-4 h-4", theme === 'dark' ? 'text-slate-500' : 'text-gray-400')} />
                    <span className="truncate">{admin.email}</span>
                  </div>

                  {company && (
                    <div className={cn("flex items-center gap-2 text-sm", theme === 'dark' ? 'text-slate-500' : 'text-gray-500')}>
                      <Building2 className="w-4 h-4" />
                      <span>{company.name}</span>
                    </div>
                  )}

                  {!admin.company_id && (
                    <p className={cn("text-xs mt-2", theme === 'dark' ? 'text-amber-400' : 'text-amber-600')}>Sin empresa asignada</p>
                  )}

                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={UserCog}
            title="Sin administradores"
            description={search ? "No se encontraron administradores" : "Invita al primer administrador de empresa"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedAdmin(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invitar Administrador
                </Button>
              )
            }
          />
        )}

        <AdminDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          admin={selectedAdmin}
          companies={companies}
          onSave={handleSave}
          isLoading={updateMutation.isPending}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
}