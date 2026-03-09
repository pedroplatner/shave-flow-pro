import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function PinDialog({ open, onOpenChange, onConfirm }: PinDialogProps) {
  const [pin, setPin] = useState('');

  const handleConfirm = () => {
    const savedPin = localStorage.getItem('caixa_pin');
    if (!savedPin) {
      onConfirm();
      onOpenChange(false);
      setPin('');
      return;
    }
    if (pin === savedPin) {
      onConfirm();
      onOpenChange(false);
      setPin('');
    } else {
      toast.error('PIN incorreto');
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
          <Button onClick={handleConfirm} disabled={pin.length !== 4}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function withPinVerification(action: () => void, setPinOpen: (v: boolean) => void, setPinAction: (fn: () => void) => void) {
  const savedPin = localStorage.getItem('caixa_pin');
  if (!savedPin) {
    action();
  } else {
    setPinAction(() => action);
    setPinOpen(true);
  }
}
