import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import CompanyDialog from "../components/companies/CompanyDialog";
import PullToRefresh from "../components/common/PullToRefresh";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Companies() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
    await queryClient.invalidateQueries({ queryKey: ['locations'] });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onMutate: async (newCompany) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const previousCompanies = queryClient.getQueryData(['companies']);
      queryClient.setQueryData(['companies'], (old = []) => [
        ...old,
        { ...newCompany, id: 'temp-' + Date.now() }
      ]);
      return { previousCompanies };
    },
    onError: (err, newCompany, context) => {
      queryClient.setQueryData(['companies'], context.previousCompanies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const previousCompanies = queryClient.getQueryData(['companies']);
      queryClient.setQueryData(['companies'], (old = []) =>
        old.map(c => c.id === id ? { ...c, ...data } : c)
      );
      return { previousCompanies };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['companies'], context.previousCompanies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDialogOpen(false);
      setSelectedCompany(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const previousCompanies = queryClient.getQueryData(['companies']);
      queryClient.setQueryData(['companies'], (old = []) =>
        old.filter(c => c.id !== deletedId)
      );
      return { previousCompanies };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['companies'], context.previousCompanies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDialogOpen(false);
      setSelectedCompany(null);
    },
  });

  const handleSave = (data) => {
    if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const getCompanyStats = (companyId) => {
    const companyLocations = locations.filter(l => l.company_id === companyId).length;
    const companyAdmins = users.filter(u => u.company_id === companyId).length;
    return { locations: companyLocations, admins: companyAdmins };
  };

  const canDeleteCompany = (companyId) => {
    return locations.filter(l => l.company_id === companyId).length === 0;
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.tax_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
        <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Empresas" 
          description="Gestiona las empresas del sistema"
          actions={
            <Button 
              onClick={() => { setSelectedCompany(null); setDialogOpen(true); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
          }
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'dark' ? 'text-slate-400' : 'text-gray-400')} />
          <Input
            placeholder="Buscar por nombre o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-10 max-w-md", theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400')}
          />
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className={cn("h-48 rounded-2xl", theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-200')} />
            ))}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map(company => {
              const stats = getCompanyStats(company.id);
              return (
                <div 
                  key={company.id}
                  onClick={() => handleEdit(company)}
                  className={cn("group relative overflow-hidden rounded-2xl border p-6 cursor-pointer backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-500/10' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {company.logo_url ? (
                        <div className={cn("p-2 rounded-xl border", theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200')}>
                          <img src={company.logo_url} alt={company.name} className="w-12 h-12 object-contain" />
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 text-purple-400 group-hover:from-purple-500/20 group-hover:to-purple-600/10 group-hover:border-purple-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-purple-500/5">
                          <Building2 className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <StatusBadge status={company.status} />
                  </div>
                  
                  <div className="relative mb-4">
                    <h3 className={cn("text-xl font-black mb-1", theme === 'dark' ? 'text-white bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent' : 'text-gray-900')}>{company.name}</h3>
                    {company.tax_id && (
                      <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-zinc-600' : 'text-gray-500')}>{company.tax_id}</p>
                    )}
                  </div>
                  
                  <div className="relative flex items-center gap-2">
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-gray-100/50 border-gray-200/50')}>
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span className={cn("text-sm font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>{stats.locations}</span>
                      <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>locaciones</span>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-gray-100/50 border-gray-200/50')}>
                      <Users className="w-4 h-4 text-cyan-500" />
                      <span className={cn("text-sm font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>{stats.admins}</span>
                      <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>admins</span>
                    </div>
                  </div>

                  <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Sin empresas"
            description={search ? "No se encontraron empresas" : "Crea tu primera empresa"}
            action={
              !search && (
                <Button 
                  onClick={() => { setSelectedCompany(null); setDialogOpen(true); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Empresa
                </Button>
              )
            }
          />
        )}

        <CompanyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          company={selectedCompany}
          onSave={handleSave}
          onDelete={selectedCompany && canDeleteCompany(selectedCompany.id) ? () => deleteMutation.mutate(selectedCompany.id) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          hasLocations={selectedCompany ? !canDeleteCompany(selectedCompany.id) : false}
        />
        </div>
      </div>
    </PullToRefresh>
  );
}