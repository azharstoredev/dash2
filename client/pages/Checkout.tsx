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
  const { language } = useLanguage();
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

      // Get delivery settings from localStorage
      const savedSettings = JSON.parse(
        localStorage.getItem("storeSettings") || "{}",
      );
      const deliveryFeeSetting = Number(savedSettings?.deliveryFee ?? 1.5);
      const freeDeliveryMinimum = Number(
        savedSettings?.freeDeliveryMinimum ?? 20,
      );

      // Calculate final total including delivery fee with free delivery threshold
      const deliveryFee =
        deliveryType === "delivery"
          ? totalPrice >= freeDeliveryMinimum
            ? 0
            : deliveryFeeSetting
          : 0;
      const finalTotal = totalPrice + deliveryFee;

      // Create order
      const order = await createOrder({
        customerId: customer.id,
        items: orderItems,
        total: finalTotal,
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

      // Show more specific error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while placing your order";

      alert(`${t("message.error")}: ${errorMessage}`);
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
              {(() => {
                const savedSettings = localStorage.getItem("storeSettings");
                if (savedSettings) {
                  const settings = JSON.parse(savedSettings);
                  return language === "ar"
                    ? settings.successHeadlineAr || t("orderSuccess.headlineAr")
                    : settings.successHeadlineEn || t("orderSuccess.headline");
                }
                return (
                  t("checkout.orderSuccess") || "Order Placed Successfully!"
                );
              })()}
            </h2>
            <p className="text-muted-foreground auto-text leading-relaxed">
              {(() => {
                const savedSettings = localStorage.getItem("storeSettings");
                if (savedSettings) {
                  const settings = JSON.parse(savedSettings);
                  return language === "ar"
                    ? settings.orderSuccessMessageAr ||
                        "شكراً لك على طلبك! سنقوم بتجهيزه خلال 2-4 ساعات وسيصل خلال 1-3 أيام عمل."
                    : settings.orderSuccessMessageEn ||
                        "Thank you for your order! We'll process it within 2-4 hours and deliver within 1-3 business days.";
                }
                return (
                  t("checkout.thankYou") ||
                  "Thank you for your order! We have received your order and will process it shortly."
                );
              })()}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium auto-text">
                {t("checkout.orderNumber") || "Order Number"}:
              </p>
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 ltr-text font-mono"
              >
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
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  {t("checkout.deliveryOptions")}
                </CardTitle>
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
                      className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        deliveryType === "delivery"
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setDeliveryType("delivery")}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem
                          value="delivery"
                          id="delivery"
                          className="w-5 h-5"
                        />
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-primary" />
                          <div>
                            <Label
                              htmlFor="delivery"
                              className="font-semibold text-lg cursor-pointer"
                            >
                              {t("checkout.delivery")}
                            </Label>
                            <p className="text-sm text-gray-600 auto-text">
                              {language === "ar"
                                ? "التوصيل إلى عنوانك"
                                : "We'll deliver to your address"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {language === "ar" ? "د.ب 1.50" : "BD 1.50"}
                      </Badge>
                    </div>

                    <div
                      className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        deliveryType === "pickup"
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setDeliveryType("pickup")}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem
                          value="pickup"
                          id="pickup"
                          className="w-5 h-5"
                        />
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <div>
                            <Label
                              htmlFor="pickup"
                              className="font-semibold text-lg cursor-pointer"
                            >
                              {t("checkout.pickup")}
                            </Label>
                            <p className="text-sm text-gray-600 auto-text">
                              {language === "ar"
                                ? "الاستلام من المتجر"
                                : "Pick up from our store"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        {language === "ar" ? "مجاني" : "Free"}
                      </Badge>
                    </div>
                  </div>
                </RadioGroup>
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
