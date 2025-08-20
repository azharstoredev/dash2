import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { useCart } from "../contexts/CartContext";
import { createCustomer, createOrder } from "../services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Check,
  CreditCard,
  Truck,
  Package,
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useEffect } from "react";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
  const { t, language } = useLanguage();
  const { items, getTotalPrice, clearCart } = useCart();
  const { refetchData, getOrderNumber } = useData();

  const savedSettingsRaw = localStorage.getItem("storeSettings");
  const savedSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : {};
  const currencySymbol: string = savedSettings?.currencySymbol || "BD";
  const deliveryFeeSetting: number = Number(savedSettings?.deliveryFee ?? 1.5);
  const pickupAddress: string =
    language === "ar"
      ? savedSettings?.pickupAddressAr ||
        "منزل 1348، طريق 416، مجمع 604، سترة القرية"
      : savedSettings?.pickupAddressEn ||
        "Home 1348, Road 416, Block 604, Sitra Alqarya";
  const contactPhone: string = savedSettings?.contactPhone || "+973 36283382";
  const enableDialogScroll: boolean = savedSettings?.enableDialogScroll ?? true;
  const autoScrollToSummary: boolean =
    savedSettings?.autoScrollToSummary ?? true;

  // Get custom order messages from settings
  const getOrderMessages = () => {
    const savedSettings = localStorage.getItem("storeSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        successMessage:
          language === "ar"
            ? settings.orderSuccessMessageAr
            : settings.orderSuccessMessageEn,
        instructions:
          language === "ar"
            ? settings.orderInstructionsAr
            : settings.orderInstructionsEn,
        headline:
          language === "ar"
            ? settings.successHeadlineAr || t("orderSuccess.headlineAr")
            : settings.successHeadlineEn || t("orderSuccess.headline"),
        subtext:
          language === "ar"
            ? settings.successSubtextAr ||
              "سنقوم بإبلاغك بالتحديثات عبر الهاتف حسب تقدم طلبك."
            : settings.successSubtextEn ||
              "We'll share updates by phone as your order progresses.",
        toggles: {
          displayOrderNumber: settings.displayOrderNumber ?? true,
          displayOrderItems: settings.displayOrderItems ?? true,
          displayTotals: settings.displayTotals ?? true,
          displayNextSteps: settings.displayNextSteps ?? true,
          displayContact: settings.displayContact ?? true,
        },
      };
    }

    // Default messages if no custom settings
    return {
      successMessage:
        language === "ar"
          ? "شكراً لك على طلبك! سنقوم بتجهيزه خلال 2-4 ساعات وسيصل خلال 1-3 أيام عمل."
          : "Thank you for your order! We'll process it within 2-4 hours and deliver within 1-3 business days.",
      instructions:
        language === "ar"
          ? "لأي تغييرات أو أسئلة حول طلبك، يرجى التواصل معنا."
          : "For any changes or questions about your order, please contact us.",
      headline:
        language === "ar"
          ? t("orderSuccess.headlineAr")
          : t("orderSuccess.headline"),
      subtext:
        language === "ar"
          ? "سنقوم بإبلاغك بالتحديثات عبر الهاتف حسب تقدم طلبك."
          : "We'll share updates by phone as your order progresses.",
      toggles: {
        displayOrderNumber: true,
        displayOrderItems: true,
        displayTotals: true,
        displayNextSteps: true,
        displayContact: true,
      },
    };
  };

  const [step, setStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "", // For backward compatibility
    home: "",
    road: "",
    block: "",
    town: "",
  });

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderItems, setOrderItems] = useState<typeof items>([]);
  const [orderTotalPrice, setOrderTotalPrice] = useState(0);

  const totalPrice = getTotalPrice();

  // Auto-scroll helpers
  useEffect(() => {
    if (autoScrollToSummary && step === 3) {
      const el = document.getElementById("checkout-summary-bottom");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [step, autoScrollToSummary]);

  useEffect(() => {
    if (autoScrollToSummary && orderSuccess) {
      const el = document.getElementById("checkout-success-bottom");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [orderSuccess, autoScrollToSummary]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStep1Valid = () => {
    return (
      customerInfo.name.trim() !== "" &&
      customerInfo.phone.trim() !== "" &&
      customerInfo.town.trim() !== "" // At minimum, town is required
    );
  };

  const isFormValid = () => {
    return isStep1Valid() && items.length > 0;
  };

  const handleNext = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // Combine address fields into a single address string
      const addressParts = [
        customerInfo.home && `House ${customerInfo.home}`,
        customerInfo.road && `Road ${customerInfo.road}`,
        customerInfo.block && `Block ${customerInfo.block}`,
        customerInfo.town,
      ].filter(Boolean);

      const combinedAddress =
        addressParts.length > 0
          ? addressParts.join(", ")
          : customerInfo.address;

      // Create customer
      const customer = await createCustomer({
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: combinedAddress,
      });

      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      // Calculate total including delivery fees
      const deliveryFee = deliveryType === "delivery" ? deliveryFeeSetting : 0;
      const orderTotal = totalPrice + deliveryFee;

      // Create order
      const order = await createOrder({
        customerId: customer.id,
        items: orderItems,
        total: orderTotal,
        status: "processing",
        deliveryType: deliveryType,
        notes: "",
      });

      // Success state - preserve order data before clearing cart
      setOrderItems([...items]);
      setOrderTotalPrice(orderTotal);

      // Calculate order number more reliably
      try {
        await refetchData(); // Refresh data first to get updated orders list
        const orderNum = getOrderNumber(order.id);
        setOrderNumber(orderNum > 0 ? orderNum.toString() : order.id.slice(-6));
      } catch (error) {
        // Fallback to using last 6 characters of order ID
        setOrderNumber(order.id.slice(-6));
      }

      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Error placing order:", error);
      alert(t("errors.orderFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCustomerInfo({
      name: "",
      phone: "",
      address: "",
      home: "",
      road: "",
      block: "",
      town: "",
    });
    setDeliveryType("delivery");
    setOrderSuccess(false);
    setOrderNumber("");
    setOrderItems([]);
    setOrderTotalPrice(0);
    onClose();
  };

  const resetToStart = () => {
    setStep(1);
    setCustomerInfo({
      name: "",
      phone: "",
      address: "",
      home: "",
      road: "",
      block: "",
      town: "",
    });
    setDeliveryType("delivery");
    setOrderSuccess(false);
    setOrderNumber("");
    setOrderItems([]);
    setOrderTotalPrice(0);
  };

  // Order Success Screen - Completely Revamped
  if (orderSuccess) {
    const orderMessages = getOrderMessages();

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-[95vw] mx-auto p-0 bg-white rounded-2xl border-0 shadow-2xl max-h-[95vh] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header with Success Animation */}
            <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl font-bold text-green-800 auto-text leading-tight">
                {orderMessages.headline}
              </DialogTitle>
              <p className="text-center text-green-700 auto-text text-sm mt-2 leading-relaxed">
                {orderMessages.subtext}
              </p>
            </DialogHeader>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Success Message - First Priority */}
                <div className="text-center space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-gray-800 auto-text text-sm leading-relaxed">
                      {orderMessages.successMessage}
                    </p>
                  </div>
                  <p className="text-gray-600 auto-text text-xs">
                    {orderMessages.instructions}
                  </p>
                </div>

                {/* Next Steps - Second Priority */}
                {orderMessages.toggles.displayNextSteps && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 auto-text text-sm mb-3 flex items-center gap-2 [dir=rtl]:flex-row-reverse">
                      <Clock className="w-4 h-4" />
                      {t("checkout.whatsNext")}
                    </h3>
                    <ul className="space-y-3 text-xs text-blue-800 auto-text">
                      <li className="flex items-start gap-3 [dir=rtl]:flex-row-reverse">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 [dir=rtl]:order-2" />
                        <span className="auto-text [dir=rtl]:order-1">
                          {language === "ar"
                            ? t("orderSuccess.prepareOrderAr")
                            : t("orderSuccess.prepareOrder")}
                        </span>
                      </li>
                      <li className="flex items-start gap-3 [dir=rtl]:flex-row-reverse">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 [dir=rtl]:order-2" />
                        <span className="auto-text [dir=rtl]:order-1">
                          {language === "ar"
                            ? t("orderSuccess.contactPhoneAr")
                            : t("orderSuccess.contactPhone")}
                        </span>
                      </li>
                      <li className="flex items-start gap-3 [dir=rtl]:flex-row-reverse">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 [dir=rtl]:order-2" />
                        <span className="auto-text [dir=rtl]:order-1">
                          {language === "ar"
                            ? t("orderSuccess.deliveryTimeAr")
                            : t("orderSuccess.deliveryTime")}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Contact Information - Third Priority */}
                {orderMessages.toggles.displayContact && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium text-gray-900 auto-text text-sm mb-3 flex items-center gap-2 [dir=rtl]:flex-row-reverse">
                      <Phone className="w-4 h-4" />
                      {t("checkout.needHelp")}
                    </h3>
                    <div className="space-y-3 text-xs text-gray-700">
                      <div className="flex items-center gap-3 [dir=rtl]:flex-row-reverse">
                        <Phone className="w-4 h-4 text-gray-500 [dir=rtl]:order-2" />
                        <span className="ltr-text font-medium [dir=rtl]:order-1">
                          {contactPhone}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 [dir=rtl]:flex-row-reverse">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0 [dir=rtl]:order-2" />
                        <span className="auto-text leading-relaxed [dir=rtl]:order-1">
                          {pickupAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Information - Last Priority */}
                <div className="space-y-4 border-t pt-4">
                  {/* Order Number */}
                  {orderMessages.toggles.displayOrderNumber && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 auto-text mb-3">
                        {t("checkout.orderNumber")}:
                      </p>
                      <Badge
                        variant="outline"
                        className="text-lg px-6 py-3 ltr-text font-mono bg-gray-50 border-2"
                      >
                        #{orderNumber}
                      </Badge>
                    </div>
                  )}

                  {/* Order Items */}
                  {orderMessages.toggles.displayOrderItems && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 auto-text text-sm">
                        {t("checkout.orderItems")}:
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {items.map((item) => (
                          <div
                            key={`${item.productId}-${item.variantId}`}
                            className="flex justify-between items-start gap-3 p-3 bg-gray-50 rounded-lg text-xs [dir=rtl]:flex-row-reverse"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium auto-text truncate">
                                {item.productName}
                              </p>
                              {item.variantName && (
                                <p className="text-gray-600 auto-text truncate">
                                  {item.variantName}
                                </p>
                              )}
                              <p className="text-gray-500 auto-text">
                                {t("store.quantity")}:{" "}
                                <span className="ltr-text font-medium">
                                  {item.quantity}
                                </span>
                              </p>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <p className="font-semibold text-primary ltr-text">
                                {currencySymbol}{" "}
                                {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Totals */}
                  {orderMessages.toggles.displayTotals && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex justify-between items-center text-sm [dir=rtl]:flex-row-reverse">
                        <span className="auto-text">
                          {t("checkout.subtotal")}:
                        </span>
                        <span className="text-primary ltr-text">
                          {currencySymbol}{" "}
                          {(
                            orderTotalPrice -
                            (deliveryType === "delivery"
                              ? deliveryFeeSetting
                              : 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm [dir=rtl]:flex-row-reverse">
                        <span className="auto-text">
                          {t("checkout.deliveryFee")}:
                        </span>
                        <span className="text-primary ltr-text">
                          {deliveryType === "delivery"
                            ? `${currencySymbol} ${deliveryFeeSetting.toFixed(2)}`
                            : `${currencySymbol} 0.00`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold pt-3 border-t [dir=rtl]:flex-row-reverse">
                        <span className="auto-text">
                          {t("orders.orderTotal")}:
                        </span>
                        <span className="text-primary text-lg ltr-text">
                          {currencySymbol} {orderTotalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 bg-white">
              <Button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/90 touch-manipulation h-12 text-base font-semibold"
              >
                <span className="auto-text">{t("checkout.backToStore")}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[95vh] p-0 rounded-xl border-0 flex flex-col dialog-content-scroll mx-auto">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b flex-shrink-0 bg-white">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center auto-text leading-tight">
            {t("checkout.title")}
          </DialogTitle>

          {/* Step indicator */}
          <div className="flex justify-center mt-4 sm:mt-6">
            <div className="flex items-center space-x-2 sm:space-x-4 [dir=rtl]:space-x-reverse">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-all duration-200 ${
                      step >= stepNum
                        ? "bg-primary text-white shadow-lg"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded-full transition-all duration-200 ${
                        step > stepNum ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <ScrollArea
          className={`flex-1 min-h-0 ${enableDialogScroll ? "max-h-[70vh]" : ""}`}
        >
          <div className="p-4 sm:p-6 pb-6 sm:pb-8 auto-text">
            {/* Step 1: Customer Information */}
            {step === 1 && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="flex items-center gap-3 [dir=rtl]:flex-row-reverse auto-text text-lg sm:text-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm sm:text-base">1</span>
                    </div>
                    <span className="auto-text">
                      {t("checkout.customerInfo")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="block auto-text text-sm sm:text-base font-medium"
                      >
                        {t("checkout.customerName")}
                      </Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder={t("checkout.customerName")}
                        className="auto-text h-12 sm:h-11 text-base touch-manipulation"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="block auto-text text-sm sm:text-base font-medium"
                      >
                        {t("checkout.customerPhone")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder={t("checkout.customerPhone")}
                        className="ltr-text h-12 sm:h-11 text-base touch-manipulation"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="block auto-text text-sm sm:text-base font-medium">
                      {t("checkout.customerAddress")}
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="home"
                            className="text-sm text-gray-600 auto-text"
                          >
                            {t("checkout.customerHome")}
                          </Label>
                          <Input
                            id="home"
                            value={customerInfo.home}
                            onChange={(e) =>
                              handleInputChange("home", e.target.value)
                            }
                            placeholder="123"
                            className="text-center auto-text h-12 sm:h-11 touch-manipulation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="road"
                            className="text-sm text-gray-600 auto-text"
                          >
                            {t("checkout.customerRoad")}
                          </Label>
                          <Input
                            id="road"
                            value={customerInfo.road}
                            onChange={(e) =>
                              handleInputChange("road", e.target.value)
                            }
                            placeholder="456"
                            className="text-center auto-text h-12 sm:h-11 touch-manipulation"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="block"
                            className="text-sm text-gray-600 auto-text"
                          >
                            {t("checkout.customerBlock")}
                          </Label>
                          <Input
                            id="block"
                            value={customerInfo.block}
                            onChange={(e) =>
                              handleInputChange("block", e.target.value)
                            }
                            placeholder="789"
                            className="text-center auto-text h-12 sm:h-11 touch-manipulation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="town"
                            className="text-sm text-gray-600 auto-text"
                          >
                            {t("checkout.customerTown")}
                          </Label>
                          <Input
                            id="town"
                            value={customerInfo.town}
                            onChange={(e) =>
                              handleInputChange("town", e.target.value)
                            }
                            placeholder="Manama"
                            className="auto-text h-12 sm:h-11 touch-manipulation"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Delivery Options - Removed Description */}
            {step === 2 && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="flex items-center gap-3 [dir=rtl]:flex-row-reverse auto-text text-lg sm:text-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm sm:text-base">2</span>
                    </div>
                    <span className="auto-text">
                      {t("checkout.deliveryOptions")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(value) =>
                      setDeliveryType(value as "delivery" | "pickup")
                    }
                    className="grid grid-cols-1 gap-4 sm:gap-6"
                  >
                    <div
                      className={`flex items-center space-x-4 [dir=rtl]:space-x-reverse p-5 sm:p-6 border-2 rounded-xl cursor-pointer transition-all touch-manipulation hover:shadow-md ${
                        deliveryType === "delivery"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setDeliveryType("delivery")}
                      role="button"
                      tabIndex={0}
                    >
                      <RadioGroupItem value="delivery" id="delivery" />
                      <div className="flex items-center space-x-4 [dir=rtl]:space-x-reverse flex-1">
                        <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <Label
                            htmlFor="delivery"
                            className="text-base sm:text-lg font-medium cursor-pointer auto-text block"
                          >
                            {t("checkout.delivery")}
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-center space-x-4 [dir=rtl]:space-x-reverse p-5 sm:p-6 border-2 rounded-xl cursor-pointer transition-all touch-manipulation hover:shadow-md ${
                        deliveryType === "pickup"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setDeliveryType("pickup")}
                      role="button"
                      tabIndex={0}
                    >
                      <RadioGroupItem value="pickup" id="pickup" />
                      <div className="flex items-center space-x-4 [dir=rtl]:space-x-reverse flex-1">
                        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <Label
                            htmlFor="pickup"
                            className="text-base sm:text-lg font-medium cursor-pointer auto-text block"
                          >
                            {t("checkout.pickup")}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Order Summary & Payment - Improved RTL Support */}
            {step === 3 && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="flex items-center gap-3 [dir=rtl]:flex-row-reverse auto-text text-lg sm:text-xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm sm:text-base">3</span>
                    </div>
                    <span className="auto-text">
                      {t("checkout.orderSummary")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  {/* Customer Info Review */}
                  <div className="p-4 sm:p-5 bg-gray-50 rounded-lg space-y-4">
                    <h4 className="font-medium auto-text border-b border-gray-200 pb-3 text-base sm:text-lg">
                      {t("checkout.customerInfo")}
                    </h4>
                    <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                      <div className="flex justify-between items-start [dir=rtl]:flex-row-reverse gap-3">
                        <span className="font-medium text-gray-600 auto-text min-w-0">
                          {t("checkout.customerName")}:
                        </span>
                        <span className="font-medium auto-text text-end min-w-0 flex-1">
                          {customerInfo.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-start [dir=rtl]:flex-row-reverse gap-3">
                        <span className="font-medium text-gray-600 auto-text min-w-0">
                          {t("checkout.customerPhone")}:
                        </span>
                        <span className="font-medium ltr-text text-end min-w-0 flex-1">
                          {customerInfo.phone}
                        </span>
                      </div>
                      <div className="flex justify-between items-start [dir=rtl]:flex-row-reverse gap-3">
                        <span className="font-medium text-gray-600 auto-text min-w-0">
                          {t("checkout.customerAddress")}:
                        </span>
                        <span className="font-medium auto-text text-end min-w-0 flex-1 leading-relaxed">
                          {language === "ar"
                            ? [
                                customerInfo.town,
                                customerInfo.block &&
                                  `مجمع ${customerInfo.block}`,
                                customerInfo.road &&
                                  `طريق ${customerInfo.road}`,
                                customerInfo.home &&
                                  `منزل ${customerInfo.home}`,
                              ]
                                .filter(Boolean)
                                .join("، ")
                            : [
                                customerInfo.home &&
                                  `House ${customerInfo.home}`,
                                customerInfo.road &&
                                  `Road ${customerInfo.road}`,
                                customerInfo.block &&
                                  `Block ${customerInfo.block}`,
                                customerInfo.town,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Review */}
                  <div className="space-y-4 sm:space-y-5">
                    <h4 className="font-medium auto-text border-b border-gray-200 pb-3 text-base sm:text-lg">
                      {t("checkout.orderItems")}
                    </h4>
                    <div className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 auto-text text-sm italic">
                            {language === "ar"
                              ? "لا توجد عناصر في الطلب"
                              : "No items in order"}
                          </p>
                        </div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-start [dir=rtl]:flex-row-reverse gap-3 sm:gap-4 py-3 sm:py-4 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium auto-text leading-relaxed text-sm sm:text-base">
                                {item.productName}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 auto-text mt-1">
                                {item.variantName} ×{" "}
                                <span className="ltr-text">
                                  {item.quantity}
                                </span>
                              </p>
                            </div>
                            <div className="text-end auto-text min-w-0">
                              <p className="font-medium ltr-text text-sm sm:text-lg">
                                {currencySymbol}{" "}
                                {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Total Calculation - Enhanced Design */}
                  <div className="space-y-4 bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                    <h4 className="font-bold text-lg text-gray-900 auto-text mb-4 flex items-center gap-2 [dir=rtl]:flex-row-reverse">
                      <CreditCard className="h-5 w-5 text-primary" />
                      {t("checkout.orderTotal")}
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between [dir=rtl]:flex-row-reverse items-center py-2">
                        <span className="auto-text text-gray-700 text-base font-medium">
                          {t("checkout.subtotal")}:
                        </span>
                        <span className="ltr-text font-semibold text-lg text-gray-900">
                          {currencySymbol} {totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between [dir=rtl]:flex-row-reverse items-center py-2">
                        <span className="auto-text text-gray-700 text-base font-medium">
                          {t("checkout.deliveryFee")}:
                        </span>
                        <span className="ltr-text font-semibold text-lg text-gray-900">
                          {deliveryType === "delivery"
                            ? `${currencySymbol} ${deliveryFeeSetting.toFixed(2)}`
                            : `${currencySymbol} 0.00`}
                        </span>
                      </div>

                      <Separator className="my-3" />

                      <div className="bg-primary/10 rounded-xl p-4">
                        <div className="flex justify-between [dir=rtl]:flex-row-reverse items-center">
                          <span className="text-xl font-bold auto-text text-gray-900">
                            {t("checkout.total")}:
                          </span>
                          <span className="text-3xl font-bold text-primary ltr-text">
                            {currencySymbol}{" "}
                            {(
                              totalPrice +
                              (deliveryType === "delivery"
                                ? deliveryFeeSetting
                                : 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Navigation - Fixed at bottom */}
        <div className="border-t p-4 sm:p-6 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Back Button */}
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2 h-12 sm:h-14 px-4 sm:px-6 touch-manipulation"
                size="sm"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 rtl-flip" />
                <span className="hidden sm:inline auto-text">
                  {t("common.back")}
                </span>
              </Button>
            )}

            {/* Next/Submit Button */}
            <div className="flex-1">
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={step === 1 && !isStep1Valid()}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 h-12 sm:h-14 w-full touch-manipulation"
                  size="lg"
                >
                  <span className="auto-text">{t("common.next")}</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 rtl-flip" />
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!isFormValid() || isSubmitting}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 h-12 sm:h-14 w-full touch-manipulation"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="auto-text">
                    {isSubmitting
                      ? t("common.loading")
                      : t("checkout.placeOrder")}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
