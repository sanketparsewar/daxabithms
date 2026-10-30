"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateStaff, type StaffMember } from "@/hooks/use-staff";
import { ApiError } from "@/lib/api";

interface SetPinDialogProps {
  member: StaffMember;
}

export function SetPinDialog({ member }: SetPinDialogProps) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const updateStaff = useUpdateStaff();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPin("");
    }
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) {
      toast.error("PIN must be 4 to 8 digits");
      return;
    }

    updateStaff.mutate(
      { id: member.id, dto: { pin } },
      {
        onSuccess: () => {
          toast.success(`PIN updated for ${member.name}`);
          setOpen(false);
          setPin("");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Failed to update PIN"),
      },
    );
  };

  const onRemovePin = () => {
    if (!confirm(`Remove fast-login PIN for ${member.name}?`)) return;

    updateStaff.mutate(
      { id: member.id, dto: { pin: null } },
      {
        onSuccess: () => {
          toast.success(`PIN removed for ${member.name}`);
          setOpen(false);
          setPin("");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Failed to remove PIN"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title={member.hasPin ? "Change fast-login PIN" : "Set fast-login PIN"}
          >
            <KeyRound className="mr-1 h-3.5 w-3.5" />
            {member.hasPin ? "Change PIN" : "Set PIN"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{member.hasPin ? "Change Fast-Login PIN" : "Set Fast-Login PIN"}</DialogTitle>
            <DialogDescription>
              Assign a 4–8 digit PIN for {member.name} to allow rapid terminal sign-in.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pin-input">New PIN (4–8 digits)</Label>
            <Input
              id="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            {member.hasPin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={onRemovePin}
                disabled={updateStaff.isPending}
              >
                Remove PIN
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updateStaff.isPending || pin.length < 4}>
                {updateStaff.isPending ? "Saving…" : "Save PIN"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
