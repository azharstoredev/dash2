import { useState } from "react";
import { useData, Order, OrderItem } from "@/contexts/DataContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ShoppingCart,
  User,
  Package,
  Minus,
  Eye,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

export default function Orders() {
  const {
    orders,
    customers,
    products,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getCustomerById,
    getProductById,
    getVariantById,
    refetchData,
  } = useData();
  const { showConfirm, showAlert } = useDialog();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    items: [] as OrderItem[],
    status: "processing" as Order["status"],
    deliveryType: "delivery" as Order["deliveryType"],
    notes: "",
  });

  const filteredOrders = orders.filter((order) => {
    const customer = getCustomerById(order.customerId);
    return (
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer &&
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      items: [],
      status: "processing",
      deliveryType: "delivery",
      notes: "",
    });
    setEditingOrder(null);
  };

  const openDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customerId: order.customerId,
        items: [...order.items],
        status: order.status,
        deliveryType: order.deliveryType,
        notes: order.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const openViewDialog = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setViewingOrder(null);
  };

  const addProductToOrder = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: "", variantId: "no-variant", quantity: 1, price: 0 },
      ],
    }));
  };

  const removeProductFromOrder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === "productId") {
            const product = getProductById(value as string);
            if (product) {
              updatedItem.price = product.price;
              updatedItem.variantId = "no-variant"; // Reset variant when product changes
            }
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.items.length === 0) {
      showAlert({
        title: "Validation Error",
        message:
          "Please select a customer and add at least one product to create an order.",
        type: "warning",
      });
      return;
    }

    try {
      const orderData = {
        ...formData,
        total: calculateTotal(),
      };

      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
      } else {
        await addOrder(orderData);
      }
      closeDialog();
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to save order. Please try again.",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: t("orders.delete"),
      message: t("message.deleteConfirm"),
      type: "danger",
      confirmText: t("orders.delete"),
      cancelText: t("common.cancel"),
    });

    if (confirmed) {
      try {
        await deleteOrder(id);
        showAlert({
          title: t("message.success"),
          message: t("message.orderDeleted"),
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

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to update order status. Please try again.",
        type: "error",
      });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "ready":
        return "bg-yellow-100 text-yellow-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "picked-up":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "processing":
        return t("orders.processing");
      case "ready":
        return t("orders.ready");
      case "delivered":
        return t("orders.delivered");
      case "picked-up":
        return t("orders.pickedUp");
      default:
        return status;
    }
  };

  const getAvailableVariants = (productId: string) => {
    const product = getProductById(productId);
    return product?.variants || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 [dir=rtl]:sm:flex-row-reverse">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("orders.title")}
          </h1>
          <p className="text-gray-600 mt-2">{t("orders.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => openDialog()}
                className="bg-dashboard-primary hover:bg-dashboard-primary-light"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("orders.addNew")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? t("orders.editOrder") : t("orders.addOrder")}
                </DialogTitle>
                <DialogDescription>
                  {editingOrder ? t("orders.editOrder") : t("orders.addOrder")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer">{t("orders.customer")}</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, customerId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("orders.selectCustomer")} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>{t("nav.products")}</Label>
                    <div className="space-y-4">
                      {formData.items.map((item, index) => {
                        const product = getProductById(item.productId);
                        const availableVariants = getAvailableVariants(
                          item.productId,
                        );
                        const selectedVariant =
                          item.variantId && item.variantId !== "no-variant"
                            ? getVariantById(item.productId, item.variantId)
                            : null;

                        return (
                          <div
                            key={index}
                            className="flex gap-2 items-end p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <Label>{t("orders.product")}</Label>
                              <Select
                                value={item.productId}
                                onValueChange={(value) =>
                                  updateOrderItem(index, "productId", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("orders.selectProduct")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.name} - ${product.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {availableVariants.length > 0 && (
                              <div className="flex-1">
                                <Label>{t("orders.variant")}</Label>
                                <Select
                                  value={item.variantId || "no-variant"}
                                  onValueChange={(value) =>
                                    updateOrderItem(index, "variantId", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("orders.selectVariant")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no-variant">
                                      {t("orders.variant")}
                                    </SelectItem>
                                    {availableVariants.map((variant) => (
                                      <SelectItem
                                        key={variant.id}
                                        value={variant.id}
                                      >
                                        {variant.name} ({t("products.stock")}:{" "}
                                        {variant.stock})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="w-24">
                              <Label>{t("orders.quantity")}</Label>
                              <Input
                                type="number"
                                min="1"
                                max={
                                  selectedVariant
                                    ? selectedVariant.stock
                                    : product?.totalStock || 999
                                }
                                value={item.quantity === 0 ? "" : item.quantity}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                onFocus={(e) => {
                                  if (e.target.value === "0") {
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </div>
                            <div className="w-24">
                              <Label>{t("orders.price")}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price === 0 ? "" : item.price}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "price",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                onFocus={(e) => {
                                  if (e.target.value === "0") {
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeProductFromOrder(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addProductToOrder}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("orders.addItem")}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">{t("orders.status")}</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: Order["status"]) =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">
                            {t("orders.processing")}
                          </SelectItem>
                          <SelectItem value="ready">
                            {t("orders.ready")}
                          </SelectItem>
                          <SelectItem value="delivered">
                            {t("orders.delivered")}
                          </SelectItem>
                          <SelectItem value="picked-up">
                            {t("orders.pickedUp")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="deliveryType">
                        {t("orders.deliveryType")}
                      </Label>
                      <Select
                        value={formData.deliveryType}
                        onValueChange={(value: Order["deliveryType"]) =>
                          setFormData((prev) => ({
                            ...prev,
                            deliveryType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delivery">
                            {t("orders.delivery")}
                          </SelectItem>
                          <SelectItem value="pickup">
                            {t("orders.pickup")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">{t("orders.notes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder={t("orders.notesPlaceholder")}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-dashboard-primary">
                      BD {calculateTotal().toFixed(2)}
                    </span>
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
                    {editingOrder ? t("orders.save") : t("orders.addOrder")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={refetchData}>
            {t("orders.refresh")}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 [dir=rtl]:left-auto [dir=rtl]:right-3" />
            <Input
              placeholder={t("orders.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 [dir=rtl]:pl-3 [dir=rtl]:pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const customer = getCustomerById(order.customerId);
          return (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between [dir=rtl]:flex-row-reverse">
                  <div className="flex items-center gap-3 [dir=rtl]:flex-row-reverse">
                    <div className="w-10 h-10 bg-dashboard-primary rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {t("orders.orderId")} #{order.id}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 [dir=rtl]:flex-row-reverse">
                        <User className="w-4 h-4" />
                        {customer?.name || t("orders.customer")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-dashboard-primary">
                      BD {order.total.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Select
                        value={order.status}
                        onValueChange={(value: Order["status"]) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">
                            {t("orders.processing")}
                          </SelectItem>
                          <SelectItem value="ready">
                            {t("orders.ready")}
                          </SelectItem>
                          <SelectItem value="delivered">
                            {t("orders.delivered")}
                          </SelectItem>
                          <SelectItem value="picked-up">
                            {t("orders.pickedUp")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t("nav.products")} ({order.items.length})
                    </h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, index) => {
                        const product = getProductById(item.productId);
                        const variant =
                          item.variantId && item.variantId !== "no-variant"
                            ? getVariantById(item.productId, item.variantId)
                            : null;
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-3">
                              {product?.images?.[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <span>
                                {product?.name || t("products.title")}
                                {variant && ` (${variant.name})`}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {item.quantity}x BD {item.price.toFixed(2)} = BD{" "}
                              {(item.quantity * item.price).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-600 text-center">
                          +{order.items.length - 2} {t("orders.items")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="capitalize font-medium text-dashboard-primary">
                        {order.deliveryType === "delivery"
                          ? t("orders.delivery")
                          : t("orders.pickup")}
                      </span>
                      <span>
                        {t("orders.date")}:{" "}
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openViewDialog(order)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t("orders.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(order)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t("orders.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(order.id)}
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

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("orders.orderDetailsTitle")} #{viewingOrder?.id}
            </DialogTitle>
            <DialogDescription>
              {t("orders.orderDetailsDesc")}
            </DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t("orders.customerInfo")}
                </h3>
                {(() => {
                  const customer = getCustomerById(viewingOrder.customerId);
                  return customer ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">
                          {t("orders.customerName")}:
                        </span>{" "}
                        {customer.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">
                          {t("orders.customerPhone")}:
                        </span>{" "}
                        {customer.phone}
                      </div>
                      <div className="md:col-span-2 flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <div>
                          <span className="font-medium">
                            {t("orders.deliveryAddress")}:
                          </span>
                          <p>{customer.address}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">
                      {t("orders.customerNotFound")}
                    </p>
                  );
                })()}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("orders.orderItems")}
                </h3>
                <div className="space-y-2">
                  {viewingOrder.items.map((item, index) => {
                    const product = getProductById(item.productId);
                    const variant =
                      item.variantId && item.variantId !== "no-variant"
                        ? getVariantById(item.productId, item.variantId)
                        : null;
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {product?.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                          )}
                          <div>
                            <button
                              onClick={() => {
                                // Navigate to product page - you can add routing here
                                window.open(
                                  `/product/${item.productId}`,
                                  "_blank",
                                );
                              }}
                              className="font-medium text-dashboard-primary hover:text-dashboard-primary-light hover:underline transition-colors text-left"
                            >
                              {product?.name || t("orders.unknownProduct")}
                            </button>
                            {variant && (
                              <span className="text-sm text-gray-600 ml-2 block">
                                Variant: {variant.name}
                              </span>
                            )}
                            {product && (
                              <span className="text-sm text-gray-500 block">
                                Unit Price: BD {product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {item.quantity} × BD {item.price.toFixed(2)}
                          </div>
                          <div className="font-medium text-lg">
                            BD {(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>{t("orders.status")}:</span>
                  <Badge className={getStatusColor(viewingOrder.status)}>
                    {getStatusText(viewingOrder.status)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>{t("orders.deliveryType")}:</span>
                  <span className="capitalize font-medium text-dashboard-primary">
                    {viewingOrder.deliveryType === "delivery"
                      ? t("orders.delivery")
                      : t("orders.pickup")}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>{t("orders.created")}:</span>
                  <span>
                    {new Date(viewingOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span>{t("orders.lastUpdated")}:</span>
                  <span>
                    {new Date(viewingOrder.updatedAt).toLocaleString()}
                  </span>
                </div>
                {viewingOrder.notes && (
                  <div className="mb-3">
                    <span className="font-medium">{t("orders.notes")}:</span>
                    <p className="text-gray-600 mt-1">{viewingOrder.notes}</p>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-medium">
                    {t("orders.total")}:
                  </span>
                  <span className="text-2xl font-bold text-dashboard-primary">
                    BD {viewingOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeViewDialog}>
              {t("orders.close")}
            </Button>
            <Button
              onClick={() => {
                closeViewDialog();
                if (viewingOrder) openDialog(viewingOrder);
              }}
            >
              {t("orders.editOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("empty.noOrdersFound")}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t("empty.adjustSearch") : t("empty.addFirstOrder")}
            </p>
            <Button
              className="mt-4 bg-dashboard-primary hover:bg-dashboard-primary-light"
              onClick={() => openDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("empty.createOrder")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
