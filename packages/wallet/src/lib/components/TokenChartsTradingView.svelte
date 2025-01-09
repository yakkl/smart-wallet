<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { symbol = 'COINBASE:ETHUSD' } = $props();
  let widgetContainer: HTMLDivElement | null = null;

  const initializeWidget = () => {
    if (!widgetContainer) return;

    // Clear any existing widget
    widgetContainer.innerHTML = '';

    // Dynamically add the TradingView script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = '../../js/embed-widget-mini-symbol-overview.js'; // Correct widget file
    script.innerHTML = JSON.stringify({
      symbol, // Dynamically set the symbol
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '1D',
      colorTheme: 'light',
      trendLineColor: 'rgba(152, 0, 255, 1)',
      underLineColor: 'rgba(152, 0, 255, 1)',
      underLineBottomColor: 'rgba(0, 255, 255, 0)',
      isTransparent: false,
      autosize: true,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
    });

    widgetContainer.appendChild(script);
  };

  onMount(() => {
    initializeWidget();
  });

  onDestroy(() => {
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
    }
  });
</script>

<section id="advanced-chart">
  <div class="tradingview-widget-container">
    <div bind:this={widgetContainer} class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright">
      <a href={import.meta.env.VITE_TRADING_VIEW_LINK} rel="noopener nofollow" target="_blank">
        <span class="blue-text">Track all markets on TradingView</span>
      </a>
    </div>
  </div>
</section>

<style>
  .tradingview-widget-container {
    width: 100%;
    height: 100%;
  }
</style>
