import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import type { LucideIcon } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, Home, Car, Briefcase, DollarSign, TrendingUp, Package } from "lucide-react";
import SEO from "@/components/SEO";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { getProfileDisplayName } from "@/services/profile-service";
import { getAssetSummary } from "@/services/financial-overview-service";

interface AssetCategory {
  name: string;
  icon: LucideIcon;
  total: number;
  items: number;
  path: string;
}

type LegendEntry = { payload?: { value?: number } };

const COLORS = ["#72E3AD", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

const Assets = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchUserProfile(session.user.id);
        fetchAssets(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const fullName = await getProfileDisplayName(userId);
    setUserName(fullName || "User");
  };

  const fetchAssets = async (userId: string) => {
    try {
      const summary = await getAssetSummary(userId, "all");

      const {
        totalCash,
        totalInvestments,
        totalRealEstate,
        totalVehicles,
        totalOtherAssets,
        totalAssets,
        cashAccounts,
        realEstateAssets,
        vehicles,
        otherAssets,
        investments,
      } = summary;

      const categories: AssetCategory[] = [
        { name: "Cash & Savings", icon: DollarSign, total: totalCash, items: cashAccounts.length, path: "/assets/cash" },
        { name: "Investments", icon: TrendingUp, total: totalInvestments, items: investments.length, path: "/assets/investments" },
        { name: "Real Estate", icon: Home, total: totalRealEstate, items: realEstateAssets.length, path: "/assets/real-estate" },
        { name: "Vehicles", icon: Car, total: totalVehicles, items: vehicles.length, path: "/assets/vehicles" },
        { name: "Other Assets", icon: Package, total: totalOtherAssets, items: otherAssets.length, path: "/assets/other" },
      ];

      setAssetCategories(categories);
      setTotalAssets(totalAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const chartData = assetCategories
    .filter(cat => cat.total > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.total,
    }));

  return (
    <Layout userName={userName}>
      <SEO
        title="Assets Management"
        description="Track and manage all your assets including cash accounts, investments, real estate, vehicles, and other valuable possessions. Monitor your total asset value and allocation."
        keywords="asset tracking, investment portfolio, cash accounts, real estate assets, vehicle tracking, asset management"
        canonical="/assets"
      />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Assets</h2>
            <p className="text-muted-foreground">Track and manage your assets</p>
          </div>
        </div>

        {/* Total Assets Card */}
        <Card className="mb-8 shadow-md border-success/20">
          <CardHeader>
            <CardTitle className="text-2xl">Total Assets</CardTitle>
            <CardDescription>Your total asset value across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">
              ฿{totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Asset Categories Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {assetCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.name} to={category.path}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-success/10 hover:border-success/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category.name}
                    </CardTitle>
                    <Icon className="h-5 w-5 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      ฿{category.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.items} {category.items === 1 ? 'item' : 'items'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Asset Allocation Chart */}
        {chartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>Distribution of your assets across categories</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="w-full h-[320px] min-h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: '10px',
                        fontSize: '12px',
                      }}
                      formatter={(value: string, entry: LegendEntry) => {
                        const percent = totalAssets > 0 ? (((entry.payload?.value || 0) / totalAssets) * 100).toFixed(0) : "0";
                        return `${value.length > 20 ? value.substring(0, 18) + '...' : value} (${percent}%)`;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: number) => [
                        `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        'Value'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {chartData.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Assets Yet</CardTitle>
              <CardDescription>Start tracking your assets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No assets recorded yet. Click on any category above to add your first asset.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Assets;
