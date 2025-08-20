import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCart } from "../contexts/CartContext";
import { createCustomer, createOrder } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Check, Truck, MapPin } from "lucide-react";
import ImprovedOrderSummary from "../components/ImprovedOrderSummary";

export default function Checkout() {
  const { t } = useLanguage();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [deliveryArea, setDeliveryArea] = useState<"all-towns" | "jao-askar">(
    "all-towns",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDetails, setOrderDetails] = useState<{
    deliveryType: "delivery" | "pickup";
    deliveryArea?: "all-towns" | "jao-askar";
  } | null>(null);

  const totalPrice = getTotalPrice();

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      customerInfo.name.trim() !== "" &&
      customerInfo.phone.trim() !== "" &&
      customerInfo.address.trim() !== "" &&
      items.length > 0
    );
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // Create customer
      const customer = await createCustomer({
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
      });

      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order
      const order = await createOrder({
        customerId: customer.id,
        items: orderItems,
        total: totalPrice,
        status: "processing",
        deliveryType,
        notes:
          deliveryType === "delivery"
            ? `Delivery Area: ${deliveryArea === "all-towns" ? "All Towns" : "Jao or Askar"}`
            : "",
      });

      setOrderNumber(order.id);
      setOrderDetails({
        deliveryType,
        deliveryArea: deliveryType === "delivery" ? deliveryArea : undefined,
      });
      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Failed to place order:", error);
      alert(t("message.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if cart is empty and not showing success
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">{t("store.cartEmpty")}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              {t("store.continueShopping")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Order Success Screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold auto-text">
              {t("checkout.orderSuccess") || "Order Placed Successfully!"}
            </h2>
            <p className="text-muted-foreground auto-text leading-relaxed">
              {t("checkout.thankYou") ||
                "Thank you for your order! We have received your order and will process it shortly."}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium auto-text">
                {t("checkout.orderNumber") || "Order Number"}:
              </p>
              <Badge variant="outline" className="text-lg px-4 py-2 ltr-text font-mono">
                #{orderNumber}
              </Badge>
            </div>
            <Button onClick={() => navigate("/")} className="w-full">
              {t("checkout.backToStore")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-4 md:p-8 flex flex-col gap-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 [dir=rtl]:ml-2 [dir=ltr]:mr-2" />
              {t("store.continueShopping")}
            </Button>
            <h1 className="text-2xl font-bold">{t("checkout.title")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.customerInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("checkout.customerName")}</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("checkout.customerName")}
                    className="auto-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("checkout.customerPhone")}</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder={t("checkout.customerPhone")}
                    className="ltr-text"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    {t("checkout.customerAddress")}
                  </Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder={t("checkout.customerAddress")}
                    className="auto-text"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.deliveryOptions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={deliveryType}
                  onValueChange={(value) =>
                    setDeliveryType(value as "delivery" | "pickup")
                  }
                >
                  <div className="space-y-3">
                    <div
                      className={`flex items-center space-x-2 [dir=rtl]:space-x-reverse p-4 border rounded-lg cursor-pointer ${
                        deliveryType === "delivery" ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setDeliveryType("delivery")}
                    >
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="font-medium">
                        {t("checkout.delivery")}
                      </Label>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between space-x-2 [dir=rtl]:space-x-reverse p-4 border rounded-lg cursor-pointer ${
                      deliveryType === "pickup" ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setDeliveryType("pickup")}
                  >
                    <div className="flex items-center space-x-2 [dir=rtl]:space-x-reverse">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="font-medium">
                        {t("checkout.pickup")}
                      </Label>
                    </div>
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      Free
                    </Badge>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* No Credit Card Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-green-800 text-center">
                  {t("checkout.noCreditCard")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <ImprovedOrderSummary
              deliveryType={deliveryType}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
              isFormValid={isFormValid()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
