import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { reassignTransactionCategory } from "@/services/transaction-service";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, GitMerge, Tag, Palette, Hash } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { getProfileDisplayName } from "@/services/profile-service";
import {
  createCategory,
  deleteCategory,
  getCategoriesByUser,
  updateCategory,
} from "@/services/category-service";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  transactionCount: number;
  isDefault: boolean;
}

// Color options for categories
const COLOR_OPTIONS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Gray", value: "#6b7280" }
];

// Icon options (using emoji for simplicity)
const ICON_OPTIONS = [
  "💰", "💵", "💸", "💳", "🏠", "🚗", "🍔", "🛒", "🎮", "📱",
  "✈️", "🏥", "📚", "🎬", "🎵", "👕", "⚡", "💡", "🎯", "📊"
];

export default function Categories() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    icon: "💰",
    color: "#3b82f6"
  });

  const [mergeTargetId, setMergeTargetId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getCategoriesByUser(user.id, { orderBy: "type", ascending: true });
      const normalized = (data || []).sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type.localeCompare(b.type);
      });

      // Convert database format to component format
      const formattedCategories: Category[] = normalized.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as "income" | "expense",
        icon: cat.icon,
        color: cat.color,
        transactionCount: cat.transaction_count,
        isDefault: cat.is_default
      }));

      setCategories(formattedCategories);
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const fullName = await getProfileDisplayName(session.user.id, "User");
      setUserName(fullName);

      // Fetch categories
      await fetchCategories();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const getFilteredCategories = () => {
    if (filterType === "all") return categories;
    return categories.filter(c => c.type === filterType);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await createCategory({
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        is_default: false,
        transaction_count: 0,
      });

      toast.success("Category added successfully!");
      await fetchCategories();

      // Reset form
      setFormData({
        name: "",
        type: "expense",
        icon: "💰",
        color: "#3b82f6"
      });

      setIsAddDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error adding category:", error);
      toast.error(getErrorMessage(error, "Failed to add category"));
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await updateCategory(selectedCategory.id, user.id, {
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
      });

      toast.success("Category updated successfully!");
      await fetchCategories();
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: unknown) {
      console.error("Error updating category:", error);
      toast.error(getErrorMessage(error, "Failed to update category"));
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    if (selectedCategory.transactionCount > 0) {
      toast.error("Cannot delete category with existing transactions. Please merge it first.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteCategory(selectedCategory.id, user.id);

      toast.success("Category deleted successfully!");
      await fetchCategories();
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      toast.error(getErrorMessage(error, "Failed to delete category"));
    }
  };

  const handleMergeCategory = async () => {
    if (!selectedCategory || !mergeTargetId) {
      toast.error("Please select a target category to merge into");
      return;
    }

    const targetCategory = categories.find(cat => cat.id === mergeTargetId);
    if (!targetCategory) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update all transactions that use the old category to use the new category
      await reassignTransactionCategory(user.id, selectedCategory.name, targetCategory.name);

      // Delete the old category
      await deleteCategory(selectedCategory.id, user.id);

      toast.success(`Merged "${selectedCategory.name}" into "${targetCategory.name}"`);
      await fetchCategories();
      setIsMergeDialogOpen(false);
      setSelectedCategory(null);
      setMergeTargetId("");
    } catch (error: unknown) {
      console.error("Error merging categories:", error);
      toast.error(getErrorMessage(error, "Failed to merge categories"));
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const openMergeDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsMergeDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-1">Organize and manage your income and expense categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a custom category for your transactions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Coffee Expenses"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <span className="text-xl">{icon}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_OPTIONS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 ${formData.color === colorOption.value ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                        style={{ backgroundColor: colorOption.value }}
                        onClick={() => setFormData({ ...formData, color: colorOption.value })}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Category</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Type:</Label>
            <Select value={filterType} onValueChange={(value: "all" | "income" | "expense") => setFilterType(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your transaction categories. Default categories can be renamed but not deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Icon</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[100px]">Color</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <span className="text-2xl">{category.icon}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                    {category.isDefault && (
                      <Badge variant="secondary" className="ml-2">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.type === "income" ? "default" : "outline"}>
                      {category.type === "income" ? "Income" : "Expense"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-muted-foreground">{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span>{category.transactionCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {category.transactionCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMergeDialog(category)}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(category)}
                        disabled={category.isDefault && category.transactionCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCategory}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="text-xl">{icon}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 ${formData.color === colorOption.value ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                      style={{ backgroundColor: colorOption.value }}
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge Category</DialogTitle>
            <DialogDescription>
              Merge "{selectedCategory?.name}" into another category. All transactions will be moved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Merge Into:</Label>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(cat => cat.id !== selectedCategory?.id && cat.type === selectedCategory?.type)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name} ({cat.transactionCount} transactions)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">This will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Move {selectedCategory?.transactionCount} transaction(s) to the target category</li>
                <li>Delete "{selectedCategory?.name}" category</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMergeCategory} disabled={!mergeTargetId}>
              Merge Categories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCategory?.transactionCount === 0 ? (
                <>Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.</>
              ) : (
                <>
                  Cannot delete "{selectedCategory?.name}" because it has {selectedCategory?.transactionCount} transaction(s).
                  Please merge this category into another one first.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {selectedCategory?.transactionCount === 0 && (
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
}
