<script lang="ts">
  const URL = import.meta.env.VITE_TRADING_VIEW_LINK;
</script>

<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <div class="tradingview-widget-copyright"><a href="{URL}" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets</span></a></div>
  <script type="text/javascript" src="../../js/embed-widget-mini-symbol-overview.js" async>
  {
  "symbol": "COINBASE:ETHUSD",
  "width": "100%",
  "height": "100%",
  "locale": "en",
  "dateRange": "12M",
  "colorTheme": "dark",
  "isTransparent": false,
  "autosize": true,
  "largeChartUrl": ""
  }
  </script>
</div>
