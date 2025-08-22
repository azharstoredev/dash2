import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Truck, MapPin } from "lucide-react";

interface ImprovedOrderSummaryProps {
  deliveryType: "delivery" | "pickup";
  onPlaceOrder: () => void;
  isSubmitting: boolean;
  isFormValid: boolean;
}

export default function ImprovedOrderSummary({
  deliveryType,
  onPlaceOrder,
  isSubmitting,
  isFormValid,
}: ImprovedOrderSummaryProps) {
  const { t, language } = useLanguage();
  const { items, getTotalPrice } = useCart();
  const totalPrice = getTotalPrice();

  // Get delivery settings from localStorage
  const savedSettings = JSON.parse(
    localStorage.getItem("storeSettings") || "{}",
  );
  const deliveryFeeSetting = Number(savedSettings?.deliveryFee ?? 1.5);
  const freeDeliveryMinimum = Number(savedSettings?.freeDeliveryMinimum ?? 20);

  // Calculate delivery fee with free delivery threshold
  const deliveryFee =
    deliveryType === "delivery"
      ? totalPrice >= freeDeliveryMinimum
        ? 0
        : deliveryFeeSetting
      : 0;
  const finalTotal = totalPrice + deliveryFee;

  return (
    <Card className="sticky top-4 shadow-lg border-0">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-3 text-xl">
          <ShoppingCart className="w-6 h-6 text-primary" />
          {t("checkout.orderSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Order Items */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg text-gray-900">
              {t("checkout.orderItems")}
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {items.length}{" "}
              {items.length === 1 ? t("common.item") : t("common.items")}
            </Badge>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900 text-base auto-text">
                      {item.productName}
                    </h4>
                    {item.variantName && (
                      <p className="text-sm text-primary font-medium auto-text">
                        {item.variantName}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="auto-text">
                        {t("store.quantity")}: {item.quantity}
                      </span>
                      <span className="ltr-text">
                        {formatPrice(item.price, language)}{" "}
                        {language === "ar" ? "للقطعة" : "each"}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-lg font-bold text-primary ltr-text">
                      {formatPrice(item.price * item.quantity, language)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Delivery Information */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            {deliveryType === "delivery" ? (
              <Truck className="w-5 h-5 text-blue-600" />
            ) : (
              <MapPin className="w-5 h-5 text-blue-600" />
            )}
            <h3 className="font-semibold text-blue-900">
              {deliveryType === "delivery"
                ? t("checkout.delivery")
                : t("checkout.pickup")}
            </h3>
            {deliveryType === "pickup" && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 ml-auto"
              >
                {language === "ar" ? "مجاني" : "Free"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-blue-700">
            {deliveryType === "delivery"
              ? language === "ar"
                ? "سيتم التوصيل إلى عنوانك"
                : "We'll deliver to your address"
              : language === "ar"
                ? "الاستلام من المتجر"
                : "Pick up from our store"}
          </p>
        </div>

        <Separator className="my-6" />

        {/* Order Totals */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="auto-text font-medium text-gray-700">
              {t("checkout.subtotal")}:
            </span>
            <span className="ltr-text font-semibold text-gray-900">
              {formatPrice(totalPrice, language)}
            </span>
          </div>

          <div className="flex justify-between items-center text-lg">
            <span className="auto-text font-medium text-gray-700">
              {t("checkout.deliveryFee")}:
            </span>
            <span className="ltr-text font-semibold text-gray-900">
              {deliveryFee === 0
                ? language === "ar"
                  ? "مجان"
                  : "Free"
                : formatPrice(deliveryFee, language)}
            </span>
          </div>

          {/* Free delivery hint */}
          {deliveryType === "delivery" && (
            <div className="text-center mb-2">
              {deliveryFee === 0 && totalPrice >= freeDeliveryMinimum ? (
                <p className="text-sm text-green-600 font-medium auto-text">
                  {language === "ar"
                    ? "🎉 تأهلت للتوصيل المجاني!"
                    : "🎉 You qualified for free delivery!"}
                </p>
              ) : deliveryType === "delivery" &&
                totalPrice < freeDeliveryMinimum ? (
                <p className="text-sm text-gray-500 auto-text">
                  {language === "ar"
                    ? `أضف ${formatPrice(freeDeliveryMinimum - totalPrice, language)} للحصول على توصيل مجاني`
                    : `Add ${formatPrice(freeDeliveryMinimum - totalPrice, language)} more for free delivery`}
                </p>
              ) : null}
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/20">
            <span className="auto-text text-xl font-bold text-gray-900">
              {t("checkout.total")}:
            </span>
            <span className="ltr-text text-2xl font-bold text-primary">
              {formatPrice(finalTotal, language)}
            </span>
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={onPlaceOrder}
          disabled={!isFormValid || isSubmitting}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {t("common.loading")}
            </div>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              {t("checkout.placeOrder")} • {formatPrice(finalTotal, language)}
            </>
          )}
        </Button>

        {/* Order Note */}
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>
            {language === "ar"
              ? "سيتم التواصل معك خلال 2-4 ساعات لتأكيد الطلب"
              : "We'll contact you within 2-4 hours to confirm your order"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
