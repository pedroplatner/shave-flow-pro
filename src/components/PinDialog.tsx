import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function PinDialog({ open, onOpenChange, onConfirm }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleConfirm = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_barbershop_pin', { _pin: pin });
      if (error) throw error;
      if (data) {
        onConfirm();
        onOpenChange(false);
        setPin('');
      } else {
        toast.error('PIN incorreto');
      }
    } catch {
      toast.error('Erro ao verificar PIN');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPin(''); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Digite o PIN do Administrador</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="password"
            maxLength={4}
            placeholder="****"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            onKeyDown={e => { if (e.key === 'Enter' && pin.length === 4) handleConfirm(); }}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); setPin(''); }}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={pin.length !== 4 || verifying}>
            {verifying ? 'Verificando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export async function checkHasPin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_barbershop_pin');
  if (error) return false;
  return !!data;
}

export function withPinVerification(action: () => void, setPinOpen: (v: boolean) => void, setPinAction: (fn: () => void) => void) {
  checkHasPin().then(hasPin => {
    if (!hasPin) {
      action();
    } else {
      setPinAction(() => action);
      setPinOpen(true);
    }
  });
}
