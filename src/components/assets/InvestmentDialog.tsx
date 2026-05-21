import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/utils/errors";
import { createInvestment, updateInvestment } from "@/services/investment-service";

export interface Investment {
  id: string;
  investment_type: string;
  name: string;
  description: string | null;
  currency: string;
  status: string;
  initial_investment: number | null;
  current_value: number | null;
  // Mutual Fund fields
  fund_code: string | null;
  fund_category: string | null;
  fund_house: string | null;
  units: number | null;
  avg_cost: number | null;
  current_nav: number | null;
  this_year_contribution?: number | null;
  // Stock fields
  symbol: string | null;
  company_name: string | null;
  exchange: string | null;
  shares: number | null;
  avg_price: number | null;
  current_price: number | null;
  sector: string | null;
  // Bond fields
  bond_type: string | null;
  issuer: string | null;
  face_value: number | null;
  coupon_rate: number | null;
  maturity_date: string | null;
  // MT4/MT5 fields
  broker: string | null;
  account_number: string | null;
  account_type: string | null;
  balance: number | null;
  equity: number | null;
  profit_loss: number | null;
  mt_platform: string | null;
  mt_server: string | null;
  api_key: string | null;
  last_sync: string | null;
  sync_status: string | null;
  // Business fields
  business_name: string | null;
  investment_date: string | null;
  ownership_percent: number | null;
}

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
  onSuccess: () => void;
  defaultType?: string;
}

type InvestmentFormData = Record<string, string>;

