"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  TAX_REGIME_PRESETS,
  TAX_REGIMES,
  TAX_MODES,
  type TaxMode,
  type TaxRegime,
} from "@daxabithms/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBranch } from "@/hooks/use-branch";
import { ApiError } from "@/lib/api";

export function AddBranchDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [country, setCountry] = useState("IN");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("INDIA_GST");
  const [taxMode, setTaxMode] = useState<TaxMode>("INCLUSIVE");
  const [taxLabel, setTaxLabel] = useState("");
  const [taxId, setTaxId] = useState("");

  const createBranch = useCreateBranch();

  const handleCountryChange = (c: string) => {
    setCountry(c);
    if (c === "IN") {
      setTaxRegime("INDIA_GST");
      setTaxMode("INCLUSIVE");
    } else if (c === "ES") {
      setTaxRegime("ES_IVA");
      setTaxMode("INCLUSIVE");
    } else if (c === "US") {
      setTaxRegime("US_SALES_TAX");
      setTaxMode("EXCLUSIVE");
    } else if (["FR", "DE", "IT", "NL", "BE", "PT", "IE"].includes(c)) {
      setTaxRegime("EU_VAT");
      setTaxMode("INCLUSIVE");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    createBranch.mutate(
      {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        country: country.slice(0, 2).toUpperCase(),
        taxRegime,
        taxMode,
        taxLabel: taxLabel.trim() || undefined,
        taxId: taxId.trim() || undefined,
      },
      {
        onSuccess: (b) => {
          toast.success(`Branch "${b.name}" created`);
          setOpen(false);
          setName("");
          setAddress("");
          setPhone("");
          setGstNumber("");
          setTaxLabel("");
          setTaxId("");
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Could not create branch. Please check input values.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Add Branch</span>
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>
            Create an independent restaurant branch with its own tables, kitchen, and inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-name">Branch name *</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Downtown, Uptown, Airport Terminal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-address">Address</Label>
            <Input
              id="branch-address"
              placeholder="Full street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-phone">Phone</Label>
              <Input
                id="branch-phone"
                type="tel"
                placeholder="+91..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-country">Country</Label>
              <Input
                id="branch-country"
                maxLength={2}
                placeholder="IN"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-tax-regime">Tax Regime</Label>
              <Select
                value={taxRegime}
                onValueChange={(val) => setTaxRegime(val as TaxRegime)}
              >
                <SelectTrigger id="branch-tax-regime">
                  <SelectValue placeholder="Select regime" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_REGIMES.map((regime) => (
                    <SelectItem key={regime} value={regime}>
                      {TAX_REGIME_PRESETS[regime]?.displayName ?? regime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-tax-mode">Tax Mode</Label>
              <Select
                value={taxMode}
                onValueChange={(val) => setTaxMode(val as TaxMode)}
              >
                <SelectTrigger id="branch-tax-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAX_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-tax-label">Tax Label</Label>
              <Input
                id="branch-tax-label"
                placeholder="GST / VAT / Sales Tax"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-tax-id">Tax / GST ID</Label>
              <Input
                id="branch-tax-id"
                placeholder="Tax registration #"
                value={taxId || gstNumber}
                onChange={(e) => {
                  setTaxId(e.target.value);
                  setGstNumber(e.target.value);
                }}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBranch.isPending || !name.trim()}
            >
              {createBranch.isPending ? "Creating…" : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
