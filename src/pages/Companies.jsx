import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Building2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatusBadge from "../components/common/StatusBadge";
import CompanyDialog from "../components/companies/CompanyDialog";

export default function Companies() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDialogOpen(false);
      setSelectedCompany(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
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
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 max-w-md"
          />
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-zinc-900/50" />
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
                  className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 cursor-pointer transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    {company.logo_url ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/20">
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    <StatusBadge status={company.status} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">{company.name}</h3>
                  {company.tax_id && (
                    <p className="text-sm text-slate-400 mb-4">{company.tax_id}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{stats.locations} locaciones</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{stats.admins} admins</span>
                    </div>
                  </div>

                  <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
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
  );
}