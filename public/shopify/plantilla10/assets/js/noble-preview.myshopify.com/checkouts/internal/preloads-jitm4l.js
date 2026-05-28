
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.iRHCMwIP.js","/cdn/shopifycloud/checkout-web/assets/c1/app.2mLnAVIC.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor.Bhne0xMB.js","/cdn/shopifycloud/checkout-web/assets/c1/browser.pk72hu_8.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-is-shop-pay-active.B5fqDky6.js","/cdn/shopifycloud/checkout-web/assets/c1/types-UnauthenticatedErrorModalPayload.9ZIrvmBl.js","/cdn/shopifycloud/checkout-web/assets/c1/images-payment-icon.C_9SDN8i.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shop-discount-offer.Cx7-8LtD.js","/cdn/shopifycloud/checkout-web/assets/c1/NotFound.D_igV_EY.js","/cdn/shopifycloud/checkout-web/assets/c1/context-utilities.B-mVhIJ4.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-unactionable-errors.D2jGtLL7.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-installmentsNotSupportedForAddress.CW1XVW-g.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayCheckoutGqlVersion.BBtbmH18.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-ShopPayCheckoutSessionQuery.BejGhK4C.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors.DYTwbEw2.js","/cdn/shopifycloud/checkout-web/assets/c1/types-index.Ba8x6j49.js","/cdn/shopifycloud/checkout-web/assets/c1/images-flag-icon.C_eXYJRt.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en.BViO0sUO.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage.CKMyhouM.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout.wfEbTSyQ.js","/cdn/shopifycloud/checkout-web/assets/c1/remember-me-hooks.CuLt8AD1.js","/cdn/shopifycloud/checkout-web/assets/c1/OffsitePaymentFailed.C5DDl47H.js","/cdn/shopifycloud/checkout-web/assets/c1/NoAddressLocationFullDetour.Dp23rF7k.js","/cdn/shopifycloud/checkout-web/assets/c1/SplitDeliveryMerchandiseContainer.ma2cY6sL.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName.BAk-2de4.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink.Cb7Eu5v1.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletsSandbox-WalletSandbox.B5Dh2mIe.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUnauthenticatedErrorModal.BYPM-M9c.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl.DY-MTH4A.js","/cdn/shopifycloud/checkout-web/assets/c1/GooglePayButton-index.iIPBteis.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer.BnX_sXM1.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummaryLine.BsbjdysF.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview.ClV7hLgj.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks.D8EVu4Bl.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalizationExtensionField.CZMoZKdZ.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayPaymentRequiredMethod.Q6EHMiw-.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress.DQPC143Z.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletLogo.DHhFJQVB.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage.DpnXpsnc.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowShopPayOptin.DKqxcDO3.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowCreateMoreAccountsGdprTreatment.gm-3ROCV.js","/cdn/shopifycloud/checkout-web/assets/c1/Section.DqLpKiWT.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary.CPIS4w_D.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useOnePageFormSubmit.CFThNNNT.js","/cdn/shopifycloud/checkout-web/assets/c1/PayPalOverCaptureInfoBanner.75wt8IsH.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-get-negotiation-input.CU9x6hsq.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-cash-constants.xhPNe3x9.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner.BtyDLsCK.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList.BKgUSbjx.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions.BXv02O8L.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.Ctkq-odP.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.CTZbDLyV.js","/cdn/shopifycloud/checkout-web/assets/c1/extension-targets-shipping-options.BVwdjCJE.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.Zcj3nVej.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.B7cfgUFJ.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSubscribeMessenger.CMLZf62K.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.DQm2XSFQ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/is-shop-pay-active.Bz45BrAn.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/UnauthenticatedErrorModalPayload.D1hsMvAK.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/index.DkaAD89C.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.Du-yF2xV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SplitDeliveryMerchandiseContainer.CRDql5Io.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/LocalizationExtensionField.DSgaD89Q.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.CqVkJv9Z.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useOnePageFormSubmit.CFcgLtAD.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/WalletLogo.DSXJIrkc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ChangeCompanyLocationLink.uqpm88mq.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.BrcQzLuH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DutyOptions.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PayPalOverCaptureInfoBanner.CuS5ve3d.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/NoAddressLocationFullDetour.CpFaJIpx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/WalletSandbox.CnR7qNLY.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.BSemv9tH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StackedMerchandisePreview.D6OuIVjc.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  