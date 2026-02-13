import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBarbershopId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['barbershop', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.id as string | null;
    },
    enabled: !!user,
  });
}

export function useBarbeiros() {
  const { data: bsId } = useBarbershopId();
  return useQuery({
    queryKey: ['barbeiros', bsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('barbershop_id', bsId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!bsId,
  });
}

export function useServicos() {
  const { data: bsId } = useBarbershopId();
  return useQuery({
    queryKey: ['servicos', bsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('barbershop_id', bsId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!bsId,
  });
}

export function useProdutos() {
  const { data: bsId } = useBarbershopId();
  return useQuery({
    queryKey: ['produtos', bsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('barbershop_id', bsId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!bsId,
  });
}

export function useAtendimentos() {
  const { data: bsId } = useBarbershopId();
  return useQuery({
    queryKey: ['atendimentos', bsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('barbershop_id', bsId!)
        .order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bsId,
  });
}