export function InvestmentDialog({ open, onOpenChange, investment, onSuccess, defaultType }: InvestmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [investmentType, setInvestmentType] = useState(defaultType || "mutual_fund");
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: "",
    description: "",
    currency: "THB",
    status: "active",
    initial_investment: "",
    current_value: "",
  });

  useEffect(() => {
    if (investment) {
      setInvestmentType(investment.investment_type);
      setFormData({
        name: investment.name,
        description: investment.description || "",
        currency: investment.currency,
        status: investment.status,
        initial_investment: investment.initial_investment?.toString() || "",
        current_value: investment.current_value?.toString() || "",
        // Mutual Fund
        fund_code: investment.fund_code || "",
        fund_category: investment.fund_category || "General",
        fund_house: investment.fund_house || "",
        units: investment.units?.toString() || "",
        avg_cost: investment.avg_cost?.toString() || "",
        this_year_contribution: investment.this_year_contribution?.toString() || "",
        // Stock
        symbol: investment.symbol || "",
        company_name: investment.company_name || "",
        exchange: investment.exchange || "SET",
        shares: investment.shares?.toString() || "",
        avg_price: investment.avg_price?.toString() || "",
        current_price: investment.current_price?.toString() || "",
        sector: investment.sector || "",
        // Bond
        bond_type: investment.bond_type || "Government",
        issuer: investment.issuer || "",
        face_value: investment.face_value?.toString() || "",
        coupon_rate: investment.coupon_rate?.toString() || "",
        maturity_date: investment.maturity_date || "",
        // MT4/MT5
        broker: investment.broker || "",
        account_number: investment.account_number || "",
        account_type: investment.account_type || "Live",
        balance: investment.balance?.toString() || "",
        equity: investment.equity?.toString() || "",
        profit_loss: investment.profit_loss?.toString() || "",
        mt_platform: investment.mt_platform || "MT5",
        mt_server: investment.mt_server || "",
        api_key: investment.api_key || "",
        last_sync: investment.last_sync || "",
        sync_status: investment.sync_status || "pending",
        // Business
        business_name: investment.business_name || "",
        investment_date: investment.investment_date || "",
        ownership_percent: investment.ownership_percent?.toString() || "",
      });
    } else {
      setInvestmentType(defaultType || "mutual_fund");
      setFormData({
        name: "",
        description: "",
        currency: "THB",
        status: "active",
        initial_investment: "",
        current_value: "",
        fund_category: "General",
        exchange: "SET",
        bond_type: "Government",
        account_type: "Live",
        mt_platform: "MT5",
        sync_status: "pending",
      });
    }
  }, [investment, open, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const investmentData: Partial<Tables<"investments">> = {
        investment_type: investmentType,
        name: formData.name,
        description: formData.description || null,
        currency: formData.currency,
        status: formData.status,
        initial_investment: formData.initial_investment ? parseFloat(formData.initial_investment) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
        user_id: user.id,
      };

      // Add type-specific fields
      if (investmentType === "mutual_fund") {
        investmentData.fund_code = formData.fund_code || null;
        investmentData.fund_category = formData.fund_category || null;
        investmentData.fund_house = formData.fund_house || null;
        investmentData.units = formData.units ? parseFloat(formData.units) : null;
        investmentData.avg_cost = formData.avg_cost ? parseFloat(formData.avg_cost) : null;
        investmentData.current_nav = formData.current_nav ? parseFloat(formData.current_nav) : null;
        investmentData.this_year_contribution = formData.this_year_contribution !== "" ? parseFloat(formData.this_year_contribution) : null;
      } else if (investmentType === "stock") {
        investmentData.symbol = formData.symbol || null;
        investmentData.company_name = formData.company_name || null;
        investmentData.exchange = formData.exchange || null;
        investmentData.shares = formData.shares ? parseFloat(formData.shares) : null;
        investmentData.avg_price = formData.avg_price ? parseFloat(formData.avg_price) : null;
        investmentData.current_price = formData.current_price ? parseFloat(formData.current_price) : null;
        investmentData.sector = formData.sector || null;
      } else if (investmentType === "bond") {
        investmentData.bond_type = formData.bond_type || null;
        investmentData.issuer = formData.issuer || null;
        investmentData.face_value = formData.face_value ? parseFloat(formData.face_value) : null;
        investmentData.coupon_rate = formData.coupon_rate ? parseFloat(formData.coupon_rate) : null;
        investmentData.maturity_date = formData.maturity_date || null;
      } else if (investmentType === "mt4_mt5") {
        investmentData.broker = formData.broker || null;
        investmentData.account_number = formData.account_number || null;
        investmentData.account_type = formData.account_type || null;
        investmentData.balance = formData.balance ? parseFloat(formData.balance) : null;
        investmentData.equity = formData.equity ? parseFloat(formData.equity) : null;
        investmentData.profit_loss = formData.profit_loss ? parseFloat(formData.profit_loss) : null;
        investmentData.mt_platform = formData.mt_platform || null;
        investmentData.mt_server = formData.mt_server || null;
        investmentData.api_key = formData.api_key || null;
        investmentData.sync_status = formData.sync_status || "pending";
      } else if (investmentType === "business") {
        investmentData.business_name = formData.business_name || null;
        investmentData.investment_date = formData.investment_date || null;
        investmentData.ownership_percent = formData.ownership_percent ? parseFloat(formData.ownership_percent) : null;
      }

      if (investment) {
        // Update
        await updateInvestment(investment.id, user.id, investmentData);

        toast({
          title: "Success",
          description: "Investment updated successfully",
        });
      } else {
        // Create
        await createInvestment(investmentData);

        toast({
          title: "Success",
          description: "Investment created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save investment"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{investment ? "Edit Investment" : "Add Investment"}</DialogTitle>
          <DialogDescription>
            {investment ? "Update your investment details" : "Add a new investment to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!investment && (
              <div className="grid gap-2">
                <Label htmlFor="investment_type">Investment Type *</Label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="mt4_mt5">MT4/MT5 Trading</SelectItem>
                    <SelectItem value="business">Business Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Common Fields */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder={
                  investmentType === "mutual_fund" ? "Fund Name" :
                    investmentType === "stock" ? "Stock Symbol" :
                      investmentType === "bond" ? "Bond Name" :
                        investmentType === "mt4_mt5" ? "Account Name" :
                          "Business Name"
                }
                required
              />
            </div>

            {/* Mutual Fund Fields */}
            {investmentType === "mutual_fund" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fund_code">Fund Code</Label>
                    <Input
                      id="fund_code"
                      value={formData.fund_code}
                      onChange={(e) => updateFormData("fund_code", e.target.value)}
                      placeholder="e.g., K-RMF-EQ"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fund_category">Category *</Label>
                    <Select value={formData.fund_category} onValueChange={(v) => updateFormData("fund_category", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RMF">RMF</SelectItem>
                        <SelectItem value="LTF">LTF</SelectItem>
                        <SelectItem value="Thai ESG">Thai ESG</SelectItem>
                        <SelectItem value="SSF">SSF</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fund_house">Fund House</Label>
                  <Input
                    id="fund_house"
                    value={formData.fund_house}
                    onChange={(e) => updateFormData("fund_house", e.target.value)}
                    placeholder="e.g., Kasikorn, SCB"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      step="0.0001"
                      value={formData.units}
                      onChange={(e) => updateFormData("units", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avg_cost">Avg Cost</Label>
                    <Input
                      id="avg_cost"
                      type="number"
                      step="0.0001"
                      value={formData.avg_cost}
                      onChange={(e) => updateFormData("avg_cost", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current_nav">Current NAV</Label>
                    <Input
                      id="current_nav"
                      type="number"
                      step="0.0001"
                      value={formData.current_nav}
                      onChange={(e) => updateFormData("current_nav", e.target.value)}
                    />
                  </div>
                </div>
                {/* This Year Contribution - for tax deduction tracking */}
                {(formData.fund_category === "RMF" || formData.fund_category === "SSF" || formData.fund_category === "Thai ESG") && (
                  <div className="grid gap-2">
                    <Label htmlFor="this_year_contribution">This Year Contribution (฿)</Label>
                    <Input
                      id="this_year_contribution"
                      type="number"
                      step="0.01"
                      value={formData.this_year_contribution}
                      onChange={(e) => updateFormData("this_year_contribution", e.target.value)}
                      placeholder="Amount contributed this year for tax deduction"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your contribution for the current tax year to track deduction limits
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Stock Fields */}
            {investmentType === "stock" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => updateFormData("symbol", e.target.value)}
                      placeholder="e.g., KBANK"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select value={formData.exchange} onValueChange={(v) => updateFormData("exchange", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SET">SET</SelectItem>
                        <SelectItem value="MAI">MAI</SelectItem>
                        <SelectItem value="NYSE">NYSE</SelectItem>
                        <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => updateFormData("company_name", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shares">Shares</Label>
                    <Input
                      id="shares"
                      type="number"
                      step="0.0001"
                      value={formData.shares}
                      onChange={(e) => updateFormData("shares", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avg_price">Avg Price</Label>
                    <Input
                      id="avg_price"
                      type="number"
                      step="0.01"
                      value={formData.avg_price}
                      onChange={(e) => updateFormData("avg_price", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current_price">Current Price</Label>
                    <Input
                      id="current_price"
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => updateFormData("current_price", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => updateFormData("sector", e.target.value)}
                    placeholder="e.g., Finance, Energy"
                  />
                </div>
              </>
            )}

            {/* Bond Fields */}
            {investmentType === "bond" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bond_type">Bond Type</Label>
                    <Select value={formData.bond_type} onValueChange={(v) => updateFormData("bond_type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Municipal">Municipal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="issuer">Issuer</Label>
                    <Input
                      id="issuer"
                      value={formData.issuer}
                      onChange={(e) => updateFormData("issuer", e.target.value)}
                      placeholder="Issuing entity"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="face_value">Face Value</Label>
                    <Input
                      id="face_value"
                      type="number"
                      step="0.01"
                      value={formData.face_value}
                      onChange={(e) => updateFormData("face_value", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="coupon_rate">Coupon Rate (%)</Label>
                    <Input
                      id="coupon_rate"
                      type="number"
                      step="0.01"
                      value={formData.coupon_rate}
                      onChange={(e) => updateFormData("coupon_rate", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maturity_date">Maturity Date</Label>
                  <Input
                    id="maturity_date"
                    type="date"
                    value={formData.maturity_date}
                    onChange={(e) => updateFormData("maturity_date", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* MT4/MT5 Fields */}
            {investmentType === "mt4_mt5" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mt_platform">Platform *</Label>
                    <Select value={formData.mt_platform} onValueChange={(v) => updateFormData("mt_platform", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MT4">MetaTrader 4</SelectItem>
                        <SelectItem value="MT5">MetaTrader 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select value={formData.account_type} onValueChange={(v) => updateFormData("account_type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Live">Live</SelectItem>
                        <SelectItem value="Demo">Demo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="broker">Broker *</Label>
                    <Input
                      id="broker"
                      value={formData.broker}
                      onChange={(e) => updateFormData("broker", e.target.value)}
                      placeholder="e.g., XM Global"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => updateFormData("account_number", e.target.value)}
                      placeholder="Your MT account #"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mt_server">Server</Label>
                  <Input
                    id="mt_server"
                    value={formData.mt_server}
                    onChange={(e) => updateFormData("mt_server", e.target.value)}
                    placeholder="e.g., XMGlobal-Real 3"
                  />
                </div>

                {formData.last_sync && (
                  <div className="grid gap-2">
                    <Label>Sync Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={formData.sync_status === "active" ? "default" : "secondary"}>
                        {formData.sync_status === "active" ? "Active" : "Pending"}
                      </Badge>
                      {formData.last_sync && (
                        <span className="text-sm text-muted-foreground">
                          Last sync: {new Date(formData.last_sync).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => updateFormData("balance", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="equity">Equity</Label>
                    <Input
                      id="equity"
                      type="number"
                      step="0.01"
                      value={formData.equity}
                      onChange={(e) => updateFormData("equity", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profit_loss">P/L</Label>
                    <Input
                      id="profit_loss"
                      type="number"
                      step="0.01"
                      value={formData.profit_loss}
                      onChange={(e) => updateFormData("profit_loss", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Business Fields */}
            {investmentType === "business" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => updateFormData("business_name", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="investment_date">Investment Date</Label>
                    <Input
                      id="investment_date"
                      type="date"
                      value={formData.investment_date}
                      onChange={(e) => updateFormData("investment_date", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ownership_percent">Ownership %</Label>
                    <Input
                      id="ownership_percent"
                      type="number"
                      step="0.01"
                      value={formData.ownership_percent}
                      onChange={(e) => updateFormData("ownership_percent", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Common Value Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="initial_investment">Initial Investment</Label>
                <Input
                  id="initial_investment"
                  type="number"
                  step="0.01"
                  value={formData.initial_investment}
                  onChange={(e) => updateFormData("initial_investment", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_value">Current Value</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => updateFormData("current_value", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => updateFormData("currency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB (฿)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => updateFormData("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : investment ? "Update Investment" : "Add Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
