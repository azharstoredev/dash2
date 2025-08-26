import { useState } from "react";
import { useData, Category } from "@/contexts/DataContext";
import { useDialog } from "@/contexts/DialogContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, FolderOpen } from "lucide-react";

export default function Categories() {
  const { categories, products, addCategory, updateCategory, deleteCategory } =
    useData();
  const { showConfirm, showAlert } = useDialog();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
  });

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.name_ar &&
        category.name_ar.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
    });
    setEditingCategory(null);
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        name_ar: category.name_ar || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showAlert({
        title: t("message.error"),
        message: t("categories.nameRequired"),
        type: "warning",
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      closeDialog();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save category. Please try again.";
      showAlert({
        title: t("message.error"),
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category is being used by any products
    const productsUsingCategory = products.filter(
      (product) => product.category_id === id,
    );

    if (productsUsingCategory.length > 0) {
      showAlert({
        title: t("categories.cannotDeleteTitle"),
        message: t("categories.cannotDeleteMessage").replace(
          "{count}",
          String(productsUsingCategory.length),
        ),
        type: "warning",
      });
      return;
    }

    const confirmed = await showConfirm({
      title: t("categories.deleteTitle"),
      message: t("categories.deleteMessage"),
      type: "danger",
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });

    if (confirmed) {
      try {
        await deleteCategory(id);
        showAlert({
          title: t("message.success"),
          message: t("categories.deleteSuccess"),
          type: "success",
        });
      } catch (error) {
        showAlert({
          title: t("message.error"),
          message: t("message.error"),
          type: "error",
        });
      }
    }
  };

  const getProductCountForCategory = (category_id: string) => {
    return products.filter((product) => product.category_id === category_id)
      .length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("nav.categories")}
          </h1>
          <p className="text-gray-600 mt-2">{t("products.subtitle")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-dashboard-primary hover:bg-dashboard-primary-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("common.add")} {t("nav.categories")}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t("products.edit") : t("common.add")}{" "}
                {t("nav.categories")}
              </DialogTitle>
              <DialogDescription>{t("products.subtitle")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    {t("nav.categories")} {t("products.name")}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder={t("nav.categories")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name_ar">
                    {t("nav.categories")} {t("products.name")} (Arabic)
                  </Label>
                  <Input
                    id="name_ar"
                    dir="rtl"
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name_ar: e.target.value,
                      }))
                    }
                    placeholder="اسم التصنيف"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-dashboard-primary hover:bg-dashboard-primary-light"
                >
                  {editingCategory ? t("products.save") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 [dir=rtl]:left-auto [dir=rtl]:right-3" />
            <Input
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 [dir=rtl]:pl-3 [dir=rtl]:pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const productCount = getProductCountForCategory(category.id);

          return (
            <Card
              key={category.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dashboard-primary/10 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-dashboard-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {language === "ar" && category.name_ar
                          ? category.name_ar
                          : category.name}
                      </CardTitle>
                      <CardDescription>
                        {productCount} {t("nav.products")}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {productCount}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openDialog(category)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={productCount > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t("common.noData") : t("empty.addFirstProduct")}
            </h3>
            <p className="text-gray-600">{t("empty.adjustSearch")}</p>
            {!searchTerm && (
              <Button
                className="mt-4 bg-dashboard-primary hover:bg-dashboard-primary-light"
                onClick={() => openDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("common.add")} {t("nav.categories")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
