<script>
  const URL = import.meta.env.VITE_TRADING_VIEW_LINK;
</script>

<section id="top-stories">
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright"><a href="{URL}" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div>
    <script type="text/javascript" src="../../js/embed-widget-timeline.js" async>
      {
      "feedMode": "market",
      "market": "crypto",
      "isTransparent": false,
      "displayMode": "adaptive",
      "width": "392px",
      "height": "283px",
      "colorTheme": "light",
      "locale": "en"
      }
    </script>
  </div>
</section>
