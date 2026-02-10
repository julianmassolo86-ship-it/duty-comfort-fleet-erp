import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserCog, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import AdminDialog from "../components/admins/AdminDialog";

export default function CompanyAdmins() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const companiesMap = companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  // Solo mostrar administradores de empresa (no super admins)
  const companyAdmins = users.filter(u => u.user_role === 'company_admin');

  const handleInviteAdmin = async (data) => {
    await base44.users.inviteUser(data.email, "user");
    // El usuario se creará con role "user", pero actualizamos sus datos adicionales
    // Nota: El usuario deberá ser actualizado manualmente después de aceptar la invitación
    toast.success(`Invitación enviada a ${data.email}`);
    setDialogOpen(false);
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
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Administradores de Empresa" 
          description="Gestiona los administradores de cada empresa"
          actions={
            <Button 
              onClick={() => { setSelectedAdmin(null); setDialogOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invitar Administrador
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-slate-800/50 border-slate-700 text-white">
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
              <Skeleton key={i} className="h-44 rounded-2xl bg-slate-800/50" />
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
                  className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 cursor-pointer transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <StatusBadge status={admin.status || 'active'} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {admin.full_name || 'Sin nombre'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{admin.email}</span>
                  </div>

                  {company && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building2 className="w-4 h-4" />
                      <span>{company.name}</span>
                    </div>
                  )}

                  {!admin.company_id && (
                    <p className="text-xs text-amber-400 mt-2">Sin empresa asignada</p>
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
                  className="bg-blue-600 hover:bg-blue-700"
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
        />
      </div>
    </div>
  );
}